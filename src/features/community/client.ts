import { useSyncExternalStore } from "react";
export type Account = { token: string; userId: string; expiresAt: number };
let account: Account | null = null;
let expiry: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export function setAccount(next: Account | null) {
  clearTimeout(expiry);
  account = next;
  if (next)
    expiry = setTimeout(
      () => setAccount(null),
      Math.max(0, next.expiresAt - Date.now()),
    );
  listeners.forEach((fn) => fn());
}
export function useAccount() {
  return useSyncExternalStore(subscribe, () => account);
}
window.addEventListener("pagehide", () => setAccount(null));
export function accountToken() {
  if (account && account.expiresAt <= Date.now()) setAccount(null);
  return account?.token;
}
export async function community<T>(
  action: string,
  args: unknown = {},
  signal?: AbortSignal,
): Promise<T> {
  const token = accountToken();
  const response = await fetch("/api/community", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(
      action === "send_code" || action === "verify_code"
        ? { action, ...(args as object) }
        : { action, args },
    ),
  });
  if (response.status === 401) setAccount(null);
  const data = await response.json().catch(() => ({ error: "request" }));
  if (!response.ok) throw new Error(data.error ?? "request");
  return data;
}
export type Capabilities = { available: boolean; ai: boolean };
export async function capabilities(signal: AbortSignal): Promise<Capabilities> {
  try {
    const r = await fetch("/api/community", { signal });
    if (!r.ok) throw new Error();
    const d = await r.json();
    return { available: d.available === true, ai: d.ai === true };
  } catch {
    return { available: false, ai: false };
  }
}
export type Application = {
  user_id: string;
  display_name: string;
  expertise: string;
  languages: string;
  experience: string;
  status: "pending" | "approved" | "declined" | "revoked";
  reviewed_at: string | null;
};
export type Volunteer = {
  id: string;
  name: string;
  expertise: string;
  languages: string;
  verifiedAt: string;
};
export type SupportRequest = {
  id: string;
  owner_id: string;
  volunteer_id: string;
  volunteerName: string;
  summary: string;
  status: "open" | "closed" | "reported";
  created_at: string;
};
export type Message = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
};
export type Snapshot = {
  admin: boolean;
  application: Application | null;
  applications: Application[];
  directory: Volunteer[];
  requests: SupportRequest[];
  reports: { id: string; volunteer_id: string; report_reason: string }[];
};
