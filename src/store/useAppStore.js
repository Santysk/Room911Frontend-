// src/store/useAppStore.js
import { create } from 'zustand'
import { persist as makePersist } from './persist'
import { newEmployee } from '../types/models'
import {
  defaultAdminUsers,
  employeeSessionEntry, // se usará como fallback/local
  accessLogEntry,      // idem (para cache local de últimos accesos)
} from '../types/models'
import { api } from '../lib/api'   // ⬅️ Cliente HTTP al backend

// Persistencias locales (cache/UI)
const p = {
  admins: makePersist('admins', defaultAdminUsers),
  employees: makePersist('employees', []),            // cache lista empleados
  accessLogs: makePersist('accessLogs', []),          // cache últimos logs (solo para mostrar)
  session: makePersist('session', null),              // { username, role } admin

  employeeSessions: makePersist('employeeSessions', []),        // cache opcional
  employeeSessionActive: makePersist('employeeSessionActive', null), // { employeeId, sessionId }
}

export const useAppStore = create((set, get) => ({
  // ===== Estado inicial (desde cache) =====
  admins: p.admins.load(),
  employees: p.employees.load(),
  accessLogs: p.accessLogs.load(),
  session: p.session.load(),

  employeeSessions: p.employeeSessions.load(),
  employeeSessionActive: p.employeeSessionActive.load(),

  // =========================================================
  //                     AUTH (ADMIN)
  // =========================================================
  // Ahora es async: pega al backend /api/auth/admin
  login: async (username, password) => {
    try {
      const { token, user } = await api.adminLogin(username, password)
      // Si más adelante activas JWT, ya guardamos el token:
      localStorage.setItem('room911_token', token)
      p.session.save(user)
      set({ session: user })
      return true
    } catch (e) {
      console.error('login admin error', e)
      return false
    }
  },
  logout: () => {
    localStorage.removeItem('room911_token')
    p.session.save(null)
    set({ session: null })
  },

  // =========================================================
  //                     EMPLEADOS (CRUD)
  // =========================================================
  // Traer lista desde backend y cachearla
  loadEmployees: async () => {
    const list = await api.employeesList()
    p.employees.save(list)
    set({ employees: list })
  },

  addEmployee: async (payload) => {
    // payload puede venir de newEmployee() + datos del form
    const created = await api.employeeCreate(payload)
    const updated = [created, ...get().employees]
    p.employees.save(updated)
    set({ employees: updated })
  },

  updateEmployee: async (id, patch) => {
    const updatedEmp = await api.employeeUpdate(id, patch)
    const updated = get().employees.map(e => e.id === id ? updatedEmp : e)
    p.employees.save(updated)
    set({ employees: updated })
  },

  removeEmployee: async (id) => {
    await api.employeeDelete(id)
    const updated = get().employees.filter(e => e.id !== id)
    p.employees.save(updated)
    set({ employees: updated })
  },

  // Importación masiva local (si sigues usando CSV local):
  bulkImportEmployees: async (list) => {
    // OJO: si quieres que también se cree en backend, deberías iterar y llamar api.employeeCreate por cada uno.
    const current = get().employees
    const updated = [...current, ...list]
    p.employees.save(updated)
    set({ employees: updated })
  },

  // =========================================================
  //                 BITÁCORA ACCESOS (Simulador)
  // =========================================================
  // Registra intento de acceso EN EL BACKEND y actualiza cache local “accessLogs”
  simulateAccessForEmployee: async (employeeId) => {
    const emp = get().employees.find(e => e.id === employeeId)
    if (!emp) return { ok: false, reason: 'NOT_FOUND' }

    try {
      const { status, log } = await api.simulateAccess(emp.internalId)
      // cache local para “Últimos accesos simulados” (UI)
      const accessLogs = [log, ...get().accessLogs]
      p.accessLogs.save(accessLogs)
      set({ accessLogs })
      return { ok: true, status, log }
    } catch (e) {
      console.error('simulateAccessForEmployee error', e)
      // Fallback local si el backend falla (opcional):
      const status = emp.hasRoomAccess ? 'GRANTED' : 'DENIED'
      const log = accessLogEntry(status, emp.internalId, emp)
      const accessLogs = [log, ...get().accessLogs]
      p.accessLogs.save(accessLogs)
      set({ accessLogs })
      return { ok: true, status, log, offline: true }
    }
  },

  // Cargar logs paginados/filtrados directamente del backend para /admin/sessions
  loadAccessLogs: async (filters) => {
    // Devuelve Page<AccessLog>: { content, totalElements, totalPages, number, size, ... }
    return api.accessLogs(filters)
  },

  // =========================================================
  //                       SESIONES
  // =========================================================
  // === Portal empleado (autogestión por internalId) ===
  employeeLoginByInternalId: async (internalId) => {
    try {
      const res = await api.employeeStart(internalId) // { ok, resumed, employee, session }
      // guardamos quién está activo en el portal (para tu ProtectedRouteEmployee)
      if (res.ok && res.session && res.employee) {
        p.employeeSessionActive.save({ employeeId: res.employee.id, sessionId: res.session.id })
        set({ employeeSessionActive: { employeeId: res.employee.id, sessionId: res.session.id } })
      }
      return res
    } catch (e) {
      console.error('employeeLoginByInternalId error', e)
      // Fallback local para no romper flujo offline:
      const emp = get().employees.find(e => e.internalId === internalId)
      if (!emp) return { ok: false, reason: 'NOT_FOUND' }
      const active = get().employeeSessionActive
      if (active?.employeeId === emp.id) return { ok: true, employee: emp, resumed: true }
      const session = employeeSessionEntry({ employee: emp })
      const sessions = [session, ...get().employeeSessions]
      p.employeeSessions.save(sessions)
      p.employeeSessionActive.save({ employeeId: emp.id, sessionId: session.id })
      set({ employeeSessions: sessions, employeeSessionActive: { employeeId: emp.id, sessionId: session.id } })
      return { ok: true, employee: emp, resumed: false, session, offline: true }
    }
  },

  // El propio empleado finaliza su conexión activa (sin argumentos, como ya usas)
  employeeEndSession: async () => {
    const active = get().employeeSessionActive
    if (!active) return false

    try {
      // Necesitamos el internalId para el endpoint /api/auth/employee/end
      const emp = get().employees.find(e => e.id === active.employeeId)
      if (!emp?.internalId) throw new Error('INTERNAL_ID_NOT_FOUND')
      await api.employeeEnd(emp.internalId)
      // limpiar estado local
      p.employeeSessionActive.save(null)
      set({ employeeSessionActive: null })
      return true
    } catch (e) {
      console.error('employeeEndSession error', e)
      // Fallback local (marca endedAt en la sesión almacenada)
      const sessions = get().employeeSessions.map(s =>
        s.id === active.sessionId ? { ...s, endedAt: Date.now() } : s
      )
      p.employeeSessions.save(sessions)
      p.employeeSessionActive.save(null)
      set({ employeeSessions: sessions, employeeSessionActive: null })
      return true
    }
  },

  // === Consultas de sesiones ===
  // Ahora devuelve una PROMESA (array desde backend). Úsalo con await en los componentes.
  sessionsByEmployeeId: async (employeeId) => {
    try {
      return await api.sessionsByEmployee(employeeId)
    } catch {
      // Fallback a cache local si falla backend
      return get().employeeSessions.filter(s => s.employeeId === employeeId)
    }
  },

  // (opcional KPI) sesiones activas
  sessionsActiveLoad: async () => {
    try {
      return await api.sessionsActive()
    } catch {
      // Fallback: deriva desde cache local
      return get().employeeSessions.filter(s => !s.endedAt)
    }
  },

  // === Acciones “admin” sobre sesiones (opcionales) ===
  // Si no usas los endpoints /api/sessions/start & /end/{id}, dejamos fallback local.
  adminStartSessionForEmployee: async (employeeId) => {
    const emp = get().employees.find(e => e.id === employeeId)
    if (!emp) return { ok: false, reason: 'NOT_FOUND' }

    try {
      // Si tienes el endpoint activo, descomenta:
      // const s = await api.sessionsStart({ employeeId: emp.id, internalId: emp.internalId, employeeName: `${emp.firstName} ${emp.lastName}` })
      // return { ok: true, session: s }

      // Fallback local:
      const alreadyOpen = get().employeeSessions.some(s => s.employeeId === emp.id && !s.endedAt)
      if (alreadyOpen) return { ok: false, reason: 'ALREADY_OPEN' }
      const session = employeeSessionEntry({ employee: emp })
      const updated = [session, ...get().employeeSessions]
      p.employeeSessions.save(updated)
      set({ employeeSessions: updated })
      return { ok: true, session, offline: true }
    } catch (e) {
      console.error('adminStartSessionForEmployee error', e)
      return { ok: false }
    }
  },

  adminEndSessionForEmployee: async (employeeId) => {
    try {
      // Con backend: necesitas conocer el sessionId activo para ese empleado
      // const activeList = await api.sessionsByEmployee(employeeId)
      // const open = activeList.find(s => !s.endedAt)
      // if (!open) return { ok: false, reason: 'NO_OPEN' }
      // await api.sessionsEnd(open.id)
      // return { ok: true }

      // Fallback local:
      const sessions = get().employeeSessions
      const openIdx = sessions.findIndex(s => s.employeeId === employeeId && !s.endedAt)
      if (openIdx === -1) return { ok: false, reason: 'NO_OPEN' }
      const updated = sessions.map((s, i) => i === openIdx ? { ...s, endedAt: Date.now() } : s)
      p.employeeSessions.save(updated)
      set({ employeeSessions: updated })
      return { ok: true, session: updated[openIdx], offline: true }
    } catch (e) {
      console.error('adminEndSessionForEmployee error', e)
      return { ok: false }
    }
  },

  // =========================================================
  //                     UTIL / COMPAT
  // =========================================================
  // Conservamos por si alguna parte de tu UI lo usaba directamente:
  recordAccessAttempt: (log) => {
    const accessLogs = [log, ...get().accessLogs]
    p.accessLogs.save(accessLogs)
    set({ accessLogs })
  },
}))
