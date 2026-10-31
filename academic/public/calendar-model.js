export const publicationOnly = item => String(item.dateBasis || '').includes('发布日期');
export const endDate = item => publicationOnly(item) ? item.start : (item.end || item.start);
export const coversDate = (item, iso) => item.start <= iso && endDate(item) >= iso;
/**
 * A calendar range is rendered as adjacent start / through / end segments.
 * Publication-only notices intentionally collapse to a single point because
 * their later date is not a verified event boundary.
 */
export function rangeSegmentKind(item, iso) {
  if (!coversDate(item, iso)) return null;
  const end = endDate(item);
  if (item.start === end) return 'point';
  if (iso === item.start) return 'start';
  if (iso === end) return 'end';
  return 'through';
}

/** Return normalized progress for a true date range, or null for a point. */
export function rangeProgress(item, iso) {
  if (!coversDate(item, iso)) return null;
  const end = endDate(item);
  if (item.start === end) return null;
  const first = Date.parse(item.start + 'T12:00:00Z');
  const last = Date.parse(end + 'T12:00:00Z');
  const current = Date.parse(iso + 'T12:00:00Z');
  if (!Number.isFinite(first) || !Number.isFinite(last) || !Number.isFinite(current) || last <= first) return null;
  return Math.max(0, Math.min(1, (current - first) / (last - first)));
}
export const addDays = (iso, amount) => {
  const date = new Date(iso + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};
export function monthDates(year, month) {
  return Array.from({length: new Date(Date.UTC(year, month, 0)).getUTCDate()}, (_, i) =>
    `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`);
}
export function filterRecords(items, filters, kind, group = value => value) {
  const query = filters.query.trim().toLocaleLowerCase();
  return items.filter(item => {
    if (filters.category !== '全部' && (kind === 'year' ? item.category !== filters.category : group(item.domain) !== filters.category && item.domain !== filters.category)) return false;
    if (kind === 'year' && filters.mode === 'all' && filters.year !== '全部' &&
        (item.start > filters.year + '-12-31' || endDate(item) < filters.year + '-01-01')) return false;
    return !query || [item.title, item.summary, item.factSummary, item.domain, item.sourceName, item.category, item.historicalSignificance]
      .filter(Boolean).join(' ').toLocaleLowerCase().includes(query);
  });
}
export function agendaBuckets(items, today) {
  const until = addDays(today, 30);
  const current = items.filter(item => coversDate(item, today)).sort((a, b) =>
    Number(a.category === '节假日') - Number(b.category === '节假日') || Number(b.provenance === '已核验官网') - Number(a.provenance === '已核验官网') || endDate(a).localeCompare(endDate(b)) || String(a.title || '').localeCompare(String(b.title || '')));
  const upcoming = items.filter(item => item.start > today && item.start <= until)
    .sort((a, b) => a.start.localeCompare(b.start) || Number(b.provenance === '已核验官网') - Number(a.provenance === '已核验官网') || a.title.localeCompare(b.title));
  return {current, upcoming};
}
export function historyForDate(items, key) {
  const ranks = {S: 0, A: 1, B: 2};
  const matching = items.filter(item => item.dateKey === key);
  const featured = [...matching].sort((a, b) => (ranks[a.importance] ?? 3) - (ranks[b.importance] ?? 3) || a.year - b.year || a.id.localeCompare(b.id))[0];
  return {featured, others: matching.filter(item => item !== featured).sort((a, b) => a.year - b.year || a.id.localeCompare(b.id))};
}
