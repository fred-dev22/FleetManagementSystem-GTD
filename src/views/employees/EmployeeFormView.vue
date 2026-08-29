<template>
  <div class="px-7 py-6">

    <div :class="L.pageHeader">
      <div>
        <div :class="L.pageTitle">{{ isEdit ? 'Modifier un employé' : 'Nouvel employé' }}</div>
        <div :class="L.pageSub" v-if="isEdit && editEmp">{{ editEmp.name }}</div>
      </div>
      <router-link :to="{ name: 'hr-employees' }" :class="L.btnOutline">
        <ArrowLeft class="w-4 h-4" /> Annuler
      </router-link>
    </div>

    <div class="flex justify-center">
      <div class="w-full max-w-[800px] bg-card border border-border rounded-lg p-6 flex flex-col gap-6">

        <!-- ── Section 1 : Identité ── -->
        <div class="flex flex-col gap-3.5">
          <div :class="sectionTitle"><User class="w-4 h-4 text-primary" /> Identité</div>
          <div :class="fieldGrid">
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Prénom *</label>
              <input v-model="form.firstName" :class="[cls.fieldInput, err.firstName && cls.inputError]" placeholder="Prénom" />
              <div v-if="err.firstName" :class="cls.fieldError">{{ err.firstName }}</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Nom *</label>
              <input v-model="form.lastName" :class="[cls.fieldInput, err.lastName && cls.inputError]" placeholder="Nom de famille" />
              <div v-if="err.lastName" :class="cls.fieldError">{{ err.lastName }}</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Code employé *</label>
              <input v-model="form.code" :class="[cls.fieldInput, err.code && cls.inputError]" placeholder="EMP-XXX" @input="form.code = (form.code as string).toUpperCase()" />
              <div v-if="err.code" :class="cls.fieldError">{{ err.code }}</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">CIN *</label>
              <input
                v-model="form.cin"
                :class="[cls.fieldInput, err.cin && cls.inputError]"
                placeholder="ex: 101 234 567"
                @input="onCinInput"
              />
              <div v-if="err.cin" :class="cls.fieldError">{{ err.cin }}</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Date de naissance *</label>
              <input v-model="form.dateNaissance" type="date" :class="[cls.fieldInput, err.dateNaissance && cls.inputError]" />
              <div v-if="err.dateNaissance" :class="cls.fieldError">{{ err.dateNaissance }}</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Email</label>
              <input v-model="form.email" type="email" :class="[cls.fieldInput, err.email && cls.inputError]" placeholder="email@example.com" />
              <div v-if="err.email" :class="cls.fieldError">{{ err.email }}</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Téléphone</label>
              <input v-model="form.phone" type="tel" :class="cls.fieldInput" placeholder="+213 XXX XXX XXX" />
            </div>
          </div>
        </div>

        <!-- ── Section 2 : Poste & Affectation ── -->
        <div class="flex flex-col gap-3.5">
          <div :class="sectionTitle"><Briefcase class="w-4 h-4 text-primary" /> Poste & Affectation</div>
          <div :class="fieldGrid">
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Fonction *</label>
              <SearchableDropdown
                v-model="form.fonction"
                :items="optFONCTIONS"
                placeholder="Sélectionner"
              />
              <div v-if="err.fonction" :class="cls.fieldError">{{ err.fonction }}</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Société employeuse *</label>
              <SearchableDropdown
                v-model="form.societe"
                :items="optSOCIETES"
                placeholder="Sélectionner"
              />
              <div v-if="err.societe" :class="cls.fieldError">{{ err.societe }}</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Département</label>
              <SearchableDropdown
                v-model="form.departement"
                :items="optDEPARTEMENTS"
                placeholder="Sélectionner"
              />
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Entité *</label>
              <SearchableDropdown
                :model-value="form.entityId"
                :items="optionsEntites"
                placeholder="Sélectionner une entité"
                @update:model-value="onEntityChange"
              />
              <div v-if="err.entityId" :class="cls.fieldError">{{ err.entityId }}</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Rôle système *</label>
              <SearchableDropdown
                v-model="form.role"
                :items="optform_role"
                placeholder="Sélectionner"
              />
              <div v-if="err.role" :class="cls.fieldError">{{ err.role }}</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Type de contrat *</label>
              <SearchableDropdown
                v-model="form.contractType"
                :items="optform_contractType"
                placeholder="Sélectionner"
              />
              <div v-if="err.contractType" :class="cls.fieldError">{{ err.contractType }}</div>
            </div>
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Date d'embauche *</label>
              <input v-model="form.hireDate" type="date" :class="[cls.fieldInput, err.hireDate && cls.inputError]" />
              <div v-if="err.hireDate" :class="cls.fieldError">{{ err.hireDate }}</div>
            </div>
            <div :class="cls.field" v-if="isEdit">
              <label :class="cls.fieldLabel">Statut</label>
              <SearchableDropdown
                v-model="form.status"
                :items="optform_status"
                placeholder="Sélectionner…"
              />
            </div>
            <!-- Motif requis si suspendu ou sorti -->
            <div :class="[cls.field, 'col-span-full']" v-if="isEdit && (form.status === 'suspendu' || form.status === 'sorti')">
              <label :class="cls.fieldLabel">Motif *</label>
              <input
                v-model="form.motif"
                :class="[cls.fieldInput, err.motif && cls.inputError]"
                :placeholder="form.status === 'suspendu' ? 'Motif de suspension...' : 'Motif de sortie...'"
              />
              <div v-if="err.motif" :class="cls.fieldError">{{ err.motif }}</div>
            </div>
          </div>
        </div>

        <!-- ── Section 3 : Documents Chauffeur (si fonction === 'Chauffeur') ── -->
        <div class="flex flex-col gap-3.5" v-if="form.fonction === 'Chauffeur'">
          <button
            type="button"
            class="flex items-center gap-2 text-sm font-semibold pb-2.5 border-b border-border cursor-pointer select-none w-full text-left"
            @click="showDocsChauffeur = !showDocsChauffeur"
          >
            <FileText class="w-4 h-4 text-primary" />
            Documents Chauffeur
            <ChevronDown class="w-4 h-4 ml-auto transition-transform" :class="showDocsChauffeur ? 'rotate-180' : ''" />
          </button>

          <div v-if="showDocsChauffeur" class="flex flex-col gap-4 pl-1">
            <!-- Permis de conduire -->
            <div class="flex flex-col gap-2">
              <div class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Permis de conduire</div>
              <div :class="fieldGrid">
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">N° Permis</label>
                  <input v-model="form.permis.numero" :class="cls.fieldInput" placeholder="Numéro du permis" />
                </div>
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">Date d'expiration</label>
                  <input v-model="form.permis.dateExpiration" type="date" :class="cls.fieldInput" />
                </div>
                <div :class="[cls.field, 'col-span-full']">
                  <label :class="cls.fieldLabel">Catégories</label>
                  <div class="flex flex-wrap gap-3 mt-1">
                    <label
                      v-for="cat in PERMIS_CATEGORIES"
                      :key="cat"
                      class="flex items-center gap-1.5 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        :value="cat"
                        v-model="form.permis.categories"
                        class="w-4 h-4 rounded border-border accent-primary"
                      />
                      {{ cat }}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Visite médicale -->
            <div class="flex flex-col gap-2">
              <div class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Visite médicale</div>
              <div :class="fieldGrid">
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">Date de visite</label>
                  <input v-model="form.visiteMedicale.dateVisite" type="date" :class="cls.fieldInput" />
                </div>
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">Date d'expiration</label>
                  <input v-model="form.visiteMedicale.dateExpiration" type="date" :class="cls.fieldInput" />
                </div>
                <div :class="cls.field">
                  <label :class="cls.fieldLabel">Aptitude</label>
                  <div class="flex items-center gap-3 mt-1">
                    <label class="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="radio" v-model="form.visiteMedicale.apte" :value="true" class="accent-primary" /> Apte
                    </label>
                    <label class="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="radio" v-model="form.visiteMedicale.apte" :value="false" class="accent-primary" /> Inapte
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Section 4 : Manager ── -->
        <div class="flex flex-col gap-3.5">
          <div :class="sectionTitle"><ShieldCheck class="w-4 h-4 text-primary" /> Manager direct</div>
          <p class="text-xs text-muted-foreground -mt-2">Optionnel — responsable hiérarchique de l'employé.</p>
          <div :class="fieldGrid">
            <div :class="cls.field">
              <label :class="cls.fieldLabel">Manager</label>
              <SearchableDropdown
                v-model="form.managerId"
                :items="optionsManagers"
                placeholder="Aucun manager"
                show-avatar
              />
            </div>
            <div :class="cls.field" v-if="selectedManager">
              <label :class="cls.fieldLabel">Manager sélectionné</label>
              <div class="flex items-center gap-2.5 px-3 py-2 bg-background rounded-lg border border-border">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" :style="{ background: selectedManager.avatarBg, color: selectedManager.avatarText }">
                  {{ selectedManager.initials }}
                </div>
                <div>
                  <div class="text-[13px] font-medium">{{ selectedManager.name }}</div>
                  <div class="text-[11px] text-muted-foreground mt-px">{{ selectedManager.fonction ?? selectedManager.jobTitle }} · {{ selectedManager.entityName }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Erreur globale (ex: CIN dupliqué) ── -->
        <div v-if="globalError" class="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {{ globalError }}
        </div>

        <!-- ── Actions ── -->
        <div class="flex gap-2 justify-end pt-2 border-t border-border">
          <button :class="cls.btnPrimary" @click="handleSave">
            <Save class="w-4 h-4" />
            {{ isEdit ? 'Mettre à jour' : 'Enregistrer' }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref, onMounted } from 'vue'
import SearchableDropdown from '../../components/ui/SearchableDropdown.vue'
import type { DropdownItem } from '../../components/ui/SearchableDropdown.vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, User, Briefcase, ShieldCheck, Save, FileText, ChevronDown } from 'lucide-vue-next'
import * as cls from '../../lib/formClasses'

const optionsEntites = computed<DropdownItem[]>(() =>
  entityStore.approvedEntities.map(e => ({ id: e.id, label: e.name, sublabel: e.code })))
import * as L from '../../lib/listClasses'
import { useEmployeeStore } from '../../stores/employees'
import { useEntityStore }   from '../../stores/entities'
import type { UserRole, ContractType, EmployeeStatus, FonctionGTD, SocieteEmployeuse, DepartementGTD } from '../../types'

const store       = useEmployeeStore()
const entityStore = useEntityStore()
const router      = useRouter()
const route       = useRoute()

// ── Listes fermées ──────────────────────────────────────────────
const FONCTIONS: FonctionGTD[] = [
  'Administrateur', 'RH', 'Gestionnaire Opérations', 'Tracking / Sécurité',
  'HSE', 'Maintenancier', 'Chauffeur', 'IT', 'Direction', 'Autre',
]
const SOCIETES: SocieteEmployeuse[] = [
  'GTD', 'Logistics Sarl', 'Damdjee Nadir Transporteur', 'Autre',
]
const DEPARTEMENTS: DepartementGTD[] = [
  'Opérations', 'Maintenance', 'RH', 'HSE', 'IT', 'Direction',
]
const PERMIS_CATEGORIES = ['A', 'B', 'C', 'D', 'E']

// ── Classes design system ───────────────────────────────────────
const sectionTitle = 'flex items-center gap-2 text-sm font-semibold pb-2.5 border-b border-border'
const fieldGrid    = 'grid grid-cols-2 gap-3.5 max-sm:grid-cols-1'

// ── Route / état ────────────────────────────────────────────────
const empId   = computed(() => route.params.id as string | undefined)
const isEdit  = computed(() => !!empId.value)
const editEmp = computed(() => empId.value ? store.getById(empId.value) : undefined)

const showDocsChauffeur = ref(true)
const globalError       = ref('')

// ── Formulaire ──────────────────────────────────────────────────
const form = reactive({
  firstName:     '',
  lastName:      '',
  code:          '',
  cin:           '',
  dateNaissance: '',
  email:         '',
  phone:         '',
  fonction:      '' as FonctionGTD | '',
  societe:       '' as SocieteEmployeuse | '',
  departement:   '' as DepartementGTD | '',
  entityId:      '' as string | null,
  entityName:    '',
  role:          '' as UserRole | '',
  contractType:  '' as ContractType | '',
  hireDate:      '',
  status:        'actif' as EmployeeStatus,
  managerId:     '',
  motif:         '',
  permis: {
    numero:         '',
    dateExpiration: '',
    categories:     [] as string[],
  },
  visiteMedicale: {
    dateVisite:     '',
    dateExpiration: '',
    apte:           true,
  },
})

const err = reactive({
  firstName:     '',
  lastName:      '',
  code:          '',
  cin:           '',
  dateNaissance: '',
  email:         '',
  fonction:      '',
  societe:       '',
  entityId:      '',
  role:          '',
  contractType:  '',
  hireDate:      '',
  motif:         '',
})

// ── Computed ────────────────────────────────────────────────────
const mgrs = computed(() => store.validatorEmployees.filter(e => e.id !== empId.value))

/**
 * Managers possibles, groupés par rôle.
 *
 * Le sélecteur natif employait des optgroup, que le composant ne gère
 * pas. Le rôle passe donc en sous-libellé : la séparation visuelle est
 * perdue, mais le rôle devient cherchable, ce qu'un optgroup n'offre pas.
 */
const LIB_ROLE_MGR: Record<string, string> = {
  hr_director: 'Directeur RH',
  hr_admin:    'Admin RH',
  validator:   'Validateur',
}

const optionsManagers = computed<DropdownItem[]>(() =>
  ['hr_director', 'hr_admin', 'validator'].flatMap(role =>
    mgrs.value
      .filter(e => e.role === role)
      .map(e => ({
        id: e.id,
        label: e.name,
        sublabel: `${LIB_ROLE_MGR[role]} · ${e.fonction ?? e.jobTitle}`,
        initials: e.initials,
        avatarColor: e.avatarBg,
      }))))

const selectedManager = computed(() =>
  form.managerId ? store.getById(form.managerId) : undefined
)

// ── CIN : auto-formatage XXX XXX XXX ───────────────────────────
function onCinInput() {
  const digits = (form.cin as string).replace(/\D/g, '').slice(0, 9)
  if (digits.length <= 3) {
    form.cin = digits
  } else if (digits.length <= 6) {
    form.cin = `${digits.slice(0, 3)} ${digits.slice(3)}`
  } else {
    form.cin = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
}

function onEntityChange(id: string) {
  form.entityId = id
  form.entityName = entityStore.getEntityById(id)?.name ?? ''
}

// ── Chargement mode édition ─────────────────────────────────────
onMounted(() => {
  if (isEdit.value && editEmp.value) {
    const e = editEmp.value
    form.firstName     = e.firstName
    form.lastName      = e.lastName
    form.code          = e.code
    form.cin           = e.cin ?? ''
    form.dateNaissance = e.dateNaissance ?? ''
    form.email         = e.email ?? ''
    form.phone         = e.phone ?? ''
    form.fonction      = e.fonction ?? ''
    form.societe       = e.societe ?? ''
    form.departement   = e.departement ?? ''
    form.entityId      = e.entityId
    form.entityName    = e.entityName ?? ''
    form.role          = e.role
    form.contractType  = e.contractType
    form.hireDate      = e.hireDate
    form.status        = e.status
    form.managerId     = e.managerId ?? ''
    form.motif         = (e as any).motif ?? ''
    if (e.permis) {
      form.permis.numero         = e.permis.numero
      form.permis.dateExpiration = e.permis.dateExpiration
      form.permis.categories     = [...e.permis.categories]
    }
    if (e.visiteMedicale) {
      form.visiteMedicale.dateVisite     = e.visiteMedicale.dateVisite
      form.visiteMedicale.dateExpiration = e.visiteMedicale.dateExpiration
      form.visiteMedicale.apte           = e.visiteMedicale.apte
    }
  } else {
    form.code = store.nextCode
  }
})

// ── Validation ──────────────────────────────────────────────────
function validate(): boolean {
  Object.keys(err).forEach(k => ((err as Record<string, string>)[k] = ''))
  globalError.value = ''
  let ok = true

  if (!form.firstName.trim())  { err.firstName = 'Le prénom est requis'; ok = false }
  if (!form.lastName.trim())   { err.lastName  = 'Le nom est requis';    ok = false }
  if (!form.code.trim())       { err.code      = 'Le code est requis';   ok = false }

  // CIN obligatoire + format 9 chiffres
  const cinDigits = (form.cin as string).replace(/\D/g, '')
  if (!form.cin.trim()) {
    err.cin = 'Le CIN est obligatoire'
    ok = false
  } else if (cinDigits.length !== 9) {
    err.cin = 'Le CIN doit comporter 9 chiffres (ex: 101 234 567)'
    ok = false
  }

  if (!form.dateNaissance) { err.dateNaissance = 'La date de naissance est obligatoire'; ok = false }
  if (!form.fonction)      { err.fonction      = 'La fonction est requise';               ok = false }
  if (!form.societe)       { err.societe       = 'La société employeuse est requise';     ok = false }
  if (!form.entityId)      { err.entityId      = "L'entité est requise";                  ok = false }
  if (!form.role)          { err.role          = 'Le rôle est requis';                    ok = false }
  if (!form.contractType)  { err.contractType  = 'Le type de contrat est requis';         ok = false }
  if (!form.hireDate)      { err.hireDate      = "La date d'embauche est requise";        ok = false }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    err.email = 'Adresse email invalide'
    ok = false
  }

  // Motif obligatoire si statut suspendu ou sorti
  if (isEdit.value && (form.status === 'suspendu' || form.status === 'sorti')) {
    if (!form.motif.trim()) {
      err.motif = 'Le motif est requis pour ce statut'
      ok = false
    }
  }

  return ok
}

// ── Sauvegarde ──────────────────────────────────────────────────
function handleSave() {
  if (!validate()) return

  const payload: any = {
    code:          form.code,
    firstName:     form.firstName,
    lastName:      form.lastName,
    role:          form.role as UserRole,
    jobTitle:      form.fonction as string,    // champ legacy conservé
    fonction:      form.fonction as FonctionGTD,
    societe:       form.societe as SocieteEmployeuse,
    departement:   form.departement as DepartementGTD || undefined,
    cin:           form.cin || undefined,
    dateNaissance: form.dateNaissance || undefined,
    entityId:      form.entityId,
    entityName:    form.entityName,
    contractType:  form.contractType as ContractType,
    hireDate:      form.hireDate,
    status:        form.status,
    email:         form.email || undefined,
    phone:         form.phone || undefined,
    managerId:     form.managerId || undefined,
    motif:         (form.status === 'suspendu' || form.status === 'sorti') ? form.motif : undefined,
  }

  // Documents chauffeur — uniquement si la fonction est Chauffeur
  if (form.fonction === 'Chauffeur') {
    if (form.permis.numero || form.permis.dateExpiration || form.permis.categories.length) {
      payload.permis = {
        numero:         form.permis.numero,
        dateExpiration: form.permis.dateExpiration,
        categories:     form.permis.categories,
        alerteEnvoyee:  false,
      }
    }
    if (form.visiteMedicale.dateVisite || form.visiteMedicale.dateExpiration) {
      payload.visiteMedicale = {
        dateVisite:     form.visiteMedicale.dateVisite,
        dateExpiration: form.visiteMedicale.dateExpiration,
        apte:           form.visiteMedicale.apte,
        alerteEnvoyee:  false,
      }
    }
  }

  if (isEdit.value && empId.value) {
    store.updateEmployee(empId.value, payload)
    router.push({ name: 'hr-employees' })
  } else {
    const result = store.createEmployee(payload)
    if (!result.success) {
      globalError.value = result.error
      return
    }
    router.push({ name: 'hr-employees' })
  }
}

const optform_role: DropdownItem[] = [
                { id: 'employee', label: "Employé" },
                { id: 'validator', label: "Validateur" },
                { id: 'hr_admin', label: "Admin RH" },
                { id: 'hr_director', label: "Directeur RH" },
]

const optform_contractType: DropdownItem[] = [
                { id: 'CDI', label: "CDI" },
                { id: 'CDD', label: "CDD" },
                { id: 'Prestataire', label: "Prestataire" },
                { id: 'Stage', label: "Stage" },
                { id: 'Freelance', label: "Freelance" },
]

const optform_status: DropdownItem[] = [
                { id: 'actif', label: "Actif" },
                { id: 'en_conge', label: "En congé" },
                { id: 'suspendu', label: "Suspendu" },
                { id: 'sorti', label: "Sorti" },
]

const optFONCTIONS = computed<DropdownItem[]>(() =>
  FONCTIONS.map(f => ({ id: f, label: f })))

const optSOCIETES = computed<DropdownItem[]>(() =>
  SOCIETES.map(s => ({ id: s, label: s })))

const optDEPARTEMENTS = computed<DropdownItem[]>(() =>
  DEPARTEMENTS.map(d => ({ id: d, label: d })))
</script>
