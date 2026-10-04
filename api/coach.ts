import { coachHandler } from "../server/coach.ts";
import { sendJSON } from "../server/community.ts";
import { servicesConfig } from "../server/config.ts";
import type { IncomingMessage, ServerResponse } from "node:http";
export default function handler(req: IncomingMessage, res: ServerResponse) {
  return coachHandler(servicesConfig())(req, res, () =>
    sendJSON(res, 404, { error: "not_found" }),
  );
}
