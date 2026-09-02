<template>
  <CreateModalShell
    v-if="modelValue"
    :title="t('absence.new')"
    banner-label="Demandes d'absence · Création"
    :create-label="t('absence.actions.submit')"
    draft-label="Enregistrer le brouillon"
    @close="close"
    @create="handleSubmit"
    @save-draft="handleDraft"
  >
  <template #form>
    <div class="flex-1 overflow-auto px-6 py-5">
      <div class="max-w-3xl mx-auto">

        <!-- Bénéficiaire -->
        <FormSection title="Bénéficiaire">
          <ForWhomSelector
            v-model="forWhom"
            :available-employees="availableEmployees"
            :error-employee="errors.employee"
          />
        </FormSection>

        <!-- Détails de la demande -->
        <FormSection title="Détails de la demande">
        <div class="flex flex-col gap-4">

          <!-- Type d'absence -->
          <div :class="cls.field">
            <label :class="cls.fieldLabel">{{ t('absence.fields.type') }} <span class="text-danger">*</span></label>
            <SearchableDropdown
              :items="leaveTypeItems"
              :model-value="form.type"
              :placeholder="t('absence.select_type')"
              :show-avatar="false"
              @update:model-value="form.type = $event as LeaveType"
            />
            <div v-if="errors.type" :class="cls.fieldError">{{ errors.type }}</div>
            <div v-if="currentRule" class="flex flex-wrap gap-1.5 mt-1.5">
              <span :class="cls.hintChipNeutral"><Calendar class="w-3 h-3" /> Solde : {{ currentRule.daysPerYear }} j/an</span>
              <span v-if="currentRule.noticeDays > 0" :class="cls.hintChipInfo"><Clock class="w-3 h-3" /> Préavis : {{ currentRule.noticeDays }} jour(s)</span>
              <span :class="currentRule.requiresDocument ? cls.hintChipWarning : cls.hintChipNeutral">
                <Paperclip class="w-3 h-3" /> Justificatif : {{ currentRule.requiresDocument ? 'Requis' : 'Non requis' }}
              </span>
            </div>
            <div v-if="currentLeaveType?.daysPerMonth" class="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1.5">
              <Info class="w-3 h-3" /> Acquisition : +{{ currentLeaveType.daysPerMonth }}j/mois — prochain crédit le 1er {{ nextMonthLabel }}
            </div>
          </div>

          <!-- Date de début -->
          <div :class="cls.field">
            <label :class="cls.fieldLabel">{{ t('absence.fields.start_date') }} <span class="text-danger">*</span></label>
            <input type="date" v-model="form.startDate" :class="[cls.fieldInput, errors.startDate && cls.inputError]" />
            <div v-if="errors.startDate" :class="cls.fieldError">{{ errors.startDate }}</div>
            <div v-if="isPastDate" :class="cls.fieldWarning"><AlertTriangle class="w-3.5 h-3.5 shrink-0" /> La date est dans le passé, confirmez-vous ?</div>
            <div v-if="isNotWorkingDay" :class="cls.fieldError"><AlertCircle class="w-3.5 h-3.5" /> Ce jour n'est pas un jour ouvrable</div>
          </div>

          <!-- Période de début -->
          <div :class="cls.field">
            <span :class="cls.fieldLabel">Période de début</span>
            <div :class="cls.radioGroup">
              <label :class="cls.radioItem"><input type="radio" v-model="form.startPeriod" value="full" /><span>Journée entière</span></label>
              <label :class="cls.radioItem"><input type="radio" v-model="form.startPeriod" value="am" /><span>Matin</span></label>
              <label :class="cls.radioItem"><input type="radio" v-model="form.startPeriod" value="pm" /><span>Après-midi</span></label>
            </div>
          </div>

          <!-- Nombre de jours -->
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Nombre de jours <span class="text-danger">*</span></label>
            <input type="number" min="0.5" step="0.5" v-model.number="form.workingDaysCount" :class="[cls.fieldInput, errors.workingDays && cls.inputError]" placeholder="ex: 3.5" @input="onDaysInput" />
            <div v-if="errors.workingDays" :class="cls.fieldError">{{ errors.workingDays }}</div>
          </div>

          <!-- Date de fin -->
          <div :class="cls.field">
            <label :class="cls.fieldLabel">Date de fin</label>
            <input type="date" v-model="form.endDate" :class="cls.fieldInput" @change="onEndDateChange" />
            <span v-if="form.endDate && form.workingDaysCount" class="inline-flex items-center text-[11px] font-semibold rounded-md px-2 py-0.5 mt-1.5 w-fit"
              :class="isBalanceInsufficient ? 'bg-danger-bg text-danger' : 'bg-success-bg text-success'">
              {{ form.workingDaysCount }} j ouvrables
            </span>
          </div>

          <!-- Période de fin -->
          <div :class="cls.field">
            <span :class="cls.fieldLabel">Période de fin</span>
            <div :class="cls.radioGroup">
              <label :class="cls.radioItem"><input type="radio" v-model="form.endPeriod" value="full" /><span>Journée entière</span></label>
              <label :class="cls.radioItem"><input type="radio" v-model="form.endPeriod" value="am" /><span>Matin</span></label>
              <label :class="cls.radioItem"><input type="radio" v-model="form.endPeriod" value="pm" /><span>Après-midi</span></label>
            </div>
          </div>

          <!-- Intérimaire -->
          <div v-if="form.type && form.type !== 'Télétravail'" :class="cls.field">
            <label :class="cls.fieldLabel">Intérimaire <span :class="cls.fieldOptional">(optionnel)</span></label>
            <input type="text" v-model="form.interim" :class="cls.fieldInput" placeholder="Qui assure votre intérim ?" />
          </div>

          <!-- Commentaire -->
          <div :class="cls.field">
            <label :class="cls.fieldLabel">{{ t('absence.fields.reason') }} <span :class="cls.fieldOptional">({{ t('absence.optional') }})</span></label>
            <textarea v-model="form.comment" :class="cls.fieldTextarea" rows="3" placeholder="Précisez si nécessaire..."></textarea>
          </div>

        </div>
        </FormSection>

        <!-- Infos calculées -->
        <div v-if="resumeDate" class="flex items-center gap-2 text-[13px] text-muted-foreground bg-primary/10 rounded-md px-3 py-2 mt-4">
          <CalendarCheck class="w-[15px] h-[15px] text-primary" /> Reprise prévue le <strong class="text-primary">{{ formatDateFR(resumeDate) }}</strong>
        </div>
        <div v-if="isBalanceInsufficient" :class="cls.fieldErrorBlock + ' mt-3'">
          <AlertCircle class="w-3.5 h-3.5" /> Solde insuffisant ({{ currentRule?.daysPerYear ?? 0 }} jours disponibles)
        </div>
        <div v-if="isNoticePeriodViolated" :class="cls.fieldErrorBlock + ' mt-3'">
          <AlertCircle class="w-3.5 h-3.5" /> Préavis de {{ currentRule?.noticeDays }} jour(s) requis pour ce type
        </div>

      </div>
    </div>
  </template>
  </CreateModalShell>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Calendar, Clock, Paperclip, AlertTriangle, AlertCircle, CalendarCheck, Info } from 'lucide-vue-next'
