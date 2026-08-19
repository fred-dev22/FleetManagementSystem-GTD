/* ══════════════════════════════════════════════════════════════
   MODULE 3 - MAINTENANCE & INTERVENTIONS
   ══════════════════════════════════════════════════════════════

   Toutes les nomenclatures de ce fichier sont reprises telles quelles
   des documents de GTD. Aucune n'est inventée :
     · sous-systèmes, modes de défaillance et causes racines
       → classeur « base gestion véhicule et maintenance », feuille
         « nomenclature type » (norme ISO 14224)
     · codes d'indisponibilité → classeur CRM 2025
   Ce que le client n'a pas défini est signalé en commentaire.
   ══════════════════════════════════════════════════════════════ */

/* ── Nomenclature ISO 14224 - les onze sous-systèmes ─────────── */
export type SousSysteme =
  | 'moteur' | 'transmission' | 'circuit_air' | 'circuit_carburant'
  | 'freinage' | 'electricite' | 'direction_suspension'
  | 'roues_roulements' | 'chassis_tolerie' | 'refroidissement' | 'citerne'

export const LIB_SOUS_SYSTEME: Record<SousSysteme, string> = {
  moteur:               'Moteur',
  transmission:         'Transmission',
  circuit_air:          'Circuit d’air',
  circuit_carburant:    'Circuit carburant',
  freinage:             'Freinage',
  electricite:          'Électricité et électronique',
  direction_suspension: 'Direction et suspension',
  roues_roulements:     'Roues et roulements',
  chassis_tolerie:      'Châssis et tôlerie',
  refroidissement:      'Refroidissement',
  citerne:              'Citerne',
}

/* ── Les huit modes de défaillance ───────────────────────────── */
export type ModeDefaillance =
  | 'fuite' | 'blocage' | 'rupture' | 'perte_puissance'
  | 'surchauffe' | 'defaillance_electrique' | 'usure_excessive' | 'non_fonctionnel'

export const LIB_MODE_DEFAILLANCE: Record<ModeDefaillance, string> = {
  fuite:                  'Fuite',
  blocage:                'Blocage',
  rupture:                'Rupture',
  perte_puissance:        'Perte de puissance',
  surchauffe:             'Surchauffe',
  defaillance_electrique: 'Défaillance électrique',
  usure_excessive:        'Usure excessive',
  non_fonctionnel:        'Non fonctionnel',
}

/* ── Les cinq causes racines (méthode RCM) ───────────────────── */
export type CauseRacine =
  | 'conception' | 'fournisseur' | 'erreur_humaine'
  | 'environnement' | 'maintenance_insuffisante'

export const LIB_CAUSE_RACINE: Record<CauseRacine, string> = {
  conception:               'Défaut de conception',
  fournisseur:              'Défaut fournisseur',
  erreur_humaine:           'Erreur humaine',
  environnement:            'Conditions environnementales',
  maintenance_insuffisante: 'Maintenance insuffisante',
}

/* ══════════════════════════════════════════════════════════════
   Codes d'indisponibilité - CRM 2025, quatre familles
   ══════════════════════════════════════════════════════════════ */
export type FamilleIndispo = 'technique' | 'reglementaire' | 'administrative' | 'humaine'

export const LIB_FAMILLE_INDISPO: Record<FamilleIndispo, string> = {
  technique:      'Technique',
  reglementaire:  'Réglementaire',
  administrative: 'Administrative',
  humaine:        'Humaine',
}

export type CodeIndispo =
  | 'MTN' | 'PNN' | 'DPN' | 'ACC'
  | 'BRM' | 'MDT' | 'APV' | 'VET' | 'CTV' | 'OBC'
  | 'DRG' | 'NDP' | 'DSC'
  | 'CON' | 'TRH' | 'MED' | 'ABS' | 'SAN'

export interface DefinitionIndispo {
  code: CodeIndispo
  famille: FamilleIndispo
  libelle: string
}

