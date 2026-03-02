/**
 * Helper trả JSON response.
 * CORS whitelist đọc từ env CORS_ALLOWED_ORIGINS (phân cách bằng dấu phẩy).
 * Ví dụ: CORS_ALLOWED_ORIGINS=https://kinmujikan.vercel.app,http://localhost:5173
 * - Local/dev: không set env thì dùng DEV_FALLBACK_ORIGINS
 * - Production: bắt buộc set CORS_ALLOWED_ORIGINS, thiếu thì throw
 */

const DEV_FALLBACK_ORIGINS = ['http://localhost:5173', 'http://localhost:3002', 'http://127.0.0.1:5173', 'http://127.0.0.1:3002'];

function is_production(): boolean {
  return (
    process.env.VERCEL_ENV === 'production' ||
    process.env.NODE_ENV === 'production'
  );
}

function get_allowed_origins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS;
  const list = raw && typeof raw === 'string'
    ? raw.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  if (list.length > 0) return list;

  if (is_production()) {
    throw new Error(
      'CORS_ALLOWED_ORIGINS chưa được cấu hình. Thiết lập biến môi trường CORS_ALLOWED_ORIGINS (ví dụ: https://kinmujikan.vercel.app).'
    );
  }

  return DEV_FALLBACK_ORIGINS;
}

export function get_cors_origin(req?: { headers?: Record<string, string | string[] | undefined> }): string {
  const allowed = get_allowed_origins();
  const fallback = allowed[0] || DEV_FALLBACK_ORIGINS[0];
  if (!req) return fallback;
  const origin = req.headers?.origin;
  const o = typeof origin === 'string' ? origin : (Array.isArray(origin) ? origin[0] : '');
  return o && allowed.includes(o) ? o : fallback;
}

export interface JsonResponse {
  setHeader(name: string, value: string | number): void;
  status(code: number): { json(data: unknown): void; end(): void };
}

export interface JsonResponseOptions {
  req?: { headers?: Record<string, string | string[] | undefined> };
  setCookie?: string;
}

export function json_response(
  res: JsonResponse,
  code: number,
  data: unknown,
  options: JsonResponseOptions = {}
): void {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const origin = get_cors_origin(options.req);
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (options.setCookie) {
    res.setHeader('Set-Cookie', options.setCookie);
  }
  res.status(code).json(data);
}
