/**
 * Utilitaires métier du module FMS.
 * Regroupés ici pour que la règle de calcul soit unique et testable —
 * en particulier la correction volumétrique, qui ne doit JAMAIS être ressaisie.
 */
import type { LatLng, Voyage, VolumesVoyage } from '../types/fms'

/* ══════════════════════════════════════════════════════════════
   Volumétrie hydrocarbures
   ══════════════════════════════════════════════════════════════ */

/**
 * Correction du volume ambiant (ATA) vers le volume normalisé à 15 °C.
 * Approximation linéaire du coefficient de dilatation des produits pétroliers
 * (API MPMS ch. 11.1) : suffisante pour la maquette, à remplacer par la table
 * officielle si le client l'exige.
 *
 *   V15 = Vamb × [1 − α × (T − 15)]
 *   α ≈ 0,00084 /°C pour le gazole (densité ~0,84)
 */
export function volumeA15(
  volumeAmbiant?: number,
  temperature?: number,
  densite = 0.84,
): number | undefined {
  if (volumeAmbiant == null || temperature == null) return undefined
  const alpha = 0.0008 + (0.85 - densite) * 0.0004
  return Math.round(volumeAmbiant * (1 - alpha * (temperature - 15)))
}

/** Recalcule les deux volumes normalisés d'un voyage. */
export function normaliserVolumes(v: VolumesVoyage): VolumesVoyage {
  return {
    ...v,
    volumeCharge15: volumeA15(v.volumeChargeAmbiant, v.temperatureChargement, v.densite),
    volumeDecharge15: volumeA15(v.volumeDechargeAmbiant, v.temperatureDechargement, v.densite),
  }
}

/** Verdict d'un écart de livraison, comparé à la tolérance contractuelle. */
export type VerdictCoulage = 'incomplet' | 'dans_tolerance' | 'hors_mineur' | 'hors_majeur'

export interface ResultatCoulage {
  ecartL: number | null
  ecartPourMille: number | null
  tolerance: number
  /** `dans_tolerance` | `hors_mineur` (< 2×) | `hors_majeur` (≥ 2×) */
  verdict: VerdictCoulage
}

/**
 * Écart de livraison (coulage) : volume chargé − volume déchargé, tous deux à 15 °C,
 * comparé à la tolérance contractuelle du client (LPSA 0,5 ‰ · GTD 1 ‰).
 */
export function calculerCoulage(voyage: Voyage): ResultatCoulage {
  const { volumeCharge15: c, volumeDecharge15: d } = voyage.volumes
  const tolerance = voyage.toleranceCoulagePourMille

  if (c == null || d == null) {
    return { ecartL: null, ecartPourMille: null, tolerance, verdict: 'incomplet' }
  }

  const ecartL = c - d
  const ecartPourMille = Number(((ecartL / c) * 1000).toFixed(2))

  let verdict: VerdictCoulage = 'dans_tolerance'
  if (ecartPourMille > tolerance * 2) verdict = 'hors_majeur'
  else if (ecartPourMille > tolerance) verdict = 'hors_mineur'

  return { ecartL, ecartPourMille, tolerance, verdict }
}

/* ══════════════════════════════════════════════════════════════
   Géométrie
   ══════════════════════════════════════════════════════════════ */

const R = 6371 // km

/** Distance grand-cercle entre deux points, en kilomètres. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Longueur cumulée d'une polyligne, en kilomètres. */
export function longueurTrace(trace: LatLng[]): number {
  let total = 0
  for (let i = 1; i < trace.length; i++) {
    const a = trace[i - 1]
    const b = trace[i]
    if (a && b) total += distanceKm(a, b)
  }
  return Math.round(total)
}

/**
 * Écart latéral maximal d'une trace réelle par rapport au tracé de référence,
 * en mètres. Version simplifiée : distance minimale de chaque point réel aux
 * sommets du tracé de référence. Suffisant pour la maquette ; à remplacer par une
 * projection point-segment côté serveur.
 */
export function ecartLateralMaxM(tracePrevu: LatLng[], traceReel: LatLng[]): number {
  let max = 0
  for (const p of traceReel) {
    let min = Infinity
    for (const q of tracePrevu) min = Math.min(min, distanceKm(p, q))
    max = Math.max(max, min)
  }
  return Math.round(max * 1000)
}



/* ══════════════════════════════════════════════════════════════
   Coulage multi-sites
   ══════════════════════════════════════════════════════════════ */

