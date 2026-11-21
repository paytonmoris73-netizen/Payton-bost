import { useState } from "react";
import { DISCLAIMER_ALLERGEN } from "../engine";
import { GOALS, fmtIng, improve, parseIngredients, parseSteps, type Goal, type Improvement } from "../improve";
import { hasSubs, substitutesFor } from "../substitutions";
import { useMe } from "../store";
import { toast } from "../ui";

export function ImproveTool() {
  const me = useMe()!;
  const [title, setTitle] = useState(""); const [ing, setIng] = useState(""); const [steps, setSteps] = useState(""); const [goals, setGoals] = useState<Goal[]>([]);
  const [res, setRes] = useState<{ orig: { title: string; ing: string[]; steps: string[] }; out: Improvement } | null>(null);
  const tog = (g: Goal) => setGoals((p) => (p.includes(g) ? p.filter((x) => x !== g) : [...p, g]));
  const run = () => {
    const d = { title: title.trim() || "My recipe", ingredients: parseIngredients(ing), steps: parseSteps(steps) };
    if (d.ingredients.length < 2) return toast("Enter at least two ingredients, one per line.", "err");
    setRes({ orig: { title: d.title, ing: d.ingredients.map(fmtIng), steps: d.steps }, out: improve(d, goals, { allergies: me.allergies }) });
  };
  const copy = () => { if (!res) return; const o = res.out.improved; navigator.clipboard?.writeText(`${o.title} (improved)\n\nIngredients\n${o.ingredients.map(fmtIng).join("\n")}\n\nMethod\n${o.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`).then(() => toast("Improved recipe copied"), () => toast("Couldn't copy", "err")); };
  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <div className="card space-y-3 p-5">
        <div><label className="label" htmlFor="it">Recipe name</label><input id="it" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} /></div>
        <div><label className="label" htmlFor="ii">Ingredients (one per line)</label><textarea id="ii" className="input" rows={7} value={ing} onChange={(e) => setIng(e.target.value)} placeholder={"2 chicken breast\n1 cup cream\n2 tbsp honey"} /></div>
        <div><label className="label" htmlFor="is">Method (one step per line)</label><textarea id="is" className="input" rows={6} value={steps} onChange={(e) => setSteps(e.target.value)} placeholder={"Cook the chicken until golden.\nAdd the cream."} /></div>
        <div><span className="label">What would you like to change?</span><div className="flex flex-wrap gap-1.5">{GOALS.map((g) => <button key={g.id} type="button" aria-pressed={goals.includes(g.id)} onClick={() => tog(g.id)} className={`rounded-full px-3 py-1 text-xs font-semibold ${goals.includes(g.id) ? "bg-sage" : "bg-cream"}`}>{g.label}</button>)}</div></div>
        <button className="btn-primary w-full" onClick={run}>Analyse and improve</button>
        <p className="text-xs text-brown">Built-in rules engine, not a language model. Your original is never changed.</p>
      </div>
      <div className="space-y-4">
        {!res && <div className="card px-6 py-14 text-center"><h3 className="h-display text-2xl">Paste a recipe to get specific feedback</h3><p className="mx-auto mt-1 max-w-sm text-sm text-brown">I check seasoning, balance, missing quantities and unclear steps, then apply the changes you pick.</p></div>}
        {res && <>
          <div className="card p-5"><h3 className="h-display text-xl">What I noticed</h3>
            {res.out.findings.length === 0 ? <p className="mt-2 text-sm text-brown">No obvious problems found.</p> : <ul className="mt-2 space-y-1.5 text-sm">{res.out.findings.map((f, i) => <li key={i} className="flex gap-2"><span className={`chip ${f.level === "issue" ? "bg-orange-light" : "bg-sage-light"}`}>{f.level === "issue" ? "Issue" : "Tip"}</span><span>{f.text}</span></li>)}</ul>}</div>
          {res.out.changes.length > 0 && <div className="card p-5"><h3 className="h-display text-xl">Changes made</h3><ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-brown">{res.out.changes.map((c, i) => <li key={i}>{c}</li>)}</ul></div>}
          {res.out.unchanged.length > 0 && <div className="card p-5"><h3 className="h-display text-xl">Needs your attention</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-brown">{res.out.unchanged.map((c, i) => <li key={i}>{c}</li>)}</ul></div>}
          {goals.length === 0 && <p className="rounded-xl bg-cream p-3 text-sm">Pick one or more goals above and run again to get an improved version.</p>}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card p-5"><h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-brown">Original</h3><b>{res.orig.title}</b>
              <ul className="mt-2 space-y-0.5 text-sm">{res.orig.ing.map((x, i) => <li key={i}>• {x}</li>)}</ul><ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-brown">{res.orig.steps.map((x, i) => <li key={i}>{x}</li>)}</ol></div>
            <div className="card border-sage p-5 ring-1 ring-sage"><h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-brown">Improved</h3><b>{res.out.improved.title}</b>
              <ul className="mt-2 space-y-0.5 text-sm">{res.out.improved.ingredients.map((x, i) => <li key={i}>• {fmtIng(x)}</li>)}</ul><ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-brown">{res.out.improved.steps.map((x, i) => <li key={i}>{x}</li>)}</ol>
              <button className="btn-ghost mt-4 !py-1.5" onClick={copy}>Copy improved recipe</button></div>
          </div>
          <p className="text-xs text-brown">{DISCLAIMER_ALLERGEN} Re-check quantities and cooking times after any swap.</p>
        </>}
      </div>
    </div>
  );
}

