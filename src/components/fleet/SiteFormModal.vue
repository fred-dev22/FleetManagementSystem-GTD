<template>
  <ModalShell
    :open="modelValue"
    :title="editId ? 'Modifier le site' : 'Nouveau site'"
    max-width="max-w-[600px]"
    @close="$emit('update:modelValue', false)"
  >
    <form @submit.prevent="handleSubmit" novalidate class="p-6 space-y-4">

      <!-- Code -->
      <div>
        <label class="block text-sm font-medium text-foreground mb-1">Code <span class="text-red-500">*</span></label>
        <input
          v-model="form.code"
          type="text"
          required
          placeholder="ex: GAR-TNR-01"
          @input="form.code = (form.code as string).toUpperCase()"
          class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
        />
        <p v-if="errors.code" class="text-red-500 text-xs mt-1">{{ errors.code }}</p>
      </div>

      <!-- Nom -->
      <div>
        <label class="block text-sm font-medium text-foreground mb-1">Nom complet <span class="text-red-500">*</span></label>
        <input
          v-model="form.nom"
          type="text"
          required
          placeholder="ex: Garage principal Antananarivo"
          class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p v-if="errors.nom" class="text-red-500 text-xs mt-1">{{ errors.nom }}</p>
      </div>

      <!-- Ville & Région -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">Ville <span class="text-red-500">*</span></label>
          <input
            v-model="form.ville"
            type="text"
            placeholder="ex: Antananarivo"
            class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p v-if="errors.ville" class="text-red-500 text-xs mt-1">{{ errors.ville }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">Région</label>
          <input
            v-model="form.region"
            type="text"
            placeholder="ex: Analamanga"
            class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <!-- Type -->
      <div>
        <label class="block text-sm font-medium text-foreground mb-1">Type <span class="text-red-500">*</span></label>
        <select
          v-model="form.type"
          required
          class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="" disabled>Sélectionner un type</option>
          <option value="Garage">Garage</option>
          <option value="Dépôt chargement">Dépôt chargement</option>
          <option value="Dépôt déchargement">Dépôt déchargement</option>
          <option value="Zone à risque">Zone à risque</option>
          <option value="Point de contrôle">Point de contrôle</option>
        </select>
        <p v-if="errors.type" class="text-red-500 text-xs mt-1">{{ errors.type }}</p>
      </div>

      <!-- Actif -->
      <div class="flex items-center gap-3">
        <input id="actifModal" v-model="form.actif" type="checkbox" class="w-4 h-4 rounded" />
        <label for="actifModal" class="text-sm font-medium text-foreground">Site actif</label>
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
import { useSitesStore } from '../../stores/sites'
import type { TypeSite } from '../../types/index'

const props = defineProps<{
  modelValue: boolean
  editId?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  'saved': []
}>()

const siteStore = useSitesStore()

const form = reactive({
  code: '',
  nom: '',
  ville: '',
  region: '',
  type: '' as TypeSite | '',
  actif: true,
})

const errors = reactive<Partial<Record<string, string>>>({})
const submitError = ref('')
const submitting = ref(false)

watch(() => props.modelValue, (open) => {
  if (open) {
    submitError.value = ''
    Object.assign(errors, { code: '', nom: '', ville: '', type: '' })
    if (props.editId) {
      const s = siteStore.getSiteById(props.editId)
      if (s) {
        form.code = s.code
        form.nom = s.nom
        form.ville = s.ville
        form.region = s.region ?? ''
        form.type = s.type
        form.actif = s.actif
      }
    } else {
      form.code = ''
      form.nom = ''
      form.ville = ''
      form.region = ''
      form.type = ''
      form.actif = true
    }
  }
})

function validate(): boolean {
  errors.code = !form.code ? 'Le code est obligatoire.' : ''
  errors.nom = !form.nom ? 'Le nom est obligatoire.' : ''
  errors.ville = !form.ville ? 'La ville est obligatoire.' : ''
  errors.type = !form.type ? 'Le type est obligatoire.' : ''
  if (form.code) {
    const dup = siteStore.sites.find((s: any) => s.code === form.code && s.id !== props.editId)
    if (dup) errors.code = 'Ce code est déjà utilisé.'
  }
  return !Object.values(errors).some(Boolean)
}

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true
  submitError.value = ''
  try {
    if (props.editId) {
      siteStore.updateSite(props.editId, { ...form, type: form.type as TypeSite })
    } else {
      siteStore.addSite({ ...form, type: form.type as TypeSite })
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