/**
 * Un voyage dessert PLUSIEURS sites : le camion charge à un dépôt puis livre
 * successivement. Le coulage se calcule donc comme la différence entre ce qui
 * a été chargé et la SOMME de ce qui a été livré — le tout à 15 °C.
 */
export interface CoulageMultiSites {
  chargeL: number | null
  livreL: number | null
  ecartL: number | null
  ecartPourMille: number | null
  tolerance: number
  verdict: VerdictCoulage
  /** Détail par site de livraison */
  sites: Array<{
    etapeId: string
    siteNom: string
    ordre: number
    prevuL?: number
    ambiantL?: number
    temperatureC?: number
    volume15L?: number
    /** Écart entre le volume prévu et le volume livré sur ce site */
    ecartSiteL: number | null
    livre: boolean
  }>
  /** Volume prévu mais non livré, faute de site desservi */
  nonLivreL: number
}

/** Renseigne le volume à 15 °C de chaque étape à partir des mesures. */
export function normaliserEtapes<T extends {
  volumeAmbiantL?: number; temperatureC?: number; volume15L?: number
}>(etapes: T[], densite = 0.84): T[] {
  return etapes.map(e => ({
    ...e,
    volume15L: volumeA15(e.volumeAmbiantL, e.temperatureC, densite),
  }))
}

export function calculerCoulageMultiSites(
  etapes: Array<{
    id: string; siteNom: string; ordre: number; role: string; franchi?: boolean
    volumePrevuL?: number; volumeAmbiantL?: number; temperatureC?: number; volume15L?: number
  }>,
  tolerance: number,
  densite = 0.84,
): CoulageMultiSites {
  const v15 = (e: { volumeAmbiantL?: number; temperatureC?: number; volume15L?: number }) =>
    e.volume15L ?? volumeA15(e.volumeAmbiantL, e.temperatureC, densite)

  const chargements = etapes.filter(e => e.role === 'chargement')
  const livraisons  = etapes.filter(e => e.role === 'livraison')

  const chargeL = chargements.length
    ? chargements.reduce((s, e) => s + (v15(e) ?? 0), 0) || null
    : null

  const sites = livraisons.map(e => {
    const vol = v15(e)
    return {
      etapeId: e.id,
      siteNom: e.siteNom,
      ordre: e.ordre,
      prevuL: e.volumePrevuL,
      ambiantL: e.volumeAmbiantL,
      temperatureC: e.temperatureC,
      volume15L: vol,
      ecartSiteL: vol != null && e.volumePrevuL != null ? Math.round(vol - e.volumePrevuL) : null,
      livre: vol != null,
    }
  })

  const nonLivreL = livraisons
    .filter(e => v15(e) == null)
    .reduce((s, e) => s + (e.volumePrevuL ?? 0), 0)

  const livres = sites.filter(s => s.livre)
  const livreL = livres.length ? livres.reduce((s, x) => s + (x.volume15L ?? 0), 0) : null

  if (chargeL == null || livreL == null || livres.length < livraisons.length) {
    return { chargeL, livreL, ecartL: null, ecartPourMille: null, tolerance,
             verdict: 'incomplet', sites, nonLivreL }
  }

  const ecartL = Math.round(chargeL - livreL)
  const ecartPourMille = Number(((ecartL / chargeL) * 1000).toFixed(2))

  let verdict: VerdictCoulage = 'dans_tolerance'
  if (Math.abs(ecartPourMille) > tolerance * 2) verdict = 'hors_majeur'
  else if (Math.abs(ecartPourMille) > tolerance) verdict = 'hors_mineur'

  return { chargeL: Math.round(chargeL), livreL: Math.round(livreL),
           ecartL, ecartPourMille, tolerance, verdict, sites, nonLivreL }
}

/* ══════════════════════════════════════════════════════════════
   Conformité aux points de passage
   ══════════════════════════════════════════════════════════════ */

/**
 * Le trajet n'est pas un tracé mais une SÉQUENCE DE SITES.
 * La conformité se mesure donc point par point : chaque site affecté
 * a-t-il été approché à moins du rayon de tolérance, et dans l'ordre ?
 */
export interface EtatPointPassage {
  id: string
  ordre: number
  siteNom: string
  role: string
  lat: number
  lng: number
  /** Distance minimale entre le site et la trace réelle, en km */
  distanceMinKm: number
  franchi: boolean
  /** Rang auquel le point a été approché sur la trace réelle */
  rangReel: number
}

