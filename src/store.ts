import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ALL_RECIPES, CREATORS, INGREDIENTS, REVIEWS, SEED_POSTS } from "./data";
import type { CookStatus, AIConfig, Account, Appeal, Combo, Creator, Folder, Hold, Ingredient, Msg, Notif, Post, Purchase, Recipe, Removal, Report, ReportCategory, ReporterStats, Review, ShoppingItem, ShoppingList, Strike, Thread } from "./types";
import { blockReason, createSafety, type PostOutcome, type PublishOutcome } from "./safetyStore";
import type { Penalty } from "./safety";

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const MIN_AGE_SOCIAL = 13;
export const MIN_AGE_COMMERCE = 18;
export const ageOf = (a: Pick<Account, "birthYear">) => new Date().getFullYear() - a.birthYear;

/* Local-only credential vault. Passwords are salted + PBKDF2-hashed; plaintext is never stored.
   This is a stand-in for Firebase Auth / Supabase Auth in production (see docs/BACKEND.md). */
interface Cred { email: string; salt: string; hash: string; accountId: string }
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
async function hashPw(pw: string, salt: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 120000 }, key, 256));
}

const defaultNotify = { follows: true, likes: true, comments: true, purchases: true, creators: true, reviews: true, challenges: true, updates: true };

export interface State {
  accounts: Account[]; creds: Cred[]; session: string | null;
  customRecipes: Recipe[]; saved: string[]; favorites: string[]; recent: string[]; cooked: { id: string; at: string }[]; folders: Folder[];
  combos: Combo[]; customIngredients: Ingredient[]; frequent: string[];
  lists: ShoppingList[]; posts: Post[]; likedPosts: string[]; savedPosts: string[]; repostedPosts: string[]; votes: string[]; following: string[];
  threads: Thread[]; notifs: Notif[]; purchases: Purchase[]; cart: string[]; reviews: Review[]; reports: Report[]; searches: string[];
  awarded: Record<string, true>; dailyXp: { day: string; amount: number }; recipeStatusOverride: Record<string, Recipe["status"]>; featuredIds: string[]; announcements: { id: string; text: string; at: string }[];
  banned: string[]; ai: AIConfig; stripeConfigured: boolean;
  strikes: Strike[]; holds: Record<string, Hold>; appeals: Appeal[]; removals: Removal[]; reporterStats: Record<string, ReporterStats>; suspensions: Record<string, string>; blockedAttempts: Record<string, number>;
  challengeJoined: string[]; notes: Record<string, string>; cookStatus: Record<string, CookStatus>;

  signUp: (p: { name: string; email: string; password: string; birthYear: number }) => Promise<string | null>;
  logIn: (email: string, password: string) => Promise<string | null>;
  logOut: () => void;
  resetPassword: (email: string, newPassword: string) => Promise<string | null>;
  updateAccount: (p: Partial<Account>) => void;
  award: (key: string, amount: number) => void;

