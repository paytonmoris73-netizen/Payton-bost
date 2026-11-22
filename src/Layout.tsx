import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ALL_RECIPES, CREATORS } from "./data";
import { matchScore } from "./engine";
import { useIngredients, useMe, useStore } from "./store";
import { Avatar, Modal, usePresence } from "./ui";
import { HeaderLights } from "./theme";
import { SafetyBanner } from "./safetyUi";

import { G, Icon } from "./icons";
import { BrandMark, Wordmark } from "./brand";
export { Icon };
const NAV = [
  { to: "/", label: "Home", icon: "home", end: true }, { to: "/combiner", label: "Food Combiner", icon: "combine" }, { to: "/chef", label: "AI Chef", icon: "chef" },
  { to: "/discover", label: "Discover", icon: "compass" }, { to: "/marketplace", label: "Recipe Marketplace", icon: "store" }, { to: "/shop", label: "Ingredient Shop", icon: "basket" },
  { to: "/community", label: "Community", icon: "people" }, { to: "/cookbook", label: "My Cookbook", icon: "book" }, { to: "/saved", label: "Saved Recipes", icon: "bookmark" },
  { to: "/lists", label: "Shopping Lists", icon: "list" }, { to: "/messages", label: "Messages", icon: "msg" }, { to: "/safety", label: "Safety Center", icon: "shield" }, { to: "/profile", label: "Profile", icon: "user" },
];

/** PC sidebar group headings, shown before the link they introduce (wide sidebar only). */
const GROUP_BEFORE: Record<string, string> = { "/": "Create", "/discover": "Explore", "/cookbook": "My kitchen", "/safety": "You" };

export function Logo({ dark }: { dark?: boolean }) {
  return <Link to="/" className="press flex items-center gap-2" aria-label="Crunch home"><BrandMark size={38} /><Wordmark dark={dark} className="text-[1.6rem]" /></Link>;
}

function GlobalSearch() {
  const nav = useNavigate(); const [q, setQ] = useState(""); const [open, setOpen] = useState(false);
  const recent = useStore((s) => s.searches); const record = useStore((s) => s.recordSearch);
  const ings = useIngredients(); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false); document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  const sugg = useMemo(() => {
    if (!q.trim()) return [];
    const out: { label: string; sub: string; to: string; s: number }[] = [];
    ALL_RECIPES.forEach((r) => { const s = matchScore(q, r.title); if (s) out.push({ label: r.emoji + " " + r.title, sub: "Recipe", to: r.price > 0 || r.bundleOf ? `/marketplace/${r.id}` : `/recipe/${r.id}`, s }); });
    ings.forEach((i) => { const s = matchScore(q, i.name); if (s) out.push({ label: i.emoji + " " + i.name, sub: "Ingredient", to: `/shop/${i.id}`, s }); });
    CREATORS.forEach((c) => { const s = matchScore(q, c.name + " " + c.handle); if (s) out.push({ label: c.emoji + " " + c.name, sub: "Creator", to: `/creator/${c.id}`, s }); });
    return out.sort((a, b) => b.s - a.s).slice(0, 6);
  }, [q, ings]);
  const go = (term: string) => { record(term); setOpen(false); nav(`/search?q=${encodeURIComponent(term)}`); };
  return (
    <div ref={ref} className="relative w-full max-w-xl">
      <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) go(q); }} role="search">
        <Icon n="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brown" />
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder="Search recipes, ingredients, creators…" className="input !rounded-full !py-2.5 !pl-10" aria-label="Search CRUNCH" />
      </form>
      {open && (sugg.length > 0 || (!q && recent.length > 0)) && (
        <div className="menu pop-in absolute left-0 right-0 top-full z-50 mt-2">
          {!q && <div className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-brown">Recent searches</div>}
          {!q && recent.map((r) => <button key={r} onClick={() => { setQ(r); go(r); }} className="menu-item hover:bg-charcoal/[0.06]"><G g="🕘" /> {r}</button>)}
          {sugg.map((s) => <Link key={s.to + s.label} to={s.to} onClick={() => { record(q); setOpen(false); }} className="menu-item justify-between hover:bg-charcoal/[0.06]"><span>{s.label}</span><span className="text-xs text-brown">{s.sub}</span></Link>)}
          {q && <button onClick={() => go(q)} className="menu-item mt-1 bg-charcoal/[0.05] font-semibold">Search all for “{q}” →</button>}
        </div>
      )}
    </div>
  );
}

