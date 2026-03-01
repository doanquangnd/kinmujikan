-- Bảng rate limit cho login/register (chạy nếu chưa có trong schema)
CREATE TABLE IF NOT EXISTS rate_limit (
  identifier VARCHAR(128) PRIMARY KEY,
  request_count INT NOT NULL DEFAULT 0,
  window_expires_at TIMESTAMPTZ NOT NULL
);
