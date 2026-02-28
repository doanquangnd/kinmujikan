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

  const res = await fetch(url, { ...options, headers });
  const contentType = res.headers.get('Content-Type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : {};

  if (!res.ok) {
    const message = data.message || data.error || (res.status === 500 ? 'Lỗi máy chủ (500). Kiểm tra backend đang chạy và log backend/storage/logs/error.log.' : 'Request failed');
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
