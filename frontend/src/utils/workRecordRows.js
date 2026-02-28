import { getDaysInMonth, getDayOfWeek, formatDate } from './dateHelpers.js';
import { getWeekdayLabel } from '../constants/weekdays.js';
import { getHolidaysForYear } from '../constants/japaneseHolidays.js';

export function buildEmptyRows(year, month, defaults) {
  const days = getDaysInMonth(year, month);
  const holidays = getHolidaysForYear(year);
  const rows = [];
  for (let day = 1; day <= days; day++) {
    const dow = getDayOfWeek(year, month, day);
    const holidayName = holidays.get(`${month}-${day}`) || null;
    const isWeekend = dow === 0 || dow === 6;
    const autoFill = defaults && !isWeekend && !holidayName
      ? { time_start: defaults.timeStart, time_end: defaults.timeEnd, break_minutes: defaults.breakMinutes }
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

export function mergeRecordsIntoRows(rows, records) {
  const byDate = {};
  records.forEach((r) => { byDate[r.work_date] = r; });
  return rows.map((row) => {
    const rec = byDate[row.work_date];
    if (!rec) return row;
    const isWeekendOrHoliday = row.weekdayIndex === 0 || row.weekdayIndex === 6 || row.holidayName;
    const rest_day = isWeekendOrHoliday ? true : (rec.rest_day === true || rec.rest_day === 1);
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
