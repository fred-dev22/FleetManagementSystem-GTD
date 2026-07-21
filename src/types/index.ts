// ── Auth & Roles ──────────────────────────────────────────────
export type UserRole =
  | 'admin'
  | 'rh'
  | 'operations'
  | 'maintenance'
  | 'chauffeur'

export interface AuthUser {
  id:              string
  name:            string
  initials:        string
  role:            UserRole
  email:           string
  entityId?:       string
  entityName?:     string
  validatorLevel?: 1 | 2 | 3 | 4
}

// ── Validation workflow ───────────────────────────────────────
export type LeaveStatus =
  | 'draft' | 'pending' | 'approved' | 'rejected'
  | 'cancelled' | 'returned'
  | 'registered' | 'done' | 'regularized'

export interface ValidationStep {
  level:         'employee' | 'n1' | 'n2' | 'n3' | 'n4' | 'rh' | 'system'
  actorName:     string
  actorInitials: string
  action:        'submitted' | 'approved' | 'rejected' | 'returned' | 'pending'
  date:          string
  comment?:      string
}

// ── Leave ─────────────────────────────────────────────────────
export type LeaveType =
  | 'Congé annuel'
  | 'Congé maladie'
  | 'Congé maternité'
  | 'Récupération'
  | 'Télétravail'
  | 'Assistance parentale'
  | 'Permission exceptionnelle'

export interface LeaveRequest {
  id:               number
  employeeName:     string
  employeeInitials: string
  avatarColor:      string
  avatarTextColor:  string
  type:             LeaveType
  startDate:        string
  endDate:          string
  workingDays:      number
  reason?:          string
  rejectionReason?: string
  returnComment?:   string
  status:           LeaveStatus
  submittedAt:      string
  validationHistory?: ValidationStep[]
}

export interface LeaveBalance {
  label: string
  pct:   number
  days:  number
  color: string
}

// ── Missions ──────────────────────────────────────────────────
export type MissionStatus =
  | 'draft' | 'pending' | 'approved' | 'rejected' | 'returned' | 'cancelled'

export type TransportMode =
  | 'personal_car' | 'company_car' | 'public_transport' | 'plane' | 'other'

export type EmployeeCategory = 'cat_a' | 'cat_b' | 'cat_c' | 'cat_d'

export interface MissionAllowance {
  category:      EmployeeCategory
  hotelPerDay:   number
  transportFlat: number
  mealPerDay:    number
  currency:      string
}

export interface PerdiemRate {
  id:          string
  category:    string
  ratePerDay:  number
  currency:    string
  description: string
}

export interface MissionOrder {
  id:                  string
  code:                string
  employeeId:          string
  employeeName:        string
  employeeInitials:    string
  employeeCategory:    EmployeeCategory
  destination:         string
  purpose:             string
  departureDate:       string
  returnDate:          string
  transportMode:       TransportMode
  transportModeReturn: TransportMode
  description?:        string
  numberOfDays:        number
  hotelAllowance:      number
  transportAllowance:  number
  mealAllowance:       number
  totalMission:        number
  advanceRequested:    number
  status:              MissionStatus
  validationHistory:   ValidationStep[]
  createdAt:           string
  submittedAt?:        string
}

// ── Expenses ──────────────────────────────────────────────────
export type ExpenseStatus = 'draft' | 'pending' | 'approved' | 'rejected'

export type ExpenseCategory =
  | 'transport' | 'hebergement' | 'repas' | 'carburant'
  | 'fournitures' | 'communication' | 'representation' | 'autre'

export interface ExpenseLine {
  id:          string
  date:        string
  category:    ExpenseCategory
  description: string
  amount:      number
  currency:    string
  receipt:     boolean
}

export interface ExpenseReport {
  id:                string
  code:              string
  employeeId:        string
  employeeName:      string
  employeeInitials:  string
  title:             string
  missionId?:        string
  lines:             ExpenseLine[]
  totalAmount:       number
  currency:          string
  status:            ExpenseStatus
  rejectionReason?:  string
  submittedAt?:      string
  createdAt:         string
  validationHistory: ValidationStep[]
}

