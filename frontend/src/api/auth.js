import { api_request, set_token } from './client.js';

export async function register(email, password, display_name = '', turnstile_response = '') {
  const data = await api_request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, display_name, turnstile_response }),
  });
  set_token(data.token);
  return data.user;
}

export async function login(email, password, turnstile_response = '') {
  const data = await api_request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, turnstile_response }),
  });
  set_token(data.token);
  return data.user;
}

export async function fetchMe() {
  const data = await api_request('/api/auth/me');
  return data.user;
}

export async function changePassword(current_password, new_password) {
  const data = await api_request('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password, new_password }),
  });
  return data;
}

export function logout() {
  set_token(null);
}
