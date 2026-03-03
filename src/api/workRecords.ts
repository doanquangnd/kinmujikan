import { api_request } from './client';
import type { WorkRecord } from '@/types';

export interface MonthSummary {
  year: number;
  month: number;
  label: string;
  total_minutes: number;
}

export interface CreateRecordInput {
  day: number;
  time_start?: string | null;
  time_end?: string | null;
  break_minutes?: number | null;
  note?: string | null;
  category?: import('@/types').WorkCategory | '';
}

export interface UpdateRecordInput {
  id: number;
  time_start?: string | null;
  time_end?: string | null;
  break_minutes?: number | null;
  note?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  category?: import('@/types').WorkCategory | '';
}

/**
 * GET ?year=2026 => { months: [{ year, month, label, total_minutes }] }
 */
export async function fetchMonthsByYear(year: number): Promise<MonthSummary[]> {
  const label = `fetch-months-${year}`;
  if (import.meta.env.DEV) performance.mark(`${label}-start`);
  const data = await api_request<{ months: MonthSummary[] }>(
    `/api/work-records?year=${year}`
  );
  if (import.meta.env.DEV) {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    const m = performance.getEntriesByName(label).pop();
    if (m) console.debug(`[API] fetchMonthsByYear(${year}): ${Math.round(m.duration)}ms`);
  }
  return data.months;
}

/**
 * GET ?year=2026&month=1 => { records: [{ id, work_date, time_start, time_end, break_minutes, note }] }
 */
export async function fetchRecordsByMonth(
  year: number,
  month: number
): Promise<WorkRecord[]> {
  const label = `fetch-records-${year}-${month}`;
  if (import.meta.env.DEV) performance.mark(`${label}-start`);
  const data = await api_request<{ records: WorkRecord[] }>(
    `/api/work-records?year=${year}&month=${month}`
  );
  if (import.meta.env.DEV) {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    const m = performance.getEntriesByName(label).pop();
    if (m)
      console.debug(
        `[API] fetchRecordsByMonth(${year}/${month}): ${Math.round(m.duration)}ms`
      );
  }
  return data.records;
}

/**
 * POST /api/work-records — tạo mới cả tháng trong một request.
 * body: { year, month, scheduledStart?, scheduledEnd?, records: [...] }
 */
export async function createMonthRecords(
  year: number,
  month: number,
  records: CreateRecordInput[],
  options?: { scheduledStart?: string | null; scheduledEnd?: string | null }
): Promise<Record<string, unknown>> {
  return api_request('/api/work-records', {
    method: 'POST',
    body: JSON.stringify({
      year,
      month,
      scheduledStart: options?.scheduledStart ?? null,
      scheduledEnd: options?.scheduledEnd ?? null,
      records,
    }),
  });
}

/**
 * PUT /api/work-records — cập nhật nhiều bản ghi trong một request.
 * body: { records: [ { id, time_start?, time_end?, break_minutes?, note?, ... }, ... ] }
 */
export async function updateRecords(
  records: UpdateRecordInput[]
): Promise<Record<string, unknown>> {
  return api_request('/api/work-records', {
    method: 'PUT',
    body: JSON.stringify({ records }),
  });
}
