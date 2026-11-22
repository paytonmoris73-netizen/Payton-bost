import { ReportDialog, ScamWarning } from "../safetyUi";
import { useState } from "react";
import { G } from "../icons";
import { Link } from "react-router-dom";
import { CHALLENGES, CREATORS } from "../data";
import { matchScore } from "../engine";
import { useCatalogue, useIngredients, useMe, useStore } from "../store";
import { Avatar, Cover, Empty, Modal, PageHeader, Tabs, toast } from "../ui";
import type { Post } from "../types";
import { Select } from "../glass";

const TABS = ["Feed", "Following", "Challenges", "Leaderboards", "Creators"] as const;

function PostCard({ p }: { p: Post }) {
  const { likedPosts, savedPosts, repostedPosts, toggleLike, toggleSavePost, repost, addComment, votes, vote } = useStore(); const cat = useCatalogue();
  const [open, setOpen] = useState(false); const [c, setC] = useState(""); const [rep, setRep] = useState(false);
  const r = p.recipeId ? cat.find((x) => x.id === p.recipeId) : undefined; const ch = CHALLENGES.find((x) => x.id === p.challengeId);
  const share = async () => { const t = `${p.userName} on CRUNCH: ${p.text}`; try { if (navigator.share) await navigator.share({ text: t }); else { await navigator.clipboard.writeText(t); toast("Copied to clipboard"); } } catch { /* cancelled */ } };
  const Btn = ({ on, onClick, label, count }: { on?: boolean; onClick: () => void; label: string; count?: number }) => <button onClick={onClick} className="pick" aria-pressed={on}><span className="inline-flex items-center gap-1.5">{label.length <= 2 ? <G g={label} size={16} /> : label}{count !== undefined ? count : ""}</span></button>;
  return (
    <article className="card overflow-hidden">
      <div className="flex items-center gap-3 p-4"><Link to={`/creator/${p.userId}`}><Avatar emoji={p.userEmoji} size={40} /></Link><div className="flex-1"><Link to={`/creator/${p.userId}`} className="font-semibold">{p.userName}</Link><div className="text-xs text-brown">{p.createdAt}{ch && ` · Challenge: ${ch.title}`}</div></div><button className="text-xs text-brown underline" onClick={() => setRep(true)}>Report</button></div>
      <Cover emoji={p.emoji} hue={p.hue} className="h-56" size="text-8xl" />
      <div className="space-y-3 p-4">
        <p className="text-sm">{p.text}</p>
        {p.ingredients.length > 0 && <div className="flex flex-wrap gap-1.5">{p.ingredients.map((i) => <span key={i} className="chip">{i}</span>)}</div>}
        {r && <Link to={r.price > 0 ? `/marketplace/${r.id}` : `/recipe/${r.id}`} className="flex items-center gap-3 rounded-xl bg-cream p-3 text-sm"><span className="text-2xl">{r.emoji}</span><span className="flex-1"><b>{r.title}</b><span className="block text-xs text-brown">View recipe</span></span>→</Link>}
        <div className="flex flex-wrap gap-2"><Btn on={likedPosts.includes(p.id)} onClick={() => toggleLike(p.id)} label={likedPosts.includes(p.id) ? "♥" : "♡"} count={p.likes} /><Btn onClick={() => setOpen(!open)} label="💬" count={p.comments.length} /><Btn on={savedPosts.includes(p.id)} onClick={() => { toggleSavePost(p.id); }} label="🔖" count={p.saves} /><Btn on={repostedPosts.includes(p.id)} onClick={() => { repost(p.id); toast("Reposted"); }} label="🔁" count={p.reposts} /><Btn onClick={share} label="Share" />{ch && <Btn on={votes.includes(p.id)} onClick={() => { vote(p.id); }} label="🗳 Vote" />}</div>
        {open && <div className="space-y-2 border-t border-cream pt-3">{p.comments.map((k) => <p key={k.id} className="text-sm"><b>{k.userName}</b> {k.text}</p>)}<form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addComment(p.id, c); setC(""); }}><input className="input" placeholder="Add a comment…" value={c} onChange={(e) => setC(e.target.value)} maxLength={500} aria-label="Comment" /><button className="btn-dark">Post</button></form></div>}
      </div>
      <ReportDialog open={rep} onClose={() => setRep(false)} kind="post" targetId={p.id} title="Report post" />
    </article>
  );
}

