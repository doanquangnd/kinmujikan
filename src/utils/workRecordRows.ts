import { getDaysInMonth, getDayOfWeek, formatDate } from './dateHelpers';
import { getWeekdayLabel } from '@/constants/weekdays';
import { getHolidaysForYear } from '@/constants/japaneseHolidays';
import type { WorkRecord, WorkRecordRow } from '@/types';

export interface DefaultsInput {
  timeStart?: string | null;
  timeEnd?: string | null;
  breakMinutes?: number | null;
}

export function buildEmptyRows(
  year: number,
  month: number,
  defaults?: DefaultsInput | null
): WorkRecordRow[] {
  const days = getDaysInMonth(year, month);
  const holidays = getHolidaysForYear(year);
  const rows: WorkRecordRow[] = [];
  for (let day = 1; day <= days; day++) {
    const dow = getDayOfWeek(year, month, day);
    const holidayName = holidays.get(`${month}-${day}`) || null;
    const isWeekend = dow === 0 || dow === 6;
    const autoFill =
      defaults && !isWeekend && !holidayName
        ? {
            time_start: defaults.timeStart ?? null,
            time_end: defaults.timeEnd ?? null,
            break_minutes: defaults.breakMinutes ?? null,
          }
        : {};
    rows.push({
      day,
      weekday: getWeekdayLabel(dow),
      weekdayIndex: dow,
      holidayName,
      work_date: formatDate(year, month, day),
      id: null,
      time_start: autoFill.time_start ?? null,
      time_end: autoFill.time_end ?? null,
      break_minutes: autoFill.break_minutes ?? null,
      note: holidayName ?? null,
      rest_day: false,
    });
  }
  return rows;
}

export function mergeRecordsIntoRows(
  rows: WorkRecordRow[],
  records: WorkRecord[]
): WorkRecordRow[] {
  const byDate: Record<string, WorkRecord> = {};
  records.forEach((r) => {
    byDate[r.work_date] = r;
  });
  return rows.map((row) => {
    const rec = byDate[row.work_date];
    if (!rec) return row;
    const isWeekendOrHoliday =
      row.weekdayIndex === 0 || row.weekdayIndex === 6 || row.holidayName;
    const rest_day = isWeekendOrHoliday ? true : Boolean(rec.rest_day);
    return {
      ...row,
      id: rec.id,
      time_start: rec.time_start ?? null,
      time_end: rec.time_end ?? null,
      break_minutes: rec.break_minutes ?? null,
      note: rec.note ?? row.note ?? null,
      rest_day,
    };
  });
}
