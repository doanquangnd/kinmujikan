import { api_request } from './client';
import type { User } from '@/types';

interface LoginRegisterResponse {
  user: User;
}

export async function register(
  email: string,
  password: string,
  display_name: string = '',
  turnstile_response: string = ''
): Promise<User> {
  const data = await api_request<LoginRegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      display_name,
      turnstile_response,
    }),
  });
  return data.user;
}

export async function login(
  email: string,
  password: string,
  turnstile_response: string = ''
): Promise<User> {
  const data = await api_request<LoginRegisterResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      turnstile_response,
    }),
  });
  return data.user;
}

export async function fetchMe(): Promise<User> {
  const data = await api_request<{ user: User }>('/api/auth/me');
  return data.user;
}

export async function changePassword(
  current_password: string,
  new_password: string
): Promise<Record<string, unknown>> {
  return api_request('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password, new_password }),
  });
}

export async function logout(): Promise<void> {
  await api_request('/api/auth/logout', { method: 'POST' });
}
