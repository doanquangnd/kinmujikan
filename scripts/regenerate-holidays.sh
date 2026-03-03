#!/usr/bin/env bash
# Tái tạo src/constants/japan_holidays.json từ japan_holidays.csv.
# CSV gốc thường là Shift_JIS (CP932); script chuyển sang UTF-8 rồi sinh file JSON.

set -e
cd "$(dirname "$0")/.."
CSV="scripts/japan_holidays_utf8.csv"
OUT="src/constants/japan_holidays.json"
TMP_CSV=$(mktemp)
trap 'rm -f "$TMP_CSV"' EXIT

if [[ ! -f "$CSV" ]]; then
  echo "Không tìm thấy $CSV"
  exit 1
fi

# Chuyển sang UTF-8 (CP932/Shift_JIS thường dùng cho tiếng Nhật)
if command -v iconv &>/dev/null; then
  iconv -f CP932 -t UTF-8 "$CSV" > "$TMP_CSV" 2>/dev/null || iconv -f SHIFT_JIS -t UTF-8 "$CSV" > "$TMP_CSV" 2>/dev/null || cp "$CSV" "$TMP_CSV"
else
  cp "$CSV" "$TMP_CSV"
fi

node -e "
const fs = require('fs');
const csv = fs.readFileSync('$TMP_CSV', 'utf8');
const lines = csv.split(/\r?\n/).filter(Boolean);
const byYear = {};
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  const idx = line.indexOf(',');
  if (idx === -1) continue;
  const date = line.slice(0, idx).trim();
  const name = line.slice(idx + 1).trim();
  const [y, m, d] = date.split('-');
  if (!y || !m || !d) continue;
  const month = parseInt(m, 10);
  const day = parseInt(d, 10);
  if (!byYear[y]) byYear[y] = [];
  byYear[y].push([month, day, name]);
}
const json = JSON.stringify(byYear, null, 2);
fs.writeFileSync('$OUT', json, 'utf8');
console.log('Đã ghi', Object.keys(byYear).length, 'năm vào', '$OUT');
"
