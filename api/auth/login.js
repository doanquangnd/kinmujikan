/**
 * POST /api/auth/login
 * Body: email, password
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

  const rate = await check_rate_limit(req, 'login');
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

    if (!email || !password) {
      return json_response(res, 422, { error: 'Validation failed', message: 'Email và mật khẩu là bắt buộc' });
    }

    const result = await sql`
      SELECT id, email, password_hash, display_name FROM users WHERE email = ${email}
    `;
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return json_response(res, 401, { error: 'Unauthorized', message: 'Email hoặc mật khẩu không đúng' });
    }

    delete user.password_hash;
    user.id = parseInt(user.id, 10);

    const token = jwt_encode({ sub: String(user.id) });
    json_response(res, 200, { token, user });
  } catch (err) {
    console.error(err);
    json_response(res, 500, { error: 'Internal Server Error' });
  }
}
