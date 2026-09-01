import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Tracteur,
  StatutAdminVehicule,
  StatutOperationnelVehicule,
  HistoriquePlaque,
  GpsPosition,
} from '../types/index'

// ── Mock data ────────────────────────────────────────────────────

const mockTracteurs: Tracteur[] = [
  {
    id: 'TRC-001',
    typeVehicule: 'tracteur',
    vin: 'YV2RT40A4SB123456',
    plaque: '1234 TAN',
    marque: 'Volvo',
    modele: 'FH 460',
    dateMiseEnCirculation: '2018-03-15',
    statutAdmin: 'en_service',
    statutOp: 'en_mouvement',
    chauffeurId: 'emp-010',
    chauffeurNom: 'Thierry Randriamanga',
    remorqueId: 'REM-003',
    remorquePlaque: '5678 TNR',
    kilometrage: 312450,
    niveauCarburant: 72,
    historiquePlayque: [],
    position: { lat: -18.8792, lng: 47.5079, vitesse: 45, cap: 90, horodatage: '2026-06-29T08:00:00Z' },
    createdAt: '2021-06-10T08:00:00Z',
  },
  {
    id: 'TRC-002',
    typeVehicule: 'tracteur',
    vin: 'WDB9634031L234567',
    plaque: '2345 TNR',
    marque: 'Mercedes',
    modele: 'Actros 1845',
    dateMiseEnCirculation: '2019-07-22',
    statutAdmin: 'en_service',
    statutOp: 'arrete',
    chauffeurId: 'emp-011',
    chauffeurNom: 'Fiona Mungroo',
    kilometrage: 198700,
    niveauCarburant: 55,
    historiquePlayque: [],
    position: { lat: -18.9333, lng: 48.2000, vitesse: 0, cap: 0, horodatage: '2026-06-29T08:05:00Z' },
    createdAt: '2021-09-14T09:30:00Z',
  },
  {
    id: 'TRC-003',
    typeVehicule: 'tracteur',
    vin: 'WMAN63ZZ5KM345678',
    plaque: '3456 MJN',
    marque: 'MAN',
    modele: 'TGX 18.500',
    dateMiseEnCirculation: '2020-01-08',
    statutAdmin: 'en_service',
    statutOp: 'allume_immobile',
    chauffeurId: 'emp-012',
    chauffeurNom: 'Nadia Oozeer',
    remorqueId: 'REM-007',
    remorquePlaque: '9012 MJN',
    kilometrage: 145230,
    niveauCarburant: 88,
    historiquePlayque: [],
    position: { lat: -18.1492, lng: 49.4023, vitesse: 5, cap: 270, horodatage: '2026-06-29T07:50:00Z' },
    createdAt: '2022-01-20T07:00:00Z',
  },
  {
    id: 'TRC-004',
    typeVehicule: 'tracteur',
    vin: 'YS2R4X20003456789',
    plaque: '4567 FIA',
    marque: 'Scania',
    modele: 'R 500',
    dateMiseEnCirculation: '2017-11-30',
    statutAdmin: 'en_service',
    statutOp: 'en_mouvement',
    chauffeurId: 'emp-020',
    chauffeurNom: 'Randrianarisoa Serge',
    kilometrage: 478900,
    niveauCarburant: 41,
    historiquePlayque: [
      {
        anciennePlaque: '1111 TAN',
        nouvellePlaque: '4567 FIA',
        dateChangement: '2023-04-01T10:00:00Z',
        parUserId: 'USR-001',
      },
    ],
    position: { lat: -19.8667, lng: 47.0333, vitesse: 60, cap: 45, horodatage: '2026-06-29T08:10:00Z' },
    createdAt: '2020-03-05T11:00:00Z',
  },
  {
    id: 'TRC-005',
    typeVehicule: 'tracteur',
    vin: 'XLR0T69XZE4567890',
    plaque: '5678 TAN',
    marque: 'DAF',
    modele: 'XF 480',
    dateMiseEnCirculation: '2021-05-17',
    statutAdmin: 'en_service',
    statutOp: 'signal_perdu',
    kilometrage: 87650,
    niveauCarburant: 10,
    historiquePlayque: [],
    position: { lat: -18.5500, lng: 48.4000, vitesse: 0, cap: 0, horodatage: '2026-06-25T10:00:00Z' },
    createdAt: '2022-06-01T08:00:00Z',
  },
  {
    id: 'TRC-006',
    typeVehicule: 'tracteur',
    vin: 'WDB9634031L567891',
    plaque: '6789 TNR',
    marque: 'Mercedes',
    modele: 'Actros 2545',
    dateMiseEnCirculation: '2016-08-12',
    statutAdmin: 'en_service',
    statutOp: 'arrete',
    chauffeurId: 'emp-021',
    chauffeurNom: 'Rakotondrabe Fidy',
    remorqueId: 'REM-008',
    remorquePlaque: '8901 TAR',
    kilometrage: 389200,
    niveauCarburant: 63,
    historiquePlayque: [],
    position: { lat: -19.0167, lng: 47.5333, vitesse: 0, cap: 180, horodatage: '2026-06-29T07:30:00Z' },
    createdAt: '2020-10-15T09:00:00Z',
  },
  {
    id: 'TRC-007',
    typeVehicule: 'tracteur',
    vin: 'YV2RT40A4SB678912',
    plaque: '7890 TAN',
    marque: 'Volvo',
    modele: 'FM 420',
    dateMiseEnCirculation: '2015-04-20',
    statutAdmin: 'hors_service',
    kilometrage: 521000,
    niveauCarburant: 25,
    historiquePlayque: [],
    createdAt: '2019-11-08T10:00:00Z',
  },
  {
    id: 'TRC-008',
    typeVehicule: 'tracteur',
    vin: 'WMAN63ZZ5KM789123',
    plaque: '8901 MJN',
    marque: 'MAN',
    modele: 'TGS 26.440',
    dateMiseEnCirculation: '2015-09-03',
    statutAdmin: 'archive',
    kilometrage: 612300,
    niveauCarburant: 0,
    historiquePlayque: [],
    createdAt: '2019-04-22T08:00:00Z',
  },
]

