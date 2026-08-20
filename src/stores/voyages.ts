import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Voyage, StatutVoyage, ArretReleve, DocumentVoyage, TypeDocVoyage,
} from '../types/fms'
import { normaliserVolumes, calculerCoulage, calculerEcartKm } from '../lib/fmsUtils'
import { useTrajetsStore } from './trajets'

/** Pièces obligatoires au dossier de voyage — conditionnent la clôture. */
export const DOCS_OBLIGATOIRES: TypeDocVoyage[] = [
  'ordre_transfert', 'bon_chargement', 'feuille_route', 'bon_livraison',
]

export const LIB_DOC: Record<TypeDocVoyage, string> = {
  ordre_transfert:        'Ordre de transfert (GRT)',
  bon_chargement:         'Bon de chargement',
  feuille_route:          'Feuille de route',
  bon_livraison:          'Bon de livraison',
  note_protet:            'Note de protêt',
  justificatif_carburant: 'Justificatif carburant',
}

/**
 * Store du VOYAGE — objet pivot des quatre modules FMS.
 * Porte aussi les arrêts relevés et le dossier documentaire, qui n'ont pas
 * d'existence hors du voyage.
 */
export const useVoyagesStore = defineStore('voyages', () => {

  /* ══ Voyages ═══════════════════════════════════════════════ */
  const voyages = ref<Voyage[]>([
    {
      id: 'VOY-001', reference: 'VOY-2026-0148', numeroOT: 'GRT-2026-04412',
      statut: 'litige',
      clientNom: 'LPSA', toleranceCoulagePourMille: 0.5,
      trajetId: 'TRJ-001', trajetLibelle: 'Tamatave → Antananarivo (RN2 standard)', etapes: [],
      origine: 'Antsirabe', destination: 'Toamasina',
      vehiculeId: 'TRC-001', vehiculePlaque: 'MG-7842-TX',
      citerneId: 'REM-001', citernePlaque: 'MG-1100-TR',
      chauffeurId: 'emp-010', chauffeurNom: 'Thierry Randriamanga',
      datePlanifiee: '2026-07-24T05:30:00Z',
      dateDepartReel: '2026-07-24T05:48:00Z',
      dateArriveeReelle: '2026-07-24T18:12:00Z',
      kmReference: 520, kmDepart: 187_340, kmArrivee: 187_918,
      volumes: normaliserVolumes({
        produit: 'Gazole', densite: 0.84,
        volumeChargeAmbiant: 38_000, temperatureChargement: 27.4,
        volumeDechargeAmbiant: 37_920, temperatureDechargement: 29.1,
      }),
      traceReel: [
        { lat: -19.8667, lng: 47.0333 }, { lat: -19.3833, lng: 47.4167 },
        { lat: -18.8792, lng: 47.5079 }, { lat: -18.9167, lng: 47.8000 },
        { lat: -18.9469, lng: 48.2306 },
        // ── déviation : sortie de la séquence de sites vers le sud ──
        { lat: -19.0800, lng: 48.3100 }, { lat: -19.1520, lng: 48.3480 },
        { lat: -19.0400, lng: 48.5200 },
        // ── retour sur la RN2 ──
        { lat: -18.8167, lng: 49.0667 }, { lat: -18.1492, lng: 49.4023 },
      ],
      nbEcarts: 1, nbArretsNonJustifies: 1, litresDelivres: 420,
      createdAt: '2026-07-23T14:00:00Z',
    },
    {
      id: 'VOY-002', reference: 'VOY-2026-0149', numeroOT: 'GRT-2026-04418',
      statut: 'en_cours',
      clientNom: 'Galana Distribution Pétrolière', toleranceCoulagePourMille: 1,
      trajetId: 'TRJ-001', trajetLibelle: 'Tamatave → Antananarivo (RN2 standard)', etapes: [],
      origine: 'Antananarivo', destination: 'Toamasina',
      vehiculeId: 'TRC-003', vehiculePlaque: 'MG-5671-TX',
      citerneId: 'REM-003', citernePlaque: 'MG-1102-TR',
      chauffeurId: 'emp-011', chauffeurNom: 'Fiona Mungroo',
      datePlanifiee: '2026-07-29T06:00:00Z',
      dateDepartReel: '2026-07-29T06:05:00Z',
      kmReference: 352, kmDepart: 98_450,
      volumes: normaliserVolumes({
        produit: 'Essence', densite: 0.75,
        volumeChargeAmbiant: 32_000, temperatureChargement: 26.2,
      }),
      traceReel: [
        { lat: -18.8792, lng: 47.5079 }, { lat: -18.9167, lng: 47.8000 },
        { lat: -18.9469, lng: 48.2306 },
      ],
      nbEcarts: 0, nbArretsNonJustifies: 0, litresDelivres: 0,
      createdAt: '2026-07-28T16:30:00Z',
    },
    {
      id: 'VOY-003', reference: 'VOY-2026-0147', numeroOT: 'GRT-2026-04405',
      statut: 'cloture',
      clientNom: 'Galana Distribution Pétrolière', toleranceCoulagePourMille: 1,
      trajetId: 'TRJ-002', trajetLibelle: 'Antananarivo → Mahajanga (RN4)', etapes: [],
      origine: 'Antananarivo', destination: 'Mahajanga',
      vehiculeId: 'TRC-002', vehiculePlaque: 'MG-3356-TX',
      citerneId: 'REM-002', citernePlaque: 'MG-1101-TR',
      chauffeurId: 'emp-012', chauffeurNom: 'Hery Rasoanaivo',
      datePlanifiee: '2026-07-20T05:00:00Z',
      dateDepartReel: '2026-07-20T05:10:00Z',
      dateArriveeReelle: '2026-07-20T17:40:00Z',
      kmReference: 570, kmDepart: 245_780, kmArrivee: 246_352,
      volumes: normaliserVolumes({
        produit: 'Gazole', densite: 0.84,
        volumeChargeAmbiant: 40_000, temperatureChargement: 25.8,
        volumeDechargeAmbiant: 39_985, temperatureDechargement: 28.4,
      }),
      nbEcarts: 0, nbArretsNonJustifies: 0, litresDelivres: 465,
      createdAt: '2026-07-19T11:00:00Z',
    },
    {
      id: 'VOY-004', reference: 'VOY-2026-0150',
      statut: 'planifie',
      clientNom: 'LPSA', toleranceCoulagePourMille: 0.5,
      trajetId: 'TRJ-003', trajetLibelle: 'Antananarivo → Antsirabe (2 sites desservis)', etapes: [],
      origine: 'Antananarivo', destination: 'Antsirabe',
      datePlanifiee: '2026-07-30T06:30:00Z',
      kmReference: 168,
      volumes: { produit: 'Gazole', densite: 0.84 },
      nbEcarts: 0, nbArretsNonJustifies: 0, litresDelivres: 0,
      createdAt: '2026-07-29T09:15:00Z',
    },
    {
      id: 'VOY-005', reference: 'VOY-2026-0146', numeroOT: 'GRT-2026-04390',
      statut: 'livre',
      clientNom: 'Vivo Energy Madagascar', toleranceCoulagePourMille: 1,
      trajetId: 'TRJ-001', trajetLibelle: 'Tamatave → Antananarivo (RN2 standard)', etapes: [],
      origine: 'Antananarivo', destination: 'Toamasina',
      vehiculeId: 'TRC-004', vehiculePlaque: 'MG-4410-TX',
      citerneId: 'REM-004', citernePlaque: 'MG-1103-TR',
      chauffeurId: 'emp-013', chauffeurNom: 'Jean-Luc Ravelo',
      datePlanifiee: '2026-07-26T06:00:00Z',
      dateDepartReel: '2026-07-26T06:22:00Z',
      dateArriveeReelle: '2026-07-26T14:05:00Z',
      kmReference: 352, kmDepart: 132_100, kmArrivee: 132_461,
      volumes: normaliserVolumes({
        produit: 'Gazole', densite: 0.84,
        volumeChargeAmbiant: 35_000, temperatureChargement: 26.9,
        volumeDechargeAmbiant: 34_968, temperatureDechargement: 28.8,
      }),
      nbEcarts: 1, nbArretsNonJustifies: 0, litresDelivres: 285,
      createdAt: '2026-07-25T15:00:00Z',
    },
  ])

  /* Hydratation : chaque voyage reçoit une COPIE des étapes de son trajet de
     référence. Copie et non référence — modifier un trajet ne doit pas altérer
     rétroactivement les voyages déjà clôturés. */
  {
    const trajetsStore = useTrajetsStore()
    voyages.value.forEach(v => {
      if (v.etapes.length === 0 && v.trajetId) {
        const t = trajetsStore.getById(v.trajetId)
        if (t) v.etapes = t.etapes.map((e, i) => ({
          ...e,
          id: `${v.id}-${e.id}`,
          franchi: v.statut === 'cloture' || v.statut === 'livre' || (v.statut === 'en_cours' && i < 3),
        }))
      }
    })
  }

  /* ══ Arrêts relevés ════════════════════════════════════════ */
  const arrets = ref<ArretReleve[]>([
    {
      id: 'ARR-001', voyageId: 'VOY-001',
      debut: '2026-07-24T11:42:00Z', fin: '2026-07-24T12:27:00Z', dureeMin: 45,
      lat: -19.1520, lng: 48.3480, lieu: 'Piste secondaire — 14 km au sud de Moramanga',
      dansSiteDeclare: false, justifie: false,
    },
    {
      id: 'ARR-002', voyageId: 'VOY-001',
      debut: '2026-07-24T09:05:00Z', fin: '2026-07-24T09:38:00Z', dureeMin: 33,
      lat: -18.9469, lng: 48.2306, lieu: 'Relais Moramanga',
      dansSiteDeclare: true, justifie: true, motif: 'Pause réglementaire (TCC)',
    },
    {
      id: 'ARR-003', voyageId: 'VOY-005',
      debut: '2026-07-26T09:50:00Z', fin: '2026-07-26T10:14:00Z', dureeMin: 24,
      lat: -18.9200, lng: 48.0100, lieu: 'Bord RN2 — PK 62',
      dansSiteDeclare: false, justifie: true, motif: 'Contrôle gendarmerie',
    },
  ])

  /* ══ Dossier documentaire ══════════════════════════════════ */
  const documents = ref<DocumentVoyage[]>([
    { id: 'DOC-001', voyageId: 'VOY-001', type: 'ordre_transfert', numero: 'GRT-2026-04412', emetteur: 'Terminal Toamasina', date: '2026-07-23', fichierNom: 'OT-04412.pdf', obligatoire: true,  present: true  },
    { id: 'DOC-002', voyageId: 'VOY-001', type: 'bon_chargement',  numero: 'BC-88204',       emetteur: 'Dépôt Antsirabe',    date: '2026-07-24', fichierNom: 'BC-88204.jpg', obligatoire: true,  present: true  },
    { id: 'DOC-003', voyageId: 'VOY-001', type: 'feuille_route',   numero: 'FR-0148',        emetteur: 'Exploitation',       date: '2026-07-24', obligatoire: true,  present: true  },
    { id: 'DOC-004', voyageId: 'VOY-001', type: 'bon_livraison',   numero: 'BL-33917',       emetteur: 'LPSA Toamasina',     date: '2026-07-24', fichierNom: 'BL-33917.jpg', obligatoire: true,  present: true  },
    { id: 'DOC-005', voyageId: 'VOY-001', type: 'note_protet',     numero: 'NDP-2026-071',   emetteur: 'LPSA Toamasina',     date: '2026-07-24', obligatoire: false, present: true  },

    { id: 'DOC-006', voyageId: 'VOY-002', type: 'ordre_transfert', numero: 'GRT-2026-04418', emetteur: 'Terminal Toamasina', date: '2026-07-28', obligatoire: true,  present: true  },
    { id: 'DOC-007', voyageId: 'VOY-002', type: 'bon_chargement',  numero: 'BC-88251',       emetteur: 'Dépôt Antananarivo', date: '2026-07-29', obligatoire: true,  present: true  },
    { id: 'DOC-008', voyageId: 'VOY-002', type: 'feuille_route',   numero: 'FR-0149',        emetteur: 'Exploitation',       date: '2026-07-29', obligatoire: true,  present: true  },
    { id: 'DOC-009', voyageId: 'VOY-002', type: 'bon_livraison',                                                                                  obligatoire: true,  present: false },

    { id: 'DOC-010', voyageId: 'VOY-005', type: 'ordre_transfert', numero: 'GRT-2026-04390', emetteur: 'Terminal Toamasina', date: '2026-07-25', obligatoire: true,  present: true  },
    { id: 'DOC-011', voyageId: 'VOY-005', type: 'bon_chargement',  numero: 'BC-88180',       emetteur: 'Dépôt Antananarivo', date: '2026-07-26', obligatoire: true,  present: true  },
    { id: 'DOC-012', voyageId: 'VOY-005', type: 'feuille_route',   numero: 'FR-0146',        emetteur: 'Exploitation',       date: '2026-07-26', obligatoire: true,  present: true  },
    { id: 'DOC-013', voyageId: 'VOY-005', type: 'bon_livraison',   numero: 'BL-33902',       emetteur: 'Vivo Toamasina',     date: '2026-07-26', obligatoire: true,  present: true  },
  ])

  /* ══ Getters ═══════════════════════════════════════════════ */
  const getById  = (id: string) => voyages.value.find(v => v.id === id)
  const getByRef = (ref_: string) => voyages.value.find(v => v.reference === ref_)

  const enCours   = computed(() => voyages.value.filter(v => v.statut === 'en_cours'))
  const enLitige  = computed(() => voyages.value.filter(v => v.statut === 'litige'))
  const aCloturer = computed(() => voyages.value.filter(v => v.statut === 'livre'))

  const parStatut = computed(() => {
    const acc = {} as Record<StatutVoyage, number>
    voyages.value.forEach(v => { acc[v.statut] = (acc[v.statut] ?? 0) + 1 })
    return acc
  })

  const arretsDuVoyage    = (voyageId: string) => arrets.value.filter(a => a.voyageId === voyageId)
  const documentsDuVoyage = (voyageId: string) => documents.value.filter(d => d.voyageId === voyageId)

  /** Complétude du dossier documentaire — conditionne la clôture. */
  function completudeDossier(voyageId: string) {
    const docs = documentsDuVoyage(voyageId)
    const manquants = DOCS_OBLIGATOIRES.filter(
      t => !docs.some(d => d.type === t && d.present),
    )
    return {
      total: DOCS_OBLIGATOIRES.length,
      presents: DOCS_OBLIGATOIRES.length - manquants.length,
      manquants,
      complet: manquants.length === 0,
      pct: Math.round(((DOCS_OBLIGATOIRES.length - manquants.length) / DOCS_OBLIGATOIRES.length) * 100),
    }
  }

  const coulage = (voyageId: string) => {
    const v = getById(voyageId)
    return v ? calculerCoulage(v) : null
  }

  const ecartKm = (voyageId: string) => {
    const v = getById(voyageId)
    return v ? calculerEcartKm(v, 5) : null
  }

  /* ══ Actions ═══════════════════════════════════════════════ */
  function create(data: Omit<Voyage, 'id' | 'reference' | 'createdAt'>) {
    const n = voyages.value.length + 148
    voyages.value.unshift({
      ...data,
      id: `VOY-${String(voyages.value.length + 1).padStart(3, '0')}`,
      reference: `VOY-2026-${String(n).padStart(4, '0')}`,
      createdAt: new Date().toISOString(),
    })
  }

  function update(id: string, data: Partial<Voyage>) {
    const v = voyages.value.find(x => x.id === id)
    if (!v) return
    Object.assign(v, data)
    if (data.volumes) v.volumes = normaliserVolumes(v.volumes)
  }

  /** Saisie terrain des volumes — la normalisation à 15 °C est systématique. */
  function saisirVolumes(id: string, volumes: Partial<Voyage['volumes']>) {
    const v = getById(id)
    if (!v) return
    v.volumes = normaliserVolumes({ ...v.volumes, ...volumes })
  }

  function changerStatut(id: string, statut: StatutVoyage) {
    update(id, { statut })
  }

  /** Clôture bloquée tant que le dossier documentaire est incomplet. */
  function cloturer(id: string): { ok: boolean; motif?: string } {
    const c = completudeDossier(id)
    if (!c.complet) {
      return { ok: false, motif: `Dossier incomplet — ${c.manquants.map(m => LIB_DOC[m]).join(', ')}` }
    }
    changerStatut(id, 'cloture')
    return { ok: true }
  }

  function justifierArret(arretId: string, motif: string) {
    const a = arrets.value.find(x => x.id === arretId)
    if (!a) return
    a.justifie = true
    a.motif = motif
    const v = getById(a.voyageId)
    if (v) v.nbArretsNonJustifies = arretsDuVoyage(a.voyageId).filter(x => !x.justifie && !x.dansSiteDeclare).length
  }

  function ajouterDocument(doc: Omit<DocumentVoyage, 'id'>) {
    documents.value.push({ ...doc, id: `DOC-${String(documents.value.length + 1).padStart(3, '0')}` })
  }

  return {
    voyages, arrets, documents,
    enCours, enLitige, aCloturer, parStatut,
    getById, getByRef, arretsDuVoyage, documentsDuVoyage,
    completudeDossier, coulage, ecartKm,
    create, update, saisirVolumes, changerStatut, cloturer,
    justifierArret, ajouterDocument,
  }
})
