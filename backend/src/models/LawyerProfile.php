<?php

declare(strict_types=1);

/**
 * LawyerProfile
 *
 * Repository layer for the Lawyer Profile module.
 * Handles all DB queries across the users, lawyers,
 * lawyer_categories, lawyer_verifications, consultation_packages,
 * and availability_slots tables.
 *
 * Uses parameterised queries throughout; never exposes raw
 * error messages to the controller layer.
 */
class LawyerProfile
{
    public function __construct(private PDO $db)
    {
    }

    // ─── Core profile ─────────────────────────────────────────────────────────

    /**
     * Returns the combined user + lawyer row for a given lawyer_id,
     * including the latest verification record (if any).
     */
    public function findWithUser(int $lawyerId): ?array
    {
        $statement = $this->db->prepare(
            "SELECT
                u.user_id,
                u.first_name,
                u.last_name,
                u.email,
                u.role,
                u.status        AS user_status,
                u.created_at    AS member_since,
                l.bar_registration_no,
                l.supreme_court_no,
                l.experience_years,
                l.education,
                l.bio,
                l.rating,
                l.court,
                l.status        AS lawyer_status,

                -- Latest verification record
                lv.verification_id,
                lv.verification_status,
                lv.bar_certificate_no,
                lv.supreme_court_certificate_no,
                lv.remarks          AS verification_remarks,
                lv.submitted_at     AS verification_submitted_at,
                lv.reviewed_at      AS verification_reviewed_at

             FROM   lawyers l
             INNER JOIN users u ON u.user_id = l.lawyer_id
             LEFT  JOIN lawyer_verifications lv
                     ON lv.lawyer_id = l.lawyer_id
                     AND lv.verification_id = (
                         SELECT MAX(v2.verification_id)
                         FROM lawyer_verifications v2
                         WHERE v2.lawyer_id = l.lawyer_id
                     )
             WHERE  l.lawyer_id = :id"
        );
        $statement->execute(['id' => $lawyerId]);
        $row = $statement->fetch();

        return $row ?: null;
    }

    /**
     * Updates the users table (first_name, last_name) and the lawyers
     * table (bio, experience_years, education, court,
     * bar_registration_no, supreme_court_no) in a single transaction.
     *
     * Verification-controlled fields (status, rating) are intentionally
     * excluded from this method.
     */
    public function updateProfile(int $lawyerId, array $data): bool
    {
        $this->db->beginTransaction();

        try {
            $stmtUser = $this->db->prepare(
                'UPDATE users
                 SET first_name = :first_name,
                     last_name  = :last_name
                 WHERE user_id  = :id'
            );
            $stmtUser->execute([
                'first_name' => trim((string) $data['first_name']),
                'last_name'  => trim((string) $data['last_name']),
                'id'         => $lawyerId,
            ]);

            $stmtLawyer = $this->db->prepare(
                'UPDATE lawyers
                 SET bio                  = :bio,
                     experience_years     = :experience_years,
                     education            = :education,
                     court                = :court,
                     bar_registration_no  = :bar_registration_no,
                     supreme_court_no     = :supreme_court_no
                 WHERE lawyer_id          = :id'
            );
            $stmtLawyer->execute([
                'bio'                 => $this->nullableText($data['bio'] ?? null),
                'experience_years'    => $this->nullableInt($data['experience_years'] ?? null),
                'education'           => $this->nullableText($data['education'] ?? null),
                'court'               => $this->nullableText($data['court'] ?? null),
                'bar_registration_no' => $this->nullableText($data['bar_registration_no'] ?? null),
                'supreme_court_no'    => $this->nullableText($data['supreme_court_no'] ?? null),
                'id'                  => $lawyerId,
            ]);

            $this->db->commit();
            return true;
        } catch (\Throwable $exception) {
            $this->db->rollBack();
            throw $exception;
        }
    }

    // ─── Legal categories ──────────────────────────────────────────────────────

    /**
     * Returns all legal categories assigned to this lawyer,
     * joining with legal_categories for the name.
     */
    public function getCategories(int $lawyerId): array
    {
        $statement = $this->db->prepare(
            'SELECT lc.category_id, lc.category_name, lc.description, lc.status
             FROM   lawyer_categories   lcat
             INNER JOIN legal_categories lc ON lc.category_id = lcat.category_id
             WHERE  lcat.lawyer_id = :id
             ORDER  BY lc.category_name ASC'
        );
        $statement->execute(['id' => $lawyerId]);

        return $statement->fetchAll();
    }

