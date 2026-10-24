// Food library (shipped as a lazy-loaded JSON chunk) + the nutrition maths the tracker needs.
import type { Profile } from './types';

export interface Nutr { kcal: number; p: number; c: number; f: number; fb: number }

/** Per 100 g. */
export interface Ingredient { id: string; n: string; aka?: string; grp: string; src: string; k: number; p: number; c: number; f: number; fb: number; u?: [string, number][] }
/** Per one serving of `unit`, weighing `g` cooked. `r` = raw ingredient grams for one serving. */
export interface Dish { id: string; n: string; aka?: string; cat: string; diet: 'v' | 'e' | 'n'; unit: string; g: number; k: number; p: number; c: number; f: number; fb: number; alt?: [string, number][]; r: [string, number][] }
export interface FoodLib { ingredients: Ingredient[]; dishes: Dish[]; ing: Map<string, Ingredient>; dish: Map<string, Dish> }

let libPromise: Promise<FoodLib> | null = null;
export function loadFoodLib(): Promise<FoodLib> {
  if (!libPromise) {
    libPromise = import('../data/food.json').then((m) => {
      const data = m.default as unknown as { ingredients: Ingredient[]; dishes: Dish[] };
      return {
        ...data,
        ing: new Map(data.ingredients.map((x) => [x.id, x])),
        dish: new Map(data.dishes.map((x) => [x.id, x])),
      };
    });
    libPromise.catch(() => { libPromise = null; });
  }
  return libPromise;
}

export const ZERO: Nutr = { kcal: 0, p: 0, c: 0, f: 0, fb: 0 };
export const add = (a: Nutr, b: Nutr): Nutr => ({ kcal: a.kcal + b.kcal, p: a.p + b.p, c: a.c + b.c, f: a.f + b.f, fb: a.fb + b.fb });
export const scale = (a: Nutr, k: number): Nutr => ({ kcal: a.kcal * k, p: a.p * k, c: a.c * k, f: a.f * k, fb: a.fb * k });
export const round = (a: Nutr): Nutr => ({ kcal: Math.round(a.kcal), p: r1(a.p), c: r1(a.c), f: r1(a.f), fb: r1(a.fb) });
export const r1 = (x: number) => Math.round(x * 10) / 10;

export const dishNutr = (d: Dish): Nutr => ({ kcal: d.k, p: d.p, c: d.c, f: d.f, fb: d.fb });
export const ingNutr = (i: Ingredient, grams: number): Nutr => scale({ kcal: i.k, p: i.p, c: i.c, f: i.f, fb: i.fb }, grams / 100);

/** Units a dish can be logged in: its own serving first, then alternatives, then grams. */
export function dishUnits(d: Dish): { label: string; g: number }[] {
  return [{ label: `${d.unit}`, g: d.g }, ...(d.alt ?? []).map(([label, g]) => ({ label, g }))];
}

/** Nutrition of a list of raw ingredients. */
export function recipeNutr(lib: FoodLib, items: { id: string; g: number }[]): Nutr {
  return items.reduce((acc, it) => {
    const x = lib.ing.get(it.id);
    return x ? add(acc, ingNutr(x, it.g)) : acc;
  }, ZERO);
}

/* ---------- search ---------- */
const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]+/g, ' ');

function score(name: string, aka: string | undefined, words: string[]): number {
  const n = norm(name);
  const hay = `${n} ${norm(aka ?? '')}`;
  if (!words.every((w) => hay.includes(w))) return -1;
  let s = 0;
  if (n.startsWith(words[0])) s += 3;
  if (n.split(' ').some((t) => t.startsWith(words[0]))) s += 2;
  if (n.includes(words.join(' '))) s += 1;
  return s;
}

export function searchFoods<T extends { n: string; aka?: string }>(list: T[], q: string, limit = 80): T[] {
  const words = norm(q).split(/\s+/).filter(Boolean);
  if (!words.length) return list.slice(0, limit);
  return list
    .map((x, i) => ({ x, i, s: score(x.n, x.aka, words) }))
    .filter((r) => r.s >= 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, limit)
    .map((r) => r.x);
}

export const DISH_CATS: { id: string; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'breads', label: 'Roti & breads' },
  { id: 'rice', label: 'Rice & noodles' },
  { id: 'dal', label: 'Dal' },
  { id: 'sabzi', label: 'Sabzi & paneer' },
  { id: 'nonveg', label: 'Chicken, mutton, fish' },
  { id: 'world', label: 'Pizza, burgers & world food' },
  { id: 'brands', label: 'Brands & packaged' },
  { id: 'thali', label: 'Thalis & combos' },
  { id: 'snacks', label: 'Snacks & street food' },
  { id: 'sweets', label: 'Sweets' },
  { id: 'fruits', label: 'Fruits' },
  { id: 'dryfruits', label: 'Dry fruits & nuts' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'sides', label: 'Raita, chutney, sides' },
];