  toggleSave: (id: string) => void; toggleFav: (id: string) => void; view: (id: string) => void; markCooked: (id: string) => void;
  setNote: (id: string, text: string) => void; setCookStatus: (id: string, s: CookStatus | null) => void;
  renameFolder: (id: string, name: string, description?: string) => void; moveInFolder: (folderId: string, recipeId: string, dir: -1 | 1) => void;
  addFolder: (name: string) => void; deleteFolder: (id: string) => void; toggleInFolder: (folderId: string, recipeId: string) => void;
  upsertRecipe: (r: Recipe) => PublishOutcome; publishRecipe: (id: string) => PublishOutcome; setStatus: (id: string, s: Recipe["status"]) => void;
  saveCombo: (c: Combo) => void; deleteCombo: (id: string) => void;
  addCustomIngredient: (i: Ingredient) => void; toggleFrequent: (id: string) => void;
  createList: (name: string) => string; deleteList: (id: string) => void; addToList: (listId: string, items: { name: string; qty?: string; category?: string }[]) => void;
  toggleItem: (listId: string, itemId: string) => void; removeItem: (listId: string, itemId: string) => void; setItemQty: (listId: string, itemId: string, qty: string) => void; clearChecked: (listId: string) => void;
  addPost: (p: Omit<Post, "id" | "userId" | "userName" | "userEmoji" | "likes" | "comments" | "saves" | "reposts" | "createdAt">) => PostOutcome;
  toggleLike: (id: string) => void; toggleSavePost: (id: string) => void; repost: (id: string) => void; addComment: (id: string, text: string) => void; vote: (id: string) => void; joinChallenge: (id: string) => void;
  toggleFollow: (id: string) => void;
  openThread: (c: Creator) => string; send: (threadId: string, text: string) => void; readThread: (id: string) => void;
  readAll: () => void; readNotif: (id: string) => void;
  addCart: (id: string) => void; removeCart: (id: string) => void; checkout: () => { ok: boolean; error?: string }; requestRefund: (id: string) => void;
  addReview: (recipeId: string, rating: number, text: string) => string | null;
  report: (kind: Report["kind"], targetId: string, reason: string, category?: ReportCategory) => string | null; resolveReport: (id: string, status: Report["status"]) => void;
  actionReport: (id: string) => void; dismissReport: (id: string) => void; approveHold: (id: string) => void; rejectHold: (id: string, withStrike: boolean) => void;
  appeal: (targetId: string, text: string) => string | null; decideAppeal: (id: string, approve: boolean) => void; addStrike: (accountId: string, reason: string, targetId?: string) => Penalty | null;
  recordSearch: (q: string) => void; clearSearches: () => void;
  setAI: (c: AIConfig) => void; announce: (text: string) => void; toggleFeatured: (id: string) => void; ban: (id: string) => void;
  hidePost: (id: string) => void;
}

