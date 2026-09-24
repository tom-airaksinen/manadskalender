import { SOURCE, add, monday, week, normalize, DAY } from './model.js';

// Läs samma offentliga svar som sidan hämtar vid vanlig veckonavigering.
// Inga kopierade klientnycklar eller registrerade API-konton behövs.
export async function fetchWeeks(browser, start, today) {
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  const responseFor = d => page.waitForResponse(r => {
    const u = new URL(r.url());
    if (!d) return u.pathname === '/api/4/menu/school/arstaskolan2';
    const w = week(d);
    return u.pathname === '/api/4/menu/school/arstaskolan2' &&
      u.searchParams.get('year') === String(w.year) && u.searchParams.get('week') === String(w.week);
  }, { timeout: 45000 });
  const read = async pending => {
    const response = await pending;
    if (!response.ok()) throw new Error(`Skolmaten svarade HTTP ${response.status()}`);
    return response.json();
  };
  try {
    let cursor = monday(today);
    const pending = responseFor(null);
    const [initial] = await Promise.all([read(pending), page.goto(SOURCE, { waitUntil: 'domcontentloaded', timeout: 60000 })]);
    let data = initial;
    if (Math.abs(+start - +cursor) > 52 * 7 * DAY) throw new Error('Välj ett startdatum inom ett år');
    const step = async direction => {
      cursor = add(cursor, direction * 7);
      const pending = read(responseFor(cursor));
      const label = direction > 0 ? /^(Next week|Nästa vecka)$/ : /^(Previous week|Föregående vecka)$/;
      const [result] = await Promise.all([
        pending,
        page.waitForFunction(direction => {
          const pattern = direction > 0 ? /^(Next week|Nästa vecka)$/ : /^(Previous week|Föregående vecka)$/;
          return [...document.querySelectorAll('button')].some(el => pattern.test(el.getAttribute('aria-label') || el.textContent.trim()));
        }, {}, direction).then(async () => {
          const buttons = await page.$$('button');
          for (const button of buttons) {
            if (label.test(await button.evaluate(el => el.getAttribute('aria-label') || el.textContent.trim()))) { await button.click(); return; }
          }
          throw new Error('Hittade inte veckoknappen');
        }),
      ]);
      return result;
    };
    while (+cursor !== +start) data = await step(+start > +cursor ? 1 : -1);
    const weeks = [normalize(data, cursor)];
    for (let i = 1; i < 4; i++) weeks.push(normalize(await step(1), cursor));
    return { school: data.School.name, weeks, fetched: new Date().toISOString() };
  } finally { await page.close(); }
}
