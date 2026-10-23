import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { check } from './data';
import type { FoodEntry, FoodItem, SavedMeal } from './types';

/* ---------- log ---------- */
export async function entriesFor(day: string): Promise<FoodEntry[]> {
  return check(await supabase.from('food_entries').select('*').eq('eaten_on', day).order('created_at')) as FoodEntry[];
}

/** Daily totals between two dates (inclusive), for the week strip and Today. */
export async function dailyTotals(from: string, to: string) {
  const rows = check(
    await supabase.from('food_entries').select('eaten_on,kcal,protein_g').gte('eaten_on', from).lte('eaten_on', to).limit(5000),
  ) as { eaten_on: string; kcal: number; protein_g: number }[];
  const m = new Map<string, { kcal: number; protein: number }>();
  rows.forEach((r) => {
    const t = m.get(r.eaten_on) ?? { kcal: 0, protein: 0 };
    t.kcal += Number(r.kcal);
    t.protein += Number(r.protein_g);
    m.set(r.eaten_on, t);
  });
  return m;
}

export type NewEntry = Omit<FoodEntry, 'id' | 'created_at'>;

export async function addEntries(rows: NewEntry[]): Promise<FoodEntry[]> {
  return check(await supabase.from('food_entries').insert(rows).select('*')) as FoodEntry[];
}

export async function updateEntry(id: string, patch: Partial<NewEntry>): Promise<FoodEntry> {
  return check(await supabase.from('food_entries').update(patch).eq('id', id).select('*').single()) as FoodEntry;
}

export async function deleteEntry(e: Pick<FoodEntry, 'id' | 'photo_path'>) {
  check(await supabase.from('food_entries').delete().eq('id', e.id));
  if (e.photo_path) {
    const others = check(await supabase.from('food_entries').select('id').eq('photo_path', e.photo_path).limit(1)) as unknown[];
    if (!others.length) await supabase.storage.from('meal-photos').remove([e.photo_path]);
  }
}

/** Things this person logs often, newest first, one per food. */
export async function recentFoods(limit = 24) {
  const rows = check(
    await supabase
      .from('food_entries')
      .select('name,source,ref_id,qty,unit,grams,kcal,protein_g,carbs_g,fat_g,fibre_g,items,created_at')
      .in('source', ['dish', 'saved', 'quick', 'ingredient'])
      .order('created_at', { ascending: false })
      .limit(200),
  ) as Omit<FoodEntry, 'id' | 'eaten_on' | 'meal' | 'photo_path'>[];
  const seen = new Map<string, (typeof rows)[number] & { times: number }>();
  for (const r of rows) {
    const key = `${r.source}:${r.ref_id ?? r.name.toLowerCase()}`;
    const hit = seen.get(key);
    if (hit) hit.times++;
    else seen.set(key, { ...r, times: 1 });
  }
  return [...seen.values()].slice(0, limit);
}

/* ---------- my meals ---------- */
export async function listSavedMeals(): Promise<SavedMeal[]> {
  return check(await supabase.from('saved_meals').select('*').order('created_at', { ascending: false }).limit(200)) as SavedMeal[];
}

export async function createSavedMeal(row: Omit<SavedMeal, 'id' | 'created_at'>): Promise<SavedMeal> {
  return check(await supabase.from('saved_meals').insert(row).select('*').single()) as SavedMeal;
}

export async function deleteSavedMeal(id: string) {
  check(await supabase.from('saved_meals').delete().eq('id', id));
}

/* ---------- photos ---------- */
/** Shrink a camera photo to a JPEG no wider/taller than `max` px. */
export async function shrinkImage(file: Blob, max = 1024, quality = 0.82): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions).catch(() => createImageBitmap(file));
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * k);
  const h = Math.round(bmp.height * k);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Couldn’t read that image.'))), 'image/jpeg', quality));
}

export function blobToBase64(b: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).replace(/^data:[^,]+,/, ''));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(b);
  });
}

export async function uploadMealPhoto(userId: string, jpeg: Blob): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from('meal-photos').upload(path, jpeg, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  return path;
}

export async function photoUrls(paths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!paths.length) return out;
  const { data } = await supabase.storage.from('meal-photos').createSignedUrls(paths, 3600);
  data?.forEach((d) => d.signedUrl && d.path && out.set(d.path, d.signedUrl));
  return out;
}

export interface ScanItem {
  name: string;
  dish_id: string | null;
  portion: string;
  grams: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g: number;
  confidence: 'high' | 'medium' | 'low';
}

export class ScanError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
  }
}

export async function scanMeal(jpeg: Blob, hint: string): Promise<{ items: ScanItem[]; note: string; remaining: number }> {
  const image = await blobToBase64(jpeg);
  const { data, error } = await supabase.functions.invoke('analyze-meal', { body: { image, mime: 'image/jpeg', hint } });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      throw new ScanError(body?.error ?? 'Photo scan failed. Try again.', body?.code);
    }
    throw new ScanError('Can’t reach the photo scanner. Check your connection and try again.');
  }
  return data;
}

export const itemsTotal = (items: FoodItem[]) =>
  items.reduce((a, i) => ({ kcal: a.kcal + i.kcal, p: a.p + i.p, c: a.c + i.c, f: a.f + i.f, fb: a.fb + (i.fb ?? 0) }), { kcal: 0, p: 0, c: 0, f: 0, fb: 0 });