export type RemoteStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface RemoteWorkRequest {
  id:                number
  employeeName:      string
  employeeInitials:  string
  startDate:         string
  endDate:           string
  reason:            string
  status:            RemoteStatus
  rejectionReason?:  string
  submittedAt:       string
}

// ── Entities ──────────────────────────────────────────────────
export type EntityStatus = 'draft' | 'pending_approval' | 'approved' | 'inactive'
export type EntityType   = 'direction' | 'department' | 'service'

export interface ValidatorPool {
  level:             1 | 2 | 3 | 4
  employeeId?:       string
  validatorName:     string
  validatorInitials: string
  validatorColor:    string
}

// ── GTD Personnel ─────────────────────────────────────────────
export type EmployeeStatus = 'actif' | 'en_conge' | 'suspendu' | 'sorti'

export type ContractType = 'CDI' | 'CDD' | 'Prestataire' | 'Stage' | 'Freelance'

// Société employeuse (liste fermée GTD)
export type SocieteEmployeuse =
  | 'GTD'
  | 'Logistics Sarl'
  | 'Damdjee Nadir Transporteur'
  | 'Autre'

// Fonction (liste fermée GTD)
export type FonctionGTD =
  | 'Administrateur'
  | 'RH'
  | 'Gestionnaire Opérations'
  | 'Tracking / Sécurité'
  | 'HSE'
  | 'Maintenancier'
  | 'Chauffeur'
  | 'IT'
  | 'Direction'
  | 'Autre'

// Département (liste fermée GTD)
export type DepartementGTD =
  | 'Opérations'
  | 'Maintenance'
  | 'RH'
  | 'HSE'
  | 'IT'
  | 'Direction'

export interface HistoriqueChangement {
  date:        string
  champ:       string
  ancienneVal: string
  nouvelleVal: string
  parUserId:   string
  parUserName: string
}

export interface DocumentEmploye {
  id:          string
  employeeId:  string
  type:        'CNAPS' | 'Mutuelle' | 'Contrat signé' | 'Autre'
  dateEmission: string
  dateExpiration?: string
  fichierUrl?: string
  createdAt:   string
}

export interface PermisConduire {
  numero:          string
  dateExpiration:  string
  categories:      string[]  // A, B, C, D, E…
  alerteEnvoyee:   boolean
}

export interface VisiteMedicale {
  dateVisite:      string
  dateExpiration:  string
  apte:            boolean
  alerteEnvoyee:   boolean
}

export interface Employee {
  id:            string
  code:          string
  firstName:     string
  lastName:      string
  name:          string
  initials:      string
  avatarBg:      string
  avatarText:    string
  role:          UserRole
  // GTD-specific
  cin?:          string
  dateNaissance?: string
  societe:       SocieteEmployeuse
  fonction:      FonctionGTD
  departement?:  DepartementGTD
  // Legacy / kept for backward compat
  jobTitle:      string
  entityId:      string | null
  entityName?:   string
  email?:        string
  phone?:        string
  hireDate:      string
  contractType:  ContractType
  status:        EmployeeStatus
  managerId?:    string
  hasSystemAccess?: boolean
  category?:     EmployeeCategory
  // Documents chauffeur (seulement si fonction === 'Chauffeur')
  permis?:       PermisConduire
  visiteMedicale?: VisiteMedicale
  // Historique modifications
  historiqueModifs?: HistoriqueChangement[]
  // Motif suspension/sortie
  motifStatut?:  string
  // Fin de contrat
  dateFinContrat?: string
}

export interface Entity {
  id:              string
  code:            string
  name:            string
  type:            EntityType
  parentId:        string | null
  legalIdentifier?: string
  address?:        string
  phone?:          string
  email?:          string
  responsibleName?: string
  responsibleId?:  string
  headcount:       number
  status:          EntityStatus
  validatorPools:  ValidatorPool[]
  createdAt:       string
  submittedAt?:    string
  approvedAt?:     string
  children?:       Entity[]
}

