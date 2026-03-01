/**
 * POST /api/auth/change-password
 * Body: current_password, new_password
 */
import { sql } from '../../lib/db.js';
import bcrypt from 'bcryptjs';
import { require_auth } from '../../lib/auth.js';
import { json_response } from '../../lib/response.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return json_response(res, 405, { error: 'Method Not Allowed' });
  }

  let user_id;
  try {
    user_id = require_auth(req);
  } catch (e) {
    return json_response(res, e.status || 401, e.body || { error: 'Unauthorized' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const current = body.current_password || '';
    const new_pass = body.new_password || '';

    if (!current || !new_pass) {
      return json_response(res, 422, { error: 'Validation failed', message: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc' });
    }
    if (new_pass.length < 6) {
      return json_response(res, 422, { error: 'Validation failed', message: 'Mật khẩu mới tối thiểu 6 ký tự' });
    }

    const result = await sql`SELECT password_hash FROM users WHERE id = ${user_id}`;
    const row = result.rows[0];
    if (!row || !(await bcrypt.compare(current, row.password_hash))) {
      return json_response(res, 401, { error: 'Unauthorized', message: 'Mật khẩu hiện tại không đúng' });
    }

    const hash = await bcrypt.hash(new_pass, 10);
    await sql`UPDATE users SET password_hash = ${hash}, updated_at = NOW() WHERE id = ${user_id}`;
    json_response(res, 200, { message: 'Đã đổi mật khẩu' });
  } catch (err) {
    if (err.status) return json_response(res, err.status, err.body);
    console.error(err);
    json_response(res, 500, { error: 'Internal Server Error' });
  }
}
