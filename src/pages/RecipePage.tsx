import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { RecipeBody } from "../RecipeBody";
import { canAccess, useCatalogue, useMe, useOwnedIds, useStore } from "../store";
import { Empty } from "../ui";

export default function RecipePage() {
  const { id } = useParams(); const cat = useCatalogue(); const owned = useOwnedIds(); const me = useMe(); const view = useStore((s) => s.view);
  const r = cat.find((x) => x.id === id);
  useEffect(() => { if (r) view(r.id); }, [r?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!r) return <Empty emoji="🔍" title="Recipe not found" text="It may have been removed or unpublished." action={<Link to="/discover" className="btn-primary">Discover recipes</Link>} />;
  if (r.status !== "published" && r.creatorId !== me?.id) return <Empty emoji="🚫" title="This recipe isn't available" action={<Link to="/discover" className="btn-primary">Discover recipes</Link>} />;
  if (!canAccess(r, owned, me?.id ?? null)) return <Navigate to={`/marketplace/${r.id}`} replace />;
  return <RecipeBody r={r} />;
}