function Bell() {
  const [open, setOpen] = useState(false); const notifs = useStore((s) => s.notifs); const readAll = useStore((s) => s.readAll); const read = useStore((s) => s.readNotif); const me = useMe();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false); document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  const visible = notifs.filter((n) => me?.notify[{ follow: "follows", like: "likes", comment: "comments", purchase: "purchases", post: "creators", review: "reviews", challenge: "challenges", update: "updates" }[n.type]] !== false);
  const unread = visible.filter((n) => !n.read).length;
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="glass press relative grid h-10 w-10 place-items-center rounded-full" aria-label={`Notifications, ${unread} unread`}>
        <Icon n="bell" size={18} />{unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-orange px-1 text-[10px] font-bold on-accent">{unread}</span>}
      </button>
      {open && (
        <div className="menu pop-in absolute right-0 top-full z-50 mt-2 w-80 max-w-[90vw] [--origin:top_right]">
          <div className="flex items-center justify-between px-3 py-2"><span className="font-semibold">Notifications</span><button onClick={readAll} className="text-xs font-semibold text-brown">Mark all read</button></div>
          <div className="max-h-80 overflow-y-auto">
            {visible.length === 0 && <p className="px-3 py-6 text-center text-sm text-brown">You're all caught up.</p>}
            {visible.map((n) => <button key={n.id} onClick={() => read(n.id)} className={`menu-item gap-2 hover:bg-charcoal/[0.06] ${n.read ? "" : "bg-orange-light/40"}`}><span className="flex-1">{n.text}</span><span className="text-xs text-brown">{n.at}</span></button>)}
          </div>
          <Link to="/settings" onClick={() => setOpen(false)} className="mt-1 block border-t border-cream px-3 pb-1 pt-2.5 text-xs font-semibold text-brown">Notification settings</Link>
        </div>
      )}
    </div>
  );
}

function CreateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const items = [
    { to: "/combiner", icon: "🥕", t: "Combine foods", d: "Build and analyse an ingredient combination" },
    { to: "/chef?tab=generate", icon: "✨", t: "Generate a recipe", d: "Let the AI chef draft recipes" },
    { to: "/creator/new", icon: "📝", t: "Upload a recipe", d: "Write your own and share or sell it" },
    { to: "/combiner?scan=1", icon: "📷", t: "Scan ingredients", d: "Add ingredients from a photo" },
  ];
  return (
    <Modal open={open} onClose={onClose} title="Create">
      <div className="stagger grid gap-3 sm:grid-cols-2">
        {items.map((i) => <Link key={i.t} to={i.to} onClick={onClose} className="tile lift flex items-center gap-4 p-4"><span className="grid h-12 w-12 place-items-center rounded-[0.95rem] accent-fill"><G g={i.icon} size={24} /></span><span><span className="block font-semibold">{i.t}</span><span className="text-xs text-brown">{i.d}</span></span></Link>)}
      </div>
    </Modal>
  );
}

/** Sliding highlight that follows the active NavLink (vertical sidebar). */
function useNavIndicator(dep: string) {
  const ref = useRef<HTMLElement>(null); const [box, setBox] = useState<{ y: number; h: number } | null>(null); const [anim, setAnim] = useState(false);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('[aria-current="page"]');
    setBox(el ? { y: el.offsetTop, h: el.offsetHeight } : null);
    const id = requestAnimationFrame(() => setAnim(true)); return () => cancelAnimationFrame(id);
  }, [dep]);
  return { ref, style: box ? { height: box.h, transform: `translate3d(0,${box.y}px,0)`, transition: anim ? undefined : "none" } : { opacity: 0 } };
}

