# LegalConnect

LegalConnect is a PHP MVC legal consultation and lawyer practice management platform. This Phase 1 MVP focuses on two CRUD modules only: legal categories for admins and availability slots for a demo lawyer.

## Phase 1 Scope

- Legal Category CRUD
- Lawyer Availability Slot CRUD
- Dashboard metrics for active legal categories and available slots
- Demo role simulation only
- Demo lawyer uses `lawyer_id = 1`
- No login or registration
- No external API integrations
- No Gemini, PayHere, Brevo, Notify.lk, PDF library, or LankaSign integration yet

## Project Structure

```text
frontend/
  index.html
  css/main.css
  js/api.js
  js/pages/
  pages/

backend/
  public/index.php
  src/core/
  src/controllers/
  src/database/db_connect.php
  src/models/

docs/
  legalconnect_phase1.sql
```

## Database Setup

1. Open phpMyAdmin in XAMPP.
2. Import [docs/legalconnect_phase1.sql](/Users/janidubomal/Documents/legalConnect/docs/legalconnect_phase1.sql).
3. The SQL creates the `legalconnect` database and these tables:
   - `legal_categories`
   - `lawyers_demo`
   - `availability_slots`
4. The SQL inserts one demo lawyer:
   - `lawyer_id = 1`
   - `full_name = Demo Lawyer`

## Database Configuration

Edit [backend/src/database/db_connect.php](/Users/janidubomal/Documents/legalConnect/backend/src/database/db_connect.php) if your local MySQL settings are different.

Default settings:

```php
$host = 'localhost';
$database = 'legalconnect';
$username = 'root';
$password = '';
```

## API Endpoints

Base URL for XAMPP:

```text
http://localhost/legalConnect/backend/public/api
```

Legal Category API:

```text
GET    /legal-categories
GET    /legal-categories/{id}
POST   /legal-categories
PUT    /legal-categories/{id}
DELETE /legal-categories/{id}
```

Availability Slot API:

```text
GET    /availability-slots
GET    /availability-slots/{id}
POST   /availability-slots
PUT    /availability-slots/{id}
DELETE /availability-slots/{id}
```

Dashboard API:

```text
GET /dashboard
```

Delete behavior is soft delete:

- Legal category delete changes `status` to `Inactive`.
- Availability slot delete changes `status` to `Cancelled`.

All API responses are JSON and use suitable HTTP status codes such as `200`, `201`, `400`, `404`, `405`, and `500`.

## Run With XAMPP

1. Copy or keep the project folder inside your XAMPP web root, usually `htdocs/legalConnect`.
2. Start Apache and MySQL from the XAMPP control panel.
3. Import the SQL file from `docs/legalconnect_phase1.sql`.
4. Confirm database settings in `backend/src/database/db_connect.php`.
5. Open the frontend:

```text
http://localhost/legalConnect/frontend/
```

6. API requests are sent to:git checkout -b development

```text
http://localhost/legalConnect/backend/public/api
```

If your folder name or host differs, set `window.LEGALCONNECT_API_BASE_URL` before loading `frontend/js/api.js`.

## Frontend Pages

- `frontend/pages/phase1_dashboard.html`
- `frontend/pages/admin_legal_categories.html`
- `frontend/pages/lawyer_availability_slots.html`

The UI uses plain HTML, CSS, and JavaScript with a responsive legal-tech dashboard style.

## Not Included In Phase 1

- Login/register
- Full lawyer CRUD
- Payment integrations
- Email/SMS integrations
- AI integrations
- PDF generation
- Digital signing
