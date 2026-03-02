/**
 * GET /api - Healthcheck
 */
import { json_response, get_cors_origin } from '../lib/response.js';

interface ApiRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  setHeader(name: string, value: string | number): void;
  status(code: number): { json(data: unknown): void; end(): void };
}

export default function handler(req: ApiRequest, res: ApiResponse): void {
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
  json_response(res, 200, { status: 'ok' }, { req });
}
