/**
 * GET /api/work-records?year=2026 => { months: [...] }
 * GET /api/work-records?year=2026&month=1 => { records: [...] }
 * POST /api/work-records => { year, month, records: [...] }
 * PUT /api/work-records => { records: [...] }
 */
import { sql, getNeonClient } from '../lib/db.js';
import { require_auth } from '../lib/auth.js';
import { json_response } from '../lib/response.js';

function normalize_hhmm(val) {
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

function normalize_break(val) {
  if (val == null || val === '') return null;
  const n = parseInt(val, 10);
  if (isNaN(n) || n < 0 || n > 600) return null;
  return n;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }
  if (!['GET', 'POST', 'PUT'].includes(req.method)) {
    return json_response(res, 405, { error: 'Method Not Allowed' });
  }

  let user_id;
  try {
    user_id = require_auth(req);
  } catch (e) {
    return json_response(res, e.status || 401, e.body || { error: 'Unauthorized' });
  }

  try {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const year = parseInt(url.searchParams.get('year') || '0', 10);
    const month = parseInt(url.searchParams.get('month') || '0', 10);

    if (req.method === 'GET') {
      if (year < 2000 || year > 2100) {
        return json_response(res, 400, { error: 'Bad Request', message: 'year không hợp lệ' });
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
        const records = result.rows.map((r) => {
          const wd = r.work_date;
          let work_date = null;
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
          id: parseInt(r.id, 10),
          work_date,
          time_start: r.time_start ? r.time_start.slice(0, 5) : null,
          time_end: r.time_end ? r.time_end.slice(0, 5) : null,
          break_minutes: r.break_minutes != null ? parseInt(r.break_minutes, 10) : null,
          note: r.note,
          rest_day: !!r.rest_day,
        };
        });
        const queryMs = Math.round(Date.now() - t0);
        res.setHeader('Server-Timing', `db;dur=${queryMs};desc="query records"`);
        return json_response(res, 200, { records });
      }
      const t0 = Date.now();
      // Dùng date range thay vì EXTRACT để tận dụng index idx_work_records_user_date
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
      const months = result.rows.map((r) => ({
        year: r.y,
        month: r.m,
        label: `${r.y}年${String(r.m).padStart(2, '0')}月`,
        total_minutes: r.total_minutes,
      }));
      const queryMs = Math.round(Date.now() - t0);
      res.setHeader('Server-Timing', `db;dur=${queryMs};desc="query months"`);
      return json_response(res, 200, { months });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    if (req.method === 'POST') {
      const y = parseInt(body.year || '0', 10);
      const m = parseInt(body.month || '0', 10);
      const records = body.records || [];

      if (y < 2000 || y > 2100 || m < 1 || m > 12) {
        return json_response(res, 400, { error: 'Bad Request', message: 'year, month không hợp lệ' });
      }
      const now = new Date();
      const maxMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      if (new Date(y, m - 1, 1) > maxMonth) {
        return json_response(res, 400, { error: 'Bad Request', message: 'Chỉ được tạo tối đa đến tháng sau so với hiện tại' });
      }
      if (!Array.isArray(records)) {
        return json_response(res, 400, { error: 'Bad Request', message: 'records phải là mảng' });
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
        return json_response(res, 409, { error: 'Conflict', message: 'Tháng này đã có bản ghi' });
      }

      const last_day = new Date(y, m, 0).getDate();
      const client = getNeonClient();
      const insertQueries = [];
      for (const r of records) {
        const day = parseInt(r.day || '0', 10);
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
      return json_response(res, 201, { created: insertQueries.length, year: y, month: m });
    }

    if (req.method === 'PUT') {
      const records = body.records || [];
      if (!Array.isArray(records)) {
        return json_response(res, 400, { error: 'Bad Request', message: 'records phải là mảng' });
      }
      const ids = [...new Set(records.map((r) => parseInt(r.id, 10)).filter((id) => id > 0))];
      if (ids.length === 0) {
        return json_response(res, 200, { updated: 0 });
      }

      const allowed = await sql`
        SELECT id FROM work_records WHERE user_id = ${user_id} AND id = ANY(${ids})
      `;
      const allowedSet = new Set(allowed.rows.map((r) => parseInt(r.id, 10)));

      const client = getNeonClient();
      const updateQueries = [];
      for (const r of records) {
        const id = parseInt(r.id, 10);
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
      return json_response(res, 200, { updated: updateQueries.length });
    }
  } catch (err) {
    if (err.status) return json_response(res, err.status, err.body);
    console.error(err);
    json_response(res, 500, { error: 'Internal Server Error' });
  }
}
