import { useEffect, useMemo, useRef, useState } from "react";
import { G } from "../icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CATEGORIES, COOKING_STYLES, MEALS } from "../data";
import { DISCLAIMER_TASTE, UNITS, analyze, comboToItems, generateRecipes, matchScore, type ComboItem, type GenRecipe } from "../engine";
import { genToRecipe } from "../RecipeBody";
import { uid, useIngredients, useMe, useStore } from "../store";
import { Empty, Meter, Modal, NutritionPanel, Tabs, toast } from "../ui";
import type { Category, Combo, Ingredient } from "../types";

interface Item { id: string; qty: number; unit: string; x: number; y: number }
const defaultUnit = (i: Ingredient): { qty: number; unit: string } => i.category === "Spices" ? { qty: 1, unit: "tsp" } : i.category === "Sauces" ? { qty: 1, unit: "tbsp" } : i.category === "Baking" ? { qty: 100, unit: "g" } : { qty: 1, unit: "piece" };
const CARD_W = 150, CARD_H = 128;

async function shrink(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Image must be under 8 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("Couldn't read that image.")); i.src = url; });
    const s = Math.min(1, 640 / Math.max(img.width, img.height)); const c = document.createElement("canvas"); c.width = img.width * s; c.height = img.height * s;
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height); return c.toDataURL("image/jpeg", 0.7);
  } finally { URL.revokeObjectURL(url); }
}

