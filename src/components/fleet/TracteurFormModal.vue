<template>
  <CreateModalShell
    v-if="modelValue"
    :title="editId ? 'Modifier le tracteur' : 'Nouveau tracteur'"
    :banner-label="editId ? 'Tracteurs · Modification' : 'Tracteurs · Création'"
    :create-label="editId ? 'Enregistrer' : 'Créer le tracteur'"
    :is-saving="submitting"
    :save-error="submitError || undefined"
    @close="$emit('update:modelValue', false)"
    @create="handleSubmit"
  >
    <template #form>
      <div class="flex-1 overflow-y-auto px-8 py-6 max-w-2xl mx-auto">
        <FormSection title="Identification du véhicule">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label class="text-[12px] font-medium text-muted-foreground">VIN *</label>
              <input v-model.trim="form.vin" type="text" placeholder="ex. YV2RT40A4SB123456" maxlength="17" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary" />
              <p v-if="errors.vin" class="text-red-500 text-[11px]">{{ errors.vin }}</p>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[12px] font-medium text-muted-foreground">Plaque *</label>
              <input v-model.trim="form.plaque" type="text" placeholder="ex. 1234 TAN" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] font-mono text-foreground focus:outline-none focus:border-primary" />
              <p v-if="errors.plaque" class="text-red-500 text-[11px]">{{ errors.plaque }}</p>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[12px] font-medium text-muted-foreground">Marque *</label>
              <select v-model="form.marque" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary">
                <option value="" disabled>Sélectionner une marque</option>
                <option v-for="m in marques" :key="m" :value="m">{{ m }}</option>
              </select>
              <p v-if="errors.marque" class="text-red-500 text-[11px]">{{ errors.marque }}</p>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[12px] font-medium text-muted-foreground">Modèle *</label>
              <input v-model.trim="form.modele" type="text" placeholder="ex. FH 460" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary" />
              <p v-if="errors.modele" class="text-red-500 text-[11px]">{{ errors.modele }}</p>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[12px] font-medium text-muted-foreground">Date de mise en circulation *</label>
              <input v-model="form.dateMiseEnCirculation" type="date" :max="todayISO" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary" />
              <p v-if="errors.dateMiseEnCirculation" class="text-red-500 text-[11px]">{{ errors.dateMiseEnCirculation }}</p>
            </div>
            <div v-if="editId" class="flex flex-col gap-1">
              <label class="text-[12px] font-medium text-muted-foreground">Statut administratif</label>
              <select v-model="form.statutAdmin" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary">
                <option value="en_service">En service</option>
                <option value="hors_service">Hors service</option>
              </select>
            </div>
          </div>
        </FormSection>
      </div>
    </template>
  </CreateModalShell>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import CreateModalShell from '../shared/CreateModalShell.vue'
import FormSection from '../ui/form-field/FormSection.vue'
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
