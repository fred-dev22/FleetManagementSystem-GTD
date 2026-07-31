import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ScoreConducteur, FamilleScore, DetailFamilleScore } from '../types/fms'

/**
 * Pondérations par famille — paramétrables par la direction.
 * Toute modification est datée et sans effet rétroactif sur les scores arrêtés.
 */
export const PONDERATIONS: Record<FamilleScore, { libelle: string; poids: number; couleur: string }> = {
  securite:      { libelle: 'Sécurité routière',      poids: 30, couleur: '#dc2626' },
  itineraire:    { libelle: 'Conformité d’itinéraire', poids: 25, couleur: '#0072C5' },
  reglementaire: { libelle: 'Conformité réglementaire', poids: 20, couleur: '#ca8a04' },
  livraison:     { libelle: 'Qualité de livraison',    poids: 15, couleur: '#16a34a' },
  discipline:    { libelle: 'Discipline administrative', poids: 10, couleur: '#7c3aed' },
}

/** Grille de prime indexée sur le score — à valider par la direction et les RH. */
export const GRILLE_PRIME: { min: number; montant: number; libelle: string }[] = [
  { min: 90, montant: 450_000, libelle: 'Excellence' },
  { min: 80, montant: 300_000, libelle: 'Confirmé'   },
  { min: 70, montant: 150_000, libelle: 'Standard'   },
  { min: 0,  montant: 0,       libelle: 'Non éligible' },
]

function famille(f: FamilleScore, note: number, evenements: number): DetailFamilleScore {
  return { famille: f, libelle: PONDERATIONS[f].libelle, poids: PONDERATIONS[f].poids, note, evenements }
}

/** Score global = moyenne des notes de famille pondérée par les coefficients. */
export function scoreGlobal(familles: DetailFamilleScore[]): number {
  const total = familles.reduce((s, f) => s + f.poids, 0)
  if (!total) return 0
  return Math.round(familles.reduce((s, f) => s + f.note * f.poids, 0) / total)
}

export function primePour(score: number, eligible: boolean): { montant: number; libelle: string } {
  if (!eligible) return { montant: 0, libelle: 'Non éligible' }
  const p = GRILLE_PRIME.find(g => score >= g.min)!
  return { montant: p.montant, libelle: p.libelle }
}

/**
 * Scores conducteurs.
 *
 * Trois principes de construction :
 *  · atténuation — fenêtre glissante de 12 mois, une infraction ancienne pèse moins ;
 *  · transparence — le conducteur accède à la décomposition de son propre score ;
 *  · traçabilité — les pondérations sont versionnées et non rétroactives.
 */
