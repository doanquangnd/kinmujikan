/**
 * GET /api/auth/me
 */
import { sql } from '../../lib/db.js';
import { get_user_id_from_request } from '../../lib/auth.js';
import { json_response } from '../../lib/response.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    return json_response(res, 405, { error: 'Method Not Allowed' });
  }

  const user_id = get_user_id_from_request(req);
  if (!user_id) {
    return json_response(res, 401, { error: 'Unauthorized' });
  }

  try {
    const result = await sql`
      SELECT id, email, display_name, created_at FROM users WHERE id = ${user_id}
    `;
    const user = result.rows[0];
    if (!user) {
      return json_response(res, 401, { error: 'Unauthorized' });
    }
    user.id = parseInt(user.id, 10);
    json_response(res, 200, { user });
  } catch (err) {
    console.error(err);
    json_response(res, 500, { error: 'Internal Server Error' });
  }
}
