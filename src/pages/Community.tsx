import { ReportDialog } from "../safetyUi";
import { Composer } from "../Composer";
import { memo, useState } from "react";
import { G } from "../icons";
import { Link } from "react-router-dom";
import { ALL_RECIPES, CHALLENGES, CREATORS } from "../data";
import { useCatalogue, useMe, useStore } from "../store";
import { Avatar, Bump, Cover, Empty, PageHeader, Tabs, toast, UserFace } from "../ui";
import type { Post, Recipe } from "../types";
import { useMediaUrl } from "../media";
import { photoFor } from "../photos";
import { Icon } from "../icons";

/** A post's photo / video (or its linked recipe's photo, or the emoji plate). Tapping opens it in Bites. */
function PostMedia({ p, recipe }: { p: Post; recipe?: Recipe }) {
  const stored = useMediaUrl(p.media?.id);
  const still = p.media?.kind === "image" ? stored : photoFor(p.id) ?? (recipe ? photoFor(recipe.id, recipe.photo) : undefined);
  return (
    <Link to={`/bites?p=${p.id}`} className="group relative block h-56 overflow-hidden bg-cream sm:h-72" aria-label="Open in Bites">
      {p.media?.kind === "video" ? (stored ? <video src={stored + "#t=0.1"} className="h-full w-full object-cover" muted playsInline preload="metadata" /> : <div className="h-full w-full bite-ph" style={{ "--h": p.hue } as React.CSSProperties} />)
        : still ? <img src={still} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 [transition-timing-function:var(--ease-spring)] group-hover:scale-[1.03]" />
        : <Cover emoji={p.emoji} hue={p.hue} className="h-full" size="text-8xl" />}
      <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full glass-dark px-3 py-1.5 text-xs font-bold"><Icon n="play" size={13} fill /> {p.media?.kind === "video" ? "Watch" : "Bites"}</span>
    </Link>
  );
}

const TABS = ["Feed", "Following", "Challenges", "Leaderboards", "Creators"] as const;

/** Each card subscribes only to its own like/save/repost/vote state, so liking one post re-renders one card. */
const PostCard = memo(function PostCard({ p }: { p: Post }) {
  const liked = useStore((s) => s.likedPosts.includes(p.id)); const isSaved = useStore((s) => s.savedPosts.includes(p.id));
  const reposted = useStore((s) => s.repostedPosts.includes(p.id)); const voted = useStore((s) => s.votes.includes(p.id));
  const toggleLike = useStore((s) => s.toggleLike); const toggleSavePost = useStore((s) => s.toggleSavePost); const repost = useStore((s) => s.repost);
  const addComment = useStore((s) => s.addComment); const vote = useStore((s) => s.vote);
  const r = useStore((s) => (p.recipeId ? s.customRecipes.find((x) => x.id === p.recipeId) : undefined)) ?? (p.recipeId ? ALL_RECIPES.find((x) => x.id === p.recipeId) : undefined);
  const [open, setOpen] = useState(false); const [c, setC] = useState(""); const [rep, setRep] = useState(false);
  const ch = CHALLENGES.find((x) => x.id === p.challengeId);
  const share = async () => { const t = `${p.userName} on CRUNCH: ${p.text}`; try { if (navigator.share) await navigator.share({ text: t }); else { await navigator.clipboard.writeText(t); toast("Copied to clipboard"); } } catch { /* cancelled */ } };
  const Btn = ({ on, onClick, label, count }: { on?: boolean; onClick: () => void; label: string; count?: number }) => <button onClick={onClick} className="pick" aria-pressed={on} aria-label={label.length <= 2 ? `${({ "♥": "Liked", "♡": "Like", "💬": "Comments", "🔖": "Save", "🔁": "Repost" } as Record<string, string>)[label] ?? "Action"}${count !== undefined ? `, ${count}` : ""}` : undefined}><span className="inline-flex items-center gap-1.5">{label.length <= 2 ? <Bump on={on} className={on ? "text-orange-dark" : ""}><G g={label} size={16} /></Bump> : label}{count !== undefined ? count : ""}</span></button>;
  return (
    <article className="card overflow-hidden">
      <div className="flex items-center gap-3 p-4"><Link to={`/creator/${p.userId}`}><Avatar emoji={p.userEmoji} size={40} /></Link><div className="flex-1"><Link to={`/creator/${p.userId}`} className="font-semibold">{p.userName}</Link><div className="text-xs text-brown">{p.createdAt}{ch && ` · Challenge: ${ch.title}`}</div></div><button className="text-xs text-brown underline" onClick={() => setRep(true)}>Report</button></div>
      <PostMedia p={p} recipe={r} />
      <div className="space-y-3 p-4">
        <p className="text-sm">{p.text}</p>
        {p.ingredients.length > 0 && <div className="flex flex-wrap gap-1.5">{p.ingredients.map((i) => <span key={i} className="chip">{i}</span>)}</div>}
        {r && <Link to={r.price > 0 ? `/marketplace/${r.id}` : `/recipe/${r.id}`} className="flex items-center gap-3 rounded-xl bg-cream p-3 text-sm"><span className="text-2xl">{r.emoji}</span><span className="flex-1"><b>{r.title}</b><span className="block text-xs text-brown">View recipe</span></span>→</Link>}
        <div className="flex flex-wrap gap-2"><Btn on={liked} onClick={() => toggleLike(p.id)} label={liked ? "♥" : "♡"} count={p.likes} /><Btn onClick={() => setOpen(!open)} label="💬" count={p.comments.length} /><Btn on={isSaved} onClick={() => { toggleSavePost(p.id); }} label="🔖" count={p.saves} /><Btn on={reposted} onClick={() => { repost(p.id); toast("Reposted"); }} label="🔁" count={p.reposts} /><Btn onClick={share} label="Share" />{ch && <Btn on={voted} onClick={() => { vote(p.id); }} label="🗳 Vote" />}</div>
        {open && <div className="space-y-2 border-t border-cream pt-3">{p.comments.map((k) => <div key={k.id} className="flex items-start gap-2.5 text-sm"><UserFace userId={k.userId} name={k.userName} size={30} /><p className="min-w-0 flex-1 break-words pt-1"><b>{k.userName}</b> {k.text}</p></div>)}<form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addComment(p.id, c); setC(""); }}><input className="input" placeholder="Add a comment…" value={c} onChange={(e) => setC(e.target.value)} maxLength={500} aria-label="Comment" /><button className="btn-dark">Post</button></form></div>}
      </div>
      <ReportDialog open={rep} onClose={() => setRep(false)} kind="post" targetId={p.id} title="Report post" />
    </article>
  );
});