export default function Combiner() {
  const nav = useNavigate(); const [params, setParams] = useSearchParams(); const me = useMe();
  const ings = useIngredients(); const { frequent, toggleFrequent, combos, saveCombo, deleteCombo, addCustomIngredient, upsertRecipe, ai } = useStore();
  const [items, setItems] = useState<Item[]>([]); const [q, setQ] = useState(""); const [cat, setCat] = useState<"All" | "Frequent" | Category>("All"); const [tab, setTab] = useState<"Ingredients" | "Workspace" | "Analysis">("Ingredients");
  const [name, setName] = useState("My combination"); const [notes, setNotes] = useState(""); const [photo, setPhoto] = useState<string | undefined>(); const [comboId, setComboId] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false); const [customOpen, setCustomOpen] = useState(false); const [scanOpen, setScanOpen] = useState(false); const [genOpen, setGenOpen] = useState(false); const [listOpen, setListOpen] = useState(false);
  const wsRef = useRef<HTMLDivElement>(null);

  const place = (n: number, w: number) => { const cols = Math.max(1, Math.floor((w || 600) / (CARD_W + 12))); return { x: 8 + (n % cols) * (CARD_W + 12), y: 8 + Math.floor(n / cols) * (CARD_H + 12) }; };
  const add = (i: Ingredient) => {
    setItems((p) => {
      const ex = p.find((x) => x.id === i.id);
      if (ex) { return p.map((x) => (x.id === i.id ? { ...x, qty: x.qty + (x.unit === "g" || x.unit === "ml" ? 50 : 1) } : x)); }
      return [...p, { id: i.id, ...defaultUnit(i), ...place(p.length, wsRef.current?.clientWidth || 600) }];
    });
  };
  // load from ?ing= and ?combo=
  useEffect(() => {
    const raw = params.get("ing"); const cid = params.get("combo");
    if (raw) { const ids = raw.split(",").filter((id) => ings.some((i) => i.id === id)).slice(0, 12); setItems(ids.map((id, n) => ({ id, ...defaultUnit(ings.find((i) => i.id === id)!), ...place(n, 600) }))); setTab("Workspace"); setParams({}, { replace: true }); }
    if (cid) { const c = combos.find((x) => x.id === cid); if (c) loadCombo(c); setParams({}, { replace: true }); }
    if (params.get("scan")) { setScanOpen(true); setParams({}, { replace: true }); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const loadCombo = (c: Combo) => { setItems(c.items.filter((i) => ings.some((x) => x.id === i.id)).map((i, n) => ({ ...i, ...place(n, wsRef.current?.clientWidth || 600) }))); setName(c.name); setNotes(c.notes); setPhoto(c.photo); setComboId(c.id); setTab("Workspace"); toast(`Loaded “${c.name}”`); };
  const organize = () => setItems((p) => p.map((x, n) => ({ ...x, ...place(n, wsRef.current?.clientWidth || 600) })));
  useEffect(() => {
    const el = wsRef.current; if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => { const w = el.clientWidth; if (w > 0) setItems((p) => p.some((x) => x.x + CARD_W > w + 2) ? p.map((x, n) => (x.x + CARD_W > w + 2 ? { ...x, ...place(n, w) } : x)) : p); });
    ro.observe(el); return () => ro.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const clear = () => { setItems([]); setName("My combination"); setNotes(""); setPhoto(undefined); setComboId(null); };

  const comboItems: ComboItem[] = useMemo(() => items.flatMap((it) => { const ing = ings.find((x) => x.id === it.id); return ing ? [{ ing, qty: it.qty, unit: it.unit }] : []; }), [items, ings]);
  const a = useMemo(() => analyze(comboItems), [comboItems]);

  const shown = useMemo(() => {
    let l = ings;
    if (cat === "Frequent") l = l.filter((i) => frequent.includes(i.id)); else if (cat !== "All") l = l.filter((i) => i.category === cat);
    if (q.trim()) return l.map((i) => ({ i, s: matchScore(q, i.name) })).filter((x) => x.s > 0).sort((x, y) => y.s - x.s).map((x) => x.i);
    return l;
  }, [ings, cat, q, frequent]);

  // drag
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const onDown = (e: React.PointerEvent, it: Item) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); drag.current = { id: it.id, dx: e.clientX - it.x, dy: e.clientY - it.y }; };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d || !wsRef.current) return; const w = wsRef.current.clientWidth, h = wsRef.current.clientHeight;
    setItems((p) => p.map((x) => (x.id === d.id ? { ...x, x: Math.max(0, Math.min(w - CARD_W, e.clientX - d.dx)), y: Math.max(0, Math.min(h - CARD_H, e.clientY - d.dy)) } : x)));
  };
  const rows = Math.max(1, Math.ceil(items.length / Math.max(1, Math.floor((wsRef.current?.clientWidth || 600) / (CARD_W + 12))))); const wsH = Math.max(300, rows * (CARD_H + 12) + 20);

  const save = () => {
    if (!items.length) return toast("Add some ingredients first.", "err");
    if (name.trim().length < 2) return toast("Give your combination a name.", "err");
    const id = comboId ?? uid();
    saveCombo({ id, name: name.trim(), notes: notes.trim(), photo, createdAt: new Date().toISOString(), items: items.map(({ id: i, qty, unit }) => ({ id: i, qty, unit })) });
    setComboId(id); setSaveOpen(false); toast("Combination saved");
  };
  const share = async () => {
    const text = `${name}: ${comboItems.map((c) => c.ing.name).join(" + ")} — try it on CRUNCH: ${location.origin}/combiner?ing=${items.map((i) => i.id).join(",")}`;
    try { if (navigator.share) await navigator.share({ title: name, text }); else { await navigator.clipboard.writeText(text); toast("Link copied to clipboard"); } } catch { /* cancelled */ }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="h-display text-3xl md:text-4xl">Food Combiner</h1><p className="text-sm text-brown">Pick ingredients, arrange them, and see how well they might work together.</p></div>
        <div className="flex flex-wrap gap-2"><button className="btn-ghost" onClick={() => setScanOpen(true)}><G g="📷" /> Scan / photo</button><button className="btn-ghost" onClick={() => setListOpen(true)}><G g="📚" /> My combinations ({combos.length})</button></div>
      </div>
      <div className="lg:hidden"><Tabs tabs={["Ingredients", "Workspace", "Analysis"] as const} value={tab} onChange={setTab} /></div>

      <div className="grid gap-5 lg:grid-cols-[340px_1fr] lg:items-start">
        {/* picker */}
        <section className={`${tab === "Ingredients" ? "block" : "hidden"} lg:block`} aria-label="Ingredient picker">
          <div className="card p-4 lg:sticky lg:top-20">
            <input className="input mb-3" placeholder="Search ingredients (typos are fine)…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search ingredients" />
            <div className="no-scrollbar mb-3 flex gap-1.5 overflow-x-auto pb-1">
              {(["All", "Frequent", ...CATEGORIES] as const).map((c) => <button key={c} onClick={() => setCat(c)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${cat === c ? "bg-charcoal text-ivory" : "bg-cream hover:bg-cream-dark"}`}>{c}</button>)}
            </div>
            <div className="grid max-h-[55vh] grid-cols-3 gap-2 overflow-y-auto pr-1 lg:max-h-[62vh]">
              {shown.map((i) => {
                const on = items.some((x) => x.id === i.id);
                return (
                  <div key={i.id} className="relative">
                    <button onClick={() => { add(i); toast(`${i.name} added`); }} className={`flex w-full flex-col items-center gap-1 rounded-xl p-2.5 text-center transition active:scale-95 ${on ? "bg-orange-light ring-2 ring-orange" : "bg-cream hover:bg-cream-dark"}`} aria-label={`Add ${i.name}`}>
                      <span className="text-3xl">{i.emoji}</span><span className="line-clamp-1 text-[11px] font-semibold">{i.name}</span>
                    </button>
                    <button onClick={() => toggleFrequent(i.id)} className={`absolute right-1 top-1 text-xs ${frequent.includes(i.id) ? "text-orange" : "text-brown-light"}`} aria-label={frequent.includes(i.id) ? "Remove from frequent" : "Mark as frequent"}><G g={frequent.includes(i.id) ? "★" : "☆"} /></button>
                  </div>
                );
              })}
              {shown.length === 0 && <div className="col-span-3 py-6 text-center text-sm text-brown">{cat === "Frequent" ? "Star ingredients to find them here." : `No match for “${q}”.`}<br /><button className="mt-2 font-semibold underline" onClick={() => setCustomOpen(true)}>Add it as a custom ingredient</button></div>}
            </div>
            <button className="btn-outline mt-3 w-full" onClick={() => setCustomOpen(true)}><G g="＋" /> Add custom ingredient</button>
          </div>
        </section>

        {/* workspace */}
        <section className={`${tab === "Workspace" ? "block" : "hidden"} lg:block`} aria-label="Workspace">
          <div className="card p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <input className="h-display w-full max-w-xs border-b border-transparent bg-transparent text-2xl focus:border-orange focus:outline-none" value={name} onChange={(e) => setName(e.target.value)} aria-label="Combination name" maxLength={60} />
              <div className="flex gap-2"><button className="btn-ghost !px-3 !py-1.5" onClick={organize} disabled={!items.length}>Organise</button><button className="btn-ghost !px-3 !py-1.5" onClick={clear} disabled={!items.length}>Clear</button></div>
            </div>
            <div ref={wsRef} className="relative overflow-hidden rounded-2xl border-2 border-dashed border-cream-dark bg-ivory" style={{ height: wsH, touchAction: items.length ? "none" : "auto" }} onPointerMove={onMove} onPointerUp={() => (drag.current = null)}>
              {items.length === 0 && <div className="absolute inset-0 grid place-items-center p-6 text-center"><div><div className="text-5xl">🥣</div><p className="mt-2 font-semibold">Your workspace is empty</p><p className="text-sm text-brown">Tap ingredients on the left to add them, then drag to arrange.</p></div></div>}
              {items.map((it) => {
                const ing = ings.find((x) => x.id === it.id); if (!ing) return null;
                return (
                  <div key={it.id} className="animate-scale-in absolute select-none rounded-2xl bg-white p-2.5 shadow-card" style={{ left: it.x, top: it.y, width: CARD_W, height: CARD_H }}>
                    <div onPointerDown={(e) => onDown(e, it)} className="flex cursor-grab items-center gap-2 active:cursor-grabbing" style={{ touchAction: "none" }}>
                      <span className="text-3xl">{ing.emoji}</span><span className="line-clamp-2 flex-1 text-xs font-bold leading-tight">{ing.name}</span>
                      <button onPointerDown={(e) => e.stopPropagation()} onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))} className="text-brown-light hover:text-red-600" aria-label={`Remove ${ing.name}`}><G g="✕" /></button>
                    </div>
                    <div className="mt-2 flex gap-1">
                      <input type="number" min={0.1} step={it.unit === "g" || it.unit === "ml" ? 10 : 0.5} value={it.qty} onChange={(e) => setItems((p) => p.map((x) => (x.id === it.id ? { ...x, qty: Math.max(0.1, Number(e.target.value) || 0.1) } : x)))} className="w-14 rounded-lg border border-cream-dark px-1.5 py-1 text-xs" aria-label={`${ing.name} quantity`} />
                      <select value={it.unit} onChange={(e) => setItems((p) => p.map((x) => (x.id === it.id ? { ...x, unit: e.target.value } : x)))} className="min-w-0 flex-1 rounded-lg border border-cream-dark px-1 py-1 text-xs" aria-label={`${ing.name} unit`}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-live="polite"><span className="text-xs font-semibold uppercase tracking-wide text-brown">Current combination</span>{comboItems.map((c) => <span key={c.ing.id} className="chip">{c.ing.emoji} {c.qty} {c.unit} {c.ing.name}</span>)}{!items.length && <span className="text-sm text-brown">nothing yet</span>}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-primary" disabled={!items.length} onClick={() => setGenOpen(true)}><G g="✨" /> CREATE MY RECIPE</button>
              <button className="btn-dark" disabled={!items.length} onClick={() => setSaveOpen(true)}>{comboId ? "Update saved combination" : "Save combination"}</button>
              <button className="btn-ghost" disabled={!items.length} onClick={share}>Share</button>
            </div>
          </div>
        </section>

        {/* analysis */}
        <section className={`${tab === "Analysis" ? "block" : "hidden"} lg:col-start-2 lg:block`} aria-label="Analysis">
          <div className="card p-5">
            <h2 className="h-display mb-1 text-2xl">AI combination analysis</h2>
            {!a ? <Empty emoji="🔬" title="Add ingredients to analyse" text="You'll see compatibility, flavour balance, suggestions and nutrition estimates." /> : (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#F2A66B ${a.score * 3.6}deg, #F6EEDF 0)` }}><div className="grid h-[78px] w-[78px] place-items-center rounded-full bg-white"><span className="text-3xl font-bold">{a.score}</span></div></div>
                  <div><div className="font-semibold">Compatibility score</div><p className="text-xs text-brown">Out of 100. A rough guide to how conventional and balanced this combination is, not a taste guarantee.</p></div>
                </div>
                <div className="grid gap-3"><Meter label="Flavour balance" value={a.flavor} /><Meter label="Texture" value={a.texture} color="#A8B59A" /><Meter label="Versatility" value={a.versatility} color="#8A725E" /><Meter label="Recipe potential" value={a.potential} /></div>
                <div><h3 className="mb-2 text-sm font-semibold">Why this score</h3><ul className="space-y-1 text-sm text-brown">{a.reasons.map((r) => <li key={r}><G g="✓" /> {r}</li>)}</ul></div>
                <div className="grid grid-cols-3 gap-2 text-center">{([["Sweetness", a.profile.sweet], ["Saltiness", a.profile.salty], ["Sourness", a.profile.sour]] as const).map(([l, v]) => <div key={l} className="rounded-xl bg-cream p-2"><div className="text-lg font-bold">{v}%</div><div className="text-[11px] text-brown">{l}</div></div>)}</div>
                {a.conflicts.length > 0 && <div className="rounded-xl bg-orange-light/40 p-3"><h3 className="mb-1 text-sm font-semibold">Possible flavour conflicts</h3><ul className="space-y-1 text-sm">{a.conflicts.map((c) => <li key={c}><G g="⚠" /> {c}</li>)}</ul></div>}
                {a.suggestions.length > 0 && <div><h3 className="mb-2 text-sm font-semibold">Suggested additions</h3><div className="flex flex-wrap gap-1.5">{a.suggestions.map((s) => <button key={s.id} className="chip hover:bg-orange-light" onClick={() => add(s)}><G g="＋" /> {s.emoji} {s.name}</button>)}</div></div>}
                <div><h3 className="mb-2 text-sm font-semibold">Recipe ideas</h3><div className="flex flex-wrap gap-1.5">{a.ideas.map((s) => <span key={s} className="chip">{s}</span>)}</div></div>
                <div><h3 className="mb-2 text-sm font-semibold">Cooking methods</h3><div className="flex flex-wrap gap-1.5">{a.methods.map((s) => <span key={s} className="chip bg-sage-light">{s}</span>)}</div></div>
                <div><NutritionPanel n={a.nutrition.perServing} servings={a.nutrition.servings} partial={a.nutrition.partial} />
                  <details className="mt-2 text-xs text-brown"><summary className="cursor-pointer font-semibold">Ingredient breakdown (kcal)</summary><ul className="mt-1">{a.nutrition.breakdown.map((b) => <li key={b.name} className="flex justify-between py-0.5"><span>{b.name}</span><span>{b.calories}</span></li>)}</ul></details></div>
                <p className="text-xs text-brown">{DISCLAIMER_TASTE} {ai.endpoint ? "" : "Analysis runs on CRUNCH's built-in flavour rules; connect an AI provider in Settings for richer commentary."}</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <Modal open={saveOpen} onClose={() => setSaveOpen(false)} title="Save combination">
        <label className="label" htmlFor="cn">Name</label><input id="cn" className="input mb-3" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        <label className="label" htmlFor="cno">Notes</label><textarea id="cno" className="input mb-3" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} placeholder="How did it taste? What would you change?" />
        <label className="label">Photo</label>
        {photo && <img src={photo} alt="Combination" className="mb-2 h-32 w-full rounded-xl object-cover" />}
        <input type="file" accept="image/*" className="mb-4 text-sm" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { setPhoto(await shrink(f)); } catch (err) { toast((err as Error).message, "err"); } }} />
        <button className="btn-primary w-full" onClick={save}>Save</button>
      </Modal>

      <Modal open={listOpen} onClose={() => setListOpen(false)} title="My combinations" wide>
        {combos.length === 0 ? <Empty emoji="📚" title="No saved combinations yet" text="Build one and press Save." /> : (
          <div className="grid gap-3 sm:grid-cols-2">{combos.map((c) => (
            <div key={c.id} className="rounded-2xl bg-cream p-4">
              {c.photo && <img src={c.photo} alt="" className="mb-2 h-28 w-full rounded-xl object-cover" />}
              <b>{c.name}</b><p className="text-xs text-brown">{comboToItems(c, ings).map((i) => i.ing.emoji + i.ing.name).join(" · ")}</p>{c.notes && <p className="mt-1 line-clamp-2 text-xs">{c.notes}</p>}
              <div className="mt-3 flex gap-2"><button className="btn-dark !px-3 !py-1.5" onClick={() => { loadCombo(c); setListOpen(false); }}>Open &amp; edit</button><button className="btn-ghost !px-3 !py-1.5" onClick={() => { if (confirm("Delete this combination?")) deleteCombo(c.id); }}>Delete</button></div>
            </div>))}</div>
        )}
      </Modal>

      <CustomIngredient open={customOpen} onClose={() => setCustomOpen(false)} initial={q} onCreate={(i) => { addCustomIngredient(i); add(i); }} />
      <ScanModal open={scanOpen} onClose={() => setScanOpen(false)} onPick={(i) => { add(i); toast(`${i.name} added`); }} onCustom={() => { setScanOpen(false); setCustomOpen(true); }} />
      {genOpen && <GenerateModal items={comboItems} onClose={() => setGenOpen(false)} onSave={(g) => { if (!me) return; const r = genToRecipe(g, me.id); upsertRecipe(r); toast("Saved to My Cookbook → Created"); nav(`/recipe/${r.id}`); }} />}
    </div>
  );
}

