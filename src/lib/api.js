// src/lib/api.js
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

async function request(path, options = {}) {
  const token = localStorage.getItem("room911_token")
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || `Error ${res.status}`)
  }
  return res.json()
}

export const api = {
  // ===== AUTH =====
  adminLogin: (username, password) =>
    request("/auth/admin", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  // ===== EMPLOYEES =====
  employeesList: () => request("/employees"),
  employeeCreate: (data) =>
    request("/employees", { method: "POST", body: JSON.stringify(data) }),
  employeeUpdate: (id, data) =>
    request(`/employees/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  employeeDelete: (id) =>
    request(`/employees/${id}`, { method: "DELETE" }),

  // ===== ACCESS SIMULATOR =====
  simulateAccess: (internalId) =>
    request(`/access/simulate/${internalId}`, { method: "POST" }),
  accessLogs: (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    return request(`/access/logs?${params}`)
  },

  // ===== EMPLOYEE PORTAL =====
  employeeStart: (internalId) =>
    request(`/auth/employee/${internalId}`, { method: "POST" }),
  employeeEnd: (internalId) =>
    request(`/auth/employee/${internalId}/end`, { method: "POST" }),

  // ===== SESSIONS =====
  sessionsByEmployee: (employeeId) =>
    request(`/sessions/by-employee/${employeeId}`),
  sessionsActive: () => request("/sessions/active"),
  sessionsStart: (data) =>
    request("/sessions/start", { method: "POST", body: JSON.stringify(data) }),
  sessionsEnd: (sessionId) =>
    request(`/sessions/end/${sessionId}`, { method: "POST" }),
}
