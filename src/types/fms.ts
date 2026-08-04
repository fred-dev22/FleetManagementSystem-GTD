/**
 * MODULE 3 — FMS : Voyages, conformité d'itinéraire, carburant, documents logistiques.
 *
 * Complète `types/index.ts` (MODULE 1 Personnel, MODULE 2 Véhicules).
 * Le VOYAGE est l'objet pivot : l'itinéraire l'observe dans l'espace, le score
 * conducteur l'agrège dans le temps, le carburant mesure ce qu'il a consommé,
 * les documents attestent de ce qu'il a livré.
 */

export interface LatLng { lat: number; lng: number }

/* ══════════════════════════════════════════════════════════════
   1. TRAJET  (séquence ordonnée de sites)
   ══════════════════════════════════════════════════════════════ */

/**
 * Décision de conception : le système ne calcule AUCUN itinéraire.
 * Un trajet est un ensemble de sites ordonnés — rien de plus.
 * Le tracé affiché sur la carte n'est qu'une simulation visuelle,
 * jamais enregistrée : seule la séquence de sites fait foi, parce que
 * c'est elle que la télématique peut vérifier.
 */

export type RoleEtape =
  | 'depart' | 'chargement' | 'livraison' | 'controle' | 'repos' | 'arrivee'

export const LIB_ROLE_ETAPE: Record<RoleEtape, string> = {
  depart:     'Départ',
  chargement: 'Chargement',
  livraison:  'Livraison',
  controle:   'Point de contrôle',
  repos:      'Repos autorisé',
  arrivee:    'Arrivée',
}

export interface EtapeTrajet {
  id: string
  siteId: string
  siteNom: string
  ordre: number
  lat: number
  lng: number
  role: RoleEtape
  /** Durée prévue depuis l'étape précédente, en minutes */
  intervalleMin?: number
  /** Pause ou repos programmé à cette étape, en minutes */
  pausePrevueMin?: number
  /** Renseigné à l'exécution, depuis la télématique */
  heureReelle?: string
  /** Données terrain affichées dans le détail du voyage */
  observation?: string
  heureArrivee?: string
  heureDepart?: string
  volumePrevuL?: number
  volumeAmbiantL?: number
  temperatureC?: number
  volume15L?: number
  numeroBon?: string
  podRecu?: boolean
  franchi?: boolean
}

export type ExamenType = 'visite_medicale' | 'permis' | 'formation_apth'
export type AptitudeChauffeur = 'apte' | 'non_apte' | 'a_renouveler'

export const LIB_EXAMEN: Record<ExamenType, string> = {
  visite_medicale: 'Visite médicale',
  permis: 'Permis',
  formation_apth: 'Formation APTH',
}

export const LIB_APTITUDE: Record<AptitudeChauffeur, { label: string; cls: string }> = {
  apte: { label: 'Apte', cls: 'bg-success-bg text-success' },
  non_apte: { label: 'Inapte', cls: 'bg-danger-bg text-danger' },
  a_renouveler: { label: 'À renouveler', cls: 'bg-warning-bg text-warning' },
}

export type CodeInfractionDebrief =
  | 'retard_depart'
  | 'non_respect_plan'
  | 'arret_non_autorise'
  | 'repos_non_respecte'
  | 'controle_non_effectue'
  | 'tcc_non_respecte'
  | 'conduite_agressive'
  | 'document_manquant'
  | 'autre'

export type NiveauInfraction = 'leger' | 'moyen' | 'grave'

export interface LigneInfractionDebrief {
  code: CodeInfractionDebrief
  nombre: number
  niveau?: NiveauInfraction
  date?: string
  explication?: string
}

export interface InfractionDebrief extends LigneInfractionDebrief {}

export const LIB_INFRACTION_DEBRIEF: Record<CodeInfractionDebrief, string> = {
  retard_depart: 'Retard au départ',
  non_respect_plan: 'Non respect du plan de trajet',
  arret_non_autorise: 'Arrêt non autorisé',
  repos_non_respecte: 'Repos non respecté',
  controle_non_effectue: 'Contrôle non effectué',
  tcc_non_respecte: 'TCC non respecté',
  conduite_agressive: 'Conduite agressive',
  document_manquant: 'Document manquant',
  autre: 'Autre',
}

export interface DebriefingVoyage {
  voyageId: string
  remontees?: string
  actions: Array<{
    id: string
    libelle: string
    priorite?: 'faible' | 'normale' | 'elevee'
    close?: boolean
    responsable?: string
    dateLimite?: string
  }>
  signatureResponsable?: string
  signatureChauffeur?: string
  dateCloture?: string
  planTrajetRespecte?: boolean
  arretsRespectes?: boolean
  reposRespectes?: boolean
  infractions: InfractionDebrief[]
}

export type StatutTrajet = 'actif' | 'archive'

export interface Trajet {
  id: string
  code: string
  libelle: string
  etapes: EtapeTrajet[]
  distanceEstimeeKm: number
  dureeEstimeeMin: number
  /** Trajet de référence réutilisable, enregistré en configuration */
  recurrent: boolean
  clientNom?: string
  statut: StatutTrajet
  createdAt: string
}

