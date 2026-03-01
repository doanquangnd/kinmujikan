/**
 * GET /api - Healthcheck
 */
import { json_response } from '../lib/response.js';

export default function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    return json_response(res, 405, { error: 'Method Not Allowed' });
  }
  json_response(res, 200, { status: 'ok' });
}
