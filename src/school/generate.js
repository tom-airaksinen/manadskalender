import { mkdir, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import puppeteer from 'puppeteer';
import { Resend } from 'resend';
import { date, iso, add, monday, scheduledStart } from './model.js';
import { fetchWeeks } from './fetch.js';
import { makePdf, render } from './render.js';

const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' }, start: { type: 'string' } } });
const today = date(new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' }));
const dryRun = values['dry-run'] || process.env.DRY_RUN === 'true';
const requested = values.start || process.env.START_DATE;
let start = requested ? date(requested) : dryRun ? add(monday(today), 7) : scheduledStart(today);
if (!start) { console.log('Ingen utskicksdag för matsedeln.'); process.exit(0); }
if (start.getUTCDay() !== 1) throw new Error('Startdatum måste vara en måndag');
if (!dryRun && (!process.env.RESEND_API_KEY || !process.env.MAIL_TO)) throw new Error('Mejlinställningar saknas');

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-gpu'], env: { ...process.env, TZ: 'Europe/Stockholm' } });
let model, pdf;
try {
  model = await fetchWeeks(browser, start, today);
  await mkdir('output/pdf', { recursive: true });
  await writeFile('output/pdf/matsedel.json', JSON.stringify(model, null, 2));
  if (!model.weeks.some(w => w.days.some(d => d.meals.length || d.note))) throw new Error('Alla fyra veckor saknar matsedel. Inget mejl skickas.');
  pdf = await makePdf(browser, model);
} finally { await browser.close(); }
const filename = `matsedel-${iso(start)}.pdf`;
await mkdir('output/pdf', { recursive: true });
await writeFile(`output/pdf/${filename}`, pdf);
await writeFile('output/pdf/matsedel.html', render(model));
await writeFile('output/pdf/matsedel.json', JSON.stringify(model, null, 2));
const missing = model.weeks.filter(w => w.days.some(d => !d.meals.length && !d.note)).map(w => w.week);
console.log(`Skapade ${filename}. Veckor med saknade uppgifter: ${missing.join(', ') || 'inga'}.`);
if (!dryRun) {
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: process.env.MAIL_FROM || 'onboarding@resend.dev',
    to: process.env.MAIL_TO,
    subject: `Årstaskolans matsedel - vecka ${model.weeks[0].week}-${model.weeks[3].week}`,
    text: `Här kommer fyra veckors matsedel på en A4, från ${iso(start)}.\n${missing.length ? `Obs: uppgifter saknas i vecka ${missing.join(', ')} och är tydligt markerade i PDF:en.\n` : ''}Källa: https://skolmaten.se/arstaskolan2\nSkolan kan ändra menyn efter utskicket.`,
    attachments: [{ filename, content: Buffer.from(pdf).toString('base64') }],
  }, { idempotencyKey: `arstaskolan2-${iso(start)}` });
  if (error) throw new Error(`Resend: ${error.message}`);
  console.log('Matsedel skickad.');
} else console.log('Förhandsgranskning klar; inget mejl skickat.');