/* ══════════════════════════════════════════════════════════════
   2. VOYAGE  (objet pivot)
   ══════════════════════════════════════════════════════════════ */

export type StatutVoyage =
  | 'planifie' | 'affecte' | 'en_cours' | 'livre' | 'cloture' | 'litige' | 'annule'

/**
 * Volumétrie hydrocarbures.
 * Le volume à 15 °C est TOUJOURS calculé par le système (`lib/fmsUtils.volumeA15`),
 * jamais ressaisi : source d'erreur la plus fréquente et motif récurrent de litige.
 */
export interface VolumesVoyage {
  produit: string
  volumeChargeAmbiant?: number      // litres (ATA)
  temperatureChargement?: number    // °C
  densite?: number                  // kg/L à 15 °C
  volumeCharge15?: number           // calculé
  volumeDechargeAmbiant?: number
  temperatureDechargement?: number
  volumeDecharge15?: number         // calculé
}

export type TypeDocVoyage =
  | 'ordre_transfert' | 'bon_chargement' | 'feuille_route'
  | 'bon_livraison' | 'note_protet' | 'justificatif_carburant'

export interface DocumentVoyage {
  id: string
  voyageId: string
  type: TypeDocVoyage
  numero?: string
  emetteur?: string
  date?: string
  fichierNom?: string
  obligatoire: boolean
  present: boolean
}

export interface ArretReleve {
  id: string
  voyageId: string
  debut: string
  fin: string
  dureeMin: number
  lat: number
  lng: number
  lieu?: string
  dansSiteDeclare: boolean
  justifie: boolean
  motif?: string
}

export interface Voyage {
  id: string
  reference: string                 // 'VOY-2026-0148'
  numeroOT?: string                 // n° ordre de transfert GRT
  statut: StatutVoyage

  clientNom: string
  /** Tolérance de coulage contractuelle, en ‰ (LPSA 0,5 ‰ · GTD 1 ‰) */
  toleranceCoulagePourMille: number

  /** Trajet de référence dont ce voyage est issu, s'il y en a un */
  trajetId?: string
  trajetLibelle?: string
  /** COPIE de la séquence de sites au moment du départ.
   *  Volontairement une copie et non une référence : modifier un trajet de
   *  référence ne doit pas altérer rétroactivement les voyages déjà clôturés. */
  etapes: EtapeTrajet[]
  origine: string
  destination: string

  vehiculeId?: string
  vehiculePlaque?: string
  citerneId?: string
  citernePlaque?: string
  chauffeurId?: string
  chauffeurNom?: string

  datePlanifiee: string
  dateDepartReel?: string
  dateArriveeReelle?: string

  kmReference: number
  kmDepart?: number
  kmArrivee?: number

  volumes: VolumesVoyage
  traceReel?: LatLng[]

  nbEcarts: number
  nbArretsNonJustifies: number
  litresDelivres: number

  createdAt: string
}

/* ══════════════════════════════════════════════════════════════
   3. ÉCARTS D'ITINÉRAIRE
   ══════════════════════════════════════════════════════════════ */

export type TypeEcart =
  | 'sortie_trajet' | 'arret_non_planifie' | 'point_passage_manque'
  | 'zone_interdite' | 'ecart_kilometrique' | 'fenetre_horaire'

export type GraviteEcart = 'mineur' | 'majeur' | 'critique'

/**
 * Un écart naît TOUJOURS au statut `a_qualifier`.
 * Le système mesure un écart ; il ne présume jamais d'une intention.
 * Seule `non_justifiee` alimente le score conducteur et le circuit disciplinaire.
 */
export type NatureEcart = 'a_qualifier' | 'autorisee' | 'subie' | 'non_justifiee'

export type DecisionEcart = 'classe' | 'avertissement' | 'codis'

export interface EcartItineraire {
  id: string
  voyageId: string
  voyageRef: string
  vehiculePlaque: string
  chauffeurId?: string
  chauffeurNom: string
  trajetLibelle?: string

  /** Référence vers le type d'écart configuré (voir TypeEcartConfig) */
  typeEcartId?: string
  type: TypeEcart
  gravite: GraviteEcart
  nature: NatureEcart

  detecteLe: string
  dureeMin?: number
  distanceKm?: number
  ecartLateralMaxM?: number
  lat: number
  lng: number
  lieu?: string

  tracePrevu: LatLng[]
  traceReel: LatLng[]

  justificationChauffeur?: string
  justifieLe?: string
  qualifiePar?: string
  qualifieLe?: string
  motifQualification?: string
  decision?: DecisionEcart
  refCodis?: string
}

/* ══════════════════════════════════════════════════════════════
   4. SCORE CONDUCTEUR
   ══════════════════════════════════════════════════════════════ */

export type FamilleScore =
  | 'securite' | 'itineraire' | 'reglementaire' | 'livraison' | 'discipline'

export interface DetailFamilleScore {
  famille: FamilleScore
  libelle: string
  poids: number        // % — paramétrable par la direction
  note: number         // /100 sur la famille
  evenements: number
}

export interface ScoreConducteur {
  chauffeurId: string
  chauffeurNom: string

