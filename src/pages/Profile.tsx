import { Link, useNavigate } from "react-router-dom";
import { G } from "../icons";
import { useCatalogue, useMe, useOwnedIds, useStore } from "../store";
import { Avatar, Empty, RecipeCard } from "../ui";

const BADGES: { name: string; desc: string; earned: (s: { published: number; cooked: number; reviews: number; combos: number; posts: number }) => boolean }[] = [
  { name: "First Recipe", desc: "Publish your first recipe", earned: (s) => s.published >= 1 },
  { name: "Home Chef", desc: "Cook 5 recipes", earned: (s) => s.cooked >= 5 },
  { name: "Helpful Reviewer", desc: "Write 3 reviews", earned: (s) => s.reviews >= 3 },
  { name: "Flavour Explorer", desc: "Save 3 combinations", earned: (s) => s.combos >= 3 },
  { name: "Community Voice", desc: "Share 3 posts", earned: (s) => s.posts >= 3 },
];

export default function Profile() {
  const me = useMe()!; const nav = useNavigate(); const cat = useCatalogue(); const owned = useOwnedIds();
  const { following, cooked, reviews, combos, posts, favorites, logOut, folders } = useStore();
  const mine = cat.filter((r) => r.creatorId === me.id && r.status === "published");
  const stats = { published: mine.length, cooked: cooked.length, reviews: reviews.filter((r) => r.userId === me.id).length, combos: combos.length, posts: posts.filter((p) => p.userId === me.id).length };
  const level = Math.floor(me.xp / 200) + 1; const into = me.xp % 200;
  const favs = favorites.map((id) => cat.find((r) => r.id === id)).filter(Boolean) as typeof cat;
  return (
    <div>
      <div className="card flex flex-col items-center gap-4 p-6 text-center md:flex-row md:text-left">
        <Avatar emoji={me.emoji} size={96} />
        <div className="flex-1"><h1 className="h-display text-3xl">{me.name}</h1><p className="text-sm text-brown">{me.handle} · {me.level}{me.plus ? " · CRUNCH Plus" : ""}</p><p className="mt-2 max-w-xl text-sm">{me.bio || "Add a bio in Settings to tell people about your cooking."}</p></div>
        <div className="flex gap-6 text-center"><div><b className="text-xl">0</b><div className="text-xs text-brown">Followers</div></div><div><b className="text-xl">{following.length}</b><div className="text-xs text-brown">Following</div></div><div><b className="text-xl">{mine.length}</b><div className="text-xs text-brown">Recipes</div></div></div>
        <div className="flex flex-col gap-2"><Link to="/settings" className="btn-dark">Edit profile</Link><Link to="/creator/studio" className="btn-ghost">Creator studio</Link></div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="card p-5"><div className="flex items-baseline justify-between"><h2 className="h-display text-xl">Cooking &amp; creator XP</h2><b>Level {level}</b></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-cream"><div className="h-full rounded-full bg-orange transition-all duration-700" style={{ width: `${(into / 200) * 100}%` }} /></div><p className="mt-2 text-xs text-brown">{me.xp} XP · {200 - into} to next level. XP comes from publishing, cooking, reviewing and challenges, with daily caps to prevent farming.</p></div>
        <div className="card p-5"><h2 className="h-display text-xl">Badges</h2><div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">{BADGES.map((b) => { const on = b.earned(stats); return <div key={b.name} className={`rounded-xl p-3 ${on ? "bg-orange-light" : "bg-cream opacity-60"}`}><b className="text-sm"><G g={on ? "🏅" : "🔒"} /> {b.name}</b><div className="text-xs text-brown">{b.desc}</div></div>; })}</div></div>
      </div>

      <section className="mt-8"><h2 className="h-display mb-3 text-2xl">Published recipes</h2>{mine.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{mine.map((r) => <RecipeCard key={r.id} r={r} owned={owned.has(r.id)} />)}</div> : <Empty emoji="📝" title="Nothing published yet" action={<Link to="/creator/new" className="btn-primary">Write a recipe</Link>} />}</section>
      {favs.length > 0 && <section className="mt-8"><h2 className="h-display mb-3 text-2xl">Favourite creations</h2><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{favs.slice(0, 4).map((r) => <RecipeCard key={r.id} r={r} owned={owned.has(r.id)} />)}</div></section>}
      <section className="mt-8"><h2 className="h-display mb-3 text-2xl">Collections</h2><div className="grid gap-3 sm:grid-cols-3">{folders.map((f) => <Link key={f.id} to="/cookbook" className="card p-4"><G g="📁" /> <b>{f.name}</b><div className="text-xs text-brown">{f.recipeIds.length} recipes</div></Link>)}</div></section>
      <button className="btn-outline mt-8" onClick={() => { logOut(); nav("/auth"); }}>Log out</button>
    </div>
  );
}
