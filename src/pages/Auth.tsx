import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useMe, useStore } from "../store";
import { toast } from "../ui";

export default function Auth() {
  const me = useMe(); const { signUp, logIn, resetPassword } = useStore();
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [f, setF] = useState({ name: "", email: "", password: "", year: "", agree: false });
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  if (me) return <Navigate to="/" replace />;
  const set = (k: string, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setBusy(true);
    let r: string | null = null;
    if (mode === "signup") { if (!f.agree) r = "Please accept the Terms and Community Guidelines."; else r = await signUp({ name: f.name, email: f.email, password: f.password, birthYear: Number(f.year) }); }
    else if (mode === "login") r = await logIn(f.email, f.password);
    else { r = await resetPassword(f.email, f.password); if (!r) { toast("If an account exists for that email, the password was updated."); setMode("login"); } }
    setBusy(false); if (r) setErr(r);
  };
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-charcoal p-12 text-ivory lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2.5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange font-display text-xl text-charcoal">C</span><span className="h-display text-2xl tracking-wide">CRUNCH</span></div>
        <div>
          <h1 className="h-display text-5xl leading-tight">Three random ingredients.<br />One new recipe.</h1>
          <p className="mt-4 max-w-md text-lg text-ivory/70">Combine foods, cook with an AI chef, and buy or sell original recipes in one place.</p>
          <div className="mt-10 flex gap-3 text-5xl">{["🥑", "🍋", "🧀", "🍝", "🍫"].map((e, i) => <span key={e} className="animate-float" style={{ animationDelay: `${i * 0.4}s` }}>{e}</span>)}</div>
        </div>
        <p className="text-xs text-ivory/50">Account data on this build is stored locally in your browser. See docs/BACKEND.md for the production setup.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm" noValidate>
          <h2 className="h-display text-3xl">{mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password"}</h2>
          <p className="mb-6 mt-1 text-sm text-brown">{mode === "login" ? "Log in to your cookbook." : mode === "signup" ? "Free to join. You must be 13 or older." : "Enter your email and a new password."}</p>
          {mode === "signup" && <div className="mb-3"><label className="label" htmlFor="n">Name</label><input id="n" className="input" value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" /></div>}
          <div className="mb-3"><label className="label" htmlFor="e">Email</label><input id="e" type="email" className="input" value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" /></div>
          <div className="mb-3"><label className="label" htmlFor="p">{mode === "reset" ? "New password" : "Password"}</label><input id="p" type="password" className="input" value={f.password} onChange={(e) => set("password", e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} />{mode !== "login" && <p className="mt-1 text-xs text-brown">8+ characters with letters and numbers.</p>}</div>
          {mode === "signup" && (
            <>
              <div className="mb-3"><label className="label" htmlFor="y">Birth year</label><input id="y" inputMode="numeric" maxLength={4} className="input" value={f.year} onChange={(e) => set("year", e.target.value.replace(/\D/g, ""))} placeholder="e.g. 1995" /><p className="mt-1 text-xs text-brown">Used for age protections. Buying and selling recipes requires 18+.</p></div>
              <label className="mb-3 flex items-start gap-2 text-xs text-brown"><input type="checkbox" checked={f.agree} onChange={(e) => set("agree", e.target.checked)} className="mt-0.5" />I agree to the Terms, Privacy Policy and Community Guidelines.</label>
            </>
          )}
          {err && <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Log in" : mode === "signup" ? "Create account" : "Update password"}</button>
          {mode !== "reset" && (
            <button type="button" disabled className="btn-outline mt-2 w-full" title="Requires Firebase Auth configuration">Continue with Google <span className="rounded-full bg-sage-light px-2 py-0.5 text-[10px] font-bold uppercase">Coming soon</span></button>
          )}
          <div className="mt-5 flex justify-between text-sm">
            {mode === "login" ? <><button type="button" className="font-semibold" onClick={() => { setMode("signup"); setErr(null); }}>Create account</button><button type="button" className="text-brown" onClick={() => { setMode("reset"); setErr(null); }}>Forgot password?</button></> : <button type="button" className="font-semibold" onClick={() => { setMode("login"); setErr(null); }}>← Back to log in</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
