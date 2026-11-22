import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "../icons";
import { INGREDIENTS } from "../data";
import { photoFor } from "../photos";
import { useMediaUrl } from "../media";
import { useCatalogue, useMe, useStore } from "../store";
import { Avatar, Bump, Empty, Modal, toast, useDone, UserFace } from "../ui";
import { ReportDialog } from "../safetyUi";
import { Composer } from "../Composer";
import type { Post, Recipe } from "../types";

/* Bites: Crunch's take on Shorts. One dish per screen, swipe up for the next.
   The twist: every Bite is cookable. "Yum" (double tap), grab its ingredients for your list, remix it in the
   Combiner, or open the recipe. Media far from the screen isn't mounted, and only the visible video plays. */

const fmt = (n: number) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : String(n));
const ingId = (name: string) => INGREDIENTS.find((i) => i.name.toLowerCase() === name.toLowerCase())?.id;

function Media({ p, recipe, active, near, muted, onTime }: { p: Post; recipe?: Recipe; active: boolean; near: boolean; muted: boolean; onTime: (f: number) => void }) {
  const stored = useMediaUrl(near ? p.media?.id : undefined);
  const still = photoFor(p.id) ?? (recipe ? photoFor(recipe.id, recipe.photo) : undefined);
  const vid = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = vid.current; if (!v) return;
    if (active) { v.play().catch(() => undefined); } else { v.pause(); v.currentTime = 0; onTime(0); }
  }, [active, stored, onTime]);
  if (!near) return <div className="absolute inset-0 bite-ph" style={{ "--h": p.hue } as CSSProperties} />;
  if (p.media?.kind === "video") {
    return stored
      ? <video ref={vid} src={stored} className="absolute inset-0 h-full w-full object-cover" muted={muted} loop playsInline preload="metadata" onTimeUpdate={(e) => { const v = e.currentTarget; if (v.duration) onTime(v.currentTime / v.duration); }} />
      : <div className="absolute inset-0 bite-ph" style={{ "--h": p.hue } as CSSProperties} />;
  }
  const src = p.media?.kind === "image" ? stored : still;
  if (src) return <img src={src} alt="" className={`absolute inset-0 h-full w-full object-cover ${active ? "kenburns" : ""}`} decoding="async" draggable={false} />;
  return (
    <div className="absolute inset-0 bite-ph" style={{ "--h": p.hue } as CSSProperties}>
      <div className="absolute left-1/2 top-[42%] grid aspect-square w-[min(64%,320px)] -translate-x-1/2 -translate-y-1/2 place-items-center">
        <span className="cover-plate bite-plate" aria-hidden /><span className="cover-food relative text-[7rem]" aria-hidden>{p.emoji}</span>
      </div>
    </div>
  );
}

function Rail({ p, onComments, onShare, onGrab, grabbed, onRemix, onReport, liked, saved, onLike, onSave, className = "" }: {
  p: Post; onComments: () => void; onShare: () => void; onGrab: (e: React.MouseEvent<HTMLElement>) => void; grabbed: boolean; onRemix: () => void; onReport: () => void;
  liked: boolean; saved: boolean; onLike: () => void; onSave: () => void; className?: string;
}) {
  const B = ({ icon, label, on, onClick, fill, title }: { icon: string; label: string; on?: boolean; onClick: (e: React.MouseEvent<HTMLElement>) => void; fill?: boolean; title: string }) => (
    <button type="button" onClick={onClick} aria-label={title} aria-pressed={on} className="press flex flex-col items-center gap-1 text-[11px] font-semibold">
      <span className={`bite-btn grid h-12 w-12 place-items-center rounded-full ${on ? "on" : ""}`}><Bump on={on}><Icon n={icon} size={22} fill={fill && on} /></Bump></span>{label}
    </button>
  );
  return (
    <div className={`bite-rail flex flex-col items-center gap-3.5 ${className}`}>
      <B icon="heart" label={fmt(p.likes)} on={liked} fill onClick={onLike} title={liked ? "Unlike" : "Like"} />
      <B icon="msg" label={fmt(p.comments.length)} onClick={onComments} title="Comments" />
      <B icon="bookmark" label="Save" on={saved} fill onClick={onSave} title={saved ? "Unsave" : "Save"} />
      {p.ingredients.length > 0 && <B icon="basket" label={grabbed ? "Added" : "Grab"} on={grabbed} onClick={onGrab} title="Add its ingredients to my shopping list" />}
      {p.ingredients.some(ingId) && <B icon="combine" label="Remix" onClick={onRemix} title="Remix these ingredients in the Food Combiner" />}
      <B icon="share" label="Share" onClick={onShare} title="Share" />
      <button type="button" onClick={onReport} className="min-h-8 px-2 text-[11px] font-semibold underline opacity-80">Report</button>
    </div>
  );
}

