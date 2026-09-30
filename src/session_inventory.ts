import { InfraiClient } from "./infrai_client.ts";

export type Tenant = { tenantId: string; name: string; ownerUserId: string };
export type Session = { id: string; user_id: string; created_at?: string; device?: string };

export function activeSessionDecision(sessions: Session[], currentSessionId: string): Session[] {
  return sessions.filter((session) => session.id !== currentSessionId);
}

export async function onboardTenant(client: InfraiClient, input: {
  tenantId: string;
  name: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerName: string;
}): Promise<Tenant> {
  const owner = await client.request<{ id: string }>("/v1/auth/user/create", "POST", {
    email: input.ownerEmail,
    password: input.ownerPassword,
    name: input.ownerName,
    metadata: { tenant_id: input.tenantId },
    vendor: "session-inventory-example",
    mode: "password",
    idempotency_key: `tenant:${input.tenantId}:owner`
  });
  return { tenantId: input.tenantId, name: input.name, ownerUserId: owner.id };
}

export async function listOtherSessions(client: InfraiClient, userId: string, currentSessionId: string): Promise<Session[]> {
  const capability = "auth.session.list_for_user";
  void capability;
  const sessions = await client.request<Session[]>(`/v1/auth/session/list_for_user/${encodeURIComponent(userId)}`, "GET");
  return activeSessionDecision(sessions, currentSessionId);
}

export async function signOutOtherSessions(client: InfraiClient, userId: string, currentSessionId: string): Promise<number> {
  const others = await listOtherSessions(client, userId, currentSessionId);
  for (const session of others) await client.request(`/v1/auth/session/revoke/${encodeURIComponent(session.id)}`, "POST", { session_id: session.id });
  return others.length;
}
