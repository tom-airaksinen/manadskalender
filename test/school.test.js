import test from 'node:test';
import assert from 'node:assert/strict';
import { date, iso, week, scheduledStart, normalize } from '../src/school/model.js';
import { render } from '../src/school/render.js';

test('Veckoutskick från söndag v43 och ISO-årsskifte', () => {
  for (const value of ['2026-09-27', '2026-10-04', '2026-10-11', '2026-10-18', '2026-10-24']) {
    assert.equal(scheduledStart(date(value)), null);
  }
  assert.deepEqual(week(date('2026-10-25')), { year: 2026, week: 43 });
  assert.equal(iso(scheduledStart(date('2026-10-25'))), '2026-10-26');
  assert.equal(scheduledStart(date('2026-10-26')), null);
  assert.equal(iso(scheduledStart(date('2026-11-01'))), '2026-11-02');
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
