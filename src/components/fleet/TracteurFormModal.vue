<template>
  <ModalShell
    :open="modelValue"
    :title="editId ? 'Modifier le tracteur' : 'Nouveau tracteur'"
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
          placeholder="ex. YV2RT40A4SB123456"
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
          placeholder="ex. 1234 TAN"
          class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
        />
        <p v-if="errors.plaque" class="text-red-500 text-xs mt-1">{{ errors.plaque }}</p>
      </div>

      <!-- Marque -->
      <div>
        <label class="block text-sm font-medium text-foreground mb-1">Marque <span class="text-red-500">*</span></label>
        <select
          v-model="form.marque"
          class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="" disabled>Sélectionner une marque</option>
          <option v-for="m in marques" :key="m" :value="m">{{ m }}</option>
        </select>
        <p v-if="errors.marque" class="text-red-500 text-xs mt-1">{{ errors.marque }}</p>
      </div>

      <!-- Modèle -->
      <div>
        <label class="block text-sm font-medium text-foreground mb-1">Modèle <span class="text-red-500">*</span></label>
        <input
          v-model.trim="form.modele"
          type="text"
          placeholder="ex. FH 460"
          class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p v-if="errors.modele" class="text-red-500 text-xs mt-1">{{ errors.modele }}</p>
      </div>

      <!-- Date mise en circulation -->
      <div>
        <label class="block text-sm font-medium text-foreground mb-1">Date de mise en circulation <span class="text-red-500">*</span></label>
        <input
          v-model="form.dateMiseEnCirculation"
          type="date"
          :max="todayISO"
          class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p v-if="errors.dateMiseEnCirculation" class="text-red-500 text-xs mt-1">{{ errors.dateMiseEnCirculation }}</p>
      </div>

      <!-- Statut (edit only) -->
      <div v-if="editId">
        <label class="block text-sm font-medium text-foreground mb-1">Statut administratif</label>
        <select
          v-model="form.statutAdmin"
          class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="en_service">En service</option>
          <option value="hors_service">Hors service</option>
        </select>
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
import { ref, reactive, computed, watch } from 'vue'
import ModalShell from '../ui/ModalShell.vue'
import { useTracteurStore } from '../../stores/tracteurs'
import type { StatutAdminVehicule } from '../../types/index'

const props = defineProps<{
  modelValue: boolean
  editId?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  'saved': []
}>()

const store = useTracteurStore()
const marques = ['Volvo', 'Mercedes', 'MAN', 'Scania', 'DAF', 'Autre']
const todayISO = new Date().toISOString().split('T')[0]

const form = reactive({
  vin: '',
  plaque: '',
  marque: '',
  modele: '',
  dateMiseEnCirculation: '',
  statutAdmin: 'en_service' as StatutAdminVehicule,
})

const errors = reactive<Partial<Record<string, string>>>({})
const submitError = ref('')
const submitting = ref(false)

watch(() => props.modelValue, (open) => {
  if (open) {
    submitError.value = ''
    Object.assign(errors, { vin: '', plaque: '', marque: '', modele: '', dateMiseEnCirculation: '' })
    if (props.editId) {
      const t = store.getTracteurById(props.editId)
      if (t) {
        form.vin = t.vin
        form.plaque = t.plaque
        form.marque = t.marque
        form.modele = t.modele
        form.dateMiseEnCirculation = t.dateMiseEnCirculation
        form.statutAdmin = t.statutAdmin
      }
    } else {
      form.vin = ''
      form.plaque = ''
      form.marque = ''
      form.modele = ''
      form.dateMiseEnCirculation = ''
      form.statutAdmin = 'en_service'
    }
  }
})

function validate(): boolean {
  errors.vin = !form.vin ? 'Le VIN est obligatoire.' : ''
  errors.plaque = !form.plaque ? 'La plaque est obligatoire.' : ''
  errors.marque = !form.marque ? 'La marque est obligatoire.' : ''
  errors.modele = !form.modele ? 'Le modèle est obligatoire.' : ''
  errors.dateMiseEnCirculation = !form.dateMiseEnCirculation ? 'La date est obligatoire.' : ''
  if (form.vin) {
    const dup = store.tracteurs.find(t => t.vin === form.vin && t.id !== props.editId)
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
      store.updateTracteur(props.editId, {
        vin: form.vin,
        plaque: form.plaque,
        marque: form.marque,
        modele: form.modele,
        dateMiseEnCirculation: form.dateMiseEnCirculation,
        statutAdmin: form.statutAdmin,
      })
    } else {
      store.createTracteur({
        vin: form.vin,
        plaque: form.plaque,
        marque: form.marque,
        modele: form.modele,
        dateMiseEnCirculation: form.dateMiseEnCirculation,
        statutOp: 'arrete',
        kilometrage: 0,
        niveauCarburant: 0,
      } as any)
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
