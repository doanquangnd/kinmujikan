import { api_request } from './client.js';

/**
 * GET ?year=2026 => { months: [{ year, month, label, total_minutes }] }
 * GET ?year=2026&month=1 => { records: [{ id, work_date, time_start, time_end, break_minutes, note }] }
 */
export async function fetchMonthsByYear(year) {
  const data = await api_request(`/api/work-records?year=${year}`);
  return data.months;
}

export async function fetchRecordsByMonth(year, month) {
  const data = await api_request(`/api/work-records?year=${year}&month=${month}`);
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
