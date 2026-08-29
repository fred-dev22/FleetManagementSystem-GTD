<template>
  <CreateModalShell
    v-if="modelValue"
    :title="isEditMode ? 'Modifier l\'entité' : 'Nouvelle entité'"
    :banner-label="isEditMode ? 'Entités · Modification' : 'Entités · Création'"
    :create-label="isEditMode ? 'Enregistrer' : 'Soumettre l\'entité'"
    @close="close"
    @create="handleSubmit"
  >
  <template #form><div class="flex-1 overflow-y-auto px-8 py-6 max-w-3xl mx-auto">

    <FormSection title="Informations générales">
      <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
        <div :class="[cls.field, 'col-span-2 max-sm:col-span-1']">
          <label :class="cls.fieldLabel">Intitulé *</label>
          <input v-model="form.name" :class="[cls.fieldInput, errors.name ? cls.inputError : '']" placeholder="ex: Direction des Ressources Humaines" />
          <div v-if="errors.name" :class="cls.fieldError">{{ errors.name }}</div>
        </div>
        <div :class="cls.field">
          <label :class="cls.fieldLabel">Code * <span :class="cls.fieldOptional">(max 10 car.)</span></label>
          <input v-model="form.code" :class="[cls.fieldInput, errors.code ? cls.inputError : '']" placeholder="ex: DRH" maxlength="10" @input="form.code = form.code.toUpperCase()" />
          <div v-if="errors.code" :class="cls.fieldError">{{ errors.code }}</div>
        </div>
        <div :class="cls.field">
          <label :class="cls.fieldLabel">Type *</label>
          <SearchableDropdown
            v-model="form.type"
            :items="optform_type"
            placeholder="Choisir un type"
          />
          <div v-if="errors.type" :class="cls.fieldError">{{ errors.type }}</div>
        </div>
        <div :class="cls.field">
          <label :class="cls.fieldLabel">Entité parente</label>
          <SearchableDropdown v-model="form.parentId" :items="entityItems" placeholder="Rechercher une entité..." :show-avatar="false" />
        </div>
        <div :class="cls.field">
          <label :class="cls.fieldLabel">Identifiant légal <span :class="cls.fieldOptional">(optionnel)</span></label>
          <input v-model="form.legalIdentifier" :class="cls.fieldInput" placeholder="ex: GTD-001" />
        </div>
        <div :class="[cls.field, 'col-span-2 max-sm:col-span-1']">
          <label :class="cls.fieldLabel">Adresse <span :class="cls.fieldOptional">(optionnel)</span></label>
          <textarea v-model="form.address" :class="cls.fieldTextarea" rows="2" placeholder="Adresse physique de l'entité…"></textarea>
        </div>
      </div>
    </FormSection>

    <FormSection title="Contact & Responsable">
      <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
        <div :class="cls.field">
          <label :class="cls.fieldLabel">Responsable</label>
          <SearchableDropdown v-model="form.responsibleId" :items="employeeItems" placeholder="Rechercher un responsable..." :show-avatar="true" />
        </div>
        <div :class="cls.field">
          <label :class="cls.fieldLabel">Téléphone principal</label>
          <input v-model="form.phone" type="tel" :class="cls.fieldInput" placeholder="+261 3x xxx xxxx" />
        </div>
        <div :class="[cls.field, 'col-span-2 max-sm:col-span-1']">
          <label :class="cls.fieldLabel">Courrier électronique</label>
          <input v-model="form.email" type="email" :class="[cls.fieldInput, errors.email ? cls.inputError : '']" placeholder="service@gtd.mg" />
          <div v-if="errors.email" :class="cls.fieldError">{{ errors.email }}</div>
        </div>
      </div>
    </FormSection>

    <FormSection title="Configuration des validateurs">
      <p class="text-xs text-muted-foreground -mt-2 mb-3">Définissez qui approuve les demandes des employés de cette entité.</p>
      <div class="flex flex-col gap-2">
        <div v-for="level in ([1, 2, 3, 4] as const)" :key="level" class="flex items-center gap-2">
          <span class="text-[11px] font-semibold text-muted-foreground bg-background border border-border rounded px-2 py-0.5 min-w-[36px] text-center shrink-0">N+{{ level }}</span>
          <template v-if="getPool(level)">
            <SearchableDropdown
              class="flex-1"
              :model-value="getPool(level)!.employeeId ?? ''"
              :items="optionsApprobateurs"
              placeholder="Choisir un approbateur"
              show-avatar
              @update:model-value="v => updatePoolEmployee(level, v ?? '')"
            />
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" :style="{ background: getPool(level)!.validatorColor }">{{ getPool(level)!.validatorInitials }}</div>
            <button class="w-7 h-7 flex items-center justify-center rounded text-danger hover:bg-danger-bg transition-colors cursor-pointer shrink-0 border-0 bg-transparent" @click="removePool(level)" title="Supprimer"><Trash2 class="w-3.5 h-3.5" /></button>
          </template>
          <template v-else>
            <span class="flex-1 text-xs text-muted-foreground italic">Non configuré</span>
            <button class="px-2.5 py-1 rounded text-[12px] font-medium cursor-pointer inline-flex items-center gap-1 border border-border bg-card text-foreground hover:bg-background transition-colors" @click="addPool(level)"><Plus class="w-3 h-3" /> Ajouter</button>
          </template>
        </div>
      </div>
    </FormSection>

    <div class="pt-2">
      <button :class="cls.btnOutline" @click="handleDraft">
        <Save class="w-4 h-4" />
        {{ isEditMode ? 'Enregistrer sans soumettre' : 'Enregistrer en brouillon' }}
      </button>
    </div>

  </div></template>
  </CreateModalShell>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { Building, User, ShieldCheck, Save, Send, Trash2, Plus } from 'lucide-vue-next'
