import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  EcartItineraire, NatureEcart, TypeEcart, GraviteEcart, DecisionEcart,
} from '../types/fms'

export const LIB_TYPE_ECART: Record<TypeEcart, string> = {
  sortie_trajet:        'Sortie de trajet',
  arret_non_planifie:   'Arrêt non planifié',
  point_passage_manque: 'Point de passage manqué',
  zone_interdite:       'Entrée en zone interdite',
  ecart_kilometrique:   'Écart kilométrique',
  fenetre_horaire:      'Hors fenêtre horaire',
}

export const LIB_NATURE: Record<NatureEcart, { label: string; cls: string }> = {
  a_qualifier:    { label: 'À qualifier',            cls: 'bg-warning-bg text-warning' },
  autorisee:      { label: 'Déviation autorisée',    cls: 'bg-info-bg text-info'       },
  subie:          { label: 'Déviation subie',        cls: 'bg-primary/10 text-primary' },
  non_justifiee:  { label: 'Non justifiée',          cls: 'bg-danger-bg text-danger'   },
}

export const LIB_GRAVITE: Record<GraviteEcart, { label: string; cls: string }> = {
  mineur:   { label: 'Mineur',   cls: 'bg-gray-100 text-gray-600'  },
  majeur:   { label: 'Majeur',   cls: 'bg-warning-bg text-warning' },
  critique: { label: 'Critique', cls: 'bg-danger-bg text-danger'   },
}

/**
 * Écarts d'itinéraire.
 *
 * Règle fondatrice : un écart naît TOUJOURS au statut `a_qualifier`.
 * Le système mesure un écart, il ne présume jamais d'une intention.
 * Seul un écart qualifié `non_justifiee` alimente le score du conducteur
 * et peut ouvrir un dossier disciplinaire.
 */