function Bite({ p, index, total, active, near, muted, setMuted }: { p: Post; index: number; total: number; active: boolean; near: boolean; muted: boolean; setMuted: (m: boolean) => void }) {
  const nav = useNavigate(); const cat = useCatalogue();
  const { likedPosts, savedPosts, toggleLike, toggleSavePost, lists, addToList, createList, following, toggleFollow } = useStore(); const me = useMe()!;
  const recipe = p.recipeId ? cat.find((r) => r.id === p.recipeId) : undefined;
  const liked = likedPosts.includes(p.id), saved = savedPosts.includes(p.id);
  const [comments, setComments] = useState(false); const [rep, setRep] = useState(false); const [more, setMore] = useState(false);
  const [grabbed, fireGrab] = useDone(2200); const [progress, setProgress] = useState(0); const [paused, setPaused] = useState(false);
  const [yum, setYum] = useState(0); const lastTap = useRef(0);
  const onTime = useCallback((f: number) => setProgress(f), []);
  const isVideo = p.media?.kind === "video";

  const like = () => toggleLike(p.id);
  const tap = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button,a")) return;
    const now = Date.now();
    if (now - lastTap.current < 300) { setYum((n) => n + 1); if (!liked) like(); lastTap.current = 0; return; }   // double tap = Yum
    lastTap.current = now;
    if (isVideo) { const v = (e.currentTarget as HTMLElement).querySelector("video"); if (v) { if (v.paused) { v.play().catch(() => undefined); setPaused(false); } else { v.pause(); setPaused(true); } } }
  };
  useEffect(() => { if (!active) setPaused(false); }, [active]);
  const grab = () => {
    const id = lists[0]?.id ?? createList("Groceries");
    addToList(id, p.ingredients.map((name) => ({ name, category: INGREDIENTS.find((i) => i.name === name)?.category })));
    fireGrab(); toast(`${p.ingredients.length} ingredient${p.ingredients.length === 1 ? "" : "s"} added to your shopping list`);
  };
  const remix = () => nav(`/combiner?ing=${p.ingredients.map(ingId).filter(Boolean).join(",")}`);
  const share = async () => { const t = `${p.userName} on Crunch: ${p.text}`; try { if (navigator.share) await navigator.share({ text: t }); else { await navigator.clipboard.writeText(t); toast("Copied to clipboard"); } } catch { /* cancelled */ } };
  const rail = { p, liked, saved, grabbed, onLike: like, onSave: () => { toggleSavePost(p.id); toast(saved ? "Removed from saved" : "Saved"); }, onComments: () => setComments(true), onShare: share, onGrab: grab, onRemix: remix, onReport: () => setRep(true) };
  const mine = p.userId === me.id; const follows = following.includes(p.userId);

  return (
    <section data-i={index} className="bite-slide relative flex h-full snap-start snap-always items-center justify-center md:gap-5" aria-label={`Bite ${index + 1} of ${total} by ${p.userName}`}>
      <div className="bite-frame relative h-full w-full overflow-hidden md:aspect-[9/16] md:h-[calc(100%-1.5rem)] md:w-auto md:rounded-[1.75rem]" onPointerUp={tap}>
        <Media p={p} recipe={recipe} active={active} near={near} muted={muted} onTime={onTime} />
        <div className="bite-shade pointer-events-none absolute inset-0" aria-hidden />
        {yum > 0 && <span key={yum} className="yum-burst pointer-events-none absolute left-1/2 top-1/2" aria-hidden><span className="yum-face">😋</span>{["🔥", "✨", "🧡", "✨", "🔥"].map((e, i) => <i key={i} style={{ "--a": `${-70 + i * 35}deg` } as CSSProperties}>{e}</i>)}</span>}
        {isVideo && paused && <span className="pop-in pointer-events-none absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full glass-dark" aria-hidden><Icon n="play" size={26} fill /></span>}
        {isVideo && <button type="button" onClick={() => setMuted(!muted)} className="press absolute right-3 top-[calc(env(safe-area-inset-top,0px)+4.25rem)] grid h-10 w-10 place-items-center rounded-full glass-dark md:top-3" aria-label={muted ? "Turn sound on" : "Mute"}><Icon n={muted ? "mute" : "sound"} size={19} /></button>}

        {/* caption + the cookable twist */}
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4 pb-[calc(env(safe-area-inset-bottom,0px)+6.5rem)] text-[#fff] md:pb-5">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2.5">
              <Link to={`/creator/${p.userId}`} className="rounded-full ring-2 ring-[#fff]/80"><Avatar emoji={p.userEmoji} size={38} /></Link>
              <Link to={`/creator/${p.userId}`} className="flex min-h-8 min-w-0 items-center truncate font-bold drop-shadow">{p.userName}</Link>
              {!mine && <button type="button" onClick={() => toggleFollow(p.userId)} className={`press min-h-8 rounded-full px-3 py-1 text-xs font-bold ${follows ? "bg-[#fff]/20 text-[#fff]" : "bg-[#fff] text-[#25231F]"}`}><Bump on={follows}>{follows ? "Following" : "Follow"}</Bump></button>}
            </div>
            <p className={`text-sm leading-snug drop-shadow ${more ? "" : "line-clamp-2"}`} onClick={() => setMore(!more)}>{p.text}</p>
            {p.ingredients.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{p.ingredients.slice(0, 5).map((i) => <span key={i} className="shrink-0 rounded-full bg-[#fff]/20 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-0 bite-chip">{i}</span>)}</div>}
            {recipe && <Link to={recipe.price > 0 || recipe.bundleOf ? `/marketplace/${recipe.id}` : `/recipe/${recipe.id}`} className="press mt-3 inline-flex items-center gap-2 rounded-full accent-fill px-4 py-2 text-sm font-bold"><Icon n="chefhat" size={17} /> Cook this · {recipe.title.length > 22 ? recipe.title.slice(0, 21) + "…" : recipe.title}</Link>}
          </div>
          <Rail {...rail} className="shrink-0 text-[#fff] md:hidden" />
        </div>
        {isVideo && <div className="absolute inset-x-0 bottom-0 h-[3px] bg-[#fff]/25 md:rounded-b-[1.75rem]"><div className="h-full origin-left bg-orange transition-transform duration-300 ease-linear" style={{ transform: `scaleX(${progress})` }} /></div>}
      </div>
      <Rail {...rail} className="hidden text-charcoal md:flex" />

      <Modal open={comments} onClose={() => setComments(false)} title={`${p.comments.length} comment${p.comments.length === 1 ? "" : "s"}`}><BiteComments p={p} /></Modal>
      <ReportDialog open={rep} onClose={() => setRep(false)} kind="post" targetId={p.id} title="Report Bite" />
    </section>
  );
}

