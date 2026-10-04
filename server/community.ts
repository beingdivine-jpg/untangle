import type { IncomingMessage, ServerResponse } from "node:http";
export type ServicesConfig = {
  enabled?: boolean;
  aiEnabled?: boolean;
  supabaseUrl?: string;
  supabaseKey?: string;
  apiKey?: string;
  model?: string;
  fetcher?: typeof fetch;
};
export const sendJSON = (
  res: ServerResponse,
  status: number,
  data: unknown,
) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(JSON.stringify(data));
};
export const configured = (config: ServicesConfig) =>
  Boolean(config.enabled && config.supabaseUrl && config.supabaseKey);
export function sameOrigin(req: IncomingMessage) {
  const protocol = /^(localhost|127\.0\.0\.1):\d+$/.test(req.headers.host ?? "")
    ? "http"
    : "https";
  return (
    req.headers.origin === `${protocol}://${req.headers.host}` &&
    req.headers["content-type"]?.startsWith("application/json")
  );
}
export async function readBody(req: IncomingMessage) {
  const parsed = (req as IncomingMessage & { body?: unknown }).body;
  if (parsed !== undefined) {
    if (Buffer.byteLength(JSON.stringify(parsed)) > 12000)
      throw new Error("size");
    return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
  }
  let body = "";
  for await (const chunk of req) {
    body += chunk.toString();
    if (Buffer.byteLength(body) > 12000) throw new Error("size");
  }
  return JSON.parse(body);
}
export async function database(
  config: ServicesConfig,
  path: string,
  token?: string,
  body?: unknown,
  signal?: AbortSignal,
) {
  const response = await (config.fetcher ?? fetch)(
    `${config.supabaseUrl}${path}`,
    {
      method: body === undefined ? "GET" : "POST",
      signal: signal ?? AbortSignal.timeout(15000),
      headers: {
        apikey: config.supabaseKey!,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
  );
  if (!response.ok)
    throw new Error(response.status === 429 ? "rate" : "service");
  return response.status === 204 ? null : response.json();
}
export async function authenticated(
  config: ServicesConfig,
  req: IncomingMessage,
  signal?: AbortSignal,
) {
  const token = req.headers.authorization?.match(
    /^Bearer ([A-Za-z0-9_.-]+)$/,
  )?.[1];
  if (!token || token.length > 6000) throw new Error("auth");
  const user = await database(
    config,
    "/auth/v1/user",
    token,
    undefined,
    signal,
  ).catch(() => {
    throw new Error("auth");
  });
  if (!user?.id || !user.email_confirmed_at || user.is_anonymous)
    throw new Error("auth");
  return { token, user };
}
const rpcNames = new Set([
  "community_snapshot",
  "apply_volunteer",
  "review_volunteer",
  "request_support",
  "read_support",
  "reply_support",
  "manage_support",
]);
export function communityHandler(config: ServicesConfig) {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    if (req.url?.split("?")[0] !== "/api/community") return next();
    if (req.method === "GET")
      return sendJSON(res, 200, {
        available: configured(config),
        ai:
          configured(config) &&
          Boolean(config.aiEnabled && config.apiKey && config.model),
      });
    if (req.method !== "POST" || !sameOrigin(req))
      return sendJSON(res, 403, { error: "origin" });
    if (!configured(config))
      return sendJSON(res, 503, { error: "unavailable" });
    try {
      const input = await readBody(req);
      if (input?.action === "send_code") {
        if (
          typeof input.email !== "string" ||
          input.email.length > 254 ||
          !/^\S+@\S+\.\S+$/.test(input.email)
        )
          return sendJSON(res, 400, { error: "input" });
        await database(config, "/auth/v1/otp", undefined, {
          email: input.email,
          create_user: true,
        });
        return sendJSON(res, 200, { sent: true });
      }
      if (input?.action === "verify_code") {
        if (
          typeof input.email !== "string" ||
          input.email.length > 254 ||
          typeof input.code !== "string" ||
          !/^\d{6,10}$/.test(input.code)
        )
          return sendJSON(res, 400, { error: "input" });
        const data = await database(config, "/auth/v1/verify", undefined, {
          email: input.email,
          token: input.code,
          type: "email",
        });
        if (
          !data.access_token ||
          !data.user?.id ||
          !data.user.email_confirmed_at
        )
          return sendJSON(res, 401, { error: "auth" });
        // No refresh token is returned or persisted: a closed tab signs out locally.
        return sendJSON(res, 200, {
          token: data.access_token,
          expiresAt: Date.now() + data.expires_in * 1000,
          userId: data.user.id,
        });
      }
      const { token } = await authenticated(config, req);
      if (input?.action === "sign_out") {
        await database(config, "/auth/v1/logout?scope=local", token, {});
        return sendJSON(res, 200, { ok: true });
      }
      if (
        !rpcNames.has(input?.action) ||
        !input.args ||
        typeof input.args !== "object" ||
        Array.isArray(input.args)
      )
        return sendJSON(res, 400, { error: "input" });
      return sendJSON(
        res,
        200,
        await database(
          config,
          `/rest/v1/rpc/${input.action}`,
          token,
          input.args,
        ),
      );
    } catch (error) {
      const kind = error instanceof Error ? error.message : "";
      return sendJSON(
        res,
        kind === "auth" ? 401 : kind === "rate" ? 429 : 400,
        {
          error:
            kind === "auth" ? "auth" : kind === "rate" ? "rate" : "request",
        },
      );
    }
  };
}
