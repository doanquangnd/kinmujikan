/**
 * JWT và xác thực user từ header Authorization hoặc Cookie.
 */
import jwt from 'jsonwebtoken';

const JWT_EXPIRES = '7d';

function get_jwt_secret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error('JWT_SECRET chưa được cấu hình. Thiết lập biến môi trường JWT_SECRET.');
  }
  return secret;
}

interface JwtPayload {
  sub?: string;
}

export function jwt_encode(payload: JwtPayload): string {
  return jwt.sign(payload, get_jwt_secret(), { expiresIn: JWT_EXPIRES });
}

export function jwt_decode(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, get_jwt_secret()) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

const COOKIE_NAME = 'kinmu_token';

/** Đọc token từ Cookie hoặc Authorization header */
function get_token_from_request(req: { headers?: Record<string, string | string[] | undefined> }): string | null {
  const cookie = req.headers?.cookie;
  if (cookie && typeof cookie === 'string') {
    const m = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    if (m) return m[1].trim();
  }
  const raw = req.headers?.authorization || '';
  const auth = typeof raw === 'string' ? raw : (Array.isArray(raw) ? raw[0] ?? '' : '');
  const m = auth.match(/Bearer\s+(\S+)/);
  return m ? m[1].trim() : null;
}

export function get_user_id_from_request(req: { headers?: Record<string, string | string[] | undefined> }): number | null {
  const token = get_token_from_request(req);
  if (!token) return null;
  const payload = jwt_decode(token);
  if (!payload?.sub) return null;
  return parseInt(payload.sub, 10);
}

export { COOKIE_NAME };

export function require_auth(req: { headers?: Record<string, string | string[] | undefined> }): number {
  const user_id = get_user_id_from_request(req);
  if (!user_id) {
    throw { status: 401, body: { error: 'Unauthorized', message: 'Token không hợp lệ hoặc hết hạn' } };
  }
  return user_id;
}