function CustomIngredient({ open, onClose, onCreate, initial }: { open: boolean; onClose: () => void; onCreate: (i: Ingredient) => void; initial: string }) {
  const [n, setN] = useState(""); const [c, setC] = useState<Category>("Other"); const [e, setE] = useState("🍽️"); const [t, setT] = useState({ sweet: 0, salty: 0, sour: 0 });
  useEffect(() => { if (open) setN(initial); }, [open, initial]);
  const ings = useIngredients();
  const submit = () => {
    if (n.trim().length < 2) return toast("Enter a name.", "err");
    if (ings.some((i) => i.name.toLowerCase() === n.trim().toLowerCase())) return toast("That ingredient already exists.", "err");
    onCreate({ id: "custom-" + uid(), name: n.trim().slice(0, 40), category: c, emoji: e || "🍽️", description: "Custom ingredient added by you.", taste: { sweet: t.sweet, salty: t.salty, sour: t.sour }, textures: ["soft"], per100g: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }, allergens: [], uses: [], storage: "Follow package guidance.", substitutes: [], custom: true });
    onClose(); toast("Custom ingredient added");
  };
  return (
    <Modal open={open} onClose={onClose} title="Custom ingredient">
      <label className="label" htmlFor="ci">Name</label><input id="ci" className="input mb-3" value={n} onChange={(e) => setN(e.target.value)} maxLength={40} />
      <div className="mb-3 grid grid-cols-[1fr_90px] gap-3"><div><label className="label" htmlFor="cc">Category</label><select id="cc" className="input" value={c} onChange={(e) => setC(e.target.value as Category)}>{CATEGORIES.map((x) => <option key={x}>{x}</option>)}</select></div><div><label className="label" htmlFor="ce">Emoji</label><input id="ce" className="input text-center" value={e} onChange={(ev) => setE(ev.target.value.slice(0, 2))} /></div></div>
      {(["sweet", "salty", "sour"] as const).map((k) => <div key={k} className="mb-2"><label className="label">{k} (0–5)</label><input type="range" min={0} max={5} value={t[k]} onChange={(ev) => setT({ ...t, [k]: Number(ev.target.value) })} className="w-full accent-orange" /></div>)}
      <p className="mb-3 text-xs text-brown">Custom ingredients have no nutrition or allergen data, so those totals will be marked partial. Check labels yourself.</p>
      <button className="btn-primary w-full" onClick={submit}>Add ingredient</button>
    </Modal>
  );
}

