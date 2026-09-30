import assert from "node:assert/strict";
import { InfraiClient } from "./infrai_client.ts";
import { activeSessionDecision, signOutOtherSessions } from "./session_inventory.ts";

const sessions = [
  { id: "phone", user_id: "u1", device: "phone" },
  { id: "laptop", user_id: "u1", device: "laptop" },
  { id: "tablet", user_id: "u1", device: "tablet" }
];
assert.deepEqual(activeSessionDecision(sessions, "laptop").map((session) => session.id), ["phone", "tablet"]);
console.log("activeSessionDecision keeps the current session and selects the other devices");

const requests: { path: string; method: string; body?: Record<string, unknown> }[] = [];
const client = new InfraiClient("test-key");
client.request = async function <T>(path: string, method: "GET" | "POST" | "DELETE", body?: Record<string, unknown>): Promise<T> {
  requests.push({ path, method, body });
  return (method === "GET" ? sessions : { ok: true }) as T;
};
assert.equal(await signOutOtherSessions(client, "u1", "laptop"), 2);
assert.deepEqual(requests.slice(1), [
  { path: "/v1/auth/session/revoke/phone", method: "POST", body: { session_id: "phone" } },
  { path: "/v1/auth/session/revoke/tablet", method: "POST", body: { session_id: "tablet" } }
]);
