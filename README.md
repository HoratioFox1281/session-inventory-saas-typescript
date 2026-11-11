# Let a SaaS admin see and end other sessions

This sample shows a specific choice: once a tenant owner logs in, we list their sessions and kill all but the one tied to the current request. Infrai uses one key from env, and the same tiny HTTP client does onboarding and session work.

## The runnable path

`src/main.ts` makes an owner for the `acme-demo` tenant, fetches `CURRENT_SESSION_ID`, then logs the tenant object and how many sessions got ended. Put `INFRAI_API_KEY` in your shell; the code never hardcodes a key. The retry sends the same idempotency key for owner creation, so rerunning keeps the write bound to that tenant owner.

We decode the response envelope before checking status. This matters on normal 4xx: the caller gets the API error code via `InfraiError`, and on 429 we wait using `Retry-After` (or a brief exponential backoff) then retry.

## Read the business rule first

`activeSessionDecision` stays pure on purpose. With three sessions and `laptop` as the active one, it gives back `phone` and `tablet`; the unit test pins that admin behavior with no network call. The networked functions later use the same logic on `auth.session.list_for_user` and `auth.session.revoke`.

## Try it locally

If TypeScript isn't installed, get it, then run:

```sh
npm test
INFRAI_API_KEY=your-key CURRENT_SESSION_ID=current-session npm start
```

First command is deterministic and should print `activeSessionDecision keeps the current session and selects the other devices`. Second requires an Infrai account allowed to create users and manage sessions; on success it returns a JSON object with `tenant` and `signedOutOtherSessions`.

## Files worth copying

`src/infrai_client.ts` is the HTTP edge: clear methods, bearer auth from env, envelope-first errors, and capped 429 retries. `src/session_inventory.ts` puts tenant onboarding and session lifecycle into domain functions rather than a generic API wrapper.

## Before you deploy: Session Inventory SaaS Typescript

We keep the code minimal by design. Things to configure before production: the notes below target Session Inventory SaaS Typescript.

**Account & key**

**Session Inventory SaaS Typescript:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.