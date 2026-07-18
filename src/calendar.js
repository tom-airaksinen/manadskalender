// Pure date math for building a month grid. No I/O, easy to reason about/test.

export const MONTHS_SV = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
];

export const WEEKDAYS_SV = [
  'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag',
];

export function pad2(n) {
  return String(n).padStart(2, '0');
}

// Last calendar day of the given month (month0 = 0-based).
export function lastDayOfMonth(year, month0) {
  return new Date(year, month0 + 1, 0).getDate();
}

// True when `date` is the second-to-last day of its own month.
export function isSecondToLastDay(date) {
  const last = lastDayOfMonth(date.getFullYear(), date.getMonth());
  return date.getDate() === last - 1;
}

// The month that follows `date`, as { year, month0 }.
export function nextMonthOf(date) {
  let year = date.getFullYear();
  let month0 = date.getMonth() + 1;
  if (month0 > 11) { month0 = 0; year += 1; }
  return { year, month0 };
}

// ISO-8601 week number (weeks start Monday, week 1 contains the first Thursday).
export function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = (d.getUTCDay() + 6) % 7;      // Mon=0 … Sun=6
  d.setUTCDate(d.getUTCDate() - day + 3);    // move to the Thursday of this week
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const fDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - fDay + 3);
  return 1 + Math.round((d - firstThursday) / (7 * 864e5));
}

// Build a Monday-first month model:
// { year, month0, monthName, weeks: [ { weekNumber, days: [ {day, inMonth} × 7 ] } ] }
export function buildMonth(year, month0) {
  const daysInMonth = lastDayOfMonth(year, month0);
  const first = new Date(year, month0, 1);
  const startOffset = (first.getDay() + 6) % 7;                 // days before the 1st (Mon-first)
  const rows = Math.ceil((startOffset + daysInMonth) / 7);
  const cursor = new Date(year, month0, 1 - startOffset);

  const weeks = [];
  for (let r = 0; r < rows; r++) {
    let weekNumber = null;
    const days = [];
    for (let i = 0; i < 7; i++) {
      if (i === 0) weekNumber = isoWeek(cursor);
      const inMonth = cursor.getMonth() === month0 && cursor.getFullYear() === year;
      days.push({ day: cursor.getDate(), inMonth });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push({ weekNumber, days });
  }

  return { year, month0, monthName: MONTHS_SV[month0], weeks };
}
