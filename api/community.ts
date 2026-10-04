import { communityHandler, sendJSON } from "../server/community.js";
import { servicesConfig } from "../server/config.js";
import type { IncomingMessage, ServerResponse } from "node:http";
export default function handler(req: IncomingMessage, res: ServerResponse) {
  return communityHandler(servicesConfig())(req, res, () =>
    sendJSON(res, 404, { error: "not_found" }),
  );
}