function Composer({ onClose, challengeId }: { onClose: () => void; challengeId?: string }) {
  const me = useMe()!; const addPost = useStore((s) => s.addPost); const ings = useIngredients(); const cat = useCatalogue(); const join = useStore((s) => s.joinChallenge);
  const [text, setText] = useState(""); const [picked, setPicked] = useState<string[]>([]); const [q, setQ] = useState(""); const [recipe, setRecipe] = useState(""); const [emoji, setEmoji] = useState("🍽️");
  const sugg = q.trim() ? ings.filter((i) => !picked.includes(i.name) && matchScore(q, i.name) > 0).slice(0, 5) : [];
  const mine = cat.filter((r) => r.creatorId === me.id && r.status === "published");
  const submit = () => {
    if (text.trim().length < 5) return toast("Write a few words about your creation.", "err");
    const out = addPost({ text: text.trim().slice(0, 600), emoji, hue: (emoji.codePointAt(0) ?? 30) % 360, ingredients: picked, recipeId: recipe || undefined, challengeId });
    if (out.result === "blocked") return toast(out.message, "err");
    if (challengeId) join(challengeId); onClose(); toast(out.message);
  };
  return (
    <Modal open onClose={onClose} title={challengeId ? "Submit challenge entry" : "Share with the community"}>
      <textarea className="input mb-3" rows={3} placeholder="What did you make or discover?" value={text} onChange={(e) => setText(e.target.value)} maxLength={600} aria-label="Post text" />
      <div className="mb-3 flex flex-wrap gap-1.5">{["🍽️", "🍝", "🥗", "🍰", "🍜", "🍳", "🥘", "🍹"].map((e) => <button key={e} onClick={() => setEmoji(e)} aria-pressed={emoji === e} className={`press grid h-10 w-10 place-items-center rounded-[0.9rem] text-lg transition-[background,box-shadow] duration-300 ${emoji === e ? "sel-fill" : "tile"}`}>{e}</button>)}</div>
      <div className="mb-3"><div className="mb-1 flex flex-wrap gap-1.5">{picked.map((p) => <button key={p} className="chip bg-orange-light" onClick={() => setPicked(picked.filter((x) => x !== p))}>{p} <G g="✕" /></button>)}</div><input className="input" placeholder="Tag ingredients…" value={q} onChange={(e) => setQ(e.target.value)} /><div className="mt-1 flex flex-wrap gap-1.5">{sugg.map((i) => <button key={i.id} className="chip" onClick={() => { setPicked([...picked, i.name]); setQ(""); }}><G g="＋" /> {i.name}</button>)}</div></div>
      {mine.length > 0 && <div className="mb-3"><Select label="Link a recipe" value={recipe} onChange={setRecipe} options={[{ value: "", label: "Link one of your recipes (optional)" }, ...mine.map((r) => ({ value: r.id, label: r.title }))]} /></div>}
      <p className="mb-3 text-xs text-brown">Photo uploads are coming soon.</p>
      <div className="mb-3"><ScamWarning /></div>
      <button className="btn-primary w-full" onClick={submit}>Post</button>
    </Modal>
  );
}

