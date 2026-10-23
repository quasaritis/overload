export type Unit = 'kg' | 'lb';
export type Track = 'weight_reps' | 'bodyweight' | 'time' | 'cardio';

export interface Profile {
  id: string;
  display_name: string | null;
  unit: Unit;
  bodyweight_kg: number | null;
  height_cm: number | null;
  experience: 'new' | 'intermediate' | 'advanced' | null;
  goal: 'strength' | 'hypertrophy' | 'general' | null;
  bar_kg: number;
  onboarded: boolean;
  sex: 'male' | 'female' | null;
  birth_year: number | null;
  activity: 'sedentary' | 'light' | 'moderate' | 'very' | 'athlete' | null;
  diet_goal: 'cut' | 'maintain' | 'bulk' | null;
  kcal_target: number | null;
  protein_target_g: number | null;
}

export interface ExerciseLite {
  id: string;
  name: string;
  category: string;
  equipment: string | null;
  level: string | null;
  mechanic: string | null;
  primary_muscles: string[];
  secondary_muscles: string[];
  images: string[];
  track: Track;
  created_by: string | null;
}

export interface Exercise extends ExerciseLite {
  force: string | null;
  instructions: string[];
}

export interface Plan {
  id: string;
  name: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PlanDay {
  id: string;
  plan_id: string;
  name: string;
  position: number;
}

export interface PlanExercise {
  id: string;
  plan_day_id: string;
  exercise_id: string;
  position: number;
  target_sets: number;
  rep_min: number;
  rep_max: number;
  increment_kg: number;
  rest_seconds: number;
  notes: string | null;
}

export interface Session {
  id: string;
  plan_day_id: string | null;
  name: string;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
}

export interface SetRow {
  id: string;
  session_id: string;
  exercise_id: string;
  exercise_order: number;
  set_index: number;
  weight_kg: number | null;
  reps: number | null;
  duration_s: number | null;
  distance_m: number | null;
  rpe: number | null;
  is_warmup: boolean;
  done: boolean;
  created_at: string;
}

export interface BodyMetric {
  id: string;
  measured_on: string;
  weight_kg: number;
}

export type FoodSource = 'dish' | 'ingredient' | 'recipe' | 'photo' | 'quick' | 'saved';
export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner';

/** A line inside a photo scan or a home recipe. */
export interface FoodItem {
  name: string;
  /** ingredient id (recipes) or dish id (photo items matched to the library) */
  id?: string | null;
  grams?: number;
  portion?: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  fb?: number;
  /** Whether photo calories came from a readable package label or a visual estimate. */
  calorie_source?: 'label' | 'estimate';
}

export interface FoodEntry {
  id: string;
  eaten_on: string;
  meal: MealSlot;
  name: string;
  source: FoodSource;
  ref_id: string | null;
  qty: number;
  unit: string | null;
  grams: number | null;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g: number;
  items: FoodItem[] | null;
  photo_path: string | null;
  created_at: string;
}

export interface SavedMeal {
  id: string;
  name: string;
  unit: string;
  grams: number | null;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g: number;
  items: FoodItem[];
  created_at: string;
}

