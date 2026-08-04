<?php

declare(strict_types=1);

// ─── Core utilities ───────────────────────────────────────────────────────────
require_once __DIR__ . '/../src/core/ValidationException.php';
require_once __DIR__ . '/../src/core/Request.php';
require_once __DIR__ . '/../src/core/Response.php';
require_once __DIR__ . '/../src/core/Validator.php';

// ─── Database ─────────────────────────────────────────────────────────────────
require_once __DIR__ . '/../src/database/db_connect.php';

// ─── Models ───────────────────────────────────────────────────────────────────
require_once __DIR__ . '/../src/models/LegalCategory.php';
require_once __DIR__ . '/../src/models/AvailabilitySlot.php';
require_once __DIR__ . '/../src/models/ConsultationPackage.php';
require_once __DIR__ . '/../src/models/Appointment.php';
require_once __DIR__ . '/../src/models/Payment.php';
require_once __DIR__ . '/../src/models/LawyerProfile.php';

// ─── Services ─────────────────────────────────────────────────────────────────
require_once __DIR__ . '/../src/services/LegalCategoryService.php';
require_once __DIR__ . '/../src/services/AvailabilitySlotService.php';
require_once __DIR__ . '/../src/services/ConsultationPackageService.php';
require_once __DIR__ . '/../src/services/AppointmentService.php';
require_once __DIR__ . '/../src/services/PaymentService.php';
require_once __DIR__ . '/../src/services/LawyerProfileService.php';

// ─── Controllers ──────────────────────────────────────────────────────────────
require_once __DIR__ . '/../src/controllers/DashboardController.php';
require_once __DIR__ . '/../src/controllers/LegalCategoryController.php';
require_once __DIR__ . '/../src/controllers/AvailabilitySlotController.php';
require_once __DIR__ . '/../src/controllers/ConsultationPackageController.php';
require_once __DIR__ . '/../src/controllers/AppointmentController.php';
require_once __DIR__ . '/../src/controllers/PaymentController.php';
require_once __DIR__ . '/../src/controllers/LawyerProfileController.php';

// ─── CORS pre-flight ──────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendCorsHeaders();
    http_response_code(204);
    exit;
}

sendCorsHeaders();

// ─── Bootstrap & route ────────────────────────────────────────────────────────
try {
    $db     = getDatabaseConnection();
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $path   = normalizePath(
        parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/'
    );

    // ── Models ────────────────────────────────────────────────────────────────
    $categoryModel      = new LegalCategory($db);
    $slotModel          = new AvailabilitySlot($db);
    $packageModel       = new ConsultationPackage($db);
    $appointmentModel   = new Appointment($db);
    $paymentModel       = new Payment($db);
    $lawyerProfileModel = new LawyerProfile($db);

    // ── Services ──────────────────────────────────────────────────────────────
    $categoryService       = new LegalCategoryService($categoryModel);
    $slotService           = new AvailabilitySlotService($slotModel);
    $packageService        = new ConsultationPackageService($packageModel);
    $appointmentService    = new AppointmentService($appointmentModel);
    $paymentService        = new PaymentService($paymentModel);
    $lawyerProfileService  = new LawyerProfileService($lawyerProfileModel);

    // ── Controllers ───────────────────────────────────────────────────────────
    $dashboardController  = new DashboardController(
        $categoryModel,
        $slotModel,
        $packageModel,
        $appointmentModel,
        $paymentModel
    );
    $categoryController       = new LegalCategoryController($categoryService);
    $slotController           = new AvailabilitySlotController($slotService);
    $packageController        = new ConsultationPackageController($packageService);
    $appointmentController    = new AppointmentController($appointmentService);
    $paymentController        = new PaymentController($paymentService);
    $lawyerProfileController  = new LawyerProfileController($lawyerProfileService);

    // ── Routing ───────────────────────────────────────────────────────────────

    if ($path === '/api/dashboard' && $method === 'GET') {
        $dashboardController->index();
        exit;
    }

    if (preg_match('#^/api/legal-categories/?(\d+)?$#', $path, $matches)) {
        routeCrud($method, $matches[1] ?? null, $categoryController);
        exit;
    }

    if (preg_match('#^/api/availability-slots/?(\d+)?$#', $path, $matches)) {
        routeCrud($method, $matches[1] ?? null, $slotController);
        exit;
    }

    if (preg_match('#^/api/consultation-packages/?(\d+)?$#', $path, $matches)) {
        routeCrud($method, $matches[1] ?? null, $packageController);
        exit;
    }

    if (preg_match('#^/api/appointments/?(\d+)?$#', $path, $matches)) {
        routeCrud($method, $matches[1] ?? null, $appointmentController);
        exit;
    }

    if (preg_match('#^/api/payments/?(\d+)?$#', $path, $matches)) {
        routeCrud($method, $matches[1] ?? null, $paymentController);
        exit;
    }

    // ── Lawyer Profile routes ────────────────────────────────────────────────

    // GET /api/lawyer-profile/{id}/public
    if (preg_match('#^/api/lawyer-profile/(\d+)/public$#', $path, $matches) && $method === 'GET') {
        $lawyerProfileController->publicProfile((int) $matches[1]);
        exit;
    }

    // GET /api/lawyer-profile/{id}/categories
    if (preg_match('#^/api/lawyer-profile/(\d+)/categories$#', $path, $matches) && $method === 'GET') {
        $lawyerProfileController->listCategories((int) $matches[1]);
        exit;
    }

    // POST /api/lawyer-profile/{id}/categories
    if (preg_match('#^/api/lawyer-profile/(\d+)/categories$#', $path, $matches) && $method === 'POST') {
        $lawyerProfileController->addCategory((int) $matches[1]);
        exit;
    }

    // DELETE /api/lawyer-profile/{id}/categories/{categoryId}
    if (preg_match('#^/api/lawyer-profile/(\d+)/categories/(\d+)$#', $path, $matches) && $method === 'DELETE') {
        $lawyerProfileController->removeCategory((int) $matches[1], (int) $matches[2]);
        exit;
    }

    // GET /api/lawyer-profile/{id}
    if (preg_match('#^/api/lawyer-profile/(\d+)$#', $path, $matches) && $method === 'GET') {
        $lawyerProfileController->show((int) $matches[1]);
        exit;
    }

    // PUT /api/lawyer-profile/{id}
    if (preg_match('#^/api/lawyer-profile/(\d+)$#', $path, $matches) && $method === 'PUT') {
        $lawyerProfileController->update((int) $matches[1]);
        exit;
    }

    Response::error('Endpoint not found.', 404);

} catch (PDOException $exception) {
    Response::error('Database error. Check your connection and imported SQL.', 500);
} catch (Throwable $exception) {
    Response::error('Server error: ' . $exception->getMessage(), 500);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sendCorsHeaders(): void
{
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

function normalizePath(string $path): string
{
    $scriptName = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));

    if ($scriptName !== '/' && $scriptName !== '.' && str_starts_with($path, $scriptName)) {
        $path = substr($path, strlen($scriptName)) ?: '/';
    }

    return '/' . trim($path, '/');
}

function routeCrud(string $method, ?string $id, object $controller): void
{
    if ($id === null || $id === '') {
        match ($method) {
            'GET'  => $controller->index(),
            'POST' => $controller->store(),
            default => Response::error('Method not allowed.', 405),
        };
        return;
    }

    $numericId = (int) $id;

    match ($method) {
        'GET'    => $controller->show($numericId),
        'PUT'    => $controller->update($numericId),
        'DELETE' => $controller->destroy($numericId),
        default  => Response::error('Method not allowed.', 405),
    };
}
