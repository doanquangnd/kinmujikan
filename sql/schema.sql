-- Schema PostgreSQL cho ứng dụng 勤務時間 (Kinmu Jikan)
-- Chạy trong Vercel Postgres (Dashboard > Storage > Postgres > Query) hoặc Neon SQL Editor

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_records (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  time_start TIME DEFAULT NULL,
  time_end TIME DEFAULT NULL,
  break_minutes INT DEFAULT NULL,
  note VARCHAR(500) DEFAULT NULL,
  rest_day SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_work_records_user_date ON work_records(user_id, work_date);
