import { SOURCE, add, date } from './model.js';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const short = value => date(value).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', timeZone: 'UTC' });
export function render(model) {
  const end = add(date(model.weeks[3].start), 4).toISOString().slice(0, 10);
  return `<!doctype html><html lang="sv"><meta charset="utf-8"><title>Matsedel</title><style>
  @page {size:A4 portrait;margin:0} *{box-sizing:border-box} body{margin:0;color:#182920;font-family:Arial,sans-serif}
  main{width:210mm;height:296mm;padding:10mm;display:flex;flex-direction:column}
  header{margin-bottom:4mm;border-bottom:2px solid #385b42;padding-bottom:3mm}
  .eyebrow{font-size:9pt;letter-spacing:1.5px;text-transform:uppercase;color:#46664e}
  h1{font-size:21pt;letter-spacing:-.7px;margin:2mm 0} .period{font-size:11pt;color:#425148}
  .grid{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:4mm;flex:1;min-height:0}
  section{border:1px solid #c5cec6;border-radius:3mm;padding:3.5mm;min-height:0}
  h2{font-size:14pt;margin:0 0 1mm} .range{font-size:8.5pt;color:#536258;margin-bottom:2mm}
  article{padding:1.2mm 0;border-top:1px solid #e0e5e0} h3{font-size:9pt;margin:0 0 1mm}
  .meal{font-size:var(--meal-size,9pt);line-height:1.24;margin:0 0 1mm} .tag{font-size:7pt;color:#526357}
  .missing{font-size:9pt;color:#645442;font-style:italic} footer{font-size:7.5pt;line-height:1.5;color:#526057;margin-top:5mm}
  </style><main><header><div class="eyebrow">Skolmatsedel · fyra veckor</div><h1>${esc(model.school)}</h1><div class="period">${short(model.weeks[0].start)} - ${short(end)} ${date(end).getUTCFullYear()}</div></header>
  <div class="grid">${model.weeks.map(w => `<section><h2>Vecka ${w.week}</h2><div class="range">${short(w.start)} - ${short(add(date(w.start), 4).toISOString().slice(0, 10))}</div>${w.days.map((d, i) => `<article><h3>${['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'][i]} ${date(d.date).getUTCDate()}/${date(d.date).getUTCMonth() + 1}</h3>${d.note ? `<div class="missing">${esc(d.note)}</div>` : d.meals.length ? d.meals.map(m => `<p class="meal">${esc(m.name)}${m.attributes.length ? ` <span class="tag">(${esc(m.attributes.join(', '))})</span>` : ''}</p>`).join('') : '<div class="missing">Matsedel ej publicerad</div>'}</article>`).join('')}</section>`).join('')}</div>
  <footer>Källa: ${SOURCE} · Hämtad ${esc(model.fetched.slice(0, 10))}<br>Skolan kan ändra menyn. Saknade uppgifter markeras som ej publicerade.</footer></main></html>`;
}
export async function makePdf(browser, model) {
  const page = await browser.newPage();
  try {
    await page.setContent(render(model));
    await page.emulateMediaType('print');
    let fits = false;
    for (const size of [9, 8.5, 8]) {
      await page.evaluate(size => document.documentElement.style.setProperty('--meal-size', `${size}pt`), size);
      fits = await page.evaluate(() => [...document.querySelectorAll('section')].every(el => el.scrollHeight <= el.clientHeight + 1) && document.querySelector('main').scrollHeight <= document.querySelector('main').clientHeight + 1);
      if (fits) break;
    }
    if (!fits) throw new Error('Matsedeln ryms inte läsbart på en sida. Inget mejl skickas.');
    return await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
  } finally { await page.close(); }
}
