/* ══════════════════════════════════════════════════════════════
   MODULE 2 - compléments
   US 2.1.6 · 2.2.3 · 2.2.4 · 2.3.1 · 2.3.2 · 2.4.1

   Toutes les listes de ce fichier sont reprises des documents de GTD.
   Ce que le client n'a pas défini est signalé en commentaire plutôt
   que comblé par une valeur inventée.
   ══════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════
   US 2.1.6 - Équipements embarqués
   Source : cahier des charges ERP GTD, domaine Technologie -
   « Disponibilité GPS / OBC / caméras : 100 % de conformité ».
   Checklist sur route v4, point « Caméra Dôme et vanne ».
   ══════════════════════════════════════════════════════════════ */
export type TypeEquipement = 'obc' | 'gps' | 'camera_dome' | 'camera_vanne' | 'dms'

export const LIB_EQUIPEMENT: Record<TypeEquipement, string> = {
  obc:          'Boîtier embarqué (OBC)',
  gps:          'Balise GPS',
  camera_dome:  'Caméra dôme',
  camera_vanne: 'Caméra vanne',
  dms:          'Détecteur de fatigue (DMS)',
}

export type EtatEquipement = 'operationnel' | 'hors_service' | 'desinstalle'

export const LIB_ETAT_EQUIPEMENT: Record<EtatEquipement, { label: string; cls: string }> = {
  operationnel: { label: 'Opérationnel', cls: 'bg-success-bg text-success' },
  hors_service: { label: 'Hors service', cls: 'bg-danger-bg text-danger' },
  desinstalle:  { label: 'Désinstallé',  cls: 'bg-gray-100 text-gray-500' },
}

/** Les six plateformes en usage chez GTD. */
export type PlateformeTelematique =
  | 'Mzone' | 'Camtrack Pro' | 'Ym@ne' | 'VSS' | 'Ceiba' | 'M-tec'

export const PLATEFORMES: PlateformeTelematique[] =
  ['Mzone', 'Camtrack Pro', 'Ym@ne', 'VSS', 'Ceiba', 'M-tec']

/* ══════════════════════════════════════════════════════════════
   US 2.5.2 - Zones de géorepérage
   ══════════════════════════════════════════════════════════════ */
export type NatureZone = 'site_desservi' | 'zone_interdite' | 'parking_autorise'

export const LIB_NATURE_ZONE: Record<NatureZone, string> = {
  site_desservi:    'Site à desservir',
  zone_interdite:   'Zone interdite',
  parking_autorise: 'Parking autorisé',
}

/**
 * Rayon de validation d'un passage, en mètres.
 *
 * Cette valeur n'est plus qu'un repli : le rayon effectif vient des
 * paramètres d'exploitation - Flotte → Configuration → Paramètres →
 * Seuils d'alerte - où l'exploitation l'ajuste sans intervention
 * technique, et d'un rayon propre au site quand celui-ci en porte un.
 */
export const RAYON_VALIDATION_M = 5_000

/** Une zone interdite se détecte de plus près qu'un site à desservir. */
export const RAYON_PAR_NATURE: Record<NatureZone, number> = {
  site_desservi:    5_000,
  zone_interdite:   2_000,
  parking_autorise: 1_000,
}

export interface EquipementEmbarque {
  id: string
  vehiculeId: string
  type: TypeEquipement
  marque?: string
  numeroSerie?: string
  dateInstallation?: string
  plateforme?: PlateformeTelematique
  etat: EtatEquipement
  /** Tentative de désactivation ou de masquage détectée par la télématique */
  tentativeDesactivation?: { date: string; detail: string }[]
}

/* ══════════════════════════════════════════════════════════════
   US 2.2.4 - États de flotte
   Source : courriels « ÉTAT FLOTTE GTD LPSA », « CC RESTANT SUR
   BASE TNR », « CC immobilisé base TVE ». Treize codes.
   ══════════════════════════════════════════════════════════════ */
