const API_BASE_URL = window.LEGALCONNECT_API_BASE_URL
  || `${window.location.origin}/legalConnect/backend/public/api`;

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({
    success: false,
    message: 'Invalid server response.',
  }));

  if (!response.ok || payload.success === false) {
    const error = new Error(payload.message || 'Request failed.');
    error.status = response.status;
    error.errors = payload.errors || {};
    throw error;
  }

  return payload.data;
}

function jsonOptions(method, data) {
  return {
    method,
    body: JSON.stringify(data),
  };
}

const legalCategories = {
  list: () => request('/legal-categories'),
  get: (id) => request(`/legal-categories/${id}`),
  create: (data) => request('/legal-categories', jsonOptions('POST', data)),
  update: (id, data) => request(`/legal-categories/${id}`, jsonOptions('PUT', data)),
  delete: (id) => request(`/legal-categories/${id}`, { method: 'DELETE' }),
};

const availabilitySlots = {
  list: () => request('/availability-slots'),
  get: (id) => request(`/availability-slots/${id}`),
  create: (data) => request('/availability-slots', jsonOptions('POST', data)),
  update: (id, data) => request(`/availability-slots/${id}`, jsonOptions('PUT', data)),
  delete: (id) => request(`/availability-slots/${id}`, { method: 'DELETE' }),
};

const consultationPackages = {
  list: () => request('/consultation-packages'),
  get: (id) => request(`/consultation-packages/${id}`),
  create: (data) => request('/consultation-packages', jsonOptions('POST', data)),
  update: (id, data) => request(`/consultation-packages/${id}`, jsonOptions('PUT', data)),
  delete: (id) => request(`/consultation-packages/${id}`, { method: 'DELETE' }),
};

const appointmentsApi = {
  list: () => request('/appointments'),
  get: (id) => request(`/appointments/${id}`),
  create: (data) => request('/appointments', jsonOptions('POST', data)),
  update: (id, data) => request(`/appointments/${id}`, jsonOptions('PUT', data)),
  delete: (id) => request(`/appointments/${id}`, { method: 'DELETE' }),
};

const paymentsApi = {
  list: () => request('/payments'),
  get: (id) => request(`/payments/${id}`),
  create: (data) => request('/payments', jsonOptions('POST', data)),
  update: (id, data) => request(`/payments/${id}`, jsonOptions('PUT', data)),
  delete: (id) => request(`/payments/${id}`, { method: 'DELETE' }),
};

const dashboardApi = {
  metrics: () => request('/dashboard'),
};

window.legalCategories = legalCategories;
window.availabilitySlots = availabilitySlots;
window.consultationPackages = consultationPackages;
window.appointmentsApi = appointmentsApi;
window.paymentsApi = paymentsApi;
window.dashboardApi = dashboardApi;
