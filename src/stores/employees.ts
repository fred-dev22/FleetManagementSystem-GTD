import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Employee,
  EmployeeStatus,
  ContractType,
  SocieteEmployeuse,
  FonctionGTD,
  DepartementGTD,
  HistoriqueChangement,
} from '../types/index'
import { getInitials } from '../utils/helpers'
import { useAuthStore } from './auth'

const PALETTE = [
  { bg: '#B5D4F4', text: '#0C447C' },
  { bg: '#C0DD97', text: '#3B6D11' },
  { bg: '#F4C0D1', text: '#72243E' },
  { bg: '#FAC775', text: '#633806' },
  { bg: '#AFA9EC', text: '#3C3489' },
  { bg: '#B8E8D8', text: '#1A6B4B' },
  { bg: '#FAD9B0', text: '#7A3B09' },
]

function p(i: number) { return PALETTE[i % PALETTE.length]! }

// initials / avatarBg / avatarText sont dérivés automatiquement du nom
// et de la palette â€” jamais saisis Ã  la main.
type SeedEmployee = Omit<Employee, 'initials' | 'avatarBg' | 'avatarText'>

const SEED: SeedEmployee[] = [
  {
    id: 'emp-001', code: 'EMP001',
    name: 'Gary Ellis', firstName: 'Gary', lastName: 'Ellis',
    email: 'gary.ellis@gtd.mg',
    entityId: 'e1', entityName: 'Direction Générale',
    jobTitle: 'Directeur Général', role: 'rh',
    contractType: 'CDI', hireDate: '2018-01-02', status: 'actif',
    hasSystemAccess: true, category: 'cat_a',
    cin: '101 234 567',
    societe: 'GTD',
    fonction: 'Direction',
    departement: 'Direction',
    dateNaissance: '1975-04-12',
  },
  {
    id: 'emp-002', code: 'EMP002',
    name: 'Sariaka Bezandry', firstName: 'Sonia', lastName: 'Boodhun',
    email: 'sonia.boodhun@gtd.mg',
    entityId: 'e2', entityName: 'Direction RH',
    jobTitle: 'Directrice RH', role: 'rh',
    contractType: 'CDI', hireDate: '2019-03-15', status: 'actif',
    hasSystemAccess: true, category: 'cat_a',
    cin: '101 345 678',
    societe: 'GTD',
    fonction: 'RH',
    departement: 'RH',
    dateNaissance: '1982-07-23',
  },
  {
    id: 'emp-003', code: 'EMP003',
    name: 'Rabe Ndriantsoa', firstName: 'Ravi', lastName: 'Nundlall',
    email: 'ravi.nundlall@gtd.mg',
    entityId: 'e3', entityName: 'Service Administration',
    jobTitle: 'Responsable Administration', role: 'operations',
    contractType: 'CDI', hireDate: '2020-06-01', status: 'actif',
    hasSystemAccess: true, category: 'cat_b',
    cin: '101 456 789',
    societe: 'GTD',
    fonction: 'Administrateur',
    departement: 'RH',
    dateNaissance: '1985-11-05',
  },
  {
    id: 'emp-004', code: 'EMP004',
    name: 'Priya Ramlugun', firstName: 'Priya', lastName: 'Ramlugun',
    email: 'priya.ramlugun@gtd.mg',
    entityId: 'e4', entityName: 'Service HSE',
    jobTitle: 'Responsable HSE', role: 'operations',
    contractType: 'CDI', hireDate: '2020-09-01', status: 'actif',
    hasSystemAccess: true, category: 'cat_b',
    cin: '101 567 890',
    societe: 'GTD',
    fonction: 'HSE',
    departement: 'HSE',
    dateNaissance: '1988-02-17',
  },
  {
    id: 'emp-005', code: 'EMP005',
    name: 'Ravi Dhondoo', firstName: 'Ravi', lastName: 'Dhondoo',
    email: 'ravi.dhondoo@gtd.mg',
    entityId: 'e5', entityName: 'Direction Administrative & Financière',
    jobTitle: 'Directeur Administratif & Financier', role: 'rh',
    contractType: 'CDI', hireDate: '2018-04-01', status: 'actif',
    hasSystemAccess: true, category: 'cat_a',
    cin: '101 678 901',
    societe: 'GTD',
    fonction: 'Administrateur',
    departement: 'Direction',
    dateNaissance: '1979-09-30',
  },
  {
    id: 'emp-006', code: 'EMP006',
    name: 'Jean-Claude Rakotomalala', firstName: 'Jean-Claude', lastName: 'Rakotomalala',
    email: 'jc.rakotomalala@gtd.mg',
    entityId: 'e6', entityName: 'Service IT',
    jobTitle: 'Responsable IT', role: 'operations',
    contractType: 'CDI', hireDate: '2019-07-15', status: 'actif',
    hasSystemAccess: true, category: 'cat_b',
    cin: '101 789 012',
    societe: 'GTD',
    fonction: 'IT',
    departement: 'IT',
    dateNaissance: '1987-03-14',
  },
  {
    id: 'emp-007', code: 'EMP007',
    name: 'Hery Andrianaivo', firstName: 'Hery', lastName: 'Andrianaivo',
    email: 'hery.andrianaivo@gtd.mg',
    entityId: 'e7', entityName: 'Service Tracking & Sécurité',
    jobTitle: 'Responsable Tracking', role: 'operations',
    contractType: 'CDI', hireDate: '2021-01-10', status: 'actif',
    hasSystemAccess: true, category: 'cat_b',
    cin: '101 890 123',
    societe: 'GTD',
    fonction: 'Tracking / Sécurité',
    departement: 'Opérations',
    dateNaissance: '1990-06-08',
  },
  {
    id: 'emp-008', code: 'EMP008',
    name: 'Kumar Gunness', firstName: 'Kumar', lastName: 'Gunness',
    email: 'kumar.gunness@gtd.mg',
    entityId: 'e8', entityName: 'Direction des Opérations',
    jobTitle: 'Directeur des Opérations', role: 'operations',
    contractType: 'CDI', hireDate: '2017-11-01', status: 'actif',
    hasSystemAccess: true, category: 'cat_a',
    cin: '101 901 234',
    societe: 'GTD',
    fonction: 'Gestionnaire Opérations',
    departement: 'Opérations',
    dateNaissance: '1977-01-25',
  },
  {
    id: 'emp-009', code: 'EMP009',
    name: 'Morad Cassam', firstName: 'Morad', lastName: 'Cassam',
    email: 'morad.cassam@gtd.mg',
    entityId: 'e9', entityName: 'Service Maintenance',
    jobTitle: 'Responsable Maintenance', role: 'operations',
    contractType: 'CDI', hireDate: '2019-02-01', status: 'actif',
    hasSystemAccess: true, category: 'cat_b',
    cin: '101 012 345',
    societe: 'Logistics Sarl',
    fonction: 'Maintenancier',
    departement: 'Maintenance',
    dateNaissance: '1983-08-19',
  },
  {
    id: 'emp-010', code: 'EMP010',
    name: 'Thierry Randriamanga', firstName: 'Thierry', lastName: 'Randriamanga',
    email: 'thierry.randriamanga@gtd.mg',
    entityId: 'e10', entityName: 'Service Opérations',
    jobTitle: 'Chauffeur PL', role: 'employee',
    contractType: 'CDI', hireDate: '2018-06-15', status: 'actif',
    hasSystemAccess: false, category: 'cat_c',
    cin: '101 123 456',
    societe: 'GTD',
    fonction: 'Chauffeur',
    departement: 'Opérations',
    dateNaissance: '1986-12-03',
    permis: {
      numero: 'MG-2018-00451',
      dateExpiration: '2027-06-15',
      categories: ['C', 'CE'],
      alerteEnvoyee: false,
    },
    visiteMedicale: {
      dateVisite: '2025-03-10',
      dateExpiration: '2026-03-10',
      apte: true,
      alerteEnvoyee: false,
    },
  },
  {
    id: 'emp-011', code: 'EMP011',
    name: 'Fiona Mungroo', firstName: 'Fiona', lastName: 'Mungroo',
    email: 'fiona.mungroo@gtd.mg',
    entityId: 'e11', entityName: 'Service Opérations',
    jobTitle: 'Chauffeur PL', role: 'employee',
    contractType: 'CDI', hireDate: '2020-03-01', status: 'actif',
    hasSystemAccess: false, category: 'cat_c',
    cin: '101 234 890',
    societe: 'GTD',
    fonction: 'Chauffeur',
    departement: 'Opérations',
    dateNaissance: '1991-04-27',
    permis: {
      numero: 'MG-2020-00872',
      dateExpiration: '2026-03-01',
      categories: ['B', 'C', 'CE'],
      alerteEnvoyee: false,
    },
    visiteMedicale: {
      dateVisite: '2025-01-15',
      dateExpiration: '2026-01-15',
      apte: true,
      alerteEnvoyee: false,
    },
  },
  {
    id: 'emp-012', code: 'EMP012',
    name: 'Nadia Oozeer', firstName: 'Nadia', lastName: 'Oozeer',
    email: 'nadia.oozeer@gtd.mg',
    entityId: 'e12', entityName: 'Service Opérations',
    jobTitle: 'Chauffeur PL', role: 'employee',
    contractType: 'CDI', hireDate: '2019-05-01', status: 'actif',
    hasSystemAccess: false, category: 'cat_c',
    cin: '101 345 901',
    societe: 'Damdjee Nadir Transporteur',
    fonction: 'Chauffeur',
    departement: 'Opérations',
    dateNaissance: '1984-10-11',
    permis: {
      numero: 'MG-2019-00634',
      dateExpiration: '2025-05-01',
      categories: ['C', 'CE', 'D'],
      alerteEnvoyee: true,
    },
    visiteMedicale: {
      dateVisite: '2024-11-20',
      dateExpiration: '2025-11-20',
      apte: true,
      alerteEnvoyee: false,
    },
  },
  {
    id: 'emp-013', code: 'EMP013',
    name: 'Ashvin Pertab', firstName: 'Ashvin', lastName: 'Pertab',
    email: 'ashvin.pertab@gtd.mg',
    entityId: 'e13', entityName: 'Service Opérations',
    jobTitle: 'Chauffeur PL', role: 'employee',
    contractType: 'CDD', hireDate: '2021-06-01', status: 'actif',
    hasSystemAccess: false, category: 'cat_c',
    cin: '101 456 012',
    societe: 'GTD',
    fonction: 'Chauffeur',
    departement: 'Opérations',
    dateNaissance: '1993-07-16',
    permis: {
      numero: 'MG-2021-01102',
      dateExpiration: '2028-06-01',
      categories: ['B', 'C'],
      alerteEnvoyee: false,
    },
    visiteMedicale: {
      dateVisite: '2025-05-05',
      dateExpiration: '2026-05-05',
      apte: true,
      alerteEnvoyee: false,
    },
  },
  {
    id: 'emp-014', code: 'EMP014',
    name: 'Patrick Boulle', firstName: 'Patrick', lastName: 'Boulle',
    email: 'patrick.boulle@gtd.mg',
    entityId: 'e14', entityName: 'Service Opérations',
    jobTitle: 'Chauffeur PL', role: 'employee',
    contractType: 'CDI', hireDate: '2018-09-01', status: 'en_conge',
    hasSystemAccess: false, category: 'cat_c',
    cin: '101 567 123',
    societe: 'Logistics Sarl',
    fonction: 'Chauffeur',
    departement: 'Opérations',
    dateNaissance: '1980-02-28',
    permis: {
      numero: 'MG-2018-00289',
      dateExpiration: '2026-09-01',
      categories: ['C', 'CE'],
      alerteEnvoyee: false,
    },
    visiteMedicale: {
      dateVisite: '2024-08-12',
      dateExpiration: '2025-08-12',
      apte: true,
      alerteEnvoyee: false,
    },
  },
  {
    id: 'emp-015', code: 'EMP015',
    name: 'Marie-France Leclézio', firstName: 'Marie-France', lastName: 'Leclézio',
    email: 'mf.leclezio@gtd.mg',
    entityId: 'e15', entityName: 'Direction Juridique & Conformité',
    jobTitle: 'Directrice Juridique', role: 'rh',
    contractType: 'CDI', hireDate: '2020-01-15', status: 'actif',
    hasSystemAccess: true, category: 'cat_a',
    cin: '101 678 234',
    societe: 'GTD',
    fonction: 'Administrateur',
    departement: 'Direction',
    dateNaissance: '1981-05-09',
  },
  // â”€â”€ Équipe supplémentaire â”€â”€
  {
    id: 'emp-016', code: 'EMP016',
    name: 'Anjara Dimby', firstName: 'Aminata', lastName: 'Diallo',
    email: 'a.diallo@gtd.mg',
    entityId: 'e2', entityName: 'Direction RH',
    jobTitle: 'Chargée de Recrutement', role: 'employee',
    contractType: 'CDI', hireDate: '2023-03-01', status: 'actif',
    hasSystemAccess: true, category: 'cat_b',
    cin: '101 789 345',
    societe: 'GTD',
    fonction: 'RH',
    departement: 'RH',
    dateNaissance: '1995-01-20',
  },
  {
    id: 'emp-017', code: 'EMP017',
    name: 'Henri Razafy', firstName: 'Henri', lastName: 'Razafy',
    email: 'h.razafy@gtd.mg',
    entityId: 'e2', entityName: 'Direction RH',
    jobTitle: 'Gestionnaire Paie', role: 'employee',
    contractType: 'CDI', hireDate: '2022-09-15', status: 'actif',
    hasSystemAccess: true, category: 'cat_b',
    cin: '101 890 456',
    societe: 'GTD',
    fonction: 'RH',
    departement: 'RH',
    dateNaissance: '1992-08-03',
  },
  {
    id: 'emp-018', code: 'EMP018',
    name: 'Chantal Miandrisoa', firstName: 'Chantal', lastName: 'Miandrisoa',
    email: 'c.miandrisoa@gtd.mg',
    entityId: 'e2', entityName: 'Direction RH',
    jobTitle: 'Assistante RH', role: 'employee',
    contractType: 'CDD', hireDate: '2024-01-10', status: 'actif',
    hasSystemAccess: false, category: 'cat_c',
    cin: '101 901 567',
    societe: 'GTD',
    fonction: 'RH',
    departement: 'RH',
    dateNaissance: '1997-11-14',
  },
  {
    id: 'emp-019', code: 'EMP019',
    name: 'Solo Rakoto', firstName: 'Solo', lastName: 'Rakoto',
    email: 's.rakoto@gtd.mg',
    entityId: 'e7', entityName: 'Service Maintenance',
    jobTitle: 'Technicien Maintenance', role: 'employee',
    contractType: 'CDI', hireDate: '2021-06-20', status: 'suspendu',
    hasSystemAccess: false, category: 'cat_c',
    cin: '101 012 678',
    societe: 'GTD',
    fonction: 'Maintenancier',
    departement: 'Maintenance',
    dateNaissance: '1989-03-31',
    motifStatut: 'Absence injustifiée répétée â€” procédure disciplinaire en cours',
  },
]