// ── Store ────────────────────────────────────────────────────────

export const useTracteurStore = defineStore('tracteurs', () => {
  // ── State ──────────────────────────────────────────────────────
  const tracteurs = ref<Tracteur[]>(mockTracteurs)

  // ── Getters ────────────────────────────────────────────────────
  const getTracteurById = computed(() => (id: string): Tracteur | undefined =>
    tracteurs.value.find(t => t.id === id)
  )

  const tracteurActifs = computed(() =>
    tracteurs.value.filter(t => t.statutAdmin === 'en_service')
  )

  const tracteursSansCharuffeur = computed(() =>
    tracteurActifs.value.filter(t => !t.chauffeurId)
  )

  const tracteursSansRemorque = computed(() =>
    tracteurActifs.value.filter(t => !t.remorqueId)
  )

  // ── Helper ─────────────────────────────────────────────────────
  function _generateId(): string {
    const existing = tracteurs.value
      .map(t => parseInt(t.id.replace('TRC-', ''), 10))
      .filter(n => !isNaN(n))
    const max = existing.length > 0 ? Math.max(...existing) : 0
    return `TRC-${String(max + 1).padStart(3, '0')}`
  }

  // ── Actions ────────────────────────────────────────────────────

  function createTracteur(
    payload: Omit<Tracteur, 'id' | 'statutAdmin' | 'createdAt' | 'historiquePlayque'>
  ): Tracteur {
    const vinExists = tracteurs.value.some(t => t.vin === payload.vin)
    if (vinExists) throw new Error(`VIN "${payload.vin}" est déjà utilisé.`)

    const newTracteur: Tracteur = {
      ...payload,
      id: _generateId(),
      statutAdmin: 'en_service',
      historiquePlayque: [],
      createdAt: new Date().toISOString(),
    }
    tracteurs.value.push(newTracteur)
    return newTracteur
  }

  function updateTracteur(id: string, payload: Partial<Omit<Tracteur, 'id' | 'createdAt'>>): void {
    const idx = tracteurs.value.findIndex(t => t.id === id)
    if (idx === -1) throw new Error(`Tracteur "${id}" introuvable.`)
    tracteurs.value[idx] = { ...tracteurs.value[idx]!, ...payload } as Tracteur
  }

  function changerPlaque(id: string, nouvellePlaque: string, parUserId = 'system'): void {
    const idx = tracteurs.value.findIndex(t => t.id === id)
    if (idx === -1) throw new Error(`Tracteur "${id}" introuvable.`)

    const tracteur = tracteurs.value[idx]!
    const entree: HistoriquePlaque = {
      anciennePlaque: tracteur.plaque,
      nouvellePlaque,
      dateChangement: new Date().toISOString(),
      parUserId,
    }

    tracteurs.value[idx] = {
      ...tracteur,
      plaque: nouvellePlaque,
      historiquePlayque: [...(tracteur.historiquePlayque ?? []), entree],
    } as Tracteur
  }

  function archiverTracteur(id: string): void {
    const idx = tracteurs.value.findIndex(t => t.id === id)
    if (idx === -1) throw new Error(`Tracteur "${id}" introuvable.`)

    const tracteur = tracteurs.value[idx]!
    tracteurs.value[idx] = {
      ...tracteur,
      statutAdmin: 'archive',
      statutOp: undefined,
      chauffeurId: undefined,
      chauffeurNom: undefined,
      remorqueId: undefined,
      remorquePlaque: undefined,
    } as Tracteur
  }

  function updateStatutOp(id: string, statut: StatutOperationnelVehicule): void {
    const idx = tracteurs.value.findIndex(t => t.id === id)
    if (idx === -1) throw new Error(`Tracteur "${id}" introuvable.`)
    tracteurs.value[idx] = { ...tracteurs.value[idx]!, statutOp: statut } as Tracteur
  }

  function updatePosition(id: string, position: GpsPosition): void {
    const idx = tracteurs.value.findIndex(t => t.id === id)
    if (idx === -1) throw new Error(`Tracteur "${id}" introuvable.`)

    const vitesse = position.vitesse ?? 0
    let statutOp: StatutOperationnelVehicule
    if (vitesse > 5) {
      statutOp = 'en_mouvement'
    } else if (vitesse > 0) {
      statutOp = 'allume_immobile'
    } else {
      statutOp = 'arrete'
    }

    tracteurs.value[idx] = { ...tracteurs.value[idx]!, position, statutOp } as Tracteur
  }

  function assignerChauffeur(id: string, chauffeurId: string, chauffeurNom: string): void {
    const idx = tracteurs.value.findIndex(t => t.id === id)
    if (idx === -1) throw new Error(`Tracteur "${id}" introuvable.`)
    tracteurs.value[idx] = { ...tracteurs.value[idx]!, chauffeurId, chauffeurNom } as Tracteur
  }

  function desassignerChauffeur(id: string): void {
    const idx = tracteurs.value.findIndex(t => t.id === id)
    if (idx === -1) throw new Error(`Tracteur "${id}" introuvable.`)
    const tracteur = tracteurs.value[idx]!
    tracteurs.value[idx] = {
      ...tracteur,
      chauffeurId: undefined,
      chauffeurNom: undefined,
    } as Tracteur
  }

  return {
    // state
    tracteurs,
    // getters
    getTracteurById,
    tracteurActifs,
    tracteursSansCharuffeur,
    tracteursSansRemorque,
    // actions
    createTracteur,
    updateTracteur,
    changerPlaque,
    archiverTracteur,
    updateStatutOp,
    updatePosition,
    assignerChauffeur,
    desassignerChauffeur,
  }
})