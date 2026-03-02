/**
 * Thứ trong tuần (0 = 日, 1 = 月, ... 6 = 土)
 */
export const WEEKDAY_LABELS: readonly string[] = ['日', '月', '火', '水', '木', '金', '土'];

export function getWeekdayLabel(dayOfWeek: number): string {
  return WEEKDAY_LABELS[dayOfWeek] ?? '';
}
