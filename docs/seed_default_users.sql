-- ============================================================
--  LegalConnect — Default Seed Users
--  Run this AFTER importing legalconnect_schema.sql
--
--  Credentials:
--    Admin:  admin@legalconnect.lk  / admin123
--    Lawyer: lawyer@legalconnect.lk / lawyer123
--    Client: client@legalconnect.lk / client123
--
--  Passwords are bcrypt hashed (PHP PASSWORD_BCRYPT).
-- ============================================================

USE legalconnect;

-- Insert default users (INSERT IGNORE skips if email already exists)
INSERT IGNORE INTO users (first_name, last_name, email, password_hash, role, status) VALUES
  ('Admin',  'LegalConnect', 'admin@legalconnect.lk',  '$2y$10$lhJoab/JGbWOPE.RyZWI/u9hQVip5WpaKAN4XR44mkW1Ss8XMPxMK', 'Admin',  'Active'),
  ('Demo',   'Lawyer',       'lawyer@legalconnect.lk', '$2y$10$u1S2nmdAHGH7ugoMRPxY9uUpjfxkaoCyAQ/8o6ap2ZIo9d5fXRKkS', 'Lawyer', 'Active'),
  ('Demo',   'Client',       'client@legalconnect.lk', '$2y$10$L6bzn8coJojdPDuGX8RUu.oPhdmKAXfNM6KbniSSKLbYLj7InpBKy', 'Client', 'Active');

-- Create role-specific sub-records
INSERT IGNORE INTO admins  (admin_id)  SELECT user_id FROM users WHERE email = 'admin@legalconnect.lk';
INSERT IGNORE INTO lawyers (lawyer_id) SELECT user_id FROM users WHERE email = 'lawyer@legalconnect.lk';
INSERT IGNORE INTO clients (client_id) SELECT user_id FROM users WHERE email = 'client@legalconnect.lk';
