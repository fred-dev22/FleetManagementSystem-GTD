<template>
  <ListPageLayout
    title="Sites & Géofences"
    subtitle="Référentiel des sites géographiques GTD"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} site(s)`"
    search-placeholder="Rechercher par code ou nom…"
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
        <Plus class="w-4 h-4" /> Nouveau site
      </button>
    </template>

    <template #above-table>
      <div class="grid grid-cols-3 gap-2.5 mb-3.5">
        <div :class="kpiItem"><div :class="kpiIcon" class="bg-primary/10"><MapPinned class="w-[18px] h-[18px] text-primary" /></div><div><div :class="kpiVal">{{ store.sites.length }}</div><div :class="kpiLbl">Total sites</div></div></div>
        <div :class="kpiItem"><div :class="kpiIcon" class="bg-success-bg"><Check class="w-[18px] h-[18px] text-success" /></div><div><div :class="kpiVal">{{ store.sites.filter((s: any) => s.actif).length }}</div><div :class="kpiLbl">Actifs</div></div></div>
        <div :class="kpiItem"><div :class="kpiIcon" class="bg-primary/10"><MapPinned class="w-[18px] h-[18px] text-primary" /></div><div><div :class="kpiVal">{{ uniqueTypes }}</div><div :class="kpiLbl">Types</div></div></div>
      </div>
    </template>

    <template #filters>
      <div :class="L.fpField">
        <label :class="L.fpFieldLabel">Type</label>
        <select v-model="filterType" :class="L.fpSelect">
          <option value="">Tous</option>
          <option value="Garage">Garage</option>
          <option value="Dépôt chargement">Dépôt chargement</option>
          <option value="Dépôt déchargement">Dépôt déchargement</option>
          <option value="Zone à risque">Zone à risque</option>
          <option value="Point de contrôle">Point de contrôle</option>
        </select>
      </div>
      <button class="mt-auto py-[7px] bg-transparent border-0 text-xs text-muted-foreground cursor-pointer text-left hover:text-primary" @click="resetFilters">
        Réinitialiser
      </button>
    </template>

    <template #cell-code="{ item }">
      <span class="text-[11px] font-bold px-[7px] py-0.5 rounded bg-primary/10 text-primary tracking-[0.04em] font-mono">{{ item.code }}</span>
    </template>
    <template #cell-nom="{ item }">
      <button class="font-medium text-foreground hover:text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer text-left" @click="openCard(item.id)">
        {{ item.nom }}
      </button>
    </template>
    <template #cell-ville="{ item }">
      <span class="text-muted-foreground text-xs">{{ item.ville }}</span>
    </template>
    <template #cell-type="{ item }">
      <span :class="['text-[11px] font-medium px-2 py-0.5 rounded-full', typeBadge(item.type)]">{{ item.type }}</span>
    </template>
    <template #cell-statut="{ item }">
      <span :class="['text-[11px] font-medium px-2 py-0.5 rounded-full', item.actif ? 'bg-success-bg text-success' : 'bg-background text-muted-foreground border border-border']">
        {{ item.actif ? 'Actif' : 'Inactif' }}
      </span>
    </template>

    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3">
        <div>
          <span class="text-[11px] font-bold px-[7px] py-0.5 rounded bg-primary/10 text-primary tracking-[0.04em] font-mono">{{ item.code }}</span>
          <div class="text-sm font-semibold text-foreground mt-1.5">{{ item.nom }}</div>
          <div class="text-xs text-muted-foreground">{{ item.ville }}{{ item.region ? ` · ${item.region}` : '' }}</div>
        </div>
        <div class="flex gap-2 flex-wrap">
          <span :class="['text-[11px] font-medium px-2 py-0.5 rounded-full', typeBadge(item.type)]">{{ item.type }}</span>
          <span :class="['text-[11px] font-medium px-2 py-0.5 rounded-full', item.actif ? 'bg-success-bg text-success' : 'bg-background text-muted-foreground border border-border']">
            {{ item.actif ? 'Actif' : 'Inactif' }}
          </span>
        </div>
        <button :class="L.btnPrimary" class="w-full justify-center" @click="openCard(item.id)">Ouvrir la fiche</button>
        <button :class="L.btnOutline" class="w-full justify-center" @click="openEdit(item.id)">Modifier</button>
      </div>
    </template>

    <template #empty>
      <MapPinned class="w-8 h-8" />
      <p class="text-[13px]">Aucun site trouvé</p>
    </template>

    <SiteCard v-if="openCardId !== null" :sites="store.sites" :site-id="openCardId" @close="openCardId = null" />
    <SiteFormModal v-model="showCreate" :edit-id="editId" @saved="editId = undefined" />
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, MapPinned, Check } from 'lucide-vue-next'
import { ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import SiteCard from '../../components/fleet/SiteCard.vue'
import SiteFormModal from '../../components/fleet/SiteFormModal.vue'
import * as L from '../../lib/listClasses'
import { useSitesStore } from '../../stores/sites'

const store = useSitesStore()

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
  { value: '', label: 'Tous' },
  { value: 'actif', label: 'Actifs' },
  { value: 'inactif', label: 'Inactifs' },
]

const columns = computed<ListColumn[]>(() => [
  { key: 'code', label: 'Code', sortable: true, width: 110 },
  { key: 'nom', label: 'Nom', sortable: true, width: 220 },
  { key: 'ville', label: 'Ville', width: 150 },
  { key: 'type', label: 'Type', sortable: true, width: 170 },
  { key: 'statut', label: 'Statut', sortable: true, width: 110 },
])

const uniqueTypes = computed(() => new Set(store.sites.map((s: any) => s.type)).size)

watch([activeScope, filterType, searchQuery, pageSize], () => { page.value = 1 })
function resetFilters() { activeScope.value = ''; filterType.value = ''; searchQuery.value = ''; page.value = 1 }

const filtered = computed(() => {
  return store.sites.filter((s: any) => {
    if (activeScope.value === 'actif' && !s.actif) return false
    if (activeScope.value === 'inactif' && s.actif) return false
    if (filterType.value && s.type !== filterType.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!s.code.toLowerCase().includes(q) && !s.nom.toLowerCase().includes(q)) return false
    }
    return true
  })
})

const totalCount = computed(() => filtered.value.length)
const pageItems  = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

function typeBadge(type: string) {
  const m: Record<string, string> = {
    Garage: 'bg-primary/10 text-primary', 'Dépôt chargement': 'bg-success-bg text-success',
    'Dépôt déchargement': 'bg-warning-bg text-warning', 'Zone à risque': 'bg-danger-bg text-danger',
    'Point de contrôle': 'bg-primary/10 text-primary',
  }
  return m[type] ?? 'bg-background text-muted-foreground'
}
</script>
