<template>
  <CardModalShell
    page-title="Fiche remorque"
    :page-number="current.id"
    banner-label="Flotte · Remorques"
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

        <FormSection title="Identification" :recaps="[current.plaque, current.type ?? '']">
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
              <label :class="cls.fieldLabel">Type</label>
              <select v-if="isEditMode" v-model="form.type" :class="cls.fieldInput">
                <option value="Citerne">Citerne</option>
                <option value="Bâchée">Bâchée</option>
                <option value="Plateau">Plateau</option>
                <option value="Frigorifique">Frigorifique</option>
                <option value="Autre">Autre</option>
              </select>
              <span v-else class="text-[13px] text-foreground">{{ current.type ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Capacité</label>
              <span class="text-[13px] text-foreground">{{ current.capacite ? `${current.capacite} ${current.uniteCapacite ?? ''}` : '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Date mise en circulation</label>
              <input v-if="isEditMode" v-model="form.dateMiseEnCirculation" type="date" :class="cls.fieldInput" />
              <span v-else class="text-[13px] text-foreground">{{ fmtDate(current.dateMiseEnCirculation) }}</span>
            </div>
          </div>
        </FormSection>

        <FormSection title="État & Attelage" :recaps="[statutLabel(current.statutAdmin), current.tracteurPlaque ?? 'Non attelée']">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Statut administratif</label>
              <select v-if="isEditMode" v-model="form.statutAdmin" :class="cls.fieldInput">
                <option value="en_service">En service</option>
                <option value="hors_service">Hors service</option>
                <option value="archive">Archivée</option>
              </select>
              <span v-else class="text-[13px]">
                <span :class="['text-[11px] font-semibold px-2 py-0.5 rounded-full', statutClass(current.statutAdmin)]">{{ statutLabel(current.statutAdmin) }}</span>
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Tracteur attelé</label>
              <span class="text-[13px] font-mono text-foreground">{{ current.tracteurPlaque ?? '-' }}</span>
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
import { useRemorquesStore } from '../../stores/remorques'
import type { Remorque } from '../../types'

const props = defineProps<{ remorques: Remorque[]; remorqueId: string }>()
const emit  = defineEmits<{ close: [] }>()

const store = useRemorquesStore()

const localIndex = ref(props.remorques.findIndex(r => r.id === props.remorqueId))
const current    = computed(() => props.remorques[localIndex.value] ?? props.remorques[0]!)

const sidebarItems = computed(() => props.remorques.map(r => ({ no: r.id, label: r.plaque })))
const hasPrev = computed(() => localIndex.value > 0)
const hasNext = computed(() => localIndex.value < props.remorques.length - 1)

function navigate(dir: 1 | -1) {
  const next = localIndex.value + dir
  if (next >= 0 && next < props.remorques.length) localIndex.value = next
}

const isEditMode = ref(false)
const saving = ref(false)
const form = ref({ vin: '', plaque: '', type: '', dateMiseEnCirculation: '', statutAdmin: 'en_service' as any })

function loadForm() {
  const r = current.value
  form.value = { vin: r.vin ?? '', plaque: r.plaque, type: r.type ?? '', dateMiseEnCirculation: r.dateMiseEnCirculation ?? '', statutAdmin: r.statutAdmin }
}
watch(() => current.value, loadForm, { immediate: true })

const isDirty = computed(() => isEditMode.value && (
  form.value.plaque !== current.value.plaque || form.value.type !== current.value.type || form.value.statutAdmin !== current.value.statutAdmin
))

function handleCancel() { isEditMode.value = false; loadForm() }

async function handleSave() {
  saving.value = true
  store.updateRemorque(current.value.id, { vin: form.value.vin, plaque: form.value.plaque, type: form.value.type as any, dateMiseEnCirculation: form.value.dateMiseEnCirculation, statutAdmin: form.value.statutAdmin })
  saving.value = false
  isEditMode.value = false
}

function fmtDate(d?: string) { return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '-' }
function statutLabel(s?: string) { return ({ en_service: 'En service', hors_service: 'Hors service', archive: 'Archivée' } as any)[s ?? ''] ?? s ?? '-' }
function statutClass(s?: string) { return ({ en_service: 'bg-success-bg text-success', hors_service: 'bg-warning-bg text-warning', archive: 'bg-background text-muted-foreground' } as any)[s ?? ''] ?? '' }
</script>
