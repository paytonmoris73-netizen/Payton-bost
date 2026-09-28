import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface Toast { id: number; message: string; type: "success" | "error" | "info"; }

interface ToastCtx { toast: (msg: string, type?: Toast["type"]) => void; }

const Ctx = createContext<ToastCtx>({ toast: () => {} });

let _id = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = ++_id;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex", flexDirection: "column", gap: 8, zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: "12px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: t.type === "error" ? "var(--danger)" : t.type === "info" ? "var(--primary)" : "#059669",
            color: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            animation: "toast-in 0.2s ease",
            display: "flex", alignItems: "center", gap: 8, maxWidth: 320,
          }}>
            <span>{t.type === "error" ? "✕" : t.type === "info" ? "ℹ" : "✓"}</span>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() { return useContext(Ctx); }
