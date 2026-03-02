/**
 * GET /api/auth/me
 */
import { sql } from '../../lib/db.js';
import { get_user_id_from_request } from '../../lib/auth.js';
import { json_response, get_cors_origin } from '../../lib/response.js';

interface AuthRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
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
  if (req.method !== 'GET') {
    json_response(res, 405, { error: 'Method Not Allowed' }, { req });
    return;
  }

  const user_id = get_user_id_from_request(req);
  if (!user_id) {
    json_response(res, 401, { error: 'Unauthorized' }, { req });
    return;
  }

  try {
    const result = await sql`
      SELECT id, email, display_name, created_at FROM users WHERE id = ${user_id}
    `;
    const user = result.rows[0] as { id: number; email: string; display_name?: string } | undefined;
    if (!user) {
      json_response(res, 401, { error: 'Unauthorized' }, { req });
      return;
    }
    user.id = parseInt(String(user.id), 10);
    json_response(res, 200, { user }, { req });
  } catch (err) {
    console.error(err);
    json_response(res, 500, { error: 'Internal Server Error' }, { req });
  }
}
