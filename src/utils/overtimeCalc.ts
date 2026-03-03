/**
 * Tính 実働, 時間外, 深夜, 遅刻, 早退 dựa trên 就業時間 (scheduled_start, scheduled_end).
 * 深夜: từ 22:00 trở đi.
 * Chỉ tính khi 区分 = 出勤 và có time_start, time_end.
 */

import { timeToMinutes } from './formatTime';

const MIDNIGHT_END = 5 * 60; // 05:00 = 300 phút
const LATE_NIGHT_START = 22 * 60; // 22:00 = 1320 phút
const MINUTES_PER_DAY = 24 * 60;

function toM(t: string | null | undefined): number | null {
  if (!t) return null;
  return timeToMinutes(t);
}

/**
 * Chuyển phút sang giờ (số thập phân, 1 chữ số, ví dụ 0.5 = 30 phút).
 */
export function minutesToHours(m: number): number {
  return Math.round((m / 60) * 10) / 10;
}

export interface OvertimeResult {
  jitsukadou_minutes: number;
  jikangai_hours: number;
  shinya_hours: number;
  chikoku_hours: number;
  soutai_hours: number;
}

/**
 * Tính phút làm việc thực tế (実働): (退勤 - 出勤) - 休憩
 */
export function calcJitsukadouMinutes(
  time_start: string | null | undefined,
  time_end: string | null | undefined,
  break_minutes: number | null | undefined
): number {
  const start = toM(time_start);
  const end = toM(time_end);
  if (start == null || end == null) return 0;
  const breakM = Number(break_minutes) || 0;
  return Math.max(0, Math.round(end - start - breakM));
}

/**
 * Tính 遅刻 (đi muộn): max(0, 出勤 - 就業開始) khi 区分 = 出勤
 */
export function calcChikokuHours(
  time_start: string | null | undefined,
  scheduled_start: string | null | undefined
): number {
  const start = toM(time_start);
  const sched = toM(scheduled_start);
  if (start == null || sched == null) return 0;
  const diff = start - sched;
  return diff > 0 ? minutesToHours(diff) : 0;
}

/**
 * Tính 早退 (về sớm): max(0, 就業終了 - 退勤) khi 区分 = 出勤
 */
export function calcSoutaiHours(
  time_end: string | null | undefined,
  scheduled_end: string | null | undefined
): number {
  const end = toM(time_end);
  const sched = toM(scheduled_end);
  if (end == null || sched == null) return 0;
  const diff = sched - end;
  return diff > 0 ? minutesToHours(diff) : 0;
}

/**
 * Tính 時間外 (tăng ca): toàn bộ phần vượt 就業終了 (end - scheduled_end).
 * Ví dụ: 就業 9-18, thực tế 9:30-23:00 => 時間外 = 5h.
 */
export function calcJikangaiHours(
  time_start: string | null | undefined,
  time_end: string | null | undefined,
  _scheduled_start: string | null | undefined,
  scheduled_end: string | null | undefined
): number {
  const start = toM(time_start);
  const end = toM(time_end);
  const schedEnd = toM(scheduled_end);
  if (start == null || end == null || schedEnd == null) return 0;
  if (end <= schedEnd) return 0;
  const overtimeStart = Math.max(schedEnd, start);
  const minutes = Math.max(0, end - overtimeStart);
  return minutesToHours(minutes);
}

/**
 * Tính 深夜 (ca đêm): phần từ 22:00 trở đi.
 */
export function calcShinyaHours(
  time_start: string | null | undefined,
  time_end: string | null | undefined
): number {
  const start = toM(time_start);
  const end = toM(time_end);
  if (start == null || end == null) return 0;
  if (end <= LATE_NIGHT_START) return 0;
  const shinyaStart = Math.max(start, LATE_NIGHT_START);
  const shinyaEnd = end;
  const minutes = Math.max(0, shinyaEnd - shinyaStart);
  return minutesToHours(minutes);
}

/**
 * Tính tất cả cho một dòng (chỉ khi 区分 = 出勤, có time_start và time_end).
 */
export function calcOvertimeForRow(
  time_start: string | null | undefined,
  time_end: string | null | undefined,
  break_minutes: number | null | undefined,
  scheduled_start: string | null | undefined,
  scheduled_end: string | null | undefined,
  category: string
): OvertimeResult {
  const isShutkin = category === 'shutkin';
  const hasTimes = time_start && time_end;

  if (!isShutkin || !hasTimes) {
    return {
      jitsukadou_minutes: 0,
      jikangai_hours: 0,
      shinya_hours: 0,
      chikoku_hours: 0,
      soutai_hours: 0,
    };
  }

  const schedStart = scheduled_start || '09:30';
  const schedEnd = scheduled_end || '18:30';

  return {
    jitsukadou_minutes: calcJitsukadouMinutes(time_start, time_end, break_minutes),
    jikangai_hours: calcJikangaiHours(time_start, time_end, schedStart, schedEnd),
    shinya_hours: calcShinyaHours(time_start, time_end),
    chikoku_hours: calcChikokuHours(time_start, schedStart),
    soutai_hours: calcSoutaiHours(time_end, schedEnd),
  };
}

/**
 * Format giờ để hiển thị theo mức 15 phút: 0:15, 0:30, 1:00, 1:45, ...
 * Để trống nếu = 0.
 */
export function formatOvertimeHours(hours: number): string {
  if (hours <= 0) return '';
  const totalMinutes = Math.round(hours * 60);
  const roundedMinutes = Math.round(totalMinutes / 15) * 15;
  if (roundedMinutes === 0) return '';
  const h = Math.floor(roundedMinutes / 60);
  const m = roundedMinutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}
