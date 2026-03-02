/**
 * POST /api/auth/change-password
 * Body: current_password, new_password
 */
import { sql } from '../../lib/db.js';
import bcrypt from 'bcryptjs';
import { require_auth } from '../../lib/auth.js';
import { json_response, get_cors_origin } from '../../lib/response.js';
import { changePasswordSchema } from '../../lib/validation.js';

interface AuthRequest {
  method?: string;
  body?: string | Record<string, unknown>;
  headers?: Record<string, string | string[] | undefined>;
}

interface AuthResponse {
  setHeader(name: string, value: string | number): void;
  status(code: number): { json(data: unknown): void; end(): void };
}

interface AuthError {
  status?: number;
  body?: Record<string, unknown>;
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

  let user_id: number;
  try {
    user_id = require_auth(req);
  } catch (e) {
    const err = e as AuthError;
    json_response(res, err.status || 401, err.body || { error: 'Unauthorized' }, { req });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ';
      json_response(res, 422, { error: 'Validation failed', message: msg }, { req });
      return;
    }
    const { current_password: current, new_password: new_pass } = parsed.data;

    const result = await sql`SELECT password_hash FROM users WHERE id = ${user_id}`;
    const row = result.rows[0] as { password_hash: string } | undefined;
    if (!row || !(await bcrypt.compare(current, row.password_hash))) {
      json_response(res, 401, { error: 'Unauthorized', message: 'Mật khẩu hiện tại không đúng' }, { req });
      return;
    }

    const hash = await bcrypt.hash(new_pass, 10);
    await sql`UPDATE users SET password_hash = ${hash}, updated_at = NOW() WHERE id = ${user_id}`;
    json_response(res, 200, { message: 'Đã đổi mật khẩu' }, { req });
  } catch (err) {
    const authErr = err as AuthError;
    if (authErr.status) json_response(res, authErr.status, authErr.body || {}, { req });
    else {
      console.error(err);
      json_response(res, 500, { error: 'Internal Server Error' }, { req });
    }
  }
}