// ── Calendar ──────────────────────────────────────────────────
export interface WorkingHours {
  start:      string
  end:        string
  breakStart: string
  breakEnd:   string
}

export interface WorkingDayConfig {
  enabled:      boolean
  start:        string
  end:          string
  breakEnabled: boolean
  breakStart:   string
  breakEnd:     string
}

export interface WorkingDays {
  monday:    WorkingDayConfig
  tuesday:   WorkingDayConfig
  wednesday: WorkingDayConfig
  thursday:  WorkingDayConfig
  friday:    WorkingDayConfig
  saturday:  WorkingDayConfig
  sunday:    WorkingDayConfig
}

export type HolidayType = 'annual' | 'ponctual' | 'selective'

export interface Holiday {
  id:               string
  name:             string
  date:             string
  type:             HolidayType
  isRecurring:      boolean
  applicableRoles?: string[]
}

export interface LeaveRule {
  type:             LeaveType
  daysPerYear:      number
  daysPerMonth?:    number
  maxCarryOver:     number
  requiresDocument: boolean
  noticeDays:       number
}

export interface CompanyCalendar {
  id:            string
  workingDays:   WorkingDays
  holidays:      Holiday[]
  leaveRules:    LeaveRule[]
  perdiemRates?: PerdiemRate[]
  updatedAt:     string
  updatedBy:     string
}

export interface EmployeeSchedule {
  employeeId:          string
  inheritsFromCompany: boolean
  customWorkingDays?:  WorkingDays
  customWorkingHours?: WorkingHours
  scheduleNotes?:      string
}

export interface DayPlanning {
  date:           string
  isWorkingDay:   boolean
  isHoliday:      boolean
  holidayName?:   string
  isAbsence:      boolean
  absenceType?:   LeaveType
  absenceStatus?: LeaveStatus
  hours?:         WorkingHours
}

// ═══════════════════════════════════════════════════════════════
// MODULE 2 — VÉHICULES
// ═══════════════════════════════════════════════════════════════

export type TypeVehicule   = 'tracteur' | 'remorque'
export type TypeRemorque   = 'Citerne' | 'Bâchée' | 'Frigorifique' | 'Plateau' | 'Autre'
export type TypeCarburant  = 'Diesel' | 'GNL' | 'Essence' | 'Électrique' | 'Hybride'
export type ModeAcquisition = 'achat' | 'leasing' | 'location'
export type TypeSite       = 'Garage' | 'Dépôt chargement' | 'Dépôt déchargement' | 'Zone à risque' | 'Point de contrôle'
export type TypeAlerteGeozone = 'entree' | 'sortie' | 'entree_sortie'

// Statuts UCODIS : actif | affecte | en_reparation | hors_service | vendu | archive
export type StatutAdminVehicule       = 'actif' | 'affecte' | 'en_reparation' | 'hors_service' | 'vendu' | 'archive'
export type StatutOperationnelVehicule = 'en_mouvement' | 'allume_immobile' | 'arrete' | 'signal_perdu'

export interface HistoriquePlaque {
  anciennePlaque: string
  nouvellePlaque: string
  dateChangement: string
  parUserId:      string
}

// Entité unifiée Tracteur + Remorque
export interface Vehicule {
  id:            string
  typeVehicule:  TypeVehicule

  // Identification
  vin?:          string
  plaque:        string
  marque?:       string
  modele?:       string
  annee?:        number
  dateMiseEnCirculation?: string
  categorie?:    string
  siteAffectation?: string

  // Tracteur uniquement
  typeCarburant?: TypeCarburant
  statutOp?:      StatutOperationnelVehicule
  position?:      GpsPosition
  kilometrage?:   number
  niveauCarburant?: number

  // Remorque uniquement
  typeRemorque?: TypeRemorque
  capacite?:     string

  // Admin
  statutAdmin:   StatutAdminVehicule

  // Financier
  modeAcquisition?: ModeAcquisition
  coutAcquisition?: number
  valeurResiduelle?: number

