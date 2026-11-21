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
Payments are a clearly-labelled **demo checkout** (no money moves), AI runs on a built-in rules engine unless you point
Settings → AI & Integrations at an OpenAI-compatible endpoint, and several features are marked **Coming soon**
(Google sign-in, photo/barcode recognition, retailer prices, image generation, CRUNCH Plus billing, category management).
See [docs/BACKEND.md](docs/BACKEND.md) for what to connect for production (auth, database + rules, Stripe, AI proxy).

The first account created on a device becomes that device's admin (client-side only, for local use).