const TAB_BAR = [{ to: "/", l: "Home", i: "home", end: true }, { to: "/marketplace", l: "Market", i: "store" }, null, { to: "/community", l: "Community", i: "people" }, { to: "/profile", l: "Profile", i: "user" }] as const;

export function Layout() {
  const me = useMe(); const loc = useLocation(); const [create, setCreate] = useState(false); const [drawer, setDrawer] = useState(false);
  const ann = useStore((s) => s.announcements[0]); const cartN = useStore((s) => s.cart.length);
  const drawerP = usePresence(drawer, 280);
  useLayoutEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]); // before paint: no visible jump
  useEffect(() => { setDrawer(false); }, [loc.pathname]);
  const side = useNavIndicator(loc.pathname);
  const cooking = loc.pathname.startsWith("/cook/");
  if (cooking) return <Outlet />;
  const nav = me?.role === "admin" ? [...NAV, { to: "/admin", label: "Admin", icon: "shield" }] : NAV;
  const tabIdx = TAB_BAR.findIndex((t) => t && (t.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(t.to)));
  return (
    <div className="min-h-screen md:pl-[84px] lg:pl-[17rem]">
      <aside aria-label="Main navigation" className="safe-inset-top fixed bottom-3 left-3 z-40 hidden w-[68px] flex-col rounded-[1.75rem] py-4 card md:flex lg:w-60 lg:px-3">
        <div className="mb-5 flex justify-center lg:justify-start lg:px-2"><span className="lg:hidden"><Link to="/" aria-label="Crunch home" className="press block"><BrandMark size={42} /></Link></span><span className="hidden lg:block"><Logo /></span></div>
        <nav ref={side.ref} className="relative flex flex-1 flex-col gap-0.5 overflow-y-auto no-scrollbar px-2 lg:px-0" aria-label="Main">
          <span aria-hidden className="nav-pill pointer-events-none absolute inset-x-2 top-0 rounded-[0.95rem] transition-transform duration-500 [transition-timing-function:var(--ease-spring)] lg:inset-x-0" style={side.style} />
          {nav.map((n) => (<div key={n.to} className="contents">
            {GROUP_BEFORE[n.to] && <span className={`hidden px-3 pb-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-brown/80 lg:block ${n.to === "/" ? "" : "pt-3"}`}>{GROUP_BEFORE[n.to]}</span>}
            <NavLink to={n.to} end={n.end} title={n.label} className={({ isActive }) => `press relative z-[1] flex items-center justify-center gap-3 rounded-[0.95rem] px-3 py-2.5 lg:py-2 text-sm font-medium transition-colors duration-300 lg:justify-start ${isActive ? "nav-on" : "text-charcoal/80 hover:bg-white/60"}`}>
              <Icon n={n.icon} /><span className="hidden lg:inline">{n.label}</span>
            </NavLink>
          </div>))}
        </nav>
        <div className="px-2 pt-3 lg:px-0"><NavLink to="/settings" title="Settings" className={({ isActive }) => `press flex items-center justify-center gap-3 rounded-[0.95rem] px-3 py-2.5 text-sm font-medium lg:justify-start ${isActive ? "nav-pill nav-on" : "text-charcoal/80 hover:bg-white/60"}`}><Icon n="settings" /><span className="hidden lg:inline">Settings</span></NavLink></div>
      </aside>

      <header className="glass-bar safe-top sticky top-0 z-30 flex items-center gap-2 border-b border-white/50 px-3 pb-2.5 shadow-[0_1px_0_rgba(104,64,30,.06)] sm:gap-3 sm:px-4 md:px-8 md:pb-3">
        <button onClick={() => setDrawer(true)} className="glass press grid h-10 w-10 place-items-center rounded-full md:hidden" aria-label="Open menu"><Icon n="menu" size={18} /></button>
        <div className="md:hidden"><Logo /></div>
        <div className="hidden flex-1 md:block"><GlobalSearch /></div>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/marketplace/cart" className="glass press relative grid h-10 w-10 place-items-center rounded-full" aria-label={`Cart, ${cartN} items`}><Icon n="bag" size={18} />{cartN > 0 && <span key={cartN} className="pop absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-orange px-1 text-[10px] font-bold on-accent shadow">{cartN}</span>}</Link>
          <Bell />
          <Link to="/profile" aria-label="Your profile" className="press rounded-full shadow-[0_0_0_2px_rgb(var(--white)/.9),0_4px_10px_-4px_rgba(37,35,31,.3)]"><Avatar emoji={me?.emoji ?? "🍳"} size={40} /></Link>
        </div>
        <HeaderLights />
      </header>
      <div className="px-4 pb-1 pt-3 md:hidden"><GlobalSearch /></div>
      {ann && <div className="mx-4 mt-3 rounded-full px-4 py-2 text-center text-sm font-medium glass md:mx-8"><G g="📣" /> {ann.text}</div>}

      <main className="page-enter mx-auto max-w-7xl px-4 pb-32 pt-6 md:px-8 md:pb-12" key={loc.pathname}><SafetyBanner /><Outlet /></main>

      <nav className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 md:hidden" aria-label="Primary">
        <div className="glass-thick relative grid grid-cols-5 items-center rounded-[1.9rem] p-1.5">
          {tabIdx >= 0 && <span aria-hidden className="absolute inset-y-1.5 left-1.5 w-[calc((100%-0.75rem)/5)] rounded-[1.5rem] tab-pill transition-transform duration-500 [transition-timing-function:var(--ease-spring)]" style={{ transform: `translate3d(${tabIdx * 100}%,0,0)` }} />}
          {TAB_BAR.map((n, idx) =>
            n === null ? (
              <button key="c" onClick={() => setCreate(true)} className="press accent-sheen relative mx-auto grid h-12 w-12 place-items-center overflow-hidden rounded-full accent-fill" aria-label="Create" aria-expanded={create}><span className={`grid place-items-center transition-transform duration-500 [transition-timing-function:var(--ease-spring)] ${create ? "rotate-[135deg] scale-90" : ""}`}><Icon n="plus" size={24} /></span></button>
            ) : (
              <NavLink key={n.to + idx} to={n.to} end={"end" in n} className={({ isActive }) => `press relative flex flex-col items-center gap-0.5 rounded-[1.5rem] py-1.5 text-[10.5px] font-semibold transition-colors duration-300 ${isActive ? "tab-on" : "text-charcoal/50"}`}><Icon n={n.i} size={22} />{n.l}</NavLink>
            ),
          )}
        </div>
      </nav>

      <CreateSheet open={create} onClose={() => setCreate(false)} />
      {drawerP.mounted && (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className={`scrim-blur absolute inset-0 ${drawerP.leaving ? "backdrop-out" : "backdrop-in"}`} onClick={() => setDrawer(false)} />
          <div className={`sheet safe-inset-top absolute bottom-2 left-2 w-72 overflow-y-auto rounded-[1.75rem] p-4 ${drawerP.leaving ? "[animation:drawerIn_260ms_var(--ease-spring)_reverse_both]" : "drawer-in"}`}>
            <div className="mb-4 flex items-center justify-between"><Logo /><button onClick={() => setDrawer(false)} aria-label="Close menu" className="press grid h-9 w-9 place-items-center rounded-full bg-charcoal/[0.07]"><G g="✕" size={15} /></button></div>
            <div className="stagger space-y-0.5">{[...nav, { to: "/settings", label: "Settings", icon: "settings" }].map((n) => <NavLink key={n.to} to={n.to} className={({ isActive }) => `press flex items-center gap-3 rounded-[0.95rem] px-3 py-3 text-sm font-medium ${isActive ? "nav-pill nav-on" : "hover:bg-white/60"}`}><Icon n={n.icon} />{n.label}</NavLink>)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