export type GroupeEtatFlotte = 'operationnel' | 'transit' | 'attente'

export const LIB_GROUPE_ETAT: Record<GroupeEtatFlotte, string> = {
  operationnel: 'Opérationnel',
  transit:      'En transit',
  attente:      'En attente',
}

export type CodeEtatFlotte =
  | 'DEP-PRV' | 'DEP-REA' | 'RET-VID' | 'RET-CHG' | 'ANN-VYG'
  | 'TR-LIV'  | 'TR-CHG'  | 'TR-VID'  | 'TR-RET'
  | 'ATT-CHG' | 'ATT-LIV' | 'ATT-DEP' | 'ATT-ADM'

export interface DefinitionEtatFlotte {
  code: CodeEtatFlotte
  groupe: GroupeEtatFlotte
  libelle: string
}

/** Les treize codes, repris tels quels des courriels de GTD. */
export const ETATS_FLOTTE: DefinitionEtatFlotte[] = [
  { code: 'DEP-PRV', groupe: 'operationnel', libelle: 'Départ prévu' },
  { code: 'DEP-REA', groupe: 'operationnel', libelle: 'Départ réalisé' },
  { code: 'RET-VID', groupe: 'operationnel', libelle: 'Retour à vide' },
  { code: 'RET-CHG', groupe: 'operationnel', libelle: 'Retour chargé' },
  { code: 'ANN-VYG', groupe: 'operationnel', libelle: 'Voyage annulé' },
  { code: 'TR-LIV',  groupe: 'transit',      libelle: 'En transit vers livraison' },
  { code: 'TR-CHG',  groupe: 'transit',      libelle: 'En transit vers chargement' },
  { code: 'TR-VID',  groupe: 'transit',      libelle: 'En transit à vide' },
  { code: 'TR-RET',  groupe: 'transit',      libelle: 'En transit retour base' },
  { code: 'ATT-CHG', groupe: 'attente',      libelle: 'En attente de chargement' },
  { code: 'ATT-LIV', groupe: 'attente',      libelle: 'En attente de livraison' },
  { code: 'ATT-DEP', groupe: 'attente',      libelle: 'En attente de départ' },
  { code: 'ATT-ADM', groupe: 'attente',      libelle: 'En attente administrative' },
]

export const groupeDeLEtat = (c: CodeEtatFlotte): GroupeEtatFlotte =>
  ETATS_FLOTTE.find(e => e.code === c)?.groupe ?? 'attente'

export const libelleEtat = (c: CodeEtatFlotte): string =>
  ETATS_FLOTTE.find(e => e.code === c)?.libelle ?? c

/** Une ligne de l'état de flotte quotidien transmis au client. */
export interface LigneEtatFlotte {
  vehiculeId: string
  vehiculePlaque: string
  citernePlaque?: string
  chauffeurNom?: string
  etat: CodeEtatFlotte
  /** Renseigné seulement si le véhicule est immobilisé */
  codeIndispo?: string
  motifIndispo?: string
  /** Date prévisionnelle de remise en service - demandée par le client
   *  dans ses relances. Absente si l'échéance n'est pas connue. */
  remiseEnServicePrevue?: string
  voyageRef?: string
  observation?: string
}

/**
 * US 2.2.4 - L'état produit un jour donné reste consultable ensuite.
 * Il constitue la preuve de ce qui a été déclaré au client ce jour-là.
 */
/**
 * État de flotte figé pour un jour donné - US 2.2.4.
 *
 * L'écran annonce « pièce opposable, non modifiable ». Cette promesse
 * n'engage à rien tant qu'un nouvel archivage peut écraser le contenu
 * d'un état déjà transmis au client. Une fois transmis, un état ne se
 * modifie donc plus : une correction produit un rectificatif, qui porte
 * son propre numéro de version et référence l'état qu'il corrige.
 * C'est la pratique de toute pièce opposable : on ne récrit pas, on
 * rectifie, et les deux versions restent consultables.
 */
