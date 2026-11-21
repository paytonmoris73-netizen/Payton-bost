import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ALLERGENS, DIETS } from "../data";
import { useMe, useStore } from "../store";
import { PageHeader, Tabs, toast } from "../ui";
import type { Account } from "../types";

const TABS = ["Profile", "Food preferences", "Notifications", "Privacy", "AI & Integrations", "Account"] as const;
const NOTIFY: [string, string][] = [["follows", "New followers"], ["likes", "Likes on your creations"], ["comments", "Comments"], ["purchases", "Purchases of your recipes"], ["creators", "Posts from creators you follow"], ["reviews", "Reviews on your recipes"], ["challenges", "Challenges starting"], ["updates", "Updates to saved recipes & platform news"]];

export default function Settings() {
  const me = useMe()!; const nav = useNavigate(); const { updateAccount, ai, setAI, logOut, stripeConfigured } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Profile");
  const [p, setP] = useState({ name: me.name, handle: me.handle, bio: me.bio, emoji: me.emoji }); const [aiF, setAiF] = useState(ai);
  const tog = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const Switch = ({ on, set, label }: { on: boolean; set: (v: boolean) => void; label: string }) => <label className="flex cursor-pointer items-center justify-between py-3 text-sm"><span>{label}</span><button type="button" role="switch" aria-checked={on} onClick={() => set(!on)} className={`relative h-6 w-11 rounded-full transition ${on ? "bg-orange" : "bg-cream-dark"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} /></button></label>;
  return (
    <div>
      <PageHeader title="Settings" />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      <div className="card max-w-2xl p-6">
        {tab === "Profile" && (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (p.name.trim().length < 2) return toast("Enter a name.", "err"); if (!/^@[a-z0-9_]{3,20}$/i.test(p.handle)) return toast("Handle must look like @name (3–20 letters, numbers or _).", "err"); updateAccount({ name: p.name.trim(), handle: p.handle, bio: p.bio.slice(0, 280), emoji: p.emoji }); toast("Profile saved"); }}>
            <div><span className="label">Avatar</span><div className="flex flex-wrap gap-1.5">{["🍳", "👩‍🍳", "👨‍🍳", "🥑", "🍕", "🌶️", "🧁", "🍜", "🥕", "🍋"].map((e) => <button type="button" key={e} onClick={() => setP({ ...p, emoji: e })} className={`grid h-11 w-11 place-items-center rounded-full text-xl ${p.emoji === e ? "bg-orange-light ring-2 ring-orange" : "bg-cream"}`}>{e}</button>)}</div></div>
            <div><label className="label" htmlFor="sn">Name</label><input id="sn" className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} maxLength={60} /></div>
            <div><label className="label" htmlFor="sh">Handle</label><input id="sh" className="input" value={p.handle} onChange={(e) => setP({ ...p, handle: e.target.value })} /></div>
            <div><label className="label" htmlFor="sb">Bio</label><textarea id="sb" className="input" rows={3} value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} maxLength={280} /></div>
            <button className="btn-primary">Save profile</button>
          </form>
        )}
        {tab === "Food preferences" && (
          <div className="space-y-5">
            <div><span className="label">Cooking experience</span><div className="flex flex-wrap gap-1.5">{(["Beginner", "Home cook", "Confident", "Pro"] as const).map((l) => <button key={l} onClick={() => updateAccount({ level: l })} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${me.level === l ? "bg-charcoal text-ivory" : "bg-cream"}`}>{l}</button>)}</div></div>
            <div><span className="label">Dietary preferences</span><div className="flex flex-wrap gap-1.5">{DIETS.map((d) => <button key={d} onClick={() => updateAccount({ diet: tog(me.diet, d) })} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${me.diet.includes(d) ? "bg-sage" : "bg-cream"}`}>{d}</button>)}</div></div>
            <div><span className="label">Allergies &amp; ingredient restrictions</span><div className="flex flex-wrap gap-1.5">{ALLERGENS.map((d) => <button key={d} onClick={() => updateAccount({ allergies: tog(me.allergies, d) })} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${me.allergies.includes(d) ? "bg-orange" : "bg-cream"}`}>{d}</button>)}</div>
              <p className="mt-2 text-xs text-brown">We use these to tailor recommendations and show warnings. CRUNCH can't guarantee any recipe is safe for someone with an allergy: always read labels and consider cross-contact.</p></div>
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
    </div>
  );
}
const Row = ({ name, status }: { name: string; status: string }) => <div className="flex justify-between gap-4 rounded-xl bg-cream px-4 py-3"><b>{name}</b><span className="text-right text-xs text-brown">{status}</span></div>;
