/**
 * Helper thiết lập HttpOnly Secure Cookie cho JWT.
 */
import { COOKIE_NAME } from './auth';

const MAX_AGE_DAYS = 7;
const MAX_AGE_SECONDS = MAX_AGE_DAYS * 24 * 60 * 60;

/** Tạo chuỗi Set-Cookie cho token (HttpOnly, Secure khi production, SameSite=Strict) */
export function build_auth_cookie(token: string): string {
  const is_secure =
    typeof process !== 'undefined' &&
    (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production');
  const parts = [
    `${COOKIE_NAME}=${token}`,
    `Path=/`,
    `Max-Age=${MAX_AGE_SECONDS}`,
    `SameSite=Strict`,
    ...(is_secure ? ['Secure'] : []),
    'HttpOnly',
  ];
  return parts.join('; ');
}

/** Tạo chuỗi Set-Cookie để xóa cookie (logout) */
export function build_clear_auth_cookie(): string {
  const parts = [
    `${COOKIE_NAME}=`,
    `Path=/`,
    `Max-Age=0`,
    `SameSite=Strict`,
    'HttpOnly',
  ];
  return parts.join('; ');
}
