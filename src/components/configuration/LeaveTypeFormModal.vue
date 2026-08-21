<template>
  <CreateModalShell
    v-if="modelValue"
    :title="isEdit ? 'Modifier le type' : 'Nouveau type d\'absence'"
    :banner-label="isEdit ? 'Types d\'absence · Modification' : 'Types d\'absence · Création'"
    :create-label="isEdit ? 'Enregistrer' : 'Ajouter le type'"
    @close="close"
    @create="handleSave"
  >
  <template #form><div class="flex-1 overflow-y-auto px-8 py-6 max-w-2xl mx-auto">

    <FormSection title="Identification">
      <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
        <div :class="cls.field">
          <label :class="cls.fieldLabel">Nom *</label>
          <input v-model="form.name" :class="[cls.fieldInput, errors.name && cls.inputError]" placeholder="ex: Congé sans solde" @input="autoCode" />
          <div v-if="errors.name" :class="cls.fieldError">{{ errors.name }}</div>
        </div>
        <div :class="cls.field">
          <label :class="cls.fieldLabel">Code *</label>
          <input v-model="form.code" :class="[cls.fieldInput, 'uppercase', errors.code && cls.inputError]" placeholder="ex: UNPAID" />
          <div v-if="errors.code" :class="cls.fieldError">{{ errors.code }}</div>
        </div>
      </div>
    </FormSection>

    <FormSection title="Règles d'acquisition">
      <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
        <div :class="cls.field">
          <label :class="cls.fieldLabel">Jours alloués / an</label>
          <input type="number" min="0" v-model.number="form.daysPerYear" :class="cls.fieldInput" />
        </div>
        <div :class="cls.field">
          <label :class="cls.fieldLabel">Accumulation mensuelle (j/mois)</label>
          <input type="number" min="0" step="0.5" v-model.number="form.daysPerMonth" :class="cls.fieldInput" />
        </div>
        <div :class="cls.field">
          <label :class="cls.fieldLabel">Report maximum (jours)</label>
          <input type="number" min="0" v-model.number="form.maxCarryOver" :class="cls.fieldInput" />
          <div class="text-[11px] text-muted-foreground mt-1">0 = aucun report autorisé</div>
        </div>
        <div :class="cls.field">
          <label :class="cls.fieldLabel">Préavis minimum (jours)</label>
          <input type="number" min="0" v-model.number="form.noticeDays" :class="cls.fieldInput" />
        </div>
        <div :class="cls.field">
          <label :class="cls.fieldLabel">Workflow</label>
          <SearchableDropdown
            v-model="form.workflow"
            :items="optform_workflow"
            placeholder="Sélectionner…"
          />
        </div>
        <div class="flex items-center gap-3 pt-4">
          <span :class="cls.fieldLabel">Justificatif obligatoire</span>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" class="sr-only peer" v-model="form.requiresDocument" />
            <span class="w-9 h-5 rounded-full bg-foreground/20 transition-colors peer-checked:bg-primary relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-3.5 after:h-3.5 after:bg-white after:rounded-full after:shadow after:transition-all peer-checked:after:left-[19px]"></span>
          </label>
        </div>
      </div>
    </FormSection>

    <FormSection title="Apparence">
      <div class="space-y-4">
        <div :class="cls.field">
          <label :class="cls.fieldLabel">Couleur dans le calendrier</label>
          <div class="flex flex-wrap gap-2 mt-1">
            <button v-for="c in COLOR_OPTIONS" :key="c" type="button" class="w-8 h-8 rounded-md border-2 cursor-pointer flex items-center justify-center transition-transform" :class="form.color === c ? 'border-foreground scale-110' : 'border-transparent'" :style="{ background: c }" @click="form.color = c">
              <Check v-if="form.color === c" class="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
        <div :class="cls.field">
          <label :class="cls.fieldLabel">Icône</label>
          <div class="flex flex-wrap gap-1.5 mt-1">
            <button v-for="ic in ICON_OPTIONS" :key="ic" type="button" class="w-9 h-9 rounded-md border cursor-pointer flex items-center justify-center text-base transition-colors" :class="form.icon === ic ? 'bg-primary/10 text-primary border-primary' : 'border-border bg-background text-muted-foreground hover:bg-card hover:text-foreground'" @click="form.icon = ic">
              <component :is="ICON_LUCIDE_MAP[ic] ?? Calendar" class="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </FormSection>

  </div></template>
  </CreateModalShell>
</template>

<script setup lang="ts">
import { reactive, computed, watch, type Component } from 'vue'
import SearchableDropdown from '../ui/SearchableDropdown.vue'
import type { DropdownItem } from '../ui/SearchableDropdown.vue'
import {
  Check, Calendar, Stethoscope, Heart, Clock, Users, Star,
  Home, Briefcase, Umbrella, Baby, Globe, Sun,
} from 'lucide-vue-next'