/** Les dix-neuf codes, repris tels quels du CRM 2025. */
export const CODES_INDISPO: DefinitionIndispo[] = [
  { code: 'MTN', famille: 'technique',      libelle: 'Maintenance planifiée' },
  { code: 'PNN', famille: 'technique',      libelle: 'Panne en cours' },
  { code: 'DPN', famille: 'technique',      libelle: 'Dépannage sur site' },
  { code: 'ACC', famille: 'technique',      libelle: 'Accident' },
  { code: 'BRM', famille: 'reglementaire',  libelle: 'Barémage' },
  { code: 'MDT', famille: 'reglementaire',  libelle: 'Visite Madauto' },
  { code: 'APV', famille: 'reglementaire',  libelle: 'Certificat APAVE' },
  { code: 'VET', famille: 'reglementaire',  libelle: 'Vetting' },
  { code: 'CTV', famille: 'reglementaire',  libelle: 'Contre-visite' },
  { code: 'OBC', famille: 'reglementaire',  libelle: 'Système embarqué et caméras' },
  { code: 'DRG', famille: 'administrative', libelle: 'Dérogation' },
  { code: 'NDP', famille: 'administrative', libelle: 'Note de protêt' },
  { code: 'DSC', famille: 'administrative', libelle: 'Dossier chauffeur' },
  { code: 'CON', famille: 'humaine',        libelle: 'Congé chauffeur' },
  { code: 'TRH', famille: 'humaine',        libelle: 'Repos chauffeur' },
  { code: 'MED', famille: 'humaine',        libelle: 'Visite médicale' },
  { code: 'ABS', famille: 'humaine',        libelle: 'Absence' },
  { code: 'SAN', famille: 'humaine',        libelle: 'Sanction' },
]

export const familleDuCode = (c: CodeIndispo): FamilleIndispo =>
  CODES_INDISPO.find(x => x.code === c)?.famille ?? 'technique'

export const libelleDuCode = (c: CodeIndispo): string =>
  CODES_INDISPO.find(x => x.code === c)?.libelle ?? c

/* ══════════════════════════════════════════════════════════════
   US 3.3.1 - Indisponibilité
   ══════════════════════════════════════════════════════════════ */
export interface Indisponibilite {
  id: string
  vehiculeId: string
  vehiculePlaque: string
  code: CodeIndispo
  famille: FamilleIndispo
  debut: string
  fin?: string
  /** Renseigné à la clôture ; calculé à l'affichage tant que l'immobilisation dure */
  dureeJours?: number
  ordreTravailId?: string
  commentaire?: string
}

/* ══════════════════════════════════════════════════════════════
   US 3.2.1 à 3.2.5 - Ordre de travail
   ══════════════════════════════════════════════════════════════ */
export type StatutOT =
  | 'ouvert'            // déclaré, pas encore affecté
  | 'diagnostique'      // sous-système, mode et cause renseignés
  | 'attente_piece'     // besoin d'achat en cours
  | 'en_cours'          // travaux engagés
  | 'attente_validation'
  | 'cloture'
  | 'annule'

export const LIB_STATUT_OT: Record<StatutOT, string> = {
  ouvert:             'Ouvert',
  diagnostique:       'Diagnostiqué',
  attente_piece:      'En attente de pièce',
  en_cours:           'En cours',
  attente_validation: 'À valider',
  cloture:            'Clôturé',
  annule:             'Annulé',
}

/** Ce qui a déclenché la déclaration - US 3.2.1. */
export type OrigineOT =
  | 'remontee_chauffeur' | 'checklist' | 'alerte_preventive'
  | 'constat_garage' | 'equipe_mobile' | 'diagnostic_obc'

export const LIB_ORIGINE_OT: Record<OrigineOT, string> = {
  remontee_chauffeur: 'Remontée chauffeur',
  checklist:          'Anomalie de checklist',
  alerte_preventive:  'Échéance préventive',
  constat_garage:     'Constat au garage',
  equipe_mobile:      'Intervention équipe mobile',
  diagnostic_obc:     'Code défaut du boîtier',
}

export type TypeMaintenance = 'preventif' | 'correctif' | 'ameliorative'