export function SubstituteTool() {
  const me = useMe()!; const [q, setQ] = useState(""); const [allergies, setAllergies] = useState(me.allergies.join(", ")); const [useDiet, setUseDiet] = useState(true);
  const alg = allergies.split(",").map((s) => s.trim()).filter(Boolean);
  const r = q.trim() ? substitutesFor(q, { allergies: alg, diet: useDiet ? me.diet : [] }) : null;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="card space-y-3 p-5">
        <div><label className="label" htmlFor="sq">Ingredient to replace</label><input id="sq" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="butter, egg, heavy cream, soy sauce…" /></div>
        <div><label className="label" htmlFor="sa">Allergies to avoid (comma separated)</label><input id="sa" className="input" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="soy, tree nuts" /></div>
        {me.diet.length > 0 && <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-orange" checked={useDiet} onChange={(e) => setUseDiet(e.target.checked)} />Respect my dietary preferences ({me.diet.join(", ")})</label>}
      </div>
      {r && !hasSubs(q) && <div className="card p-5 text-sm text-brown">I don't have a tested substitution for “{q}” yet. Try a common ingredient such as butter, milk, egg, cream, honey, sugar, flour, soy sauce, or a meat.</div>}
      {r && r.ok.map((s) => (
        <div key={s.with} className="card p-5"><h3 className="font-semibold">{s.with}</h3><p className="text-sm text-brown">Use {s.amount}</p>
          <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2"><div><dt className="inline font-semibold">Taste: </dt><dd className="inline text-brown">{s.taste}</dd></div><div><dt className="inline font-semibold">Texture: </dt><dd className="inline text-brown">{s.texture}</dd></div>
            <div className="sm:col-span-2"><dt className="inline font-semibold">Process: </dt><dd className="inline text-brown">{s.process}</dd></div>
            <div className="sm:col-span-2"><dt className="inline font-semibold">Allergens it contains: </dt><dd className="inline text-brown">{s.allergens.length ? s.allergens.join(", ") : "none listed. Always check the label."}</dd></div></dl></div>
      ))}
      {r && r.blocked.length > 0 && <div className="card p-5"><h3 className="font-semibold">Not suggested for you</h3><ul className="mt-2 space-y-1 text-sm text-brown">{r.blocked.map((b) => <li key={b.sub.with}><b>{b.sub.with}</b>: {b.reason}</li>)}</ul></div>}
      {r && hasSubs(q) && r.ok.length === 0 && <div className="card p-5 text-sm text-brown">Every substitute I know for this conflicts with your allergies or diet. Please check with a dietitian or look for a labelled allergen-free product.</div>}
      <p className="text-xs text-brown">{DISCLAIMER_ALLERGEN}</p>
    </div>
  );
}
