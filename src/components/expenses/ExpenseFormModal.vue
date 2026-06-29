<template>
  <CreateModalShell
    v-if="modelValue"
    :title="editId ? 'Modifier la note de frais' : 'Nouvelle note de frais'"
    :banner-label="editId ? 'Notes de frais · Modification' : 'Notes de frais · Création'"
    create-label="Soumettre"
    @close="$emit('update:modelValue', false)"
    @create="submit"
  >
  <template #form><div class="flex-1 overflow-y-auto px-8 py-6 max-w-3xl mx-auto">

    <ForWhomSelector v-model="forWhom" :available-employees="availableEmployees" />

    <FormSection title="Informations générales">
      <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
        <div class="col-span-2 flex flex-col gap-1">
          <label class="text-[12px] font-medium text-muted-foreground">Titre *</label>
          <input v-model="form.title" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary" type="text" placeholder="Ex: Mission Antananarivo – Juin 2026" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[12px] font-medium text-muted-foreground">Mission liée <span class="font-normal">(optionnel)</span></label>
          <select v-model="form.missionId" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary">
            <option value="">Aucune</option>
            <option v-for="m in missionStore.missions.filter(m => m.status === 'approved')" :key="m.id" :value="m.id">{{ m.code }} — {{ m.destination }}</option>
          </select>
        </div>
      </div>
    </FormSection>

    <FormSection title="Lignes de dépense">
      <template #default>
        <div class="flex justify-end mb-2">
          <button class="inline-flex items-center gap-1 px-3 py-1.5 rounded text-[12px] font-semibold bg-primary/10 text-primary cursor-pointer" @click="addLine"><Plus class="w-3 h-3" /> Ajouter</button>
        </div>
        <table class="lines-table w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <th class="text-left text-[11px] font-semibold text-muted-foreground bg-background border-b border-border px-2 py-2">Date</th>
              <th class="text-left text-[11px] font-semibold text-muted-foreground bg-background border-b border-border px-2 py-2">Catégorie</th>
              <th class="text-left text-[11px] font-semibold text-muted-foreground bg-background border-b border-border px-2 py-2">Description</th>
              <th class="text-left text-[11px] font-semibold text-muted-foreground bg-background border-b border-border px-2 py-2">Montant (MGA)</th>
              <th class="text-center text-[11px] font-semibold text-muted-foreground bg-background border-b border-border px-2 py-2">Justif.</th>
              <th class="border-b border-border px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(line, idx) in form.lines" :key="line.id">
              <td class="border-b border-border px-1 py-1"><input v-model="line.date" class="cell-input w-full h-[30px] px-1.5 border border-border rounded text-[12px] bg-background text-foreground focus:outline-none focus:border-primary" type="date" /></td>
              <td class="border-b border-border px-1 py-1"><select v-model="line.category" class="cell-input w-full h-[30px] px-1.5 border border-border rounded text-[12px] bg-background text-foreground focus:outline-none focus:border-primary"><option v-for="(label, key) in CATEGORY_LABELS" :key="key" :value="key">{{ label }}</option></select></td>
              <td class="border-b border-border px-1 py-1"><input v-model="line.description" class="cell-input w-full h-[30px] px-1.5 border border-border rounded text-[12px] bg-background text-foreground focus:outline-none focus:border-primary" type="text" placeholder="Description..." /></td>
              <td class="border-b border-border px-1 py-1"><input v-model.number="line.amount" class="cell-input w-full h-[30px] px-1.5 border border-border rounded text-[12px] bg-background text-foreground focus:outline-none focus:border-primary text-right" type="number" min="0" /></td>
              <td class="border-b border-border px-1 py-1 text-center"><input type="checkbox" v-model="line.receipt" /></td>
              <td class="border-b border-border px-1 py-1"><button class="w-6 h-6 flex items-center justify-center rounded bg-red-50 text-red-500 cursor-pointer border-0" @click="removeLine(idx)"><Trash2 class="w-3.5 h-3.5" /></button></td>
            </tr>
            <tr v-if="form.lines.length === 0">
              <td colspan="6" class="text-center py-5 text-muted-foreground italic text-[12px]">Aucune ligne — cliquez "Ajouter" pour commencer</td>
            </tr>
          </tbody>
        </table>
        <div class="mt-3 bg-background border border-border rounded-lg px-4 py-3 flex flex-col gap-1.5 text-[13px]">
          <div class="flex justify-between"><span class="text-muted-foreground">Nombre de lignes</span><span class="font-medium">{{ form.lines.length }}</span></div>
          <div class="flex justify-between"><span class="text-muted-foreground">Lignes avec justificatif</span><span class="font-medium">{{ form.lines.filter(l => l.receipt).length }} / {{ form.lines.length }}</span></div>
          <div class="flex justify-between border-t border-border pt-2 mt-1"><span class="text-muted-foreground">Total</span><span class="font-bold text-primary text-[15px]">{{ fmt(totalAmount) }} MGA</span></div>
        </div>
        <div class="pt-4">
          <button class="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium border border-border rounded text-foreground hover:bg-background transition cursor-pointer" @click="saveDraft">
            <Save class="w-4 h-4" /> Enregistrer en brouillon
          </button>
        </div>
      </template>
    </FormSection>

  </div></template>
  </CreateModalShell>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Plus, Trash2, Save, Send } from 'lucide-vue-next'