export interface EtatFlotteArchive {
  id: string
  date: string
  produitPar: string
  lignes: LigneEtatFlotte[]
  /** Renseigné si l'état a effectivement été transmis au client */
  transmisLe?: string
  /** 1 pour l'état initial, incrémenté à chaque rectificatif */
  version: number
  /** Identifiant de la version corrigée, pour un rectificatif */
  rectifieDe?: string
  /** Pourquoi une rectification a été nécessaire */
  motifRectification?: string
}

/* ══════════════════════════════════════════════════════════════
   US 2.3.1 - Checklist sur route
   Source : formulaire « Checklist sur Route » version 4,
   mise à jour du 30/10/2024 - 16 points, jusqu'à 11 pauses.
   ══════════════════════════════════════════════════════════════ */
export interface PointChecklistRoute {
  code: string
  libelle: string
}

/** Les seize points, dans l'ordre du formulaire papier. */
export const POINTS_CHECKLIST_ROUTE: PointChecklistRoute[] = [
  { code: 'FRS', libelle: 'Frein de service' },
  { code: 'FST', libelle: 'Frein de stationnement' },
  { code: 'FLX', libelle: 'Flexible - fuite d’air, branchement' },
  { code: 'DIR', libelle: 'Direction' },
  { code: 'KLX', libelle: 'Klaxon' },
  { code: 'ESG', libelle: 'Essuie-glace' },
  { code: 'RET', libelle: 'Rétroviseur' },
  { code: 'SEC', libelle: 'Matériel de secours - réflecteur, panneau' },
  { code: 'ECL', libelle: 'Éclairage et signalisation' },
  { code: 'PNE', libelle: 'Pneumatiques - clous, gonflage' },
  { code: 'SUS', libelle: 'Suspension' },
  { code: 'CHA', libelle: 'Cadre de châssis' },
  { code: 'ATT', libelle: 'Dispositif d’attelage - sellette, cadenas, chaîne' },
  { code: 'EXT', libelle: 'Extincteurs - expiration, plomb, goupille, pression' },
  { code: 'CAL', libelle: 'Cales' },
  { code: 'CAM', libelle: 'Caméra dôme et vanne' },
]

/** Notation du formulaire : coche si conforme, zéro sinon. */
export type ResultatPoint = 'conforme' | 'anomalie' | 'non_verifie'

export interface ReleveChecklist {
  /** Numéro de pause, de 1 à 11 */
  pause: number
  horodatage: string
  lieu?: string
  resultats: Record<string, ResultatPoint>
  commentaire?: string
}

export interface ChecklistRoute {
  id: string
  reference: string
  voyageId?: string
  voyageRef?: string
  vehiculeId: string
  tracteurPlaque: string
  citernePlaque?: string
  chauffeurId?: string
  chauffeurNom: string
  dateDebut: string
  dateFin?: string
  releves: ReleveChecklist[]
  /** Le formulaire papier est signé par le chauffeur ou le guide */
  signeParChauffeur: boolean
  /** Saisie possible hors connexion, synchronisée au retour du réseau */
  synchroniseLe?: string
}

/* ══════════════════════════════════════════════════════════════
   US 2.3.2 - Audit de conformité et vetting
   Source : classeur « base gestion véhicule et maintenance »,
   feuille base véhicule - postes codés.
   ══════════════════════════════════════════════════════════════ */
export interface PosteAudit {
  code: string
  categorie: string
  libelle: string
}

/**
 * Les postes de contrôle avec leurs codes d'origine.
 * La liste ci-dessous reprend les catégories et les codes relevés dans
 * le classeur de GTD. Elle n'est pas exhaustive : le classeur en compte
 * une trentaine, à compléter au fur et à mesure de leur transmission.
 */
