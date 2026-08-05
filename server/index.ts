import "dotenv/config";
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SYSTEM_PROMPT } from "./systemPrompt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8787;
const MODEL = process.env.BUNNYX_MODEL || "claude-sonnet-5";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/api/config", (_req, res) => {
  res.json({ model: MODEL, hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY) });
});

app.post("/api/generate", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "ANTHROPIC_API_KEY is not set on the server. Add it to .env and restart the server.",
    });
    return;
  }

  const { messages } = req.body as { messages?: ChatTurn[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages must be a non-empty array." });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  const send = (payload: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const client = new Anthropic({ apiKey });
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  res.on("close", () => {
    if (!res.writableEnded) stream.controller.abort();
  });

  stream.on("text", (delta) => {
    send({ type: "delta", text: delta });
  });

  try {
    await stream.finalMessage();
    send({ type: "done" });
  } catch (err) {
    send({ type: "error", message: err instanceof Error ? err.message : "Generation failed." });
  } finally {
    res.end();
  }
});

if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "..", "dist", "client");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`BunnyX server listening on http://localhost:${PORT}`);
});