import CreateModalShell from '../shared/CreateModalShell.vue'
import FormSection from '../ui/form-field/FormSection.vue'
import SearchableDropdown from '../ui/SearchableDropdown.vue'
import type { DropdownItem } from '../ui/SearchableDropdown.vue'
import * as cls from '../../lib/formClasses'
import { useEntityStore }   from '../../stores/entities'
import { useEmployeeStore } from '../../stores/employees'
import { getInitials } from '../../utils/helpers'
import type { EntityType, ValidatorPool } from '../../types'

const props = defineProps<{
  modelValue: boolean
  editId?:    string
  visibleEntityIds?:   string[]
  visibleEmployeeIds?: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  'saved': []
}>()

const store    = useEntityStore()
const empStore = useEmployeeStore()

const isEditMode = computed(() => !!props.editId)
const editEntity = computed(() => props.editId ? store.getEntityById(props.editId) : undefined)

const POOL_COLORS = [
  'var(--color-success)',  'var(--color-primary)',
  'var(--color-warning)',  'var(--color-danger)',
  'var(--color-info)',
]
let colorIdx = 0
function nextColor(): string { return POOL_COLORS[colorIdx++ % POOL_COLORS.length] ?? 'var(--color-primary)' }

const form = reactive({
  name:            '',
  code:            '',
  type:            '' as EntityType | '',
  parentId:        '',
  legalIdentifier: '',
  address:         '',
  responsibleId:   '',
  responsibleName: '',
  phone:           '',
  email:           '',
})
const errors     = reactive({ name: '', code: '', type: '', email: '' })
const localPools = ref<ValidatorPool[]>([])

const employeeItems = computed<DropdownItem[]>(() =>
  empStore.employees
    .filter(e => !props.visibleEmployeeIds || props.visibleEmployeeIds.includes(e.id))
    .map(e => ({
      id:       e.id,
      label:    e.name,
      sublabel: e.entityName ?? '',
      initials: getInitials(e.name),
    }))
)

const TYPE_SUBLABELS: Record<string, string> = {
  direction: 'Direction', department: 'Département', service: 'Service',
}
const entityItems = computed<DropdownItem[]>(() =>
  store.entities
    .filter(e => e.id !== props.editId)
    .filter(e => !props.visibleEntityIds || props.visibleEntityIds.includes(e.id))
    .map(e => ({
      id:       e.id,
      label:    e.name,
      sublabel: TYPE_SUBLABELS[e.type] ?? e.type,
    }))
)

watch(() => form.responsibleId, (id) => {
  if (!id) { form.responsibleName = ''; return }
  const emp = empStore.getById(id)
  if (emp) form.responsibleName = emp.name
})