export const LIB_TYPE_MAINTENANCE: Record<TypeMaintenance, string> = {
  preventif:    'Préventif',
  correctif:    'Correctif',
  ameliorative: 'Améliorative',
}

export type GraviteOT = 'mineure' | 'majeure' | 'critique'

export const LIB_GRAVITE_OT: Record<GraviteOT, { label: string; cls: string }> = {
  mineure:  { label: 'Mineure',  cls: 'bg-gray-100 text-gray-600' },
  majeure:  { label: 'Majeure',  cls: 'bg-warning-bg text-warning' },
  critique: { label: 'Critique', cls: 'bg-danger-bg text-danger' },
}

/** Pièce consommée - US 3.2.3, imputation obligatoire à l'intervention. */
export interface PieceConsommee {
  id: string
  reference: string
  designation: string
  quantite: number
  prixUnitaireAr: number
  /** Origine : stock disponible, ou achat déclenché par cette intervention */
  origine: 'stock' | 'achat'
  demandeAchatId?: string
  /** Renseigné quand la pièce a été réceptionnée */
  dateReception?: string
}

/** Demande d'achat déclenchée depuis une intervention - US 3.2.3. */
export type StatutAchat = 'demandee' | 'commandee' | 'receptionnee' | 'annulee'

export const LIB_STATUT_ACHAT: Record<StatutAchat, string> = {
  demandee:     'Demande émise',
  commandee:    'Bon de commande établi',
  receptionnee: 'Réceptionnée',
  annulee:      'Annulée',
}

export interface DemandeAchat {
  id: string
  ordreTravailId: string
  reference: string
  designation: string
  quantite: number
  statut: StatutAchat
  fournisseur?: string
  numeroBonCommande?: string
  dateDemande: string
  dateCommande?: string
  dateReception?: string
  montantAr?: number
  /** Délai réellement constaté, isolé du temps de réparation - voir US 3.2.4 */
  delaiJours?: number
}

/** Main-d'œuvre - US 3.2.4.
 *  Le tarif horaire interne n'a pas été communiqué par GTD :
 *  le coût de main-d'œuvre reste donc non valorisé tant qu'il manque. */
export interface TempsPasse {
  id: string
  mecanicienNom: string
  heures: number
  date: string
}

/**
 * US 3.2.2 - Jusqu'à quatre pannes simultanées sur un même véhicule,
 * chacune avec sa gravité et son diagnostic codifié.
 */
export interface PanneDiagnostiquee {
  id: string
  sousSysteme: SousSysteme
  modeDefaillance: ModeDefaillance
  causeRacine: CauseRacine
  gravite: GraviteOT
  observation?: string
}

export const MAX_PANNES_SIMULTANEES = 4

/* ══════════════════════════════════════════════════════════════
   US 3.4.1 - Charge de l'atelier
   Les quatre compétences sont nommées dans la user story elle-même :
   mécanique, électricité, citerne, pneumatique.
   ══════════════════════════════════════════════════════════════ */
export type CompetenceAtelier = 'mecanique' | 'electricite' | 'citerne' | 'pneumatique'

export const LIB_COMPETENCE: Record<CompetenceAtelier, string> = {
  mecanique:   'Mécanique',
  electricite: 'Électricité',
  citerne:     'Citerne',
  pneumatique: 'Pneumatique',
}

/* ══════════════════════════════════════════════════════════════
   Paramètres de l'atelier
   ══════════════════════════════════════════════════════════════
   Trois valeurs manquaient au démarrage et bloquaient autant
   d'indicateurs. Elles ne sont pas inventées : elles sont saisies
   par l'exploitation depuis Maintenance → Paramétrage → Atelier.
   Tant qu'elles valent null, les indicateurs qu'elles gouvernent
   restent masqués et la raison est affichée à l'écran.
     1. capacité de l'atelier      → taux d'occupation
     2. tarif horaire main-d'œuvre → coût complet d'une intervention
     3. coût d'immobilisation/jour → valorisation des jours perdus
   ══════════════════════════════════════════════════════════════ */

