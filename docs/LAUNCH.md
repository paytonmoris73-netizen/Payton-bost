# CRUNCH launch checklist

## Verified in this repo (run them yourself)
| Check | Command |
|---|---|
| Typecheck + production build | `npm run build` |
| Safety rules (scan, reports, strikes) | `npx tsx tests/safety.test.ts` · `npx tsx tests/safety-store.test.ts` |
| Scam ban, false-report ban, refunds | `npx tsx tests/policy-store.test.ts` |
| Browser: safety, terms, refunds, admin | `npm run dev -- --port 5199` then `node tests/e2e-safety.cjs` |
| Browser: signup/login/reset, buy → unlock → cook, search, AI chef, community, messages, settings | `node tests/e2e-flows.cjs` |
| Browser: notes, cooking status, filters, copyright complaint | `node tests/e2e-cookbook.cjs` |
| One command for everything that needs no dev server | `npm run verify` (build + unit + CSP). With `npm run dev -- --port 5199` running: `npm run test:e2e` and `npm run audit` |
| Accessibility + overflow + console errors on every page, phone/desktop, light/dark | `node tests/audit.cjs` |
| Scroll smoothness at 4x CPU throttle | `node tests/perf-scroll.cjs` |
| Security headers (CSP etc.) against the real build | `npm run build && node tests/csp-smoke.cjs` |

If you edit the inline theme script in `index.html`, rebuild and regenerate the CSP hash in `vercel.json` (`csp-smoke` fails if it's stale).

## Turning on the AI Chef (the API key)
1. Create a key at https://aistudio.google.com/apikey
2. Vercel → your project → Settings → Environment Variables → add `GEMINI_API_KEY` (Production + Preview). **Never** prefix it with `VITE_`, never commit it.
3. Redeploy. The app calls `/api/chef`; the key stays on the server. Without a key the chef automatically falls back to the built-in engine.
4. Optional: `GEMINI_MODEL` to change the model. Add Vercel Firewall rate limiting in front of `/api/chef` for production traffic.

## What is NOT production-ready yet (needs you / a backend)
These are real limits of the current build, not bugs:
1. **Accounts and data live in each person's browser.** Users can't see each other's recipes, posts or messages, and clearing the browser erases an account. A real marketplace needs the backend in `docs/BACKEND.md` (a Supabase schema is in `supabase/migrations`).
2. **Payments are a demo checkout.** No money moves. Connect Stripe (server-side) and make refunds call the Stripe refund API.
3. **Safety rules run in the browser.** Move the same functions to the server so they can't be bypassed (see `docs/BACKEND.md`).
4. **Legal.** Have a lawyer review `src/terms.ts` and `src/pages/Privacy.tsx` for your jurisdiction before launch. Add a real support contact.
5. **Moderation staffing.** Someone must work the Admin → Safety and Refunds queues.
6. **Photos.** Photo uploads need file storage (Supabase Storage / S3) once there is a backend.

## Good to launch now as
A public **preview / demo / waitlist build**: the whole product experience works on each person's device, AI chef works once the key is set. Don't present it as a live marketplace paying creators until items 1–2 are done.