function BiteComments({ p }: { p: Post }) {
  const addComment = useStore((s) => s.addComment); const [c, setC] = useState("");
  return (
    <div>
      <div className="max-h-[50vh] space-y-3 overflow-y-auto">
        {p.comments.length === 0 && <p className="py-6 text-center text-sm text-brown">No comments yet. Be the first.</p>}
        {p.comments.map((k) => <div key={k.id} className="row-in flex items-start gap-2.5 text-sm"><UserFace userId={k.userId} name={k.userName} size={30} /><p className="min-w-0 flex-1 break-words pt-1"><b>{k.userName}</b> {k.text}</p></div>)}
      </div>
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!c.trim()) return; addComment(p.id, c); setC(""); }}><input className="input" placeholder="Add a comment…" value={c} onChange={(e) => setC(e.target.value)} maxLength={500} aria-label="Add a comment" /><button className="btn-dark">Post</button></form>
    </div>
  );
}

/** md+ renders Bites inside the page; phones get a full-screen layer on <body> (outside the animated page wrapper,
 *  whose transform would otherwise move a fixed layer mid-animation) with the page behind it locked. */
function useWide() {
  const q = "(min-width: 768px)"; const [w, setW] = useState(() => typeof matchMedia === "function" && matchMedia(q).matches);
  useEffect(() => { const m = matchMedia(q); const f = () => setW(m.matches); m.addEventListener?.("change", f); return () => m.removeEventListener?.("change", f); }, []);
  return w;
}

