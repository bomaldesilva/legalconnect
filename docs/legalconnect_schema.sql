-- ════════════════════════════════════════════════════════════════════════════
--  LegalConnect — Full Database Schema
--  Derived from the project ER Diagram (Full System / Phase 2+ Schema)
--  This file replaces docs/legalconnect_phase1.sql for production use.
--
--  Table creation order respects foreign-key dependencies:
--    1. users               (central identity)
--    2. admins              (sub-type of user)
--    3. legal_categories    (lookup / no deps)
--    4. lawyers             (sub-type of user)
--    5. assistants          (sub-type, refs lawyer)
--    6. lawyer_verifications
--    7. clients             (sub-type of user)
--    8. client_records      (client ↔ lawyer relationship)
--    9. consultation_packages
--   10. availability_slots
--   11. appointments
--   12. payments
--   13. feedback
--   14. cases
--   15. documents
--   16. property_requests
--   17. property_request_documents
--   18. notifications
--   19. knowledge_base
--   20. case_laws
--   21. case_case_laws      (junction)
--   22. document_templates
--   23. generated_documents
--   24. audit_logs
-- ════════════════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS legalconnect
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE legalconnect;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. USERS  (Central user identity for all roles)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  user_id       INT           AUTO_INCREMENT PRIMARY KEY,
  first_name    VARCHAR(100)  NOT NULL,
  last_name     VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('Admin','Lawyer','Client','Assistant') NOT NULL,
  status        ENUM('Active','Pending','Blocked') DEFAULT 'Pending',
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_users_email  (email),
  INDEX idx_users_role   (role),
  INDEX idx_users_status (status)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. ADMINS  (Sub-type of USER, role = 'Admin')
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  admin_id INT  PRIMARY KEY,
  nic      VARCHAR(20)  UNIQUE,
  dob      DATE,

  CONSTRAINT fk_admins_user
    FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. LEGAL_CATEGORIES  (Lookup — Family Law, Criminal Law, Property Law, …)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS legal_categories (
  category_id   INT          AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  description   TEXT,
  status        ENUM('Active','Inactive') DEFAULT 'Active',
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. LAWYERS  (Sub-type of USER, role = 'Lawyer')
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lawyers (
  lawyer_id          INT           PRIMARY KEY,
  bar_registration_no VARCHAR(50)  UNIQUE,
  supreme_court_no    VARCHAR(50)  UNIQUE,
  experience_years    INT          DEFAULT 0,
  education           TEXT,
  bio                 TEXT,
  rating              DECIMAL(3,2) DEFAULT 0.00,
  court               VARCHAR(150),
  status              ENUM('Active','Inactive','Pending') DEFAULT 'Pending',

  CONSTRAINT fk_lawyers_user
    FOREIGN KEY (lawyer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. ASSISTANTS  (Sub-type of USER, works under a LAWYER)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assistants (
  assistant_id INT          PRIMARY KEY,
  lawyer_id    INT          NOT NULL,
  position     VARCHAR(100),
  status       ENUM('Active','Inactive') DEFAULT 'Active',

  CONSTRAINT fk_assistants_user
    FOREIGN KEY (assistant_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_assistants_lawyer
    FOREIGN KEY (lawyer_id) REFERENCES lawyers(lawyer_id) ON DELETE CASCADE,

  INDEX idx_assistants_lawyer (lawyer_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 6. LAWYER_VERIFICATIONS  (Admin verifies lawyers using uploaded credentials)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lawyer_verifications (
  verification_id             INT   AUTO_INCREMENT PRIMARY KEY,
  lawyer_id                   INT   NOT NULL,
  bar_certificate_no          VARCHAR(50),
  nic_document_path           VARCHAR(500),
  supreme_court_certificate_no VARCHAR(50),
  verification_status         ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  submitted_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at                 TIMESTAMP NULL,
  reviewed_by_admin_id        INT       NULL,
  remarks                     TEXT,

  CONSTRAINT fk_verification_lawyer
    FOREIGN KEY (lawyer_id) REFERENCES lawyers(lawyer_id) ON DELETE CASCADE,
  CONSTRAINT fk_verification_admin
    FOREIGN KEY (reviewed_by_admin_id) REFERENCES admins(admin_id) ON DELETE SET NULL,

  INDEX idx_verification_lawyer (lawyer_id),
  INDEX idx_verification_status (verification_status)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 7. CLIENTS  (Sub-type of USER, role = 'Client')
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  client_id           INT         PRIMARY KEY,
  nic                 VARCHAR(20) UNIQUE,
  dob                 DATE,
  gender              ENUM('Male','Female','Other'),
  address             TEXT,
  city                VARCHAR(100),
  verification_status ENUM('Unverified','Verified','Pending') DEFAULT 'Unverified',

  CONSTRAINT fk_clients_user
    FOREIGN KEY (client_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ────────────────────────────────────────────────────────────────────────────
-- 8. CLIENT_RECORDS  (Formal engagement record linking a CLIENT to a LAWYER)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_records (
  record_id  INT AUTO_INCREMENT PRIMARY KEY,
  client_id  INT NOT NULL,
  lawyer_id  INT NOT NULL,
  status     ENUM('Active','Closed','Archived') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_record_client
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
  CONSTRAINT fk_record_lawyer
    FOREIGN KEY (lawyer_id) REFERENCES lawyers(lawyer_id) ON DELETE CASCADE,

  INDEX idx_record_client (client_id),
  INDEX idx_record_lawyer (lawyer_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 9. CONSULTATION_PACKAGES  (Lawyer-defined service packages)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consultation_packages (
  package_id       INT           AUTO_INCREMENT PRIMARY KEY,
  lawyer_id        INT           NOT NULL,
  category_id      INT,
  package_name     VARCHAR(150)  NOT NULL,
  fee              DECIMAL(10,2) NOT NULL,
  duration_minutes INT           NOT NULL,
  description      TEXT,
  status           ENUM('Active','Inactive') DEFAULT 'Active',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_package_lawyer
    FOREIGN KEY (lawyer_id) REFERENCES lawyers(lawyer_id) ON DELETE CASCADE,
  CONSTRAINT fk_package_category
    FOREIGN KEY (category_id) REFERENCES legal_categories(category_id) ON DELETE SET NULL,

  INDEX idx_package_lawyer   (lawyer_id),
  INDEX idx_package_category (category_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 10. AVAILABILITY_SLOTS  (Lawyer's bookable time windows)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS availability_slots (
  slot_id        INT  AUTO_INCREMENT PRIMARY KEY,
  lawyer_id      INT  NOT NULL,
  available_date DATE NOT NULL,
  start_time     TIME NOT NULL,
  end_time       TIME NOT NULL,
  status         ENUM('Available','Booked','Cancelled') DEFAULT 'Available',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT unique_lawyer_slot
    UNIQUE (lawyer_id, available_date, start_time, end_time),
  CONSTRAINT fk_slot_lawyer
    FOREIGN KEY (lawyer_id) REFERENCES lawyers(lawyer_id) ON DELETE CASCADE,

  INDEX idx_slot_lawyer (lawyer_id),
  INDEX idx_slot_date   (available_date)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 11. APPOINTMENTS  (Client books a slot with a lawyer under a package)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  appointment_id   INT  AUTO_INCREMENT PRIMARY KEY,
  client_id        INT  NOT NULL,
  lawyer_id        INT  NOT NULL,
  slot_id          INT,
  package_id       INT,
  appointment_date DATE NOT NULL,
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  mode             ENUM('Online','Physical') NOT NULL DEFAULT 'Online',
  status           ENUM('Pending','Confirmed','Completed','Cancelled','NoShow') DEFAULT 'Pending',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_appt_client
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
  CONSTRAINT fk_appt_lawyer
    FOREIGN KEY (lawyer_id) REFERENCES lawyers(lawyer_id) ON DELETE CASCADE,
  CONSTRAINT fk_appt_slot
    FOREIGN KEY (slot_id) REFERENCES availability_slots(slot_id) ON DELETE SET NULL,
  CONSTRAINT fk_appt_package
    FOREIGN KEY (package_id) REFERENCES consultation_packages(package_id) ON DELETE SET NULL,

  INDEX idx_appt_client (client_id),
  INDEX idx_appt_lawyer (lawyer_id),
  INDEX idx_appt_date   (appointment_date),
  INDEX idx_appt_status (status)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 12. PAYMENTS  (Payment record for an APPOINTMENT)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  payment_id        INT           AUTO_INCREMENT PRIMARY KEY,
  appointment_id    INT           NOT NULL,
  amount            DECIMAL(10,2) NOT NULL,
  payment_method    VARCHAR(50),
  payment_status    ENUM('Pending','Paid','Failed','Refunded') DEFAULT 'Pending',
  payment_reference VARCHAR(100)  UNIQUE,
  paid_at           TIMESTAMP     NULL,
  created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_payment_appointment
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE,

  INDEX idx_payment_appointment (appointment_id),
  INDEX idx_payment_status      (payment_status)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 13. FEEDBACK  (Client rates a LAWYER after an APPOINTMENT)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  feedback_id    INT      AUTO_INCREMENT PRIMARY KEY,
  client_id      INT      NOT NULL,
  lawyer_id      INT      NOT NULL,
  appointment_id INT      UNIQUE,
  rating         TINYINT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_feedback_client
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
  CONSTRAINT fk_feedback_lawyer
    FOREIGN KEY (lawyer_id) REFERENCES lawyers(lawyer_id) ON DELETE CASCADE,
  CONSTRAINT fk_feedback_appointment
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,

  INDEX idx_feedback_lawyer (lawyer_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 14. CASES  (Legal case linked to a CLIENT_RECORD and a LEGAL_CATEGORY)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cases (
  case_id     INT          AUTO_INCREMENT PRIMARY KEY,
  record_id   INT,
  category_id INT,
  case_title  VARCHAR(255) NOT NULL,
  description TEXT,
  status      ENUM('Open','InProgress','Closed','Archived') DEFAULT 'Open',
  open_date   DATE         NOT NULL,
  close_date  DATE         NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_case_record
    FOREIGN KEY (record_id) REFERENCES client_records(record_id) ON DELETE SET NULL,
  CONSTRAINT fk_case_category
    FOREIGN KEY (category_id) REFERENCES legal_categories(category_id) ON DELETE SET NULL,

  INDEX idx_case_record   (record_id),
  INDEX idx_case_category (category_id),
  INDEX idx_case_status   (status)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 15. DOCUMENTS  (Files uploaded for a CASE by a USER)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  document_id         INT          AUTO_INCREMENT PRIMARY KEY,
  case_id             INT,
  uploaded_by_user_id INT,
  file_name           VARCHAR(255) NOT NULL,
  file_path           VARCHAR(500) NOT NULL,
  file_type           VARCHAR(50),
  uploaded_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  document_status     ENUM('Uploaded','Reviewed','Approved','Rejected') DEFAULT 'Uploaded',

  CONSTRAINT fk_doc_case
    FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE SET NULL,
  CONSTRAINT fk_doc_uploader
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,

  INDEX idx_doc_case   (case_id),
  INDEX idx_doc_status (document_status)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 16. PROPERTY_REQUESTS  (Special request for property-related legal services)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_requests (
  request_id        INT          AUTO_INCREMENT PRIMARY KEY,
  client_id         INT          NOT NULL,
  lawyer_id         INT,
  request_type      VARCHAR(100) NOT NULL,
  property_location VARCHAR(255),
  description       TEXT,
  status            ENUM('Pending','InReview','Approved','Rejected','Closed') DEFAULT 'Pending',
  submitted_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_preq_client
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
  CONSTRAINT fk_preq_lawyer
    FOREIGN KEY (lawyer_id) REFERENCES lawyers(lawyer_id) ON DELETE SET NULL,

  INDEX idx_preq_client (client_id),
  INDEX idx_preq_lawyer (lawyer_id),
  INDEX idx_preq_status (status)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 17. PROPERTY_REQUEST_DOCUMENTS  (Junction: request ↔ supporting documents)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_request_documents (
  request_id  INT NOT NULL,
  document_id INT NOT NULL,
  PRIMARY KEY (request_id, document_id),

  CONSTRAINT fk_prd_request
    FOREIGN KEY (request_id) REFERENCES property_requests(request_id) ON DELETE CASCADE,
  CONSTRAINT fk_prd_document
    FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE
);

-- ────────────────────────────────────────────────────────────────────────────
-- 18. NOTIFICATIONS  (In-app alerts sent to users)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT          AUTO_INCREMENT PRIMARY KEY,
  user_id         INT          NOT NULL,
  message         TEXT         NOT NULL,
  type            VARCHAR(50),
  read_status     TINYINT(1)   DEFAULT 0,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_notif_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,

  INDEX idx_notif_user   (user_id),
  INDEX idx_notif_unread (user_id, read_status)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 19. KNOWLEDGE_BASE  (Legal articles and resources by category)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_base (
  kb_id       INT          AUTO_INCREMENT PRIMARY KEY,
  category_id INT,
  created_by  INT,
  title       VARCHAR(255) NOT NULL,
  content     LONGTEXT     NOT NULL,
  status      ENUM('Published','Draft','Archived') DEFAULT 'Draft',
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_kb_category
    FOREIGN KEY (category_id) REFERENCES legal_categories(category_id) ON DELETE SET NULL,
  CONSTRAINT fk_kb_author
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,

  INDEX idx_kb_category (category_id),
  INDEX idx_kb_status   (status),
  FULLTEXT INDEX ft_kb_content (title, content)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 20. CASE_LAWS  (Legal precedents and statutes database)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS case_laws (
  case_law_id     INT          AUTO_INCREMENT PRIMARY KEY,
  case_name       VARCHAR(255) NOT NULL,
  reference       VARCHAR(150),
  summary         TEXT,
  court           VARCHAR(150),
  year            YEAR,
  legal_principle TEXT,
  status          ENUM('Active','Inactive') DEFAULT 'Active',
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_caselaw_year   (year),
  INDEX idx_caselaw_status (status),
  FULLTEXT INDEX ft_caselaw_search (case_name, summary, legal_principle)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 21. CASE_CASE_LAWS  (Junction: which precedents apply to a case)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS case_case_laws (
  case_id         INT  NOT NULL,
  case_law_id     INT  NOT NULL,
  relevance_note  TEXT,
  PRIMARY KEY (case_id, case_law_id),

  CONSTRAINT fk_ccl_case
    FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE CASCADE,
  CONSTRAINT fk_ccl_caselaw
    FOREIGN KEY (case_law_id) REFERENCES case_laws(case_law_id) ON DELETE CASCADE
);

-- ────────────────────────────────────────────────────────────────────────────
-- 22. DOCUMENT_TEMPLATES  (Reusable legal document templates per category)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_templates (
  template_id   INT          AUTO_INCREMENT PRIMARY KEY,
  category_id   INT,
  template_name VARCHAR(150) NOT NULL,
  description   TEXT,
  template_path VARCHAR(500),
  status        ENUM('Active','Inactive') DEFAULT 'Active',
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_template_category
    FOREIGN KEY (category_id) REFERENCES legal_categories(category_id) ON DELETE SET NULL,

  INDEX idx_template_category (category_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 23. GENERATED_DOCUMENTS  (Documents generated from a template for a case)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS generated_documents (
  generated_doc_id INT          AUTO_INCREMENT PRIMARY KEY,
  lawyer_id        INT,
  case_id          INT,
  template_id      INT,
  document_id      INT,
  template_name    VARCHAR(150),
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_gendoc_lawyer
    FOREIGN KEY (lawyer_id) REFERENCES lawyers(lawyer_id) ON DELETE SET NULL,
  CONSTRAINT fk_gendoc_case
    FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE SET NULL,
  CONSTRAINT fk_gendoc_template
    FOREIGN KEY (template_id) REFERENCES document_templates(template_id) ON DELETE SET NULL,
  CONSTRAINT fk_gendoc_document
    FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE SET NULL,

  INDEX idx_gendoc_lawyer (lawyer_id),
  INDEX idx_gendoc_case   (case_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 24. AUDIT_LOGS  (Immutable record of all system actions)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  audit_id    INT          AUTO_INCREMENT PRIMARY KEY,
  user_id     INT,
  action      VARCHAR(100) NOT NULL,
  entity_name VARCHAR(100),
  entity_id   INT,
  ip_address  VARCHAR(45),
  date_time   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_audit_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,

  INDEX idx_audit_user   (user_id),
  INDEX idx_audit_entity (entity_name, entity_id),
  INDEX idx_audit_time   (date_time)
);

-- ════════════════════════════════════════════════════════════════════════════
--  SEED DATA
-- ════════════════════════════════════════════════════════════════════════════

-- ── Default admin user ───────────────────────────────────────────────────────
-- Password: admin123  (SHA-256 placeholder — replace with bcrypt in PHP)
INSERT INTO users (first_name, last_name, email, password_hash, role, status)
VALUES ('System', 'Admin', 'admin@legalconnect.lk',
        '$2y$10$placeholder_replace_with_real_bcrypt_hash', 'Admin', 'Active')
ON DUPLICATE KEY UPDATE status = 'Active';

INSERT INTO admins (admin_id, nic, dob)
SELECT user_id, 'ADMIN000', '1980-01-01'
FROM users WHERE email = 'admin@legalconnect.lk'
ON DUPLICATE KEY UPDATE nic = nic;

-- ── Legal categories ─────────────────────────────────────────────────────────
INSERT INTO legal_categories (category_name, description, status) VALUES
  ('Family Law',    'Consultations related to divorce, custody, adoption, and family disputes.', 'Active'),
  ('Property Law',  'Land, lease, sale, and ownership-related legal matters.',                  'Active'),
  ('Business Law',  'Contracts, company formation, and commercial advisory services.',          'Active'),
  ('Criminal Law',  'Defence and prosecution in criminal proceedings.',                         'Active'),
  ('Labour Law',    'Employment disputes, wrongful termination, and workplace rights.',         'Active'),
  ('Constitutional Law', 'Fundamental rights, public interest, and constitutional matters.',   'Active')
ON DUPLICATE KEY UPDATE description = VALUES(description), status = VALUES(status);

-- ── Demo lawyer user (for Phase 1 backward compatibility) ───────────────────
INSERT INTO users (first_name, last_name, email, password_hash, role, status)
VALUES ('Demo', 'Lawyer', 'lawyer@legalconnect.lk',
        '$2y$10$placeholder_replace_with_real_bcrypt_hash', 'Lawyer', 'Active')
ON DUPLICATE KEY UPDATE status = 'Active';

INSERT INTO lawyers (lawyer_id, bar_registration_no, experience_years, rating, status)
SELECT user_id, 'BAR-DEMO-001', 5, 4.50, 'Active'
FROM users WHERE email = 'lawyer@legalconnect.lk'
ON DUPLICATE KEY UPDATE status = 'Active';

-- ── Demo availability slots (matching Phase 1 seed data) ────────────────────
INSERT INTO availability_slots (lawyer_id, available_date, start_time, end_time, status)
SELECT l.lawyer_id, CURDATE(), '09:00:00', '10:00:00', 'Available'
FROM lawyers l JOIN users u ON l.lawyer_id = u.user_id
WHERE u.email = 'lawyer@legalconnect.lk'
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO availability_slots (lawyer_id, available_date, start_time, end_time, status)
SELECT l.lawyer_id, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', '15:00:00', 'Available'
FROM lawyers l JOIN users u ON l.lawyer_id = u.user_id
WHERE u.email = 'lawyer@legalconnect.lk'
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ── Sample case laws ─────────────────────────────────────────────────────────
INSERT INTO case_laws (case_name, reference, summary, court, year, legal_principle, status) VALUES
  ('Gunawardena v. Attorney General',
   'SC/FR/01/2020', 'Fundamental rights petition regarding wrongful detention.',
   'Supreme Court of Sri Lanka', '2020', 'Right to personal liberty under Article 13.', 'Active'),
  ('Jayawickrema v. Commissioner of Labour',
   'CA/WRIT/45/2019', 'Wrongful termination of employment without due process.',
   'Court of Appeal', '2019', 'Fair labour practices and natural justice.', 'Active')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ── Sample document template ─────────────────────────────────────────────────
INSERT INTO document_templates (category_id, template_name, description, status)
SELECT category_id, 'Standard Affidavit', 'A general-purpose affidavit template.', 'Active'
FROM legal_categories WHERE category_name = 'Family Law'
ON DUPLICATE KEY UPDATE status = VALUES(status);
  