  score: number
  scoreMoisPrecedent: number
  familles: DetailFamilleScore[]
  historique12m: number[]

  kmPeriode: number
  voyagesPeriode: number
  kmMoyenParVoyage: number
  depassementsKm: number

  infractions: number
  exces: number
  tauxConformiteItineraire: number

  consoMoyenne100km: number
  ecartConsoPct: number

  primeEligible: boolean
  primeMontant: number
  motifNonEligibilite?: string

  permisExpireLe?: string
  visiteMedicaleExpireLe?: string
}

/* ══════════════════════════════════════════════════════════════
   5. CARBURANT  (sans capteur — méthode plein-à-plein)
   ══════════════════════════════════════════════════════════════ */

export type CanalRecharge = 'import' | 'mobile' | 'regularisation'

export type CodeControle =
  | 'volume_sup_reservoir' | 'odometre_incoherent' | 'position_incoherente'
  | 'recharges_rapprochees' | 'chauffeur_non_affecte' | 'hors_plage'

export interface ControleVraisemblance {
  code: CodeControle
  libelle: string
  ok: boolean
  detail?: string
}

export type StatutRecharge = 'valide' | 'anomalie' | 'en_qualification' | 'qualifie'
export type QualifEcartCarburant = 'technique' | 'conduite' | 'prelevement' | 'saisie'

export interface RechargeCarburant {
  id: string
  date: string
  vehiculeId: string
  vehiculePlaque: string
  chauffeurId?: string
  chauffeurNom?: string
  voyageId?: string
  voyageRef?: string

  litres: number
  prixLitre: number
  montant: number             // Ariary
  odometre: number

  /** Suivi par bons — le client délivre des bons d'un litrage fixe (ex. 500 L).
   *  Le nombre de bons par véhicule sur une période est un indicateur à part
   *  entière : il permet de comparer l'efficacité des véhicules sans capteur. */
  nombreBons?: number
  litresParBon?: number
  /** Indispensable au calcul plein-à-plein */
  pleinComplet: boolean

  lieu: string
  lat: number
  lng: number
  canal: CanalRecharge

  /** Position réelle du véhicule à l'horodatage déclaré (source Camtrack) */
  positionVehicule?: { lat: number; lng: number; ecartKm: number }

  controles: ControleVraisemblance[]
  statut: StatutRecharge
  qualification?: QualifEcartCarburant
  commentaire?: string
}

/** Consommation calculée entre deux pleins complets successifs. */
export interface PeriodeConso {
  vehiculeId: string
  vehiculePlaque: string
  du: string
  au: string
  litres: number
  km: number
  litresPour100km: number
  refConso: number
  ecartPct: number
  trajetCode?: string
  chauffeurNom?: string
}

/* ══════════════════════════════════════════════════════════════
   6. CARTOGRAPHIE  (contrat du composant FleetMap)
   ══════════════════════════════════════════════════════════════ */

export interface MapMarker {
  id: string
  lat: number
  lng: number
  label: string
  sublabel?: string
  color?: string
}

/** Zone à afficher sur la carte : site géorepéré, zone interdite, point de repos. */
export interface ZoneCarte {
  id: string
  nom: string
  type: 'obligatoire' | 'interdit' | 'repos'
  lat: number
  lng: number
  rayonM: number
}

export interface MapArret {
  id: string
  lat: number
  lng: number
  label: string
  dureeMin: number
  justifie: boolean
}


/* ══════════════════════════════════════════════════════════════
   7. CONFIGURATION  (données de référence paramétrables)
   ══════════════════════════════════════════════════════════════ */

/**
 * La page Conformité contient des FAITS — les écarts relevés.
 * La page Configuration contient des RÈGLES — les types d'écart et leurs seuils.
 * Sans cette séparation, on affiche des gravités que personne ne peut expliquer.
 */

export type CategorieEcart =
  | 'itineraire' | 'temps' | 'arret' | 'comportement' | 'document'

export const LIB_CATEGORIE_ECART: Record<CategorieEcart, string> = {
  itineraire:   'Itinéraire',
  temps:        'Temps réglementaires',
  arret:        'Arrêts',
  comportement: 'Comportement de conduite',
  document:     'Documents',
}

export interface TypeEcartConfig {
  id: string
  code: string
  libelle: string
  categorie: CategorieEcart
  gravite: GraviteEcart
  /** Seuil de déclenchement, exprimé dans son unité */
  seuilValeur?: number
  seuilUnite?: string
  description?: string
  actif: boolean
}

/** Paramètres généraux de l'exploitation. */
export interface ParametresExploitation {
  litresParBonDefaut: number
  toleranceKmPct: number
  seuilArretMin: number
  tccMaxMin: number          // conduite continue : 4 h 30
  pauseApresTccMin: number   // arrêt d'au moins 45 min
  tcjMaxMin: number          // conduite journalière : 10 h
  ttjMaxMin: number          // travail journalier : 12 h
  trhMinH: number            // repos hebdomadaire : 24 h
  plafondHebdoH: number      // 56 h
  plafondBihebdoH: number    // 90 h
}
