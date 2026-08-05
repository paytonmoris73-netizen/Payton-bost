# BunnyX

BunnyX is an app builder: describe an app in plain language, and it streams back a
working, self-contained app you can preview, iterate on, and download.

It's the [BunnyX system prompt](./BUNNYX_SYSTEM_PROMPT.md) wired up to Claude — every
generation runs under that standard, plus a small "app generation" addendum
(`server/systemPrompt.ts`) that tells the model to return one complete, runnable
HTML file per response.

## How it works

- You describe an app in the composer.
- The server sends your conversation, with the BunnyX standard as the system prompt,
  to the Claude API and streams the response back over SSE.
- The client extracts the ```html code block from the response and renders it in a
  sandboxed `<iframe>`.
- Follow-up messages ("make the button bigger", "add a dark mode toggle") are sent
  with the full conversation history, so Claude edits the existing app rather than
  starting over.

Generated apps are single HTML files with inline CSS/JS — no external requests, no
build step. Anything that needs to persist data uses `localStorage` inside the file.
This keeps every generated app safely sandboxable and instantly previewable, at the
cost of not supporting a real backend, auth, or multi-file projects — out of scope
for this MVP.

## Setup

```bash
npm install
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY
npm run dev
```

This starts the Vite dev server (client, port 5173) and the Express API (port 8787)
together, with `/api/*` proxied from client to server. Open http://localhost:5173.

### Configuration

All in `.env` (see `.env.example`):

| Variable            | Default            | Purpose                                   |
| ------------------- | ------------------- | ------------------------------------------ |
| `ANTHROPIC_API_KEY` | —                    | Required. Your Anthropic API key.          |
| `BUNNYX_MODEL`      | `claude-sonnet-5`    | Model used for generation.                 |
| `PORT`              | `8787`               | Port for the API/production server.        |

If the key is missing, the UI shows a banner instead of letting you submit — it
won't fail silently mid-generation.

## Production build

```bash
npm run build
npm start
```

`npm run build` type-checks the whole project and builds the client into
`dist/client`. `npm start` runs the Express server in production mode, which serves
that build and the `/api` routes from a single process on `$PORT`.

## Project structure

```
server/
  index.ts          Express app: /api/config, /api/generate (SSE stream)
  systemPrompt.ts    Loads BUNNYX_SYSTEM_PROMPT.md + the app-generation addendum
src/
  App.tsx            Top-level state: conversation, streaming, current app
  components/
    Composer.tsx      Prompt input
    BuildLog.tsx       Revision history (left sidebar)
    PreviewPane.tsx    Preview/Code tabs, copy/download
  lib/
    stream.ts          SSE client (fetch + ReadableStream, no EventSource — POST body)
    extractCode.ts      Pulls the HTML document out of a model response
    types.ts            Shared types
```

## Notes

- No authentication, database, or multi-user support — this is a single-player local
  tool. Add those if you deploy it somewhere shared.
- The Anthropic API key is only ever used server-side; it's never sent to the browser.
