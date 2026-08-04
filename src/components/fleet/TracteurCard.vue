<template>
  <CardModalShell
    page-title="Fiche tracteur"
    :page-number="current.id"
    banner-label="Flotte · Tracteurs"
    :sidebar-items="sidebarItems"
    :current-no="current.id"
    :has-prev="hasPrev"
    :has-next="hasNext"
    :is-edit-mode="isEditMode"
    :is-saving="saving"
    :has-unsaved-changes="isDirty"
    :show-edit="true"
    :show-title-new-button="false"
    @close="emit('close')"
    @prev="navigate(-1)"
    @next="navigate(1)"
    @edit="isEditMode = true"
    @save="handleSave"
    @cancel="handleCancel"
  >
    <template #form>
      <div class="flex-1 overflow-y-auto px-8 py-6 max-w-3xl mx-auto">

        <FormSection title="Identification du véhicule" :recaps="[current.plaque, current.marque + ' ' + current.modele]">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">VIN</label>
              <input v-if="isEditMode" v-model="form.vin" :class="cls.fieldInput" />
              <span v-else class="text-[13px] font-mono text-foreground">{{ current.vin ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Plaque</label>
              <input v-if="isEditMode" v-model="form.plaque" :class="cls.fieldInput" />
              <span v-else class="text-[13px] font-mono font-semibold text-foreground">{{ current.plaque }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Marque</label>
              <input v-if="isEditMode" v-model="form.marque" :class="cls.fieldInput" />
              <span v-else class="text-[13px] text-foreground">{{ current.marque }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Modèle</label>
              <input v-if="isEditMode" v-model="form.modele" :class="cls.fieldInput" />
              <span v-else class="text-[13px] text-foreground">{{ current.modele }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Date mise en circulation</label>
              <input v-if="isEditMode" v-model="form.dateMiseEnCirculation" type="date" :class="cls.fieldInput" />
              <span v-else class="text-[13px] text-foreground">{{ fmtDate(current.dateMiseEnCirculation) }}</span>
            </div>
          </div>
        </FormSection>

        <FormSection title="État opérationnel" :recaps="[statutAdminLabel(current.statutAdmin), statutOpLabel(current.statutOp)]">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Statut administratif</label>
              <select v-if="isEditMode" v-model="form.statutAdmin" :class="cls.fieldInput">
                <option value="en_service">En service</option>
                <option value="hors_service">Hors service</option>
                <option value="archive">Archivé</option>
              </select>
              <span v-else class="text-[13px]">
                <span :class="['text-[11px] font-semibold px-2 py-0.5 rounded-full', statutAdminClass(current.statutAdmin)]">{{ statutAdminLabel(current.statutAdmin) }}</span>
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Statut opérationnel</label>
              <span class="text-[13px]">
                <span :class="['text-[11px] font-semibold px-2 py-0.5 rounded-full', statutOpClass(current.statutOp)]">{{ statutOpLabel(current.statutOp) }}</span>
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Kilométrage</label>
              <span class="text-[13px] text-foreground">{{ (current.kilometrage ?? 0).toLocaleString('fr-FR') }} km</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Carburant</label>
              <div class="flex items-center gap-3 mt-1">
                <div class="flex-1 h-2 rounded-full bg-border overflow-hidden">
                  <div class="h-full rounded-full" :style="{ width: (current.niveauCarburant ?? 0) + '%', background: (current.niveauCarburant ?? 0) > 25 ? '#16a34a' : '#dc2626' }"></div>
                </div>
                <span class="text-[13px] font-medium text-foreground shrink-0">{{ current.niveauCarburant ?? 0 }}%</span>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection title="Affectation" :recaps="[current.chauffeurNom ?? '-', current.remorquePlaque ?? 'Sans remorque']">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Chauffeur affecté</label>
              <span class="text-[13px] text-foreground">{{ current.chauffeurNom ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Remorque attelée</label>
              <span class="text-[13px] font-mono text-foreground">{{ current.remorquePlaque ?? '-' }}</span>
            </div>
          </div>
        </FormSection>

      </div>
    </template>
  </CardModalShell>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import CardModalShell from '../shared/CardModalShell.vue'
import FormSection from '../ui/form-field/FormSection.vue'
import * as cls from '../../lib/formClasses'
import { useTracteurStore } from '../../stores/tracteurs'
import type { Tracteur, StatutAdminVehicule } from '../../types'

const props = defineProps<{ tracteurs: Tracteur[]; tracteurId: string }>()
const emit  = defineEmits<{ close: [] }>()

const store = useTracteurStore()

const currentIndex = computed(() => props.tracteurs.findIndex(t => t.id === props.tracteurId))
const localIndex   = ref(currentIndex.value)
const current      = computed(() => props.tracteurs[localIndex.value] ?? props.tracteurs[0]!)

const sidebarItems = computed(() => props.tracteurs.map(t => ({ no: t.id, label: t.plaque })))
const hasPrev = computed(() => localIndex.value > 0)
const hasNext = computed(() => localIndex.value < props.tracteurs.length - 1)

function navigate(dir: 1 | -1) {
  const next = localIndex.value + dir
  if (next >= 0 && next < props.tracteurs.length) { localIndex.value = next }
}

// ── Édition ───────────────────────────────────────────────────────
const isEditMode = ref(false)
const saving = ref(false)

const form = ref({ vin: '', plaque: '', marque: '', modele: '', dateMiseEnCirculation: '', statutAdmin: 'en_service' as StatutAdminVehicule })

function loadForm() {
  const t = current.value
  form.value = { vin: t.vin, plaque: t.plaque, marque: t.marque, modele: t.modele, dateMiseEnCirculation: t.dateMiseEnCirculation, statutAdmin: t.statutAdmin }
}

watch(() => current.value, loadForm, { immediate: true })

const isDirty = computed(() => isEditMode.value && (
  form.value.vin !== current.value.vin ||
  form.value.plaque !== current.value.plaque ||
  form.value.marque !== current.value.marque ||
  form.value.modele !== current.value.modele ||
  form.value.statutAdmin !== current.value.statutAdmin
))

function handleCancel() { isEditMode.value = false; loadForm() }

async function handleSave() {
  saving.value = true
  store.updateTracteur(current.value.id, { vin: form.value.vin, plaque: form.value.plaque, marque: form.value.marque, modele: form.value.modele, dateMiseEnCirculation: form.value.dateMiseEnCirculation, statutAdmin: form.value.statutAdmin })
  saving.value = false
  isEditMode.value = false
}

// ── Helpers ────────────────────────────────────────────────────────
function fmtDate(d?: string) { return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '-' }

function statutAdminLabel(s?: string) {
  return ({ en_service: 'En service', hors_service: 'Hors service', archive: 'Archivé' } as any)[s ?? ''] ?? s ?? '-'
}
function statutAdminClass(s?: string) {
  return ({ en_service: 'bg-success-bg text-success', hors_service: 'bg-warning-bg text-warning', archive: 'bg-background text-muted-foreground' } as any)[s ?? ''] ?? ''
}
function statutOpLabel(s?: string) {
  return ({ en_mouvement: 'En mouvement', arrete: 'Arrêté', allume_immobile: 'Allumé / immobile', signal_perdu: 'Signal perdu' } as any)[s ?? ''] ?? s ?? '-'
}
function statutOpClass(s?: string) {
  return ({ en_mouvement: 'bg-success-bg text-success', arrete: 'bg-primary/10 text-primary', allume_immobile: 'bg-warning-bg text-warning', signal_perdu: 'bg-danger-bg text-danger' } as any)[s ?? ''] ?? ''
}
</script>
