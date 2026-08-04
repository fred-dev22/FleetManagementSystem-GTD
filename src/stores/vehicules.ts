import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Vehicule, StatutAdminVehicule, TypeVehicule } from '../types'

export const useVehiculesStore = defineStore('vehicules', () => {
  const vehicules = ref<Vehicule[]>([
    // ── TRACTEURS ──────────────────────────────────────────────
    {
      id: 'TRC-001', typeVehicule: 'tracteur',
      vin: 'YV2RT40A5YB123456', plaque: 'MG-7842-TX', marque: 'Volvo', modele: 'FH 460',
      annee: 2021, dateMiseEnCirculation: '2021-03-15', siteAffectation: 'Garage Central',
      typeCarburant: 'Diesel', statutAdmin: 'affecte', statutOp: 'en_mouvement',
      position: { lat: -18.8792, lng: 47.5079 }, kilometrage: 187340, niveauCarburant: 72,
      chauffeurId: 'emp-010', chauffeurNom: 'Thierry Randriamanga',
      vehiculeLieId: 'REM-001', vehiculeLiePlaque: 'MG-1100-TR',
      modeAcquisition: 'achat', coutAcquisition: 85000000, valeurResiduelle: 45000000,
      createdAt: '2021-03-15T08:00:00Z',
    },
    {
      id: 'TRC-002', typeVehicule: 'tracteur',
      vin: 'WDB9634031L123789', plaque: 'MG-3356-TX', marque: 'Mercedes', modele: 'Actros 1845',
      annee: 2020, dateMiseEnCirculation: '2020-07-22', siteAffectation: 'Dépôt Nord',
      typeCarburant: 'Diesel', statutAdmin: 'actif', statutOp: 'arrete',
      position: { lat: -18.9200, lng: 47.5350 }, kilometrage: 245780, niveauCarburant: 45,
      chauffeurId: undefined, chauffeurNom: undefined,
      vehiculeLieId: undefined, vehiculeLiePlaque: undefined,
      modeAcquisition: 'leasing', coutAcquisition: 78000000,
      createdAt: '2020-07-22T08:00:00Z',
    },
    {
      id: 'TRC-003', typeVehicule: 'tracteur',
      vin: 'WMA06XZZ1LP123456', plaque: 'MG-5671-TX', marque: 'MAN', modele: 'TGX 18.500',
      annee: 2022, dateMiseEnCirculation: '2022-01-10', siteAffectation: 'Garage Central',
      typeCarburant: 'Diesel', statutAdmin: 'affecte', statutOp: 'allume_immobile',
      position: { lat: -18.8600, lng: 47.4900 }, kilometrage: 98450, niveauCarburant: 88,
      chauffeurId: 'emp-011', chauffeurNom: 'Fiona Mungroo',
      vehiculeLieId: 'REM-003', vehiculeLiePlaque: 'MG-1102-TR',
      modeAcquisition: 'achat', coutAcquisition: 92000000, valeurResiduelle: 65000000,
      createdAt: '2022-01-10T08:00:00Z',
    },
    {
      id: 'TRC-004', typeVehicule: 'tracteur',
      vin: 'XLEP4X20004123456', plaque: 'MG-9023-TX', marque: 'Scania', modele: 'R 500',
      annee: 2019, dateMiseEnCirculation: '2019-11-05', siteAffectation: 'Dépôt Sud',
      typeCarburant: 'Diesel', statutAdmin: 'en_reparation', statutOp: 'arrete',
      position: { lat: -19.0100, lng: 47.5200 }, kilometrage: 412000, niveauCarburant: 20,
      modeAcquisition: 'achat', coutAcquisition: 72000000, valeurResiduelle: 22000000,
      createdAt: '2019-11-05T08:00:00Z',
    },
    {
      id: 'TRC-005', typeVehicule: 'tracteur',
      vin: 'XLEP4X20005654321', plaque: 'MG-4410-TX', marque: 'Scania', modele: 'R 450',
      annee: 2023, dateMiseEnCirculation: '2023-04-18', siteAffectation: 'Garage Central',
      typeCarburant: 'GNL', statutAdmin: 'actif', statutOp: 'arrete',
      position: { lat: -18.8792, lng: 47.5079 }, kilometrage: 34200, niveauCarburant: 60,
      modeAcquisition: 'leasing', coutAcquisition: 105000000,
      createdAt: '2023-04-18T08:00:00Z',
    },

    // ── REMORQUES ──────────────────────────────────────────────
    {
      id: 'REM-001', typeVehicule: 'remorque',
      plaque: 'MG-1100-TR', marque: 'Fruehauf', modele: 'Citerne P3',
      annee: 2020, dateMiseEnCirculation: '2020-05-10', siteAffectation: 'Garage Central',
      typeRemorque: 'Citerne', capacite: '28000L',
      statutAdmin: 'affecte',
      vehiculeLieId: 'TRC-001', vehiculeLiePlaque: 'MG-7842-TX',
      modeAcquisition: 'achat', coutAcquisition: 42000000, valeurResiduelle: 28000000,
      createdAt: '2020-05-10T08:00:00Z',
    },
    {
      id: 'REM-002', typeVehicule: 'remorque',
      plaque: 'MG-1101-TR', marque: 'Fruehauf', modele: 'Citerne P4',
      annee: 2021, dateMiseEnCirculation: '2021-06-20', siteAffectation: 'Dépôt Nord',
      typeRemorque: 'Citerne', capacite: '30000L',
      statutAdmin: 'actif',
      modeAcquisition: 'achat', coutAcquisition: 45000000,
      createdAt: '2021-06-20T08:00:00Z',
    },
    {
      id: 'REM-003', typeVehicule: 'remorque',
      plaque: 'MG-1102-TR', marque: 'Schmitz', modele: 'Citerne SCT',
      annee: 2022, dateMiseEnCirculation: '2022-02-14', siteAffectation: 'Garage Central',
      typeRemorque: 'Citerne', capacite: '28000L',
      statutAdmin: 'affecte',
      vehiculeLieId: 'TRC-003', vehiculeLiePlaque: 'MG-5671-TX',
      modeAcquisition: 'leasing', coutAcquisition: 48000000,
      createdAt: '2022-02-14T08:00:00Z',
    },
    {
      id: 'REM-004', typeVehicule: 'remorque',
      plaque: 'MG-1103-TR', marque: 'Schmitz', modele: 'Citerne SCT XL',
      annee: 2020, dateMiseEnCirculation: '2020-09-01', siteAffectation: 'Dépôt Sud',
      typeRemorque: 'Citerne', capacite: '30000L',
      statutAdmin: 'en_reparation',
      modeAcquisition: 'achat', coutAcquisition: 50000000, valeurResiduelle: 32000000,
      createdAt: '2020-09-01T08:00:00Z',
    },
    {
      id: 'REM-005', typeVehicule: 'remorque',
      plaque: 'MG-1104-TR', marque: 'Krone', modele: 'Profi Liner',
      annee: 2019, dateMiseEnCirculation: '2019-03-22', siteAffectation: 'Dépôt Nord',
      typeRemorque: 'Bâchée', capacite: '28T',
      statutAdmin: 'actif',
      modeAcquisition: 'achat', coutAcquisition: 35000000, valeurResiduelle: 18000000,
      createdAt: '2019-03-22T08:00:00Z',
    },
    {
      id: 'REM-006', typeVehicule: 'remorque',
      plaque: 'MG-1105-TR', marque: 'Krone', modele: 'Mega Liner',
      annee: 2023, dateMiseEnCirculation: '2023-07-01', siteAffectation: 'Garage Central',
      typeRemorque: 'Bâchée', capacite: '35T',
      statutAdmin: 'actif',
      modeAcquisition: 'leasing', coutAcquisition: 40000000,
      createdAt: '2023-07-01T08:00:00Z',
    },
    {
      id: 'REM-007', typeVehicule: 'remorque',
      plaque: 'MG-1106-TR', marque: 'Wielton', modele: 'NS-3',
      annee: 2018, dateMiseEnCirculation: '2018-11-15', siteAffectation: 'Dépôt Sud',
      typeRemorque: 'Bâchée', capacite: '24T',
      statutAdmin: 'hors_service',
      modeAcquisition: 'achat', coutAcquisition: 28000000, valeurResiduelle: 5000000,
      createdAt: '2018-11-15T08:00:00Z',
    },
  ])

  // ── Getters ─────────────────────────────────────────────────
  const tracteurs = computed(() => vehicules.value.filter(v => v.typeVehicule === 'tracteur'))
  const remorques = computed(() => vehicules.value.filter(v => v.typeVehicule === 'remorque'))

  const parStatut = (statut: StatutAdminVehicule) =>
    vehicules.value.filter(v => v.statutAdmin === statut)

  const parType = (type: TypeVehicule) =>
    vehicules.value.filter(v => v.typeVehicule === type)

  function getById(id: string) {
    return vehicules.value.find(v => v.id === id)
  }

  function getTracteurLibre() {
    return tracteurs.value.filter(
      t => t.statutAdmin === 'actif' && !t.chauffeurId
    )
  }

  function getRemorqueLibre() {
    return remorques.value.filter(
      r => r.statutAdmin === 'actif' && !r.vehiculeLieId
    )
  }

  // ── Actions ──────────────────────────────────────────────────
  function create(data: Omit<Vehicule, 'id' | 'createdAt'>) {
    const prefix = data.typeVehicule === 'tracteur' ? 'TRC' : 'REM'
    const count  = vehicules.value.filter(v => v.typeVehicule === data.typeVehicule).length + 1
    vehicules.value.push({
      ...data,
      id:        `${prefix}-${String(count).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    })
  }

  function update(id: string, data: Partial<Vehicule>) {
    const idx = vehicules.value.findIndex(v => v.id === id)
    const current = vehicules.value[idx]
    if (idx !== -1 && current) Object.assign(current, data)
  }

  function remove(id: string) {
    vehicules.value = vehicules.value.filter(v => v.id !== id)
  }

  function affecter(tracteurId: string, chauffeurId: string, chauffeurNom: string) {
    update(tracteurId, { chauffeurId, chauffeurNom, statutAdmin: 'affecte' })
  }

  function desaffecter(tracteurId: string) {
    update(tracteurId, { chauffeurId: undefined, chauffeurNom: undefined, statutAdmin: 'actif' })
  }

  function atteler(tracteurId: string, remorqueId: string) {
    const tracteur = getById(tracteurId)
    const remorque = getById(remorqueId)
    if (!tracteur || !remorque) return
    update(tracteurId, { vehiculeLieId: remorqueId, vehiculeLiePlaque: remorque.plaque })
    update(remorqueId, { vehiculeLieId: tracteurId, vehiculeLiePlaque: tracteur.plaque, statutAdmin: 'affecte' })
  }

  function desatteler(tracteurId: string, remorqueId: string) {
    update(tracteurId, { vehiculeLieId: undefined, vehiculeLiePlaque: undefined })
    update(remorqueId, { vehiculeLieId: undefined, vehiculeLiePlaque: undefined, statutAdmin: 'actif' })
  }

  return {
    vehicules,
    tracteurs, remorques,
    parStatut, parType, getById,
    getTracteurLibre, getRemorqueLibre,
    create, update, remove,
    affecter, desaffecter, atteler, desatteler,
  }
})
