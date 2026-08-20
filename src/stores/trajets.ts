import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Trajet, EtapeTrajet, RoleEtape, LatLng } from '../types/fms'
import { distanceKm } from '../lib/fmsUtils'

/**
 * Trajets de référence — un trajet est un ensemble de sites ORDONNÉS.
 *
 * Le système ne calcule aucun itinéraire : il enregistre l'ordre des sites.
 * Le tracé visible sur la carte est une simulation, jamais persistée.
 *
 * Deux usages :
 *  · trajet récurrent, enregistré en configuration et réutilisable
 *    (un client livré régulièrement selon le même enchaînement) ;
 *  · séquence composée à la volée dans le formulaire de voyage.
 */
export const useTrajetsStore = defineStore('trajets', () => {

  const trajets = ref<Trajet[]>([
    {
      id: 'TRJ-001',
      code: 'TVE-TNR-STD',
      libelle: 'Tamatave → Antananarivo (RN2 standard)',
      recurrent: true,
      clientNom: 'LPSA',
      statut: 'actif',
      distanceEstimeeKm: 352,
      dureeEstimeeMin: 450,
      createdAt: '2026-06-02T08:00:00Z',
      etapes: [
        { id: 'ET-001', siteId: 'SIT-TVE', siteNom: 'Base Tamatave',            ordre: 1, lat: -18.1492, lng: 49.4023, role: 'depart',     intervalleMin: 0 },
        { id: 'ET-002', siteId: 'SIT-GRT', siteNom: 'Dépôt GRT Tamatave',       ordre: 2, lat: -18.1560, lng: 49.3950, role: 'chargement', intervalleMin: 25 },
        { id: 'ET-003', siteId: 'SIT-AMP', siteNom: 'Ampasimadinika PK296',     ordre: 3, lat: -18.5200, lng: 49.0500, role: 'repos',      intervalleMin: 110, pausePrevueMin: 45 },
        { id: 'ET-004', siteId: 'SIT-BRK', siteNom: 'Brickaville',              ordre: 4, lat: -18.8167, lng: 49.0667, role: 'controle',   intervalleMin: 55 },
        { id: 'ET-005', siteId: 'SIT-MOR', siteNom: 'Relais Moramanga',         ordre: 5, lat: -18.9469, lng: 48.2306, role: 'repos',      intervalleMin: 120, pausePrevueMin: 45 },
        { id: 'ET-006', siteId: 'SIT-ALA', siteNom: 'Dépôt Alarobia',           ordre: 6, lat: -18.8900, lng: 47.5400, role: 'livraison',  intervalleMin: 140 },
        { id: 'ET-007', siteId: 'SIT-TNR', siteNom: 'Base Antananarivo',        ordre: 7, lat: -18.8792, lng: 47.5079, role: 'arrivee',    intervalleMin: 20 },
      ],
    },
    {
      id: 'TRJ-002',
      code: 'TNR-MJN-STD',
      libelle: 'Antananarivo → Mahajanga (RN4)',
      recurrent: true,
      clientNom: 'Vivo Energy Madagascar',
      statut: 'actif',
      distanceEstimeeKm: 570,
      dureeEstimeeMin: 720,
      createdAt: '2026-06-04T08:00:00Z',
      etapes: [
        { id: 'ET-010', siteId: 'SIT-TNR', siteNom: 'Base Antananarivo',        ordre: 1, lat: -18.8792, lng: 47.5079, role: 'depart',     intervalleMin: 0 },
        { id: 'ET-011', siteId: 'SIT-ANK', siteNom: 'Ankazobe',                 ordre: 2, lat: -18.3167, lng: 47.1167, role: 'controle',   intervalleMin: 130 },
        { id: 'ET-012', siteId: 'SIT-MEV', siteNom: 'Contrôle Maevatanana',     ordre: 3, lat: -16.9500, lng: 46.8333, role: 'controle',   intervalleMin: 240, pausePrevueMin: 45 },
        { id: 'ET-013', siteId: 'SIT-MJN', siteNom: 'Dépôt Mahajanga',          ordre: 4, lat: -15.7167, lng: 46.3167, role: 'livraison',  intervalleMin: 260 },
      ],
    },
    {
      id: 'TRJ-003',
      code: 'TNR-ATS-MULTI',
      libelle: 'Antananarivo → Antsirabe (2 sites desservis)',
      recurrent: true,
      clientNom: 'TotalEnergies Madagascar',
      statut: 'actif',
      distanceEstimeeKm: 178,
      dureeEstimeeMin: 240,
      createdAt: '2026-07-01T08:00:00Z',
      etapes: [
        { id: 'ET-020', siteId: 'SIT-TNR', siteNom: 'Base Antananarivo',        ordre: 1, lat: -18.8792, lng: 47.5079, role: 'depart',     intervalleMin: 0 },
        { id: 'ET-021', siteId: 'SIT-AMB', siteNom: 'Station Ambatolampy',      ordre: 2, lat: -19.3833, lng: 47.4167, role: 'livraison',  intervalleMin: 95 },
        { id: 'ET-022', siteId: 'SIT-ATS', siteNom: 'Station Antsirabe centre', ordre: 3, lat: -19.8667, lng: 47.0333, role: 'livraison',  intervalleMin: 75 },
        { id: 'ET-023', siteId: 'SIT-TNR', siteNom: 'Base Antananarivo',        ordre: 4, lat: -18.8792, lng: 47.5079, role: 'arrivee',    intervalleMin: 170 },
      ],
    },
  ])

  /* ══ Getters ═══════════════════════════════════════════════ */
  const getById = (id: string) => trajets.value.find(t => t.id === id)
  const actifs = computed(() => trajets.value.filter(t => t.statut === 'actif'))
  const recurrents = computed(() => trajets.value.filter(t => t.recurrent && t.statut === 'actif'))

  /** Points de la séquence, pour l'affichage cartographique. */
  const traceDe = (etapes: EtapeTrajet[]): LatLng[] =>
    [...etapes].sort((a, b) => a.ordre - b.ordre).map(e => ({ lat: e.lat, lng: e.lng }))

  /** Distance à vol d'oiseau cumulée — sert à la simulation, pas à la facturation. */
  function distanceSimulee(etapes: EtapeTrajet[]): number {
    const pts = traceDe(etapes)
    let total = 0
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i]
      if (a && b) total += distanceKm(a, b)
    }
    return Math.round(total)
  }

  function dureeSimulee(etapes: EtapeTrajet[]): number {
    return etapes.reduce((s, e) => s + (e.intervalleMin ?? 0) + (e.pausePrevueMin ?? 0), 0)
  }

  /* ══ Actions ═══════════════════════════════════════════════ */

  /** Renumérote les étapes après un glisser-déposer. */
  function renumeroter(etapes: EtapeTrajet[]): EtapeTrajet[] {
    return etapes.map((e, i) => ({ ...e, ordre: i + 1 }))
  }

  function nouvelleEtape(
    site: { id: string; nom: string; latitude: number; longitude: number },
    ordre: number,
    role: RoleEtape = 'livraison',
  ): EtapeTrajet {
    return {
      id: `ET-${Date.now()}-${ordre}`,
      siteId: site.id,
      siteNom: site.nom,
      ordre,
      lat: site.latitude,
      lng: site.longitude,
      role,
      intervalleMin: 0,
    }
  }

  function create(data: Omit<Trajet, 'id' | 'createdAt' | 'distanceEstimeeKm' | 'dureeEstimeeMin'>) {
    const etapes = renumeroter(data.etapes)
    trajets.value.unshift({
      ...data,
      etapes,
      id: `TRJ-${String(trajets.value.length + 1).padStart(3, '0')}`,
      distanceEstimeeKm: distanceSimulee(etapes),
      dureeEstimeeMin: dureeSimulee(etapes),
      createdAt: new Date().toISOString(),
    })
  }

  function update(id: string, data: Partial<Trajet>) {
    const t = getById(id)
    if (!t) return
    Object.assign(t, data)
    if (data.etapes) {
      t.etapes = renumeroter(data.etapes)
      t.distanceEstimeeKm = distanceSimulee(t.etapes)
      t.dureeEstimeeMin = dureeSimulee(t.etapes)
    }
  }

  function archiver(id: string) {
    update(id, { statut: 'archive' })
  }

  return {
    trajets,
    actifs, recurrents,
    getById, traceDe, distanceSimulee, dureeSimulee,
    renumeroter, nouvelleEtape, create, update, archiver,
  }
})
