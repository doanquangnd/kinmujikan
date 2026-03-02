/**
 * Rate limit dùng PostgreSQL (Neon).
 * Giới hạn số request theo IP + endpoint trong cửa sổ thời gian cố định (1 phút).
 */
import { sql } from './db';

const WINDOW_SECONDS = 60;
const LIMITS: Record<string, number> = {
  login: 5,
  register: 3,
};

interface RateLimitRequest {
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}

/**
 * Lấy IP từ request (Vercel/proxy).
 */
export function get_client_ip(req: RateLimitRequest): string {
  const forwarded = req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'];
  if (forwarded) {
    const first = typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0];
    return (first || '').trim() || 'unknown';
  }
  return req.socket?.remoteAddress || 'unknown';
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

/**
 * Kiểm tra và tăng bộ đếm. Trả về { allowed: boolean, retryAfter?: number }.
 * Nếu allowed=false, gọi API nên trả 429.
 */
export async function check_rate_limit(req: RateLimitRequest, endpoint: string): Promise<RateLimitResult> {
  const limit = LIMITS[endpoint];
  if (!limit) return { allowed: true };

  const ip = get_client_ip(req);
  const key = `rate:${endpoint}:${ip}`;
  const now = new Date();
  const window_expires = new Date(now.getTime() + WINDOW_SECONDS * 1000);

  try {
    const existing = await sql`
      SELECT request_count, window_expires_at
      FROM rate_limit
      WHERE identifier = ${key}
    `;
    const row = existing.rows[0] as { request_count: number; window_expires_at: Date } | undefined;
    const expired = !row || new Date(row.window_expires_at) < now;
    const current_count = expired ? 0 : parseInt(String(row.request_count), 10) || 0;
    const new_count = current_count + 1;

    if (new_count > limit) {
      const retryAfter = row
        ? Math.ceil((new Date(row.window_expires_at).getTime() - now.getTime()) / 1000)
        : WINDOW_SECONDS;
      return { allowed: false, retryAfter: Math.max(1, retryAfter) };
    }

    if (expired || !row) {
      await sql`
        INSERT INTO rate_limit (identifier, request_count, window_expires_at)
        VALUES (${key}, 1, ${window_expires})
        ON CONFLICT (identifier) DO UPDATE SET
          request_count = 1,
          window_expires_at = ${window_expires}
      `;
    } else {
      await sql`
        UPDATE rate_limit
        SET request_count = request_count + 1
        WHERE identifier = ${key}
      `;
    }

    return { allowed: true };
  } catch (err) {
    console.error('[rateLimit]', err);
    return { allowed: true };
  }
}

/**
 * Xoá các row rate_limit đã hết hạn (window_expires_at < now - 1 giờ).
 * Gọi định kỳ qua cron để tránh bảng phình to.
 */
export async function cleanup_rate_limit(): Promise<{ deleted: number }> {
  try {
    const result = await sql`
      WITH deleted AS (
        DELETE FROM rate_limit
        WHERE window_expires_at < now() - interval '1 hour'
        RETURNING 1
      )
      SELECT count(*)::int AS cnt FROM deleted
    `;
    const deleted = (result.rows[0] as { cnt: number } | undefined)?.cnt ?? 0;
    if (deleted > 0) {
      console.log('[rateLimit] cleanup deleted', deleted, 'rows');
    }
    return { deleted };
  } catch (err) {
    console.error('[rateLimit] cleanup failed', err);
    return { deleted: 0 };
  }
}