export const useEcartsStore = defineStore('ecarts', () => {

  /* Tracé de référence, repris pour la comparaison prévu / réel */
  const TRACE_REF = [
    { lat: -19.8667, lng: 47.0333 }, { lat: -19.3833, lng: 47.4167 },
    { lat: -18.8792, lng: 47.5079 }, { lat: -18.9167, lng: 47.8000 },
    { lat: -18.9469, lng: 48.2306 }, { lat: -18.8167, lng: 49.0667 },
    { lat: -18.1492, lng: 49.4023 },
  ]

  const ecarts = ref<EcartItineraire[]>([
    {
      id: 'ECA-001',
      voyageId: 'VOY-001', voyageRef: 'VOY-2026-0148',
      vehiculePlaque: 'MG-7842-TX',
      chauffeurId: 'emp-010', chauffeurNom: 'Thierry Randriamanga',
      trajetLibelle: 'Tamatave → Antananarivo (RN2 standard)',
      typeEcartId: 'TE-01', type: 'sortie_trajet', gravite: 'majeur', nature: 'a_qualifier',
      detecteLe: '2026-07-24T11:18:00Z',
      dureeMin: 96, distanceKm: 41, ecartLateralMaxM: 24_800,
      lat: -19.1520, lng: 48.3480,
      lieu: 'Piste secondaire — 14 km au sud de Moramanga',
      tracePrevu: TRACE_REF,
      traceReel: [
        { lat: -18.9469, lng: 48.2306 }, { lat: -19.0800, lng: 48.3100 },
        { lat: -19.1520, lng: 48.3480 }, { lat: -19.0400, lng: 48.5200 },
        { lat: -18.8167, lng: 49.0667 },
      ],
    },
    {
      id: 'ECA-002',
      voyageId: 'VOY-001', voyageRef: 'VOY-2026-0148',
      vehiculePlaque: 'MG-7842-TX',
      chauffeurId: 'emp-010', chauffeurNom: 'Thierry Randriamanga',
      trajetLibelle: 'Tamatave → Antananarivo (RN2 standard)',
      typeEcartId: 'TE-04', type: 'arret_non_planifie', gravite: 'critique', nature: 'a_qualifier',
      detecteLe: '2026-07-24T11:42:00Z',
      dureeMin: 45,
      lat: -19.1520, lng: 48.3480,
      lieu: 'Piste secondaire — 14 km au sud de Moramanga',
      tracePrevu: TRACE_REF,
      traceReel: [{ lat: -19.1520, lng: 48.3480 }],
    },
    {
      id: 'ECA-003',
      voyageId: 'VOY-005', voyageRef: 'VOY-2026-0146',
      vehiculePlaque: 'MG-4410-TX',
      chauffeurId: 'emp-013', chauffeurNom: 'Jean-Luc Ravelo',
      trajetLibelle: 'Tamatave → Antananarivo (RN2 standard)',
      typeEcartId: 'TE-02', type: 'sortie_trajet', gravite: 'mineur', nature: 'subie',
      detecteLe: '2026-07-26T09:48:00Z',
      dureeMin: 26, distanceKm: 8, ecartLateralMaxM: 3_100,
      lat: -18.9200, lng: 48.0100, lieu: 'Déviation chantier RN2 — PK 62',
      tracePrevu: [
        { lat: -18.8792, lng: 47.5079 }, { lat: -18.9167, lng: 47.8000 },
        { lat: -18.9469, lng: 48.2306 }, { lat: -18.8167, lng: 49.0667 },
        { lat: -18.1492, lng: 49.4023 },
      ],
      traceReel: [
        { lat: -18.9167, lng: 47.8000 }, { lat: -18.9200, lng: 48.0100 },
        { lat: -18.9469, lng: 48.2306 },
      ],
      justificationChauffeur: 'Route barrée par travaux, déviation imposée par la gendarmerie.',
      justifieLe: '2026-07-26T15:10:00Z',
      qualifiePar: 'D. Rakotoarisoa (Exploitation)',
      qualifieLe: '2026-07-27T08:30:00Z',
      motifQualification: 'Déviation de chantier confirmée par la cellule tracking.',
      decision: 'classe',
    },
    {
      id: 'ECA-004',
      voyageId: 'VOY-003', voyageRef: 'VOY-2026-0147',
      vehiculePlaque: 'MG-3356-TX',
      chauffeurId: 'emp-012', chauffeurNom: 'Hery Rasoanaivo',
      trajetLibelle: 'Antananarivo → Mahajanga (RN4)',
      typeEcartId: 'TE-10', type: 'fenetre_horaire', gravite: 'mineur', nature: 'autorisee',
      detecteLe: '2026-07-20T19:05:00Z',
      dureeMin: 70,
      lat: -16.9500, lng: 46.8333, lieu: 'Maevatanana',
      tracePrevu: [
        { lat: -18.8792, lng: 47.5079 }, { lat: -18.3167, lng: 47.1167 },
        { lat: -16.9500, lng: 46.8333 }, { lat: -15.7167, lng: 46.3167 },
      ],
      traceReel: [{ lat: -16.9500, lng: 46.8333 }],
      qualifiePar: 'D. Rakotoarisoa (Exploitation)',
      qualifieLe: '2026-07-21T07:45:00Z',
      motifQualification: 'Départ décalé sur instruction client — accord tracé au dossier.',
      decision: 'classe',
    },
  ])

  /* ══ Getters ═══════════════════════════════════════════════ */
  const getById = (id: string) => ecarts.value.find(e => e.id === id)

  const aQualifier = computed(() => ecarts.value.filter(e => e.nature === 'a_qualifier'))
  const infractions = computed(() => ecarts.value.filter(e => e.nature === 'non_justifiee'))

  const ecartsDuVoyage = (voyageId: string) => ecarts.value.filter(e => e.voyageId === voyageId)
  const ecartsDuChauffeur = (chauffeurId: string) =>
    ecarts.value.filter(e => e.chauffeurId === chauffeurId)

  const parNature = computed(() => {
    const acc = {} as Record<NatureEcart, number>
    ecarts.value.forEach(e => { acc[e.nature] = (acc[e.nature] ?? 0) + 1 })
    return acc
  })

  /** Taux de conformité : part des voyages sans écart non justifié. */
  function tauxConformite(nbVoyages: number) {
    if (!nbVoyages) return 100
    const voyagesEnFaute = new Set(infractions.value.map(e => e.voyageId)).size
    return Math.round(((nbVoyages - voyagesEnFaute) / nbVoyages) * 100)
  }

  /* ══ Actions ═══════════════════════════════════════════════ */

  /** Le chauffeur dépose sa justification dans la fenêtre impartie. */
  function justifier(id: string, texte: string) {
    const e = getById(id)
    if (!e) return
    e.justificationChauffeur = texte
    e.justifieLe = new Date().toISOString()
  }

  /**
   * Qualification par l'exploitation. Le motif est obligatoire :
   * c'est ce qui rend le dossier opposable en cas de contestation.
   */
  function qualifier(
    id: string,
    nature: Exclude<NatureEcart, 'a_qualifier'>,
    motif: string,
    par: string,
    decision: DecisionEcart = 'classe',
  ) {
    const e = getById(id)
    if (!e) return
    e.nature = nature
    e.motifQualification = motif
    e.qualifiePar = par
    e.qualifieLe = new Date().toISOString()
    e.decision = decision
    if (decision === 'codis') {
      e.refCodis = `CODIS-2026-${String(ecarts.value.filter(x => x.refCodis).length + 1).padStart(3, '0')}`
    }
  }

  function create(data: Omit<EcartItineraire, 'id' | 'nature'>) {
    ecarts.value.unshift({
      ...data,
      id: `ECA-${String(ecarts.value.length + 1).padStart(3, '0')}`,
      nature: 'a_qualifier',   // toujours
    })
  }

  return {
    ecarts,
    aQualifier, infractions, parNature,
    getById, ecartsDuVoyage, ecartsDuChauffeur, tauxConformite,
    justifier, qualifier, create,
  }
})