import CreateModalShell from './shared/CreateModalShell.vue'
import FormSection from './ui/form-field/FormSection.vue'
import * as cls from '../lib/formClasses'
import SearchableDropdown from './ui/SearchableDropdown.vue'
import ForWhomSelector from './ui/ForWhomSelector.vue'
import type { BeneficiaryValue } from './ui/ForWhomSelector.vue'
import { useAbsenceStore }    from '../stores/absences'
import { useCalendarStore }   from '../stores/calendar'
import { useEmployeeStore }   from '../stores/employees'
import { useLeaveTypesStore } from '../stores/leaveTypes'
import { useAuthStore }       from '../stores/auth'
import { calculateEndDate, getWorkingDaysBetween, isWorkingDay } from '../utils/calendar'
import { getInitials } from '../utils/helpers'
import type { LeaveType, EmployeeSchedule } from '../types'

const props = defineProps<{
  modelValue:   boolean
  initialType?: LeaveType | ''
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'drafted': []
  'submitted': []
}>()

const absenceStore    = useAbsenceStore()
const calendarStore   = useCalendarStore()
const employeeStore   = useEmployeeStore()
const leaveTypesStore = useLeaveTypesStore()
const auth            = useAuthStore()
const { t }           = useI18n()

const forWhom = ref<BeneficiaryValue>({ mode: 'self', employeeId: '' })

