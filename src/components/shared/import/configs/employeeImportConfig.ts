import { useEmployeeStore } from '../../../../stores/employees'
import { useEntityStore } from '../../../../stores/entities'
import type { ImportConfig } from '../importTypes'
import type { SocieteEmployeuse, FonctionGTD, DepartementGTD, ContractType, EmployeeStatus } from '../../../../types'

const SOCIETE_OPTIONS = [
  { value: 'GTD', label: 'GTD' },
  { value: 'Logistics Sarl', label: 'Logistics Sarl' },
  { value: 'Damdjee Nadir Transporteur', label: 'Damdjee Nadir Transporteur' },
  { value: 'Autre', label: 'Autre' },
]
const FONCTION_OPTIONS = [
  { value: 'Administrateur', label: 'Administrateur' },
  { value: 'RH', label: 'RH' },
  { value: 'Gestionnaire Opérations', label: 'Gestionnaire Opérations' },
  { value: 'Tracking / Sécurité', label: 'Tracking / Sécurité' },
  { value: 'HSE', label: 'HSE' },
  { value: 'Maintenancier', label: 'Maintenancier' },
  { value: 'Chauffeur', label: 'Chauffeur' },
  { value: 'IT', label: 'IT' },
  { value: 'Direction', label: 'Direction' },
  { value: 'Autre', label: 'Autre' },
]
const DEPARTEMENT_OPTIONS = [
  { value: 'Opérations', label: 'Opérations' },
  { value: 'Maintenance', label: 'Maintenance' },
  { value: 'RH', label: 'RH' },
  { value: 'HSE', label: 'HSE' },
  { value: 'IT', label: 'IT' },
  { value: 'Direction', label: 'Direction' },
]
const CONTRAT_OPTIONS = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'Prestataire', label: 'Prestataire' },
  { value: 'Stage', label: 'Stage' },
  { value: 'Freelance', label: 'Freelance' },
]
const STATUT_OPTIONS = [
  { value: 'actif', label: 'Actif' },
  { value: 'en_conge', label: 'En congé' },
  { value: 'suspendu', label: 'Suspendu' },
  { value: 'sorti', label: 'Sorti' },
]

export function buildEmployeeImportConfig(): ImportConfig {
  const empStore = useEmployeeStore()
  const entityStore = useEntityStore()

  return {
    title: 'Employés',
    intro: "Importez plusieurs employés en une fois. Chaque employé doit être rattaché à une entité déjà existante (colonne « Code entité », voir Personnel → Département).",
    dependencies: [
      {
        label: 'Au moins une entité doit déjà exister (obligatoire pour rattacher un employé)',
        ok: () => entityStore.entities.length > 0,
        routeTo: { name: 'hr-entities' },
        required: true,
      },
    ],
    columns: [
      { key: 'firstName', csvHeader: 'Prénom', label: 'Prénom', required: true, type: 'text', sample: 'Jean' },
      { key: 'lastName', csvHeader: 'Nom', label: 'Nom', required: true, type: 'text', sample: 'Rakoto' },
      { key: 'email', csvHeader: 'Email', label: 'Email', required: false, type: 'text', sample: 'jean.rakoto@gtd.mg' },
      { key: 'phone', csvHeader: 'Téléphone', label: 'Téléphone', required: false, type: 'text', sample: '' },
      { key: 'cin', csvHeader: 'CIN', label: 'CIN', required: false, type: 'text', sample: '' },
      { key: 'dateNaissance', csvHeader: 'Date de naissance', label: 'Naissance', required: false, type: 'date', sample: '1990-05-12' },
      { key: 'societe', csvHeader: 'Société', label: 'Société', required: true, type: 'select', sample: 'GTD', options: () => SOCIETE_OPTIONS },
      { key: 'fonction', csvHeader: 'Fonction', label: 'Fonction', required: true, type: 'select', sample: 'Chauffeur', options: () => FONCTION_OPTIONS },
      { key: 'departement', csvHeader: 'Département', label: 'Département', required: false, type: 'select', sample: 'Opérations', options: () => DEPARTEMENT_OPTIONS },
      { key: 'jobTitle', csvHeader: 'Intitulé du poste', label: 'Poste', required: true, type: 'text', sample: 'Chauffeur PL' },
      {
        key: 'entityId', csvHeader: 'Code entité', label: 'Entité', required: true, type: 'select', sample: '',
        options: () => entityStore.entities.map(e => ({ value: e.id, label: e.name, code: e.code })),
      },
      { key: 'contractType', csvHeader: 'Type de contrat', label: 'Contrat', required: true, type: 'select', sample: 'CDI', options: () => CONTRAT_OPTIONS },
      { key: 'hireDate', csvHeader: "Date d'embauche", label: 'Embauche', required: true, type: 'date', sample: '2024-01-15' },
      { key: 'status', csvHeader: 'Statut', label: 'Statut', required: true, type: 'select', sample: 'Actif', options: () => STATUT_OPTIONS },
    ],
    sampleRows: [
      {
        Prénom: 'Jean', Nom: 'Rakoto', Email: 'jean.rakoto@gtd.mg', Téléphone: '', CIN: '',
        'Date de naissance': '1990-05-12', Société: 'GTD', Fonction: 'Chauffeur', Département: 'Opérations',
        'Intitulé du poste': 'Chauffeur PL', 'Code entité': 'DOP', 'Type de contrat': 'CDI',
        "Date d'embauche": '2024-01-15', Statut: 'Actif',
      },
      {
        Prénom: 'Marie', Nom: 'Andria', Email: 'marie.andria@gtd.mg', Téléphone: '', CIN: '',
        'Date de naissance': '1988-11-03', Société: 'GTD', Fonction: 'HSE', Département: 'HSE',
        'Intitulé du poste': 'Responsable HSE', 'Code entité': 'DOP', 'Type de contrat': 'CDI',
        "Date d'embauche": '2023-06-01', Statut: 'Actif',
      },
    ],
    createRow(payload) {
      const entity = entityStore.entities.find(e => e.id === payload.entityId)
      const result = empStore.createEmployee({
        firstName: payload.firstName as string,
        lastName: payload.lastName as string,
        role: 'employee',
        email: (payload.email as string) || undefined,
        phone: (payload.phone as string) || undefined,
        cin: (payload.cin as string) || undefined,
        dateNaissance: (payload.dateNaissance as string) || undefined,
        societe: payload.societe as SocieteEmployeuse,
        fonction: payload.fonction as FonctionGTD,
        departement: (payload.departement as DepartementGTD) || undefined,
        jobTitle: payload.jobTitle as string,
        entityId: (payload.entityId as string) ?? null,
        entityName: entity?.name,
        contractType: payload.contractType as ContractType,
        hireDate: payload.hireDate as string,
        status: payload.status as EmployeeStatus,
      })
      if (!result.success) throw new Error(result.error)
      return result.employee as unknown as Record<string, unknown>
    },
  }
}