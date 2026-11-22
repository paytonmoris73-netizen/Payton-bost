import { useState } from "react";
import { G } from "../icons";
import { INGREDIENTS } from "../data";
import { matchScore } from "../engine";
import { scaleAmount } from "../RecipeBody";
import { canAccess, useCatalogue, useMe, useOwnedIds, useStore } from "../store";
import { Empty, Modal, PageHeader, toast } from "../ui";

export default function Lists() {
  const me = useMe()!; const { lists, createList, deleteList, addToList, toggleItem, removeItem, setItemQty, clearChecked } = useStore(); const cat = useCatalogue(); const owned = useOwnedIds();
  const [sel, setSel] = useState(lists[0]?.id ?? ""); const [name, setName] = useState(""); const [item, setItem] = useState(""); const [imp, setImp] = useState(false);
  const list = lists.find((l) => l.id === sel) ?? lists[0];
  const groups = list ? Object.entries(list.items.reduce<Record<string, typeof list.items>>((a, i) => ((a[i.category] ??= []).push(i), a), {})) : [];
  const sugg = item.trim() ? INGREDIENTS.filter((i) => matchScore(item, i.name) > 0).slice(0, 5) : [];
  const text = () => list ? `${list.name}\n` + list.items.map((i) => `${i.checked ? "[x]" : "[ ]"} ${i.qty} ${i.name}`).join("\n") : "";
  const share = async () => { try { if (navigator.share) await navigator.share({ title: list.name, text: text() }); else { await navigator.clipboard.writeText(text()); toast("List copied to clipboard"); } } catch { /* cancelled */ } };
  const exportCsv = () => { const csv = "Item,Quantity,Category,Done\n" + list.items.map((i) => [i.name, i.qty, i.category, i.checked].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `${list.name}.csv`; a.click(); URL.revokeObjectURL(a.href); };
  const importable = cat.filter((r) => r.status === "published" && !r.bundleOf && canAccess(r, owned, me.id));
  return (
    <div>
      <PageHeader title="Shopping Lists" sub="Build lists by hand or import ingredients straight from recipes." />
      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <div className="space-y-2">
          {lists.map((l) => <button key={l.id} onClick={() => setSel(l.id)} className={`press flex w-full items-center justify-between rounded-[1.1rem] px-4 py-3 text-left text-sm font-semibold transition-colors duration-300 ${list?.id === l.id ? "bg-gradient-to-b from-[#3A3731] to-charcoal text-ivory shadow-[inset_0_1px_0_rgba(255,255,255,.14),0_8px_18px_-10px_rgba(37,35,31,.6)]" : "tile"}`}>{l.name}<span className="text-xs opacity-70">{l.items.filter((i) => !i.checked).length}</span></button>)}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim().length < 2) return toast("Name your list.", "err"); setSel(createList(name.trim().slice(0, 40))); setName(""); }}><input className="input" placeholder="New list…" value={name} onChange={(e) => setName(e.target.value)} aria-label="New list name" /><button className="btn-dark"><G g="＋" /></button></form>
        </div>
        {!list ? <Empty emoji="🛒" title="No lists yet" text="Create your first list." /> : (
          <div className="card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="h-display text-2xl">{list.name}</h2>
              <div className="flex flex-wrap gap-2"><button className="btn-ghost !py-1.5" onClick={() => setImp(true)}>Import from recipe</button><button className="btn-ghost !py-1.5" onClick={share}>Share</button><button className="btn-ghost !py-1.5" onClick={exportCsv} disabled={!list.items.length}>Export CSV</button><button className="btn-ghost !py-1.5" onClick={() => window.print()}>Print</button></div></div>
            <form className="relative mb-4" onSubmit={(e) => { e.preventDefault(); const t = item.trim(); if (!t) return; addToList(list.id, [{ name: t.slice(0, 60) }]); setItem(""); }}>
              <div className="flex gap-2"><input className="input" placeholder="Add an item…" value={item} onChange={(e) => setItem(e.target.value)} aria-label="Add item" /><button className="btn-primary">Add</button></div>
              {sugg.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{sugg.map((s) => <button type="button" key={s.id} className="chip hover:bg-orange-light" onClick={() => { addToList(list.id, [{ name: s.name, category: s.category }]); setItem(""); }}><G g="＋" /> {s.emoji} {s.name}</button>)}</div>}
            </form>
            {list.items.length === 0 ? <p className="py-8 text-center text-sm text-brown">This list is empty.</p> : groups.map(([g, items]) => (
              <div key={g} className="mb-4"><h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-brown">{g}</h3>
                <ul className="divide-y divide-cream">{items.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 py-2.5"><input type="checkbox" className="h-5 w-5 accent-orange transition" checked={i.checked} onChange={() => toggleItem(list.id, i.id)} aria-label={`Mark ${i.name} done`} /><span className={`flex-1 text-sm transition-all duration-300 ${i.checked ? "text-brown-light line-through" : ""}`}>{i.name}</span><input className="w-20 rounded-lg border border-cream-dark px-2 py-1 text-xs" value={i.qty} onChange={(e) => setItemQty(list.id, i.id, e.target.value.slice(0, 20))} aria-label={`${i.name} quantity`} /><button className="text-brown-light hover:text-red-600" onClick={() => removeItem(list.id, i.id)} aria-label={`Remove ${i.name}`}><G g="✕" /></button></li>))}</ul></div>))}
            <div className="mt-4 flex justify-between border-t border-cream pt-3 text-sm"><button className="font-semibold text-brown" onClick={() => clearChecked(list.id)} disabled={!list.items.some((i) => i.checked)}>Clear checked</button>{lists.length > 1 && <button className="text-brown underline" onClick={() => { if (confirm(`Delete “${list.name}”?`)) { deleteList(list.id); setSel(""); } }}>Delete list</button>}</div>
          </div>
        )}
      </div>
      <Modal open={imp} onClose={() => setImp(false)} title="Import from a recipe">
        <p className="mb-3 text-xs text-brown">Only recipes you can access are listed (free, purchased or your own).</p>
        <div className="max-h-80 space-y-1.5 overflow-y-auto">{importable.map((r) => <button key={r.id} className="flex w-full items-center gap-3 rounded-xl bg-cream p-3 text-left text-sm hover:bg-cream-dark" onClick={() => { addToList(list!.id, r.ingredients.map((i) => ({ name: i.name, qty: scaleAmount(i.amount, 1) }))); setImp(false); toast(`Added ${r.ingredients.length} ingredients`); }}><span className="text-2xl">{r.emoji}</span><span className="flex-1 font-semibold">{r.title}</span><span className="text-xs text-brown">{r.ingredients.length} items</span></button>)}</div>
      </Modal>
    </div>
  );
}