const availableEmployees = computed(() => {
  const role = auth.user?.role ?? ''
  if (role === 'hr_admin' || role === 'hr_director') {
    return employeeStore.employees.map(e => ({
      id: e.id, label: e.name, sublabel: e.entityName,
      initials: getInitials(e.name), avatarColor: e.avatarBg,
    }))
  }
  if (role === 'validator') {
    return employeeStore.getByEntityId(auth.user?.entityId ?? '').map(e => ({
      id: e.id, label: e.name, sublabel: e.entityName,
      initials: getInitials(e.name), avatarColor: e.avatarBg,
    }))
  }
  return []
})

const leaveTypeItems = computed(() =>
  leaveTypesStore.activeTypes.map(lt => ({
    id:    lt.name,
    label: lt.name,
  }))
)

// ── Form state ─────────────────────────────────────────────────
const form = reactive({
  type:             '' as LeaveType | '',
  startDate:        '',
  startPeriod:      'full' as 'full' | 'am' | 'pm',
  workingDaysCount: null as number | null,
  endDate:          '',
  endPeriod:        'full' as 'full' | 'am' | 'pm',
  interim:          '',
  comment:          '',
})

const errors = reactive({
  employee:    '',
  type:        '',
  startDate:   '',
  workingDays: '',
})

const resumeDate = ref('')
const daysMode   = ref<'from-days' | 'from-date'>('from-days')
let   calculating = false

// ── Computed ───────────────────────────────────────────────────
const currentRule = computed(() =>
  form.type ? calendarStore.getLeaveRule(form.type as LeaveType) : null
)

const currentLeaveType = computed(() =>
  form.type ? leaveTypesStore.activeTypes.find(lt => lt.name === form.type) : null
)

// Placeholder — schedule support planned for a future sprint
const employeeSchedule = computed<EmployeeSchedule | undefined>(() => undefined)

const nextMonthLabel = computed(() => {
  const now  = new Date()
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return next.toLocaleDateString('fr-FR', { month: 'long' })
})

