import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthUser, UserRole } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const user      = ref<AuthUser | null>(null)
  const isLoggedIn = ref(false)

  const role         = computed<UserRole | null>(() => user.value?.role ?? null)
  const isAdmin      = computed(() => user.value?.role === 'admin')
  const isRH         = computed(() => user.value?.role === 'rh')
  const isOperations = computed(() => user.value?.role === 'operations')
  const isMaintenance = computed(() => user.value?.role === 'maintenance')
  const isChauffeur  = computed(() => user.value?.role === 'chauffeur')

  // Côté "administration" (accès aux modules RH + Flotte selon droits)
  const isHRSide = computed(() =>
    user.value?.role === 'admin' ||
    user.value?.role === 'rh' ||
    user.value?.role === 'operations' ||
    user.value?.role === 'maintenance'
  )
  // Côté "employé" = espace personnel uniquement
  const isEmployeeSide = computed(() => user.value?.role === 'chauffeur')
  const isValidator = computed(() => false) // plus de rôle validator
  const isHRAdmin   = computed(() => user.value?.role === 'admin' || user.value?.role === 'rh')
  const isHRDirector = computed(() => user.value?.role === 'admin')

  function login(selectedRole: UserRole, email: string) {
    const users: Record<UserRole, AuthUser> = {
      admin: {
        id: 'emp-001', name: 'Gary Ellis', initials: 'GE', role: 'admin', email,
        entityId: 'e1', entityName: 'Direction Générale',
      },
      rh: {
        id: 'emp-002', name: 'Sariaka Bezandry', initials: 'SB', role: 'rh', email,
        entityId: 'e2', entityName: 'Direction RH',
      },
      operations: {
        id: 'emp-008', name: 'Kumar Gunness', initials: 'KG', role: 'operations', email,
        entityId: 'e8', entityName: 'Direction des Opérations',
      },
      maintenance: {
        id: 'emp-009', name: 'Morad Cassam', initials: 'MC', role: 'maintenance', email,
        entityId: 'e9', entityName: 'Service Maintenance',
      },
      chauffeur: {
        id: 'emp-010', name: 'Thierry Randriamanga', initials: 'TR', role: 'chauffeur', email,
        entityId: 'e10', entityName: 'Service Opérations',
      },
      employee: {
        id: 'emp-017', name: 'Amélie Ravel', initials: 'AR', role: 'employee', email,
        entityId: 'e3', entityName: 'Personnel',
      },
      hr_admin: {
        id: 'emp-003', name: 'HR Admin', initials: 'HA', role: 'hr_admin', email,
        entityId: 'e2', entityName: 'Direction RH',
      },
      hr_director: {
        id: 'emp-004', name: 'HR Director', initials: 'HD', role: 'hr_director', email,
        entityId: 'e2', entityName: 'Direction RH',
      },
      validator: {
        id: 'emp-005', name: 'Validator', initials: 'VA', role: 'validator', email,
        entityId: 'e2', entityName: 'Direction RH',
      },
    }
    user.value      = users[selectedRole]
    isLoggedIn.value = true
  }

  function logout() {
    user.value       = null
    isLoggedIn.value = false
  }

  return {
    user, isLoggedIn, role,
    isAdmin, isRH, isOperations, isMaintenance, isChauffeur,
    isHRSide, isEmployeeSide, isValidator, isHRAdmin, isHRDirector,
    login, logout,
  }
})
