import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";

interface ComposerProps {
  onSubmit: (prompt: string) => void;
  disabled: boolean;
  isStreaming: boolean;
  hasApps: boolean;
}

export function Composer({ onSubmit, disabled, isStreaming, hasApps }: ComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const prompt = value.trim();
    if (!prompt || disabled) return;
    onSubmit(prompt);
    setValue("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        className="composer-input"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={hasApps ? "Describe the next change…" : "Describe the app you want to build…"}
        rows={3}
        disabled={disabled}
        aria-label="App description"
      />
      <button type="submit" className="composer-submit" disabled={disabled || !value.trim()}>
        {isStreaming ? "Building…" : hasApps ? "Update app" : "Build app"}
      </button>
    </form>
  );
}
