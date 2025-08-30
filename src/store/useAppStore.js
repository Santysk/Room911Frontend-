import { create } from 'zustand'
import { persist as makePersist } from './persist'
import {
  defaultAdminUsers,
  employeeSessionEntry,
  accessLogEntry, // ⬅️ IMPORTANTE: usa tu helper real de models.js
} from '../types/models'

const p = {
  admins: makePersist('admins', defaultAdminUsers),
  employees: makePersist('employees', []),
  accessLogs: makePersist('accessLogs', []),
  session: makePersist('session', null),

  // Persistencias para portal empleado
  employeeSessions: makePersist('employeeSessions', []),
  // { employeeId, sessionId } cuando el empleado inicia su portal
  employeeSessionActive: makePersist('employeeSessionActive', null),
}

export const useAppStore = create((set, get) => ({
  // ===== Estado inicial =====
  admins: p.admins.load(),
  employees: p.employees.load(),
  accessLogs: p.accessLogs.load(),
  session: p.session.load(),

  employeeSessions: p.employeeSessions.load(),
  employeeSessionActive: p.employeeSessionActive.load(),

  // ===== ADMIN AUTH =====
  login: (username, password) => {
    const user = get().admins.find(u => u.username === username && u.password === password)
    if (!user) return false
    const session = { username: user.username, role: user.role }
    p.session.save(session)
    set({ session })
    return true
  },
  logout: () => { p.session.save(null); set({ session: null }) },

  // ===== EMPLEADOS (CRUD) =====
  addEmployee: (emp) => {
    const employees = [...get().employees, emp]
    p.employees.save(employees)
    set({ employees })
  },
  updateEmployee: (id, patch) => {
    const employees = get().employees.map(e => e.id === id ? { ...e, ...patch } : e)
    p.employees.save(employees)
    set({ employees })
  },
  removeEmployee: (id) => {
    const employees = get().employees.filter(e => e.id !== id)
    p.employees.save(employees)
    set({ employees })
  },
  bulkImportEmployees: (list) => {
    const employees = [...get().employees, ...list]
    p.employees.save(employees)
    set({ employees })
  },

  // ===== BITÁCORA ACCESOS (opcional, por si la usabas en otra parte) =====
  recordAccessAttempt: (log) => {
    const accessLogs = [log, ...get().accessLogs]
    p.accessLogs.save(accessLogs)
    set({ accessLogs })
  },

  // ===== SIMULADOR: ACCESOS =====
  simulateAccessForEmployee: (employeeId) => {
    const emp = get().employees.find(e => e.id === employeeId)
    if (!emp) return { ok: false, reason: 'NOT_FOUND' }

    // Según tu models.js, usamos estos status:
    // 'GRANTED' | 'DENIED' | 'NOT_REGISTERED'
    const status = emp.hasRoomAccess ? 'GRANTED' : 'DENIED'
    const log = accessLogEntry(status, emp.internalId, emp)

    const accessLogs = [log, ...get().accessLogs]
    p.accessLogs.save(accessLogs)
    set({ accessLogs })

    return { ok: true, log, status }
  },

  // ===== SIMULADOR: SESIONES (admin) =====
  adminStartSessionForEmployee: (employeeId) => {
    const emp = get().employees.find(e => e.id === employeeId)
    if (!emp) return { ok: false, reason: 'NOT_FOUND' }

    // Evita dos sesiones abiertas a la vez para el mismo empleado
    const alreadyOpen = get().employeeSessions.some(s => s.employeeId === emp.id && !s.endedAt)
    if (alreadyOpen) return { ok: false, reason: 'ALREADY_OPEN' }

    const session = employeeSessionEntry({ employee: emp })
    const employeeSessions = [session, ...get().employeeSessions]
    p.employeeSessions.save(employeeSessions)
    set({ employeeSessions })

    return { ok: true, session }
  },

  adminEndSessionForEmployee: (employeeId) => {
    const sessions = get().employeeSessions
    const openIdx = sessions.findIndex(s => s.employeeId === employeeId && !s.endedAt)
    if (openIdx === -1) return { ok: false, reason: 'NO_OPEN' }

    const updated = sessions.map((s, i) => i === openIdx ? { ...s, endedAt: Date.now() } : s)
    p.employeeSessions.save(updated)
    set({ employeeSessions: updated })

    return { ok: true, session: updated[openIdx] }
  },

  // ===== PORTAL EMPLEADO (autogestión) =====
  // Login por Internal ID: crea sesión si no hay una activa y devuelve el empleado
  employeeLoginByInternalId: (internalId) => {
    const emp = get().employees.find(e => e.internalId === internalId)
    if (!emp) return { ok: false, reason: 'NOT_FOUND' }

    const active = get().employeeSessionActive
    if (active?.employeeId === emp.id) {
      return { ok: true, employee: emp, resumed: true }
    }

    const session = employeeSessionEntry({ employee: emp })
    const sessions = [session, ...get().employeeSessions]
    p.employeeSessions.save(sessions)
    p.employeeSessionActive.save({ employeeId: emp.id, sessionId: session.id })
    set({
      employeeSessions: sessions,
      employeeSessionActive: { employeeId: emp.id, sessionId: session.id },
    })

    return { ok: true, employee: emp, resumed: false, session }
  },

  // El propio empleado finaliza su conexión activa
  employeeEndSession: () => {
    const active = get().employeeSessionActive
    if (!active) return false

    const sessions = get().employeeSessions.map(s =>
      s.id === active.sessionId ? { ...s, endedAt: Date.now() } : s
    )
    p.employeeSessions.save(sessions)
    p.employeeSessionActive.save(null)
    set({ employeeSessions: sessions, employeeSessionActive: null })
    return true
  },

  // ===== CONSULTAS =====
  sessionsByEmployeeId: (employeeId) =>
    get().employeeSessions.filter(s => s.employeeId === employeeId),
}))