/**
 * D'où vient une valeur de paramétrage.
 *
 * `simulation` : valeur de départ posée pour que les indicateurs soient
 * démontrables. Elle produit de vrais calculs et doit donc être signalée
 * partout où elle sert, sans quoi un chiffre simulé passerait pour une
 * mesure. `client` : valeur saisie par GTD, elle fait foi.
 */
export type OrigineValeur = 'simulation' | 'client'

/** Capacité de l'atelier : postes de travail et heures d'ouverture. */
export interface CapaciteAtelier {
  origine: OrigineValeur
  /** D'où sort la valeur de simulation, pour que le client puisse la juger */
  justification?: string
  /** Garage concerné - Andoharanofotsy pour GTD */
  site: string
  /** Nombre de postes de travail pouvant accueillir un camion en parallèle */
  postes: number | null
  /** Heures d'ouverture par jour */
  heuresParJour: number | null
  /** Jours ouvrés par semaine - du lundi au samedi = 6 */
  joursOuvresParSemaine: number | null
}

/**
 * Tarif horaire de la main-d'œuvre interne, en ariary.
 * Un tarif unique suffit ; s'il varie selon la spécialité, les quatre
 * compétences de l'atelier peuvent être renseignées séparément.
 */
export interface TarifMainOeuvre {
  origine: OrigineValeur
  justification?: string
  /** Tarif appliqué à défaut de tarif par spécialité */
  tarifUniqueAr: number | null
  /** Tarif par spécialité, quand il diffère du tarif unique */
  parCompetence: Partial<Record<CompetenceAtelier, number>>
}

/**
 * Manque à gagner d'une journée d'immobilisation, en ariary.
 * Une moyenne suffit ; si elle diffère selon le type de véhicule,
 * tracteur et citerne sont distingués.
 */
export interface CoutImmobilisation {
  origine: OrigineValeur
  justification?: string
  /** Moyenne tous véhicules confondus */
  moyenJourAr: number | null
  /** Par type de véhicule, quand la moyenne ne suffit pas */
  tracteurJourAr: number | null
  citerneJourAr: number | null
}

export interface ParametresAtelier {
  capacite: CapaciteAtelier
  mainOeuvre: TarifMainOeuvre
  immobilisation: CoutImmobilisation
}

/**
 * Compétence déduite du sous-système concerné : elle n'a pas à être saisie,
 * le diagnostic ISO 14224 la détermine.
 */
export const COMPETENCE_PAR_SOUS_SYSTEME: Record<SousSysteme, CompetenceAtelier> = {
  moteur:               'mecanique',
  transmission:         'mecanique',
  circuit_air:          'mecanique',
  circuit_carburant:    'mecanique',
  freinage:             'mecanique',
  electricite:          'electricite',
  direction_suspension: 'mecanique',
  roues_roulements:     'pneumatique',
  chassis_tolerie:      'mecanique',
  refroidissement:      'mecanique',
  citerne:              'citerne',
}

/** Priorité d'ordonnancement, déduite de la gravité déjà saisie. */
export const PRIORITE_PAR_GRAVITE: Record<GraviteOT, number> = {
  critique: 1,
  majeure:  2,
  mineure:  3,
}

export interface OrdreTravail {
  id: string
  reference: string
  vehiculeId: string
  vehiculePlaque: string

  /* Déclaration */
  origine: OrigineOT
  declarePar: string
  declareLe: string
  symptome: string
  gravite: GraviteOT
  typeMaintenance: TypeMaintenance

  /* Diagnostic ISO 14224 - US 3.2.2 */
  sousSysteme?: SousSysteme
  modeDefaillance?: ModeDefaillance
  causeRacine?: CauseRacine
  diagnostiquePar?: string
  diagnostiqueLe?: string
  /** Pannes additionnelles relevées sur le même véhicule - US 3.2.2 */
  pannes?: PanneDiagnostiquee[]

