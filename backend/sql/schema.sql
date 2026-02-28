-- Schema MySQL cho ứng dụng 勤務時間 (Kinmu Jikan)
-- Chạy script này để tạo database và bảng

CREATE DATABASE IF NOT EXISTS kinmu_jikan
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE kinmu_jikan;

-- Bảng users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB;

-- Bảng work_records (1 bản ghi = 1 ngày của 1 user)
CREATE TABLE IF NOT EXISTS work_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  work_date DATE NOT NULL,
  time_start TIME DEFAULT NULL,
  time_end TIME DEFAULT NULL,
  break_minutes INT DEFAULT NULL,
  note VARCHAR(500) DEFAULT NULL,
  rest_day TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_work_records_user_date (user_id, work_date),
  KEY idx_work_records_user_date (user_id, work_date),
  CONSTRAINT fk_work_records_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;
