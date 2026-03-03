/**
 * POST /api/auth/logout
 * Xóa HttpOnly cookie. Chỉ set cookie xóa khi có token hợp lệ.
 */
import { json_response, get_cors_origin } from '../../lib/response.js';
import { build_clear_auth_cookie } from '../../lib/cookie.js';
import { get_user_id_from_request } from '../../lib/auth.js';

interface LogoutRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
}

interface LogoutResponse {
  setHeader(name: string, value: string | number): void;
  status(code: number): { json(data: unknown): void; end(): void };
}

export default async function handler(req: LogoutRequest, res: LogoutResponse): Promise<void> {
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

  const user_id = get_user_id_from_request(req);
  const setCookie = user_id != null ? build_clear_auth_cookie() : undefined;
  json_response(res, 200, { ok: true }, { req, setCookie });
}
