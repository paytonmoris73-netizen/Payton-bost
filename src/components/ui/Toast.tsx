import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Icon } from "../Icon";

interface Toast { id: number; title: string; body?: string; type?: "success" | "error" | "info" }

const Ctx = createContext<{ push: (title: string, body?: string, type?: Toast["type"]) => void }>({ push: () => {} });

export function useToast() { return useContext(Ctx); }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const push = useCallback((title: string, body?: string, type?: Toast["type"]) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, title, body, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto card animate-fade-up flex w-full max-w-sm items-center gap-3 px-4 py-3 shadow-elevated">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              t.type === "error" ? "bg-error/10 text-error" : t.type === "info" ? "bg-accent-subtle text-accent" : "bg-success/10 text-success"
            }`}>
              <Icon name={t.type === "error" ? "alert" : t.type === "info" ? "info" : "check"} className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-text-primary">{t.title}</div>
              {t.body && <div className="truncate text-xs text-text-secondary">{t.body}</div>}
            </div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function ToastContainer() {
  return null;
}
