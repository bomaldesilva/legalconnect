-- ════════════════════════════════════════════════════════════════════════════
--  LegalConnect — Additive Schema Gaps (Proposal Table 6 / FR alignment)
--  Apply AFTER docs/legalconnect_schema.sql. Does not drop existing data.
--
--  Clarification defaults applied here:
--    - Flat legal_categories (no subcategory parent column)
--    - Consultation fees stay on consultation_packages (no lawyer.fee column)
--    - No lawyer location/city column until search filters are designed
--    - Auth tables already present; login/register not implemented in app yet
-- ════════════════════════════════════════════════════════════════════════════

USE legalconnect;

-- ── lawyer_categories (FR-008 / FR-010 multi-category mapping) ───────────────
CREATE TABLE IF NOT EXISTS lawyer_categories (
  lawyer_id   INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (lawyer_id, category_id),
  CONSTRAINT fk_lc_lawyer
    FOREIGN KEY (lawyer_id) REFERENCES lawyers(lawyer_id) ON DELETE CASCADE,
  CONSTRAINT fk_lc_category
    FOREIGN KEY (category_id) REFERENCES legal_categories(category_id) ON DELETE CASCADE
);

-- ── case_notes (FR-027 / UC-17) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS case_notes (
  note_id            INT AUTO_INCREMENT PRIMARY KEY,
  case_id            INT NOT NULL,
  created_by_user_id INT NULL,
  facts              TEXT,
  legal_points       TEXT,
  next_actions       TEXT,
  required_documents TEXT,
  note_text          TEXT,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_casenote_case
    FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE CASCADE,
  CONSTRAINT fk_casenote_user
    FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,

  INDEX idx_casenote_case (case_id)
);

-- ── document_attestation (FR-021 / UC-19) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_attestation (
  attestation_id INT AUTO_INCREMENT PRIMARY KEY,
  document_id    INT NOT NULL,
  status         ENUM(
                   'Draft',
                   'LawyerReviewed',
                   'AttestedSigned',
                   'NotarizationRequired',
                   'PhysicalSigningRequired',
                   'DeliveryComplete',
                   'Archived'
                 ) NOT NULL DEFAULT 'Draft',
  remarks        TEXT,
  updated_by     INT NULL,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_attestation_document
    FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE,
  CONSTRAINT fk_attestation_user
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,

  INDEX idx_attestation_document (document_id),
  INDEX idx_attestation_status (status)
);

-- ── daily_diary (FR-023 / UC-22) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_diary (
  diary_id     INT AUTO_INCREMENT PRIMARY KEY,
  lawyer_id    INT NOT NULL,
  assistant_id INT NULL,
  entry_date   DATE NOT NULL,
  entry_type   ENUM('Task','CourtDate','DocumentDue','ClientMeeting','FollowUp','Reminder') NOT NULL DEFAULT 'Task',
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  due_time     TIME NULL,
  status       ENUM('Pending','InProgress','Done','Cancelled') DEFAULT 'Pending',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_diary_lawyer
    FOREIGN KEY (lawyer_id) REFERENCES lawyers(lawyer_id) ON DELETE CASCADE,
  CONSTRAINT fk_diary_assistant
    FOREIGN KEY (assistant_id) REFERENCES assistants(assistant_id) ON DELETE SET NULL,

  INDEX idx_diary_lawyer_date (lawyer_id, entry_date),
  INDEX idx_diary_status (status)
);

-- ── meeting_summaries (FR-025 / UC-23) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_summaries (
  summary_id         INT AUTO_INCREMENT PRIMARY KEY,
  lawyer_id          INT NOT NULL,
  client_id          INT NULL,
  appointment_id     INT NULL,
  case_id            INT NULL,
  created_by_user_id INT NULL,
  client_issue       TEXT,
  key_facts          TEXT,
  required_documents TEXT,
  next_steps         TEXT,
  follow_up_date     DATE NULL,
  summary_text       TEXT,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_ms_lawyer
    FOREIGN KEY (lawyer_id) REFERENCES lawyers(lawyer_id) ON DELETE CASCADE,
  CONSTRAINT fk_ms_client
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE SET NULL,
  CONSTRAINT fk_ms_appointment
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
  CONSTRAINT fk_ms_case
    FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE SET NULL,
  CONSTRAINT fk_ms_user
    FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,

  INDEX idx_ms_lawyer (lawyer_id)
);

-- ── law_overlap_notes (FR-033) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS law_overlap_notes (
  note_id            INT AUTO_INCREMENT PRIMARY KEY,
  category_id        INT NULL,
  title              VARCHAR(255) NOT NULL,
  related_laws       TEXT,
  overlap_notes      TEXT,
  law_updates        TEXT,
  created_by_user_id INT NULL,
  status             ENUM('Active','Inactive') DEFAULT 'Active',
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_lon_category
    FOREIGN KEY (category_id) REFERENCES legal_categories(category_id) ON DELETE SET NULL,
  CONSTRAINT fk_lon_user
    FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,

  INDEX idx_lon_category (category_id)
);

-- ── property_checklists (FR-036 / UC-20) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_checklists (
  checklist_id INT AUTO_INCREMENT PRIMARY KEY,
  request_id   INT NOT NULL,
  item_name    VARCHAR(150) NOT NULL,
  is_present   TINYINT(1) DEFAULT 0,
  notes        TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_pcheck_request
    FOREIGN KEY (request_id) REFERENCES property_requests(request_id) ON DELETE CASCADE,

  INDEX idx_pcheck_request (request_id)
);

-- ── cases.outcome (FR-028 / FR-029) ──────────────────────────────────────────
SET @outcome_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'legalconnect'
    AND TABLE_NAME = 'cases'
    AND COLUMN_NAME = 'outcome'
);

SET @sql := IF(
  @outcome_col = 0,
  "ALTER TABLE cases ADD COLUMN outcome ENUM('Won','Lost','Settled','Withdrawn','Pending') NULL DEFAULT NULL AFTER status",
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── Demo client for appointment booking (auth still deferred) ────────────────
INSERT INTO users (first_name, last_name, email, password_hash, role, status)
VALUES ('Demo', 'Client', 'client@legalconnect.lk',
        '$2y$10$placeholder_replace_with_real_bcrypt_hash', 'Client', 'Active')
ON DUPLICATE KEY UPDATE status = 'Active';

INSERT INTO clients (client_id, nic, verification_status)
SELECT user_id, 'CLIENT000', 'Unverified'
FROM users WHERE email = 'client@legalconnect.lk'
ON DUPLICATE KEY UPDATE verification_status = VALUES(verification_status);

-- Map demo lawyer to Family Law / Property Law for future search
INSERT IGNORE INTO lawyer_categories (lawyer_id, category_id)
SELECT l.lawyer_id, c.category_id
FROM lawyers l
JOIN users u ON u.user_id = l.lawyer_id
JOIN legal_categories c ON c.category_name IN ('Family Law', 'Property Law')
WHERE u.email = 'lawyer@legalconnect.lk';
