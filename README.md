# CRUNCH

Food-creation platform: **Food Combiner**, **AI Chef**, **Recipe Marketplace**, **Ingredient Shop**, **Community**, personal **Cookbook**, creator **Studio** and an **Admin** console.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
```

Stack: React 18 · TypeScript (strict) · Vite · Tailwind · React Router 7 · Zustand.

## Status — please read

This is a working front-end. Data is stored **locally in the browser** so it runs with no setup; accounts are per-device.
Payments are a clearly-labelled **demo checkout** (no money moves), AI Chef chat uses Gemini through a server proxy (`api/chef.ts`, key in `GEMINI_API_KEY`) and falls back to a built-in rules engine if the proxy is unavailable, and several features are marked **Coming soon**
(Google sign-in, photo/barcode recognition, retailer prices, image generation, CRUNCH Plus billing, category management).
See [docs/BACKEND.md](docs/BACKEND.md) for what to connect for production (auth, database + rules, Stripe, AI proxy).

The first account created on a device becomes that device's admin (client-side only, for local use).

## AI setup (Gemini, key stays on the server)

1. Create a free key at https://aistudio.google.com/apikey
2. Deploy to Vercel and add the environment variable `GEMINI_API_KEY` (see `.env.example`). Never prefix it with `VITE_` and never commit it.
3. Locally, use `npx vercel dev` to get the `/api/chef` route; with plain `npm run dev` the chef falls back to the built-in engine.

The proxy ignores client-supplied system prompts, validates and size-limits input, accepts same-site requests only, and rate-limits per IP.
