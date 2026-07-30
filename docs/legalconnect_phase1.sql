CREATE DATABASE IF NOT EXISTS legalconnect
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE legalconnect;

CREATE TABLE IF NOT EXISTS legal_categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  status ENUM('Active','Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lawyers_demo (
  lawyer_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NULL,
  status ENUM('Active','Inactive') DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS availability_slots (
  slot_id INT AUTO_INCREMENT PRIMARY KEY,
  lawyer_id INT NOT NULL,
  available_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('Available','Booked','Cancelled') DEFAULT 'Available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_availability_slots_lawyer
    FOREIGN KEY (lawyer_id) REFERENCES lawyers_demo(lawyer_id),
  CONSTRAINT unique_lawyer_slot
    UNIQUE (lawyer_id, available_date, start_time, end_time)
);

INSERT INTO lawyers_demo (lawyer_id, full_name, email, status)
VALUES (1, 'Demo Lawyer', NULL, 'Active')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  email = VALUES(email),
  status = VALUES(status);

INSERT INTO legal_categories (category_name, description, status)
VALUES
  ('Family Law', 'Consultations related to divorce, custody, adoption, and family disputes.', 'Active'),
  ('Property Law', 'Land, lease, sale, and ownership-related legal matters.', 'Active'),
  ('Business Law', 'Contracts, company formation, and commercial advisory services.', 'Active')
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  status = VALUES(status);

INSERT INTO availability_slots (lawyer_id, available_date, start_time, end_time, status)
VALUES
  (1, CURDATE(), '09:00:00', '10:00:00', 'Available'),
  (1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', '15:00:00', 'Available')
ON DUPLICATE KEY UPDATE
  status = VALUES(status);
