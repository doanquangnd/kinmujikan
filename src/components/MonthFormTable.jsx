import { calcWorkMinutes, minutesToTimeString, toHHmm } from '../utils/formatTime.js';

function MonthFormRow({
  row,
  index,
  rows,
  readOnly,
  isInvalidTime,
  canFillFromPrev,
  onUpdateRow,
  onFillFromPrevious,
}) {
  const isWeekendOrHoliday = row.weekdayIndex === 0 || row.weekdayIndex === 6 || row.holidayName;
  const isRestStyle = isWeekendOrHoliday || row.rest_day;
  const isEmptyWorkDay = !isRestStyle && (!row.time_start || !row.time_end);
  const mins = calcWorkMinutes(row.time_start, row.time_end, row.break_minutes);
  const cellClass = isRestStyle
    ? 'bg-neutral-100 text-red-700 border-neutral-200'
    : isEmptyWorkDay
      ? 'bg-red-50 border-neutral-200'
      : 'border-neutral-200';
  const restChecked = isWeekendOrHoliday || row.rest_day;
  const restDisabled = isWeekendOrHoliday;
  const timeDisplay = (t) => (t ? toHHmm(t) || '--:--' : '--:--');
  const canEditTime = !readOnly && (!row.rest_day || isWeekendOrHoliday);
  const timeInputValue = (t) => (t != null && t !== '' ? String(t) : '');

  return (
    <tr className="border-b border-neutral-100 hover:bg-neutral-50/70">
      <td className={`border-r p-1 text-center ${cellClass}`}>{row.day}</td>
      <td className={`border-r p-1 text-center ${cellClass}`}>{row.weekday}</td>
      <td className={`border-r p-1 text-center ${cellClass}`}>
        {readOnly ? (
          restChecked ? '✓' : ''
        ) : (
          <input
            type="checkbox"
            checked={restChecked}
            disabled={restDisabled}
            onChange={(e) => onUpdateRow(index, 'rest_day', e.target.checked)}
            className="rounded border-neutral-400 focus:ring-2 focus:ring-neutral-400"
          />
        )}
      </td>
      <td className={`border-r p-1 text-center ${cellClass}`}>
        <div className="flex items-center justify-center gap-0.5">
          {!readOnly && canFillFromPrev && (
            <button
              type="button"
              onClick={() => onFillFromPrevious(index)}
              className="text-xs border border-neutral-300 rounded px-1 py-0.5 hover:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              title="Điền từ ngày trước"
            >
              ←
            </button>
          )}
          {readOnly ? (
            timeDisplay(row.time_start)
          ) : canEditTime ? (
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder="--:--"
              value={timeInputValue(row.time_start)}
              onChange={(e) => onUpdateRow(index, 'time_start', e.target.value.trim() || null)}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v) {
                  const normalized = toHHmm(v);
                  onUpdateRow(index, 'time_start', normalized || v);
                }
              }}
              className="w-full border-0 bg-transparent p-0 text-inherit min-w-[4rem] text-center font-mono focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-inset rounded"
            />
          ) : (
            '--:--'
          )}
        </div>
      </td>
      <td className={`border-r p-1 text-center ${cellClass} ${isInvalidTime ? 'border-red-500 bg-red-50' : ''}`}>
        {readOnly ? (
          timeDisplay(row.time_end)
        ) : canEditTime ? (
          <input
            type="text"
            inputMode="numeric"
            placeholder="--:--"
            maxLength={5}
            value={timeInputValue(row.time_end)}
            onChange={(e) => onUpdateRow(index, 'time_end', e.target.value.trim() || null)}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v) {
                const normalized = toHHmm(v);
                onUpdateRow(index, 'time_end', normalized || v);
              }
            }}
            className="w-full border-0 bg-transparent p-0 text-inherit min-w-[4rem] text-center font-mono focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-inset rounded"
          />
        ) : (
          '--:--'
        )}
      </td>
      <td className={`border-r p-1 text-center ${cellClass}`}>
        {readOnly ? (
          row.break_minutes ?? ''
        ) : canEditTime ? (
          <input
            type="number"
            min={0}
            placeholder="--"
            value={row.break_minutes ?? ''}
            onChange={(e) => onUpdateRow(index, 'break_minutes', e.target.value === '' ? null : Number(e.target.value))}
            className="w-full border-0 bg-transparent p-0 text-inherit text-center min-w-0 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-inset rounded"
          />
        ) : (
          ''
        )}
      </td>
      <td className={`border-r p-1 text-center ${cellClass}`}>{minutesToTimeString(mins)}</td>
      <td className={`p-1 ${cellClass}`}>
        {readOnly ? (
          row.note ?? ''
        ) : (
          <input
            type="text"
            value={row.note ?? ''}
            onChange={(e) => onUpdateRow(index, 'note', e.target.value)}
            className="w-full border-0 bg-transparent p-0 text-inherit min-w-[8rem] focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-inset rounded"
          />
        )}
      </td>
    </tr>
  );
}

export default function MonthFormTable({
  rows,
  readOnly,
  invalidTimeRows,
  totalMinutes,
  onUpdateRow,
  onFillFromPrevious,
}) {
  return (
    <div className="overflow-x-auto border border-neutral-200 rounded-lg max-h-[70vh] overflow-y-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 z-10 bg-neutral-50 border-b border-neutral-200">
          <tr>
            <th className="border-r border-neutral-200 p-2 text-center font-medium w-12">日</th>
            <th className="border-r border-neutral-200 p-2 text-center font-medium w-12">曜</th>
            <th className="border-r border-neutral-200 p-2 text-center font-medium w-10">休</th>
            <th className="border-r border-neutral-200 p-2 text-center font-medium w-20">開始</th>
            <th className="border-r border-neutral-200 p-2 text-center font-medium w-20">終了</th>
            <th className="border-r border-neutral-200 p-2 text-center font-medium w-20">休憩(分)</th>
            <th className="border-r border-neutral-200 p-2 text-center font-medium w-20">総業務時間</th>
            <th className="p-2 text-left font-medium min-w-[8rem]">備考</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isWeekendOrHoliday = row.weekdayIndex === 0 || row.weekdayIndex === 6 || row.holidayName;
            const canEditTime = !readOnly && (!row.rest_day || isWeekendOrHoliday);
            const canFillFromPrev = !readOnly && i > 0 && canEditTime && rows[i - 1].time_start && rows[i - 1].time_end;
            return (
              <MonthFormRow
                key={row.day}
                row={row}
                index={i}
                rows={rows}
                readOnly={readOnly}
                isInvalidTime={invalidTimeRows.some((r) => r.index === i)}
                canFillFromPrev={canFillFromPrev}
                onUpdateRow={onUpdateRow}
                onFillFromPrevious={onFillFromPrevious}
              />
            );
          })}
          <tr className="border-t-2 border-neutral-300 bg-neutral-50 font-medium">
            <td colSpan={6} className="p-2 text-right">合計</td>
            <td className="p-2">{minutesToTimeString(totalMinutes)}</td>
            <td className="p-2" />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
