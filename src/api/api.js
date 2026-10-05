const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  })

  const text = await response.text()
  let data = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    if (data && typeof data === 'object') {
      const validationMessage = Object.values(data).find(Boolean)
      throw new Error(data.message || validationMessage || 'Ocurrió un error')
    }

    throw new Error(typeof data === 'string' && data ? data : 'Ocurrió un error')
  }

  return data
}

export const api = {
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password })
  }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),

  getClientAccounts: () => request('/clients/me/accounts'),
  getClientProducts: (storeId) => request(`/clients/me/stores/${storeId}/products`),
  getClientCreditPlans: () => request('/clients/me/finance/credit-plans'),
  getClientPayments: () => request('/clients/me/finance/payments'),
  getStoreClients: (storeId) => request(`/stores/${storeId}/clients`),
  getStoreProducts: (storeId) => request(`/stores/${storeId}/products`),
  createPurchase: (storeId, body) => request(`/stores/${storeId}/purchases`, {
    method: 'POST',
    body: JSON.stringify(body)
  }),
  simulatePurchase: (storeId, body) => request(`/stores/${storeId}/purchases/simulate`, {
    method: 'POST',
    body: JSON.stringify(body)
  }),
  lookupClient: (storeId, documentNumber) => request(`/stores/${storeId}/clients/lookup/${encodeURIComponent(documentNumber)}`),
  createClient: (storeId, body) => request(`/stores/${storeId}/clients`, {
    method: 'POST',
    body: JSON.stringify(body)
  }),
  associateClient: (storeId, clientId, body) => request(`/stores/${storeId}/clients/${clientId}/associate`, {
    method: 'POST',
    body: JSON.stringify(body)
  }),
  updateClient: (storeId, clientId, body) => request(`/stores/${storeId}/clients/${clientId}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  }),
  updateClientStatus: (storeId, clientId, active) => request(`/stores/${storeId}/clients/${clientId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ active })
  }),

  getStoreCreditPlans: (storeId, clientId) => request(`/stores/${storeId}/finance/clients/${clientId}/credit-plans`),
  payInstallment: (storeId, installmentId, paymentDate) => request(`/stores/${storeId}/finance/installments/${installmentId}/pay`, {
    method: 'POST',
    body: JSON.stringify({ paymentDate })
  }),

  getStores: () => request('/stores'),
  createStore: (body) => request('/stores', {
    method: 'POST',
    body: JSON.stringify(body)
  }),
  updateStore: (storeId, body) => request(`/stores/${storeId}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  }),
  updateStoreStatus: (storeId, active) => request(`/stores/${storeId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ active })
  }),

  getStoreCreditPolicy: (storeId) => request(`/stores/${storeId}/credit-policy`),
  updateStoreCreditPolicy: (storeId, body) => request(`/stores/${storeId}/credit-policy`, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
}
