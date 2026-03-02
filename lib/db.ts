/**
 * Kết nối Neon Postgres (tương thích Vercel Postgres).
 * Env: POSTGRES_URL hoặc DATABASE_URL (tự động khi thêm Postgres/Neon vào Vercel).
 */
import { neon } from '@neondatabase/serverless';

let _conn: ReturnType<typeof neon> | null = null;

function get_conn(): ReturnType<typeof neon> {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) throw new Error('Chưa cấu hình POSTGRES_URL hoặc DATABASE_URL');
  if (!_conn) _conn = neon(url);
  return _conn;
}

/**
 * Client gốc Neon (có .transaction) cho batch operations.
 */
export function getNeonClient(): ReturnType<typeof neon> {
  return get_conn();
}

/**
 * Thực thi query, trả về { rows, rowCount } tương thích với @vercel/postgres.
 */
export const sql = (strings: TemplateStringsArray, ...values: unknown[]) => {
  return get_conn()(strings, ...values).then((r: unknown) => {
    const rows = Array.isArray(r) ? r : r != null ? [r] : [];
    return { rows, rowCount: rows.length };
  });
};