const seedNotifs: Notif[] = [
  { id: "n1", type: "challenge", text: "Weekly challenge “Three-Ingredient Wonders” is live.", at: "1h", read: false },
  { id: "n2", type: "post", text: "Marguerite Lowell published a new post.", at: "2h", read: false },
  { id: "n3", type: "update", text: "Welcome to CRUNCH. Start by combining a few ingredients.", at: "1d", read: true },
];
const seedThreads: Thread[] = [];

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const notify = (n: Omit<Notif, "id" | "at" | "read">) => set((s) => ({ notifs: [{ id: uid(), at: "now", read: false, ...n }, ...s.notifs] }));
      const me = () => get().accounts.find((a) => a.id === get().session) ?? null;
      const safety = createSafety(set, get);
      return {
        accounts: [], creds: [], session: null,
        customRecipes: [], saved: ["r3", "r4"], favorites: [], recent: [], cooked: [], folders: [{ id: "f1", name: "Recipes to Try", recipeIds: [] }, { id: "f2", name: "Family Favorites", recipeIds: [] }],
        combos: [], customIngredients: [], frequent: [],
        lists: [{ id: "l1", name: "Groceries", items: [] }], posts: SEED_POSTS, likedPosts: [], savedPosts: [], repostedPosts: [], votes: [], following: ["c1"],
        threads: seedThreads, notifs: seedNotifs, purchases: [], cart: [], reviews: REVIEWS, reports: [], searches: [],
        awarded: {}, dailyXp: { day: "", amount: 0 }, recipeStatusOverride: {}, featuredIds: ["r1", "r3", "r9"], announcements: [],
        strikes: [], holds: {}, appeals: [], removals: [], reporterStats: {}, suspensions: {}, blockedAttempts: {},
        banned: [], ai: { endpoint: "", model: "", key: "" }, stripeConfigured: false, challengeJoined: [], notes: {}, cookStatus: {},

        async signUp({ name, email, password, birthYear }) {
          email = email.trim().toLowerCase();
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return "Enter a valid email address.";
          if (name.trim().length < 2) return "Enter your name.";
          if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) return "Password needs 8+ characters with letters and numbers.";
          const age = new Date().getFullYear() - birthYear;
          if (!birthYear || birthYear < 1900 || age < 0) return "Enter a valid birth year.";
          if (age < MIN_AGE_SOCIAL) return `CRUNCH requires users to be at least ${MIN_AGE_SOCIAL}.`;
          if (get().creds.some((c) => c.email === email)) return "An account with that email already exists.";
          const salt = uid() + uid();
          const hash = await hashPw(password, salt);
          const first = get().accounts.length === 0;
          const acct: Account = {
            id: "u_" + uid(), name: name.trim(), email, handle: "@" + name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "") + Math.floor(Math.random() * 90 + 10), bio: "", emoji: "🍳",
            birthYear, role: first ? "admin" : "user", plus: false, xp: 0, createdAt: new Date().toISOString(), diet: [], allergies: [], level: "Home cook",
            notify: { ...defaultNotify }, privacy: { publicProfile: true, showActivity: true, allowDMs: true },
          };
          set((s) => ({ accounts: [...s.accounts, acct], creds: [...s.creds, { email, salt, hash, accountId: acct.id }], session: acct.id }));
          return null;
        },
        async logIn(email, password) {
          email = email.trim().toLowerCase();
          const c = get().creds.find((x) => x.email === email);
          if (!c || (await hashPw(password, c.salt)) !== c.hash) return "Incorrect email or password.";
          if (get().banned.includes(c.accountId)) return "This account has been permanently banned for breaking the safety rules.";
          set({ session: c.accountId });
          return null;
        },
        logOut: () => set({ session: null }),
        async resetPassword(email, newPassword) {
          email = email.trim().toLowerCase();
          if (newPassword.length < 8 || !/\d/.test(newPassword) || !/[a-zA-Z]/.test(newPassword)) return "Password needs 8+ characters with letters and numbers.";
          const c = get().creds.find((x) => x.email === email);
          if (!c) return null; // do not reveal whether an account exists
          const salt = uid() + uid(); const hash = await hashPw(newPassword, salt);
          set((s) => ({ creds: s.creds.map((x) => (x.email === email ? { ...x, salt, hash } : x)) }));
          return null;
        },
        updateAccount: (p) => set((s) => ({ accounts: s.accounts.map((a) => (a.id === s.session ? { ...a, ...p } : a)) })),
        award(key, amount) {
          const s = get(); const a = me(); if (!a || s.awarded[key]) return;
          const day = new Date().toDateString();
          const used = s.dailyXp.day === day ? s.dailyXp.amount : 0;
          const grant = Math.max(0, Math.min(amount, 250 - used)); // daily cap to prevent farming
          if (!grant) return;
          set((st) => ({ awarded: { ...st.awarded, [key]: true }, dailyXp: { day, amount: used + grant }, accounts: st.accounts.map((x) => (x.id === a.id ? { ...x, xp: x.xp + grant } : x)) }));
        },

        toggleSave(id) { set((s) => ({ saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [id, ...s.saved] })); },
        toggleFav(id) { set((s) => ({ favorites: s.favorites.includes(id) ? s.favorites.filter((x) => x !== id) : [id, ...s.favorites] })); },
        view(id) { set((s) => ({ recent: [id, ...s.recent.filter((x) => x !== id)].slice(0, 12) })); },
        markCooked(id) { set((s) => ({ cooked: [{ id, at: new Date().toISOString() }, ...s.cooked] })); get().award("cook:" + id, 20); },
        setNote(id, text) { set((s) => { const notes = { ...s.notes }; if (text.trim()) notes[id] = text.slice(0, 2000); else delete notes[id]; return { notes }; }); },
        setCookStatus(id, st) { set((s) => { const cookStatus = { ...s.cookStatus }; if (st) cookStatus[id] = st; else delete cookStatus[id]; return { cookStatus }; }); },
        renameFolder(id, name, description) { set((s) => ({ folders: s.folders.map((f) => (f.id === id ? { ...f, name: name.slice(0, 40), description: description?.slice(0, 200) } : f)) })); },
        moveInFolder(fid, rid, dir) { set((s) => ({ folders: s.folders.map((f) => { if (f.id !== fid) return f; const a = [...f.recipeIds]; const i = a.indexOf(rid); const j = i + dir; if (i < 0 || j < 0 || j >= a.length) return f; [a[i], a[j]] = [a[j], a[i]]; return { ...f, recipeIds: a }; }) })); },
        addFolder(name) { set((s) => ({ folders: [...s.folders, { id: uid(), name, recipeIds: [] }] })); },
        deleteFolder(id) { set((s) => ({ folders: s.folders.filter((f) => f.id !== id) })); },
        toggleInFolder(fid, rid) { set((s) => ({ folders: s.folders.map((f) => (f.id === fid ? { ...f, recipeIds: f.recipeIds.includes(rid) ? f.recipeIds.filter((x) => x !== rid) : [...f.recipeIds, rid] } : f)) })); },
        ...safety,
        publishRecipe(id) { const r = get().customRecipes.find((x) => x.id === id); return r ? safety.upsertRecipe({ ...r, status: "published" }) : { result: "blocked", flags: [], message: "Recipe not found." }; },
        setStatus(id, status) {
          const isCustom = get().customRecipes.some((r) => r.id === id);
          if (isCustom) set((s) => ({ customRecipes: s.customRecipes.map((r) => (r.id === id ? { ...r, status } : r)) }));
          else set((s) => ({ recipeStatusOverride: { ...s.recipeStatusOverride, [id]: status } }));
        },
        saveCombo(c) { set((s) => ({ combos: s.combos.some((x) => x.id === c.id) ? s.combos.map((x) => (x.id === c.id ? c : x)) : [c, ...s.combos] })); get().award("combo:" + c.id, 10); },
        deleteCombo(id) { set((s) => ({ combos: s.combos.filter((c) => c.id !== id) })); },
        addCustomIngredient(i) { set((s) => ({ customIngredients: [...s.customIngredients, i] })); },
        toggleFrequent(id) { set((s) => ({ frequent: s.frequent.includes(id) ? s.frequent.filter((x) => x !== id) : [...s.frequent, id] })); },

        createList(name) { const id = uid(); set((s) => ({ lists: [...s.lists, { id, name, items: [] }] })); return id; },
        deleteList(id) { set((s) => ({ lists: s.lists.filter((l) => l.id !== id) })); },
        addToList(listId, items) {
          set((s) => ({ lists: s.lists.map((l) => {
            if (l.id !== listId) return l;
            const next = [...l.items];
            items.forEach((it) => {
              const ex = next.find((x) => x.name.toLowerCase() === it.name.toLowerCase());
              if (!ex) next.push({ id: uid(), name: it.name, qty: it.qty ?? "1", category: it.category ?? INGREDIENTS.find((i) => i.name.toLowerCase() === it.name.toLowerCase())?.category ?? "Other", checked: false });
            });
            return { ...l, items: next };
          }) }));
        },
        toggleItem(l, i) { set((s) => ({ lists: s.lists.map((x) => (x.id === l ? { ...x, items: x.items.map((it) => (it.id === i ? { ...it, checked: !it.checked } : it)) } : x)) })); },
        removeItem(l, i) { set((s) => ({ lists: s.lists.map((x) => (x.id === l ? { ...x, items: x.items.filter((it) => it.id !== i) } : x)) })); },
        setItemQty(l, i, qty) { set((s) => ({ lists: s.lists.map((x) => (x.id === l ? { ...x, items: x.items.map((it: ShoppingItem) => (it.id === i ? { ...it, qty } : it)) } : x)) })); },
        clearChecked(l) { set((s) => ({ lists: s.lists.map((x) => (x.id === l ? { ...x, items: x.items.filter((it) => !it.checked) } : x)) })); },

        toggleLike(id) {
          const liked = get().likedPosts.includes(id);
          set((s) => ({ likedPosts: liked ? s.likedPosts.filter((x) => x !== id) : [...s.likedPosts, id], posts: s.posts.map((p) => (p.id === id ? { ...p, likes: p.likes + (liked ? -1 : 1) } : p)) }));
        },
        toggleSavePost(id) {
          const on = get().savedPosts.includes(id);
          set((s) => ({ savedPosts: on ? s.savedPosts.filter((x) => x !== id) : [...s.savedPosts, id], posts: s.posts.map((p) => (p.id === id ? { ...p, saves: p.saves + (on ? -1 : 1) } : p)) }));
        },
        repost(id) {
          if (get().repostedPosts.includes(id)) return;
          set((s) => ({ repostedPosts: [...s.repostedPosts, id], posts: s.posts.map((p) => (p.id === id ? { ...p, reposts: p.reposts + 1 } : p)) }));
        },
        addComment(id, text) {
          const a = me(); if (!a || !text.trim()) return;
          set((s) => ({ posts: s.posts.map((p) => (p.id === id ? { ...p, comments: [...p.comments, { id: uid(), userName: a.name, text: text.trim().slice(0, 500) }] } : p)) }));
          get().award("comment:" + id, 2);
        },
        vote(id) { if (get().votes.includes(id)) set((s) => ({ votes: s.votes.filter((x) => x !== id) })); else set((s) => ({ votes: [...s.votes, id] })); },
        joinChallenge(id) { set((s) => ({ challengeJoined: s.challengeJoined.includes(id) ? s.challengeJoined : [...s.challengeJoined, id] })); get().award("challenge:" + id, 40); },
        toggleFollow(id) { set((s) => ({ following: s.following.includes(id) ? s.following.filter((x) => x !== id) : [...s.following, id] })); },

        openThread(c) {
          const ex = get().threads.find((t) => t.withId === c.id); if (ex) return ex.id;
          const t: Thread = { id: uid(), withId: c.id, withName: c.name, emoji: c.emoji, messages: [], unread: 0 };
          set((s) => ({ threads: [t, ...s.threads] })); return t.id;
        },
        send(threadId, text) {
          const t = text.trim().slice(0, 2000); if (!t || blockReason(get(), get().session)) return;
          const m: Msg = { id: uid(), from: "me", text: t, at: new Date().toISOString() };
          set((s) => ({ threads: s.threads.map((x) => (x.id === threadId ? { ...x, messages: [...x.messages, m] } : x)) }));
        },
        readThread: (id) => set((s) => ({ threads: s.threads.map((t) => (t.id === id ? { ...t, unread: 0 } : t)) })),
        readAll: () => set((s) => ({ notifs: s.notifs.map((n) => ({ ...n, read: true })) })),
        readNotif: (id) => set((s) => ({ notifs: s.notifs.map((n) => (n.id === id ? { ...n, read: true } : n)) })),

        addCart(id) { set((s) => ({ cart: s.cart.includes(id) ? s.cart : [...s.cart, id] })); },
        removeCart(id) { set((s) => ({ cart: s.cart.filter((x) => x !== id) })); },
        checkout() {
          const s = get(); const a = me();
          if (!a) return { ok: false, error: "Sign in to purchase." };
          if (ageOf(a) < MIN_AGE_COMMERCE) return { ok: false, error: `Purchases require an account holder aged ${MIN_AGE_COMMERCE}+. Ask a parent or guardian.` };
          if (!s.cart.length) return { ok: false, error: "Your cart is empty." };
          // Prices are re-read from the catalogue here, never from client-supplied values.
          const catalogue = [...ALL_RECIPES, ...s.customRecipes];
          const items = s.cart.map((id) => catalogue.find((r) => r.id === id)).filter((r): r is Recipe => !!r && r.status === "published" && r.price > 0);
          const owned = new Set(s.purchases.filter((p) => p.status !== "refunded").flatMap((p) => p.recipeIds));
          const ids = items.flatMap((r) => (r.bundleOf ? [r.id, ...r.bundleOf] : [r.id])).filter((id) => !owned.has(id));
          const total = items.reduce((t, r) => t + r.price, 0);
          if (!ids.length) { set({ cart: [] }); return { ok: false, error: "You already own these recipes." }; }
          // Without a configured payment provider no money moves; the record is clearly marked as a demo purchase.
          const p: Purchase = { id: "ord_" + uid(), recipeIds: ids, total: Math.round(total * 100) / 100, at: new Date().toISOString(), status: "paid", method: "demo" };
          set((st) => ({ purchases: [p, ...st.purchases], cart: [], saved: [...new Set([...ids, ...st.saved])] }));
          notify({ type: "purchase", text: `Order ${p.id} complete — recipes unlocked in My Cookbook.` });
          get().award("buy:" + p.id, 15);
          return { ok: true };
        },
        requestRefund(id) { set((s) => ({ purchases: s.purchases.map((p) => (p.id === id && p.status === "paid" ? { ...p, status: "refund_requested" } : p)) })); notify({ type: "update", text: "Refund request submitted. We review requests within 5 business days." }); },
        addReview(recipeId, rating, text) {
          const s = get(); const a = me(); if (!a) return "Sign in to review.";
          const blocked = blockReason(s, a.id); if (blocked) return blocked;
          const owns = s.purchases.some((p) => p.status !== "refunded" && p.recipeIds.includes(recipeId));
          const recipe = [...ALL_RECIPES, ...s.customRecipes].find((r) => r.id === recipeId);
          if (recipe && recipe.price > 0 && !owns) return "Only buyers can review paid recipes.";
          if (recipe?.creatorId === a.id) return "You can't review your own recipe.";
          if (s.reviews.some((r) => r.recipeId === recipeId && r.userId === a.id)) return "You've already reviewed this recipe.";
          if (text.trim().length < 10) return "Write at least 10 characters.";
          set((st) => ({ reviews: [{ id: uid(), recipeId, userId: a.id, userName: a.name, rating, text: text.trim().slice(0, 1500), verified: owns, createdAt: new Date().toISOString().slice(0, 10) }, ...st.reviews] }));
          get().award("review:" + recipeId, 10);
          return null;
        },
        resolveReport(id, status) { if (status === "actioned") safety.actionReport(id); else if (status === "dismissed") safety.dismissReport(id); },
        recordSearch(q) { q = q.trim(); if (q) set((s) => ({ searches: [q, ...s.searches.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 8) })); },
        clearSearches: () => set({ searches: [] }),
        setAI: (ai) => set({ ai }),
        announce(text) { set((s) => ({ announcements: [{ id: uid(), text, at: new Date().toISOString() }, ...s.announcements] })); },
        toggleFeatured(id) { set((s) => ({ featuredIds: s.featuredIds.includes(id) ? s.featuredIds.filter((x) => x !== id) : [...s.featuredIds, id] })); },
        ban(id) { set((s) => ({ banned: s.banned.includes(id) ? s.banned.filter((x) => x !== id) : [...s.banned, id] })); },
        hidePost(id) { set((s) => ({ posts: s.posts.map((p) => (p.id === id ? { ...p, hidden: !p.hidden } : p)) })); },
      };
    },
    { name: "crunch-v1", version: 1 },
  ),
);

