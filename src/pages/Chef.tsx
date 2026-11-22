import { useEffect, useRef, useState } from "react";
import { G } from "../icons";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CUISINES, MEALS } from "../data";
import { DISCLAIMER_TASTE, DEFAULT_AI_ENDPOINT, askRemote, chefReply, findIngredientsInText, generateRecipes, matchScore, type GenRecipe } from "../engine";
import { genToRecipe } from "../RecipeBody";
import { useIngredients, useMe, useStore } from "../store";
import { ImproveTool, SubstituteTool } from "./ChefTools";
import { Picks, Segmented, Select, Stepper } from "../glass";
import { AllergenNote, Cover, NutritionPanel, PageHeader, Tabs, toast } from "../ui";

interface Msg { role: "user" | "assistant"; text: string; recipes?: GenRecipe[] }
const PROMPTS = ["What can I make with chicken, rice and spinach?", "What can I substitute for butter?", "How can I make pasta vegetarian?", "Create a dessert using banana and oats", "How do I improve tomato and mozzarella?"];
const EQUIP = ["Oven", "Stovetop", "Blender", "Air fryer", "Slow cooker", "Microwave", "Grill"];

export function GenCard({ g, onSaved }: { g: GenRecipe; onSaved?: (id: string) => void }) {
  const me = useMe()!; const upsert = useStore((s) => s.upsertRecipe); const nav = useNavigate(); const [saved, setSaved] = useState<string | null>(null); const [open, setOpen] = useState(false);
  const save = () => { const r = genToRecipe(g, me.id); upsert(r); setSaved(r.id); onSaved?.(r.id); toast("Saved to My Cookbook → Created"); return r.id; };
  return (
    <div className="card overflow-hidden">
      <div className="grid sm:grid-cols-[180px_1fr]">
        <Cover emoji={g.emoji} hue={g.emoji.codePointAt(0)! % 360} className="m-1.5 h-40 rounded-[1.15rem] sm:h-auto" />
        <div className="p-4">
          <h3 className="font-semibold">{g.title}</h3><p className="mt-1 text-sm text-brown">{g.description}</p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs"><span className="chip">Prep {g.prepMin}m</span><span className="chip">Cook {g.cookMin}m</span><span className="chip">Total {g.prepMin + g.cookMin}m</span><span className="chip">{g.servings} servings</span><span className="chip">{g.difficulty}</span></div>
          {g.warnings.map((w) => <p key={w} className="mt-2 rounded-lg bg-orange-light/50 p-2 text-xs"><G g="⚠" /> {w}</p>)}
          <div className="mt-3 flex flex-wrap gap-2"><button className="btn-ghost !py-1.5" onClick={() => setOpen(!open)}>{open ? "Hide details" : "View full recipe"}</button>{saved ? <><Link to={`/recipe/${saved}`} className="btn-dark !py-1.5">Open recipe</Link><button className="btn-primary !py-1.5" onClick={() => nav(`/cook/${saved}`)}><G g="▶" /> Cook</button></> : <button className="btn-dark !py-1.5" onClick={save}>Save recipe</button>}</div>
        </div>
      </div>
      {open && (
        <div className="rise-in space-y-4 border-t border-cream p-4 text-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div><h4 className="mb-1 font-semibold">Ingredients</h4><ul className="space-y-0.5 text-brown">{g.ingredients.map((i) => <li key={i.name}>• {i.amount} {i.name}</li>)}</ul><h4 className="mb-1 mt-3 font-semibold">Equipment</h4><p className="text-brown">{g.equipment.join(", ")}</p></div>
            <div><h4 className="mb-1 font-semibold">Method</h4><ol className="list-decimal space-y-1.5 pl-5 text-brown">{g.steps.map((s, i) => <li key={i}>{s.text}{s.timerMin ? ` (${s.timerMin} min)` : ""}</li>)}</ol></div>
          </div>
          <NutritionPanel n={g.nutrition} servings={g.servings} /><AllergenNote allergens={g.allergens} diet={g.diet} />
          {g.substitutions.length > 0 && <div><h4 className="mb-1 font-semibold">Substitutions</h4><ul className="list-disc pl-5 text-brown">{g.substitutions.map((s) => <li key={s}>{s}</li>)}</ul></div>}
          <div><h4 className="mb-1 font-semibold">Storage</h4><p className="text-brown">{g.storage}</p></div>
        </div>
      )}
    </div>
  );
}