  /* Réalisation */
  statut: StatutOT
  mecaniciens: string[]
  pieces: PieceConsommee[]
  temps: TempsPasse[]
  travauxRealises?: string

  /* Sous-traitance - US 3.2.5 */
  prestataire?: string
  montantDevisAr?: number
  sousGarantie?: boolean

  /* Clôture - US 3.2.4 */
  clotureLe?: string
  cloturePar?: string
  /** Coût des pièces + sous-traitance. La main-d'œuvre n'est pas valorisée
   *  faute de tarif horaire communiqué par GTD. */
  coutPiecesAr?: number

  /* Kilométrage au moment de l'intervention, pour le MTBF */
  kilometrage?: number

  /* US 3.4.1 - Planification de l'atelier */
  /** Durée estimée des travaux, en heures. Saisie par le chef de garage. */
  dureeEstimeeH?: number
  /** Date à laquelle l'intervention est programmée à l'atelier */
  planifieeLe?: string
}

/* ══════════════════════════════════════════════════════════════
   US 3.1.1 - Plan d'entretien par modèle
   ══════════════════════════════════════════════════════════════ */
export type NatureOperation = 'verifier' | 'lubrifier' | 'remplacer'

export const LIB_NATURE_OPERATION: Record<NatureOperation, string> = {
  verifier:   'Vérifier',
  lubrifier:  'Lubrifier',
  remplacer:  'Remplacer',
}

export interface OperationEntretien {
  id: string
  libelle: string
  sousSysteme: SousSysteme
  nature: NatureOperation
  /** Déclenchement au premier des deux seuils atteint */
  intervalleKm?: number
  intervalleJours?: number
}

export interface PlanEntretien {
  id: string
  modele: string
  marque: string
  operations: OperationEntretien[]
  actif: boolean
  /**
   * Un plan provisoire n'a pas été transmis par le constructeur : il a été
   * saisi pour que les échéances existent, sur la base des intervalles
   * courants du segment. Il déclenche de vraies alertes, il est donc
   * signalé partout où il sert et attend confirmation de GTD.
   */
  provisoire?: boolean
  /** Origine des intervalles : carnet constructeur, usage du parc, estimation */
  source?: string
}

/** Échéance calculée pour un véhicule donné - US 3.1.2. */
export interface EcheanceEntretien {
  vehiculeId: string
  vehiculePlaque: string
  operationId: string
  operationLibelle: string
  sousSysteme: SousSysteme
  nature: NatureOperation
  kmProchain?: number
  dateProchaine?: string
  /** Négatif si l'échéance est dépassée */
  kmRestants?: number
  joursRestants?: number
  statut: 'a_venir' | 'proche' | 'depassee'
}

/* ══════════════════════════════════════════════════════════════
   US 3.3.2 - Intervention de l'équipe mobile
   ══════════════════════════════════════════════════════════════ */
export type TypeMissionMobile =
  | 'depannage_mecanique' | 'depannage_electrique' | 'securisation'
  | 'controle_alcool_drogue' | 'controle_clandestin' | 'surveillance'

export const LIB_MISSION_MOBILE: Record<TypeMissionMobile, string> = {
  depannage_mecanique:    'Dépannage mécanique',
  depannage_electrique:   'Dépannage électrique',
  securisation:           'Sécurisation fuite ou accident',
  controle_alcool_drogue: 'Contrôle alcool et drogue',
  controle_clandestin:    'Détection passagers clandestins',
  surveillance:           'Surveillance comportementale',
}

export interface InterventionMobile {
  id: string
  reference: string
  type: TypeMissionMobile
  vehiculeId?: string
  vehiculePlaque?: string
  lieu: string
  lat?: number
  lng?: number
  declencheLe: string
  arriveeLe?: string
  clotureLe?: string
  /** Composition de l'équipe : responsable de mission, HSE, mécanicien, électricien */
  equipe: string[]
  resolu: boolean
  ordreTravailId?: string
  /** Pour les contrôles : nombre de tests réalisés et nombre de positifs */
  testsRealises?: number
  testsPositifs?: number
  observation?: string
}
