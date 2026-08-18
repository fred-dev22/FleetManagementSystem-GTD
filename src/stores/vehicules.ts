import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Vehicule, StatutAdminVehicule, TypeVehicule, SortieParc } from '../types'

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

    /* ── Sortis du parc - US 2.1.5 ────────────────────────────
       Deux véhicules archivés : sans eux, le sélecteur « Archivés »
       renverrait une liste vide et le critère serait indémontrable.
       Ils portent chacun un motif de sortie différent. */
    {
      id: 'TRC-006', typeVehicule: 'tracteur',
      vin: 'YV2RT40A5YB998877', plaque: 'MG-2218-TX', marque: 'Volvo', modele: 'FH 420',
      annee: 2015, dateMiseEnCirculation: '2015-08-12', siteAffectation: 'Dépôt Nord',
      typeCarburant: 'Diesel', statutAdmin: 'archive',
      kilometrage: 684500,
      modeAcquisition: 'achat', coutAcquisition: 61000000, valeurResiduelle: 8000000,
      sortie: {
        motif: 'vendu', date: '2026-04-30', par: 'Direction technique',
        commentaire: 'Cédé après 684 500 km. Coût de maintenance au km devenu supérieur à celui du parc.',
        kilometrageSortie: 684500, enregistreLe: '2026-04-30T14:20:00Z',
      },
      createdAt: '2015-08-12T08:00:00Z',
    },
    {
      id: 'REM-008', typeVehicule: 'remorque',
      plaque: 'MG-1094-TR', marque: 'Fruehauf', modele: 'Citerne P2',
      annee: 2014, dateMiseEnCirculation: '2014-02-03', siteAffectation: 'Garage Central',
      typeRemorque: 'Citerne', capacite: '26000L',
      statutAdmin: 'archive',
      modeAcquisition: 'achat', coutAcquisition: 33000000,
      sortie: {
        motif: 'accidente', date: '2026-02-17', par: 'Responsable flotte',
        commentaire: 'Retournement sur la RN2. Citerne déclarée épave par l’expert.',
        enregistreLe: '2026-02-18T09:05:00Z',
      },
      createdAt: '2014-02-03T08:00:00Z',
    },
  ])

  // ── Getters ─────────────────────────────────────────────────

  /**
   * Véhicules encore au parc. C'est la vue par défaut de tous les écrans :
   * un véhicule sorti ne doit apparaître ni dans une liste d'affectation,
   * ni dans un indicateur de disponibilité, ni dans un total de parc.
   */
  const auParc = computed(() => vehicules.value.filter(v => v.statutAdmin !== 'archive'))

  /** Véhicules sortis du parc, consultables mais plus exploitables. */
  const archives = computed(() => vehicules.value.filter(v => v.statutAdmin === 'archive'))

  const tracteurs = computed(() => auParc.value.filter(v => v.typeVehicule === 'tracteur'))
  const remorques = computed(() => auParc.value.filter(v => v.typeVehicule === 'remorque'))

  const parStatut = (statut: StatutAdminVehicule) =>
    vehicules.value.filter(v => v.statutAdmin === statut)

  const parType = (type: TypeVehicule) =>
    auParc.value.filter(v => v.typeVehicule === type)

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

  /* ══════════════════════════════════════════════════════════
     Unicité de la plaque et du châssis - US 2.1.1
     ══════════════════════════════════════════════════════════
     L'import du parc contrôlait déjà ces deux clés ; la création
     manuelle ne les contrôlait pas. On pouvait donc saisir à la main
     un doublon que l'import aurait rejeté. Les deux chemins passent
     désormais par les mêmes fonctions.

     La comparaison ignore la casse et les espaces : « mg-7842-tx »
     et « MG-7842-TX » désignent le même camion. Les véhicules
     archivés comptent : leur plaque reste réservée, sans quoi
     l'historique de deux véhicules distincts se confondrait.
     ══════════════════════════════════════════════════════════ */

  const normaliser = (s: string) => s.trim().toUpperCase().replace(/\s+/g, '')

  function plaqueExiste(plaque: string, exclureId?: string): boolean {
    const p = normaliser(plaque)
    return vehicules.value.some(v => v.id !== exclureId && normaliser(v.plaque) === p)
  }

  function vinExiste(vin: string, exclureId?: string): boolean {
    const n = normaliser(vin)
    if (!n) return false
    return vehicules.value.some(v => v.id !== exclureId && v.vin && normaliser(v.vin) === n)
  }

  /** Motif de refus d'une saisie, ou null si elle est recevable. */
  function motifRefus(data: Pick<Vehicule, 'plaque' | 'vin'>, exclureId?: string): string | null {
    if (!data.plaque?.trim()) return 'La plaque est obligatoire.'
    if (plaqueExiste(data.plaque, exclureId)) {
      const existant = vehicules.value.find(v => normaliser(v.plaque) === normaliser(data.plaque))
      return existant?.statutAdmin === 'archive'
        ? `La plaque ${data.plaque.trim()} appartient à un véhicule sorti du parc le ${existant.sortie?.date}. Elle reste réservée.`
        : `La plaque ${data.plaque.trim()} est déjà attribuée à un véhicule du parc.`
    }
    if (data.vin && vinExiste(data.vin, exclureId)) {
      return `Le numéro de châssis ${data.vin.trim()} est déjà enregistré.`
    }
    return null
  }

  // ── Actions ──────────────────────────────────────────────────

  /**
   * Crée un véhicule après contrôle d'unicité.
   * @returns l'identifiant créé, ou le motif de refus.
   */
  function create(data: Omit<Vehicule, 'id' | 'createdAt'>): { id: string } | { erreur: string } {
    const refus = motifRefus(data)
    if (refus) return { erreur: refus }

    const prefix = data.typeVehicule === 'tracteur' ? 'TRC' : 'REM'
    /* Le compteur part du plus grand identifiant existant : compter les
       éléments produirait un doublon d'identifiant après une suppression. */
    const max = vehicules.value
      .filter(v => v.id.startsWith(prefix))
      .reduce((m, v) => Math.max(m, Number(v.id.slice(4)) || 0), 0)

    const id = `${prefix}-${String(max + 1).padStart(3, '0')}`
    vehicules.value.push({
      ...data,
      plaque:    data.plaque.trim(),
      vin:       data.vin?.trim() || undefined,
      id,
      createdAt: new Date().toISOString(),
    })
    return { id }
  }

  function update(id: string, data: Partial<Vehicule>) {
    const idx = vehicules.value.findIndex(v => v.id === id)
    const current = vehicules.value[idx]
    if (idx !== -1 && current) Object.assign(current, data)
  }

  function remove(id: string) {
    vehicules.value = vehicules.value.filter(v => v.id !== id)
  }

  /* ══════════════════════════════════════════════════════════
     Sortie du parc - US 2.1.5
     ══════════════════════════════════════════════════════════ */

  /**
   * Ce qui empêche la sortie d'un véhicule, ou null si elle est possible.
   *
   * Archiver un tracteur encore attelé, ou affecté à un chauffeur,
   * laisserait des liaisons pendantes dans les écrans d'exploitation.
   * Le blocage est explicite : l'utilisateur sait quoi défaire d'abord.
   */
  function obstacleSortie(id: string): string | null {
    const v = getById(id)
    if (!v) return 'Véhicule introuvable.'
    if (v.statutAdmin === 'archive') return 'Ce véhicule est déjà sorti du parc.'
    if (v.vehiculeLieId) {
      return `Le véhicule est attelé à ${v.vehiculeLiePlaque}. Dételez-le avant de le sortir du parc.`
    }
    if (v.chauffeurId) {
      return `Le véhicule est affecté à ${v.chauffeurNom}. Retirez l'affectation avant de le sortir du parc.`
    }
    if (v.statutOp === 'en_mouvement') {
      return 'Le véhicule est en mouvement. Attendez la fin de la mission en cours.'
    }
    return null
  }

  /**
   * Sort un véhicule du parc. Il disparaît des listes courantes mais
   * reste consultable : rien n'est supprimé, ni son historique, ni ses
   * documents, ni sa plaque, qui demeure réservée.
   */
  function archiver(
    id: string,
    sortie: Omit<SortieParc, 'enregistreLe'>,
  ): { ok: true } | { erreur: string } {
    const obstacle = obstacleSortie(id)
    if (obstacle) return { erreur: obstacle }

    const v = getById(id)!
    update(id, {
      statutAdmin: 'archive',
      statutOp: undefined,
      sortie: {
        ...sortie,
        kilometrageSortie: sortie.kilometrageSortie ?? v.kilometrage,
        enregistreLe: new Date().toISOString(),
      },
    })
    return { ok: true }
  }

  /**
   * Réintègre un véhicule sorti par erreur.
   * Le motif de sortie est effacé : conserver la trace d'une sortie
   * annulée laisserait croire à une sortie effective.
   */
  function reintegrer(id: string): { ok: true } | { erreur: string } {
    const v = getById(id)
    if (!v) return { erreur: 'Véhicule introuvable.' }
    if (v.statutAdmin !== 'archive') return { erreur: 'Ce véhicule est déjà au parc.' }
    update(id, { statutAdmin: 'actif', sortie: undefined })
    return { ok: true }
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
    auParc, archives,
    tracteurs, remorques,
    parStatut, parType, getById,
    getTracteurLibre, getRemorqueLibre,
    plaqueExiste, vinExiste, motifRefus,
    create, update, remove,
    obstacleSortie, archiver, reintegrer,
    affecter, desaffecter, atteler, desatteler,
  }
})