/* ---------- selectors / helpers ---------- */
export function useMe(): Account | null { return useStore((s) => s.accounts.find((a) => a.id === s.session) ?? null); }
export function useCatalogue(): Recipe[] {
  const custom = useStore((s) => s.customRecipes); const ov = useStore((s) => s.recipeStatusOverride);
  return [...ALL_RECIPES.map((r) => (ov[r.id] ? { ...r, status: ov[r.id] } : r)), ...custom];
}
export function useIngredients(): Ingredient[] { const c = useStore((s) => s.customIngredients); return [...INGREDIENTS, ...c]; }
export function creatorOf(id: string, accounts: Account[]): Creator {
  const c = CREATORS.find((x) => x.id === id); if (c) return c;
  const a = accounts.find((x) => x.id === id);
  return { id, name: a?.name ?? "CRUNCH cook", handle: a?.handle ?? "@cook", emoji: a?.emoji ?? "🍳", hue: 30, bio: a?.bio ?? "", followers: 0, badges: [], rating: 0 };
}
export function useOwnedIds(): Set<string> {
  const p = useStore((s) => s.purchases);
  return new Set(p.filter((x) => x.status !== "refunded").flatMap((x) => x.recipeIds));
}
/** Single source of truth for whether full recipe content may be shown. Server must enforce the same rule. */
export function canAccess(r: Recipe, owned: Set<string>, meId: string | null): boolean {
  return r.price === 0 || owned.has(r.id) || r.creatorId === meId;
}