  // Liaisons dénormalisées
  chauffeurId?:      string
  chauffeurNom?:     string
  vehiculeLieId?:    string
  vehiculeLiePlaque?: string

  // Meta
  photos?:             string[]
  historiquePlayque?:  HistoriquePlaque[]
  createdAt:           string
}

// Garde Tracteur/Remorque comme alias pour rétro-compat (CarteView, etc.)
export type Tracteur = Vehicule & { typeVehicule: 'tracteur' }
export type Remorque = Vehicule & { typeVehicule: 'remorque' }

export interface Attelage {
  id:                 string
  tracteurId:         string
  tracteurPlaque:     string
  remorqueId:         string
  remorquePlaque:     string
  dateDebut:          string
  dateFin?:           string
  createdAt:          string
}

export interface AffectationChauffeur {
  id:             string
  chauffeurId:    string
  chauffeurNom:   string
  tracteurId:     string
  tracteurPlaque: string
  dateDebut:      string
  dateFin?:       string
  createdAt:      string
}

// Documents unifiés véhicules + conducteurs
export interface DocumentVehicule {
  id:           string
  entityId:     string                        // ID véhicule ou conducteur
  entityType:   'vehicule' | 'conducteur'
  type:         string
  numero?:      string
  dateEmission: string
  dateExpiration?: string
  fichierUrl?:  string
  statut:       'depose' | 'valide' | 'refuse' | 'archive'
  alerteEnvoyee: boolean
  createdAt:    string
}

// Profil conducteur (extension de l'employé)
export interface Formation {
  id:              string
  titre:           string
  date:            string
  dateExpiration?: string
}

export interface Infraction {
  id:          string
  date:        string
  type:        string
  description: string
  gravite:     'faible' | 'moyen' | 'grave'
}

export interface ConducteurProfil {
  id:          string  // = employeId
  employeId:   string

  // Permis
  numeroPermis?:           string
  categoriePermis?:        string
  dateExpirationPermis?:   string

  // Santé
  dateVisiteMedicale?:           string
  dateExpirationVisiteMedicale?: string

  // Formations & score
  formations?:   Formation[]
  scoreConduite: number  // 0-100
  infractions?:  Infraction[]

  disponible: boolean
  createdAt:  string
}

export interface Site {
  id:       string
  code:     string  // ex: GAR-TNR
  nom:      string
  ville:    string
  region?:  string
  type:     TypeSite
  latitude?: number
  longitude?: number
  rayon?:   number  // mètres pour géofence
  alerteType?: TypeAlerteGeozone
  actif:    boolean
  createdAt: string
}

export interface EvenementGeozone {
  id:          string
  vehiculeId:  string
  siteId:      string
  siteCode:    string
  siteNom:     string
  chauffeurId?: string
  type:        'entree' | 'sortie'
  horodatage:  string
}

export interface GpsPosition {
  lat:       number
  lng:       number
  vitesse:   number  // km/h
  cap:       number  // degrés
  horodatage: string
}

export interface TrajetPoint {
  lat:       number
  lng:       number
  vitesse:   number
  horodatage: string
}

export interface Trajet {
  id:         string
  vehiculeId: string
  dateDebut:  string
  dateFin?:   string
  points:     TrajetPoint[]
  distance:   number  // km
  sitesTraverses: string[]
}

export interface TelemetrieVehicule {
  vehiculeId:      string
  horodatageMesure: string
  horodatageReception: string
  kilometrage:     number
  niveauCarburant: number  // %
  etatMoteur:      'on' | 'off'
  codeDefaut?:     string
  temperature?:    number
  signalPerdu:     boolean
}

export interface LienPartagePosition {
  id:            string
  vehiculeId:    string
  token:         string
  dateExpiration: string
  createdAt:     string
  actif:         boolean
}

export interface LeaveTypeConfig {
  id:               string
  name:             string
  code:             string
  daysPerYear:      number
  daysPerMonth?:    number
  maxCarryOver:     number
  noticeDays:       number
  requiresDocument: boolean
  workflow:         string[]
  isActive:         boolean
  isSystem:         boolean
  color:            string
  icon:             string
}