export const POSTES_AUDIT: PosteAudit[] = [
  { code: '100.10',   categorie: 'Type et réglementation',   libelle: 'Type de véhicule et catégorie' },
  { code: '100.20',   categorie: 'Type et réglementation',   libelle: 'Conformité réglementaire du transport de matières dangereuses' },
  { code: '102.10',   categorie: 'Poids et dimensions',      libelle: 'PTAC et PTRA' },
  { code: '102.20',   categorie: 'Poids et dimensions',      libelle: 'Dimensions hors tout' },
  { code: '104.10',   categorie: 'Identification',           libelle: 'Frappe à froid du châssis - 17 caractères' },
  { code: '104.20',   categorie: 'Identification',           libelle: 'Concordance des plaques et de la carte grise' },
  { code: '106.10',   categorie: 'Ordinateur de bord',       libelle: 'Boîtier embarqué et enregistrement des données' },
  { code: '108.10',   categorie: 'Signalisation MD',         libelle: 'Panneaux orange et plaques-étiquettes' },
  { code: '110.10',   categorie: 'Châssis',                  libelle: 'État du cadre de châssis' },
  { code: '112.10',   categorie: 'Chaîne cinématique',       libelle: 'Transmission et arbres' },
  { code: '114.10',   categorie: 'Échappement',              libelle: 'Étanchéité et fixation' },
  { code: '116.10',   categorie: 'Essieux',                  libelle: 'État et jeu des essieux' },
  { code: '118.10',   categorie: 'Roues et pneumatiques',    libelle: 'Usure, pression, homogénéité' },
  { code: '122.50.1', categorie: 'Freinage',                 libelle: 'Efficacité du frein de service' },
  { code: '122.50.2', categorie: 'Freinage',                 libelle: 'Efficacité du frein de stationnement' },
  { code: '124.10',   categorie: 'Réservoirs d’air',         libelle: 'Étanchéité et purge' },
  { code: '140.10',   categorie: 'Équipement électrique',    libelle: 'Faisceaux et connexions' },
  { code: '142.10',   categorie: 'Éclairage et signalisation', libelle: 'Feux avant et arrière' },
  { code: '142.20',   categorie: 'Éclairage et signalisation', libelle: 'Feux de gabarit et catadioptres' },
]

export type VerdictPoste = 'conforme' | 'conforme_observation' | 'non_conforme'

export const LIB_VERDICT: Record<VerdictPoste, { label: string; cls: string }> = {
  conforme:             { label: 'Conforme',              cls: 'bg-success-bg text-success' },
  conforme_observation: { label: 'Conforme avec réserve', cls: 'bg-warning-bg text-warning' },
  non_conforme:         { label: 'Non conforme',          cls: 'bg-danger-bg text-danger' },
}

export interface ResultatPoste {
  code: string
  verdict: VerdictPoste
  observation?: string
}

export interface AuditConformite {
  id: string
  reference: string
  vehiculeId: string
  tracteurPlaque: string
  citernePlaque?: string
  date: string
  auditeur: string
  resultats: ResultatPoste[]
  /** Programmée automatiquement dès qu'un poste est non conforme */
  contreVisiteLe?: string
  /** Conditionne l'aptitude à charger */
  conforme: boolean
  commentaire?: string
  /** US 2.3.2 - Le rapport est archivé et reste consultable : c'est la
   *  preuve à présenter lors d'un audit ou d'un vetting. */
  rapportArchiveLe?: string
  rapportUrl?: string
}

/* ══════════════════════════════════════════════════════════════
   US 2.4.1 - Autorisation de départ
   Source : projet Control Room, phase 5 h – 6 h.
   ══════════════════════════════════════════════════════════════ */
export type ControleDepart =
  | 'checklist' | 'alcool_drogue' | 'documents_chauffeur' | 'documents_vehicule'

export const LIB_CONTROLE_DEPART: Record<ControleDepart, string> = {
  checklist:           'Checklist véhicule conforme',
  alcool_drogue:       'Test alcool et drogue négatif',
  documents_chauffeur: 'Documents chauffeur valides',
  documents_vehicule:  'Documents véhicule valides',
}