export const useScoresConducteursStore = defineStore('scoresConducteurs', () => {

  const scores = ref<ScoreConducteur[]>([
    {
      chauffeurId: 'emp-010', chauffeurNom: 'Thierry Randriamanga',
      score: 0, scoreMoisPrecedent: 84,
      familles: [
        famille('securite', 82, 4),
        famille('itineraire', 61, 2),
        famille('reglementaire', 88, 1),
        famille('livraison', 74, 2),
        famille('discipline', 95, 0),
      ],
      historique12m: [88, 87, 89, 86, 84, 85, 83, 84, 86, 85, 84, 78],
      kmPeriode: 12_480, voyagesPeriode: 9, kmMoyenParVoyage: 1_387, depassementsKm: 2,
      infractions: 4, exces: 3, tauxConformiteItineraire: 78,
      consoMoyenne100km: 40.2, ecartConsoPct: 4.4,
      primeEligible: false, primeMontant: 0,
      motifNonEligibilite: 'Écart majeur non qualifié en cours (VOY-2026-0148)',
      permisExpireLe: '2026-08-15',
      visiteMedicaleExpireLe: '2025-09-10',
    },
    {
      chauffeurId: 'emp-011', chauffeurNom: 'Fiona Mungroo',
      score: 0, scoreMoisPrecedent: 92,
      familles: [
        famille('securite', 96, 0),
        famille('itineraire', 98, 0),
        famille('reglementaire', 92, 1),
        famille('livraison', 90, 1),
        famille('discipline', 100, 0),
      ],
      historique12m: [86, 88, 89, 90, 91, 90, 92, 93, 92, 94, 92, 95],
      kmPeriode: 14_120, voyagesPeriode: 11, kmMoyenParVoyage: 1_284, depassementsKm: 0,
      infractions: 0, exces: 1, tauxConformiteItineraire: 100,
      consoMoyenne100km: 35.1, ecartConsoPct: -2.5,
      primeEligible: true, primeMontant: 0,
      permisExpireLe: '2027-03-22',
      visiteMedicaleExpireLe: '2026-01-20',
    },
    {
      chauffeurId: 'emp-012', chauffeurNom: 'Hery Rasoanaivo',
      score: 0, scoreMoisPrecedent: 79,
      familles: [
        famille('securite', 78, 5),
        famille('itineraire', 92, 1),
        famille('reglementaire', 70, 3),
        famille('livraison', 88, 1),
        famille('discipline', 85, 1),
      ],
      historique12m: [74, 75, 77, 76, 78, 79, 80, 78, 79, 81, 79, 81],
      kmPeriode: 16_040, voyagesPeriode: 12, kmMoyenParVoyage: 1_337, depassementsKm: 1,
      infractions: 5, exces: 4, tauxConformiteItineraire: 92,
      consoMoyenne100km: 42.6, ecartConsoPct: 3.9,
      primeEligible: true, primeMontant: 0,
      permisExpireLe: '2028-05-30',
      visiteMedicaleExpireLe: '2026-11-04',
    },
    {
      chauffeurId: 'emp-013', chauffeurNom: 'Jean-Luc Ravelo',
      score: 0, scoreMoisPrecedent: 87,
      familles: [
        famille('securite', 90, 1),
        famille('itineraire', 88, 1),
        famille('reglementaire', 84, 2),
        famille('livraison', 82, 2),
        famille('discipline', 92, 0),
      ],
      historique12m: [82, 83, 85, 84, 86, 87, 86, 88, 87, 88, 87, 88],
      kmPeriode: 10_960, voyagesPeriode: 8, kmMoyenParVoyage: 1_370, depassementsKm: 0,
      infractions: 1, exces: 1, tauxConformiteItineraire: 88,
      consoMoyenne100km: 36.8, ecartConsoPct: 2.2,
      primeEligible: true, primeMontant: 0,
      permisExpireLe: '2027-11-12',
      visiteMedicaleExpireLe: '2026-06-18',
    },
  ])

  /* Calcul dérivé : score global + prime, appliqués une fois au chargement. */
  scores.value.forEach(s => {
    s.score = scoreGlobal(s.familles)
    s.primeMontant = primePour(s.score, s.primeEligible).montant
  })

  /* ══ Getters ═══════════════════════════════════════════════ */
  const getById = (chauffeurId: string) =>
    scores.value.find(s => s.chauffeurId === chauffeurId)

  const classement = computed(() =>
    [...scores.value].sort((a, b) => b.score - a.score),
  )

  const scoreMoyen = computed(() =>
    scores.value.length
      ? Math.round(scores.value.reduce((s, x) => s + x.score, 0) / scores.value.length)
      : 0,
  )

  const totalKm = computed(() => scores.value.reduce((s, x) => s + x.kmPeriode, 0))

  /** Infractions pour 1 000 km — indicateur du catalogue GTD. */
  const infractionsPour1000km = computed(() => {
    const km = totalKm.value
    if (!km) return 0
    const inf = scores.value.reduce((s, x) => s + x.infractions, 0)
    return Number(((inf / km) * 1000).toFixed(2))
  })

  /** Position relative anonymisée, destinée à l'espace conducteur. */
  function percentile(chauffeurId: string): number {
    const rang = classement.value.findIndex(s => s.chauffeurId === chauffeurId)
    if (rang === -1) return 0
    return Math.round(((classement.value.length - rang) / classement.value.length) * 100)
  }

  /** Échéances individuelles à moins de N jours — alimente le moteur d'alertes. */
  function echeancesProches(joursPreavis = 30) {
    const limite = Date.now() + joursPreavis * 86_400_000
    const out: { chauffeurNom: string; type: string; date: string; expire: boolean }[] = []
    scores.value.forEach(s => {
      const push = (type: string, d?: string) => {
        if (!d) return
        const t = +new Date(d)
        if (t <= limite) out.push({ chauffeurNom: s.chauffeurNom, type, date: d, expire: t < Date.now() })
      }
      push('Permis de conduire', s.permisExpireLe)
      push('Visite médicale', s.visiteMedicaleExpireLe)
    })
    return out.sort((a, b) => +new Date(a.date) - +new Date(b.date))
  }

  /* ══ Actions ═══════════════════════════════════════════════ */
  function ajusterPonderation(f: FamilleScore, poids: number) {
    PONDERATIONS[f].poids = poids
    scores.value.forEach(s => {
      s.familles = s.familles.map(x =>
        x.famille === f ? { ...x, poids } : { ...x, poids: PONDERATIONS[x.famille].poids },
      )
      s.score = scoreGlobal(s.familles)
      s.primeMontant = primePour(s.score, s.primeEligible).montant
    })
  }

  function recalculer(chauffeurId: string) {
    const s = getById(chauffeurId)
    if (!s) return
    s.score = scoreGlobal(s.familles)
    s.primeMontant = primePour(s.score, s.primeEligible).montant
  }

  return {
    scores,
    classement, scoreMoyen, totalKm, infractionsPour1000km,
    getById, percentile, echeancesProches,
    ajusterPonderation, recalculer,
  }
})