function ScanModal({ open, onClose, onPick, onCustom }: { open: boolean; onClose: () => void; onPick: (i: Ingredient) => void; onCustom: () => void }) {
  const ings = useIngredients(); const [img, setImg] = useState<string>(); const [q, setQ] = useState("");
  const res = q.trim() ? ings.filter((i) => matchScore(q, i.name) > 0).slice(0, 8) : [];
  return (
    <Modal open={open} onClose={onClose} title="Scan or upload ingredients">
      <p className="mb-3 rounded-xl bg-sage-light/60 p-3 text-xs">Automatic photo and barcode recognition is <b>coming soon</b>. For now, upload a photo as a reference and tap the ingredients you can see (or read off the packaging).</p>
      <input type="file" accept="image/*" capture="environment" className="mb-3 text-sm" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { setImg(await shrink(f)); } catch (err) { toast((err as Error).message, "err"); } }} />
      {img && <img src={img} alt="Your ingredient photo" className="mb-3 max-h-56 w-full rounded-xl object-cover" />}
      <input className="input mb-2" placeholder="Type what you see or the product name…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="flex flex-wrap gap-2">{res.map((i) => <button key={i.id} className="chip !py-2 hover:bg-orange-light" onClick={() => onPick(i)}><G g="＋" /> {i.emoji} {i.name}</button>)}</div>
      {q.trim() && res.length === 0 && <p className="text-sm text-brown">No match. <button className="font-semibold underline" onClick={onCustom}>Add as custom ingredient</button></p>}
    </Modal>
  );
}

