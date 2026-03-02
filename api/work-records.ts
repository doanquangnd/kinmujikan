/**
 * GET /api/work-records?year=2026 => { months: [...] }
 * GET /api/work-records?year=2026&month=1 => { records: [...] }
 * POST /api/work-records => { year, month, records: [...] }
 * PUT /api/work-records => { records: [...] }
 *
 * SQL Injection: Tất cả query dùng @neondatabase/serverless tagged template với tham số hóa
 * (${user_id}, ${email}, ...). Không có string concatenation, an toàn khỏi SQL injection.
 */
import { sql, getNeonClient } from '../lib/db.js';
import { require_auth } from '../lib/auth.js';
import { json_response, get_cors_origin } from '../lib/response.js';

function normalize_hhmm(val: unknown): string | null {
  if (val == null || val === '') return null;
  const s = String(val).trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{0,2})?$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
}

function normalize_break(val: unknown): number | null {
  if (val == null || val === '') return null;
  const n = parseInt(String(val), 10);
  if (isNaN(n) || n < 0 || n > 600) return null;
  return n;
}

interface WorkRecordsRequest {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: string | Record<string, unknown>;
}

interface WorkRecordsResponse {
  setHeader(name: string, value: string | number): void;
  status(code: number): { json(data: unknown): void; end(): void };
}

interface AuthError {
  status?: number;
  body?: Record<string, unknown>;
}

interface DbRow {
  id: number;
  work_date: string | Date | null;
  time_start?: string | null;
  time_end?: string | null;
  break_minutes?: number | null;
  note?: string | null;
  rest_day?: boolean | number;
}

