/**
 * POST /api/auth/register
 * Body: email, password, display_name?
 */
import { sql } from '../../lib/db.js';
import bcrypt from 'bcryptjs';
import { jwt_encode } from '../../lib/auth.js';
import { json_response } from '../../lib/response.js';
import { check_rate_limit } from '../../lib/rateLimit.js';

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

  const rate = await check_rate_limit(req, 'register');
  if (!rate.allowed) {
    res.setHeader('Retry-After', String(rate.retryAfter));
    return json_response(res, 429, {
      error: 'Too Many Requests',
      message: `Quá nhiều lần thử. Thử lại sau ${rate.retryAfter} giây.`,
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const email = (body.email || '').trim();
    const password = body.password || '';
    const display_name = body.display_name != null ? String(body.display_name).trim() : null;
    const display_name_val = display_name === '' ? null : display_name;

    const errors = [];
    if (!email) errors.push('email là bắt buộc');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('email không hợp lệ');
    if (password.length < 6) errors.push('mật khẩu tối thiểu 6 ký tự');

    if (errors.length > 0) {
      return json_response(res, 422, { error: 'Validation failed', errors });
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.rows.length > 0) {
      return json_response(res, 409, { error: 'Conflict', message: 'Email đã được sử dụng' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await sql`
      INSERT INTO users (email, password_hash, display_name)
      VALUES (${email}, ${password_hash}, ${display_name_val})
      RETURNING id, email, display_name, created_at
    `;
    const user = result.rows[0];
    user.id = parseInt(user.id, 10);

    const token = jwt_encode({ sub: String(user.id) });
    json_response(res, 201, { token, user });
  } catch (err) {
    console.error(err);
    json_response(res, 500, { error: 'Internal Server Error' });
  }
}
