<template>
  <CreateModalShell
    v-if="modelValue"
    :title="editId ? 'Modifier le site' : 'Nouveau site'"
    :banner-label="editId ? 'Sites & Géofences · Modification' : 'Sites & Géofences · Création'"
    :create-label="editId ? 'Enregistrer' : 'Créer le site'"
    :is-saving="submitting"
    :save-error="submitError || undefined"
    @close="$emit('update:modelValue', false)"
    @create="handleSubmit"
  >
    <template #form>
      <div class="flex-1 overflow-y-auto px-8 py-6 max-w-2xl mx-auto">
        <FormSection title="Informations du site">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label class="text-[12px] font-medium text-muted-foreground">Code *</label>
              <input v-model="form.code" type="text" placeholder="ex: GAR-TNR-01" @input="form.code = (form.code as string).toUpperCase()" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] font-mono text-foreground focus:outline-none focus:border-primary" />
              <p v-if="errors.code" class="text-red-500 text-[11px]">{{ errors.code }}</p>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[12px] font-medium text-muted-foreground">Type *</label>
              <SearchableDropdown
                v-model="form.type"
                :items="optform_type"
                placeholder="Sélectionner un type"
              />
              <p v-if="errors.type" class="text-red-500 text-[11px]">{{ errors.type }}</p>
            </div>
            <div class="col-span-2 flex flex-col gap-1">
              <label class="text-[12px] font-medium text-muted-foreground">Nom complet *</label>
              <input v-model="form.nom" type="text" placeholder="ex: Garage principal Antananarivo" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary" />
              <p v-if="errors.nom" class="text-red-500 text-[11px]">{{ errors.nom }}</p>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[12px] font-medium text-muted-foreground">Ville *</label>
              <input v-model="form.ville" type="text" placeholder="ex: Antananarivo" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary" />
              <p v-if="errors.ville" class="text-red-500 text-[11px]">{{ errors.ville }}</p>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[12px] font-medium text-muted-foreground">Région</label>
              <input v-model="form.region" type="text" placeholder="ex: Analamanga" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div class="col-span-2 flex items-center gap-3 pt-1">
              <input id="actifModal" v-model="form.actif" type="checkbox" class="w-4 h-4 rounded" />
              <label for="actifModal" class="text-[13px] font-medium text-foreground cursor-pointer">Site actif</label>
            </div>
          </div>
        </FormSection>
      </div>
    </template>
  </CreateModalShell>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import SearchableDropdown from '../ui/SearchableDropdown.vue'
import type { DropdownItem } from '../ui/SearchableDropdown.vue'
import CreateModalShell from '../shared/CreateModalShell.vue'
import FormSection from '../ui/form-field/FormSection.vue'
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
      siteStore.createSite({ createdAt: new Date().toISOString(), rayon: 500, ...{ ...form, type: form.type as TypeSite } })
    }
    emit('saved')
    emit('update:modelValue', false)
  } catch (err: any) {
    submitError.value = err?.message ?? 'Une erreur est survenue.'
  } finally {
    submitting.value = false
  }
}

const optform_type: DropdownItem[] = [
                { id: 'Garage', label: "Garage" },
                { id: 'Dépôt chargement', label: "Dépôt chargement" },
                { id: 'Dépôt déchargement', label: "Dépôt déchargement" },
                { id: 'Zone à risque', label: "Zone à risque" },
                { id: 'Point de contrôle', label: "Point de contrôle" },
]
</script>
