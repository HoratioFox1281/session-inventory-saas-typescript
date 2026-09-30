import { InfraiClient } from "./infrai_client.ts";
import { onboardTenant, signOutOtherSessions } from "./session_inventory.ts";
import { z } from "zod";

const tenantOnboardingBody = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(1),
  ownerName: z.string().min(1)
});

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("Set INFRAI_API_KEY before running the example.");

const client = new InfraiClient(apiKey);
const tenant = await onboardTenant(client, tenantOnboardingBody.parse({
  tenantId: "acme-demo",
  name: "Acme Demo",
  ownerEmail: "chenhua@changba.com",
  ownerPassword: "change-this-password",
  ownerName: "Acme Owner"
}));
const removed = await signOutOtherSessions(client, tenant.ownerUserId, process.env.CURRENT_SESSION_ID ?? "current-session");
console.log(JSON.stringify({ tenant, signedOutOtherSessions: removed }, null, 2));
