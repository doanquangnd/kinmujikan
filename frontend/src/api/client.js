/**
 * API client: base URL và header Authorization từ token.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

function get_token() {
  return localStorage.getItem('kinmu_token');
}

export function set_token(token) {
  if (token) localStorage.setItem('kinmu_token', token);
  else localStorage.removeItem('kinmu_token');
}

export async function api_request(path, options = {}) {
  const url = path.startsWith('http') ? path : API_BASE + path;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const token = get_token();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (e) {
    const msg = (e.message?.includes('fetch') || e.message?.includes('Failed') || e.cause?.code === 'ECONNREFUSED')
      ? 'Không kết nối được backend. Kiểm tra backend đang chạy (PHP: port 8000, Node: vercel dev port 3000).'
      : e.message;
    const err = new Error(msg);
    err.status = 0;
    err.data = {};
    throw err;
  }

  const contentType = res.headers.get('Content-Type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : {};

  if (!res.ok) {
    const message = data.message || data.error || (res.status === 500 ? 'Lỗi máy chủ (500). Kiểm tra backend đang chạy.' : 'Request failed');
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
