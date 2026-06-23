-- GiveTime, database schema (Project 4). Created automatically on
-- startup; included for reference / phpMyAdmin.

CREATE DATABASE IF NOT EXISTS givetime
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE givetime;

CREATE TABLE IF NOT EXISTS opportunities (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(160) NOT NULL,
  organization VARCHAR(160) NOT NULL,
  cause        VARCHAR(40)  NOT NULL,
  location     VARCHAR(160) NOT NULL,
  event_date   DATE         NOT NULL,
  slots        INT          NOT NULL,
  filled       INT          NOT NULL DEFAULT 0,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