function populate() {
  colorIdx = 0
  if (isEditMode.value && editEntity.value) {
    const e = editEntity.value
    form.name            = e.name
    form.code            = e.code
    form.type            = e.type
    form.parentId        = e.parentId ?? ''
    form.legalIdentifier = e.legalIdentifier ?? ''
    form.address         = e.address ?? ''
    form.responsibleId   = e.responsibleId ?? ''
    form.responsibleName = e.responsibleName ?? ''
    form.phone           = e.phone ?? ''
    form.email           = e.email ?? ''
    localPools.value     = [...e.validatorPools]
  } else {
    Object.assign(form, {
      name: '', code: '', type: '', parentId: '', legalIdentifier: '',
      address: '', responsibleId: '', responsibleName: '', phone: '', email: '',
    })
    localPools.value = []
  }
  Object.assign(errors, { name: '', code: '', type: '', email: '' })
}

watch(() => props.modelValue, v => { if (v) populate() })

function getPool(level: 1 | 2 | 3 | 4): ValidatorPool | undefined {
  return localPools.value.find(p => p.level === level)
}
function addPool(level: 1 | 2 | 3 | 4) {
  localPools.value.push({ level, validatorName: '', validatorInitials: '??', validatorColor: nextColor() })
}
function removePool(level: number) {
  localPools.value = localPools.value.filter(p => p.level !== level)
}
function updatePoolEmployee(level: number, employeeId: string) {
  const pool = localPools.value.find(p => p.level === level)
  if (!pool) return
  if (!employeeId) {
    pool.employeeId = undefined; pool.validatorName = ''; pool.validatorInitials = '??'
    return
  }
  const emp = empStore.getById(employeeId)
  if (emp) {
    pool.employeeId        = emp.id
    pool.validatorName     = emp.name
    pool.validatorInitials = emp.initials
    pool.validatorColor    = emp.avatarBg
  }
}

function validate(): boolean {
  errors.name = errors.code = errors.type = errors.email = ''
  let ok = true
  if (!form.name.trim()) { errors.name = "L'intitulé est obligatoire"; ok = false }
  if (!form.code.trim()) { errors.code = "Le code est obligatoire";    ok = false }
  if (!form.type)        { errors.type = "Veuillez choisir un type";   ok = false }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Format email invalide"; ok = false
  }
  return ok
}

function buildPayload() {
  return {
    code: form.code, name: form.name, type: form.type as EntityType,
    parentId: form.parentId || null, legalIdentifier: form.legalIdentifier || undefined,
    address: form.address || undefined, phone: form.phone || undefined,
    email: form.email || undefined, responsibleId: form.responsibleId || undefined,
    responsibleName: form.responsibleName || undefined,
    headcount: editEntity.value?.headcount ?? 0,
    validatorPools: localPools.value.filter(p => p.validatorName.trim()),
  }
}

function close() { emit('update:modelValue', false) }

function handleDraft() {
  if (!validate()) return
  if (isEditMode.value && props.editId) {
    store.updateEntity(props.editId, buildPayload())
  } else {
    store.createEntity(buildPayload())
  }
  emit('saved')
  close()
}

function handleSubmit() {
  if (!validate()) return
  if (isEditMode.value && props.editId) {
    store.updateEntity(props.editId, buildPayload())
    store.submitEntity(props.editId)
  } else {
    store.createEntity(buildPayload())
    const newId = store.entities[store.entities.length - 1]!.id
    store.submitEntity(newId)
  }
  emit('saved')
  close()
}

const optform_type: DropdownItem[] = [
            { id: 'direction', label: "Direction" },
            { id: 'department', label: "Département" },
            { id: 'service', label: "Service" },
]

const LIB_ROLE_APPRO: Record<string, string> = {
  hr_director: 'Directeur RH',
  hr_admin:    'Admin RH',
  validator:   'Validateur',
}

const optionsApprobateurs = computed<DropdownItem[]>(() =>
  ['hr_director', 'hr_admin', 'validator'].flatMap(role =>
    (empStore.employees ?? [])
      .filter(e => e.role === role)
      .map(e => ({
        id: e.id,
        label: e.name,
        sublabel: `${LIB_ROLE_APPRO[role]} · ${e.jobTitle}`,
        initials: e.initials,
        avatarColor: e.avatarBg,
      }))))
</script>
