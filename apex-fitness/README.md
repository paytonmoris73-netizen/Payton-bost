# Apex Fitness

**Train. Track. Improve.** A mobile-first workout app: guided workouts, nutrition tracking, progress analytics and leaderboards.

## Features

- **Workouts** — 8 built-in workouts (Strength / Cardio / Mobility) with exercise lists, filters and detail pages
- **Guided sessions** — set-by-set flow, rest timers (+15s / skip), pause, live progress; finished sessions are logged automatically
- **Home** — today's planned workout (weekly rotation), calories burned, active minutes, daily goal, streak, recent activity
- **Nutrition** — calorie ring, protein/carb/fat tracking, quick-add presets and custom meals
- **Progress** — range filters (1W–All), weight trend chart, muscle / body-fat deltas, 7-day activity bars, log measurements
- **Leaderboards** — Friends / Global / Weekly. Your points (100 per workout + 5 per active minute) are real; the other athletes are sample data
- **Premium** — demo screen only; no payments, and the listed features aren't built

Everything is stored locally in your browser (`localStorage`) — no account or server.
The Progress chart starts with sample measurement history so it isn't empty; log your own to replace it.

## Tech

React 18 · TypeScript (strict) · Vite · Tailwind CSS · Zustand

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
