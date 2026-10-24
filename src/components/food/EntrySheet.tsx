import { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { MEALS, fmtQty, scale, type Meal } from '../../lib/food';
import { deleteEntry, updateEntry } from '../../lib/foodData';
import { humanError } from '../../lib/supabase';
import type { FoodEntry } from '../../lib/types';
import { ErrorLine, HoldButton } from '../ui';
import { Sheet, Stepper, type SheetHandle } from '../Sheet';
import { Readout, kcalFmt } from './bits';

/** Change how much / which meal, or remove an entry. */
export function EntrySheet({ entry, photoUrl, onClose, onChanged, onDeleted }: { entry: FoodEntry; photoUrl?: string; onClose: () => void; onChanged: (e: FoodEntry) => void; onDeleted: (id: string) => void }) {
  const byGrams = entry.unit === 'g';
  const [qty, setQty] = useState(Number(entry.qty));
  const [meal, setMeal] = useState<Meal>(entry.meal);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const sheet = useRef<SheetHandle>(null);

  const base = Number(entry.qty) || 1;
  const k = qty / base;
  const n = scale({ kcal: Number(entry.kcal), p: Number(entry.protein_g), c: Number(entry.carbs_g), f: Number(entry.fat_g), fb: Number(entry.fibre_g) }, k);
  const r1 = (x: number) => Math.round(x * 10) / 10;

  async function save() {
    setBusy(true);
    setErr('');
    try {
      const next = await updateEntry(entry.id, {
        meal, qty,
        grams: entry.grams != null ? Math.round(Number(entry.grams) * k) : null,
        kcal: Math.round(n.kcal), protein_g: r1(n.p), carbs_g: r1(n.c), fat_g: r1(n.f), fibre_g: r1(n.fb),
      });
      onChanged(next);
      sheet.current?.close();
    } catch (e) {
      setErr(humanError(e));
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await deleteEntry(entry);
      onDeleted(entry.id);
      sheet.current?.close();
    } catch (e) {
      setErr(humanError(e));
      setBusy(false);
    }
  }

  return (
    <Sheet ref={sheet} title="Edit entry" onClose={onClose}>
      <div className="stack-lg" style={{ paddingTop: 'var(--s-4)' }}>
        {photoUrl && <img className="entry-photo" src={photoUrl} alt={entry.name} />}
        <div>
          <h3 className="detail-title">{entry.name}</h3>
          <p className="muted t-small" style={{ marginTop: 6 }}>
            {entry.unit ? `${byGrams ? `${Math.round(Number(entry.qty))} g` : `${fmtQty(Number(entry.qty))} ${entry.unit}`} · ` : ''}
            {kcalFmt(Number(entry.kcal))} kcal as logged
          </p>
        </div>

        {entry.items && entry.items.length > 0 && (
          <ul className="recipe-peek-list">
            {entry.items.map((it, i) => (
              <li key={i}>
                <span>
                  {it.name}{it.grams ? <span className="faint"> · {it.grams} g</span> : null}
                  {it.calorie_source && <span className="faint"> · {it.calorie_source === 'label' ? 'label values' : 'photo estimate'}</span>}
                </span>
                <span className="num">{kcalFmt(it.kcal)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="field">
          <span>{byGrams ? 'Grams' : `How much${entry.unit ? ` (${entry.unit})` : ''}`}</span>
          {byGrams ? (
            <Stepper value={qty} onChange={setQty} step={10} min={5} max={5000} label="grams" format={(v) => `${Math.round(v)} g`} />
          ) : (
            <Stepper value={qty} onChange={setQty} label="servings" format={fmtQty} />
          )}
        </div>

        <div className="field">
          <span>Meal</span>
          <div className="chips" role="group" aria-label="Meal">
            {MEALS.map((m) => (
              <button key={m.id} type="button" className="chip" aria-pressed={meal === m.id} onClick={() => setMeal(m.id)}>{m.label}</button>
            ))}
          </div>
        </div>

        <Readout n={n} label="Now" />
        <ErrorLine>{err}</ErrorLine>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <button className="btn primary lg" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
          <HoldButton className="btn danger lg" ms={700} onConfirm={remove} disabled={busy} hint="Press and hold to remove this entry"><Trash2 /> Hold to remove</HoldButton>
        </div>
      </div>
    </Sheet>
  );
}

