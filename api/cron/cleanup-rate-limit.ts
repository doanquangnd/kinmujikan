/**
 * GET /api/cron/cleanup-rate-limit
 * Cron job: dọn dẹp bảng rate_limit, xoá các row đã hết hạn.
 * Vercel gửi CRON_SECRET trong header Authorization: Bearer <secret>.
 */
import { cleanup_rate_limit } from '../../lib/rateLimit.js';

interface CronRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
}

interface CronResponse {
  setHeader(name: string, value: string | number): void;
  status(code: number): { json(data: unknown): void; end(): void };
}

export default async function handler(req: CronRequest, res: CronResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.status(405).end();
    return;
  }

  const secret = process.env.CRON_SECRET;
  const auth = req.headers?.authorization;
  const token = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : '';

  if (!secret || secret.length < 16) {
    console.error('[cron] CRON_SECRET chưa cấu hình hoặc quá ngắn');
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: 'Cron not configured' });
    return;
  }

  if (token !== secret) {
    res.setHeader('Content-Type', 'application/json');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { deleted } = await cleanup_rate_limit();
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ ok: true, deleted });
}
