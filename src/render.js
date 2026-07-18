// Turns a month model (from calendar.js) into a printable HTML string.
// Clean style: no flag, no weekend shading, no events.

import { WEEKDAYS_SV } from './calendar.js';

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function renderCalendarHtml(model) {
  const title = `${capitalize(model.monthName)} ${model.year}`;

  const weekdayHeads = WEEKDAYS_SV
    .map((name) => `<div class="day-head">${name}</div>`)
    .join('');

  const weekRows = model.weeks.map((week) => {
    const cells = week.days.map((d) => {
      const num = d.inMonth ? `<span class="num">${d.day}</span>` : '';
      const cls = d.inMonth ? 'cell' : 'cell empty';
      return `<div class="${cls}">${num}</div>`;
    }).join('');
    return `<div class="row week"><div class="wk">${week.weekNumber}</div>${cells}</div>`;
  }).join('');

  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<style>
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: "Helvetica Neue", Arial, sans-serif; color: #1a1a1a; }
  .page { width: 277mm; height: 190mm; margin: 0 auto; display: flex; flex-direction: column; }

  header { padding: 2mm 2mm 5mm; }
  h1 { text-align: center; font-size: 30pt; font-weight: 700; margin: 0; color: #333; letter-spacing: 0.5px; }

  .cal { flex: 1; display: flex; flex-direction: column; border: 1.5px solid #444; }
  .row { display: grid; grid-template-columns: 26px repeat(7, 1fr); }
  .row.weekdays { flex: 0 0 auto; }
  .row.week { flex: 1; }

  .wk-head, .wk {
    display: flex; align-items: flex-start; justify-content: center;
    font-size: 8pt; color: #999; padding-top: 4px;
    border-right: 1px solid #ccc; background: #f4f4f4;
  }
  .wk-head { background: #fff; border-bottom: 1.5px solid #444; }

  .day-head {
    text-align: center; font-size: 11.5pt; color: #555; font-weight: 400;
    padding: 5px 0 7px; border-bottom: 1.5px solid #444; border-right: 1px solid #eee;
  }
  .day-head:last-child { border-right: none; }

  .cell {
    border-right: 1px solid #ddd; border-top: 1px solid #ddd;
    padding: 4px 7px; overflow: hidden;
  }
  .cell:last-child { border-right: none; }
  .row.week:first-of-type .cell { border-top: none; }
  .cell .num { font-size: 15pt; color: #222; line-height: 1; }
</style>
</head>
<body>
<div class="page">
  <header><h1>${title}</h1></header>
  <div class="cal">
    <div class="row weekdays"><div class="wk-head"></div>${weekdayHeads}</div>
    ${weekRows}
  </div>
</div>
</body>
</html>`;
}
