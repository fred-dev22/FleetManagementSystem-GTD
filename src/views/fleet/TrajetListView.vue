<template>
  <ListPageLayout
    title="Trajets de référence"
    subtitle="Séquences de sites réutilisables, affectées aux véhicules avant le départ"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} trajet(s)`"
    search-placeholder="Rechercher par code, libellé ou client…"
    scope-label="Statut :"
    :scope-options="scopeOptions"
    v-model:scope="activeScope"
    v-model:search-query="searchQuery"
    v-model:sort-key="sortKey"
    v-model:sort-dir="sortDir"
    v-model:page="page"
    v-model:page-size="pageSize"
    @reset-filters="resetFilters"
    @open-card="(t) => openCard(t.id)"
  >
    <template #header-actions>
      <button :class="L.btnPrimary" @click="router.push({ name: 'fleet-configuration' })">
        <Plus class="w-4 h-4" /> Nouveau trajet
      </button>
    </template>

    <template #above-table>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5">
        <div v-for="k in kpis" :key="k.label"
          class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" :class="k.bg">
            <component :is="k.icon" class="w-4.5 h-4.5" :class="k.iconColor" />
          </div>
          <div class="min-w-0">
            <p class="text-xl font-bold leading-none truncate">{{ k.value }}</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ k.label }}</p>
          </div>
        </div>
      </div>
    </template>

    <template #filters>
      <div>
        <label :class="L.fpFieldLabel">Client</label>
        <select v-model="filterClient" :class="L.fpSelect">
          <option value="">Tous</option>
          <option v-for="c in clients" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <button class="mt-auto py-[7px] bg-transparent border-0 text-xs text-muted-foreground cursor-pointer hover:text-primary"
        @click="resetFilters">
        Réinitialiser
      </button>
    </template>

    <template #cell-code="{ item }">
      <span class="text-[11px] font-bold px-[7px] py-0.5 rounded bg-primary/10 text-primary tracking-[0.04em] font-mono">
        {{ item.code }}
      </span>
    </template>

    <template #cell-libelle="{ item }">
      <button class="font-medium text-foreground hover:text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer text-left"
        @click="openCard(item.id)">
        {{ item.libelle }}
      </button>
      <div v-if="item.clientNom" class="text-[11px] text-muted-foreground">{{ item.clientNom }}</div>
    </template>

    <template #cell-sites="{ item }">
      <span class="text-xs font-semibold">{{ item.etapes.length }}</span>
      <div class="text-[11px] text-muted-foreground">
        {{ compter(item, 'livraison') }} livraison(s)
      </div>
    </template>

    <template #cell-composition="{ item }">
      <div class="flex items-center gap-1">
        <span v-for="e in item.etapes" :key="e.id"
          class="w-2 h-2 rounded-full shrink-0"
          :style="{ backgroundColor: COULEUR_ROLE[e.role] }"
          :title="`${e.ordre}. ${e.siteNom} - ${LIB_ROLE_ETAPE[e.role]}`" />
      </div>
    </template>

    <template #cell-distance="{ item }">
      <span class="text-xs">{{ item.distanceEstimeeKm }} km</span>
      <div class="text-[11px] text-muted-foreground">{{ fmtDuree(item.dureeEstimeeMin) }}</div>
    </template>

    <template #cell-statut="{ item }">
      <span class="text-xs font-medium px-2 py-0.5 rounded-full"
        :class="item.statut === 'actif' ? 'bg-success-bg text-success' : 'bg-gray-100 text-gray-400'">
        {{ item.statut === 'actif' ? 'Actif' : 'Archivé' }}
      </span>
      <div v-if="item.recurrent" class="text-[11px] text-muted-foreground">réutilisable</div>
    </template>

    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3">
        <div>
          <span class="text-[11px] font-bold px-[7px] py-0.5 rounded bg-primary/10 text-primary font-mono">
            {{ item.code }}
          </span>
          <div class="font-medium text-foreground mt-1.5">{{ item.libelle }}</div>
          <div class="text-xs text-muted-foreground">{{ item.clientNom ?? 'Tous clients' }}</div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <div><div class="text-muted-foreground text-[11px]">Sites</div>{{ item.etapes.length }}</div>
          <div><div class="text-muted-foreground text-[11px]">Distance</div>{{ item.distanceEstimeeKm }} km</div>
          <div><div class="text-muted-foreground text-[11px]">Durée</div>{{ fmtDuree(item.dureeEstimeeMin) }}</div>
          <div><div class="text-muted-foreground text-[11px]">Livraisons</div>{{ compter(item, 'livraison') }}</div>
        </div>

        <div>
          <div class="text-muted-foreground text-[11px] mb-1.5">Séquence</div>
          <ol class="relative pl-4 border-l-2 border-border flex flex-col gap-1.5">
            <li v-for="e in item.etapes" :key="e.id" class="relative">
              <span class="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-card"
                :style="{ backgroundColor: COULEUR_ROLE[e.role] }" />
              <p class="text-[11px] font-medium text-foreground leading-tight">{{ e.siteNom }}</p>
              <p class="text-[10px] text-muted-foreground">{{ LIB_ROLE_ETAPE[e.role] }}</p>
            </li>
          </ol>
        </div>

        <button :class="L.btnPrimary" class="w-full justify-center" @click="openCard(item.id)">
          Voir sur la carte
        </button>
      </div>
    </template>

    <template #empty>
      <Route class="w-8 h-8" />
      <p class="text-sm">Aucun trajet de référence</p>
    </template>

    <!-- Fiche : même coquille que les autres fiches du module -->
    <TrajetCard
      v-if="selectedId"
      :trajet="store.getById(selectedId)!"
      @close="selectedId = null"
      @navigate="id => (selectedId = id)"
    />
  </ListPageLayout>
</template>

<script setup lang="ts">
/**
 * Trajets de référence.
 *
 * Un trajet est une séquence de sites ordonnés, affectée à un véhicule avant
 * son départ. C'est un référentiel, au même titre que les sites : il mérite
 * donc sa propre entrée de menu plutôt que d'être enfoui dans Configuration.
 */
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Route, Plus, MapPinned, Package, Truck } from 'lucide-vue-next'
import { ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import TrajetCard from '../../components/fleet/TrajetCard.vue'
import { useTrajetsStore } from '../../stores/trajets'
import { LIB_ROLE_ETAPE } from '../../types/fms'
import type { Trajet, RoleEtape } from '../../types/fms'
import { fmtDuree } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'

const router = useRouter()
const store  = useTrajetsStore()

const searchQuery  = ref('')
const activeScope  = ref('')
const filterClient = ref('')
const sortKey      = ref('')
const sortDir      = ref<'asc' | 'desc'>('asc')
const page         = ref(1)
const pageSize     = ref(15)
const selectedId   = ref<string | null>(null)

/** Même code couleur que le sélecteur de trajet et la fiche voyage. */
const COULEUR_ROLE: Record<RoleEtape, string> = {
  depart:     '#0B4480',
  chargement: '#0072C5',
  livraison:  '#16a34a',
  controle:   '#6b7280',
  repos:      '#ca8a04',
  arrivee:    '#0B4480',
}

const scopeOptions = [
  { value: '',        label: 'Tous les trajets' },
  { value: 'actif',   label: 'Actifs' },
  { value: 'archive', label: 'Archivés' },
]

const compter = (t: Trajet, role: RoleEtape) =>
  t.etapes.filter(e => e.role === role).length

const clients = computed(() =>
  [...new Set(store.trajets.map(t => t.clientNom).filter(Boolean))].sort() as string[])

const kpis = computed(() => [
  { label: 'Trajets actifs',    value: store.actifs.length,     icon: Route,     bg: 'bg-primary/10', iconColor: 'text-primary' },
  { label: 'Réutilisables',     value: store.recurrents.length, icon: Package,   bg: 'bg-info-bg',    iconColor: 'text-info'    },
  { label: 'Sites desservis',   value: sitesDistincts.value,    icon: MapPinned, bg: 'bg-success-bg', iconColor: 'text-success' },
  { label: 'Distance moyenne',  value: distanceMoyenne.value + ' km', icon: Truck, bg: 'bg-warning-bg', iconColor: 'text-warning' },
])

const sitesDistincts = computed(() =>
  new Set(store.trajets.flatMap(t => t.etapes.map(e => e.siteId))).size)

const distanceMoyenne = computed(() => {
  const a = store.actifs
  return a.length ? Math.round(a.reduce((s, t) => s + t.distanceEstimeeKm, 0) / a.length) : 0
})

const columns = computed<ListColumn[]>(() => [
  { key: 'code',        label: 'Code',        sortable: true, width: 120 },
  { key: 'libelle',     label: 'Trajet',      sortable: true, width: 280 },
  { key: 'sites',       label: 'Sites',       width: 120 },
  { key: 'composition', label: 'Composition', width: 140 },
  { key: 'distance',    label: 'Distance',    sortable: true, width: 130 },
  { key: 'statut',      label: 'Statut',      width: 120 },
])

watch([activeScope, filterClient, searchQuery, pageSize], () => { page.value = 1 })

function resetFilters() {
  activeScope.value = ''
  filterClient.value = ''
  searchQuery.value = ''
  page.value = 1
}

const filtered = computed(() => {
  let rows = store.trajets.filter(t => {
    if (activeScope.value  && t.statut !== activeScope.value)     return false
    if (filterClient.value && t.clientNom !== filterClient.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!`${t.code} ${t.libelle} ${t.clientNom ?? ''}`.toLowerCase().includes(q)) return false
    }
    return true
  })

  if (sortKey.value) {
    const k = sortKey.value as keyof Trajet
    rows = [...rows].sort((a, b) => {
      const cmp = String(a[k] ?? '').localeCompare(String(b[k] ?? ''), 'fr', { numeric: true })
      return sortDir.value === 'asc' ? cmp : -cmp
    })
  }
  return rows
})

const totalCount = computed(() => filtered.value.length)

const pageItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

function openCard(id: string) { selectedId.value = id }
</script>