export default async function handler(req: WorkRecordsRequest, res: WorkRecordsResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', get_cors_origin(req));
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).end();
    return;
  }
  if (!req.method || !['GET', 'POST', 'PUT'].includes(req.method)) {
    json_response(res, 405, { error: 'Method Not Allowed' }, { req });
    return;
  }

  let user_id: number;
  try {
    user_id = require_auth(req);
  } catch (e) {
    const err = e as AuthError;
    json_response(res, err.status || 401, err.body || { error: 'Unauthorized' }, { req });
    return;
  }

  try {
    const url = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
    const year = parseInt(url.searchParams.get('year') || '0', 10);
    const month = parseInt(url.searchParams.get('month') || '0', 10);

    if (req.method === 'GET') {
      if (year < 2000 || year > 2100) {
        json_response(res, 400, { error: 'Bad Request', message: 'year không hợp lệ' }, { req });
        return;
      }
      if (month >= 1 && month <= 12) {
        const t0 = Date.now();
        const from = `${year}-${String(month).padStart(2, '0')}-01`;
        const last = new Date(year, month, 0).getDate();
        const to = `${year}-${String(month).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
        const result = await sql`
          SELECT id, work_date, time_start, time_end, break_minutes, note, rest_day
          FROM work_records
          WHERE user_id = ${user_id} AND work_date >= ${from} AND work_date <= ${to}
          ORDER BY work_date
        `;
        const records = (result.rows as DbRow[]).map((r) => {
          const wd = r.work_date;
          let work_date: string | null = null;
          if (wd != null) {
            if (typeof wd === 'string') {
              work_date = wd.slice(0, 10);
            } else if (wd instanceof Date) {
              work_date = `${wd.getFullYear()}-${String(wd.getMonth() + 1).padStart(2, '0')}-${String(wd.getDate()).padStart(2, '0')}`;
            } else {
              work_date = String(wd).slice(0, 10);
            }
          }
          return {
            id: parseInt(String(r.id), 10),
            work_date,
            time_start: r.time_start ? String(r.time_start).slice(0, 5) : null,
            time_end: r.time_end ? String(r.time_end).slice(0, 5) : null,
            break_minutes: r.break_minutes != null ? parseInt(String(r.break_minutes), 10) : null,
            note: r.note ?? null,
            rest_day: !!r.rest_day,
          };
        });
        const queryMs = Math.round(Date.now() - t0);
        res.setHeader('Server-Timing', `db;dur=${queryMs};desc="query records"`);
        json_response(res, 200, { records }, { req });
        return;
      }
      const t0 = Date.now();
      const from_year = `${year}-01-01`;
      const to_year = `${year + 1}-01-01`;
      const result = await sql`
        SELECT
          EXTRACT(YEAR FROM work_date)::int AS y,
          EXTRACT(MONTH FROM work_date)::int AS m,
          SUM(
            CASE
              WHEN time_start IS NULL OR time_end IS NULL THEN 0
              ELSE GREATEST(0,
                EXTRACT(EPOCH FROM (time_end - time_start)) / 60 - COALESCE(break_minutes, 0)
              )
            END
          )::int AS total_minutes
        FROM work_records
        WHERE user_id = ${user_id} AND work_date >= ${from_year} AND work_date < ${to_year}
        GROUP BY EXTRACT(YEAR FROM work_date), EXTRACT(MONTH FROM work_date)
        ORDER BY y DESC, m DESC
      `;
      const months = (result.rows as { y: number; m: number; total_minutes: number }[]).map((r) => ({
        year: r.y,
        month: r.m,
        label: `${r.y}年${String(r.m).padStart(2, '0')}月`,
        total_minutes: r.total_minutes,
      }));
      const queryMs = Math.round(Date.now() - t0);
      res.setHeader('Server-Timing', `db;dur=${queryMs};desc="query months"`);
      json_response(res, 200, { months }, { req });
      return;
    }

    const body = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})) as Record<string, unknown>;

    if (req.method === 'POST') {
      const y = parseInt(String(body.year || '0'), 10);
      const m = parseInt(String(body.month || '0'), 10);
      const records = (body.records || []) as Record<string, unknown>[];

      if (y < 2000 || y > 2100 || m < 1 || m > 12) {
        json_response(res, 400, { error: 'Bad Request', message: 'year, month không hợp lệ' }, { req });
        return;
      }
      const now = new Date();
      const maxMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      if (new Date(y, m - 1, 1) > maxMonth) {
        json_response(res, 400, { error: 'Bad Request', message: 'Chỉ được tạo tối đa đến tháng sau so với hiện tại' }, { req });
        return;
      }
      if (!Array.isArray(records)) {
        json_response(res, 400, { error: 'Bad Request', message: 'records phải là mảng' }, { req });
        return;
      }

      const from = `${y}-${String(m).padStart(2, '0')}-01`;
      const next_m = m === 12 ? 1 : m + 1;
      const next_y = m === 12 ? y + 1 : y;
      const to_excl = `${next_y}-${String(next_m).padStart(2, '0')}-01`;
      const existing = await sql`
        SELECT 1 FROM work_records
        WHERE user_id = ${user_id} AND work_date >= ${from} AND work_date < ${to_excl}
        LIMIT 1
      `;
      if (existing.rows.length > 0) {
        json_response(res, 409, { error: 'Conflict', message: 'Tháng này đã có bản ghi' }, { req });
        return;
      }

      const last_day = new Date(y, m, 0).getDate();
      const client = getNeonClient();
      const insertQueries: ReturnType<typeof client>[] = [];
      for (const r of records) {
        const day = parseInt(String(r.day || '0'), 10);
        if (day < 1 || day > last_day) continue;
        const work_date = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const time_start = normalize_hhmm(r.time_start);
        const time_end = normalize_hhmm(r.time_end);
        const break_minutes = normalize_break(r.break_minutes);
        const note = r.note != null ? String(r.note).trim().slice(0, 500) || null : null;
        const rest_day = r.rest_day ? 1 : 0;
        insertQueries.push(
          client`INSERT INTO work_records (user_id, work_date, time_start, time_end, break_minutes, note, rest_day)
            VALUES (${user_id}, ${work_date}, ${time_start}, ${time_end}, ${break_minutes}, ${note}, ${rest_day})`
        );
      }
      if (insertQueries.length > 0) {
        await client.transaction(insertQueries);
      }
      json_response(res, 201, { created: insertQueries.length, year: y, month: m }, { req });
      return;
    }

    if (req.method === 'PUT') {
      const records = (body.records || []) as Record<string, unknown>[];
      if (!Array.isArray(records)) {
        json_response(res, 400, { error: 'Bad Request', message: 'records phải là mảng' }, { req });
        return;
      }
      const ids = [...new Set(records.map((r) => parseInt(String(r.id), 10)).filter((id) => id > 0))];
      if (ids.length === 0) {
        json_response(res, 200, { updated: 0 }, { req });
        return;
      }

      const allowed = await sql`
        SELECT id FROM work_records WHERE user_id = ${user_id} AND id = ANY(${ids})
      `;
      const allowedSet = new Set((allowed.rows as { id: number }[]).map((r) => parseInt(String(r.id), 10)));

      const client = getNeonClient();
      const updateQueries: ReturnType<typeof client>[] = [];
      for (const r of records) {
        const id = parseInt(String(r.id), 10);
        if (id <= 0 || !allowedSet.has(id)) continue;
        const time_start = normalize_hhmm(r.time_start);
        const time_end = normalize_hhmm(r.time_end);
        const break_minutes = normalize_break(r.break_minutes);
        const note = r.note != null ? String(r.note).trim().slice(0, 500) || null : null;
        const rest_day = r.rest_day ? 1 : 0;
        updateQueries.push(
          client`UPDATE work_records
            SET time_start = ${time_start}, time_end = ${time_end}, break_minutes = ${break_minutes}, note = ${note}, rest_day = ${rest_day}, updated_at = NOW()
            WHERE id = ${id} AND user_id = ${user_id}`
        );
      }
      if (updateQueries.length > 0) {
        await client.transaction(updateQueries);
      }
      json_response(res, 200, { updated: updateQueries.length }, { req });
      return;
    }
  } catch (err) {
    const authErr = err as AuthError;
    if (authErr.status) {
      json_response(res, authErr.status, authErr.body || {}, { req });
      return;
    }
    console.error(err);
    json_response(res, 500, { error: 'Internal Server Error' }, { req });
  }
}
