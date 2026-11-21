import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ALL_RECIPES, CREATORS } from "./data";
import { matchScore } from "./engine";
import { useIngredients, useMe, useStore } from "./store";
import { Avatar, Modal } from "./ui";

const P: Record<string, string> = {
  home: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
  combine: "M9 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM15 9a5 5 0 1 0 0 10 5 5 0 0 0 0-10z",
  chef: "M7 14a4 4 0 1 1 1-7.9A4 4 0 0 1 16 6a4 4 0 1 1 1 8v6H7z",
  compass: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z",
  store: "M4 9l1-5h14l1 5M4 9v11h16V9M4 9a3 3 0 0 0 5 0 3 3 0 0 0 6 0 3 3 0 0 0 5 0",
  basket: "M3 9h18l-2 11H5zM8 9l3-5M16 9l-3-5",
  people: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3 2.7-5 6-5s6 2 6 5M17 11a2.5 2.5 0 1 0 0-5M17 15c2.5 0 4 1.7 4 4",
  book: "M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11",
  bookmark: "M6 3h12v18l-6-4-6 4z",
  list: "M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2",
  msg: "M4 5h16v11H9l-5 4z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-7 8-7s8 3 8 7",
  plus: "M12 5v14M5 12h14",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4",
  menu: "M4 7h16M4 12h16M4 17h16",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  settings: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19 12l2-1-2-4-2 1a7 7 0 0 0-2-1l-1-2H9L8 7a7 7 0 0 0-2 1L4 7 2 11l2 1a7 7 0 0 0 0 2l-2 1 2 4 2-1a7 7 0 0 0 2 1l1 2h4l1-2a7 7 0 0 0 2-1l2 1 2-4-2-1a7 7 0 0 0 0-2z",
  bag: "M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0",
};
export function Icon({ n, size = 20, className = "" }: { n: string; size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden><path d={P[n] ?? P.home} /></svg>;
}

const NAV = [
  { to: "/", label: "Home", icon: "home", end: true }, { to: "/combiner", label: "Food Combiner", icon: "combine" }, { to: "/chef", label: "AI Chef", icon: "chef" },
  { to: "/discover", label: "Discover", icon: "compass" }, { to: "/marketplace", label: "Recipe Marketplace", icon: "store" }, { to: "/shop", label: "Ingredient Shop", icon: "basket" },
  { to: "/community", label: "Community", icon: "people" }, { to: "/cookbook", label: "My Cookbook", icon: "book" }, { to: "/saved", label: "Saved Recipes", icon: "bookmark" },
  { to: "/lists", label: "Shopping Lists", icon: "list" }, { to: "/messages", label: "Messages", icon: "msg" }, { to: "/profile", label: "Profile", icon: "user" },
];

export function Logo({ dark }: { dark?: boolean }) {
  return <Link to="/" className="flex items-center gap-2.5" aria-label="CRUNCH home"><span className="grid h-9 w-9 place-items-center rounded-xl bg-charcoal font-display text-xl text-orange">C</span><span className={`h-display text-2xl tracking-wide ${dark ? "text-ivory" : ""}`}>CRUNCH</span></Link>;
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
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder="Search recipes, ingredients, creators…" className="w-full rounded-full border border-cream-dark bg-white py-2.5 pl-10 pr-4 text-sm focus:border-orange focus:outline-none" aria-label="Search CRUNCH" />
      </form>
      {open && (sugg.length > 0 || (!q && recent.length > 0)) && (
        <div className="animate-scale-in absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl bg-white p-2 shadow-float">
          {!q && <div className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-brown">Recent searches</div>}
          {!q && recent.map((r) => <button key={r} onClick={() => { setQ(r); go(r); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-cream">🕘 {r}</button>)}
          {sugg.map((s) => <Link key={s.to + s.label} to={s.to} onClick={() => { record(q); setOpen(false); }} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-cream"><span>{s.label}</span><span className="text-xs text-brown">{s.sub}</span></Link>)}
          {q && <button onClick={() => go(q)} className="mt-1 block w-full rounded-lg bg-cream px-3 py-2 text-left text-sm font-semibold">Search all for “{q}” →</button>}
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
      <button onClick={() => setOpen(!open)} className="relative grid h-10 w-10 place-items-center rounded-full bg-white shadow-card" aria-label={`Notifications, ${unread} unread`}>
        <Icon n="bell" size={18} />{unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-orange px-1 text-[10px] font-bold">{unread}</span>}
      </button>
      {open && (
        <div className="animate-scale-in absolute right-0 top-full z-50 mt-2 w-80 max-w-[90vw] rounded-2xl bg-white p-2 shadow-float">
          <div className="flex items-center justify-between px-3 py-2"><span className="font-semibold">Notifications</span><button onClick={readAll} className="text-xs font-semibold text-brown">Mark all read</button></div>
          <div className="max-h-80 overflow-y-auto">
            {visible.length === 0 && <p className="px-3 py-6 text-center text-sm text-brown">You're all caught up.</p>}
            {visible.map((n) => <button key={n.id} onClick={() => read(n.id)} className={`flex w-full gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-cream ${n.read ? "" : "bg-orange-light/30"}`}><span className="flex-1">{n.text}</span><span className="text-xs text-brown">{n.at}</span></button>)}
          </div>
          <Link to="/settings" onClick={() => setOpen(false)} className="block border-t border-cream px-3 py-2 text-xs font-semibold text-brown">Notification settings</Link>
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
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((i) => <Link key={i.t} to={i.to} onClick={onClose} className="flex items-center gap-4 rounded-2xl bg-cream p-4 transition hover:bg-cream-dark hover:-translate-y-0.5"><span className="text-3xl">{i.icon}</span><span><span className="block font-semibold">{i.t}</span><span className="text-xs text-brown">{i.d}</span></span></Link>)}
      </div>
    </Modal>
  );
}

export function Layout() {
  const me = useMe(); const loc = useLocation(); const [create, setCreate] = useState(false); const [drawer, setDrawer] = useState(false);
  const ann = useStore((s) => s.announcements[0]); const cartN = useStore((s) => s.cart.length);
  useEffect(() => { window.scrollTo(0, 0); setDrawer(false); }, [loc.pathname]);
  const cooking = loc.pathname.startsWith("/cook/");
  if (cooking) return <Outlet />;
  const nav = me?.role === "admin" ? [...NAV, { to: "/admin", label: "Admin", icon: "shield" }] : NAV;
  return (
    <div className="min-h-screen md:pl-[72px] lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col border-r border-cream-dark bg-ivory py-5 md:flex lg:w-64 lg:px-4">
        <div className="mb-6 flex justify-center lg:justify-start lg:px-2"><span className="lg:hidden"><Link to="/" className="grid h-10 w-10 place-items-center rounded-xl bg-charcoal font-display text-xl text-orange">C</Link></span><span className="hidden lg:block"><Logo /></span></div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto no-scrollbar px-2 lg:px-0" aria-label="Main">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} title={n.label} className={({ isActive }) => `group flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition lg:justify-start ${isActive ? "bg-charcoal text-ivory" : "text-charcoal hover:bg-cream"}`}>
              <Icon n={n.icon} /><span className="hidden lg:inline">{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-2 pt-3 lg:px-0"><Link to="/settings" title="Settings" className="flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-cream lg:justify-start"><Icon n="settings" /><span className="hidden lg:inline">Settings</span></Link></div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-cream-dark bg-ivory/90 px-4 py-3 backdrop-blur md:px-8">
        <button onClick={() => setDrawer(true)} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-card md:hidden" aria-label="Open menu"><Icon n="menu" size={18} /></button>
        <div className="md:hidden"><Logo /></div>
        <div className="hidden flex-1 md:block"><GlobalSearch /></div>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/marketplace/cart" className="relative grid h-10 w-10 place-items-center rounded-full bg-white shadow-card" aria-label={`Cart, ${cartN} items`}><Icon n="bag" size={18} />{cartN > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-orange px-1 text-[10px] font-bold">{cartN}</span>}</Link>
          <Bell />
          <Link to="/profile" aria-label="Your profile"><Avatar emoji={me?.emoji ?? "🍳"} size={40} /></Link>
        </div>
      </header>
      <div className="px-4 pb-2 pt-3 md:hidden"><GlobalSearch /></div>
      {ann && <div className="bg-sage-light px-4 py-2 text-center text-sm font-medium">📣 {ann.text}</div>}

      <main className="page-enter mx-auto max-w-7xl px-4 pb-28 pt-6 md:px-8 md:pb-12" key={loc.pathname}><Outlet /></main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-end border-t border-cream-dark bg-ivory/95 px-2 pt-1.5 backdrop-blur md:hidden" aria-label="Primary">
        {[{ to: "/", l: "Home", i: "home", end: true }, null, { to: "/discover", l: "Discover", i: "compass" }, { to: "/marketplace", l: "Market", i: "store" }, { to: "/profile", l: "Profile", i: "user" }].map((n, idx) =>
          n === null ? (
            <button key="c" onClick={() => setCreate(true)} className="mx-auto -mt-5 grid h-14 w-14 place-items-center rounded-full bg-orange text-charcoal shadow-float transition active:scale-95" aria-label="Create"><Icon n="plus" size={26} /></button>
          ) : (
            <NavLink key={n.to + idx} to={n.to} end={n.end} className={({ isActive }) => `flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-semibold ${isActive ? "text-charcoal" : "text-brown-light"}`}><Icon n={n.i} size={22} />{n.l}</NavLink>
          ),
        )}
      </nav>

      <CreateSheet open={create} onClose={() => setCreate(false)} />
      {drawer && (
        <div className="fixed inset-0 z-[60] bg-charcoal/50 animate-fade-in md:hidden" onClick={() => setDrawer(false)}>
          <div className="animate-slide-in-right h-full w-72 overflow-y-auto bg-ivory p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between"><Logo /><button onClick={() => setDrawer(false)} aria-label="Close menu" className="text-xl">✕</button></div>
            {[...nav, { to: "/settings", label: "Settings", icon: "settings" }].map((n) => <NavLink key={n.to} to={n.to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${isActive ? "bg-charcoal text-ivory" : ""}`}><Icon n={n.icon} />{n.label}</NavLink>)}
          </div>
        </div>
      )}
    </div>
  );
}
