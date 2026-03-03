import { getDaysInMonth, getDayOfWeek, formatDate } from './dateHelpers';
import { getWeekdayLabel } from '@/constants/weekdays';
import { getHolidaysForYear } from '@/constants/japaneseHolidays';
import type { WorkRecord, WorkRecordRow, WorkCategory } from '@/types';

const DEFAULT_CATEGORY: WorkCategory = 'shutkin';

const JA_TO_ROMAJI: Record<string, WorkCategory> = {
  出勤: 'shutkin',
  有給: 'yukyu',
  代休: 'daikyu',
  特休: 'tokkyu',
  欠勤: 'kekkin',
  休日: 'kyuujitsu',
};

function normalizeCategory(
  cat: string | null | undefined,
  isWeekendOrHoliday: boolean
): WorkCategory | '' {
  if (!cat || cat === '') return isWeekendOrHoliday ? 'kyuujitsu' : DEFAULT_CATEGORY;
  const romaji = JA_TO_ROMAJI[cat];
  if (romaji) return romaji;
  const valid: WorkCategory[] = ['shutkin', 'yukyu', 'daikyu', 'tokkyu', 'kekkin', 'kyuujitsu'];
  return valid.includes(cat as WorkCategory) ? (cat as WorkCategory) : (isWeekendOrHoliday ? 'kyuujitsu' : DEFAULT_CATEGORY);
}

export interface DefaultsInput {
  timeStart?: string | null;
  timeEnd?: string | null;
  breakMinutes?: number | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
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
    const isWeekendOrHoliday = isWeekend || !!holidayName;
    const autoFill =
      defaults && !isWeekendOrHoliday
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
      scheduled_start: defaults?.scheduledStart ?? null,
      scheduled_end: defaults?.scheduledEnd ?? null,
      category: isWeekendOrHoliday ? 'kyuujitsu' : DEFAULT_CATEGORY,
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
    return {
      ...row,
      id: rec.id,
      time_start: rec.time_start ?? null,
      time_end: rec.time_end ?? null,
      break_minutes: rec.break_minutes ?? null,
      note: rec.note ?? row.note ?? null,
      scheduled_start: rec.scheduled_start ?? row.scheduled_start ?? null,
      scheduled_end: rec.scheduled_end ?? row.scheduled_end ?? null,
      category: normalizeCategory(rec.category ?? row.category, isWeekendOrHoliday),
    };
  });
}
