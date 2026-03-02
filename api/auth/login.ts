/**
 * POST /api/auth/login
 * Body: email, password, turnstile_response?
 */
import { sql } from '../../lib/db.js';
import bcrypt from 'bcryptjs';
import { jwt_encode } from '../../lib/auth.js';
import { json_response, get_cors_origin } from '../../lib/response.js';
import { build_auth_cookie } from '../../lib/cookie.js';
import { check_rate_limit } from '../../lib/rateLimit.js';
import { verify_turnstile } from '../../lib/turnstile.js';
import { loginSchema } from '../../lib/validation.js';

interface AuthRequest {
  method?: string;
  body?: string | Record<string, unknown>;
  headers?: Record<string, string | string[] | undefined>;
  url?: string;
  socket?: { remoteAddress?: string };
}

interface AuthResponse {
  setHeader(name: string, value: string | number): void;
  status(code: number): { json(data: unknown): void; end(): void };
}

export default async function handler(req: AuthRequest, res: AuthResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', get_cors_origin(req));
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    json_response(res, 405, { error: 'Method Not Allowed' }, { req });
    return;
  }

  const rate = await check_rate_limit(req, 'login');
  if (!rate.allowed) {
    res.setHeader('Retry-After', String(rate.retryAfter));
    json_response(res, 429, {
      error: 'Too Many Requests',
      message: `Quá nhiều lần thử. Thử lại sau ${rate.retryAfter} giây.`,
    }, { req });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ';
      json_response(res, 422, { error: 'Validation failed', message: msg }, { req });
      return;
    }
    const { email, password, turnstile_response = '' } = parsed.data;

    const turnstile_ok = await verify_turnstile(turnstile_response.trim(), req);
    if (!turnstile_ok) {
      json_response(res, 422, { error: 'Validation failed', message: 'Xác thực Turnstile thất bại. Vui lòng thử lại.' }, { req });
      return;
    }

    const result = await sql`
      SELECT id, email, password_hash, display_name FROM users WHERE email = ${email}
    `;
    const user = result.rows[0] as { id: number; email: string; password_hash: string; display_name?: string } | undefined;

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      json_response(res, 401, { error: 'Unauthorized', message: 'Email hoặc mật khẩu không đúng' }, { req });
      return;
    }

    const { password_hash: _, ...userWithoutPassword } = user;
    const userOut = { ...userWithoutPassword, id: parseInt(String(user.id), 10) };

    const token = jwt_encode({ sub: String(userOut.id) });
    json_response(res, 200, { user: userOut }, { req, setCookie: build_auth_cookie(token) });
  } catch (err) {
    console.error(err);
    json_response(res, 500, { error: 'Internal Server Error' }, { req });
  }
}
