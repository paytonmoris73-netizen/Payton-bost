# Lunor

**Train. Track. Improve.** A mobile-first workout app with a glossy violet, moonlit look: guided workouts, nutrition tracking, progress analytics and leaderboards.

## Features

- **Workouts** — 8 built-in workouts (Strength / Cardio / Mobility), plus a **workout builder** to create, save and delete your own from a 30+ exercise library (or type your own)
- **Guided sessions** — set-by-set flow, countdown timers for timed exercises, rest timers (+15s / skip), pause, live progress, screen stays awake, timers stay accurate when the phone throttles the page. Log the weight per set (prefilled from last time); beating a previous best shows a **personal record** banner
- **Home** — today's planned workout (weekly rotation), calories burned, active minutes, daily goal, streak, recent activity
- **Nutrition** — calorie ring, protein/carb/fat tracking, quick-add presets and custom meals, plus a daily **water tracker**
- **Progress** — range filters (1W–All), weight trend chart, muscle / body-fat deltas, 7-day activity bars, log measurements, personal records, and workout history (with delete)
- **Leaderboards** — Friends / Global / Weekly. Your points (100 per workout + 5 per active minute) are real; the other athletes are sample data
- **AI Coach** — chat with a coach that sees your workouts, meals and progress; it can suggest a workout and start it in one tap. Uses Claude via a server function, with a built-in offline coach as fallback
- **Settings** — edit your name and calorie / macro / active-minute goals, **export and import a JSON backup** (imports are validated), reset
- **Installable (PWA)** — add to your home screen and use it offline (production builds)
- **Premium (simulated payments, test mode)** — monthly ($9.99) or yearly ($79.99) plans, a full checkout with card validation (number checksum, expiry, CVC, ZIP), processing, declines, a billing history, cancel / resume, and automatic renewals when a billing date passes. **No real payment provider is connected and no money moves**; only the card brand and last 4 digits are stored. Test cards: `4242 4242 4242 4242` succeeds, `4000 0000 0000 0002` is declined, `4000 0000 0000 9995` has insufficient funds. The listed Premium perks themselves aren't built yet

Everything is stored locally in your browser (`localStorage`) — no account or server.

## AI Coach setup

The coach calls Claude from `api/coach.ts` (a Vercel serverless function) so your API key never reaches the browser.

1. Deploy `apex-fitness/` as a Vercel project (root directory `apex-fitness`; the folder keeps its old name so existing deploy settings and saved data keep working).
2. Add the environment variable `ANTHROPIC_API_KEY`. Optionally set `COACH_MODEL` (default `claude-opus-5-5`; use a cheaper model if you prefer).

Without the key — or under plain `npm run dev`, where `/api` doesn't run — the app uses its offline rule-based coach (labelled "Offline coach" in the chat). The endpoint is same-site only, rate-limited per IP, validates input, and only forwards a whitelisted summary of your data. Coaching is general guidance, not medical advice.

## Tech

React 18 · TypeScript (strict) · Vite · Tailwind CSS · Zustand · Anthropic SDK (server function)

## Run it

```bash
cd apex-fitness
npm install
npm run dev
```

Open http://localhost:5174 (best viewed at phone width).

## Build

```bash
npm run build
npm run preview
```
