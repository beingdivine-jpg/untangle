import { beforeAll, afterAll, describe, expect, test } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const db = new PGlite();
const owner = "00000000-0000-4000-8000-000000000001",
  volunteer = "00000000-0000-4000-8000-000000000002",
  stranger = "00000000-0000-4000-8000-000000000003",
  admin = "00000000-0000-4000-8000-000000000004";
async function as<T>(id: string, sql: string, params: unknown[] = []) {
  await db.exec(
    `reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id}',false)`,
  );
  return (await db.query<T>(sql, params)).rows;
}
let request: string;
beforeAll(async () => {
  await db.exec(
    `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;insert into auth.users values('${owner}'),('${volunteer}'),('${stranger}'),('${admin}');`,
  );
  await db.exec(
    readFileSync("supabase/migrations/202610040001_support.sql", "utf8"),
  );
  await db.exec(`insert into untangle_private.admins values('${admin}')`);
}, 20000);
afterAll(() => db.close());
describe("PostgreSQL support permissions and approval lifecycle", () => {
  test("anonymous users cannot read messages or submit applications", async () => {
    await db.exec("reset role;set role anon");
    await expect(
      db.query("select * from public.support_messages"),
    ).rejects.toThrow(/permission denied/);
    await expect(
      db.query(
        "select public.apply_volunteer('Alex','Account guidance','en','Three years of digital support experience',true,true)",
      ),
    ).rejects.toThrow(/permission denied/);
  });
  test("application requires consent and is pending; direct self-approval is impossible", async () => {
    await expect(
      as(
        volunteer,
        "select public.apply_volunteer('Alex','Account guidance','en','Three years of digital support experience',true,false)",
      ),
    ).rejects.toThrow();
    await as(
      volunteer,
      "select public.apply_volunteer('Alex','Account guidance','en','Three years of digital support experience',true,true)",
    );
    expect(
      (
        await as<{ status: string }>(
          volunteer,
          "select status from public.volunteer_applications",
        )
      )[0].status,
    ).toBe("pending");
    await expect(
      as(
        volunteer,
        "update public.volunteer_applications set status='approved'",
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(
      as(
        volunteer,
        "select public.review_volunteer($1,'approved','Identity and relevant experience checked',true,true,true)",
        [volunteer],
      ),
    ).rejects.toThrow(/Administrator/);
    const snapshot = (
      await as<{ community_snapshot: { directory: unknown[] } }>(
        owner,
        "select public.community_snapshot()",
      )
    )[0].community_snapshot;
    expect(snapshot.directory).toEqual([]);
    await expect(
      as(
        owner,
        "select public.request_support($1,'Can you help me understand my device list?',true)",
        [volunteer],
      ),
    ).rejects.toThrow(/no longer available/);
  });
  test("approval requires all checks; only an admin can approve and cannot approve themself", async () => {
    await expect(
      as(
        admin,
        "select public.review_volunteer($1,'approved','Identity and relevant experience checked',true,false,true)",
        [volunteer],
      ),
    ).rejects.toThrow(/every verification/);
    await expect(
      as(
        admin,
        "select public.review_volunteer($1,'approved','Identity and relevant experience checked',true,true,true)",
        [admin],
      ),
    ).rejects.toThrow(/different administrator/);
    await as(
      admin,
      "select public.review_volunteer($1,'approved','Identity and relevant experience checked',true,true,true)",
      [volunteer],
    );
    const s = (
      await as<{
        community_snapshot: { directory: Record<string, unknown>[] };
      }>(owner, "select public.community_snapshot()")
    )[0].community_snapshot;
    expect(s.directory).toHaveLength(1);
    expect(s.directory[0].experience).toBeUndefined();
    expect(s.directory[0].email).toBeUndefined();
  });
  test("request reaches only its owner and approved selected volunteer", async () => {
    await expect(
      as(
        owner,
        "select public.request_support($1,'Can you help me understand my device list?',false)",
        [volunteer],
      ),
    ).rejects.toThrow();
    request = (
      await as<{ request_support: string }>(
        owner,
        "select public.request_support($1,'Can you help me understand my device list?',true)",
        [volunteer],
      )
    )[0].request_support;
    expect(
      await as(owner, "select * from public.support_requests"),
    ).toHaveLength(1);
    expect(
      await as(volunteer, "select * from public.support_requests"),
    ).toHaveLength(1);
    expect(
      await as(stranger, "select * from public.support_requests"),
    ).toHaveLength(0);
    expect(
      await as(admin, "select * from public.support_requests"),
    ).toHaveLength(0);
    expect(
      await as(stranger, "select * from public.volunteer_applications"),
    ).toHaveLength(0);
    await expect(
      as(stranger, "select public.read_support($1)", [request]),
    ).rejects.toThrow(/unavailable/);
    await expect(
      as(
        stranger,
        "select public.reply_support($1,'I should not be able to send this')",
        [request],
      ),
    ).rejects.toThrow(/unavailable/);
    await as(
      owner,
      "select public.reply_support($1,'I cannot recognise one laptop')",
      [request],
    );
    await as(
      volunteer,
      "select public.reply_support($1,'Let us look at what the guide can tell us')",
      [request],
    );
    expect(
      await as(owner, "select * from public.support_messages"),
    ).toHaveLength(2);
    expect(
      await as(stranger, "select * from public.support_messages"),
    ).toHaveLength(0);
  });
  test("revoking a volunteer immediately removes directory, read and reply access", async () => {
    await as(
      admin,
      "select public.review_volunteer($1,'revoked','Approval withdrawn while a concern is reviewed',false,false,false)",
      [volunteer],
    );
    expect(
      await as(volunteer, "select * from public.support_messages"),
    ).toHaveLength(0);
    await expect(
      as(volunteer, "select public.read_support($1)", [request]),
    ).rejects.toThrow();
    await expect(
      as(
        volunteer,
        "select public.reply_support($1,'This must not reach the user')",
        [request],
      ),
    ).rejects.toThrow();
    expect(
      await as(owner, "select * from public.support_messages"),
    ).toHaveLength(2);
  });
  test("reporting blocks the volunteer; unrelated admins cannot read personal messages", async () => {
    await as(
      admin,
      "select public.review_volunteer($1,'approved','New independent verification completed',true,true,true)",
      [volunteer],
    );
    await as(
      owner,
      "select public.manage_support($1,'report','The volunteer asked for a password')",
      [request],
    );
    expect(
      await as(volunteer, "select * from public.support_requests"),
    ).toHaveLength(0);
    const s = (
      await as<{ community_snapshot: { reports: unknown[] } }>(
        admin,
        "select public.community_snapshot()",
      )
    )[0].community_snapshot;
    expect(s.reports).toHaveLength(1);
    expect(
      await as(admin, "select * from public.support_messages"),
    ).toHaveLength(0);
  });
  test("only owner can delete and deletion removes messages", async () => {
    await expect(
      as(stranger, "select public.manage_support($1,'delete','')", [request]),
    ).rejects.toThrow();
    await as(owner, "select public.manage_support($1,'delete','')", [request]);
    expect(
      await as(owner, "select * from public.support_messages"),
    ).toHaveLength(0);
    expect(
      await as(owner, "select * from public.support_requests"),
    ).toHaveLength(0);
  });
  test("server budget survives requests and cannot be reset by users", async () => {
    for (let i = 0; i < 10; i++)
      await as(owner, "select public.consume_ai_budget()");
    await expect(
      as(owner, "select public.consume_ai_budget()"),
    ).rejects.toThrow(/Daily account limit/);
    await expect(
      as(owner, "delete from untangle_private.ai_usage"),
    ).rejects.toThrow(/permission denied/);
    await as(stranger, "select public.consume_ai_budget()");
  });
});
