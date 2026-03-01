/**
 * JWT và xác thực user từ header Authorization.
 */
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRES = '7d';

export function jwt_encode(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function jwt_decode(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
}

export function get_user_id_from_request(req) {
  const auth = req.headers?.authorization || '';
  const m = auth.match(/Bearer\s+(\S+)/);
  if (!m) return null;
  const payload = jwt_decode(m[1].trim());
  if (!payload?.sub) return null;
  return parseInt(payload.sub, 10);
}

export function require_auth(req) {
  const user_id = get_user_id_from_request(req);
  if (!user_id) {
    throw { status: 401, body: { error: 'Unauthorized', message: 'Token không hợp lệ hoặc hết hạn' } };
  }
  return user_id;
}
