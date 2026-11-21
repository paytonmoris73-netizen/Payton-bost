/* Ingredient substitution knowledge base. Each entry says what changes, so nothing is a silent swap.
   Substitutions are general cooking guidance, not allergy or food-safety guarantees. */
export type Tag = "vegan" | "vegetarian" | "dairy-free" | "gluten-free";
export interface Sub {
  with: string; amount: string; taste: string; texture: string; process: string;
  allergens: string[]; // allergens the replacement itself introduces
  tags: Tag[];         // dietary labels the replacement satisfies
}

const S = (w: string, amount: string, taste: string, texture: string, process: string, allergens: string[], tags: Tag[]): Sub => ({ with: w, amount, taste, texture, process, allergens, tags });
const V: Tag[] = ["vegan", "vegetarian", "dairy-free", "gluten-free"];

export const SUBS: Record<string, Sub[]> = {
  butter: [
    S("Olive oil", "¾ the amount", "Fruitier, less rich", "Slightly less tender in baking", "None for cooking; reduce liquid slightly in baking", [], V),
    S("Coconut oil", "1:1", "Mild coconut note", "Firmer when cold", "None", [], V),
    S("Vegan butter", "1:1", "Close to butter", "Very similar", "None; check the label for nuts or soy", ["soy"], ["vegan", "vegetarian", "dairy-free", "gluten-free"]),
  ],
  milk: [
    S("Oat milk", "1:1", "Slightly sweet, mild", "Slightly thinner", "None", [], ["vegan", "vegetarian", "dairy-free"]),
    S("Soy milk", "1:1", "Neutral, a little beany", "Closest to milk", "None; can curdle in very acidic liquids", ["soy"], V),
    S("Coconut milk", "1:1", "Coconut flavour, richer", "Thicker", "None", [], V),
  ],
  "heavy cream": [
    S("Coconut cream", "1:1", "Coconut flavour", "Thick and rich", "Can be whipped if chilled", [], V),
    S("Greek yogurt", "¾ the amount, off the heat", "Tangier", "Thick, can split if boiled", "Add after cooking, never boil", ["milk"], ["vegetarian", "gluten-free"]),
    S("Cashew cream", "1:1", "Mild, nutty", "Smooth and rich", "Soak and blend cashews with water first", ["tree nuts"], V),
  ],
  egg: [
    S("Flax egg (1 tbsp ground flax + 3 tbsp water)", "per egg", "Nutty", "Denser, binds but won't lift", "Rest 5 minutes to gel; for binding, not for meringue or omelettes", [], V),
    S("Unsweetened applesauce", "¼ cup per egg", "Slightly fruity", "Moister, denser", "For baking only; reduce other liquid slightly", [], V),
    S("Silken tofu, blended", "¼ cup per egg", "Neutral", "Soft, custardy", "For baking and binding", ["soy"], V),
  ],
  honey: [
    S("Maple syrup", "1:1", "Maple flavour, less floral", "Slightly thinner", "None", [], V),
    S("Agave syrup", "1:1", "Neutral sweet", "Thinner", "Browns faster in baking", [], V),
  ],
  sugar: [
    S("Brown sugar", "1:1", "Molasses depth", "Moister, chewier", "None", [], V),
    S("Maple syrup", "¾ the amount", "Maple flavour", "Moister", "Reduce other liquid by about 3 tbsp per cup", [], V),
  ],
  flour: [
    S("Gluten-free flour blend", "1:1", "Neutral", "Can be crumblier", "Add a binder such as xanthan gum if the blend lacks one; let batter rest", [], ["vegan", "vegetarian", "dairy-free", "gluten-free"]),
    S("Oat flour (certified gluten-free)", "1 ⅓ the amount", "Nutty", "Denser", "Best in cookies and pancakes", [], ["vegan", "vegetarian", "dairy-free", "gluten-free"]),
  ],
  "soy sauce": [
    S("Coconut aminos", "1:1", "Sweeter, less salty", "Same", "Add a pinch more salt if needed", [], V),
    S("Tamari (labelled gluten-free)", "1:1", "Rounder, slightly less salty", "Same", "Still soy; check the label for wheat", ["soy"], V),
  ],
  mayonnaise: [
    S("Greek yogurt", "1:1", "Tangier, lighter", "Thinner", "Add a little mustard for body", ["milk"], ["vegetarian", "gluten-free"]),
    S("Vegan mayonnaise", "1:1", "Close", "Close", "None; check the label", ["soy"], ["vegan", "vegetarian", "dairy-free", "gluten-free"]),
  ],
  "chicken breast": [
    S("Extra-firm tofu, pressed", "same weight", "Neutral, absorbs marinades", "Softer, less fibrous", "Press 20 minutes; cook until golden, no safe-temperature check needed", ["soy"], V),
    S("Chickpeas", "1 can per 2 breasts", "Earthy, nutty", "Tender, not meaty", "Shorter cook time; simmer just to heat through", [], V),
  ],
  "ground beef": [
    S("Brown lentils (cooked)", "same weight", "Earthy", "Softer, less fatty", "Add a splash of oil and extra seasoning", [], V),
    S("Finely chopped mushrooms", "same weight", "Savoury, umami", "Moist, tender", "Cook off the water first", [], V),
  ],
  bacon: [
    S("Smoked paprika + mushrooms", "to taste", "Smoky and savoury", "Chewy", "Fry mushrooms until browned, then season", [], V),
  ],
  "parmesan": [
    S("Nutritional yeast", "2 tbsp per ¼ cup", "Cheesy, nutty", "Powdery, doesn't melt", "Sprinkle at the end", [], V),
    S("Pecorino", "1:1", "Saltier, sharper", "Similar", "Reduce added salt", ["milk"], ["vegetarian", "gluten-free"]),
  ],
  "greek yogurt": [
    S("Coconut yogurt", "1:1", "Mild coconut", "Slightly thinner", "None", [], V),
  ],
  lemon: [S("Lime", "1:1", "Slightly more bitter", "Same", "None", [], V), S("White wine vinegar", "½ the amount", "Sharper, less fruity", "Same", "Add gradually", [], V)],
  lime: [S("Lemon", "1:1", "Sweeter, less floral", "Same", "None", [], V)],
  spaghetti: [S("Rice noodles", "same weight", "Neutral", "Softer", "Soak or boil briefly per packet", [], ["vegan", "vegetarian", "dairy-free", "gluten-free"]), S("Penne", "1:1", "Same", "Same", "Adjust boil time to the packet", ["wheat"], ["vegan", "vegetarian", "dairy-free"])],
  salmon: [S("Marinated tofu steaks", "same weight", "Savoury", "Firmer", "Bake until golden; add nori or lemon for a sea note", ["soy"], V)],
  shrimp: [S("King oyster mushrooms, scored", "same weight", "Savoury, mild", "Chewy-tender", "Sear hard in a hot pan", [], V)],
  tuna: [S("Mashed chickpeas", "same weight", "Mild, earthy", "Flaky-soft", "Add seaweed or capers for brininess", [], V)],
  "peanut butter": [S("Sunflower seed butter", "1:1", "Slightly earthy", "Same", "None; a pinch of sugar offsets bitterness", [], V), S("Tahini", "1:1", "Nutty, a little bitter", "Slightly looser", "Add a little sweetener", ["sesame"], V)],
  cheddar: [S("Vegan cheese shreds", "1:1", "Milder", "Melts less smoothly", "Melt gently", [], ["vegan", "vegetarian", "dairy-free", "gluten-free"])],
  mozzarella: [S("Vegan mozzarella", "1:1", "Milder", "Less stretch", "Melt gently", [], ["vegan", "vegetarian", "dairy-free", "gluten-free"])],
  "cream cheese": [S("Cashew cream cheese", "1:1", "Nutty, tangy", "Similar", "None", ["tree nuts"], V)],
  breadcrumbs: [S("Crushed gluten-free cornflakes", "1:1", "Slightly sweet", "Crunchier", "None", [], V)],
};

