/**
 * Ngày lễ Nhật Bản: đọc từ japan_holidays.json (có thể chỉnh tay hoặc sinh từ CSV bằng npm run generate-holidays).
 * Tra cứu nhanh theo năm, trả Map key "month-day" -> tên ngày lễ.
 */

import holidaysByYear from './japan_holidays.json';

/** [month, day, name] */
type HolidayEntry = [number, number, string];

/** Record<year, HolidayEntry[]> */
type HolidaysData = Record<string, HolidayEntry[]>;

/**
 * Trả Map key "month-day" -> tên ngày lễ cho một năm.
 * Dữ liệu: 1949-2050, đầy đủ 春分の日/秋分の日 theo năm, 振替休日, 国民の休日, v.v.
 */
export function getHolidaysForYear(year: number): Map<string, string> {
  const list = (holidaysByYear as unknown as HolidaysData)[String(year)];
  if (!list || !Array.isArray(list)) return new Map();
  const map = new Map<string, string>();
  for (const [month, day, name] of list) {
    map.set(`${month}-${day}`, name);
  }
  return map;
}
