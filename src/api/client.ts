/**
 * API client: dùng HttpOnly Cookie (credentials: 'include').
 * Token được lưu trong cookie, không dùng localStorage.
 */
import i18n from '@/i18n';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface ApiError extends Error {
  status?: number;
  data?: Record<string, unknown>;
}

export async function api_request<T = Record<string, unknown>>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : API_BASE + path;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers, credentials: 'include' });
  } catch (e) {
    const err = e as Error & { cause?: { code?: string } };
    const msg =
      err.message?.includes('fetch') ||
      err.message?.includes('Failed') ||
      err.cause?.code === 'ECONNREFUSED'
        ? i18n.t('api.connectionError')
        : err.message;
    const apiErr: ApiError = new Error(msg) as ApiError;
    apiErr.status = 0;
    apiErr.data = {};
    throw apiErr;
  }

  const contentType = res.headers.get('Content-Type') || '';
  const isJson = contentType.includes('application/json');
  const data = (isJson ? await res.json().catch(() => ({})) : {}) as Record<
    string,
    unknown
  >;

  if (!res.ok) {
    const message =
      (data.message as string) ||
      (data.error as string) ||
      (res.status === 500 ? i18n.t('api.serverError') : 'Request failed');
    const apiErr: ApiError = new Error(message) as ApiError;
    apiErr.status = res.status;
    apiErr.data = data;
    throw apiErr;
  }
  return data as T;
}
