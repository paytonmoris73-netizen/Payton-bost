import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CREATORS, FOOD_FACTS, ING, TRENDING_COMBOS } from "../data";
import { useCatalogue, useMe, useOwnedIds, useStore } from "../store";
import { Avatar, CardSkeletons, RecipeCard, Section, useLoading } from "../ui";

export default function Home() {
  const me = useMe()!; const cat = useCatalogue(); const owned = useOwnedIds(); const loading = useLoading(300);
  const { saved, recent, following, toggleFollow, favorites } = useStore();
  const hour = new Date().getHours(); const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const fact = FOOD_FACTS[new Date().getDate() % FOOD_FACTS.length];
  const pub = cat.filter((r) => r.status === "published" && !r.bundleOf);
  const popular = [...pub].sort((a, b) => b.reviews * b.rating - a.reviews * a.rating).slice(0, 4);
  const market = cat.filter((r) => r.status === "published" && r.price > 0).sort((a, b) => b.sales - a.sales).slice(0, 4);
  const forYou = useMemo(() => {
    const liked = new Set([...saved, ...favorites, ...recent]);
    const likedRecipes = pub.filter((r) => liked.has(r.id));
    const cuis = new Set(likedRecipes.map((r) => r.cuisine)); const meals = new Set(likedRecipes.map((r) => r.meal));
    const score = (r: (typeof pub)[number]) =>
      (cuis.has(r.cuisine) ? 2 : 0) + (meals.has(r.meal) ? 1 : 0) + (me.diet.every((d) => r.diet.includes(d)) ? 2 : -10) + (me.allergies.some((a) => r.allergens.some((x) => x.includes(a))) ? -20 : 0) +
      (me.level === "Beginner" && r.difficulty === "Easy" ? 2 : 0) + (liked.has(r.id) ? -3 : 0) + r.rating / 5;
    return [...pub].sort((a, b) => score(b) - score(a)).slice(0, 4);
  }, [pub, saved, favorites, recent, me.diet, me.allergies, me.level]);
  const recentRecipes = recent.map((id) => cat.find((r) => r.id === id)).filter(Boolean).slice(0, 6) as typeof cat;
  const reason = [saved.length || recent.length ? "your saved and recently viewed recipes" : "popular picks", me.diet.length ? `your ${me.diet.join(", ")} preference` : "", `${me.level.toLowerCase()} cooking level`].filter(Boolean).join(", ");

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <span className="rounded-full shadow-[0_0_0_3px_rgba(255,255,255,.9),0_10px_24px_-10px_rgba(37,35,31,.35)]"><Avatar emoji={me.emoji} size={56} /></span>
        <div className="flex-1"><h1 className="h-display text-shine text-3xl md:text-4xl">{greet}, {me.name.split(" ")[0]}</h1><p className="text-sm text-brown">💡 {fact}</p></div>
      </div>

      <div className="mb-10 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Link to="/combiner" className="lift group relative isolate overflow-hidden rounded-[2rem] hero-fill p-7 pt-24 text-ivory shadow-[inset_0_1px_0_rgba(255,255,255,.14),0_24px_50px_-24px_rgba(37,35,31,.7)] md:p-9 md:pt-28">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full bg-orange/30 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 -z-10 h-56 w-56 rounded-full bg-sage/25 blur-3xl" />
          <div className="absolute right-5 top-5 flex gap-2 text-5xl transition-transform duration-700 [transition-timing-function:var(--ease-spring)] group-hover:-translate-y-1 group-hover:rotate-3 md:right-7 md:top-6 md:text-6xl" aria-hidden>{["🍅", "🧀", "🌿"].map((e, i) => <span key={e} className="animate-float" style={{ animationDelay: `${i * 0.5}s` }}>{e}</span>)}</div>
          <p className="text-sm font-semibold uppercase tracking-wide text-orange">Your next food creation</p>
          <h2 className="h-display mt-2 max-w-sm text-3xl md:text-4xl">What are you in the mood to invent?</h2>
          <p className="mt-2 max-w-sm text-ivory/70">Pick a few ingredients, see how they work together, and turn them into a recipe.</p>
          <span className="btn-primary mt-5">Open the Food Combiner →</span>
        </Link>
        <div className="grid gap-4">
          <Link to="/chef" className="card flex items-center gap-4 p-5 lift"><span className="tile grid h-14 w-14 shrink-0 place-items-center text-3xl">👨‍🍳</span><span><b className="block">Ask the AI Chef</b><span className="text-sm text-brown">"What can I make with what's in my fridge?"</span></span></Link>
          <Link to="/community" className="card flex items-center gap-4 p-5 lift"><span className="tile grid h-14 w-14 shrink-0 place-items-center text-3xl">🏆</span><span><b className="block">Weekly challenge</b><span className="text-sm text-brown">Three-Ingredient Wonders · 5 days left</span></span></Link>
        </div>
      </div>

      <Section title="Trending combinations" sub="Tap one to open it in the Combiner">
        <div className="no-scrollbar stagger -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 pt-1 md:mx-0 md:px-0 [&>*]:snap-start">
          {TRENDING_COMBOS.map((c) => (
            <Link key={c.name} to={`/combiner?ing=${c.ids.join(",")}`} className="card w-56 shrink-0 p-4 lift">
              <div className="mb-3 flex text-3xl">{c.ids.map((id) => <span key={id} className="-mr-2 grid h-12 w-12 place-items-center rounded-full border-2 border-white orb-fill shadow-[0_4px_10px_-4px_rgba(37,35,31,.25)]">{ING(id)?.emoji}</span>)}</div>
              <b className="block">{c.name}</b><span className="text-xs text-brown">{c.ids.map((id) => ING(id)?.name).join(" + ")}</span><p className="mt-1 text-xs text-brown">{c.note}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Popular recipes" to="/discover">{loading ? <CardSkeletons /> : <div className="stagger grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{popular.map((r) => <RecipeCard key={r.id} r={r} owned={owned.has(r.id)} />)}</div>}</Section>
      <Section title="Made for you" sub={`Based on ${reason}.`}>{loading ? <CardSkeletons /> : <div className="stagger grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{forYou.map((r) => <RecipeCard key={r.id} r={r} owned={owned.has(r.id)} />)}</div>}</Section>

      <Section title="Trending creators" to="/community">
        <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CREATORS.slice(0, 6).map((c) => (
            <div key={c.id} className="card flex items-center gap-3 p-4">
              <Link to={`/creator/${c.id}`}><Avatar emoji={c.emoji} hue={c.hue} size={52} /></Link>
              <Link to={`/creator/${c.id}`} className="min-w-0 flex-1"><b className="block truncate">{c.name}</b><span className="text-xs text-brown">{(c.followers / 1000).toFixed(1)}k followers · {c.badges[0]}</span></Link>
              <button onClick={() => toggleFollow(c.id)} className={following.includes(c.id) ? "btn-ghost !px-3 !py-1.5" : "btn-dark !px-3 !py-1.5"}>{following.includes(c.id) ? "Following" : "Follow"}</button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Marketplace highlights" to="/marketplace" sub="Original recipes from creators">{loading ? <CardSkeletons /> : <div className="stagger grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{market.map((r) => <RecipeCard key={r.id} r={r} owned={owned.has(r.id)} />)}</div>}</Section>

      {recentRecipes.length > 0 && <Section title="Recently viewed" sub="Pick up where you left off"><div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 md:mx-0 md:px-0">{recentRecipes.map((r) => <RecipeCard key={r.id} r={r} compact owned={owned.has(r.id)} />)}</div></Section>}
    </div>
  );
}
