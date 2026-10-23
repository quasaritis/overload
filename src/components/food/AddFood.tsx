import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Camera, ChevronRight, ImagePlus, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { useApp } from '../../lib/app';
import { humanError } from '../../lib/supabase';
import {
  DISH_CATS, MEALS, add as addN, dishNutr, dishUnits, fmtQty, ingNutr, loadFoodLib, nutrForMatch, recipeNutr, round, scale, searchFoods,
  type Dish, type FoodLib, type Meal, type Nutr, ZERO,
} from '../../lib/food';
import {
  addEntries, createSavedMeal, deleteSavedMeal, listSavedMeals, recentFoods, scanMeal, ScanError, shrinkImage, uploadMealPhoto,
  type NewEntry, type ScanItem,
} from '../../lib/foodData';
import type { FoodEntry, FoodItem, SavedMeal } from '../../lib/types';
import { ErrorLine, Loading, useDebounced } from '../ui';
import { Sheet, Stepper } from '../Sheet';
import { DietMark, Macros, Readout, gFmt, kcalFmt } from './bits';

type Tab = 'dish' | 'photo' | 'recipe' | 'quick';
type Draft = Omit<NewEntry, 'eaten_on' | 'meal'>;
interface RecipeSeed { name: string; rows: { id: string; g: number }[] }

const nutrFields = (n: Nutr) => {
  const r = round(n);
  return { kcal: r.kcal, protein_g: r.p, carbs_g: r.c, fat_g: r.f, fibre_g: r.fb };
};

