import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  LIB_APTITUDE,
  LIB_EXAMEN,
  type AptitudeChauffeur,
  type CategorieRemontee,
  type ExamenType,
  type GraviteNCR,
  type MomentSafeCheck,
  type NatureNCR,
  type PointSafeCheck,
  type ResultatAptitude,
  type StatutNCR,
  type StatutRemontee,
  type TypeExamen,
} from '../types/fms'

export type ExamenTypeRegistre = TypeExamen
export type AptitudeChauffeurRegistre = ResultatAptitude

export interface ExamenRegistre {
  id: string
  chauffeurId: string
  chauffeurNom: string
  type: ExamenTypeRegistre
  date: string
  dateExpiration?: string
  aptitude?: AptitudeChauffeurRegistre
  libelle?: string
  positif?: boolean
  praticien?: string
  valableJusquau?: string
  restrictions?: string
  observation?: string
}

export interface RemonteeRegistre {
  id: string
  chauffeurId: string
  chauffeurNom: string
  vehiculePlaque?: string
  categorie: CategorieRemontee
  objet: string
  description?: string
  dateEvenement: string
  dateRemontee: string
  statut: StatutRemontee
  reponse?: string
}

export interface SafeCheckRegistre {
  id: string
  moment: MomentSafeCheck
  siteNom: string
  voyageRef: string
  controleur: string
  date: string
  points: PointSafeCheck[]
  rejet: boolean
}

export interface NcrRegistre {
  id: string
  reference: string
  clientNom: string
  nature: NatureNCR
  gravite: GraviteNCR
  echeance: string
  description: string
  statut: StatutNCR
  causeImmediate?: string
  causeProfonde?: string
  actionCorrective?: string
  responsable?: string
}

const typeToLabel = LIB_EXAMEN
const aptitudeToLabel = LIB_APTITUDE

