<template>
  <ModalShell
    :open="modelValue"
    :title="editId ? 'Modifier la remorque' : 'Nouvelle remorque'"
    max-width="max-w-[600px]"
    @close="$emit('update:modelValue', false)"
  >
    <form @submit.prevent="handleSubmit" novalidate class="p-6 space-y-4">

      <!-- VIN -->
      <div>
        <label class="block text-sm font-medium text-foreground mb-1">VIN <span class="text-red-500">*</span></label>
        <input
          v-model.trim="form.vin"
          type="text"
          placeholder="ex. 1FUJA6CK57LY12345"
          maxlength="17"
          class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p v-if="errors.vin" class="text-red-500 text-xs mt-1">{{ errors.vin }}</p>
      </div>

      <!-- Plaque -->
      <div>
        <label class="block text-sm font-medium text-foreground mb-1">Plaque <span class="text-red-500">*</span></label>
        <input
          v-model.trim="form.plaque"
          type="text"
          placeholder="ex. 1234 TAR"
          class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
        />
        <p v-if="errors.plaque" class="text-red-500 text-xs mt-1">{{ errors.plaque }}</p>
      </div>

      <!-- Type -->
      <div>
        <label class="block text-sm font-medium text-foreground mb-1">Type <span class="text-red-500">*</span></label>
        <select
          v-model="form.type"
          class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="" disabled>Sélectionner un type</option>
          <option value="Citerne">Citerne</option>
          <option value="Bâchée">Bâchée</option>
          <option value="Frigorifique">Frigorifique</option>
          <option value="Plateau">Plateau</option>
          <option value="Autre">Autre</option>
        </select>
        <p v-if="errors.type" class="text-red-500 text-xs mt-1">{{ errors.type }}</p>
      </div>

      <!-- Capacité -->
      <div>
        <label class="block text-sm font-medium text-foreground mb-1">Capacité <span class="text-red-500">*</span></label>
        <input
          v-model.trim="form.capacite"
          type="text"
          placeholder="ex. 28000L ou 28T"
          class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p v-if="errors.capacite" class="text-red-500 text-xs mt-1">{{ errors.capacite }}</p>
      </div>

      <!-- Date mise en circulation -->
      <div>
        <label class="block text-sm font-medium text-foreground mb-1">Date de mise en circulation</label>
        <input
          v-model="form.dateMiseEnCirculation"
          type="date"
          :max="todayISO"
          class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div v-if="submitError" class="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
        {{ submitError }}
      </div>

      <div class="flex justify-end gap-3 pt-2 border-t border-border">
        <button type="button" class="px-4 py-2 text-sm border border-border rounded-lg text-foreground hover:bg-muted transition-colors" @click="$emit('update:modelValue', false)">
          Annuler
        </button>
        <button type="submit" :disabled="submitting" class="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60">
          {{ submitting ? 'Enregistrement...' : (editId ? 'Modifier' : 'Créer') }}
        </button>
      </div>
    </form>
  </ModalShell>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import ModalShell from '../ui/ModalShell.vue'
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