const isPastDate = computed(() => {
  if (!form.startDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const p = form.startDate.split('-').map(Number)
  return new Date(p[0] ?? 0, (p[1] ?? 1) - 1, p[2] ?? 1) < today
})

const isNotWorkingDay = computed(() => {
  if (!form.startDate) return false
  const p = form.startDate.split('-').map(Number)
  return !isWorkingDay(new Date(p[0] ?? 0, (p[1] ?? 1) - 1, p[2] ?? 1), calendarStore.calendar, employeeSchedule.value)
})

const isBalanceInsufficient = computed(() => {
  if (!form.workingDaysCount || !currentRule.value) return false
  const limit = currentRule.value.daysPerYear
  return limit > 0 && form.workingDaysCount > limit
})

const SPECIAL_TYPES: LeaveType[] = ['Congé maladie', 'Congé maternité', 'Assistance parentale']
const isSpecialType = computed(() => !!form.type && SPECIAL_TYPES.includes(form.type as LeaveType))

const isNoticePeriodViolated = computed(() => {
  if (!form.startDate || !currentRule.value || currentRule.value.noticeDays === 0) return false
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const p     = form.startDate.split('-').map(Number)
  const start = new Date(p[0] ?? 0, (p[1] ?? 1) - 1, p[2] ?? 1)
  const diffDays = Math.ceil((start.getTime() - today.getTime()) / 86400000)
  return diffDays < currentRule.value.noticeDays
})

// ── Watchers ───────────────────────────────────────────────────
watch(() => props.modelValue, (val) => {
  if (val) {
    forWhom.value         = { mode: 'self', employeeId: '' }
    form.type             = props.initialType ?? ''
    form.startDate        = ''
    form.startPeriod      = 'full'
    form.workingDaysCount = null
    form.endDate          = ''
    form.endPeriod        = 'full'
    form.interim          = ''
    form.comment          = ''
    resumeDate.value      = ''
    daysMode.value        = 'from-days'
    errors.type           = ''
    errors.startDate      = ''
    errors.workingDays    = ''
  }
})

// Auto-calculate end date when start + days change
watch(
  () => [form.startDate, form.workingDaysCount, form.startPeriod] as const,
  ([start, days, period]) => {
    if (calculating || daysMode.value !== 'from-days') return
    if (!start || !days || days <= 0) { resumeDate.value = ''; return }
    calculating = true
    try {
      const result  = calculateEndDate(start, days, calendarStore.calendar, period, employeeSchedule.value)
      form.endDate  = result.endDate
      form.endPeriod = result.endPeriod
      resumeDate.value = result.resumeDate
    } finally {
      calculating = false
    }
  },
)

function onDaysInput() {
  daysMode.value = 'from-days'
}

function onEndDateChange() {
  if (calculating) return
  if (!form.startDate || !form.endDate) return
  daysMode.value = 'from-date'
  calculating = true
  try {
    const days = getWorkingDaysBetween(form.startDate, form.endDate, calendarStore.calendar, employeeSchedule.value)
    form.workingDaysCount = days
    if (days > 0) {
      const result     = calculateEndDate(form.startDate, days, calendarStore.calendar, form.startPeriod, employeeSchedule.value)
      resumeDate.value = result.resumeDate
    }
  } finally {
    calculating = false
    daysMode.value = 'from-days'
  }
}

function formatDateFR(dateStr: string): string {
  const MONTHS_FR = [
    'jan', 'fév', 'mar', 'avr', 'mai', 'jun',
    'jul', 'aoû', 'sep', 'oct', 'nov', 'déc',
  ]
  const p = dateStr.split('-').map(Number)
  return `${p[2] ?? ''} ${MONTHS_FR[(p[1] ?? 1) - 1] ?? ''} ${p[0] ?? ''}`
}

// ── Validation ─────────────────────────────────────────────────
function validate(): boolean {
  errors.employee    = ''
  errors.type        = ''
  errors.startDate   = ''
  errors.workingDays = ''
  let ok = true

  if (forWhom.value.mode === 'for-employee' && !forWhom.value.employeeId) {
    errors.employee = 'Veuillez sélectionner un employé'
    ok = false
  }

  if (!form.type) {
    errors.type = t('validation.required_type')
    ok = false
  }
  if (!form.startDate) {
    errors.startDate = t('validation.required_start')
    ok = false
  }
  if (isNotWorkingDay.value) {
    errors.startDate = 'Ce jour n\'est pas un jour ouvrable'
    ok = false
  }
  if (!form.workingDaysCount || form.workingDaysCount <= 0) {
    errors.workingDays = 'Nombre de jours requis (min. 0.5)'
    ok = false
  }
  if (isBalanceInsufficient.value) {
    errors.workingDays = `Solde insuffisant (${currentRule.value?.daysPerYear ?? 0} j disponibles)`
    ok = false
  }
  return ok
}

function close() { emit('update:modelValue', false) }

function handleDraft() {
  if (!validate()) return
  absenceStore.saveDraft({
    type:      form.type as LeaveType,
    startDate: form.startDate,
    endDate:   form.endDate || form.startDate,
    reason:    form.comment || undefined,
  })
  close()
  emit('drafted')
}

function handleSubmit() {
  if (!validate()) return
  absenceStore.submitLeave({
    type:      form.type as LeaveType,
    startDate: form.startDate,
    endDate:   form.endDate || form.startDate,
    reason:    form.comment || undefined,
  })
  close()
  emit('submitted')
}

function handleMarkRegistered() {
  if (!validate()) return
  const leave = absenceStore.submitLeave({
    type:      form.type as LeaveType,
    startDate: form.startDate,
    endDate:   form.endDate || form.startDate,
    reason:    form.comment || undefined,
  })
  absenceStore.markRegistered(leave.id)
  close()
  emit('submitted')
}
</script>