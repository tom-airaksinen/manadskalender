// Sends the generated PDF via Resend.

import { Resend } from 'resend';
import { pad2 } from './calendar.js';

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function sendCalendar({ pdf, model, to, from }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const filename = `kalender-${model.year}-${pad2(model.month0 + 1)}.pdf`;
  const label = `${capitalize(model.monthName)} ${model.year}`;

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: `Kalender – ${label}`,
    text: `Här kommer kalendern för ${model.monthName} ${model.year}.`,
    attachments: [{ filename, content: pdf.toString('base64') }],
  });

  if (error) {
    throw new Error(`Resend failed: ${JSON.stringify(error)}`);
  }
  return data;
}
