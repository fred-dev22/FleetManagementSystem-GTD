import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ConducteurProfil } from '../types'

export const useConduceteursProfilesStore = defineStore('conducteursProfiles', () => {
  const profils = ref<ConducteurProfil[]>([
    {
      id: 'CP-001', employeId: 'emp-010',
      numeroPermis: 'P-MG-2018-04521',
      categoriePermis: 'CE',
      dateExpirationPermis: '2026-08-15',
      dateVisiteMedicale: '2024-09-10',
      dateExpirationVisiteMedicale: '2025-09-10',
      scoreConduite: 87,
      disponible: false,
      formations: [
        { id: 'F-001', titre: 'Conduite économique', date: '2023-03-10' },
        { id: 'F-002', titre: 'Transport matières dangereuses ADR', date: '2022-11-05', dateExpiration: '2026-11-05' },
      ],
      infractions: [
        { id: 'INF-001', date: '2024-02-14', type: 'Excès de vitesse', description: '+20 km/h zone 70', gravite: 'moyen' },
      ],
      createdAt: '2021-03-15T08:00:00Z',
    },
    {
      id: 'CP-002', employeId: 'emp-011',
      numeroPermis: 'P-MG-2019-07832',
      categoriePermis: 'CE',
      dateExpirationPermis: '2027-03-22',
      dateVisiteMedicale: '2025-01-20',
      dateExpirationVisiteMedicale: '2026-01-20',
      scoreConduite: 94,
      disponible: false,
      formations: [
        { id: 'F-003', titre: 'Conduite économique', date: '2024-02-18' },
        { id: 'F-004', titre: 'Transport matières dangereuses ADR', date: '2023-06-12', dateExpiration: '2027-06-12' },
        { id: 'F-005', titre: 'Prévention des accidents', date: '2024-09-05' },
      ],
      infractions: [],
      createdAt: '2022-01-10T08:00:00Z',
    },
    {
      id: 'CP-003', employeId: 'emp-012',
      numeroPermis: 'P-MG-2020-11245',
      categoriePermis: 'C',
      dateExpirationPermis: '2025-06-30',
      dateVisiteMedicale: '2023-12-05',
      dateExpirationVisiteMedicale: '2024-12-05',
      scoreConduite: 71,
      disponible: true,
      formations: [
        { id: 'F-006', titre: 'Conduite économique', date: '2022-07-14' },
      ],
      infractions: [
        { id: 'INF-002', date: '2023-08-22', type: 'Non-respect priorité', description: 'Intersection carrefour Sud', gravite: 'faible' },
        { id: 'INF-003', date: '2024-05-10', type: 'Excès de vitesse', description: '+35 km/h zone 50', gravite: 'grave' },
      ],
      createdAt: '2022-09-01T08:00:00Z',
    },
    {
      id: 'CP-004', employeId: 'emp-020',
      numeroPermis: 'P-MG-2017-03318',
      categoriePermis: 'CE',
      dateExpirationPermis: '2026-12-10',
      dateVisiteMedicale: '2025-03-01',
      dateExpirationVisiteMedicale: '2026-03-01',
      scoreConduite: 82,
      disponible: true,
      formations: [
        { id: 'F-007', titre: 'Transport matières dangereuses ADR', date: '2024-01-15', dateExpiration: '2028-01-15' },
        { id: 'F-008', titre: 'Premiers secours', date: '2023-05-20' },
      ],
      infractions: [
        { id: 'INF-004', date: '2024-11-08', type: 'Surcharge', description: 'Poids hors norme -12%', gravite: 'moyen' },
      ],
      createdAt: '2020-03-01T08:00:00Z',
    },
  ])

  // ── Getters ─────────────────────────────────────────────────
  function getByEmployeId(employeId: string) {
    return profils.value.find(p => p.employeId === employeId)
  }

  const conducteursDisponibles = computed(() =>
    profils.value.filter(p => p.disponible)
  )

  function permisExpire(profilId: string): boolean {
    const p = profils.value.find(pr => pr.id === profilId)
    if (!p?.dateExpirationPermis) return false
    return new Date(p.dateExpirationPermis) < new Date()
  }

  function visiteMedicaleExpiree(profilId: string): boolean {
    const p = profils.value.find(pr => pr.id === profilId)
    if (!p?.dateExpirationVisiteMedicale) return false
    return new Date(p.dateExpirationVisiteMedicale) < new Date()
  }

  // ── Actions ──────────────────────────────────────────────────
  function create(data: Omit<ConducteurProfil, 'id' | 'createdAt'>) {
    profils.value.push({
      ...data,
      id:        `CP-${String(profils.value.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    })
  }

  function update(id: string, data: Partial<ConducteurProfil>) {
    const idx = profils.value.findIndex(p => p.id === id)
    if (idx !== -1) Object.assign(profils.value[idx]!, data)
  }

  function ajouterInfraction(id: string, infraction: NonNullable<ConducteurProfil['infractions']>[number]) {
    const p = profils.value.find(pr => pr.id === id)
    if (p) {
      p.infractions = [...(p.infractions ?? []), infraction]
      p.scoreConduite = Math.max(0, p.scoreConduite - (infraction.gravite === 'grave' ? 15 : infraction.gravite === 'moyen' ? 8 : 3))
    }
  }

  return {
    profils,
    getByEmployeId, conducteursDisponibles,
    permisExpire, visiteMedicaleExpiree,
    create, update, ajouterInfraction,
  }
})