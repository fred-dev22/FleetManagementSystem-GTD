<template>
  <ListPageLayout
    title="Tracteurs"
    :subtitle="`${store.tracteurs.length} tracteur(s) enregistré(s)`"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} tracteur(s)`"
    search-placeholder="Rechercher par plaque ou VIN…"
    scope-label="Statut admin :"
    :scope-options="scopeOptions"
    v-model:scope="activeScope"
    v-model:search-query="searchQuery"
    v-model:sort-key="sortKey"
    v-model:sort-dir="sortDir"
    v-model:page="page"
    v-model:page-size="pageSize"
    @reset-filters="resetFilters"
    @open-card="(e) => openCard(e.id)"
  >
    <template #header-actions>
      <button :class="L.btnPrimary" @click="openCreate">
        <Plus class="w-4 h-4" /> Nouveau tracteur
      </button>
    </template>

    <template #above-table>
      <div class="grid grid-cols-4 gap-2.5 mb-3.5 max-md:grid-cols-2">
        <div :class="kpiItem"><div :class="kpiIcon" class="bg-primary/10"><Truck class="w-[18px] h-[18px] text-primary" /></div><div><div :class="kpiVal">{{ store.tracteurs.length }}</div><div :class="kpiLbl">Total</div></div></div>
        <div :class="kpiItem"><div :class="kpiIcon" class="bg-success-bg"><Check class="w-[18px] h-[18px] text-success" /></div><div><div :class="kpiVal">{{ store.tracteurs.filter(t => t.statutAdmin === 'en_service').length }}</div><div :class="kpiLbl">En service</div></div></div>
        <div :class="kpiItem"><div :class="kpiIcon" class="bg-warning-bg"><AlertTriangle class="w-[18px] h-[18px] text-warning" /></div><div><div :class="kpiVal">{{ store.tracteurs.filter(t => t.statutAdmin === 'hors_service').length }}</div><div :class="kpiLbl">Hors service</div></div></div>
        <div :class="kpiItem"><div :class="kpiIcon" class="bg-background"><Archive class="w-[18px] h-[18px] text-muted-foreground" /></div><div><div :class="kpiVal">{{ store.tracteurs.filter(t => t.statutAdmin === 'archive').length }}</div><div :class="kpiLbl">Archivés</div></div></div>
      </div>
    </template>

    <template #filters>
      <div :class="L.fpField">
        <label :class="L.fpFieldLabel">Statut op.</label>
        <select v-model="filterOp" :class="L.fpSelect">
          <option value="">Tous</option>
          <option value="en_mouvement">En mouvement</option>
          <option value="arrete">Arrêté</option>
          <option value="allume_immobile">Allumé/immobile</option>
          <option value="signal_perdu">Signal perdu</option>
        </select>
      </div>
      <button class="mt-auto py-[7px] bg-transparent border-0 text-xs text-muted-foreground cursor-pointer text-left hover:text-primary" @click="resetFilters">
        Réinitialiser
      </button>
    </template>

    <template #cell-id="{ item }">
      <span class="text-[11px] font-bold px-[7px] py-0.5 rounded bg-primary/10 text-primary tracking-[0.04em]">{{ item.id }}</span>
    </template>
    <template #cell-plaque="{ item }">
      <button class="font-mono font-semibold text-foreground hover:text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer" @click="openCard(item.id)">
        {{ item.plaque }}
      </button>
    </template>
    <template #cell-marque="{ item }">
      <span class="font-medium text-foreground">{{ item.marque }}</span>
      <span class="text-muted-foreground text-xs"> / {{ item.modele }}</span>
    </template>
    <template #cell-chauffeur="{ item }">
      <span class="text-muted-foreground text-xs">{{ item.chauffeurNom ?? '—' }}</span>
    </template>
    <template #cell-remorque="{ item }">
      <span class="font-mono text-xs text-muted-foreground">{{ item.remorquePlaque ?? '—' }}</span>
    </template>
    <template #cell-statutAdmin="{ item }">
      <span :class="['text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap', statutAdminClass(item.statutAdmin)]">{{ statutAdminLabel(item.statutAdmin) }}</span>
    </template>
    <template #cell-statutOp="{ item }">
      <span :class="['text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap', statutOpClass(item.statutOp)]">{{ statutOpLabel(item.statutOp) }}</span>
    </template>
    <template #cell-carburant="{ item }">
      <div class="flex items-center gap-2">
        <div class="w-14 h-1.5 rounded-full bg-border overflow-hidden">
          <div class="h-full rounded-full" :style="{ width: (item.niveauCarburant ?? 0) + '%', background: (item.niveauCarburant ?? 0) > 25 ? '#16a34a' : '#dc2626' }"></div>
        </div>
        <span class="text-[11px] text-muted-foreground">{{ item.niveauCarburant ?? 0 }}%</span>
      </div>
    </template>

    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3">
        <div>
          <span class="text-[11px] font-bold px-[7px] py-0.5 rounded bg-primary/10 text-primary tracking-[0.04em]">{{ item.id }}</span>
          <div class="font-mono font-semibold text-foreground mt-1.5">{{ item.plaque }}</div>
          <div class="text-xs text-muted-foreground">{{ item.marque }} {{ item.modele }}</div>
        </div>
        <div class="flex gap-2 flex-wrap">
          <span :class="['text-[11px] font-medium px-2 py-0.5 rounded-full', statutAdminClass(item.statutAdmin)]">{{ statutAdminLabel(item.statutAdmin) }}</span>
          <span :class="['text-[11px] font-medium px-2 py-0.5 rounded-full', statutOpClass(item.statutOp)]">{{ statutOpLabel(item.statutOp) }}</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-[12px]">
          <div><div class="text-muted-foreground text-[11px]">Chauffeur</div>{{ item.chauffeurNom ?? '—' }}</div>
          <div><div class="text-muted-foreground text-[11px]">Remorque</div><span class="font-mono">{{ item.remorquePlaque ?? '—' }}</span></div>
          <div><div class="text-muted-foreground text-[11px]">Kilométrage</div>{{ (item.kilometrage ?? 0).toLocaleString('fr-FR') }} km</div>
          <div>
            <div class="text-muted-foreground text-[11px]">Carburant</div>
            <div class="flex items-center gap-1.5 mt-0.5">
              <div class="w-12 h-1.5 rounded-full bg-border overflow-hidden">
                <div class="h-full rounded-full" :style="{ width: (item.niveauCarburant ?? 0) + '%', background: (item.niveauCarburant ?? 0) > 25 ? '#16a34a' : '#dc2626' }"></div>
              </div>
              <span>{{ item.niveauCarburant ?? 0 }}%</span>
            </div>
          </div>
        </div>
        <button :class="L.btnPrimary" class="w-full justify-center" @click="openCard(item.id)">Ouvrir la fiche</button>
        <button :class="L.btnOutline" class="w-full justify-center" @click="openEdit(item.id)">Modifier</button>
      </div>
    </template>

    <template #empty>
      <Truck class="w-8 h-8" />
      <p class="text-[13px]">Aucun tracteur trouvé</p>
    </template>

    <TracteurCard v-if="openCardId !== null" :tracteurs="store.tracteurs" :tracteur-id="openCardId" @close="openCardId = null" />
    <TracteurFormModal v-model="showCreate" :edit-id="editId ?? undefined" @saved="editId = null" />
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, Truck, Check, AlertTriangle, Archive } from 'lucide-vue-next'
import { ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import TracteurCard from '../../components/fleet/TracteurCard.vue'
import TracteurFormModal from '../../components/fleet/TracteurFormModal.vue'
import * as L from '../../lib/listClasses'
import { useTracteurStore } from '../../stores/tracteurs'
import type { Tracteur } from '../../types'

const store = useTracteurStore()

const kpiItem = 'bg-card border border-border rounded-lg px-3.5 py-3 flex items-center gap-3'
const kpiIcon = 'w-9 h-9 rounded-lg flex items-center justify-center shrink-0'
const kpiVal  = 'text-[22px] font-bold leading-none'
const kpiLbl  = 'text-xs text-muted-foreground mt-0.5'

const showCreate  = ref(false)
const editId      = ref<string | null>(null)
const openCardId  = ref<string | null>(null)
const searchQuery = ref('')
const activeScope = ref('')
const filterOp    = ref('')
const sortKey     = ref('')
const sortDir     = ref<'asc' | 'desc'>('asc')
const page        = ref(1)
const pageSize    = ref(15)

function openCreate()          { editId.value = null; showCreate.value = true }
function openEdit(id: string)  { editId.value = id; showCreate.value = true }
function openCard(id: string)  { openCardId.value = id }

const scopeOptions = [
  { value: '', label: 'Tous' },
  { value: 'en_service', label: 'En service' },
  { value: 'hors_service', label: 'Hors service' },
  { value: 'archive', label: 'Archivés' },
]

const columns = computed<ListColumn[]>(() => [
  { key: 'id', label: 'ID', width: 110 },
  { key: 'plaque', label: 'Plaque', sortable: true, width: 120 },
  { key: 'marque', label: 'Marque / Modèle', width: 180 },
  { key: 'chauffeur', label: 'Chauffeur', width: 170 },
  { key: 'remorque', label: 'Remorque', width: 120 },
  { key: 'statutAdmin', label: 'Statut admin', sortable: true, width: 130 },
  { key: 'statutOp', label: 'Statut op.', width: 150 },
  { key: 'carburant', label: 'Carburant', align: 'center', width: 120 },
])

watch([activeScope, filterOp, searchQuery, pageSize], () => { page.value = 1 })
function resetFilters() { activeScope.value = ''; filterOp.value = ''; searchQuery.value = ''; page.value = 1 }

const filtered = computed(() => {
  let rows = store.tracteurs.filter(t => {
    if (activeScope.value && t.statutAdmin !== activeScope.value) return false
    if (filterOp.value && t.statutOp !== filterOp.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!t.plaque.toLowerCase().includes(q) && !(t.vin ?? '').toLowerCase().includes(q) && !(t.chauffeurNom ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })
  if (sortKey.value) {
    const k = sortKey.value as keyof Tracteur
    rows = [...rows].sort((a, b) => {
      const cmp = String(a[k] ?? '').localeCompare(String(b[k] ?? ''))
      return sortDir.value === 'asc' ? cmp : -cmp
    })
  }
  return rows
})

const totalCount = computed(() => filtered.value.length)
const pageItems  = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

function statutAdminLabel(s?: string) {
  return ({ en_service: 'En service', hors_service: 'Hors service', archive: 'Archivé' } as any)[s ?? ''] ?? s ?? '—'
}
function statutAdminClass(s?: string) {
  return ({ en_service: 'bg-success-bg text-success', hors_service: 'bg-warning-bg text-warning', archive: 'bg-background text-muted-foreground border border-border' } as any)[s ?? ''] ?? ''
}
function statutOpLabel(s?: string) {
  return ({ en_mouvement: 'En mouvement', arrete: 'Arrêté', allume_immobile: 'Allumé / immobile', signal_perdu: 'Signal perdu' } as any)[s ?? ''] ?? s ?? '—'
}
function statutOpClass(s?: string) {
  return ({ en_mouvement: 'bg-success-bg text-success', arrete: 'bg-primary/10 text-primary', allume_immobile: 'bg-warning-bg text-warning', signal_perdu: 'bg-danger-bg text-danger' } as any)[s ?? ''] ?? ''
}
</script>