export interface ResultatControleDepart {
  controle: ControleDepart
  conforme: boolean
  detail?: string
}

export interface AutorisationDepart {
  id: string
  reference: string
  voyageId?: string
  voyageRef?: string
  vehiculeId: string
  vehiculePlaque: string
  chauffeurId?: string
  chauffeurNom: string
  demandeeLe: string
  /** Les quatre contrôles doivent tous être conformes */
  controles: ResultatControleDepart[]
  accordee: boolean
  decidePar?: string
  decideLe?: string
  motifRefus?: string
  /** Le briefing sécurité et le repos hebdomadaire accompagnent la délivrance */
  briefingSecuriteFait?: boolean
  reposHebdoVerifie?: boolean
  /** Le suivi s'active à la délivrance */
  suiviActiveLe?: string
}

/* ══════════════════════════════════════════════════════════════
   US 2.7.3 - Assurances et sinistres
   Source : cahier des charges ERP GTD, domaine Infractions &
   discipline - « accidents par million de km, tendre vers 0 ».
   ══════════════════════════════════════════════════════════════ */

export type StatutPolice = 'active' | 'expiree' | 'resiliee'

export const LIB_STATUT_POLICE: Record<StatutPolice, { label: string; cls: string }> = {
  active:   { label: 'Active',   cls: 'bg-success-bg text-success' },
  expiree:  { label: 'Expirée',  cls: 'bg-danger-bg text-danger'   },
  resiliee: { label: 'Résiliée', cls: 'bg-gray-100 text-gray-500'  },
}

export interface PoliceAssurance {
  id: string
  vehiculeId: string
  vehiculePlaque: string
  compagnie: string
  numeroPolice: string
  /** Nature de la couverture souscrite */
  couverture: string
  dateDebut: string
  dateEcheance: string
  primeAnnuelleAr?: number
  franchiseAr?: number
  statut: StatutPolice
}

export type GraviteSinistre = 'materiel_leger' | 'materiel_lourd' | 'corporel' | 'environnemental'

export const LIB_GRAVITE_SINISTRE: Record<GraviteSinistre, { label: string; cls: string }> = {
  materiel_leger:  { label: 'Matériel léger',  cls: 'bg-gray-100 text-gray-600'  },
  materiel_lourd:  { label: 'Matériel lourd',  cls: 'bg-warning-bg text-warning' },
  corporel:        { label: 'Corporel',        cls: 'bg-danger-bg text-danger'   },
  environnemental: { label: 'Environnemental', cls: 'bg-danger-bg text-danger'   },
}

/** Suite donnée au sinistre, distincte du coût de réparation. */
export type StatutIndemnisation =
  | 'non_declare' | 'declare' | 'expertise' | 'accepte' | 'refuse' | 'regle'

export const LIB_INDEMNISATION: Record<StatutIndemnisation, string> = {
  non_declare: 'Non déclaré',
  declare:     'Déclaré à l’assureur',
  expertise:   'Expertise en cours',
  accepte:     'Prise en charge acceptée',
  refuse:      'Prise en charge refusée',
  regle:       'Indemnisation réglée',
}

export interface Sinistre {
  id: string
  reference: string
  vehiculeId: string
  vehiculePlaque: string
  date: string
  lieu: string
  circonstances: string
  gravite: GraviteSinistre
  /** Chauffeur au volant au moment des faits */
  chauffeurId?: string
  chauffeurNom?: string
  tiersImpliques?: string
  /** Coût des dommages sur le véhicule GTD */
  montantDommagesAr?: number
  /** Suivi de l'indemnisation, indépendant du coût de réparation */
  statutIndemnisation: StatutIndemnisation
  montantIndemniseAr?: number
  policeId?: string
  /** Ordre de travail ouvert si le véhicule doit être réparé */
  ordreTravailId?: string
  /** Kilométrage au moment du sinistre, pour l'indicateur par million de km */
  kilometrage?: number
  responsabiliteGtd?: boolean
}
