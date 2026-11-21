export type Category =
  | "Fruits" | "Vegetables" | "Meats" | "Seafood" | "Dairy" | "Cheese" | "Grains" | "Pasta"
  | "Sauces" | "Spices" | "Snacks" | "Desserts" | "Drinks" | "Baking" | "Other";

export type Taste = "sweet" | "salty" | "sour" | "bitter" | "umami" | "fat" | "heat";
export type Texture = "crisp" | "creamy" | "soft" | "chewy" | "juicy" | "crumbly" | "liquid";

export interface Nutrition { calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodium: number }

export interface Ingredient {
  id: string; name: string; category: Category; emoji: string; description: string;
  taste: Partial<Record<Taste, number>>; textures: Texture[];
  per100g: Nutrition; allergens: string[]; uses: string[]; storage: string; substitutes: string[];
  tags?: string[]; // vegan, vegetarian, gluten-free...
  custom?: boolean;
}

export interface RecipeIngredient { name: string; amount: string }
export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Recipe {
  id: string; title: string; description: string; emoji: string; hue: number;
  creatorId: string; ingredients: RecipeIngredient[]; steps: { text: string; timerMin?: number }[];
  prepMin: number; cookMin: number; servings: number; difficulty: Difficulty; cuisine: string;
  meal: string; categories: string[]; diet: string[]; price: number; rating: number; reviews: number;
  sales: number; views: number; nutrition: Nutrition; allergens: string[]; equipment: string[];
  substitutions: string[]; storage: string; status: "published" | "draft" | "unpublished" | "removed";
  createdAt: string; bundleOf?: string[]; ai?: boolean; featured?: boolean; seasonal?: string;
}

export interface Creator {
  id: string; name: string; handle: string; emoji: string; hue: number; bio: string;
  followers: number; badges: string[]; rating: number; verified?: boolean;
}

export interface Review { id: string; recipeId: string; userId: string; userName: string; rating: number; text: string; verified: boolean; createdAt: string }

export interface Post {
  id: string; userId: string; userName: string; userEmoji: string; text: string; emoji: string; hue: number;
  ingredients: string[]; recipeId?: string; likes: number; comments: { id: string; userName: string; text: string }[];
  saves: number; reposts: number; createdAt: string; challengeId?: string; hidden?: boolean;
}

export interface Challenge { id: string; title: string; description: string; emoji: string; endsIn: string; rule: string }

export interface Combo {
  id: string; name: string; items: { id: string; qty: number; unit: string }[]; notes: string; createdAt: string; photo?: string;
}

export interface ShoppingItem { id: string; name: string; qty: string; category: string; checked: boolean }
export interface ShoppingList { id: string; name: string; items: ShoppingItem[] }

export interface Msg { id: string; from: "me" | "them"; text: string; at: string }
export interface Thread { id: string; withId: string; withName: string; emoji: string; messages: Msg[]; unread: number }

export interface Notif { id: string; type: "follow" | "like" | "comment" | "purchase" | "post" | "review" | "challenge" | "update"; text: string; at: string; read: boolean }

export interface Purchase { id: string; recipeIds: string[]; total: number; at: string; status: "paid" | "refund_requested" | "refunded"; method: "demo" | "stripe" }

export interface Report { id: string; kind: "listing" | "creator" | "post"; targetId: string; reason: string; at: string; status: "open" | "actioned" | "dismissed" }

export interface Account {
  id: string; name: string; email: string; handle: string; bio: string; emoji: string;
  birthYear: number; role: "user" | "admin"; plus: boolean; xp: number; createdAt: string;
  diet: string[]; allergies: string[]; level: "Beginner" | "Home cook" | "Confident" | "Pro";
  notify: Record<string, boolean>; privacy: { publicProfile: boolean; showActivity: boolean; allowDMs: boolean };
}

export interface Folder { id: string; name: string; recipeIds: string[] }
export interface AIConfig { endpoint: string; model: string; key: string }
