import { Link, useNavigate, useParams } from "react-router-dom";
import { G } from "../icons";
import { creatorOf, useCatalogue, useOwnedIds, useStore } from "../store";
import { Avatar, Empty, RecipeCard, Stars } from "../ui";

export default function CreatorPage() {
  const { id } = useParams(); const nav = useNavigate(); const { accounts, following, toggleFollow, openThread } = useStore(); const cat = useCatalogue(); const owned = useOwnedIds();
  const c = creatorOf(id!, accounts);
  const known = accounts.some((a) => a.id === id) || /^c\d+$/.test(id ?? "");
  if (!known) return <Empty emoji="🔍" title="Creator not found" action={<Link to="/community" className="btn-primary">Community</Link>} />;
  const recipes = cat.filter((r) => r.creatorId === c.id && r.status === "published");
  const f = following.includes(c.id);
  return (
    <div>
      <div className="card flex flex-col items-center gap-4 p-6 text-center md:flex-row md:text-left">
        <Avatar emoji={c.emoji} hue={c.hue} size={96} />
        <div className="flex-1"><h1 className="h-display text-3xl">{c.name}{c.verified ? <G g="✓" className="ml-1 text-orange" /> : null}</h1><p className="text-sm text-brown">{c.handle}</p><p className="mt-2 max-w-xl text-sm">{c.bio || "No bio yet."}</p><div className="mt-2 flex flex-wrap justify-center gap-1.5 md:justify-start">{c.badges.map((b) => <span key={b} className="chip bg-orange-light"><G g="🏅" /> {b}</span>)}</div></div>
        <div className="flex gap-6 text-center"><div><b className="text-xl">{(c.followers + (f ? 1 : 0)).toLocaleString()}</b><div className="text-xs text-brown">Followers</div></div><div><b className="text-xl">{recipes.length}</b><div className="text-xs text-brown">Recipes</div></div>{c.rating > 0 && <div><b className="text-xl">{c.rating}</b><div><Stars value={c.rating} size={11} /></div></div>}</div>
        <div className="flex gap-2"><button className={f ? "btn-ghost" : "btn-dark"} onClick={() => toggleFollow(c.id)}>{f ? "Following" : "Follow"}</button><button className="btn-outline" onClick={() => { const t = openThread(c); nav(`/messages?t=${t}`); }}>Message</button></div>
      </div>
      <h2 className="h-display mb-3 mt-8 text-2xl">Recipes</h2>
      {recipes.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{recipes.map((r) => <RecipeCard key={r.id} r={r} owned={owned.has(r.id)} />)}</div> : <Empty emoji="🍳" title="No published recipes yet" />}
    </div>
  );
}