import CreateModalShell from '../shared/CreateModalShell.vue'
import FormSection from '../ui/form-field/FormSection.vue'
import ForWhomSelector from '../ui/ForWhomSelector.vue'
import type { BeneficiaryValue } from '../ui/ForWhomSelector.vue'
import { useAuthStore }     from '../../stores/auth'
import { useExpenseStore }  from '../../stores/expenses'
import { useMissionStore }  from '../../stores/missions'
import { useEmployeeStore } from '../../stores/employees'
import { getInitials } from '../../utils/helpers'
import type { ExpenseLine, ExpenseCategory } from '../../types'

const props = defineProps<{
  modelValue: boolean
  editId?:    string
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'submitted'): void
}>()

const auth          = useAuthStore()
const expenseStore  = useExpenseStore()
const missionStore  = useMissionStore()
const employeeStore = useEmployeeStore()

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

function resolveEmployee() {
  if (forWhom.value.mode === 'for-employee' && forWhom.value.employeeId) {
    const emp = employeeStore.getById(forWhom.value.employeeId)
    if (emp) return { id: emp.id, name: emp.name, initials: emp.initials }
  }
  return { id: auth.user?.id ?? '', name: auth.user?.name ?? '', initials: auth.user?.initials ?? '' }
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  transport:      'Transport',
  hebergement:    'Hébergement',
  repas:          'Repas',
  carburant:      'Carburant',
  fournitures:    'Fournitures',
  communication:  'Communication',
  representation: 'Représentation',
  autre:          'Autre',
}

const existing = props.editId ? expenseStore.getById(props.editId) : undefined

const form = reactive({
  title:     existing?.title     ?? '',
  missionId: existing?.missionId ?? '',
  lines:     (existing?.lines.map(l => ({ ...l })) ?? []) as ExpenseLine[],
})

let lineCounter = 100

function addLine() {
  form.lines.push({
    id:          `new-${++lineCounter}`,
    date:        new Date().toISOString().slice(0, 10),
    category:    'transport' as ExpenseCategory,
    description: '',
    amount:      0,
    currency:    'MGA',
    receipt:     false,
  })
}

function removeLine(idx: number) { form.lines.splice(idx, 1) }

const totalAmount = computed(() => form.lines.reduce((s, l) => s + (l.amount || 0), 0))

function fmt(n: number) { return n.toLocaleString('fr-FR') }

function saveDraft() {
  if (props.editId) {
    expenseStore.updateLines(props.editId, form.lines)
  } else {
    const emp = resolveEmployee()
    expenseStore.createReport({
      employeeId:       emp.id,
      employeeName:     emp.name,
      employeeInitials: emp.initials,
      title:        form.title,
      missionId:    form.missionId || undefined,
      lines:        form.lines,
      totalAmount:  totalAmount.value,
      currency:     'MGA',
    })
  }
  emit('submitted')
}