function GenerateModal({ items, onClose, onSave }: { items: ComboItem[]; onClose: () => void; onSave: (g: GenRecipe) => void }) {
  const me = useMe()!; const [meal, setMeal] = useState("Dinner"); const [style, setStyle] = useState(""); const [servings, setServings] = useState(2); const [out, setOut] = useState<GenRecipe[] | null>(null); const [busy, setBusy] = useState(false); const [open, setOpen] = useState(0);
  const go = () => { setBusy(true); setTimeout(() => { setOut(generateRecipes(items, { meal, style: style || undefined, servings, diet: me.diet, difficulty: me.level === "Beginner" ? "Easy" : "Medium" })); setBusy(false); setOpen(0); }, 500); };
  return (
    <Modal open onClose={onClose} title="Create my recipe" wide>
      <div className="mb-3 flex flex-wrap gap-1.5">{MEALS.map((m) => <button key={m} onClick={() => setMeal(m)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${meal === m ? "bg-charcoal text-ivory" : "bg-cream"}`}>{m}</button>)}</div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor="gs">Cooking style</label><select id="gs" className="input" value={style} onChange={(e) => setStyle(e.target.value)}><option value="">Let the chef decide</option>{COOKING_STYLES.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label className="label" htmlFor="gv">Servings</label><input id="gv" type="number" min={1} max={12} className="input" value={servings} onChange={(e) => setServings(Math.max(1, Math.min(12, Number(e.target.value) || 1)))} /></div>
      </div>
      <button className="btn-primary w-full" onClick={go} disabled={busy}>{busy ? "Cooking up ideas…" : out ? "Regenerate" : "Generate 3 recipes"}</button>
      {busy && <div className="mt-4 space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-16" />)}</div>}
      {out && !busy && (
        <div className="mt-5 space-y-3">
          {out.map((g, i) => (
            <div key={i} className="rounded-2xl bg-white p-4 shadow-card">
              <button className="flex w-full items-center gap-3 text-left" onClick={() => setOpen(open === i ? -1 : i)}><span className="text-3xl">{g.emoji}</span><span className="flex-1"><b className="block">{g.title}</b><span className="text-xs text-brown">{g.prepMin + g.cookMin} min · {g.difficulty} · ~{Math.round(g.nutrition.calories)} kcal/serving (estimate)</span></span><span>{open === i ? "−" : "+"}</span></button>
              {open === i && (
                <div className="mt-3 border-t border-cream pt-3 text-sm">
                  <p className="text-brown">{g.description}</p>
                  {g.warnings.map((w) => <p key={w} className="mt-2 rounded-lg bg-orange-light/50 p-2 text-xs"><G g="⚠" /> {w}</p>)}
                  <h4 className="mt-3 font-semibold">Ingredients</h4><ul className="columns-2 text-brown">{g.ingredients.map((x) => <li key={x.name}>{x.amount} {x.name}</li>)}</ul>
                  <h4 className="mt-3 font-semibold">Method</h4><ol className="list-decimal space-y-1 pl-5 text-brown">{g.steps.map((s, k) => <li key={k}>{s.text}</li>)}</ol>
                  {g.allergens.length > 0 && <p className="mt-3 text-xs text-brown">Contains: {g.allergens.join(", ")}. Check labels; cross-contact can't be ruled out.</p>}
                  <button className="btn-dark mt-3" onClick={() => onSave(g)}>Save to My Cookbook</button>
                </div>
              )}
            </div>
          ))}
          <p className="text-xs text-brown">{DISCLAIMER_TASTE} Recipes are generated by CRUNCH's built-in engine; check cooking temperatures and allergens before serving.</p>
        </div>
      )}
    </Modal>
  );
}
