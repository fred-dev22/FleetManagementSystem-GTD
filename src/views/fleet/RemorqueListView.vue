<template>
  <ListPageLayout
    title="Remorques"
    :subtitle="`${store.remorques.length} remorque(s) enregistrée(s)`"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} remorque(s)`"
    search-placeholder="Rechercher par plaque ou VIN…"
    scope-label="Statut :"
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
        <Plus class="w-4 h-4" /> Nouvelle remorque
      </button>
    </template>

    <template #above-table>
      <div class="grid grid-cols-4 gap-2.5 mb-3.5 max-md:grid-cols-2">
        <div :class="kpiItem"><div :class="kpiIcon" class="bg-primary/10"><Container class="w-[18px] h-[18px] text-primary" /></div><div><div :class="kpiVal">{{ store.remorques.length }}</div><div :class="kpiLbl">Total</div></div></div>
        <div :class="kpiItem"><div :class="kpiIcon" class="bg-success-bg"><Check class="w-[18px] h-[18px] text-success" /></div><div><div :class="kpiVal">{{ store.remorques.filter(r => r.statutAdmin === 'en_service').length }}</div><div :class="kpiLbl">En service</div></div></div>
        <div :class="kpiItem"><div :class="kpiIcon" class="bg-warning-bg"><AlertTriangle class="w-[18px] h-[18px] text-warning" /></div><div><div :class="kpiVal">{{ store.remorques.filter(r => r.statutAdmin === 'hors_service').length }}</div><div :class="kpiLbl">Hors service</div></div></div>
        <div :class="kpiItem"><div :class="kpiIcon" class="bg-background"><Archive class="w-[18px] h-[18px] text-muted-foreground" /></div><div><div :class="kpiVal">{{ store.remorques.filter(r => r.statutAdmin === 'archive').length }}</div><div :class="kpiLbl">Archivées</div></div></div>
      </div>
    </template>

    <template #filters>
      <div :class="L.fpField">
        <label :class="L.fpFieldLabel">Type</label>
        <select v-model="filterType" :class="L.fpSelect">
          <option value="">Tous</option>
          <option value="Citerne">Citerne</option>
          <option value="Bâchée">Bâchée</option>
          <option value="Plateau">Plateau</option>
          <option value="Frigorifique">Frigorifique</option>
          <option value="Autre">Autre</option>
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
    <template #cell-type="{ item }">
      <span :class="['text-[11px] font-medium px-2 py-0.5 rounded-full', typeClass(item.type)]">{{ item.type ?? '-' }}</span>
    </template>
    <template #cell-capacite="{ item }">
      <span class="text-foreground font-medium">{{ item.capacite ? `${item.capacite} ${item.uniteCapacite ?? ''}` : '-' }}</span>
    </template>
    <template #cell-tracteur="{ item }">
      <span class="font-mono text-xs text-muted-foreground">{{ item.tracteurPlaque ?? '-' }}</span>
    </template>
    <template #cell-statut="{ item }">
      <span :class="['text-[11px] font-medium px-2 py-0.5 rounded-full', statutClass(item.statutAdmin)]">{{ statutLabel(item.statutAdmin) }}</span>
    </template>

    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3">
        <div>
          <span class="text-[11px] font-bold px-[7px] py-0.5 rounded bg-primary/10 text-primary tracking-[0.04em]">{{ item.id }}</span>
          <div class="font-mono font-semibold text-foreground mt-1.5">{{ item.plaque }}</div>
          <span :class="['text-[11px] font-medium px-2 py-0.5 rounded-full mt-1 inline-block', typeClass(item.type)]">{{ item.type }}</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-[12px]">
          <div><div class="text-muted-foreground text-[11px]">Capacité</div>{{ item.capacite ? `${item.capacite} ${item.uniteCapacite ?? ''}` : '-' }}</div>
          <div><div class="text-muted-foreground text-[11px]">Tracteur attelé</div><span class="font-mono">{{ item.tracteurPlaque ?? '-' }}</span></div>
          <div class="col-span-2"><div class="text-muted-foreground text-[11px]">Statut</div>
            <span :class="['text-[11px] font-medium px-2 py-0.5 rounded-full', statutClass(item.statutAdmin)]">{{ statutLabel(item.statutAdmin) }}</span>
          </div>
        </div>
        <button :class="L.btnPrimary" class="w-full justify-center" @click="openCard(item.id)">Ouvrir la fiche</button>
        <button :class="L.btnOutline" class="w-full justify-center" @click="openEdit(item.id)">Modifier</button>
      </div>
    </template>

    <template #empty>
      <Container class="w-8 h-8" />
      <p class="text-[13px]">Aucune remorque trouvée</p>
    </template>

    <RemorqueCard v-if="openCardId !== null" :remorques="store.remorques" :remorque-id="openCardId" @close="openCardId = null" />
    <RemorqueFormModal v-model="showCreate" :edit-id="editId" @saved="editId = undefined" />
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, Container, Check, AlertTriangle, Archive } from 'lucide-vue-next'
import { ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import RemorqueCard from '../../components/fleet/RemorqueCard.vue'
import RemorqueFormModal from '../../components/fleet/RemorqueFormModal.vue'
import * as L from '../../lib/listClasses'
import { useRemorquesStore } from '../../stores/remorques'

const store = useRemorquesStore()

const kpiItem = 'bg-card border border-border rounded-lg px-3.5 py-3 flex items-center gap-3'
const kpiIcon = 'w-9 h-9 rounded-lg flex items-center justify-center shrink-0'
const kpiVal  = 'text-[22px] font-bold leading-none'
const kpiLbl  = 'text-xs text-muted-foreground mt-0.5'

const showCreate  = ref(false)
const editId      = ref<string | undefined>(undefined)
const openCardId  = ref<string | null>(null)
const searchQuery = ref('')
const activeScope = ref('')
const filterType  = ref('')
const sortKey     = ref('')
const sortDir     = ref<'asc' | 'desc'>('asc')
const page        = ref(1)
const pageSize    = ref(15)

function openCreate()          { editId.value = undefined; showCreate.value = true }
function openEdit(id: string)  { editId.value = id; showCreate.value = true }
function openCard(id: string)  { openCardId.value = id }

const scopeOptions = [
  { value: '', label: 'Toutes' },
  { value: 'en_service', label: 'En service' },
  { value: 'hors_service', label: 'Hors service' },
  { value: 'archive', label: 'Archivées' },
]

const columns = computed<ListColumn[]>(() => [
  { key: 'id', label: 'ID', width: 110 },
  { key: 'plaque', label: 'Plaque', sortable: true, width: 120 },
  { key: 'type', label: 'Type', sortable: true, width: 130 },
  { key: 'capacite', label: 'Capacité', width: 120 },
  { key: 'tracteur', label: 'Tracteur attelé', width: 130 },
  { key: 'statut', label: 'Statut', sortable: true, width: 130 },
])

watch([activeScope, filterType, searchQuery, pageSize], () => { page.value = 1 })
function resetFilters() { activeScope.value = ''; filterType.value = ''; searchQuery.value = ''; page.value = 1 }

const filtered = computed(() => {
  let rows = store.remorques.filter(r => {
    if (activeScope.value && r.statutAdmin !== activeScope.value) return false
    if (filterType.value && r.type !== filterType.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!r.plaque.toLowerCase().includes(q) && !(r.vin ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })
  return rows
})

const totalCount = computed(() => filtered.value.length)
const pageItems  = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

function statutLabel(s?: string) { return ({ en_service: 'En service', hors_service: 'Hors service', archive: 'Archivée' } as any)[s ?? ''] ?? s ?? '-' }
function statutClass(s?: string) { return ({ en_service: 'bg-success-bg text-success', hors_service: 'bg-warning-bg text-warning', archive: 'bg-background text-muted-foreground border border-border' } as any)[s ?? ''] ?? '' }
function typeClass(type?: string) {
  return ({ Citerne: 'bg-primary/10 text-primary', Bâchée: 'bg-success-bg text-success', Plateau: 'bg-warning-bg text-warning', Frigorifique: 'bg-danger-bg text-danger', Autre: 'bg-background text-muted-foreground' } as any)[type ?? ''] ?? 'bg-background text-muted-foreground'
}
</script>
