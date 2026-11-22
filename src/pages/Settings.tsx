import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ALLERGENS, DIETS } from "../data";
import { useMe, useStore } from "../store";
import { PageHeader, Tabs, toast } from "../ui";
import { Segmented, Switch as GSwitch } from "../glass";
import { getFxMode, isLite, setFxMode, type FxMode } from "../fx";
import { THEMES, useAppearance, useResolvedTheme } from "../theme";
import { InstallCard } from "../InstallApp";
import type { Account } from "../types";

const TABS = ["Profile", "Food preferences", "Appearance", "Notifications", "Privacy", "AI & Integrations", "Account"] as const;
const NOTIFY: [string, string][] = [["follows", "New followers"], ["likes", "Likes on your creations"], ["comments", "Comments"], ["purchases", "Purchases of your recipes"], ["creators", "Posts from creators you follow"], ["reviews", "Reviews on your recipes"], ["challenges", "Challenges starting"], ["updates", "Updates to saved recipes & platform news"]];

/** Saves form edits automatically (debounced), and again when you switch tabs or leave the page. */
function useAutosave<T>(value: T, ok: (v: T) => boolean, same: (v: T) => boolean, commit: (v: T) => void): { state: "saved" | "pending" | "invalid"; flush: () => void } {
  const [state, setState] = useState<"saved" | "pending" | "invalid">("saved");
  const fns = useRef({ ok, same, commit }); fns.current = { ok, same, commit };
  const latest = useRef(value); latest.current = value;
  useEffect(() => {
    if (fns.current.same(value)) { setState("saved"); return; }
    if (!fns.current.ok(value)) { setState("invalid"); return; }
    setState("pending");
    const t = setTimeout(() => { fns.current.commit(value); setState("saved"); }, 600);
    return () => clearTimeout(t);
  }, [value]);
  const flush = () => { const v = latest.current; if (!fns.current.same(v) && fns.current.ok(v)) { fns.current.commit(v); setState("saved"); } };
  useEffect(() => { // also flush when the browser tab is hidden / closed / reloaded, and when this page unmounts
    const hide = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", hide); window.addEventListener("pagehide", flush);
    return () => { document.removeEventListener("visibilitychange", hide); window.removeEventListener("pagehide", flush); const v = latest.current; if (!fns.current.same(v) && fns.current.ok(v)) fns.current.commit(v); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return { state, flush };
}
const SaveState = ({ s, bad }: { s: "saved" | "pending" | "invalid"; bad?: string }) => (
  <p role="status" aria-live="polite" className={`text-xs ${s === "invalid" ? "text-red-700" : "text-brown"}`}>{s === "saved" ? "✓ All changes saved" : s === "pending" ? "Saving…" : bad ?? "Fix the highlighted field to save."}</p>
);
const profileOk = (p: { name: string; handle: string }) => p.name.trim().length >= 2 && /^@[a-z0-9_]{3,20}$/i.test(p.handle);
const sameProfile = (p: { name: string; handle: string; bio: string; emoji: string }) => { const m = useStore.getState().accounts.find((a) => a.id === useStore.getState().session); return !m || (m.name === p.name.trim() && m.handle === p.handle && m.bio === p.bio.slice(0, 280) && m.emoji === p.emoji); };

export default function Settings() {
  const me = useMe()!; const nav = useNavigate(); const { updateAccount, ai, setAI, logOut, stripeConfigured } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Profile");
  const [p, setP] = useState({ name: me.name, handle: me.handle, bio: me.bio, emoji: me.emoji }); const [aiF, setAiF] = useState(ai);
  const tog = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const Switch = ({ on, set, label }: { on: boolean; set: (v: boolean) => void; label: string }) => <div className="flex items-center justify-between gap-4 py-3 text-sm"><span>{label}</span><GSwitch on={on} onChange={set} label={label} /></div>;
  const { state: profileState, flush: flushProfile } = useAutosave(p, profileOk, sameProfile, (v) => updateAccount({ name: v.name.trim(), handle: v.handle, bio: v.bio.slice(0, 280), emoji: v.emoji }));
  const { state: aiState, flush: flushAi } = useAutosave(aiF, (v) => !v.endpoint || /^https:\/\//.test(v.endpoint), (v) => { const c = useStore.getState().ai; return c.endpoint === v.endpoint && c.model === v.model && c.key === v.key; }, (v) => setAI(v));
  const [fx, setFx] = useState<FxMode>(getFxMode()); const [, rerender] = useState(0);
  const appearance = useAppearance(); const resolved = useResolvedTheme();
  return (
    <div>
      <PageHeader title="Settings" />
      <Tabs tabs={TABS} value={tab} onChange={(t) => { flushProfile(); flushAi(); setTab(t); }} />
      <div className="card max-w-2xl p-6">
        {tab === "Profile" && (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (p.name.trim().length < 2) return toast("Enter a name.", "err"); if (!/^@[a-z0-9_]{3,20}$/i.test(p.handle)) return toast("Handle must look like @name (3–20 letters, numbers or _).", "err"); updateAccount({ name: p.name.trim(), handle: p.handle, bio: p.bio.slice(0, 280), emoji: p.emoji }); toast("Profile saved"); }}>
            <div><span className="label">Avatar</span><div className="flex flex-wrap gap-1.5">{["🍳", "👩‍🍳", "👨‍🍳", "🥑", "🍕", "🌶️", "🧁", "🍜", "🥕", "🍋"].map((e) => <button type="button" key={e} onClick={() => setP({ ...p, emoji: e })} aria-pressed={p.emoji === e} aria-label={`Avatar ${e}`} className={`press grid h-12 w-12 place-items-center rounded-full text-2xl transition-[background,box-shadow] duration-300 ${p.emoji === e ? "sel-fill" : "tile"}`}>{e}</button>)}</div></div>
            <div><label className="label" htmlFor="sn">Name</label><input id="sn" className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} maxLength={60} /></div>
            <div><label className="label" htmlFor="sh">Handle</label><input id="sh" className="input" value={p.handle} onChange={(e) => setP({ ...p, handle: e.target.value })} /></div>
            <div><label className="label" htmlFor="sb">Bio</label><textarea id="sb" className="input" rows={3} value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} maxLength={280} /></div>
            <div className="flex items-center gap-3"><button className="btn-primary">Save profile</button><SaveState s={profileState} bad="Name needs 2+ characters and the handle must look like @name." /></div>
          </form>
        )}
        {tab === "Food preferences" && (
          <div className="space-y-5">
            <div><span className="label">Cooking experience</span><div className="flex flex-wrap gap-1.5">{(["Beginner", "Home cook", "Confident", "Pro"] as const).map((l) => <button key={l} onClick={() => updateAccount({ level: l })} className="pick" aria-pressed={me.level === l}>{l}</button>)}</div></div>
            <div><span className="label">Dietary preferences</span><div className="flex flex-wrap gap-1.5">{DIETS.map((d) => <button key={d} onClick={() => updateAccount({ diet: tog(me.diet, d) })} className="pick sage" aria-pressed={me.diet.includes(d)}>{d}</button>)}</div></div>
            <div><span className="label">Allergies &amp; ingredient restrictions</span><div className="flex flex-wrap gap-1.5">{ALLERGENS.map((d) => <button key={d} onClick={() => updateAccount({ allergies: tog(me.allergies, d) })} className="pick" aria-pressed={me.allergies.includes(d)}>{d}</button>)}</div>
              <p className="mt-2 text-xs text-brown">We use these to tailor recommendations and show warnings. CRUNCH can't guarantee any recipe is safe for someone with an allergy: always read labels and consider cross-contact.</p></div>
          </div>
        )}
        {tab === "Appearance" && (
          <div className="space-y-8">
            <section className="space-y-3"><h2 className="h-display text-xl">App</h2><InstallCard /></section>
            <section className="space-y-3">
              <div><h2 className="h-display text-xl">Light or dark</h2><p className="mt-1 text-sm text-brown">Automatic follows your phone or computer, switching to dark at night if your system does.</p></div>
              <Segmented label="Light or dark mode" options={[{ value: "auto", label: "Automatic" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }] as const} value={appearance.mode} onChange={appearance.setMode} />
            </section>
            <section className="space-y-3">
              <div><h2 className="h-display text-xl">Theme</h2><p className="mt-1 text-sm text-brown">Change the look of the whole app. Festive themes add gentle decorations.</p></div>
              <div className="stagger grid grid-cols-2 gap-3" role="radiogroup" aria-label="Theme">
                {THEMES.map((t) => {
                  const on = appearance.theme === t.id;
                  return (
                    <button key={t.id} type="button" role="radio" aria-checked={on} onClick={() => { appearance.setTheme(t.id); toast(`${t.name} theme on`); }}
                      className={`lift press tile flex flex-col items-stretch justify-start overflow-hidden p-0 text-left transition-shadow ${on ? "!shadow-[0_0_0_2.5px_rgb(var(--orange)),var(--lift-2)]" : ""}`}>
                      <span className="relative block h-20 overflow-hidden rounded-t-[1.1rem]" style={{ background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]} 55%, ${t.swatch[2]})` }}>
                        <span className="absolute inset-x-3 bottom-2 flex gap-1.5">{t.swatch.map((c) => <i key={c} className="h-4 w-4 rounded-full border-2 border-[#fff]/80 shadow" style={{ background: c }} />)}</span>
                        <span className="absolute right-3 top-2 text-3xl drop-shadow">{t.emoji}</span>
                        {on && <span className="pop-in absolute left-3 top-2 grid h-6 w-6 place-items-center rounded-full bg-[#fff] text-[#25231F] shadow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>}
                      </span>
                      <span className="block p-3"><b className="block text-sm">{t.name}{t.id === "seasonal" ? <span className="font-normal text-brown"> · now {resolved}</span> : ""}</b><span className="text-xs text-brown">{t.desc}</span></span>
                    </button>
                  );
                })}
              </div>
            </section>
            <section className="space-y-3">
            <div><h2 className="h-display text-xl">Visual effects</h2><p className="mt-1 text-sm text-brown">CRUNCH uses frosted Liquid Glass. On older or slower devices it automatically switches to a lighter look with the same design but no live blur, so everything stays smooth.</p></div>
            <Segmented label="Visual effects" options={[{ value: "auto", label: "Automatic" }, { value: "full", label: "Full glass" }, { value: "lite", label: "Reduced" }] as const} value={fx} onChange={(m) => { setFx(m); setFxMode(m); rerender((n) => n + 1); toast(m === "auto" ? "Effects set to automatic" : m === "full" ? "Full glass effects on" : "Reduced effects on"); }} />
            <p className="text-xs text-brown">Currently using: <b>{isLite() ? "reduced effects" : "full glass"}</b>{fx === "auto" ? " (chosen automatically for this device)" : ""}. Your system's Reduce Motion and Reduce Transparency settings are always respected.</p>
            </section>
          </div>
        )}
        {tab === "Notifications" && <div className="divide-y divide-cream">{NOTIFY.map(([k, l]) => <Switch key={k} label={l} on={me.notify[k] !== false} set={(v) => updateAccount({ notify: { ...me.notify, [k]: v } as Account["notify"] })} />)}</div>}
        {tab === "Privacy" && <div className="divide-y divide-cream"><Switch label="Public profile" on={me.privacy.publicProfile} set={(v) => updateAccount({ privacy: { ...me.privacy, publicProfile: v } })} /><Switch label="Show my activity to followers" on={me.privacy.showActivity} set={(v) => updateAccount({ privacy: { ...me.privacy, showActivity: v } })} /><Switch label="Allow direct messages" on={me.privacy.allowDMs} set={(v) => updateAccount({ privacy: { ...me.privacy, allowDMs: v } })} /></div>}
        {tab === "AI & Integrations" && (
          <div className="space-y-6">
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (aiF.endpoint && !/^https:\/\//.test(aiF.endpoint)) return toast("Endpoint must start with https://", "err"); setAI(aiF); toast(aiF.endpoint ? "AI provider saved" : "Using CRUNCH AI"); }}>
              <h2 className="h-display text-xl">AI provider</h2>
              <p className="rounded-xl bg-orange-light/50 p-3 text-xs"><b>Security:</b> keys entered here live in your browser's local storage, so use this only for personal testing. In production, point the endpoint at <i>your own server proxy</i> that holds the key (see docs/BACKEND.md). Never ship private API keys in frontend code.</p>
              <div><label className="label" htmlFor="ae">Chat completions endpoint (OpenAI-compatible)</label><input id="ae" className="input" placeholder="https://your-proxy.example.com/v1/chat/completions" value={aiF.endpoint} onChange={(e) => setAiF({ ...aiF, endpoint: e.target.value.trim() })} /></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="label" htmlFor="am">Model</label><input id="am" className="input" value={aiF.model} onChange={(e) => setAiF({ ...aiF, model: e.target.value.trim() })} /></div><div><label className="label" htmlFor="ak">API key (optional)</label><input id="ak" type="password" className="input" autoComplete="off" value={aiF.key} onChange={(e) => setAiF({ ...aiF, key: e.target.value })} /></div></div>
              <div className="flex gap-2"><button className="btn-primary">Save</button><button type="button" className="btn-ghost" onClick={() => { setAiF({ endpoint: "", model: "", key: "" }); setAI({ endpoint: "", model: "", key: "" }); }}>Use CRUNCH AI (default)</button></div>
              <p className="text-xs text-brown">Status: {ai.endpoint ? "custom provider connected for AI Chef chat" : "CRUNCH AI via the secure server proxy (falls back to the built-in engine if unavailable)"}. Recipe generation and combination analysis currently always use the built-in engine.</p>
              <SaveState s={aiState} bad="The endpoint must start with https://" />
            </form>
            <div className="space-y-2 text-sm"><h2 className="h-display text-xl">Other services</h2>
              <Row name="Payments (Stripe)" status={stripeConfigured ? "Connected" : "Not configured — demo checkout, no money moves"} />
              <Row name="Authentication (Firebase / Supabase)" status="Local accounts on this device. Production auth: see docs/BACKEND.md" />
              <Row name="Image generation" status="Coming soon" /><Row name="Grocery retailer integrations" status="Coming soon — prices and availability are never invented" /><Row name="Photo & barcode ingredient recognition" status="Coming soon" /></div>
          </div>
        )}
        {tab === "Account" && (
          <div className="space-y-4 text-sm">
            <p><b>Email:</b> {me.email}</p><p><b>Member since:</b> {new Date(me.createdAt).toLocaleDateString()}</p><p><b>Plan:</b> {me.plus ? "CRUNCH Plus" : "Free"} · <Link to="/plus" className="font-semibold underline">See CRUNCH Plus</Link></p>
            <div className="flex flex-wrap gap-2"><button className="btn-dark" onClick={() => { logOut(); nav("/auth"); }}>Log out</button>
              <button className="btn-outline" onClick={() => { const blob = new Blob([localStorage.getItem("crunch-v1") ?? "{}"], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "crunch-data.json"; a.click(); URL.revokeObjectURL(a.href); }}>Export my data</button>
              <button className="btn-outline !border-red-300 !text-red-700" onClick={() => { if (confirm("Erase ALL CRUNCH data stored on this device, including accounts? This can't be undone.")) { localStorage.removeItem("crunch-v1"); location.assign("/auth"); } }}>Erase local data</button></div>
            {me.role === "admin" && <p className="text-xs text-brown">You're the administrator of this local install. <Link to="/admin" className="font-semibold underline">Open admin dashboard</Link></p>}
          </div>
        )}
      </div>
      <p className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-sm"><Link to="/terms" className="underline">Terms of Service</Link><Link to="/privacy" className="underline">Privacy Policy</Link><Link to="/terms#refunds" className="underline">Refund policy</Link><Link to="/safety" className="underline">Safety Center</Link></p>
    </div>
  );
}
const Row = ({ name, status }: { name: string; status: string }) => <div className="flex justify-between gap-4 rounded-xl bg-cream px-4 py-3"><b>{name}</b><span className="text-right text-xs text-brown">{status}</span></div>;
