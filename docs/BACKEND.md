# CRUNCH backend & integration guide

This repository ships a complete **front-end application**. To keep it runnable with zero setup, all data
(accounts, recipes you create, purchases, posts, lists, messages) is stored in the browser's `localStorage`
(`crunch-v1`). That is a development stand-in, **not** a production backend. This guide describes what to
swap in to make CRUNCH multi-device, secure and real.

## What is real today vs. stand-in

| Area | Today | Production |
|---|---|---|
| Auth | Local accounts; PBKDF2-hashed passwords, age gate | Firebase Auth / Supabase Auth (email, Google), server sessions |
| Roles | First local account = admin (client-side) | Custom claims; enforce in security rules / server |
| Data | `localStorage` via Zustand (`src/store.ts`) | Firestore / Postgres with rules below |
| Payments | Demo checkout, clearly labelled, no money moves | Stripe Checkout + webhook (server verifies) |
| AI chat | Built-in rules engine; optional OpenAI-compatible endpoint | Server proxy holding the key |
| Combination analysis / recipe generation | Built-in engine (`src/engine.ts`) | Server function calling your LLM with JSON-schema output |
| Retail prices, barcode/photo recognition, image generation | **Coming soon** (not faked) | Retailer APIs, vision model, image model |

## Security rules to implement (non-negotiable)

1. **Never trust client prices or ownership.** Checkout must be a server function: read price from the recipe
   document, create a Stripe Checkout Session, and grant access only from the verified `checkout.session.completed`
   webhook. `src/store.ts → checkout()` shows the shape (price re-read from catalogue) but runs on the client.
2. **Paid content gating.** Store paid `ingredients` + `steps` in a separate subcollection/table readable only by
   buyers and the creator (`recipes/{id}/private/content`). The public document holds title, description, cover,
   first four ingredient names. `canAccess()` in `src/store.ts` mirrors the rule the server must enforce.
3. **Reviews** only from users with a purchase record (for paid recipes); one per user per recipe.
4. **Roles**: `admin` via custom claims set from a trusted server; never from a client-writable field.
5. **Age**: store `birthYear`; block <13 entirely, block purchasing/selling <18 server-side.
6. **Uploads**: validate type/size server-side, re-encode images, scan, store in a private bucket with signed URLs.
7. **Rate-limit** AI, auth, posting, reporting, and message endpoints; sanitise all user text on output.
8. **Never put private API keys in front-end code.** The AI settings screen is for local testing only.

## Example Firestore rules (sketch)

```
match /recipes/{id} {
  allow read: if resource.data.status == 'published' || request.auth.uid == resource.data.creatorId || isAdmin();
  allow create: if request.auth != null && request.resource.data.creatorId == request.auth.uid && request.resource.data.price <= 50;
  allow update: if request.auth.uid == resource.data.creatorId && !('rating' in request.resource.data.diff(resource.data).affectedKeys());
  match /private/content {
    allow read: if request.auth.uid == get(/databases/$(database)/documents/recipes/$(id)).data.creatorId
                || exists(/databases/$(database)/documents/entitlements/$(request.auth.uid + '_' + id));
  }
}
match /entitlements/{e} { allow read: if request.auth.uid == resource.data.userId; allow write: if false; } // server only
match /purchases/{p}    { allow read: if request.auth.uid == resource.data.buyerId; allow write: if false; }
match /reviews/{r}      { allow create: if request.auth.uid == request.resource.data.userId
                           && exists(/databases/$(database)/documents/entitlements/$(request.auth.uid + '_' + request.resource.data.recipeId)); }
```

## Data model

`users`, `ingredients`, `recipes` (+ `private/content`), `combinations`, `purchases`, `entitlements`, `reviews`,
`posts`, `follows`, `collections`, `notifications`, `shoppingLists`, `reports`, `threads/messages`. Field names follow
the types in `src/types.ts`. Suggested indexes: `recipes(status, price)`, `recipes(creatorId, status)`,
`recipes(status, createdAt desc)`, `reviews(recipeId, createdAt desc)`, `posts(createdAt desc)`,
`notifications(userId, read, createdAt desc)`. Add a search index (Algolia/Typesense/Postgres FTS) for typo-tolerant search.

## AI integration

Create a server endpoint (`POST /api/chef`) that holds the provider key, applies per-user rate limits and a system
prompt that forbids guaranteeing taste or allergy safety, and returns OpenAI-compatible JSON. Point
**Settings → AI & Integrations** at it. For recipe generation, request a JSON schema matching `GenRecipe` in
`src/engine.ts` and validate the response before showing it.

## Payments

Use Stripe Checkout (or Stripe Connect for creator payouts). Commission is `MARKET_FEE` (15%) in `src/engine.ts`;
move it server-side. Handle refunds via the Stripe dashboard/API and revoke the entitlement.

## Backups & logging

Enable point-in-time recovery / daily exports, structured server logs with request IDs, and error reporting.

## Supabase schema (Phase 1)

`supabase/migrations/0001_core_schema.sql` defines the tables, indexes, triggers and row-level-security policies.
`supabase/tests/rls_test.sql` checks the key rules against a local Postgres with a stubbed `auth` schema:

```bash
psql -f supabase/tests/00_auth_stub.sql -f supabase/migrations/0001_core_schema.sql -f supabase/tests/rls_test.sql
```

Verified: paid recipe content is hidden from non-buyers, clients cannot create purchases or self-promote to admin,
only buyers can review paid recipes (`verified_purchase` is set by trigger), and allergy data is owner-only.
Not yet built: edge functions (Stripe checkout/webhook, AI proxy), storage buckets, and the front-end wiring to Supabase.

## Safety system (trust & safety)

Implemented in `src/safety.ts` (pure rules), `src/safetyStore.ts` (actions), `src/safetyUi.tsx`, `src/pages/Safety.tsx` and the Admin → Safety tab.
Tests: `npx tsx tests/safety.test.ts`, `npx tsx tests/safety-store.test.ts`, and the browser test `node tests/e2e-safety.cjs` (with `npm run dev -- --port 5199` running).

**This is enforced in the browser only**, like the rest of the local build, so a determined person could bypass it with dev tools. Before real users:
- Run the same `scanRecipe` / `publishDecision` / `reporterWeight` / `reportScore` code in the server function that writes recipes, posts and reports (the modules have no React or browser dependencies), and make `status`, `strikes`, `holds`, `suspensions` and `banned` writable by the server/admin role only.
- Store `reporterId` server-side from the auth token, never from the client, and rate-limit `report` there.
- The keyword scan is a first filter, not a guarantee of safe food. Keep a human in the loop (the held-for-review queue) for anything that reaches the public.

### Refunds, scam bans and Terms (added with the safety system)

- Policy constants live in `src/refunds.ts` (window, covered / not-covered reasons) and `src/safety.ts` (`SCAM_BANS_INSTANTLY`, `FALSE_REPORT_BAN_AT`). The Terms of Service page (`src/terms.ts`) reads the same constants, so the text can't drift from the rules.
- **Money:** the app currently marks refunds in local data only. In production, `decideRefund` and `autoRefundRecipe` must call your payment provider's refund API (e.g. Stripe `refunds.create`) from a server function, and the same server must revoke access and reverse the creator's payout.
- **Legal:** the Terms are a working draft written for a food-recipe marketplace. Have a lawyer review them (jurisdiction, consumer-law refund rights, liability limits, privacy policy) before launch.
- Tests: `npx tsx tests/policy-store.test.ts` (scam ban, false-report ban, every refund path) and `node tests/perf-scroll.cjs` (scroll-smoothness probe).
