<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/core/ValidationException.php';
require_once __DIR__ . '/../src/core/Request.php';
require_once __DIR__ . '/../src/core/Response.php';
require_once __DIR__ . '/../src/core/Validator.php';

require_once __DIR__ . '/../src/models/LegalCategory.php';
require_once __DIR__ . '/../src/models/AvailabilitySlot.php';
require_once __DIR__ . '/../src/models/ConsultationPackage.php';
require_once __DIR__ . '/../src/models/Appointment.php';
require_once __DIR__ . '/../src/models/Payment.php';

require_once __DIR__ . '/../src/services/LegalCategoryService.php';
require_once __DIR__ . '/../src/services/AvailabilitySlotService.php';
require_once __DIR__ . '/../src/services/ConsultationPackageService.php';
require_once __DIR__ . '/../src/services/AppointmentService.php';
require_once __DIR__ . '/../src/services/PaymentService.php';
