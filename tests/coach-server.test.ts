import { describe, expect, test, vi } from "vitest";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import { coachHandler } from "../server/coach";
import { communityHandler } from "../server/community";
import { coachInput, coachAnswer } from "../src/features/resolve/coachCore";
const input = {
  taskId: "devices",
  question: "Why might one laptop appear twice?",
  locale: "en",
};
const answer = {
  explanation: "One device may have multiple sessions.",
  nextStep: "Read the entries without signing anything out.",
  why: "A name alone does not identify the person.",
  checkQuestion: "Does the entry say signed out?",
  sourceIds: ["devices"],
};
class Reply extends EventEmitter {
  status = 0;
  output = "";
  writableEnded = false;
  destroyed = false;
  writeHead(s: number) {
    this.status = s;
    return this;
  }
  write(s: string) {
    this.output += s;
    return true;
  }
  end(s = "") {
    this.output += s;
    this.writableEnded = true;
  }
}
async function invoke(
  handler: ReturnType<typeof coachHandler>,
  body: unknown = input,
  path = "/api/coach",
  origin = "https://untangle.test",
  token = "test-token",
) {
  const req = Readable.from([JSON.stringify(body)]) as IncomingMessage;
  req.method = "POST";
  req.url = path;
  req.headers = {
    host: "untangle.test",
    origin,
    "content-type": "application/json",
    authorization: `Bearer ${token}`,
  };
  const res = new Reply();
  await handler(req, res as unknown as ServerResponse, () => {});
  return res;
}
const json = (value: unknown) =>
  new Response(JSON.stringify(value), {
    headers: { "Content-Type": "application/json" },
  });