export interface AnalyseConformite {
  points: EtatPointPassage[]
  nbFranchis: number
  nbTotal: number
  manques: string[]
  horsSequence: boolean
  /** Écart latéral maximal de la trace réelle au tracé de référence, en mètres */
  ecartLateralMaxM: number
  tauxConformite: number
}

/**
 * Compare une séquence de sites affectés à la trace réellement enregistrée.
 * @param rayonKm rayon de validation du passage — 5 km par défaut,
 *                cohérent avec la précision d'un relevé télématique en zone rurale.
 */
export interface SiphonnageSignal {
  voyageId: string
  voyageRef: string
  vehiculePlaque?: string
  chauffeurNom?: string
  arretsNonJustifies: number
  dureeArretMaxMin?: number
  ecartConsoPct: number | null
  ecartPourMille: number | null
  toleranceCoulage: number
}

export interface TempsConduiteAnalyse {
  tccMaxMin: number
  pauseApresTccMin: number
  tcjMaxMin: number
  ttjMaxMin: number
}

export interface DepassementTemps {
  libelle: string
  valeurMin: number
  seuilMin: number
  depassementMin: number
  gravite: 'critique' | 'warning'
  siteNom?: string
}

export interface AnalyseTempsConduiteResult {
  conduiteTotaleMin: number
  conduiteContinueMaxMin: number
  pausesTotalesMin: number
  travailTotalMin: number
  conforme: boolean
  depassements: DepassementTemps[]
}

export function detecterSiphonnage(input: SiphonnageSignal) {
  const score = [
    input.arretsNonJustifies > 0 ? 1 : 0,
    input.ecartPourMille != null && input.ecartPourMille > input.toleranceCoulage ? 1 : 0,
    input.ecartConsoPct != null && Math.abs(input.ecartConsoPct) > 8 ? 1 : 0,
  ].reduce((s, n) => s + n, 0)

  const prioritaire = score >= 2
  const signaux = [
    {
      code: 'arrets_non_justifies',
      libelle: 'Arrêts hors site non justifiés',
      detail: `${input.arretsNonJustifies} arrêt(s) hors site sans justification`,
      present: input.arretsNonJustifies > 0,
    },
    {
      code: 'ecart_coulage',
      libelle: 'Écart de coulage',
      detail: `Écart de ${input.ecartPourMille ?? 0}‰ > tolérance ${input.toleranceCoulage}‰`,
      present: input.ecartPourMille != null && input.ecartPourMille > input.toleranceCoulage,
    },
    {
      code: 'ecart_conso',
      libelle: 'Écart de consommation',
      detail: `Écart de ${(input.ecartConsoPct ?? 0).toFixed(1)}%`,
      present: input.ecartConsoPct != null && Math.abs(input.ecartConsoPct) > 8,
    },
  ]

  return {
    risque: score >= 2 ? 'elevé' : score === 1 ? 'modere' : 'faible',
    score,
    prioritaire,
    nbSignaux: score,
    signaux,
    arretsNonJustifies: input.arretsNonJustifies,
    dureeArretMaxMin: input.dureeArretMaxMin,
    ecartConsoPct: input.ecartConsoPct,
    ecartPourMille: input.ecartPourMille,
  }
}

export function analyserTempsConduite(
  etapes: Array<{ role: string; heureArrivee?: string; heureDepart?: string; pausePrevueMin?: number; siteNom?: string }>,
  params: TempsConduiteAnalyse,
): AnalyseTempsConduiteResult {
  const segments = etapes
    .filter(e => e.role === 'livraison' || e.role === 'chargement')
    .map(e => {
      const arrivee = e.heureArrivee ? new Date(e.heureArrivee).getTime() : null
      const depart = e.heureDepart ? new Date(e.heureDepart).getTime() : null
      if (arrivee == null || depart == null) return null
      return {
        arrivee,
        depart,
        dureeMin: Math.max(0, Math.round((depart - arrivee) / 60000)),
        siteNom: e.siteNom,
      }
    })
    .filter((x): x is { arrivee: number; depart: number; dureeMin: number; siteNom?: string } => x !== null)

  const conduiteTotaleMin = segments.reduce((s, x) => s + x.dureeMin, 0)
  const conduiteContinueMaxMin = segments.reduce((m, x) => Math.max(m, x.dureeMin), 0)
  const pausesTotalesMin = etapes.reduce((s, e) => s + (e.pausePrevueMin ?? 0), 0)
  const travailTotalMin = conduiteTotaleMin + pausesTotalesMin

  const depassements: DepassementTemps[] = []
  if (conduiteTotaleMin > params.tcjMaxMin) {
    depassements.push({
      libelle: 'Conduite totale',
      valeurMin: conduiteTotaleMin,
      seuilMin: params.tcjMaxMin,
      depassementMin: conduiteTotaleMin - params.tcjMaxMin,
      gravite: 'warning',
    })
  }
  if (conduiteContinueMaxMin > params.tccMaxMin) {
    depassements.push({
      libelle: 'Conduite continue maximum',
      valeurMin: conduiteContinueMaxMin,
      seuilMin: params.tccMaxMin,
      depassementMin: conduiteContinueMaxMin - params.tccMaxMin,
      gravite: 'critique',
    })
  }
  if (travailTotalMin > params.ttjMaxMin) {
    depassements.push({
      libelle: 'Travail journalier',
      valeurMin: travailTotalMin,
      seuilMin: params.ttjMaxMin,
      depassementMin: travailTotalMin - params.ttjMaxMin,
      gravite: 'warning',
    })
  }

  return {
    conduiteTotaleMin,
    conduiteContinueMaxMin,
    pausesTotalesMin,
    travailTotalMin,
    conforme: depassements.length === 0,
    depassements,
  }
}