export default function Community() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Feed"); const [compose, setCompose] = useState<string | null | undefined>(undefined);
  const { posts, following, votes, challengeJoined, toggleFollow } = useStore(); const cat = useCatalogue(); const me = useMe()!;
  const visible = posts.filter((p) => !p.hidden);
  const feed = tab === "Following" ? visible.filter((p) => following.includes(p.userId) || p.userId === me.id) : visible;
  const top = [...cat.filter((r) => r.status === "published" && !r.bundleOf)].sort((a, b) => b.sales + b.views / 10 - (a.sales + a.views / 10)).slice(0, 5);
  return (
    <div>
      <PageHeader title="Community" sub="Share creations, join weekly challenges and follow cooks you like." action={<button className="btn-primary" onClick={() => setCompose(null)}><G g="＋" /> Share something</button>} />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {(tab === "Feed" || tab === "Following") && (feed.length ? <div className="mx-auto grid max-w-2xl gap-5">{feed.map((p) => <PostCard key={p.id} p={p} />)}</div> : <Empty emoji="👥" title="Nothing here yet" text={tab === "Following" ? "Follow creators to see their posts here." : "Be the first to post."} />)}
      {tab === "Challenges" && (
        <div className="grid gap-4 md:grid-cols-3">{CHALLENGES.map((c) => { const entries = visible.filter((p) => p.challengeId === c.id).sort((a, b) => (b.likes + (votes.includes(b.id) ? 1 : 0)) - (a.likes + (votes.includes(a.id) ? 1 : 0))); const started = !c.endsIn.startsWith("Starts"); return (
          <div key={c.id} className="card p-5"><div className="text-4xl">{c.emoji}</div><h3 className="h-display mt-2 text-xl">{c.title}</h3><p className="mt-1 text-sm text-brown">{c.description}</p><p className="mt-2 text-xs font-semibold">{started ? `Ends in ${c.endsIn}` : c.endsIn} · {entries.length} entries</p><p className="mt-2 text-xs text-brown">{c.rule}</p>
            <button className="btn-primary mt-3 w-full" disabled={!started} onClick={() => setCompose(c.id)}>{challengeJoined.includes(c.id) ? "Submit another entry" : started ? "Join & submit" : "Not started"}</button>
            {entries[0] && <p className="mt-3 text-xs text-brown">Leading: <b>{entries[0].userName}</b> ({entries[0].likes} likes)</p>}</div>); })}
          <p className="text-xs text-brown md:col-span-3">Fair play: one vote per account per entry, voting on your own entry doesn't count toward XP, and moderators remove spam or unsafe entries.</p></div>
      )}
      {tab === "Leaderboards" && (
        <div className="grid gap-5 md:grid-cols-2">
          <Board title="Most helpful creators" rows={[...CREATORS].sort((a, b) => b.rating * Math.log(b.followers) - a.rating * Math.log(a.followers)).slice(0, 5).map((c) => ({ k: c.id, l: `${c.emoji} ${c.name}`, v: `${c.rating} rating`, to: `/creator/${c.id}` }))} />
          <Board title="Most popular recipes" rows={top.map((r) => ({ k: r.id, l: `${r.emoji} ${r.title}`, v: `${r.sales + Math.round(r.views / 10)} pts`, to: r.price > 0 ? `/marketplace/${r.id}` : `/recipe/${r.id}` }))} />
          <Board title="Community favourites" rows={[...visible].sort((a, b) => b.likes - a.likes).slice(0, 5).map((p) => ({ k: p.id, l: `${p.userEmoji} ${p.text.slice(0, 40)}…`, v: `${p.likes} likes`, to: "/community" }))} />
          <Board title="Weekly challenge winners" rows={CHALLENGES.slice(0, 1).flatMap((c) => visible.filter((p) => p.challengeId === c.id).sort((a, b) => b.likes - a.likes).slice(0, 3).map((p) => ({ k: p.id, l: `${p.userEmoji} ${p.userName}`, v: c.title, to: "/community" })))} />
          <p className="text-xs text-brown md:col-span-2">XP is capped per day and only awarded once per action to prevent farming.</p>
        </div>
      )}
      {tab === "Creators" && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{CREATORS.map((c) => <div key={c.id} className="card flex items-center gap-3 p-4"><Link to={`/creator/${c.id}`}><Avatar emoji={c.emoji} hue={c.hue} size={52} /></Link><Link to={`/creator/${c.id}`} className="min-w-0 flex-1"><b className="block truncate">{c.name}</b><span className="text-xs text-brown">{c.badges.join(" · ")}</span></Link><button onClick={() => toggleFollow(c.id)} className={following.includes(c.id) ? "btn-ghost !px-3 !py-1.5" : "btn-dark !px-3 !py-1.5"}>{following.includes(c.id) ? "Following" : "Follow"}</button></div>)}</div>}
      {compose !== undefined && <Composer onClose={() => setCompose(undefined)} challengeId={compose ?? undefined} />}
    </div>
  );
}
function Board({ title, rows }: { title: string; rows: { k: string; l: string; v: string; to: string }[] }) {
  return <div className="card p-5"><h3 className="h-display mb-3 text-xl">{title}</h3>{rows.length ? <ol className="space-y-2">{rows.map((r, i) => <li key={r.k}><Link to={r.to} className="flex items-center gap-3 text-sm"><span className="grid h-6 w-6 place-items-center rounded-full bg-cream text-xs font-bold">{i + 1}</span><span className="flex-1 truncate">{r.l}</span><span className="text-xs text-brown">{r.v}</span></Link></li>)}</ol> : <p className="text-sm text-brown">No entries yet.</p>}</div>;
}
