<template>
  <CreateModalShell
    v-if="modelValue"
    :title="editId ? 'Modifier la remorque' : 'Nouvelle remorque'"
    :banner-label="editId ? 'Remorques · Modification' : 'Remorques · Création'"
    :create-label="editId ? 'Enregistrer' : 'Créer la remorque'"
    :is-saving="submitting"
    :save-error="submitError || undefined"
    @close="$emit('update:modelValue', false)"
    @create="handleSubmit"
  >
    <template #form>
      <div class="flex-1 overflow-y-auto px-8 py-6 max-w-2xl mx-auto">
        <FormSection title="Identification de la remorque">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label class="text-[12px] font-medium text-muted-foreground">VIN *</label>
              <input v-model.trim="form.vin" type="text" placeholder="ex. 1FUJA6CK57LY12345" maxlength="17" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary" />
              <p v-if="errors.vin" class="text-red-500 text-[11px]">{{ errors.vin }}</p>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[12px] font-medium text-muted-foreground">Plaque *</label>
              <input v-model.trim="form.plaque" type="text" placeholder="ex. 1234 TAR" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] font-mono text-foreground focus:outline-none focus:border-primary" />
              <p v-if="errors.plaque" class="text-red-500 text-[11px]">{{ errors.plaque }}</p>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[12px] font-medium text-muted-foreground">Type *</label>
              <select v-model="form.type" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary">
                <option value="" disabled>Sélectionner un type</option>
                <option value="Citerne">Citerne</option>
                <option value="Bâchée">Bâchée</option>
                <option value="Frigorifique">Frigorifique</option>
                <option value="Plateau">Plateau</option>
                <option value="Autre">Autre</option>
              </select>
              <p v-if="errors.type" class="text-red-500 text-[11px]">{{ errors.type }}</p>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[12px] font-medium text-muted-foreground">Capacité *</label>
              <input v-model.trim="form.capacite" type="text" placeholder="ex. 28000L ou 28T" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary" />
              <p v-if="errors.capacite" class="text-red-500 text-[11px]">{{ errors.capacite }}</p>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[12px] font-medium text-muted-foreground">Date de mise en circulation</label>
              <input v-model="form.dateMiseEnCirculation" type="date" :max="todayISO" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>
        </FormSection>
      </div>
    </template>
  </CreateModalShell>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import CreateModalShell from '../shared/CreateModalShell.vue'
import FormSection from '../ui/form-field/FormSection.vue'
import { useRemorquesStore } from '../../stores/remorques'
import type { TypeRemorque, StatutAdminVehicule } from '../../types/index'

const props = defineProps<{
  modelValue: boolean
  editId?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  'saved': []
}>()

const store = useRemorquesStore()
const todayISO = new Date().toISOString().split('T')[0]

const form = reactive({
  vin: '',
  plaque: '',
  type: '' as TypeRemorque | '',
  capacite: '',
  dateMiseEnCirculation: '',
})

const errors = reactive<Partial<Record<string, string>>>({})
const submitError = ref('')
const submitting = ref(false)

watch(() => props.modelValue, (open) => {
  if (open) {
    submitError.value = ''
    Object.assign(errors, { vin: '', plaque: '', type: '', capacite: '' })
    if (props.editId) {
      const r = store.getRemorqueById(props.editId)
      if (r) {
        form.vin = r.vin
        form.plaque = r.plaque
        form.type = r.type
        form.capacite = r.capacite
        form.dateMiseEnCirculation = r.dateMiseEnCirculation ?? ''
      }
    } else {
      form.vin = ''
      form.plaque = ''
      form.type = ''
      form.capacite = ''
      form.dateMiseEnCirculation = ''
    }
  }
})

function validate(): boolean {
  errors.vin = !form.vin ? 'Le VIN est obligatoire.' : ''
  errors.plaque = !form.plaque ? 'La plaque est obligatoire.' : ''
  errors.type = !form.type ? 'Le type est obligatoire.' : ''
  errors.capacite = !form.capacite ? 'La capacité est obligatoire.' : ''
  if (form.vin) {
    const dup = store.remorques.find(r => r.vin === form.vin && r.id !== props.editId)
    if (dup) errors.vin = 'Ce VIN existe déjà.'
  }
  return !Object.values(errors).some(Boolean)
}

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true
  submitError.value = ''
  try {
    if (props.editId) {
      store.updateRemorque(props.editId, {
        vin: form.vin,
        plaque: form.plaque,
        type: form.type as TypeRemorque,
        capacite: form.capacite,
        dateMiseEnCirculation: form.dateMiseEnCirculation || undefined,
      })
    } else {
      store.createRemorque({
        vin: form.vin,
        plaque: form.plaque,
        type: form.type as TypeRemorque,
        capacite: form.capacite,
        dateMiseEnCirculation: form.dateMiseEnCirculation || undefined,
        statutAdmin: 'en_service' as StatutAdminVehicule,
        createdAt: new Date().toISOString(),
      })
    }
    emit('saved')
    emit('update:modelValue', false)
  } catch (err: any) {
    submitError.value = err?.message ?? 'Une erreur est survenue.'
  } finally {
    submitting.value = false
  }
}
</script>
