// Entry point.
//
// Scheduled run (GitHub Actions, daily 17:00 UTC):
//   - Exits quietly unless today is the second-to-last day of the month.
//   - On that day: builds NEXT month, renders a PDF, e-mails it via Resend.
//
// Manual / local runs:
//   node src/generate.js --month 2026-08 --dry-run   # write PDF to ./out, no e-mail
//   node src/generate.js --force                      # ignore the day check, send next month
//   FORCE_SEND=true node src/generate.js              # same, via env (used by workflow_dispatch)

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

import { buildMonth, nextMonthOf, isSecondToLastDay, pad2 } from './calendar.js';
import { renderCalendarHtml } from './render.js';
import { sendCalendar } from './mail.js';

function parseArgs(argv) {
  const args = { dryRun: false, force: false, month: null, out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--force') args.force = true;
    else if (a === '--month') args.month = argv[++i];
    else if (a === '--out') args.out = argv[++i];
  }
  return args;
}

async function htmlToPdf(html) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-gpu'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    return await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });
  } finally {
    await browser.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const forced = args.force || args.month !== null || process.env.FORCE_SEND === 'true';
  const now = new Date();

  // Day guard — only relevant for the scheduled path.
  if (!forced && !isSecondToLastDay(now)) {
    console.log(`Not the second-to-last day (today is ${now.toISOString().slice(0, 10)}). Nothing to do.`);
    return;
  }

  // Which month to render.
  let year;
  let month0;
  if (args.month) {
    const [y, m] = args.month.split('-').map(Number);
    year = y;
    month0 = m - 1;
  } else {
    ({ year, month0 } = nextMonthOf(now));
  }

  const model = buildMonth(year, month0);
  console.log(`Rendering calendar for ${model.monthName} ${year}…`);
  const html = renderCalendarHtml(model);
  const pdf = await htmlToPdf(html);

  const wantsEmail = !args.dryRun && process.env.RESEND_API_KEY;
  if (wantsEmail) {
    const to = process.env.MAIL_TO;
    const from = process.env.MAIL_FROM || 'onboarding@resend.dev';
    if (!to) throw new Error('MAIL_TO is not set.');
    console.log(`Sending to ${to} (from ${from})…`);
    await sendCalendar({ pdf, model, to, from });
    console.log('E-mail sent.');
  } else {
    const out = args.out || path.join('out', `kalender-${year}-${pad2(month0 + 1)}.pdf`);
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, pdf);
    console.log(`Wrote ${out} (${pdf.length} bytes). No e-mail sent${args.dryRun ? ' (--dry-run)' : ' (RESEND_API_KEY unset)'}.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