function Chat() {
  const me = useMe()!; const ai = useStore((s) => s.ai); const custom = !!ai.endpoint;
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", text: "Hi, I'm your AI chef. Tell me what you have or what you're craving, and I'll help with ideas, substitutions and technique." }]);
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false); const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);
  const send = async (t: string) => {
    t = t.trim(); if (!t || busy) return; setText(""); setMsgs((m) => [...m, { role: "user", text: t }]); setBusy(true);
    const local = chefReply(t, { diet: me.diet, allergies: me.allergies });
    try {
      const hist = [...msgs, { role: "user" as const, text: t }].slice(-10).map((m) => ({ role: m.role, content: m.text }));
      while (hist.length && hist[0].role !== "user") hist.shift();
      const reply = await askRemote(custom ? ai : { ...ai, endpoint: DEFAULT_AI_ENDPOINT, key: "" }, hist);
      setMsgs((m) => [...m, { role: "assistant", text: reply, recipes: local.recipes }]);
    } catch (e) { setMsgs((m) => [...m, { role: "assistant", text: `${custom ? `I couldn't reach your AI provider (${(e as Error).message}). ` : "The AI chef is unavailable right now. "}Here's what my built-in engine suggests:\n\n${local.text}`, recipes: local.recipes }]); }
    setBusy(false);
  };
  return (
    <div className="card flex h-[70vh] flex-col overflow-hidden">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : ""}`}><div className={`rise-in max-w-[88%] ${m.role === "user" ? "rounded-[1.35rem] rounded-br-md bg-gradient-to-b from-[#3A3731] to-charcoal px-4 py-2.5 text-ivory shadow-[inset_0_1px_0_rgba(255,255,255,.14),0_8px_18px_-10px_rgba(37,35,31,.6)]" : ""}`}>
            {m.role === "assistant" && <div className="mb-1 text-xs font-semibold text-brown">👨‍🍳 AI Chef</div>}
            <div className={`whitespace-pre-wrap text-sm leading-relaxed ${m.role === "assistant" ? "tile rounded-[1.35rem] rounded-tl-md px-4 py-3" : ""}`}>{m.text.replace(/\*\*(.+?)\*\*/g, "$1")}</div>
            {m.recipes && <div className="mt-3 space-y-3">{m.recipes.map((g, k) => <GenCard key={k} g={g} />)}</div>}
          </div></div>
        ))}
        {busy && <div className="flex gap-1 px-2">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce-soft rounded-full bg-brown-light" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>}
        <div ref={end} />
      </div>
      {msgs.length < 3 && <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">{PROMPTS.map((p) => <button key={p} onClick={() => send(p)} className="chip shrink-0 !py-2 hover:bg-orange-light">{p}</button>)}</div>}
      <form className="flex gap-2 border-t border-cream bg-white/40 p-3" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask the chef anything…" aria-label="Message the AI chef" maxLength={600} /><button className="btn-primary" disabled={busy || !text.trim()}>Send</button>
      </form>
      <p className="px-4 pb-3 text-[11px] text-brown">{custom ? `Connected to your AI provider (${ai.model || "default model"}).` : "Powered by CRUNCH AI."} AI can make mistakes; check food-safety and allergen details yourself.</p>
    </div>
  );
}

function Generator() {
  const me = useMe()!; const ings = useIngredients();
  const [picked, setPicked] = useState<string[]>([]); const [q, setQ] = useState(""); const [meal, setMeal] = useState("Dinner"); const [cuisine, setCuisine] = useState("Any"); const [time, setTime] = useState(45); const [diff, setDiff] = useState("Easy");
  const [servings, setServings] = useState(2); const [equip, setEquip] = useState<string[]>(["Stovetop"]); const [diet, setDiet] = useState<string[]>(me.diet); const [flavor, setFlavor] = useState("Balanced");
  const [out, setOut] = useState<GenRecipe[] | null>(null); const [busy, setBusy] = useState(false);
  const sugg = q.trim() ? ings.filter((i) => !picked.includes(i.id) && matchScore(q, i.name) > 0).slice(0, 6) : [];
  const run = () => {
    if (!picked.length) return toast("Add at least one ingredient.", "err");
    setBusy(true);
    setTimeout(() => {
      const items = picked.map((id) => ({ ing: ings.find((i) => i.id === id)!, qty: 0, unit: "g" }));
      let r = generateRecipes(items, { meal, cuisine, servings, diet, difficulty: diff, flavor, equipment: equip, maxMinutes: time });
      const fit = r.filter((x) => x.prepMin + x.cookMin <= time + 15); if (fit.length) r = fit;
      setOut(r); setBusy(false);
    }, 600);
  };
    return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <div className="card space-y-5 p-5 lg:sticky lg:top-24 lg:self-start">
        <div><label className="label" htmlFor="gi">Available ingredients</label>
          <div className="mb-2 flex flex-wrap gap-1.5">{picked.map((id) => { const i = ings.find((x) => x.id === id)!; return <button key={id} className="pick sm pop-in" aria-pressed onClick={() => setPicked(picked.filter((x) => x !== id))} aria-label={`Remove ${i.name}`}>{i.emoji} {i.name} <G g="✕" /></button>; })}</div>
          <input id="gi" className="input" placeholder="Type to add… or paste a list" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const found = findIngredientsInText(q); const add = found.length ? found : sugg.slice(0, 1); if (add.length) { setPicked([...new Set([...picked, ...add.map((a) => a.id)])]); setQ(""); } } }} />
          <div className="mt-2 flex flex-wrap gap-1.5">{sugg.map((i) => <button key={i.id} className="pick sm" onClick={() => { setPicked([...picked, i.id]); setQ(""); }}><G g="＋" /> {i.emoji} {i.name}</button>)}</div></div>
        <div><span className="label">Meal type</span><Picks size="sm" label="Meal type" options={MEALS} value={meal} onChange={setMeal} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label" htmlFor="gc">Cuisine</label><Select id="gc" label="Cuisine" value={cuisine} onChange={setCuisine} options={CUISINES} /></div>
          <div className="col-span-2"><span className="label">Difficulty</span><Segmented label="Difficulty" options={["Easy", "Medium", "Hard"]} value={diff} onChange={setDiff} className="[&_.seg]:flex [&_.seg]:w-full [&_.seg-item]:flex-1" /></div>
          <div><label className="label" htmlFor="gt">Max time</label><Stepper id="gt" label="Max time in minutes" suffix="min" value={time} onChange={setTime} min={5} max={480} step={5} /></div>
          <div><label className="label" htmlFor="gsv">Servings</label><Stepper id="gsv" label="Servings" value={servings} onChange={setServings} min={1} max={12} /></div>
        </div>
        <div><span className="label">Equipment</span><Picks multi size="sm" tone="sage" label="Equipment" options={EQUIP} value={equip} onChange={setEquip} /></div>
        <div><span className="label">Dietary preferences</span><Picks multi size="sm" tone="sage" label="Dietary preferences" options={["vegan", "vegetarian", "gluten-free", "dairy-free"]} value={diet} onChange={setDiet} /></div>
        <div><span className="label">Flavour profile</span><Picks size="sm" label="Flavour profile" options={["Balanced", "Savoury", "Sweet", "Spicy", "Fresh & bright", "Rich & comforting"]} value={flavor} onChange={setFlavor} /></div>
        <button className="btn-primary w-full" onClick={run} disabled={busy}>{busy ? "Generating…" : <><G g="✨" /> Generate recipes</>}</button>
      </div>
      <div className="space-y-4">
        {busy && [0, 1, 2].map((i) => <div key={i} className="skeleton h-44" style={{ animationDelay: `${i * 120}ms` }} />)}
        {!busy && !out && <div className="card grid place-items-center px-6 py-16 text-center"><div className="rise-in"><div className="mx-auto grid h-24 w-24 place-items-center rounded-[1.8rem] text-6xl tile animate-float">👨‍🍳</div><h3 className="h-display mt-2 text-2xl">Tell me what you've got</h3><p className="mx-auto mt-1 max-w-sm text-sm text-brown">Add your ingredients and preferences and I'll draft detailed recipes with quantities, steps, nutrition estimates and allergen notes.</p></div></div>}
        {!busy && out && <><div className="stagger space-y-4">{out.map((g, i) => <GenCard key={i} g={g} />)}</div><p className="text-xs text-brown">{DISCLAIMER_TASTE} Generated by CRUNCH's built-in engine. Verify safe cooking temperatures and allergens.</p></>}
      </div>
    </div>
  );
}

const CHEF_TABS = ["Ask the chef", "Recipe generator", "Improve a recipe", "Substitutions"] as const;
const TAB_KEY: Record<string, (typeof CHEF_TABS)[number]> = { generate: "Recipe generator", improve: "Improve a recipe", substitute: "Substitutions" };
export default function Chef() {
  const [p, setP] = useSearchParams(); const tab = TAB_KEY[p.get("tab") ?? ""] ?? "Ask the chef";
  const keyOf = (t: string) => Object.entries(TAB_KEY).find(([, v]) => v === t)?.[0];
  return (
    <div>
      <PageHeader title="AI Chef" sub="A knowledgeable cooking assistant for ideas, substitutions, technique and full recipes." />
      <Tabs tabs={CHEF_TABS} value={tab} onChange={(t) => setP(keyOf(t) ? { tab: keyOf(t)! } : {})} />
      {tab === "Ask the chef" ? <Chat /> : tab === "Recipe generator" ? <Generator /> : tab === "Improve a recipe" ? <ImproveTool /> : <SubstituteTool />}
    </div>
  );
}