function fixture(
  output: unknown = answer,
  call = { name: "read_guide", arguments: '{"id":"devices"}' },
) {
  let modelCalls = 0;
  return vi.fn<typeof fetch>(async (url) => {
    if (String(url).endsWith("/user"))
      return json({
        id: "verified-user",
        email_confirmed_at: "2026-10-04",
        is_anonymous: false,
      });
    if (String(url).includes("consume_ai_budget")) return json(true);
    modelCalls++;
    return json({
      status: "completed",
      output:
        modelCalls === 1
          ? [{ type: "function_call", call_id: "call-1", ...call }]
          : [
              {
                type: "message",
                content: [
                  { type: "output_text", text: JSON.stringify(output) },
                ],
              },
            ],
    });
  });
}
const config = {
  enabled: true,
  aiEnabled: true,
  supabaseUrl: "https://test.supabase.co",
  supabaseKey: "test-public-key",
  apiKey: "test-secret-key",
  model: "test-model",
};
describe("controlled guide agent", () => {
  test("requires a valid known topic, bounded question, and no extra private fields", () => {
    expect(coachInput({ ...input, otherNotes: "not transmitted" })).toEqual(
      input,
    );
    for (const change of [
      { taskId: "invented" },
      { locale: "xx" },
      { question: "x".repeat(501) },
      { question: "email@example.com" },
      { question: "https://my-private.example" },
    ])
      expect(() => coachInput({ ...input, ...change })).toThrow();
    expect(() =>
      coachAnswer({ ...answer, sourceIds: ["maps"] }, ["devices"]),
    ).toThrow();
    expect(() =>
      coachAnswer({ ...answer, nextStep: "Open https://invented.test" }, [
        "devices",
      ]),
    ).toThrow();
  });
  test("rejects origin, missing configuration and unauthenticated access before paid calls", async () => {
    const fetcher = fixture();
    expect(
      (
        await invoke(
          coachHandler({ ...config, fetcher }),
          input,
          undefined,
          "https://elsewhere.test",
        )
      ).status,
    ).toBe(403);
    expect((await invoke(coachHandler({}), input)).status).toBe(503);
    expect(
      (
        await invoke(
          coachHandler({ ...config, fetcher }),
          input,
          undefined,
          undefined,
          "",
        )
      ).status,
    ).toBe(401);
    expect(fetcher).not.toHaveBeenCalled();
  });
  test("executes a bounded read-only tool loop and keeps consented fields only", async () => {
    const fetcher = fixture(),
      res = await invoke(coachHandler({ ...config, fetcher }), {
        ...input,
        privateNote: "DO NOT SEND",
      });
    expect(res.status).toBe(200);
    const events = res.output
      .trim()
      .split("\n")
      .map((s) => JSON.parse(s));
    expect(events.map((e) => e.stage)).toEqual([
      "reading",
      "tool",
      "checking",
      "ready",
    ]);
    expect(events.at(-1).answer).toEqual(answer);
    const model = fetcher.mock.calls.filter((c) =>
      String(c[0]).includes("openai"),
    );
    expect(model).toHaveLength(2);
    const first = JSON.parse(model[0][1]!.body as string),
      second = JSON.parse(model[1][1]!.body as string);
    expect(first.store).toBe(false);
    expect(first.tools.map((t: { name: string }) => t.name)).toEqual([
      "read_guide",
    ]);
    expect(JSON.stringify(first)).not.toContain("DO NOT SEND");
    expect(
      second.input.some(
        (i: { type: string }) => i.type === "function_call_output",
      ),
    ).toBe(true);
    expect(res.output).not.toContain(config.apiKey);
  });
  test("denies tools outside the allowed guide scope and references that were never read", async () => {
    for (const fetcher of [
      fixture(answer, { name: "change_password", arguments: "{}" }),
      fixture(answer, { name: "read_guide", arguments: '{"id":"maps"}' }),
      fixture({ ...answer, sourceIds: ["recovery"] }),
    ]) {
      const res = await invoke(coachHandler({ ...config, fetcher }));
      expect(res.output).not.toContain('"stage":"ready"');
      expect(res.output).toContain('"stage":"error"');
    }
  });
  test("stops before inference when the durable budget rejects a request", async () => {
    const fetcher = vi.fn<typeof fetch>(async (url) =>
      String(url).endsWith("/user")
        ? json({ id: "verified", email_confirmed_at: "2026-10-04" })
        : new Response("", { status: 429 }),
    );
    const res = await invoke(coachHandler({ ...config, fetcher }));
    expect(res.status).toBe(400);
    expect(
      fetcher.mock.calls.some((c) => String(c[0]).includes("openai")),
    ).toBe(false);
  });
});
describe("account service boundary", () => {
  test("does not proxy arbitrary APIs or return provider errors/secrets", async () => {
    const fetcher = fixture(),
      handler = communityHandler({ ...config, fetcher });
    const res = await invoke(
      handler,
      { action: "admin_delete_user", args: {} },
      "/api/community",
    );
    expect(res.status).toBe(400);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(
      (
        await invoke(
          handler,
          { action: "community_snapshot", args: {} },
          "/api/community",
          "https://evil.test",
        )
      ).status,
    ).toBe(403);
  });
  test("returns an expiring access token, never a refresh token or user metadata", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      json({
        access_token: "test-access",
        refresh_token: "never-return",
        expires_in: 3600,
        user: {
          id: "test-user",
          email_confirmed_at: "2026-10-04",
          email: "private@example.test",
        },
      }),
    );
    const res = await invoke(
      communityHandler({ ...config, fetcher }),
      { action: "verify_code", email: "private@example.test", code: "123456" },
      "/api/community",
    );
    expect(res.status).toBe(200);
    expect(JSON.parse(res.output)).toMatchObject({
      token: "test-access",
      userId: "test-user",
    });
    expect(res.output).not.toContain("never-return");
    expect(res.output).not.toContain("private@example");
  });
  test("expired or unverified tokens cannot reach application or message RPCs", async () => {
    for (const reply of [
      new Response("", { status: 401 }),
      json({ id: "user" }),
    ]) {
      const fetcher = vi.fn<typeof fetch>().mockResolvedValue(reply);
      const res = await invoke(
        communityHandler({ ...config, fetcher }),
        { action: "reply_support", args: {} },
        "/api/community",
      );
      expect(res.status).toBe(401);
      expect(fetcher).toHaveBeenCalledTimes(1);
    }
  });
});
