import test from 'node:test';
import assert from 'node:assert/strict';
import { date, iso, week, scheduledStart, normalize } from '../src/school/model.js';
import { render } from '../src/school/render.js';

test('28-dagarsschema och ISO-årsskifte', () => {
  assert.equal(iso(scheduledStart(date('2026-09-13'))), '2026-09-14');
  assert.equal(scheduledStart(date('2026-09-20')), null);
  assert.equal(iso(scheduledStart(date('2026-10-11'))), '2026-10-12');
  assert.equal(iso(scheduledStart(date('2027-01-03'))), '2027-01-04');
  assert.deepEqual(week(date('2027-01-01')), { year: 2026, week: 53 });
  assert.deepEqual(week(date('2027-01-04')), { year: 2027, week: 1 });
  assert.throws(() => date('2026-02-30'));
});
test('Saknad vecka visas som opublicerad och fel vecka avvisas', () => {
  const data = { School: { name: 'Årstaskolan - Årstaviken' }, WeekState: null };
  const w = normalize(data, date('2026-09-14'));
  assert.equal(w.days.length, 5);
  assert.equal(w.days[4].date, '2026-09-18');
  assert.ok(w.days.every(d => d.meals.length === 0));
  assert.throws(() => normalize({ ...data, WeekState: { week: 37, year: 2026 } }, date('2026-09-14')));
  const html = render({ school: '<script>test</script>', weeks: [w,w,w,w], fetched: '2026-09-12' });
  assert.match(html, /Matsedel ej publicerad/);
  assert.ok(!html.includes('<script>test</script>'));
});
