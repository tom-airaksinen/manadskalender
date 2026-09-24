export const SOURCE = 'https://skolmaten.se/arstaskolan2';
export const DAY = 86400000;
export const date = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Datum måste vara YYYY-MM-DD');
  const result = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(+result) || result.toISOString().slice(0, 10) !== value) throw new Error('Ogiltigt datum');
  return result;
};
export const iso = d => d.toISOString().slice(0, 10);
export const add = (d, days) => new Date(+d + days * DAY);
export const monday = d => add(d, -((d.getUTCDay() + 6) % 7));
export function week(d) {
  const thursday = add(monday(d), 3);
  const year = thursday.getUTCFullYear();
  return { year, week: 1 + Math.round((+monday(d) - +monday(date(`${year}-01-04`))) / (7 * DAY)) };
}
export function scheduledStart(today, anchor = date('2026-10-26')) {
  const elapsed = Math.round((+today - +add(anchor, -1)) / DAY);
  return elapsed >= 0 && elapsed % 7 === 0 ? add(today, 1) : null;
}
export function normalize(data, start) {
  if (!data?.School?.name?.includes('Årstaskolan')) throw new Error('Oväntad skola i svaret');
  const expected = week(start);
  const state = data.WeekState;
  if (state && (state.year !== expected.year || state.week !== expected.week)) throw new Error('Fel vecka i svaret');
  const days = Array.from({ length: 5 }, (_, i) => {
    const value = iso(add(start, i));
    const day = state?.Days?.find(d => d.date?.slice(0, 10) === value);
    const meals = (day?.Meals ?? []).slice().sort((a, b) => a.order - b.order).map(m => ({
      name: String(m.name ?? '').replace(/\s+/g, ' ').trim(),
      attributes: (m.MealAttributes ?? []).map(a => a.sv).filter(Boolean),
    })).filter(m => m.name);
    return { date: value, meals, note: day?.cancelled ? String(day.cancelled === true ? 'Ingen servering' : day.cancelled) : null };
  });
  return { ...expected, start: iso(start), days };
}
