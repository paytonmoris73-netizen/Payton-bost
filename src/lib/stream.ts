export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface StreamHandlers {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

export async function streamGenerate(
  messages: ChatTurn[],
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return;
    handlers.onError("Could not reach the server. Is it running?");
    return;
  }

  if (!res.ok || !res.body) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // response wasn't JSON — keep the default message
    }
    handlers.onError(message);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    let chunk: ReadableStreamReadResult<Uint8Array>;
    try {
      chunk = await reader.read();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      handlers.onError("Connection to the server was interrupted.");
      return;
    }
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });

    let sepIndex: number;
    while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);
      const line = rawEvent.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;

      try {
        const payload = JSON.parse(line.slice("data: ".length));
        if (payload.type === "delta") handlers.onDelta(payload.text as string);
        else if (payload.type === "done") handlers.onDone();
        else if (payload.type === "error") handlers.onError(payload.message as string);
      } catch {
        // malformed frame — skip it rather than breaking the whole stream
      }
    }
  }
}