const ICON_LUCIDE_MAP: Record<string, Component> = {
  'ti-calendar':      Calendar,
  'ti-stethoscope':   Stethoscope,
  'ti-heart':         Heart,
  'ti-clock-hour-3':  Clock,
  'ti-users':         Users,
  'ti-star':          Star,
  'ti-home-2':        Home,
  'ti-briefcase':     Briefcase,
  'ti-beach':         Umbrella,
  'ti-baby-carriage': Baby,
  'ti-globe':         Globe,
  'ti-sun':           Sun,
}
import CreateModalShell from '../shared/CreateModalShell.vue'
import FormSection from '../ui/form-field/FormSection.vue'
import * as cls from '../../lib/formClasses'
import { useLeaveTypesStore } from '../../stores/leaveTypes'
import type { LeaveTypeConfig } from '../../stores/leaveTypes'

const props = defineProps<{
  modelValue: boolean
  editId?:    string
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  'saved': []
}>()

const store  = useLeaveTypesStore()
const isEdit = computed(() => !!props.editId)

const COLOR_OPTIONS = [
  '#006B3C','#C8102E','#993556','#185FA5',
  '#854F0B','#8A5A0A','#2D7A3F','#5C3B8A',
]
const ICON_OPTIONS = [
  'ti-calendar','ti-stethoscope','ti-heart','ti-clock-hour-3',
  'ti-users','ti-star','ti-home-2','ti-briefcase',
  'ti-beach','ti-baby-carriage','ti-globe','ti-sun',
]

const form = reactive({
  name:             '',
  code:             '',
  daysPerYear:      0,
  daysPerMonth:     undefined as number | undefined,
  maxCarryOver:     0,
  noticeDays:       0,
  requiresDocument: false,
  workflow:         'standard' as 'standard' | 'medical',
  isActive:         true,
  isSystem:         false,
  color:            '#006B3C',
  icon:             'ti-calendar',
})

const errors = reactive({ name: '', code: '' })

function autoCode() {
  if (!isEdit.value) {
    form.code = form.name
      .toUpperCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Z0-9]/g, '_')
      .slice(0, 12)
  }
}

function populate() {
  if (isEdit.value && props.editId) {
    const lt = store.leaveTypes.find(l => l.id === props.editId)
    if (lt) {
      form.name             = lt.name
      form.code             = lt.code
      form.daysPerYear      = lt.daysPerYear
      form.daysPerMonth     = lt.daysPerMonth
      form.maxCarryOver     = lt.maxCarryOver
      form.noticeDays       = lt.noticeDays
      form.requiresDocument = lt.requiresDocument
      form.workflow         = lt.workflow
      form.isActive         = lt.isActive
      form.isSystem         = lt.isSystem
      form.color            = lt.color
      form.icon             = lt.icon
    }
  } else {
    Object.assign(form, {
      name:'', code:'', daysPerYear:0, daysPerMonth:undefined, maxCarryOver:0,
      noticeDays:0, requiresDocument:false, workflow:'standard',
      isActive:true, isSystem:false, color:'#006B3C', icon:'ti-calendar',
    })
  }
  errors.name = ''
  errors.code = ''
}

watch(() => props.modelValue, v => { if (v) populate() })

function validate(): boolean {
  errors.name = ''
  errors.code = ''
  let ok = true
  if (!form.name.trim()) { errors.name = 'Nom requis'; ok = false }
  if (!form.code.trim()) { errors.code = 'Code requis'; ok = false }
  return ok
}

function close() { emit('update:modelValue', false) }

function handleSave() {
  if (!validate()) return
  const payload: Omit<LeaveTypeConfig, 'id'> = {
    name:             form.name,
    code:             form.code.toUpperCase(),
    daysPerYear:      form.daysPerYear,
    daysPerMonth:     form.daysPerMonth,
    maxCarryOver:     form.maxCarryOver,
    noticeDays:       form.noticeDays,
    requiresDocument: form.requiresDocument,
    workflow:         form.workflow,
    isActive:         form.isActive,
    isSystem:         form.isSystem,
    color:            form.color,
    icon:             form.icon,
  }
  if (isEdit.value && props.editId) {
    store.updateLeaveType(props.editId, payload)
  } else {
    store.addLeaveType(payload)
  }
  emit('saved')
  close()
}

const optform_workflow: DropdownItem[] = [
            { id: 'standard', label: "Standard (approbation)" },
            { id: 'medical', label: "Médical (enregistrement)" },
]
</script>