export default function Community() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Feed"); const [compose, setCompose] = useState<string | null | undefined>(undefined);
  const { posts, following, votes, challengeJoined, toggleFollow } = useStore(); const cat = useCatalogue(); const me = useMe()!;
  const visible = posts.filter((p) => !p.hidden);
  const feed = tab === "Following" ? visible.filter((p) => following.includes(p.userId) || p.userId === me.id) : visible;
  const top = [...cat.filter((r) => r.status === "published" && !r.bundleOf)].sort((a, b) => b.sales + b.views / 10 - (a.sales + a.views / 10)).slice(0, 5);
  return (
    <div>
      <PageHeader title="Community" sub="Share creations, join weekly challenges and follow cooks you like." action={<div className="flex flex-wrap gap-2"><Link to="/bites" className="btn-dark"><Icon n="play" size={15} fill /> Watch Bites</Link><button className="btn-primary" onClick={() => setCompose(null)}><G g="＋" /> Share something</button></div>} />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {(tab === "Feed" || tab === "Following") && (
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
          {feed.length ? <div className="mx-auto grid w-full max-w-2xl gap-5">{feed.map((p) => <PostCard key={p.id} p={p} />)}</div> : <Empty emoji="👥" title="Nothing here yet" text={tab === "Following" ? "Follow creators to see their posts here." : "Be the first to post."} />}
          {/* PC only: side rail so the wide screen isn't empty space */}
          <aside className="sticky top-24 hidden space-y-4 lg:block" aria-label="Community highlights">
            <div className="hero-fill rounded-[1.6rem] p-5 text-ivory">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange">Weekly challenge · {CHALLENGES[0].endsIn} left</p>
              <h2 className="h-display mt-1 text-xl">{CHALLENGES[0].title}</h2>
              <p className="mt-1 text-sm text-ivory/75">{CHALLENGES[0].description}</p>
              <button className="btn-primary mt-4 !py-2" onClick={() => setTab("Challenges")}>{challengeJoined.includes(CHALLENGES[0].id) ? "See entries →" : "Join the challenge →"}</button>
            </div>
            <div className="card p-5">
              <h2 className="h-display mb-3 text-lg">Cooks to follow</h2>
              <ul className="space-y-3">{CREATORS.filter((c) => !following.includes(c.id)).slice(0, 4).map((c) => (
                <li key={c.id} className="flex items-center gap-3">
                  <Link to={`/creator/${c.id}`}><Avatar emoji={c.emoji} hue={c.hue} size={40} /></Link>
                  <Link to={`/creator/${c.id}`} className="min-w-0 flex-1"><b className="block truncate text-sm">{c.name}</b><span className="text-xs text-brown">{(c.followers / 1000).toFixed(1)}k followers</span></Link>
                  <button className="btn-dark !px-3 !py-1.5 !text-xs" onClick={() => { toggleFollow(c.id); toast(`Following ${c.name}`); }}>Follow</button>
                </li>))}
                {CREATORS.every((c) => following.includes(c.id)) && <li className="text-sm text-brown">You follow everyone. Nice.</li>}
              </ul>
            </div>
            <Board title="Top recipes this week" rows={top.map((r) => ({ k: r.id, l: `${r.emoji} ${r.title}`, v: `${r.sales + Math.round(r.views / 10)} pts`, to: r.price > 0 ? `/marketplace/${r.id}` : `/recipe/${r.id}` }))} />
          </aside>
        </div>
      )}
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
  return <div className="card p-5"><h2 className="h-display mb-3 text-xl">{title}</h2>{rows.length ? <ol className="space-y-2">{rows.map((r, i) => <li key={r.k}><Link to={r.to} className="flex items-center gap-3 text-sm"><span className="grid h-6 w-6 place-items-center rounded-full bg-cream text-xs font-bold">{i + 1}</span><span className="flex-1 truncate">{r.l}</span><span className="text-xs text-brown">{r.v}</span></Link></li>)}</ol> : <p className="text-sm text-brown">No entries yet.</p>}</div>;
}
