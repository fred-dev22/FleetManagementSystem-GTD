<template>
  <ListPageLayout
    title="Véhicules"
    :subtitle="`${store.vehicules.length} véhicule(s) — tracteurs & remorques`"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} véhicule(s)`"
    search-placeholder="Rechercher par plaque, marque, modèle…"
    scope-label="Type :"
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
      <button :class="L.btnPrimary" @click="showForm = true">
        <Plus class="w-4 h-4" />
        Ajouter un véhicule
      </button>
    </template>

    <template #above-table>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5">
        <div v-for="k in kpis" :key="k.label" class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" :class="k.bg">
            <component :is="k.icon" class="w-4.5 h-4.5" :class="k.iconColor" />
          </div>
          <div>
            <p class="text-2xl font-bold leading-none">{{ k.value }}</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ k.label }}</p>
          </div>
        </div>
      </div>
    </template>

    <template #filters>
      <div>
        <label :class="L.fpFieldLabel">Statut</label>
        <select v-model="filterStatut" :class="L.fpSelect">
          <option value="">Tous</option>
          <option value="actif">Actif</option>
          <option value="affecte">Affecté</option>
          <option value="en_reparation">En réparation</option>
          <option value="hors_service">Hors service</option>
          <option value="vendu">Vendu</option>
          <option value="archive">Archivé</option>
        </select>
      </div>
      <div>
        <label :class="L.fpFieldLabel">Site</label>
        <select v-model="filterSite" :class="L.fpSelect">
          <option value="">Tous les sites</option>
          <option v-for="s in sites" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <button class="mt-auto py-[7px] bg-transparent border-0 text-xs text-muted-foreground cursor-pointer hover:text-primary" @click="resetFilters">
        Réinitialiser
      </button>
    </template>

    <!-- Colonnes -->
    <template #cell-plaque="{ item }">
      <button class="font-mono font-semibold text-foreground hover:text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer" @click="openCard(item.id)">
        {{ item.plaque }}
      </button>
    </template>

    <template #cell-typeVehicule="{ item }">
      <span :class="item.typeVehicule === 'tracteur' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'"
        class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">
        {{ item.typeVehicule }}
      </span>
    </template>

    <template #cell-marque="{ item }">
      <span class="font-medium text-foreground">{{ item.marque ?? '—' }}</span>
      <span v-if="item.modele" class="text-muted-foreground text-xs"> / {{ item.modele }}</span>
    </template>

    <template #cell-statutAdmin="{ item }">
      <span :class="statutClass(item.statutAdmin)" class="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
        {{ statutLabel(item.statutAdmin) }}
      </span>
    </template>

    <template #cell-lien="{ item }">
      <span v-if="item.vehiculeLiePlaque" class="font-mono text-xs text-primary">{{ item.vehiculeLiePlaque }}</span>
      <span v-else-if="item.chauffeurNom" class="text-xs text-gray-600">{{ item.chauffeurNom }}</span>
      <span v-else class="text-gray-300">—</span>
    </template>

    <template #cell-site="{ item }">
      <span class="text-xs text-gray-600">{{ item.siteAffectation ?? '—' }}</span>
    </template>

    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3">
        <div>
          <span :class="item.typeVehicule === 'tracteur' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'"
            class="text-xs font-medium px-2 py-0.5 rounded-full capitalize">{{ item.typeVehicule }}</span>
          <div class="font-mono font-semibold text-foreground mt-1.5">{{ item.plaque }}</div>
          <div class="text-xs text-muted-foreground">{{ item.marque }} {{ item.modele }}</div>
        </div>
        <div class="flex gap-2 flex-wrap">
          <span :class="statutClass(item.statutAdmin)" class="text-xs font-medium px-2 py-0.5 rounded-full">{{ statutLabel(item.statutAdmin) }}</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div v-if="item.typeVehicule === 'tracteur'">
            <div class="text-muted-foreground text-[11px]">Chauffeur</div>{{ item.chauffeurNom ?? '—' }}
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">{{ item.typeVehicule === 'tracteur' ? 'Remorque' : 'Tracteur' }}</div>
            <span class="font-mono">{{ item.vehiculeLiePlaque ?? '—' }}</span>
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Site</div>{{ item.siteAffectation ?? '—' }}
          </div>
          <div v-if="item.typeVehicule === 'tracteur' && item.kilometrage != null">
            <div class="text-muted-foreground text-[11px]">Kilométrage</div>{{ item.kilometrage.toLocaleString('fr-FR') }} km
          </div>
        </div>
        <button :class="L.btnPrimary" class="w-full justify-center" @click="openCard(item.id)">Ouvrir la fiche</button>
      </div>
    </template>

    <template #empty>
      <Truck class="w-8 h-8" />
      <p class="text-sm">Aucun véhicule trouvé</p>
    </template>

    <VehiculeCard v-if="selectedId !== null" :vehicule="store.getById(selectedId)!" @close="selectedId = null" />
    <VehiculeFormModal v-if="showForm" @close="showForm = false" />
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, Truck, AlertTriangle, Wrench } from 'lucide-vue-next'
import { ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import VehiculeCard from '../../components/fleet/VehiculeCard.vue'
import VehiculeFormModal from '../../components/fleet/VehiculeFormModal.vue'
import { useVehiculesStore } from '../../stores/vehicules'
import type { Vehicule, StatutAdminVehicule } from '../../types'
import * as L from '../../lib/listClasses'

const store    = useVehiculesStore()
const showForm = ref(false)
const selectedId = ref<string | null>(null)

const searchQuery = ref('')
const activeScope = ref('')
const filterStatut = ref('')
const filterSite  = ref('')
const sortKey  = ref('')
const sortDir  = ref<'asc' | 'desc'>('asc')
const page     = ref(1)
const pageSize = ref(15)

const scopeOptions = [
  { value: '',         label: 'Tous les véhicules' },
  { value: 'tracteur', label: 'Tracteurs' },
  { value: 'remorque', label: 'Remorques' },
]

const sites = computed(() => {
  const s = new Set(store.vehicules.map(v => v.siteAffectation).filter(Boolean) as string[])
  return [...s].sort()
})

const kpis = computed(() => [
  { label: 'Total',        value: store.vehicules.length,                                                                                      icon: Truck,         bg: 'bg-primary/10',    iconColor: 'text-primary'   },
  { label: 'Tracteurs',   value: store.tracteurs.length,                                                                                       icon: Truck,         bg: 'bg-blue-50',       iconColor: 'text-blue-600'  },
  { label: 'Remorques',   value: store.remorques.length,                                                                                       icon: Truck,         bg: 'bg-purple-50',     iconColor: 'text-purple-600' },
  { label: 'Immobilisés', value: store.vehicules.filter(v => v.statutAdmin === 'hors_service' || v.statutAdmin === 'en_reparation').length,     icon: AlertTriangle, bg: 'bg-danger-bg',     iconColor: 'text-danger'    },
])

const columns = computed<ListColumn[]>(() => [
  { key: 'plaque',       label: 'Plaque',          sortable: true, width: 130 },
  { key: 'typeVehicule', label: 'Type',             width: 110 },
  { key: 'marque',       label: 'Marque / Modèle', width: 200 },
  { key: 'statutAdmin',  label: 'Statut',          sortable: true, width: 140 },
  { key: 'lien',         label: 'Lié à',           width: 160 },
  { key: 'site',         label: 'Site',             width: 150 },
])

watch([activeScope, filterStatut, filterSite, searchQuery, pageSize], () => { page.value = 1 })

function resetFilters() {
  activeScope.value = ''
  filterStatut.value = ''
  filterSite.value = ''
  searchQuery.value = ''
  page.value = 1
}

const filtered = computed(() => {
  let rows = store.vehicules.filter(v => {
    if (activeScope.value  && v.typeVehicule !== activeScope.value)   return false
    if (filterStatut.value && v.statutAdmin  !== filterStatut.value)  return false
    if (filterSite.value   && v.siteAffectation !== filterSite.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!`${v.plaque} ${v.marque ?? ''} ${v.modele ?? ''}`.toLowerCase().includes(q)) return false
    }
    return true
  })
  if (sortKey.value) {
    const k = sortKey.value as keyof Vehicule
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

function openCard(id: string) { selectedId.value = id }

const STATUT_MAP: Record<StatutAdminVehicule, { label: string; cls: string }> = {
  actif:         { label: 'Actif',          cls: 'bg-success-bg text-success' },
  affecte:       { label: 'Affecté',        cls: 'bg-primary/10 text-primary' },
  en_reparation: { label: 'En réparation',  cls: 'bg-warning-bg text-warning' },
  hors_service:  { label: 'Hors service',   cls: 'bg-danger-bg text-danger'   },
  vendu:         { label: 'Vendu',          cls: 'bg-gray-100 text-gray-500'  },
  archive:       { label: 'Archivé',        cls: 'bg-gray-100 text-gray-400'  },
}
const statutLabel = (s: StatutAdminVehicule) => STATUT_MAP[s]?.label ?? s
const statutClass = (s: StatutAdminVehicule) => STATUT_MAP[s]?.cls ?? ''
</script>