export function AddFood({ day, meal: meal0, onClose, onAdded, startTab = 'dish' }: { day: string; meal: Meal; onClose: () => void; onAdded: (rows: FoodEntry[]) => void; startTab?: Tab }) {
  const { toast } = useApp();
  const [lib, setLib] = useState<FoodLib | null>(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState<Tab>(startTab);
  const [meal, setMeal] = useState<Meal>(meal0);
  const [seed, setSeed] = useState<RecipeSeed | null>(null);

  useEffect(() => {
    loadFoodLib().then(setLib).catch((e) => setErr(humanError(e)));
  }, []);

  const mealLabel = MEALS.find((m) => m.id === meal)!.label.toLowerCase();

  async function save(rows: Draft[]) {
    const out = await addEntries(rows.map((r) => ({ ...r, eaten_on: day, meal })));
    onAdded(out);
    toast(rows.length === 1 ? `${rows[0].name} added to ${mealLabel}` : `Added to ${mealLabel}`);
    onClose();
  }

  const head = (
    <>
      <div className="seg block food-tabs" role="tablist" aria-label="How to add">
        {([['dish', 'Meals'], ['photo', 'Photo'], ['recipe', 'Ingredients'], ['quick', 'Quick add']] as [Tab, string][]).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      <div className="chips" role="group" aria-label="Meal">
        {MEALS.map((m) => (
          <button key={m.id} type="button" className="chip" aria-pressed={meal === m.id} onClick={() => setMeal(m.id)}>{m.label}</button>
        ))}
      </div>
    </>
  );

  return (
    <Sheet title="Add food" onClose={onClose} head={head}>
      <ErrorLine>{err}</ErrorLine>
      {!lib && !err && <Loading label="Loading foods" />}
      {lib && tab === 'dish' && (
        <DishTab
          lib={lib}
          mealLabel={mealLabel}
          onSave={(d) => save([d])}
          onCustomize={(s) => { setSeed(s); setTab('recipe'); }}
        />
      )}
      {lib && tab === 'photo' && <PhotoTab lib={lib} mealLabel={mealLabel} onSave={(d) => save([d])} />}
      {lib && tab === 'recipe' && <RecipeTab key={seed?.name ?? 'new'} lib={lib} seed={seed} mealLabel={mealLabel} onSave={(d) => save([d])} />}
      {tab === 'quick' && <QuickTab mealLabel={mealLabel} onSave={(d) => save([d])} />}
    </Sheet>
  );
}

/* ───────────── Indian meals ───────────── */

type Recent = Awaited<ReturnType<typeof recentFoods>>[number];
type Picked =
  | { kind: 'dish'; dish: Dish; qty?: number; unit?: string }
  | { kind: 'fixed'; title: string; unit: string; base: Nutr; gramsPer: number | null; draft: Omit<Draft, 'qty' | 'kcal' | 'protein_g' | 'carbs_g' | 'fat_g' | 'fibre_g' | 'grams'>; qty: number };

function DishTab({ lib, mealLabel, onSave, onCustomize }: { lib: FoodLib; mealLabel: string; onSave: (d: Draft) => Promise<void>; onCustomize: (s: RecipeSeed) => void }) {
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 100);
  const [cat, setCat] = useState<string>('recent');
  const [recent, setRecent] = useState<Recent[] | null>(null);
  const [saved, setSaved] = useState<SavedMeal[] | null>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    Promise.all([recentFoods(), listSavedMeals()])
      .then(([r, s]) => {
        setRecent(r);
        setSaved(s);
        if (!r.length) setCat(s.length ? 'yours' : 'breakfast');
      })
      .catch((e) => {
        setErr(humanError(e));
        setRecent([]);
        setSaved([]);
        setCat('breakfast');
      });
  }, []);

  const results = useMemo(() => {
    if (dq.trim()) return searchFoods(lib.dishes, dq, 60);
    if (cat === 'recent' || cat === 'yours') return [];
    return lib.dishes.filter((d) => d.cat === cat);
  }, [lib, dq, cat]);
  const savedHits = useMemo(() => (saved && dq.trim() ? searchFoods(saved.map((s) => ({ ...s, n: s.name })), dq, 10) : []), [saved, dq]);

  const pickSaved = (s: SavedMeal, qty = 1) =>
    setPicked({
      kind: 'fixed', title: s.name, unit: s.unit, qty, gramsPer: s.grams,
      base: { kcal: s.kcal, p: s.protein_g, c: s.carbs_g, f: s.fat_g, fb: s.fibre_g },
      draft: { name: s.name, source: 'saved', ref_id: s.id, unit: s.unit, items: s.items, photo_path: null },
    });

  function pickRecent(r: Recent) {
    if (r.source === 'dish' && r.ref_id && lib.dish.get(r.ref_id)) {
      return setPicked({ kind: 'dish', dish: lib.dish.get(r.ref_id)!, qty: Number(r.qty), unit: r.unit ?? undefined });
    }
    const per = 1 / Number(r.qty || 1);
    setPicked({
      kind: 'fixed', title: r.name, unit: r.unit ?? 'serving', qty: Number(r.qty), gramsPer: r.grams ? Number(r.grams) * per : null,
      base: { kcal: Number(r.kcal) * per, p: Number(r.protein_g) * per, c: Number(r.carbs_g) * per, f: Number(r.fat_g) * per, fb: Number(r.fibre_g) * per },
      draft: { name: r.name, source: r.source, ref_id: r.ref_id, unit: r.unit, items: r.items, photo_path: null },
    });
  }

  if (picked?.kind === 'dish') {
    return <DishDetail dish={picked.dish} lib={lib} qty0={picked.qty} unit0={picked.unit} mealLabel={mealLabel} onBack={() => setPicked(null)} onSave={onSave} onCustomize={onCustomize} />;
  }
  if (picked?.kind === 'fixed') {
    return <FixedDetail p={picked} mealLabel={mealLabel} onBack={() => setPicked(null)} onSave={onSave} />;
  }

  const searching = Boolean(dq.trim());

  return (
    <div className="stack" style={{ paddingTop: 'var(--s-4)' }}>
      <label className="field search-field">
        <span className="sr-only">Search Indian meals</span>
        <Search aria-hidden />
        <input className="input" placeholder="Search 190+ dishes — dal, paneer, biryani, chai…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        {q && <button type="button" className="clear" onClick={() => setQ('')} aria-label="Clear search"><X /></button>}
      </label>
      {!searching && (
        <div className="chips" role="group" aria-label="Browse">
          {(recent?.length ?? 0) > 0 && <button className="chip" aria-pressed={cat === 'recent'} onClick={() => setCat('recent')}>Recent</button>}
          {(saved?.length ?? 0) > 0 && <button className="chip" aria-pressed={cat === 'yours'} onClick={() => setCat('yours')}>My meals</button>}
          {DISH_CATS.map((c) => (
            <button key={c.id} className="chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)} style={{ textTransform: 'none' }}>{c.label}</button>
          ))}
        </div>
      )}
      <ErrorLine>{err}</ErrorLine>

      {!searching && cat === 'recent' && !recent && <Loading label="Loading your recent foods" />}
      {!searching && cat === 'recent' && recent && (
        <div className="list" style={{ borderTop: 0 }}>
          {recent.map((r, i) => (
            <button key={i} className="list-item" onClick={() => pickRecent(r)}>
              <span className="grow">
                <span className="title" style={{ display: 'block' }}>{r.name}</span>
                <span className="meta" style={{ textTransform: 'none' }}>
                  {r.unit ? `${fmtQty(Number(r.qty))} ${r.unit}` : 'Quick add'}{r.times > 1 ? ` · logged ${r.times}×` : ''}
                </span>
              </span>
              <span className="kcal num">{kcalFmt(Number(r.kcal))}</span>
              <ChevronRight aria-hidden className="chev" />
            </button>
          ))}
        </div>
      )}

      {!searching && cat === 'yours' && saved && (
        <div className="list" style={{ borderTop: 0 }}>
          {saved.map((s) => (
            <div key={s.id} className="list-item" style={{ padding: 0 }}>
              <button className="list-item grow" style={{ border: 0 }} onClick={() => pickSaved(s)}>
                <span className="grow">
                  <span className="title" style={{ display: 'block' }}>{s.name}</span>
                  <span className="meta" style={{ textTransform: 'none' }}>1 {s.unit} · <Macros n={{ kcal: s.kcal, p: s.protein_g, c: s.carbs_g, f: s.fat_g, fb: s.fibre_g }} short /></span>
                </span>
                <span className="kcal num">{kcalFmt(s.kcal)}</span>
              </button>
              <button
                className="btn icon ghost"
                aria-label={`Delete ${s.name} from My meals`}
                onClick={async () => {
                  try {
                    await deleteSavedMeal(s.id);
                    setSaved((x) => x?.filter((y) => y.id !== s.id) ?? null);
                  } catch (e) {
                    setErr(humanError(e));
                  }
                }}
              >
                <Trash2 />
              </button>
            </div>
          ))}
        </div>
      )}

      {(searching || (cat !== 'recent' && cat !== 'yours')) && (
        <div className="list" style={{ borderTop: 0 }}>
          {savedHits.map((s) => (
            <button key={s.id} className="list-item" onClick={() => pickSaved(s as SavedMeal)}>
              <span className="grow">
                <span className="title" style={{ display: 'block' }}>{s.name}</span>
                <span className="meta" style={{ textTransform: 'none' }}>My meal · 1 {s.unit}</span>
              </span>
              <span className="kcal num">{kcalFmt(s.kcal)}</span>
              <ChevronRight aria-hidden className="chev" />
            </button>
          ))}
          {results.map((d) => (
            <button key={d.id} className="list-item" onClick={() => setPicked({ kind: 'dish', dish: d })}>
              <DietMark diet={d.diet} />
              <span className="grow">
                <span className="title" style={{ display: 'block' }}>{d.n}</span>
                <span className="meta" style={{ textTransform: 'none' }}>1 {d.unit} ({d.g} g) · {gFmt(d.p)} g protein</span>
              </span>
              <span className="kcal num">{kcalFmt(d.k)}</span>
              <ChevronRight aria-hidden className="chev" />
            </button>
          ))}
          {searching && results.length === 0 && savedHits.length === 0 && (
            <div className="empty">
              <h3>No dish called “{q}”</h3>
              <p className="muted">Try another name (sabzi, subji and curry all work), build it from ingredients, or snap a photo.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DishDetail({ dish, lib, qty0 = 1, unit0, mealLabel, onBack, onSave, onCustomize }: { dish: Dish; lib: FoodLib; qty0?: number; unit0?: string; mealLabel: string; onBack: () => void; onSave: (d: Draft) => Promise<void>; onCustomize: (s: RecipeSeed) => void }) {
  const units = dishUnits(dish);
  const [ui, setUi] = useState(() => {
    const i = units.findIndex((u) => u.label === unit0);
    return unit0 === 'g' ? -1 : Math.max(0, i);
  });
  const [qty, setQty] = useState(qty0);
  const [grams, setGrams] = useState(String(unit0 === 'g' ? qty0 : dish.g));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const byGrams = ui === -1;
  const totalG = byGrams ? Number(grams) || 0 : qty * units[ui].g;
  const n = scale(dishNutr(dish), totalG / dish.g);

  async function submit() {
    if (totalG <= 0) return setErr('Enter how much you had.');
    setBusy(true);
    setErr('');
    try {
      await onSave({
        name: dish.n, source: 'dish', ref_id: dish.id,
        qty: byGrams ? totalG : qty, unit: byGrams ? 'g' : units[ui].label, grams: Math.round(totalG),
        ...nutrFields(n), items: null, photo_path: null,
      });
    } catch (e) {
      setErr(humanError(e));
      setBusy(false);
    }
  }

  return (
    <div className="stack-lg detail">
      <button className="btn ghost sm back" onClick={onBack}><ArrowLeft /> All dishes</button>
      <div>
        <h3 className="detail-title"><DietMark diet={dish.diet} /> {dish.n}</h3>
        <p className="muted t-small" style={{ marginTop: 6 }}>1 {dish.unit} ≈ {dish.g} g · {kcalFmt(dish.k)} kcal · <Macros n={dishNutr(dish)} short /></p>
      </div>

      <div className="field">
        <span>How much</span>
        <div className="row" style={{ flexWrap: 'wrap', gap: 'var(--s-3)' }}>
          <div className="seg" role="group" aria-label="Unit">
            {units.map((u, i) => (
              <button key={u.label} type="button" aria-pressed={ui === i} onClick={() => setUi(i)}>{u.label}</button>
            ))}
            <button type="button" aria-pressed={byGrams} onClick={() => setUi(-1)}>grams</button>
          </div>
          {byGrams ? (
            <label className="set-cell" style={{ width: 130 }}>
              <span className="sr-only">Grams</span>
              <input inputMode="numeric" value={grams} onChange={(e) => setGrams(e.target.value.replace(/[^0-9.]/g, ''))} />
              <span className="unit">g</span>
            </label>
          ) : (
            <Stepper value={qty} onChange={setQty} label="servings" format={fmtQty} />
          )}
        </div>
      </div>

      <Readout n={n} />

      <details className="recipe-peek">
        <summary>What’s in 1 {dish.unit} <span className="faint">— edit to match how you make it</span></summary>
        <ul>
          {dish.r.map(([id, g]) => (
            <li key={id}><span>{lib.ing.get(id)?.n ?? id}</span><span className="num">{gFmt(g)} g</span></li>
          ))}
        </ul>
        <p className="faint t-small">Raw weights, home-style. Values from IFCT 2017 (NIN) and USDA.</p>
        <button
          type="button"
          className="btn sm"
          onClick={() => onCustomize({ name: `${dish.n} (my way)`, rows: dish.r.map(([id, g]) => ({ id, g: Math.round(g * (totalG / dish.g) * 10) / 10 })) })}
        >
          Change ingredients
        </button>
      </details>

      <ErrorLine>{err}</ErrorLine>
      <button className="btn primary lg block" onClick={submit} disabled={busy}>{busy ? 'Adding…' : `Add to ${mealLabel}`}</button>
    </div>
  );
}

function FixedDetail({ p, mealLabel, onBack, onSave }: { p: Extract<Picked, { kind: 'fixed' }>; mealLabel: string; onBack: () => void; onSave: (d: Draft) => Promise<void> }) {
  const [qty, setQty] = useState(p.qty || 1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const n = scale(p.base, qty);
  return (
    <div className="stack-lg detail">
      <button className="btn ghost sm back" onClick={onBack}><ArrowLeft /> Back</button>
      <div>
        <h3 className="detail-title">{p.title}</h3>
        <p className="muted t-small" style={{ marginTop: 6 }}>1 {p.unit} · {kcalFmt(p.base.kcal)} kcal · <Macros n={p.base} short /></p>
      </div>
      <div className="field">
        <span>How many ({p.unit})</span>
        <Stepper value={qty} onChange={setQty} label={p.unit} format={fmtQty} />
      </div>
      <Readout n={n} />
      <ErrorLine>{err}</ErrorLine>
      <button
        className="btn primary lg block"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onSave({ ...p.draft, qty, grams: p.gramsPer ? Math.round(p.gramsPer * qty) : null, ...nutrFields(n) });
          } catch (e) {
            setErr(humanError(e));
            setBusy(false);
          }
        }}
      >
        {busy ? 'Adding…' : `Add to ${mealLabel}`}
      </button>
    </div>
  );
}

/* ───────────── Photo ───────────── */

interface EditItem extends ScanItem { key: number; useStd: boolean; aiGrams: number }

function itemNutr(lib: FoodLib, it: EditItem): Nutr {
  const d = it.dish_id ? lib.dish.get(it.dish_id) : undefined;
  if (d && it.useStd && it.grams > 0) return nutrForMatch(d, it.grams);
  const k = it.aiGrams > 0 ? it.grams / it.aiGrams : 1;
  return scale({ kcal: it.kcal, p: it.protein_g, c: it.carbs_g, f: it.fat_g, fb: it.fibre_g }, k);
}

function PhotoTab({ lib, mealLabel, onSave }: { lib: FoodLib; mealLabel: string; onSave: (d: Draft) => Promise<void> }) {
  const { user } = useApp();
  const [hint, setHint] = useState('');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'done'>('idle');
  const [items, setItems] = useState<EditItem[]>([]);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function scan(b: Blob) {
    setStatus('scanning');
    setErr('');
    setItems([]);
    try {
      const res = await scanMeal(b, hint.trim());
      setItems(res.items.map((it, i) => ({ ...it, key: i, useStd: Boolean(it.dish_id), aiGrams: it.grams || 1 })));
      setNote(res.items.length ? res.note : res.note || 'No food found in that photo.');
      setStatus('done');
    } catch (e) {
      setErr(e instanceof ScanError ? e.message : humanError(e));
      setStatus('idle');
    }
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    try {
      const b = await shrinkImage(f);
      setBlob(b);
      setPreview(URL.createObjectURL(b));
      await scan(b);
    } catch (e) {
      setErr(humanError(e));
    }
  }

  const total = items.reduce((a, it) => addN(a, itemNutr(lib, it)), ZERO);
  const patch = (key: number, p: Partial<EditItem>) => setItems((xs) => xs.map((x) => (x.key === key ? { ...x, ...p } : x)));

  async function submit() {
    if (!items.length || !user) return;
    setBusy(true);
    setErr('');
    try {
      let path: string | null = null;
      if (blob) {
        const small = await shrinkImage(blob, 720, 0.78).catch(() => blob);
        path = await uploadMealPhoto(user.id, small).catch(() => null);
      }
      const lines: FoodItem[] = items.map((it) => {
        const n = round(itemNutr(lib, it));
        const d = it.dish_id && it.useStd ? lib.dish.get(it.dish_id) : undefined;
        return { name: d?.n ?? it.name, id: d?.id ?? null, grams: Math.round(it.grams), portion: it.portion, kcal: n.kcal, p: n.p, c: n.c, f: n.f, fb: n.fb };
      });
      const name = lines.map((l) => l.name).join(', ');
      await onSave({
        name: name.length > 160 ? `${name.slice(0, 157)}…` : name,
        source: 'photo', ref_id: null, qty: 1, unit: 'plate', grams: lines.reduce((a, l) => a + (l.grams ?? 0), 0),
        ...nutrFields(total), items: lines, photo_path: path,
      });
    } catch (e) {
      setErr(humanError(e));
      setBusy(false);
    }
  }

  return (
    <div className="stack-lg" style={{ paddingTop: 'var(--s-4)' }}>
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
      <input ref={galRef} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />

      {!preview ? (
        <div className="snap">
          <button type="button" className="snap-main" onClick={() => camRef.current?.click()}>
            <Camera aria-hidden />
            <span className="t-head">Snap your plate</span>
            <span className="muted t-small">Shoot from above, whole plate in frame, good light.</span>
          </button>
          <button type="button" className="btn" onClick={() => galRef.current?.click()}><ImagePlus /> Choose from gallery</button>
        </div>
      ) : (
        <div className="snap-shot">
          <img src={preview} alt="Your meal" />
          {status === 'scanning' && (
            <div className="snap-scan" role="status">
              <span className="spinner" aria-hidden /> Reading your plate…
            </div>
          )}
        </div>
      )}

      <label className="field">
        <span>Anything the photo can’t show? <span className="faint">(optional)</span></span>
        <input className="input" value={hint} onChange={(e) => setHint(e.target.value)} placeholder="e.g. 3 rotis, cooked in ghee, half-eaten" maxLength={300} />
      </label>

      <ErrorLine>{err}</ErrorLine>

      {status === 'done' && (
        <>
          {items.length > 0 ? (
            <div className="list scan-list">
              {items.map((it) => {
                const n = itemNutr(lib, it);
                const d = it.dish_id ? lib.dish.get(it.dish_id) : undefined;
                return (
                  <div key={it.key} className="scan-item">
                    <div className="row between" style={{ alignItems: 'flex-start' }}>
                      <div className="grow" style={{ minWidth: 0 }}>
                        <p className="title">{d && it.useStd ? d.n : it.name}</p>
                        <p className="meta">
                          {it.portion || 'portion'} · <Macros n={n} short />
                          {it.confidence === 'low' && <span className="tag" style={{ marginLeft: 8 }}>rough guess</span>}
                        </p>
                      </div>
                      <span className="kcal num">{kcalFmt(n.kcal)}</span>
                      <button className="btn icon ghost sm" aria-label={`Remove ${it.name}`} onClick={() => setItems((xs) => xs.filter((x) => x.key !== it.key))}><X /></button>
                    </div>
                    <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      <Stepper
                        value={it.grams}
                        onChange={(v) => patch(it.key, { grams: v })}
                        step={it.grams >= 100 ? 25 : 10}
                        min={5}
                        max={2000}
                        label={`grams of ${it.name}`}
                        format={(v) => `${Math.round(v)} g`}
                      />
                      {d && (
                        <button className="chip" aria-pressed={it.useStd} onClick={() => patch(it.key, { useStd: !it.useStd })} style={{ textTransform: 'none' }}>
                          {it.useStd ? `Standard values: ${d.n}` : 'Use standard values'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty" style={{ paddingTop: 0 }}>
              <h3>Couldn’t spot food</h3>
              <p className="muted">{note}</p>
            </div>
          )}
          {note && items.length > 0 && <p className="faint t-small">{note} Check portions — photos can’t see oil or what’s under the rice.</p>}
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {blob && <button className="btn" onClick={() => scan(blob)}><RotateCcw /> Scan again{hint ? ' with note' : ''}</button>}
            <button className="btn ghost" onClick={() => { setPreview(null); setBlob(null); setItems([]); setStatus('idle'); }}>New photo</button>
          </div>
          {items.length > 0 && (
            <>
              <Readout n={total} />
              <button className="btn primary lg block" onClick={submit} disabled={busy}>{busy ? 'Saving…' : `Add to ${mealLabel}`}</button>
            </>
          )}
        </>
      )}
      {status === 'idle' && preview && blob && err && (
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => scan(blob)}><RotateCcw /> Try again</button>
          <button className="btn ghost" onClick={() => { setPreview(null); setBlob(null); setErr(''); }}>New photo</button>
        </div>
      )}
    </div>
  );
}

/* ───────────── Ingredients ───────────── */

function RecipeTab({ lib, seed, mealLabel, onSave }: { lib: FoodLib; seed: RecipeSeed | null; mealLabel: string; onSave: (d: Draft) => Promise<void> }) {
  const [name, setName] = useState(seed?.name ?? '');
  const [rows, setRows] = useState<{ id: string; g: string }[]>(seed?.rows.map((r) => ({ id: r.id, g: String(r.g) })) ?? []);
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 100);
  const [servings, setServings] = useState(1);
  const [ate, setAte] = useState(1);
  const [keep, setKeep] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const hits = useMemo(() => (dq.trim() ? searchFoods(lib.ingredients, dq, 8) : []), [lib, dq]);
  const parsed = rows.map((r) => ({ id: r.id, g: Number(r.g) || 0 }));
  const whole = recipeNutr(lib, parsed);
  const per = scale(whole, 1 / servings);
  const eaten = scale(per, ate);
  const rawG = parsed.reduce((a, r) => a + r.g, 0);

  function addIng(id: string) {
    const x = lib.ing.get(id);
    setRows((rs) => [...rs, { id, g: String(x?.u?.[0]?.[1] ?? 100) }]);
    setQ('');
  }

  async function submit() {
    if (!parsed.some((r) => r.g > 0)) return setErr('Add at least one ingredient with its weight.');
    const label = name.trim() || 'Home-cooked meal';
    setBusy(true);
    setErr('');
    try {
      const items: FoodItem[] = parsed.filter((r) => r.g > 0).map((r) => {
        const x = lib.ing.get(r.id)!;
        const n = round(ingNutr(x, r.g));
        return { name: x.n, id: r.id, grams: r.g, kcal: n.kcal, p: n.p, c: n.c, f: n.f, fb: n.fb };
      });
      if (keep) {
        const pr = round(per);
        await createSavedMeal({ name: label, unit: 'serving', grams: Math.round(rawG / servings), kcal: pr.kcal, protein_g: pr.p, carbs_g: pr.c, fat_g: pr.f, fibre_g: pr.fb, items });
      }
      await onSave({ name: label, source: 'recipe', ref_id: null, qty: ate, unit: servings > 1 ? `serving (of ${fmtQty(servings)})` : 'serving', grams: Math.round((rawG / servings) * ate), ...nutrFields(eaten), items, photo_path: null });
    } catch (e) {
      setErr(humanError(e));
      setBusy(false);
    }
  }

  return (
    <div className="stack-lg" style={{ paddingTop: 'var(--s-4)' }}>
      <label className="field">
        <span>Name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mom’s rajma, post-workout oats" maxLength={120} />
      </label>

      <div className="field">
        <span>Ingredients <span className="faint">— raw weight; count the oil and ghee</span></span>
        {rows.length > 0 && (
          <ul className="ing-rows">
            {rows.map((r, i) => {
              const x = lib.ing.get(r.id);
              if (!x) return null;
              const n = ingNutr(x, Number(r.g) || 0);
              return (
                <li key={`${r.id}-${i}`}>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <p className="title">{x.n}</p>
                    <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                      {x.u?.map(([label, g]) => (
                        <button key={label} type="button" className="chip mini" onClick={() => setRows((rs) => rs.map((y, j) => (j === i ? { ...y, g: String(g) } : y)))}>{label}</button>
                      ))}
                      <span className="faint t-small num">{kcalFmt(n.kcal)} kcal</span>
                    </div>
                  </div>
                  <label className="set-cell" style={{ width: 96 }}>
                    <span className="sr-only">Grams of {x.n}</span>
                    <input inputMode="decimal" value={r.g} onChange={(e) => setRows((rs) => rs.map((y, j) => (j === i ? { ...y, g: e.target.value.replace(/[^0-9.]/g, '') } : y)))} />
                    <span className="unit">g</span>
                  </label>
                  <button className="btn icon ghost sm" aria-label={`Remove ${x.n}`} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}><X /></button>
                </li>
              );
            })}
          </ul>
        )}
        <label className="field search-field" style={{ marginTop: 'var(--s-2)' }}>
          <span className="sr-only">Add an ingredient</span>
          <Plus aria-hidden />
          <input className="input" placeholder="Add ingredient — atta, paneer, toor dal, ghee…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        {hits.length > 0 && (
          <div className="list hits">
            {hits.map((x) => (
              <button key={x.id} className="list-item" onClick={() => addIng(x.id)}>
                <span className="grow">
                  <span className="title" style={{ display: 'block' }}>{x.n}</span>
                  <span className="meta" style={{ textTransform: 'none' }}>per 100 g · {gFmt(x.p)} g protein</span>
                </span>
                <span className="kcal num">{kcalFmt(x.k)}</span>
                <Plus aria-hidden className="chev" />
              </button>
            ))}
          </div>
        )}
        {dq.trim() && hits.length === 0 && <p className="faint t-small">Nothing called “{q}”. Use Quick add with the label’s numbers.</p>}
      </div>

      {rows.length > 0 && (
        <>
          <div className="grid-2">
            <div className="field">
              <span>Recipe makes</span>
              <Stepper value={servings} onChange={setServings} step={1} min={1} max={30} label="servings in recipe" format={(v) => `${fmtQty(v)} serving${v === 1 ? '' : 's'}`} />
            </div>
            <div className="field">
              <span>You ate</span>
              <Stepper value={ate} onChange={setAte} label="servings eaten" format={(v) => `${fmtQty(v)}`} />
            </div>
          </div>
          <Readout n={eaten} />
          <label className="check">
            <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} />
            <span>Save to My meals so it’s one tap next time</span>
          </label>
        </>
      )}

      <ErrorLine>{err}</ErrorLine>
      <button className="btn primary lg block" onClick={submit} disabled={busy || rows.length === 0}>{busy ? 'Adding…' : `Add to ${mealLabel}`}</button>
    </div>
  );
}

/* ───────────── Quick add ───────────── */

function QuickTab({ mealLabel, onSave }: { mealLabel: string; onSave: (d: Draft) => Promise<void> }) {
  const [name, setName] = useState('');
  const [v, setV] = useState({ kcal: '', p: '', c: '', f: '' });
  const [keep, setKeep] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const num = (s: string) => Math.max(0, Number(s) || 0);
  const field = (k: keyof typeof v, label: string, unit: string) => (
    <label className="field">
      <span>{label}</span>
      <span className="set-cell">
        <input inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^0-9.]/g, '') })} />
        <span className="unit">{unit}</span>
      </span>
    </label>
  );

  // If macros are filled but calories aren't, work calories out from them.
  const fromMacros = num(v.p) * 4 + num(v.c) * 4 + num(v.f) * 9;
  const kcal = v.kcal ? num(v.kcal) : fromMacros;

  return (
    <form
      className="stack-lg"
      style={{ paddingTop: 'var(--s-4)' }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return setErr('Name it so you recognise it later.');
        if (kcal <= 0) return setErr('Enter the calories (or the protein, carbs and fat).');
        setBusy(true);
        setErr('');
        try {
          const n: Nutr = { kcal, p: num(v.p), c: num(v.c), f: num(v.f), fb: 0 };
          if (keep) await createSavedMeal({ name: name.trim(), unit: 'serving', grams: null, ...nutrFields(n), items: [] });
          await onSave({ name: name.trim(), source: 'quick', ref_id: null, qty: 1, unit: 'serving', grams: null, ...nutrFields(n), items: null, photo_path: null });
        } catch (x) {
          setErr(humanError(x));
          setBusy(false);
        }
      }}
    >
      <p className="muted t-small">For packaged food: copy the numbers from the label for the amount you ate.</p>
      <label className="field">
        <span>Name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Protein bar, restaurant thali" maxLength={160} autoFocus />
      </label>
      <div className="grid-2">
        {field('kcal', 'Calories', 'kcal')}
        {field('p', 'Protein', 'g')}
        {field('c', 'Carbs', 'g')}
        {field('f', 'Fat', 'g')}
      </div>
      {!v.kcal && fromMacros > 0 && <p className="faint t-small">≈ {kcalFmt(fromMacros)} kcal from the macros.</p>}
      <label className="check">
        <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} />
        <span>Save to My meals</span>
      </label>
      <ErrorLine>{err}</ErrorLine>
      <button className="btn primary lg block" disabled={busy}>{busy ? 'Adding…' : `Add to ${mealLabel}`}</button>
    </form>
  );
}