    /**
     * Adds a category to this lawyer (INSERT IGNORE — safe to call twice).
     */
    public function addCategory(int $lawyerId, int $categoryId): bool
    {
        $statement = $this->db->prepare(
            'INSERT IGNORE INTO lawyer_categories (lawyer_id, category_id)
             VALUES (:lawyer_id, :category_id)'
        );

        return $statement->execute([
            'lawyer_id'   => $lawyerId,
            'category_id' => $categoryId,
        ]);
    }

    /**
     * Removes a category from this lawyer.
     */
    public function removeCategory(int $lawyerId, int $categoryId): bool
    {
        $statement = $this->db->prepare(
            'DELETE FROM lawyer_categories
             WHERE lawyer_id   = :lawyer_id
               AND category_id = :category_id'
        );

        return $statement->execute([
            'lawyer_id'   => $lawyerId,
            'category_id' => $categoryId,
        ]);
    }

    /**
     * Checks that a given legal category exists and is Active.
     */
    public function categoryExists(int $categoryId): bool
    {
        $statement = $this->db->prepare(
            "SELECT COUNT(*) FROM legal_categories
             WHERE category_id = :id AND status = 'Active'"
        );
        $statement->execute(['id' => $categoryId]);

        return (int) $statement->fetchColumn() > 0;
    }

    /**
     * Checks whether the lawyer already has this category assigned.
     */
    public function hasCategory(int $lawyerId, int $categoryId): bool
    {
        $statement = $this->db->prepare(
            'SELECT COUNT(*) FROM lawyer_categories
             WHERE lawyer_id = :lid AND category_id = :cid'
        );
        $statement->execute(['lid' => $lawyerId, 'cid' => $categoryId]);

        return (int) $statement->fetchColumn() > 0;
    }

    // ─── Module summaries (read-only) ─────────────────────────────────────────

    /**
     * Returns a lightweight consultation package summary for this lawyer.
     */
    public function getPackageSummary(int $lawyerId): array
    {
        $statement = $this->db->prepare(
            "SELECT
                COUNT(*)                                       AS total_packages,
                SUM(status = 'Active')                        AS active_packages,
                MIN(CASE WHEN status = 'Active' THEN fee END) AS min_fee,
                MAX(CASE WHEN status = 'Active' THEN fee END) AS max_fee
             FROM consultation_packages
             WHERE lawyer_id = :id"
        );
        $statement->execute(['id' => $lawyerId]);
        $row = $statement->fetch();

        // Also grab the first few active package names
        $stmt2 = $this->db->prepare(
            "SELECT package_name, fee, duration_minutes, status
             FROM consultation_packages
             WHERE lawyer_id = :id
             ORDER BY status ASC, package_id DESC
             LIMIT 5"
        );
        $stmt2->execute(['id' => $lawyerId]);

        return [
            'summary'  => $row,
            'packages' => $stmt2->fetchAll(),
        ];
    }

    /**
     * Returns a lightweight availability summary for this lawyer.
     */
    public function getAvailabilitySummary(int $lawyerId): array
    {
        $statement = $this->db->prepare(
            "SELECT
                COUNT(*)                                              AS total_slots,
                SUM(status = 'Available')                            AS available_slots,
                MIN(CASE WHEN status = 'Available' AND available_date >= CURDATE()
                         THEN available_date END)                    AS next_available_date
             FROM availability_slots
             WHERE lawyer_id = :id"
        );
        $statement->execute(['id' => $lawyerId]);

        return $statement->fetch() ?: [];
    }

    // ─── Public / client-facing profile ───────────────────────────────────────

    /**
     * Full profile for the client-facing public view.
     * Combines profile data, categories, package list, and availability summary.
     */
    public function getPublicProfile(int $lawyerId): ?array
    {
        $profile = $this->findWithUser($lawyerId);
        if ($profile === null) {
            return null;
        }

        $profile['categories']           = $this->getCategories($lawyerId);
        $profile['package_summary']      = $this->getPackageSummary($lawyerId);
        $profile['availability_summary'] = $this->getAvailabilitySummary($lawyerId);

        return $profile;
    }

    // ─── Existence helpers ─────────────────────────────────────────────────────

    /**
     * Returns true if a lawyer row with the given ID exists.
     */
    public function lawyerExists(int $lawyerId): bool
    {
        $statement = $this->db->prepare(
            'SELECT COUNT(*) FROM lawyers WHERE lawyer_id = :id'
        );
        $statement->execute(['id' => $lawyerId]);

        return (int) $statement->fetchColumn() > 0;
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private function nullableText(mixed $value): ?string
    {
        $text = trim((string) ($value ?? ''));

        return $text === '' ? null : $text;
    }

    private function nullableInt(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
    }
}