export const useRegistresStore = defineStore('registres', () => {
  const examens = ref<ExamenRegistre[]>([
    {
      id: 'EX-001',
      chauffeurId: 'emp-010',
      chauffeurNom: 'Thierry Randriamanga',
      type: 'visite_medicale',
      date: '2026-01-10',
      dateExpiration: '2026-12-10',
      aptitude: 'apte',
      praticien: 'Dr. Ramanitra',
      valableJusquau: '2026-12-10',
      restrictions: '',
      observation: 'Sans restriction.',
    },
    {
      id: 'EX-002',
      chauffeurId: 'emp-010',
      chauffeurNom: 'Thierry Randriamanga',
      type: 'permis',
      date: '2025-11-02',
      dateExpiration: '2027-11-02',
      aptitude: 'apte',
      praticien: 'Préfecture de Toamasina',
      valableJusquau: '2027-11-02',
    },
    {
      id: 'EX-003',
      chauffeurId: 'emp-010',
      chauffeurNom: 'Thierry Randriamanga',
      type: 'formation_apth',
      date: '2026-02-15',
      dateExpiration: '2027-02-15',
      aptitude: 'apte',
      praticien: 'AFNOR Training',
      valableJusquau: '2027-02-15',
    },
  ])

  const remontees = ref<RemonteeRegistre[]>([
    {
      id: 'REM-001',
      chauffeurId: 'emp-010',
      chauffeurNom: 'Thierry Randriamanga',
      vehiculePlaque: '1234 TAN',
      categorie: 'securite',
      objet: 'Moteur bruyant sur la ligne de livraison',
      description: 'Le véhicule a produit un bruit anormal au démarrage en fin de tournée.',
      dateEvenement: '2026-06-28T08:30:00Z',
      dateRemontee: '2026-06-28T10:30:00Z',
      statut: 'en_cours',
      reponse: '',
    },
    {
      id: 'REM-002',
      chauffeurId: 'emp-011',
      chauffeurNom: 'Fiona Mungroo',
      vehiculePlaque: '2345 TNR',
      categorie: 'technique',
      objet: 'Alerte de pression pneu',
      description: 'Signalement de pression insuffisante sur le pneu avant gauche.',
      dateEvenement: '2026-06-27T17:00:00Z',
      dateRemontee: '2026-06-28T08:00:00Z',
      statut: 'ouverte',
    },
  ])

  const safeChecks = ref<SafeCheckRegistre[]>([
    {
      id: 'SAFE-001',
      moment: 'chargement',
      siteNom: 'Dépôt de Toamasina',
      voyageRef: 'VY-1042',
      controleur: 'M. Rabe',
      date: '2026-06-28T09:00:00Z',
      rejet: false,
      points: [
        { code: 'P1', libelle: 'État général du véhicule', conforme: true },
        { code: 'P2', libelle: 'Absence de fuite sur le chargement', conforme: false, observation: 'Petite fuite détectée' },
      ],
    },
  ])

  const ncrs = ref<NcrRegistre[]>([
    {
      id: 'NCR-001',
      reference: 'NCR-2026-001',
      clientNom: 'VIVO Energie',
      nature: 'documentaire',
      gravite: 'majeure',
      echeance: '2026-07-05',
      description: 'Document de livraison non conforme lors de l’arrivée client.',
      statut: 'en_traitement',
      causeImmediate: 'Bon de livraison incomplet',
      causeProfonde: 'Mauvaise vérification avant départ',
      actionCorrective: 'Rappeler au chauffeur la vérification documentaire',
      responsable: 'Ops Manager',
    },
  ])

  const aptitudeChauffeur = (chauffeurId: string) => {
    const ex = examens.value.filter(e => e.chauffeurId === chauffeurId)
    const apte = ex.some(e => e.aptitude === 'apte')
    return {
      apte,
      motif: apte ? 'Aptitude conforme' : 'Aucune aptitude validée dans le registre',
    }
  }

  const examensDuChauffeur = (chauffeurId: string) =>
    examens.value.filter(e => e.chauffeurId === chauffeurId)

  const visitesExpirees = computed(() =>
    examens.value.filter(e => e.dateExpiration && new Date(e.dateExpiration).getTime() < Date.now())
  )

  const tauxPositivite = computed(() => {
    const total = examens.value.length || 1
    const positifs = examens.value.filter(e => e.aptitude === 'non_apte' || e.positif === true).length
    return Math.round((positifs / total) * 100)
  })

  const tauxRemonteeSous24h = computed(() => {
    const opened = remontees.value.length || 1
    const sous24 = remontees.value.filter(r => {
      const diff = +new Date(r.dateRemontee) - +new Date(r.dateEvenement)
      return diff <= 24 * 60 * 60 * 1000
    }).length
    return Math.round((sous24 / opened) * 100)
  })

  const tauxClotureRemontees = computed(() => {
    const total = remontees.value.length || 1
    const closes = remontees.value.filter(r => r.statut === 'close').length
    return Math.round((closes / total) * 100)
  })

  const tauxClotureNCR = computed(() => {
    const total = ncrs.value.length || 1
    const closes = ncrs.value.filter(n => n.statut === 'close').length
    return Math.round((closes / total) * 100)
  })

  const remonteesOuvertes = computed(() => remontees.value.filter(r => r.statut !== 'close'))
  const ncrsOuvertes = computed(() => ncrs.value.filter(n => n.statut !== 'close'))

  const cloturerRemontee = (id: string, reponse = 'Traitée par l’exploitation.', acteur = 'Exploitation') => {
    const item = remontees.value.find(r => r.id === id)
    if (!item) return
    item.statut = 'close'
    item.reponse = `${reponse} · ${acteur}`
  }

  const cloturerNCR = (id: string) => {
    const item = ncrs.value.find(n => n.id === id)
    if (!item) return
    item.statut = 'close'
  }

  return {
    examens,
    remontees,
    safeChecks,
    ncrs,
    aptitudeChauffeur,
    examensDuChauffeur,
    visitesExpirees,
    tauxPositivite,
    tauxRemonteeSous24h,
    tauxClotureRemontees,
    tauxClotureNCR,
    remonteesOuvertes,
    ncrsOuvertes,
    cloturerRemontee,
    cloturerNCR,
    LIB_EXAMEN: typeToLabel,
    LIB_APTITUDE: aptitudeToLabel,
  }
})
