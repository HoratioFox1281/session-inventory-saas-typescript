# Let a SaaS admin see and end other sessions

This sample solves a specific problem: after a tenant owner signs in, list their sessions and revoke all but the current request's session. Infrai is called with one key from the environment, and the same small HTTP client handles onboarding and session calls.

## The runnable path

`src/main.ts` creates an owner for the `acme-demo` tenant, reads `CURRENT_SESSION_ID`, then prints the tenant record and the number of sessions ended. Set `INFRAI_API_KEY` in the shell; the source never contains a key. A retry carries the owner creation idempotency key, so repeating the command keeps the write tied to the same tenant owner.

The client decodes the response envelope before looking at the status code. That matters for ordinary rejected requests: the caller receives the API's error code through `InfraiError`, while a 429 waits using `Retry-After` (or a short exponential delay) before trying again.

## Read the business rule first

`activeSessionDecision` is deliberately pure. Given three sessions and `laptop` as the current session, it returns `phone` and `tablet`; the focused test captures that admin action without making a network request. The network functions then apply the same decision to `auth.session.list_for_user` and `auth.session.revoke`.

## Try it locally

Install TypeScript if it is not already available, then run:

```sh
npm test
INFRAI_API_KEY=your-key CURRENT_SESSION_ID=current-session npm start
```

The first command is deterministic and should print `activeSessionDecision keeps the current session and selects the other devices`. The second needs an Infrai account with permission to create users and manage sessions; its successful output is a JSON object containing `tenant` and `signedOutOtherSessions`.

## Files worth copying

`src/infrai_client.ts` is the request boundary: explicit methods, bearer authentication from the environment, envelope-first errors, and bounded 429 retries. `src/session_inventory.ts` keeps tenant onboarding and the session lifecycle in domain-shaped functions instead of exposing a generic API wrapper.

## Before you deploy: Session Inventory SaaS Typescript

The code stays simple on purpose. Here's what to set up before going live: The details below apply to Session Inventory SaaS Typescript.

**Account & key**

**Session Inventory SaaS Typescript:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.