export function analyserConformite(
  etapes: Array<{ id: string; ordre: number; siteNom: string; role: string; lat: number; lng: number }>,
  traceReel: LatLng[],
  rayonKm = 5,
): AnalyseConformite {
  const points: EtatPointPassage[] = etapes.map(e => {
    let dMin = Infinity
    let rang = -1
    traceReel.forEach((p, i) => {
      const d = distanceKm({ lat: e.lat, lng: e.lng }, p)
      if (d < dMin) { dMin = d; rang = i }
    })
    return {
      id: e.id,
      ordre: e.ordre,
      siteNom: e.siteNom,
      role: e.role,
      lat: e.lat,
      lng: e.lng,
      distanceMinKm: traceReel.length ? Number(dMin.toFixed(1)) : Infinity,
      franchi: traceReel.length > 0 && dMin <= rayonKm,
      rangReel: rang,
    }
  })

  const franchis = points.filter(p => p.franchi)

  // Ordre respecté : les rangs des points franchis doivent être croissants
  let horsSequence = false
  for (let i = 1; i < franchis.length; i++) {
    if (franchis[i]!.rangReel < franchis[i - 1]!.rangReel) { horsSequence = true; break }
  }

  const tracePrevu = etapes.map(e => ({ lat: e.lat, lng: e.lng }))

  return {
    points,
    nbFranchis: franchis.length,
    nbTotal: points.length,
    manques: points.filter(p => !p.franchi).map(p => p.siteNom),
    horsSequence,
    ecartLateralMaxM: traceReel.length ? ecartLateralMaxM(tracePrevu, traceReel) : 0,
    tauxConformite: points.length ? Math.round((franchis.length / points.length) * 100) : 100,
  }
}

/* ══════════════════════════════════════════════════════════════
   Kilométrage
   ══════════════════════════════════════════════════════════════ */

export interface EcartKm {
  kmReel: number | null
  ecartKm: number | null
  ecartPct: number | null
  horsTolerance: boolean
}

/** Comparaison km réel / km de référence du trajet (ex-« Différence de km »). */
export function calculerEcartKm(voyage: Voyage, tolerancePct = 5): EcartKm {
  if (voyage.kmDepart == null || voyage.kmArrivee == null) {
    return { kmReel: null, ecartKm: null, ecartPct: null, horsTolerance: false }
  }
  const kmReel = voyage.kmArrivee - voyage.kmDepart
  const ecartKm = kmReel - voyage.kmReference
  const ecartPct = Number(((ecartKm / voyage.kmReference) * 100).toFixed(1))
  return { kmReel, ecartKm, ecartPct, horsTolerance: Math.abs(ecartPct) > tolerancePct }
}

/* ══════════════════════════════════════════════════════════════
   Formatage
   ══════════════════════════════════════════════════════════════ */

export const fmtAr = (n?: number) =>
  n == null ? '—' : `${n.toLocaleString('fr-FR')} Ar`

export const fmtL = (n?: number) =>
  n == null ? '—' : `${n.toLocaleString('fr-FR')} L`

export const fmtKm = (n?: number) =>
  n == null ? '—' : `${n.toLocaleString('fr-FR')} km`

export const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR') : '—'

export const fmtDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit',
      })
    : '—'

export const fmtHeure = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'

export function fmtDuree(minutes?: number): string {
  if (minutes == null) return '—'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`
}