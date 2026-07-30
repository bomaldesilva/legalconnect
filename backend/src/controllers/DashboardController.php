<?php

declare(strict_types=1);

class DashboardController
{
    public function __construct(
        private LegalCategory $categories,
        private AvailabilitySlot $slots,
        private ConsultationPackage $packages,
        private Appointment $appointments,
        private Payment $payments
    ) {
    }

    public function index(): void
    {
        Response::success([
            'active_legal_categories' => $this->categories->activeCount(),
            'available_slots' => $this->slots->availableCount(),
            'active_packages' => $this->packages->activeCount(),
            'open_appointments' => $this->appointments->pendingCount(),
            'paid_payments' => $this->payments->paidCount(),
        ], 'Dashboard metrics loaded.');
    }
}
