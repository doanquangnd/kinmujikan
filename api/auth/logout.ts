/**
 * POST /api/auth/logout
 * Xóa HttpOnly cookie (client gọi với credentials để cookie được gửi).
 */
import { json_response, get_cors_origin } from '../../lib/response';
import { build_clear_auth_cookie } from '../../lib/cookie';

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

  json_response(res, 200, { ok: true }, { req, setCookie: build_clear_auth_cookie() });
}
