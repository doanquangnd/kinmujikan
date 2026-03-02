/**
 * POST /api/auth/register
 * Body: email, password, display_name?, turnstile_response?
 */
import { sql } from '../../lib/db';
import bcrypt from 'bcryptjs';
import { jwt_encode } from '../../lib/auth';
import { json_response, get_cors_origin } from '../../lib/response';
import { build_auth_cookie } from '../../lib/cookie';
import { check_rate_limit } from '../../lib/rateLimit';
import { verify_turnstile } from '../../lib/turnstile';
import { registerSchema } from '../../lib/validation';

interface AuthRequest {
  method?: string;
  body?: string | Record<string, unknown>;
  headers?: Record<string, string | string[] | undefined>;
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

  const rate = await check_rate_limit(req, 'register');
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
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((e: { message: string }) => e.message);
      json_response(res, 422, { error: 'Validation failed', errors }, { req });
      return;
    }
    const { email, password, display_name: dn, turnstile_response = '' } = parsed.data;
    const display_name_val = dn === '' || dn == null ? null : dn;

    const turnstile_ok = await verify_turnstile(turnstile_response.trim(), req);
    if (!turnstile_ok) {
      json_response(res, 422, { error: 'Validation failed', message: 'Xác thực Turnstile thất bại. Vui lòng thử lại.' }, { req });
      return;
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.rows.length > 0) {
      json_response(res, 409, { error: 'Conflict', message: 'Email đã được sử dụng' }, { req });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await sql`
      INSERT INTO users (email, password_hash, display_name)
      VALUES (${email}, ${password_hash}, ${display_name_val})
      RETURNING id, email, display_name, created_at
    `;
    const user = result.rows[0] as { id: number; email: string; display_name?: string };
    user.id = parseInt(String(user.id), 10);

    const token = jwt_encode({ sub: String(user.id) });
    json_response(res, 201, { user }, { req, setCookie: build_auth_cookie(token) });
  } catch (err) {
    console.error(err);
    json_response(res, 500, { error: 'Internal Server Error' }, { req });
  }
}
