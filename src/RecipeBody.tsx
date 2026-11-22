import { ReportDialog } from "./safetyUi";
import { useState } from "react";
import { G } from "./icons";
import { Link, useNavigate } from "react-router-dom";
import { DISCLAIMER_TASTE, totalMin } from "./engine";
import type { GenRecipe } from "./engine";
import { creditFor } from "./photos";
import { creatorOf, useMe, useStore, uid } from "./store";
import { AllergenNote, Cover, Modal, NutritionPanel, SaveButton, StarPicker, Stars, toast } from "./ui";
import type { CookStatus, Recipe } from "./types";
import { Select } from "./glass";

export function scaleAmount(a: string, f: number): string {
  if (f === 1) return a;
  const m = a.match(/^(\d+(?:\.\d+)?)(?:\s*\/\s*(\d+))?(.*)$/);
  if (!m) return a;
  const v = m[2] ? Number(m[1]) / Number(m[2]) : Number(m[1]);
  const n = Math.round(v * f * 100) / 100;
  return `${n}${m[3]}`;
}

export function genToRecipe(g: GenRecipe, creatorId: string): Recipe {
  const { warnings: _w, ...rest } = g; void _w;
  return { ...rest, id: "my_" + uid(), creatorId, hue: (g.emoji.codePointAt(0)! % 360), price: 0, rating: 0, reviews: 0, sales: 0, views: 0, status: "draft", createdAt: new Date().toISOString(), ai: true };
}

