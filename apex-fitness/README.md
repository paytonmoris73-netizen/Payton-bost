# Apex Fitness

**Train. Track. Improve.** A mobile-first workout app: guided workouts, nutrition tracking, progress analytics and leaderboards.

## Features

- **Workouts** — 8 built-in workouts (Strength / Cardio / Mobility) with exercise lists, filters and detail pages
- **Guided sessions** — set-by-set flow, rest timers (+15s / skip), pause, live progress; finished sessions are logged automatically
- **Home** — today's planned workout (weekly rotation), calories burned, active minutes, daily goal, streak, recent activity
- **Nutrition** — calorie ring, protein/carb/fat tracking, quick-add presets and custom meals
- **Progress** — range filters (1W–All), weight trend chart, muscle / body-fat deltas, 7-day activity bars, log measurements
- **Leaderboards** — Friends / Global / Weekly. Your points (100 per workout + 5 per active minute) are real; the other athletes are sample data
- **AI Coach** — chat with a coach that sees your workouts, meals and progress; it can suggest a workout and start it in one tap. Uses Claude via a server function, with a built-in offline coach as fallback
- **Premium** — demo screen only; no payments, and the listed features aren't built

Everything is stored locally in your browser (`localStorage`) — no account or server.
The Progress chart starts with sample measurement history so it isn't empty; log your own to replace it.

## AI Coach setup

The coach calls Claude from `api/coach.ts` (a Vercel serverless function) so your API key never reaches the browser.

1. Deploy `apex-fitness/` as a Vercel project (root directory `apex-fitness`).
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