export const useEmployeeStore = defineStore('employees', () => {
  const employees = ref<Employee[]>(SEED.map((e, i) => ({
    ...e,
    initials:   getInitials(e.name),
    avatarBg:   p(i).bg,
    avatarText: p(i).text,
  })))

  const activeEmployees    = computed(() => employees.value.filter(e => e.status === 'actif'))
  const validatorEmployees = computed(() => employees.value.filter(e =>
    e.role === 'operations' || e.role === 'rh' || e.role === 'rh'
  ))

  // Chauffeurs actifs
  const chauffeurs = computed(() =>
    employees.value.filter(e => e.fonction === 'Chauffeur' && e.status === 'actif')
  )

  // Chauffeurs actifs sans tracteur affecté
  // Le store véhicules peut croiser cette liste avec les affectations actives.
  const chauffeursDisponibles = computed(() =>
    chauffeurs.value.filter(e => !(e as any).tracteurId)
  )

  const nextCode = computed(() => {
    const max = employees.value.reduce((m, e) => {
      const n = parseInt(e.code.replace('EMP', '')) || 0
      return n > m ? n : m
    }, 0)
    return `EMP${String(max + 1).padStart(3, '0')}`
  })

  function getById(id: string): Employee | undefined {
    return employees.value.find(e => e.id === id)
  }

  function getByEntityId(entityId: string): Employee[] {
    return employees.value.filter(e => e.entityId === entityId)
  }

  // L'employé correspondant Ã  l'utilisateur connecté (matché par nom ou email)
  const currentUserEmployee = computed(() => {
    const user = useAuthStore().user
    if (!user) return undefined
    return employees.value.find(e =>
      e.name === user.name || (!!user.email && e.email === user.email)
    )
  })

  // L'utilisateur connecté est lui-même un employé du système.
  // S'il n'existe pas encore dans la liste, on le crée automatiquement.
  function ensureDefaultEmployee() {
    const auth = useAuthStore()
    const user = auth.user
    if (!user) return
    if (currentUserEmployee.value) return
    const name = user.name ?? 'Admin GTD'
    const pi   = employees.value.length % PALETTE.length
    const defaultEmployee: Employee = {
      id:         'emp-default',
      code:       nextCode.value,
      firstName:  name.split(' ')[0] ?? 'Admin',
      lastName:   name.split(' ').slice(1).join(' ') || 'GTD',
      name,
      initials:   getInitials(name),
      avatarBg:   p(pi).bg,
      avatarText: p(pi).text,
      email:      user.email ?? '',
      entityId:   'e1',
      entityName: 'Direction Générale',
      jobTitle:   'Administrateur GTD',
      role:       user.role ?? 'rh',
      contractType: 'CDI',
      hireDate:   new Date().toISOString().split('T')[0]!,
      status:     'actif',
      hasSystemAccess: true,
      category:   'cat_a',
      societe:    'GTD',
      fonction:   'Administrateur',
      departement: 'Direction',
    }
    employees.value.unshift(defaultEmployee)
  }

  // Crée un employé en validant l'unicité du CIN
  function createEmployee(
    payload: Omit<Employee, 'id' | 'code' | 'name' | 'initials' | 'avatarBg' | 'avatarText'>
  ): { success: true; employee: Employee } | { success: false; error: string } {
    if (payload.cin) {
      const existing = employees.value.find(e => e.cin === payload.cin)
      if (existing) {
        return {
          success: false,
          error: `Le CIN "${payload.cin}" est déjÃ  enregistré pour ${existing.name}.`,
        }
      }
    }
    const pi = employees.value.length % PALETTE.length
    const name = `${payload.firstName} ${payload.lastName}`
    const emp: Employee = {
      ...payload,
      id:         `emp-${Date.now()}`,
      code:       nextCode.value,
      name,
      initials:   getInitials(name),
      avatarBg:   p(pi).bg,
      avatarText: p(pi).text,
      historiqueModifs: [],
    }
    employees.value.push(emp)
    return { success: true, employee: emp }
  }

  // Met Ã  jour un employé et enregistre l'historique des modifications
  function updateEmployee(
    id: string,
    payload: Partial<Employee>,
    acteur?: { userId: string; userName: string }
  ) {
    const idx = employees.value.findIndex(e => e.id === id)
    if (idx === -1) return

    const emp = employees.value[idx]!

    // Construire l'historique des champs modifiés
    const nouvelleMods: HistoriqueChangement[] = []
    const now = new Date().toISOString()
    const parUserId   = acteur?.userId   ?? 'system'
    const parUserName = acteur?.userName ?? 'Système'

    for (const key of Object.keys(payload) as (keyof Employee)[]) {
      const ancienneVal = String(emp[key] ?? '')
      const nouvelleVal = String((payload as any)[key] ?? '')
      if (ancienneVal !== nouvelleVal) {
        nouvelleMods.push({
          date: now,
          champ: key,
          ancienneVal,
          nouvelleVal,
          parUserId,
          parUserName,
        })
      }
    }

    const updated: Employee = {
      ...emp,
      ...payload,
      historiqueModifs: [
        ...(emp.historiqueModifs ?? []),
        ...nouvelleMods,
      ],
    }

    if (payload.firstName || payload.lastName) {
      updated.name     = `${updated.firstName} ${updated.lastName}`
      updated.initials = getInitials(updated.name)
    }

    employees.value[idx] = updated
  }

  // Change le statut d'un employé ; motif obligatoire pour 'suspendu' et 'sorti'
  function changeStatut(
    id: string,
    nouveauStatut: EmployeeStatus,
    motif?: string,
    acteur?: { userId: string; userName: string }
  ): { success: true } | { success: false; error: string } {
    if ((nouveauStatut === 'suspendu' || nouveauStatut === 'sorti') && !motif?.trim()) {
      return {
        success: false,
        error: `Un motif est obligatoire pour passer un employé au statut "${nouveauStatut}".`,
      }
    }

    const patch: Partial<Employee> = {
      status: nouveauStatut,
      motifStatut: motif?.trim() ?? undefined,
    }

    updateEmployee(id, patch, acteur)
    return { success: true }
  }

  return {
    employees,
    activeEmployees,
    validatorEmployees,
    chauffeurs,
    chauffeursDisponibles,
    nextCode,
    currentUserEmployee,
    getById,
    getByEntityId,
    ensureDefaultEmployee,
    createEmployee,
    updateEmployee,
    changeStatut,
  }
})