export function RecipeBody({ r, preview }: { r: Recipe; preview?: boolean }) {
  const nav = useNavigate(); const me = useMe();
  const [servings, setServings] = useState(r.servings || 1);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [folderOpen, setFolderOpen] = useState(false); const [reportOpen, setReportOpen] = useState(false);
  const { folders, toggleInFolder, favorites, toggleFav, lists, addToList, createList, markCooked, accounts, notes, setNote, cookStatus, setCookStatus, reviews, addReview, cooked } = useStore();
  const [rating, setRating] = useState(5); const [text, setText] = useState("");
  const c = creatorOf(r.creatorId, accounts); const factor = servings / Math.max(1, r.servings);
  const mine = r.creatorId === me?.id; const rs = reviews.filter((x) => x.recipeId === r.id);
  const addAll = () => {
    const id = lists[0]?.id ?? createList("Groceries");
    addToList(id, r.ingredients.map((i) => ({ name: i.name, qty: scaleAmount(i.amount, factor) })));
    toast("Ingredients added to your shopping list");
  };
  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <div className="relative overflow-hidden rounded-3xl"><Cover id={r.id} photo={r.photo} emoji={r.emoji} hue={r.hue} className="aspect-[4/3]" size="text-[9rem]" /><SaveButton id={r.id} className="absolute right-4 top-4" /></div>{creditFor(r.id) && <p className="mt-1 text-xs text-brown">Photo: {creditFor(r.id)!.by} ({creditFor(r.id)!.license})</p>}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="chip"><G g="⏱" /> {totalMin(r)} min total</span><span className="chip">Prep {r.prepMin}m</span><span className="chip">Cook {r.cookMin}m</span><span className="chip">{r.difficulty}</span><span className="chip">{r.cuisine}</span>
          {r.ai && <span className="chip bg-sage-light">AI-assisted draft</span>}
        </div>
        <h1 className="h-display mt-3 text-4xl">{r.title}</h1>
        <div className="mt-2 flex items-center gap-3 text-sm"><Link to={`/creator/${c.id}`} className="font-semibold hover:underline">{c.emoji} {c.name}</Link>{r.reviews > 0 && <><Stars value={r.rating} /><span className="text-brown">{r.rating.toFixed(1)} ({r.reviews})</span></>}</div>
        <p className="mt-3 text-brown">{r.description}</p>
        {r.ai && <p className="mt-2 text-xs text-brown">{DISCLAIMER_TASTE}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          {!preview && <button className="btn-primary" onClick={() => nav(`/cook/${r.id}`)}><G g="▶" /> Start cooking</button>}
          <button className="btn-ghost" onClick={addAll}><G g="🛒" /> Add to shopping list</button>
          <button className="btn-ghost" onClick={() => toggleFav(r.id)}>{favorites.includes(r.id) ? <><G g="★" /> Favourite</> : <><G g="☆" /> Favourite</>}</button>
          <button className="btn-ghost" onClick={() => setFolderOpen(true)}><G g="📁" /> Add to folder</button>
          {!preview && <button className="btn-ghost" onClick={() => { markCooked(r.id); toast("Marked as cooked (+XP)"); }}><G g="✅" /> I cooked this{cooked.filter((x) => x.id === r.id).length ? ` (${cooked.filter((x) => x.id === r.id).length})` : ""}</button>}
          {!mine && !preview && <button className="btn-outline" onClick={() => setReportOpen(true)}>Report</button>}
          {mine && <Link className="btn-outline" to={`/creator/edit/${r.id}`}>Edit</Link>}
        </div>
      </div>

      <div className="space-y-6">
        {!preview && (
          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="h-display text-2xl">My notes</h2>
              <Select className="!w-auto !py-1.5" label="Cooking status" value={cookStatus[r.id] ?? ""} onChange={(v) => setCookStatus(r.id, (v || null) as CookStatus | null)} options={[{ value: "", label: "No status" }, { value: "want", label: "Want to try" }, { value: "planned", label: "Planned" }, { value: "cooked", label: "Cooked" }, { value: "favorite", label: "Favorite" }]} /></div>
            <textarea className="input mt-3" rows={3} maxLength={2000} placeholder="Private notes: “added extra garlic”, “needed 10 more minutes”…" value={notes[r.id] ?? ""} onChange={(e) => setNote(r.id, e.target.value)} aria-label="Private notes" />
            <p className="mt-1 text-xs text-brown">Only you can see this. Notes are never shown publicly.</p>
          </div>
        )}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="h-display text-2xl">Ingredients</h2>
            <div className="flex items-center gap-2 text-sm"><button className="grid h-8 w-8 place-items-center rounded-full bg-cream" onClick={() => setServings(Math.max(1, servings - 1))} aria-label="Fewer servings">−</button><span className="w-20 text-center font-semibold">{servings} serving{servings > 1 ? "s" : ""}</span><button className="grid h-8 w-8 place-items-center rounded-full bg-cream" onClick={() => setServings(servings + 1)} aria-label="More servings">+</button></div></div>
          <ul className="divide-y divide-cream">{r.ingredients.map((i) => (
            <li key={i.name}><label className="flex cursor-pointer items-center gap-3 py-2.5 text-sm"><input type="checkbox" className="h-4 w-4 accent-orange" checked={!!checked[i.name]} onChange={() => setChecked((p) => ({ ...p, [i.name]: !p[i.name] }))} /><span className={`flex-1 transition ${checked[i.name] ? "text-brown-light line-through" : ""}`}>{i.name}</span><span className="text-brown">{scaleAmount(i.amount, factor)}</span></label></li>
          ))}</ul>
          {r.equipment.length > 0 && <p className="mt-3 text-xs text-brown"><b>Equipment:</b> {r.equipment.join(", ")}</p>}
        </div>

        <div className="card p-5">
          <h2 className="h-display mb-3 text-2xl">Method</h2>
          <ol className="space-y-4">{r.steps.map((s, i) => <li key={i} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-charcoal text-xs font-bold text-ivory">{i + 1}</span><div><p className="text-sm leading-relaxed">{s.text}</p>{s.timerMin && <span className="mt-1 inline-block text-xs text-brown"><G g="⏲" /> {s.timerMin >= 60 ? `${Math.round(s.timerMin / 6) / 10} h` : `${s.timerMin} min`}</span>}</div></li>)}</ol>
        </div>

        <div className="card space-y-4 p-5">
          <NutritionPanel n={r.nutrition} servings={r.servings} />
          <AllergenNote allergens={r.allergens} diet={r.diet} />
          {r.substitutions.length > 0 && <div><h4 className="mb-1 font-semibold">Substitutions</h4><ul className="list-disc pl-5 text-sm text-brown">{r.substitutions.map((s) => <li key={s}>{s}</li>)}</ul></div>}
          <div><h4 className="mb-1 font-semibold">Storage</h4><p className="text-sm text-brown">{r.storage}</p></div>
        </div>

        {!preview && (
          <div className="card p-5">
            <h2 className="h-display mb-3 text-2xl">Reviews</h2>
            {rs.length === 0 && <p className="text-sm text-brown">No reviews yet.</p>}
            {rs.map((v) => <div key={v.id} className="border-b border-cream py-3 last:border-0"><div className="flex items-center gap-2 text-sm"><b>{v.userName}</b><Stars value={v.rating} />{v.verified && <span className="chip bg-sage-light">Verified purchase</span>}</div><p className="mt-1 text-sm text-brown">{v.text}</p></div>)}
            {!mine && (
              <form className="mt-4 space-y-2" onSubmit={(e) => { e.preventDefault(); const err = addReview(r.id, rating, text); if (err) toast(err, "err"); else { toast("Review posted"); setText(""); } }}>
                <StarPicker value={rating} onChange={setRating} />
                <textarea className="input" rows={2} placeholder="Share how it turned out…" value={text} onChange={(e) => setText(e.target.value)} maxLength={1500} />
                <button className="btn-dark">Post review</button>
                <p className="text-xs text-brown">Paid recipes can only be reviewed by verified buyers.</p>
              </form>
            )}
          </div>
        )}
      </div>

      <Modal open={folderOpen} onClose={() => setFolderOpen(false)} title="Add to folder">
        <div className="space-y-2">{folders.map((f) => <label key={f.id} className="flex items-center gap-3 rounded-xl bg-cream p-3 text-sm"><input type="checkbox" className="accent-orange" checked={f.recipeIds.includes(r.id)} onChange={() => toggleInFolder(f.id, r.id)} />{f.name}</label>)}{folders.length === 0 && <p className="text-sm text-brown">Create a folder in My Cookbook first.</p>}</div>
      </Modal>
      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} kind="listing" targetId={r.id} title="Report this recipe" allowCopyright />
    </div>
  );
}
