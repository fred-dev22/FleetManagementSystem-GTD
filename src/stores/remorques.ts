import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Remorque, TypeRemorque, StatutAdminVehicule, HistoriquePlaque } from '../types/index'

export const useRemorquesStore = defineStore('remorques', () => {
  const remorques = ref<Remorque[]>([
    {
      id: 'REM-001',
      vin: 'VIN1TR00000000001',
      plaque: '1234 TAR',
      type: 'Citerne' as TypeRemorque,
      capacite: '28000L',
      statutAdmin: 'en_service' as StatutAdminVehicule,
      tracteurId: 'TRC-001',
      tracteurPlaque: '1234 TAN',
      historiquePlayque: [],
      createdAt: '2021-01-01T00:00:00Z',
    },
    {
      id: 'REM-002',
      vin: 'VIN1TR00000000002',
      plaque: '2345 TAR',
      type: 'Citerne' as TypeRemorque,
      capacite: '30000L',
      statutAdmin: 'en_service' as StatutAdminVehicule,
      tracteurId: 'TRC-002',
      tracteurPlaque: '2345 TNR',
      historiquePlayque: [],
      createdAt: '2021-01-01T00:00:00Z',
    },
    {
      id: 'REM-003',
      vin: 'VIN1TR00000000003',
      plaque: '3456 MJN',
      type: 'Citerne' as TypeRemorque,
      capacite: '28000L',
      statutAdmin: 'en_service' as StatutAdminVehicule,
      tracteurId: undefined,
      tracteurPlaque: undefined,
      historiquePlayque: [],
      createdAt: '2021-01-01T00:00:00Z',
    },
    {
      id: 'REM-004',
      vin: 'VIN1TR00000000004',
      plaque: '4567 TNR',
      type: 'Citerne' as TypeRemorque,
      capacite: '30000L',
      statutAdmin: 'en_service' as StatutAdminVehicule,
      tracteurId: undefined,
      tracteurPlaque: undefined,
      historiquePlayque: [],
      createdAt: '2021-01-01T00:00:00Z',
    },
    {
      id: 'REM-005',
      vin: 'VIN1TR00000000005',
      plaque: '5678 TAR',
      type: 'Bâchée' as TypeRemorque,
      capacite: '28T',
      statutAdmin: 'en_service' as StatutAdminVehicule,
      tracteurId: 'TRC-003',
      tracteurPlaque: '3456 MJN',
      historiquePlayque: [],
      createdAt: '2021-01-01T00:00:00Z',
    },
    {
      id: 'REM-006',
      vin: 'VIN1TR00000000006',
      plaque: '6789 TAR',
      type: 'Bâchée' as TypeRemorque,
      capacite: '35T',
      statutAdmin: 'en_service' as StatutAdminVehicule,
      tracteurId: 'TRC-004',
      tracteurPlaque: '4567 FIA',
      historiquePlayque: [],
      createdAt: '2021-01-01T00:00:00Z',
    },
    {
      id: 'REM-007',
      vin: 'VIN1TR00000000007',
      plaque: '7890 TNR',
      type: 'Bâchée' as TypeRemorque,
      capacite: '28T',
      statutAdmin: 'en_service' as StatutAdminVehicule,
      tracteurId: undefined,
      tracteurPlaque: undefined,
      historiquePlayque: [],
      createdAt: '2021-01-01T00:00:00Z',
    },
    {
      id: 'REM-008',
      vin: 'VIN1TR00000000008',
      plaque: '8901 TAR',
      type: 'Bâchée' as TypeRemorque,
      capacite: '35T',
      statutAdmin: 'hors_service' as StatutAdminVehicule,
      tracteurId: undefined,
      tracteurPlaque: undefined,
      historiquePlayque: [],
      createdAt: '2021-01-01T00:00:00Z',
    },
    {
      id: 'REM-009',
      vin: 'VIN1TR00000000009',
      plaque: '9012 MJN',
      type: 'Plateau' as TypeRemorque,
      capacite: '40T',
      statutAdmin: 'en_service' as StatutAdminVehicule,
      tracteurId: 'TRC-005',
      tracteurPlaque: '5678 TAN',
      historiquePlayque: [],
      createdAt: '2021-01-01T00:00:00Z',
    },
    {
      id: 'REM-010',
      vin: 'VIN1TR00000000010',
      plaque: '0123 TNR',
      type: 'Plateau' as TypeRemorque,
      capacite: '40T',
      statutAdmin: 'archive' as StatutAdminVehicule,
      tracteurId: undefined,
      tracteurPlaque: undefined,
      historiquePlayque: [],
      createdAt: '2021-01-01T00:00:00Z',
    },
  ])

  // GETTERS

  const getRemorqueById = computed(() => {
    return (id: string): Remorque | undefined => {
      return remorques.value.find((r) => r.id === id)
    }
  })

  const remorquesActives = computed((): Remorque[] => {
    return remorques.value.filter((r) => r.statutAdmin === 'en_service')
  })

  const remorquesSansTracteur = computed((): Remorque[] => {
    return remorquesActives.value.filter((r) => !r.tracteurId)
  })

  // ACTIONS

  function createRemorque(payload: Omit<Remorque, 'id' | 'historiquePlayque'>): Remorque {
    const vinExists = remorques.value.some((r) => r.vin === payload.vin)
    if (vinExists) {
      throw new Error(`Un remorque avec le VIN "${payload.vin}" existe déjà.`)
    }

    const existingIds = remorques.value
      .map((r) => r.id)
      .filter((id) => id.startsWith('REM-'))
      .map((id) => parseInt(id.replace('REM-', ''), 10))
      .filter((n) => !isNaN(n))

    const nextNumber = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1
    const newId = `REM-${String(nextNumber).padStart(3, '0')}`

    const newRemorque: Remorque = {
      ...payload,
      id: newId,
      historiquePlayque: [],
      createdAt: new Date().toISOString(),
    }

    remorques.value.push(newRemorque)
    return newRemorque
  }

  function updateRemorque(id: string, payload: Partial<Omit<Remorque, 'id' | 'historiquePlayque'>>): void {
    const index = remorques.value.findIndex((r) => r.id === id)
    if (index === -1) {
      throw new Error(`Remorque avec l'ID "${id}" introuvable.`)
    }
    remorques.value[index] = { ...remorques.value[index]!, ...payload } as Remorque
  }

  function changerPlaque(id: string, nouvellePlaque: string): void {
    const index = remorques.value.findIndex((r) => r.id === id)
    if (index === -1) {
      throw new Error(`Remorque avec l'ID "${id}" introuvable.`)
    }

    const remorque = remorques.value[index]!
    const entreeHistorique: HistoriquePlaque = {
      anciennePlaque: remorque.plaque,
      nouvellePlaque,
      dateChangement: new Date().toISOString(),
      parUserId: 'system',
    }

    remorques.value[index] = {
      ...remorque!,
      plaque: nouvellePlaque,
      historiquePlayque: [...(remorque.historiquePlayque ?? []), entreeHistorique],
    }
  }

  function archiverRemorque(id: string): void {
    const index = remorques.value.findIndex((r) => r.id === id)
    if (index === -1) {
      throw new Error(`Remorque avec l'ID "${id}" introuvable.`)
    }
    remorques.value[index] = {
      ...remorques.value[index]!,
      statutAdmin: 'archive' as StatutAdminVehicule,
    }
  }

  function assignerTracteur(id: string, tracteurId: string, tracteurPlaque: string): void {
    const index = remorques.value.findIndex((r) => r.id === id)
    if (index === -1) {
      throw new Error(`Remorque avec l'ID "${id}" introuvable.`)
    }
    remorques.value[index] = {
      ...remorques.value[index]!,
      tracteurId,
      tracteurPlaque,
    }
  }

  function desassignerTracteur(id: string): void {
    const index = remorques.value.findIndex((r) => r.id === id)
    if (index === -1) {
      throw new Error(`Remorque avec l'ID "${id}" introuvable.`)
    }
    remorques.value[index] = {
      ...remorques.value[index]!,
      tracteurId: undefined,
      tracteurPlaque: undefined,
    }
  }

  return {
    // state
    remorques,
    // getters
    getRemorqueById,
    remorquesActives,
    remorquesSansTracteur,
    // actions
    createRemorque,
    updateRemorque,
    changerPlaque,
    archiverRemorque,
    assignerTracteur,
    desassignerTracteur,
  }
})