function submit() {
  const emp = resolveEmployee()
  const r = props.editId
    ? expenseStore.getById(props.editId)
    : expenseStore.createReport({
        employeeId:       emp.id,
        employeeName:     emp.name,
        employeeInitials: emp.initials,
        title:        form.title,
        missionId:    form.missionId || undefined,
        lines:        form.lines,
        totalAmount:  totalAmount.value,
        currency:     'MGA',
      })
  if (r) expenseStore.submitReport(r.id)
  emit('submitted')
}
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.modal   { background: var(--color-surface); border-radius: 12px; width: 800px; max-width: 100%; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 12px 48px rgba(0,0,0,.2); }

.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 0.5px solid var(--color-border); flex-shrink: 0; }
.modal-title  { font-size: 16px; font-weight: 700; color: var(--color-text); }
.close-btn    { width: 30px; height: 30px; border: none; background: var(--color-bg); border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); font-size: 16px; }

.modal-body { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 20px; }

.section { display: flex; flex-direction: column; gap: 12px; }
.section-header { display: flex; align-items: center; justify-content: space-between; }
.section-title { font-size: 13px; font-weight: 700; color: var(--color-text); text-transform: uppercase; letter-spacing: .04em; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-full { grid-column: 1 / -1; }
.form-field { display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 12px; font-weight: 500; color: var(--color-text-muted); }
.field-input { height: 36px; padding: 0 10px; border: 0.5px solid var(--color-border); border-radius: 6px; font-size: 13px; color: var(--color-text); background: var(--color-bg); outline: none; }
.field-input:focus { border-color: var(--color-primary); }

.add-line-btn { display: inline-flex; align-items: center; gap: 4px; padding: 5px 12px; border-radius: 6px; border: none; background: var(--color-primary-light); color: var(--color-primary); font-size: 12px; font-weight: 600; cursor: pointer; }

.lines-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.lines-table th { padding: 7px 8px; text-align: left; font-size: 11px; font-weight: 600; color: var(--color-text-muted); background: var(--color-bg); border-bottom: 0.5px solid var(--color-border); white-space: nowrap; }
.lines-table td { padding: 5px 6px; border-bottom: 0.5px solid var(--color-border); }
.cell-input { width: 100%; height: 30px; padding: 0 6px; border: 0.5px solid var(--color-border); border-radius: 5px; font-size: 12px; background: var(--color-surface); color: var(--color-text); outline: none; box-sizing: border-box; }
.cell-input:focus { border-color: var(--color-primary); }
.cell-amount { text-align: right; }
.center { text-align: center; }
.remove-line-btn { width: 26px; height: 26px; border: none; background: var(--color-danger-bg); color: var(--color-danger); border-radius: 5px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.no-lines { text-align: center; padding: 20px; color: var(--color-text-muted); font-style: italic; }

.recap { background: var(--color-bg); border-radius: 8px; padding: 12px 16px; display: flex; flex-direction: column; gap: 6px; border: 0.5px solid var(--color-border); }
.recap-row { display: flex; justify-content: space-between; font-size: 13px; }
.recap-label { color: var(--color-text-muted); }
.recap-val   { font-weight: 500; color: var(--color-text); }
.recap-total { padding-top: 8px; margin-top: 4px; border-top: 0.5px solid var(--color-border); }
.recap-total .recap-val { font-size: 16px; font-weight: 700; color: var(--color-primary); }

.modal-footer { display: flex; gap: 8px; justify-content: flex-end; padding: 14px 20px; border-top: 0.5px solid var(--color-border); flex-shrink: 0; }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; }
.btn-primary   { background: var(--color-primary); color: #fff; }
.btn-secondary { background: var(--color-info-bg); color: var(--color-info); }
.btn-outline   { background: var(--color-surface); color: var(--color-text); border: 0.5px solid var(--color-border); }

@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } .modal-body { padding: 14px; } }
</style>