export default function Bites() {
  const wide = useWide();
  useEffect(() => { if (wide) return; const h = document.documentElement; const was = h.style.overflow; h.style.overflow = "hidden"; return () => { h.style.overflow = was; }; }, [wide]);
  const posts = useStore((s) => s.posts); const nav = useNavigate(); const [sp, setSp] = useSearchParams();
  const feed = useMemo(() => {
    const v = posts.filter((p) => !p.hidden);
    return [...v.filter((p) => p.media), ...v.filter((p) => !p.media)]; // real media first
  }, [posts]);
  const startId = sp.get("p");
  const [active, setActive] = useState(() => Math.max(0, feed.findIndex((p) => p.id === startId)));
  const [muted, setMuted] = useState(true); const scroller = useRef<HTMLDivElement>(null);
  const composing = sp.get("new") === "1";

  // which slide is on screen
  useEffect(() => {
    const root = scroller.current; if (!root) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i)); }), { root, threshold: 0.6 });
    root.querySelectorAll(".bite-slide").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [feed.length]);
  // open at a specific Bite (from Community)
  useEffect(() => { const el = scroller.current?.querySelector<HTMLElement>(`[data-i="${active}"]`); el?.scrollIntoView({ block: "start" }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const go = (d: number) => scroller.current?.querySelector<HTMLElement>(`[data-i="${Math.min(feed.length - 1, Math.max(0, active + d))}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.target as HTMLElement).closest("input,textarea,[role=dialog]")) return; if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); go(1); } if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); go(-1); } };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  });

  // a new Bite goes to the top of the feed: take the poster there
  const firstId = feed[0]?.id; const seenFirst = useRef(firstId);
  useEffect(() => { if (firstId !== seenFirst.current) { seenFirst.current = firstId; scroller.current?.scrollTo({ top: 0 }); setActive(0); } }, [firstId]);

  const ui = (
    <div role="region" aria-label="Bites" className="bites fixed inset-0 z-[35] bg-[#120c08] md:relative md:inset-auto md:z-auto md:-mx-2 md:-mt-3 md:h-[calc(100dvh-8.5rem)] md:bg-transparent">
      {/* top bar (phone) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center gap-2 p-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] text-[#fff] md:hidden">
        <button type="button" onClick={() => (history.length > 1 ? nav(-1) : nav("/community"))} className="press pointer-events-auto grid h-10 w-10 place-items-center rounded-full glass-dark" aria-label="Back"><Icon n="back" size={20} /></button>
        <h1 className="h-display text-2xl drop-shadow">Bites</h1>
        <button type="button" onClick={() => setSp({ new: "1" })} className="press pointer-events-auto ml-auto inline-flex items-center gap-1.5 rounded-full accent-fill px-4 py-2 text-sm font-bold"><Icon n="plus" size={17} /> Post</button>
      </div>
      {/* header (PC) */}
      <div className="mb-2 hidden items-center justify-between md:flex">
        <div><h1 className="h-display text-3xl">Bites</h1><p className="text-sm text-brown">Swipe or use ↑ ↓. Double-tap for Yum. Every Bite is cookable.</p></div>
        <button type="button" onClick={() => setSp({ new: "1" })} className="btn-primary"><Icon n="plus" size={17} /> Post a Bite</button>
      </div>

      {feed.length === 0 ? <div className="grid h-full place-items-center p-6"><Empty emoji="🎬" title="No Bites yet" text="Post the first one: a photo or a short video of something you made." action={<button className="btn-primary" onClick={() => setSp({ new: "1" })}>Post a Bite</button>} /></div> : (
        <div ref={scroller} className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto overscroll-contain md:h-[calc(100%-3.5rem)]">
          {feed.map((p, i) => <Bite key={p.id} p={p} index={i} total={feed.length} active={i === active} near={Math.abs(i - active) <= 1} muted={muted} setMuted={setMuted} />)}
        </div>
      )}
      {/* up / down (PC) */}
      {feed.length > 1 && <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 flex-col gap-3 md:flex">
        <button type="button" className="btn-ghost !h-12 !w-12 !p-0" onClick={() => go(-1)} disabled={active === 0} aria-label="Previous Bite"><Icon n="up" size={22} /></button>
        <button type="button" className="btn-ghost !h-12 !w-12 !p-0" onClick={() => go(1)} disabled={active >= feed.length - 1} aria-label="Next Bite"><Icon n="down" size={22} /></button>
      </div>}
      {composing && <Composer bite onClose={() => { sp.delete("new"); setSp(sp, { replace: true }); }} />}
    </div>
  );
  return wide ? ui : createPortal(ui, document.body);
}
