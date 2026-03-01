import { api_request } from './client.js';

/**
 * GET ?year=2026 => { months: [{ year, month, label, total_minutes }] }
 * GET ?year=2026&month=1 => { records: [{ id, work_date, time_start, time_end, break_minutes, note }] }
 */
export async function fetchMonthsByYear(year) {
  const label = `fetch-months-${year}`;
  if (import.meta.env.DEV) performance.mark(`${label}-start`);
  const data = await api_request(`/api/work-records?year=${year}`);
  if (import.meta.env.DEV) {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    const m = performance.getEntriesByName(label).pop();
    if (m) console.debug(`[API] fetchMonthsByYear(${year}): ${Math.round(m.duration)}ms`);
  }
  return data.months;
}

export async function fetchRecordsByMonth(year, month) {
  const label = `fetch-records-${year}-${month}`;
  if (import.meta.env.DEV) performance.mark(`${label}-start`);
  const data = await api_request(`/api/work-records?year=${year}&month=${month}`);
  if (import.meta.env.DEV) {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    const m = performance.getEntriesByName(label).pop();
    if (m) console.debug(`[API] fetchRecordsByMonth(${year}/${month}): ${Math.round(m.duration)}ms`);
  }
  return data.records;
}

/**
 * POST /api/work-records — tạo mới cả tháng trong một request.
 * body: { year, month, records: [{ day, time_start?, time_end?, break_minutes?, note? }] }
 */
export async function createMonthRecords(year, month, records) {
  return api_request('/api/work-records', {
    method: 'POST',
    body: JSON.stringify({ year, month, records }),
  });
}

/**
 * PUT /api/work-records — cập nhật nhiều bản ghi trong một request.
 * body: { records: [ { id, time_start?, time_end?, break_minutes?, note?, rest_day? }, ... ] }
 */
export async function updateRecords(records) {
  return api_request('/api/work-records', {
    method: 'PUT',
    body: JSON.stringify({ records }),
  });
}
