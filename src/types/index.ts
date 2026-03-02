/**
 * Shared types cho ứng dụng Kinmu Jikan.
 */

export interface WorkRecord {
  id: number;
  work_date: string;
  time_start: string | null;
  time_end: string | null;
  break_minutes: number | null;
  note: string | null;
  /** API trả 0 | 1, frontend dùng boolean */
  rest_day: boolean | number;
}

export interface WorkRecordRow {
  day: number;
  weekday: string;
  weekdayIndex: number;
  holidayName: string | null;
  work_date: string;
  id: number | null;
  time_start: string | null;
  time_end: string | null;
  break_minutes: number | null;
  note: string | null;
  rest_day: boolean;
}

export interface User {
  id: number;
  email: string;
  display_name?: string | null;
}

export interface ApiError extends Error {
  status?: number;
  data?: Record<string, unknown>;
}

export interface VercelRequest {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: string | Record<string, unknown>;
  socket?: { remoteAddress?: string };
}

export interface VercelResponse {
  setHeader(name: string, value: string | number): void;
  status(code: number): { json(data: unknown): void };
  end(): void;
}
