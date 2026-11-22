import { Component, Suspense, lazy, type ReactNode } from "react";
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from "react-router-dom";

/** Hash routing for single-file hosting (e.g. a shared preview link); normal paths everywhere else. */
const Router = import.meta.env.VITE_HASH_ROUTER ? HashRouter : BrowserRouter;
import { Layout } from "./Layout";
import { useMe } from "./store";
import { Toaster, CardSkeletons } from "./ui";
import { ThemeDecor } from "./theme";

const Auth = lazy(() => import("./pages/Auth"));
const Home = lazy(() => import("./pages/Home"));
const Combiner = lazy(() => import("./pages/Combiner"));
const Chef = lazy(() => import("./pages/Chef"));
const Discover = lazy(() => import("./pages/Discover"));
const Search = lazy(() => import("./pages/Search"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Product = lazy(() => import("./pages/Product"));
const Cart = lazy(() => import("./pages/Cart"));
const RecipePage = lazy(() => import("./pages/RecipePage"));
const CookMode = lazy(() => import("./pages/CookMode"));
const Shop = lazy(() => import("./pages/Shop"));
const Community = lazy(() => import("./pages/Community"));
const Cookbook = lazy(() => import("./pages/Cookbook"));
const Lists = lazy(() => import("./pages/Lists"));
const Messages = lazy(() => import("./pages/Messages"));
const Profile = lazy(() => import("./pages/Profile"));
const CreatorPage = lazy(() => import("./pages/CreatorPage"));
const Studio = lazy(() => import("./pages/Studio"));
const RecipeEditor = lazy(() => import("./pages/RecipeEditor"));
const Settings = lazy(() => import("./pages/Settings"));
const Admin = lazy(() => import("./pages/Admin"));
const Plus = lazy(() => import("./pages/Plus"));

class Boundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  componentDidCatch(err: Error) { console.error("[crunch] render error", err); }
  render() {
    if (!this.state.err) return this.props.children;
    return <div className="grid min-h-screen place-items-center p-6 text-center"><div><div className="text-5xl">🫠</div><h1 className="h-display mt-2 text-2xl">Something went wrong</h1><p className="mt-1 text-sm text-brown">{this.state.err.message}</p><button className="btn-primary mt-4" onClick={() => location.assign("/")}>Back home</button></div></div>;
  }
}

function Gate({ children }: { children: ReactNode }) { const me = useMe(); return me ? <>{children}</> : <Navigate to="/auth" replace />; }
function AdminGate({ children }: { children: ReactNode }) { const me = useMe(); return me?.role === "admin" ? <>{children}</> : <Navigate to="/" replace />; }

export function App() {
  return (
    <Boundary>
      <Router>
        <Suspense fallback={<div className="mx-auto max-w-7xl p-8"><CardSkeletons /></div>}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<Gate><Layout /></Gate>}>
              <Route index element={<Home />} />
              <Route path="combiner" element={<Combiner />} />
              <Route path="chef" element={<Chef />} />
              <Route path="discover" element={<Discover />} />
              <Route path="search" element={<Search />} />
              <Route path="marketplace" element={<Marketplace />} />
              <Route path="marketplace/cart" element={<Cart />} />
              <Route path="marketplace/:id" element={<Product />} />
              <Route path="recipe/:id" element={<RecipePage />} />
              <Route path="cook/:id" element={<CookMode />} />
              <Route path="shop" element={<Shop />} />
              <Route path="shop/:id" element={<Shop />} />
              <Route path="community" element={<Community />} />
              <Route path="cookbook" element={<Cookbook />} />
              <Route path="saved" element={<Cookbook saved />} />
              <Route path="lists" element={<Lists />} />
              <Route path="messages" element={<Messages />} />
              <Route path="profile" element={<Profile />} />
              <Route path="creator/new" element={<RecipeEditor />} />
              <Route path="creator/edit/:id" element={<RecipeEditor />} />
              <Route path="creator/studio" element={<Studio />} />
              <Route path="creator/:id" element={<CreatorPage />} />
              <Route path="settings" element={<Settings />} />
              <Route path="plus" element={<Plus />} />
              <Route path="admin" element={<AdminGate><Admin /></AdminGate>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
        <Toaster />
        <ThemeDecor />
      </Router>
    </Boundary>
  );
}