export const ING_GROUPS: { id: string; label: string }[] = [
  { id: 'grains', label: 'Grains & flours' },
  { id: 'pulses', label: 'Dals & pulses' },
  { id: 'veg', label: 'Vegetables' },
  { id: 'protein', label: 'Eggs, meat, fish' },
  { id: 'dairy', label: 'Milk & dairy' },
  { id: 'fats', label: 'Oil & ghee' },
  { id: 'nuts', label: 'Dry fruits, nuts & seeds' },
  { id: 'fruit', label: 'Fruit' },
  { id: 'sweet', label: 'Sugar & sweets' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'brands', label: 'Brands & packaged' },
];

/* ---------- meals of the day ---------- */
export type Meal = 'breakfast' | 'lunch' | 'snack' | 'dinner';
export const MEALS: { id: Meal; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'snack', label: 'Snacks' },
  { id: 'dinner', label: 'Dinner' },
];

/** Best guess at which meal someone is logging, from the clock. */
export function mealForNow(d = new Date()): Meal {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h < 11) return 'breakfast';
  if (h < 15.5) return 'lunch';
  if (h < 19) return 'snack';
  return 'dinner';
}

export const isoDay = (d: Date) => d.toLocaleDateString('en-CA');
export function shiftDay(iso: string, days: number) {
  const [y, m, dd] = iso.split('-').map(Number);
  const d = new Date(y, m - 1, dd + days);
  return isoDay(d);
}

/* ---------- targets ---------- */
export const ACTIVITY: { id: NonNullable<Profile['activity']>; label: string; hint: string; factor: number }[] = [
  { id: 'sedentary', label: 'Desk job, little else', hint: 'Under 5k steps', factor: 1.2 },
  { id: 'light', label: 'Lift 2–3× a week', hint: '5–8k steps', factor: 1.375 },
  { id: 'moderate', label: 'Lift 4–5× a week', hint: '8–10k steps', factor: 1.55 },
  { id: 'very', label: 'Train 6× or physical job', hint: '10k+ steps', factor: 1.725 },
  { id: 'athlete', label: 'Twice a day / athlete', hint: '', factor: 1.9 },
];

export interface TargetInput { sex: 'male' | 'female'; age: number; weightKg: number; heightCm: number; activity: NonNullable<Profile['activity']>; goal: NonNullable<Profile['diet_goal']> }

/**
 * Mifflin–St Jeor BMR × activity, then −20% to cut / +10% to bulk.
 * Protein: 2.0 g/kg cutting (keep muscle in a deficit), 1.8 g/kg otherwise.
 */
export function suggestTargets(t: TargetInput) {
  const bmr = 10 * t.weightKg + 6.25 * t.heightCm - 5 * t.age + (t.sex === 'male' ? 5 : -161);
  const tdee = bmr * (ACTIVITY.find((a) => a.id === t.activity)?.factor ?? 1.375);
  const adj = t.goal === 'cut' ? 0.8 : t.goal === 'bulk' ? 1.1 : 1;
  const kcal = Math.round((tdee * adj) / 50) * 50;
  const protein = Math.round((t.goal === 'cut' ? 2.0 : 1.8) * t.weightKg / 5) * 5;
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, protein };
}

/** Fat at ~25% of calories, carbs fill the rest after protein. */
export function macroSplit(kcal: number, proteinG: number) {
  const fat = Math.round((kcal * 0.25) / 9);
  const carbs = Math.max(0, Math.round((kcal - proteinG * 4 - fat * 9) / 4));
  return { fat, carbs };
}

/* ---------- photo matching ---------- */
/** Use the library's composition for a matched dish, scaled to the AI's estimated grams. */
export function nutrForMatch(d: Dish, grams: number): Nutr {
  return scale(dishNutr(d), grams / d.g);
}

/* ---------- formatting ---------- */
const FRACTIONS: [number, string][] = [[0.25, '¼'], [0.5, '½'], [0.75, '¾']];
export function fmtQty(q: number) {
  const whole = Math.floor(q + 0.005);
  const rem = q - whole;
  if (rem < 0.01) return String(whole);
  const f = FRACTIONS.find(([v]) => Math.abs(v - rem) < 0.01);
  if (f) return whole ? `${whole}${f[1]}` : f[1];
  return String(Math.round(q * 100) / 100);
}

export function servingLabel(qty: number, unit: string) {
  return `${fmtQty(qty)} ${unit}`;
}
