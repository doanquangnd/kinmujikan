/**
 * Export dữ liệu 勤務時間 ra file Excel với đường kẻ, màu sắc ô và chữ.
 */

import { toHHmm, minutesToTimeString } from './formatTime';
import { calcOvertimeForRow, formatOvertimeHours } from './overtimeCalc';
import type { WorkRecordRow } from '@/types';
import dayjs from 'dayjs';

const BORDER_THIN = { style: 'thin' as const };
const BORDER_ALL = {
  top: BORDER_THIN,
  bottom: BORDER_THIN,
  left: BORDER_THIN,
  right: BORDER_THIN,
};

const CATEGORY_LABELS: Record<string, string> = {
  shutkin: '出勤',
  yukyu: '有給',
  daikyu: '代休',
  tokkyu: '特休',
  kekkin: '欠勤',
  kyuujitsu: '', // Thứ 7, CN, ngày lễ - hiển thị trống
  '': '',
};

export interface ExportExcelOptions {
  rows: WorkRecordRow[];
  year: number;
  month: number;
  scheduledStart: string;
  scheduledEnd: string;
  displayName?: string;
}

export async function exportToExcel(options: ExportExcelOptions): Promise<Blob> {
  const { rows, year, month, scheduledStart, scheduledEnd, displayName = '' } = options;
  const schedStart = scheduledStart || '09:00';
  const schedEnd = scheduledEnd || '18:00';

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`${year}年${month}月`, {
    views: [{ state: 'frozen', ySplit: 6 }],
  });

  const headers = ['日付', '曜', '休', '区分', '開始', '終了', '休憩(分)', '実働', '時間外', '深夜', '遅刻', '早退', '備考'];
  const toM = (t: string | null | undefined) => (t ? toHHmm(t) || t : '');

  sheet.addRow([]);
  const r2 = sheet.addRow([]);
  r2.height = 22;
  r2.getCell(1).value = `${year}年${month}月`;
  r2.getCell(6).value = '作業実績表';
  r2.getCell(13).value = `氏名:${displayName}`;
  r2.getCell(13).alignment = { horizontal: 'right', vertical: 'middle' };
  r2.font = { size: 16, bold: true };
  sheet.addRow([]);

  const r6 = sheet.addRow([]);
  r6.font = { size: 12, bold: true };
  r6.getCell(1).value = `就業時間 ：${schedStart} ～ ${schedEnd}`;

  const headerRow = sheet.addRow(headers);
  headerRow.height = 22;
  for (let col = 1; col <= 13; col++) {
    const cell = headerRow.getCell(col);
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDER_ALL;
  }

  rows.forEach((row, idx) => {
    const overtime = calcOvertimeForRow(
      row.time_start,
      row.time_end,
      row.break_minutes,
      schedStart,
      schedEnd,
      row.category
    );
    const rest = row.weekdayIndex === 0 || row.weekdayIndex === 6 || row.holidayName ? '休' : '';
    const categoryLabel = CATEGORY_LABELS[row.category] ?? row.category;
    const dataRow = [
      dayjs(row.work_date).format('D'),
      row.weekday,
      rest,
      categoryLabel,
      toM(row.time_start),
      toM(row.time_end),
      row.break_minutes ?? '',
      minutesToTimeString(overtime.jitsukadou_minutes),
      formatOvertimeHours(overtime.jikangai_hours) || '',
      formatOvertimeHours(overtime.shinya_hours) || '',
      formatOvertimeHours(overtime.chikoku_hours) || '',
      formatOvertimeHours(overtime.soutai_hours) || '',
      row.note ?? '',
    ];
    const excelRow = sheet.addRow(dataRow);
    excelRow.height = 20;

    const isWeekendOrHoliday = row.weekdayIndex === 0 || row.weekdayIndex === 6 || row.holidayName;
    const isRestDay = row.category !== 'shutkin';
    const isRestStyle = isWeekendOrHoliday || isRestDay;

    excelRow.eachCell((cell, colNumber) => {
      cell.border = BORDER_ALL;
      cell.alignment = { vertical: 'middle' };
      if (colNumber <= 3) cell.alignment = { ...cell.alignment, horizontal: 'center' };
      else if (colNumber <= 12) cell.alignment = { ...cell.alignment, horizontal: 'center' };
      else cell.alignment = { ...cell.alignment, horizontal: 'left' };

      if (isRestStyle) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
        cell.font = { color: { argb: 'FFB91C1C' }, size: 10 };
      } else {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        cell.font = { color: { argb: 'FF171717' }, size: 10 };
      }
    });
  });

  const kijunNissuu = rows.filter(
    (r) => r.weekdayIndex !== 0 && r.weekdayIndex !== 6 && !r.holidayName
  ).length;
  const jitsukadouNissuu = rows.filter(
    (r) => r.category === 'shutkin' && r.time_start && r.time_end
  ).length;
  const totalMinutes = rows.reduce((sum, row) => {
    const ot = calcOvertimeForRow(
      row.time_start,
      row.time_end,
      row.break_minutes,
      schedStart,
      schedEnd,
      row.category
    );
    return sum + ot.jitsukadou_minutes;
  }, 0);

  const summaryRow1 = sheet.addRow([]);
  summaryRow1.height = 20;
  const r1Num = summaryRow1.number;
  sheet.mergeCells(r1Num, 1, r1Num, 3);
  summaryRow1.getCell(1).value = '実稼動日数';
  summaryRow1.getCell(1).border = BORDER_ALL;
  summaryRow1.getCell(1).font = { size: 10, bold: true };
  summaryRow1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
  summaryRow1.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
  summaryRow1.getCell(4).value = jitsukadouNissuu;
  summaryRow1.getCell(4).border = BORDER_ALL;
  summaryRow1.getCell(4).font = { size: 10 };
  summaryRow1.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.mergeCells(r1Num, 5, r1Num, 7);
  summaryRow1.getCell(5).value = '合計';
  summaryRow1.getCell(5).border = BORDER_ALL;
  summaryRow1.getCell(5).font = { size: 10, bold: true };
  summaryRow1.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
  summaryRow1.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
  summaryRow1.getCell(8).value = minutesToTimeString(totalMinutes);
  summaryRow1.getCell(8).border = BORDER_ALL;
  summaryRow1.getCell(8).font = { size: 10 };
  summaryRow1.getCell(8).alignment = { vertical: 'middle', horizontal: 'center' };

  const summaryRow2 = sheet.addRow([]);
  summaryRow2.height = 20;
  const r2Num = summaryRow2.number;
  sheet.mergeCells(r2Num, 1, r2Num, 3);
  summaryRow2.getCell(1).value = '基準日数';
  summaryRow2.getCell(1).border = BORDER_ALL;
  summaryRow2.getCell(1).font = { size: 10, bold: true };
  summaryRow2.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
  summaryRow2.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
  summaryRow2.getCell(4).value = kijunNissuu;
  summaryRow2.getCell(4).border = BORDER_ALL;
  summaryRow2.getCell(4).font = { size: 10 };
  summaryRow2.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };

  sheet.columns = [
    { width: 4 },
    { width: 4 },
    { width: 4 },
    { width: 6 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 8 },
    { width: 8 },
    { width: 8 },
    { width: 8 },
    { width: 24 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