const ALIASES: Record<string, string> = { eggs: "egg", cream: "heavy cream", "double cream": "heavy cream", "parmesan cheese": "parmesan", "chicken": "chicken breast", "beef": "ground beef", "minced beef": "ground beef", yoghurt: "greek yogurt", "greek yoghurt": "greek yogurt", "plain flour": "flour", "all-purpose flour": "flour", "white sugar": "sugar", "caster sugar": "sugar", prawns: "shrimp", prawn: "shrimp" };
export const subKey = (name: string) => { const k = name.toLowerCase().trim(); return SUBS[k] ? k : ALIASES[k] && SUBS[ALIASES[k]] ? ALIASES[k] : null; };
export const hasSubs = (name: string) => subKey(name) !== null;

export interface SubResult { sub: Sub; blocked: false }
export interface SubBlocked { sub: Sub; blocked: true; reason: string }

/** Returns usable substitutes (excluding any that introduce an allergen the user avoids) plus the blocked ones with the reason. */
export function substitutesFor(name: string, opts: { allergies?: string[]; diet?: string[] } = {}): { ok: Sub[]; blocked: SubBlocked[] } {
  const key = subKey(name); if (!key) return { ok: [], blocked: [] };
  const allergies = (opts.allergies ?? []).map((a) => a.toLowerCase()); const diet = (opts.diet ?? []) as Tag[];
  const ok: Sub[] = []; const blocked: SubBlocked[] = [];
  for (const sub of SUBS[key]) {
    const hit = sub.allergens.find((a) => allergies.some((x) => a.includes(x) || x.includes(a)));
    const missed = diet.find((d) => !sub.tags.includes(d));
    if (hit) blocked.push({ sub, blocked: true, reason: `Contains ${hit}, which is on your allergy list.` });
    else if (missed) blocked.push({ sub, blocked: true, reason: `Doesn't meet your ${missed} preference.` });
    else ok.push(sub);
  }
  return { ok, blocked };
}
