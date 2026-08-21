<template>
  <ListPageLayout
    title="Conformité des itinéraires"
    :subtitle="`${store.aQualifier.length} écart(s) en attente de qualification`"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} écart(s)`"
    search-placeholder="Rechercher par voyage, plaque, chauffeur…"
    scope-label="Nature :"
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
    <template #above-table>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5">
        <div v-for="k in kpis" :key="k.label"
          class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
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
        <label :class="L.fpFieldLabel">Type d’écart</label>
        <select v-model="filterType" :class="L.fpSelect">
          <option value="">Tous</option>
          <option v-for="(lib, k) in LIB_TYPE_ECART" :key="k" :value="k">{{ lib }}</option>
        </select>
      </div>
      <div>
        <label :class="L.fpFieldLabel">Gravité</label>
        <SearchableDropdown
          v-model="filterGravite"
          :items="optfilterGravite"
          placeholder="Toutes"
          compact
        />
      </div>
      <button class="mt-auto py-[7px] bg-transparent border-0 text-xs text-muted-foreground cursor-pointer hover:text-primary"
        @click="resetFilters">Réinitialiser</button>
    </template>

    <template #cell-id="{ item }">
      <button class="font-mono font-semibold text-foreground hover:text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer"
        @click="openCard(item.id)">{{ item.id }}</button>
      <div class="text-[11px] text-muted-foreground font-mono">{{ item.voyageRef }}</div>
    </template>

    <template #cell-type="{ item }">
      <span class="text-xs text-foreground">{{ LIB_TYPE_ECART[item.type] }}</span>
      <div class="text-[11px] text-muted-foreground">{{ item.lieu ?? '-' }}</div>
    </template>

    <template #cell-gravite="{ item }">
      <span :class="LIB_GRAVITE[item.gravite].cls" class="text-xs font-medium px-2 py-0.5 rounded-full">
        {{ LIB_GRAVITE[item.gravite].label }}
      </span>
    </template>

    <template #cell-nature="{ item }">
      <span :class="LIB_NATURE[item.nature].cls" class="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
        {{ LIB_NATURE[item.nature].label }}
      </span>
    </template>

    <template #cell-chauffeur="{ item }">
      <button v-if="item.chauffeurId"
        class="text-xs text-foreground hover:text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer text-left"
        title="Ouvrir le tableau de bord du conducteur"
        @click.stop="voirConducteur(item.chauffeurId)">
        {{ item.chauffeurNom }}
      </button>
      <span v-else class="text-xs">{{ item.chauffeurNom ?? '-' }}</span>
      <div class="text-[11px] text-muted-foreground font-mono">{{ item.vehiculePlaque }}</div>
    </template>

    <template #cell-mesure="{ item }">
      <span class="text-xs">{{ fmtDuree(item.dureeMin) }}</span>
      <div v-if="item.ecartLateralMaxM" class="text-[11px] text-muted-foreground">
        écart {{ (item.ecartLateralMaxM / 1000).toFixed(1) }} km
      </div>
    </template>

    <template #cell-detecte="{ item }">
      <span class="text-xs">{{ fmtDateTime(item.detecteLe) }}</span>
    </template>

    <template #row-actions="{ item }">
      <button v-if="item && item.nature === 'a_qualifier'" :class="L.actApprove" @click="openCard(item.id)">
        <Gavel class="w-3 h-3" /> Qualifier
      </button>
      <button v-else-if="item" :class="L.actView" @click="openCard(item.id)">
        <Eye class="w-3 h-3" /> Consulter
      </button>
    </template>

    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3">
        <div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <span :class="LIB_GRAVITE[item.gravite].cls" class="text-xs font-medium px-2 py-0.5 rounded-full">
              {{ LIB_GRAVITE[item.gravite].label }}
            </span>
            <span :class="LIB_NATURE[item.nature].cls" class="text-xs font-medium px-2 py-0.5 rounded-full">
              {{ LIB_NATURE[item.nature].label }}
            </span>
          </div>
          <div class="font-mono font-semibold text-foreground mt-1.5">{{ item.id }}</div>
          <div class="text-xs text-muted-foreground">{{ LIB_TYPE_ECART[item.type] }}</div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div class="text-muted-foreground text-[11px]">Voyage</div>
            <span class="font-mono">{{ item.voyageRef }}</span>
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Véhicule</div>
            <span class="font-mono">{{ item.vehiculePlaque }}</span>
          </div>
          <div class="col-span-2">
            <div class="text-muted-foreground text-[11px]">Chauffeur</div>
            <button v-if="item.chauffeurId"
              class="text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer text-left"
              @click="voirConducteur(item.chauffeurId)">
              {{ item.chauffeurNom }}
            </button>
            <span v-else>{{ item.chauffeurNom ?? '-' }}</span>
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Durée</div>{{ fmtDuree(item.dureeMin) }}
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Détecté le</div>{{ fmtDate(item.detecteLe) }}
          </div>
          <div v-if="item.lieu" class="col-span-2">
            <div class="text-muted-foreground text-[11px]">Lieu</div>{{ item.lieu }}
          </div>
        </div>

        <div v-if="item.nature === 'a_qualifier'"
          class="bg-warning-bg text-warning rounded-md px-2.5 py-2 text-[11px] leading-snug">
          Écart en attente de qualification. Tant qu'un responsable ne l'a pas qualifié,
          il n'a aucune conséquence pour le conducteur.
        </div>

        <button :class="L.btnPrimary" class="w-full justify-center" @click="openCard(item.id)">
          Ouvrir la fiche
        </button>
      </div>
    </template>

    <template #empty>
      <ShieldCheck class="w-8 h-8" />
      <p class="text-sm">Aucun écart - tous les voyages sont conformes</p>
    </template>

    <EcartCard
      v-if="selectedId !== null"
      :ecart="store.getById(selectedId)!"
      @close="selectedId = null"
      @navigate="(id: string) => (selectedId = id)"
      @ouvrir-voyage="(id: string) => router.push({ name: 'fleet-voyage-detail', params: { id } })"
      @voir-conducteur="voirConducteur"
    />
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import SearchableDropdown from '../../components/ui/SearchableDropdown.vue'
import type { DropdownItem } from '../../components/ui/SearchableDropdown.vue'
import { useRouter } from 'vue-router'
import { AlertTriangle, ShieldCheck, Gavel, Eye, Ban, Clock } from 'lucide-vue-next'
import { ListPageLayout } from '../../components'
import EcartCard from '../../components/fleet/EcartCard.vue'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import { useEcartsStore, LIB_TYPE_ECART, LIB_NATURE, LIB_GRAVITE } from '../../stores/ecarts'
import { useVoyagesStore } from '../../stores/voyages'
import type { EcartItineraire } from '../../types/fms'
import { fmtDate, fmtDateTime, fmtDuree } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'

const router = useRouter()
const store  = useEcartsStore()
const voyages = useVoyagesStore()

const searchQuery   = ref('')
const selectedId    = ref<string | null>(null)
const activeScope   = ref('')
const filterType    = ref('')
const filterGravite = ref('')
const sortKey       = ref('')
const sortDir       = ref<'asc' | 'desc'>('desc')
const page          = ref(1)
const pageSize      = ref(15)

const scopeOptions = [
  { value: '',              label: 'Tous les écarts'   },
  { value: 'a_qualifier',   label: 'À qualifier'       },
  { value: 'non_justifiee', label: 'Infractions'       },
  { value: 'subie',         label: 'Déviations subies' },
  { value: 'autorisee',     label: 'Autorisées'        },
]

const kpis = computed(() => [
  { label: 'À qualifier',  value: store.aQualifier.length,  icon: Clock,         bg: 'bg-warning-bg', iconColor: 'text-warning' },
  { label: 'Infractions',  value: store.infractions.length, icon: Ban,           bg: 'bg-danger-bg',  iconColor: 'text-danger'  },
  { label: 'Critiques',    value: store.ecarts.filter(e => e.gravite === 'critique').length,
    icon: AlertTriangle, bg: 'bg-danger-bg',  iconColor: 'text-danger'  },
  { label: 'Conformité',   value: store.tauxConformite(voyages.voyages.length) + ' %',
    icon: ShieldCheck,   bg: 'bg-success-bg', iconColor: 'text-success' },
])

const columns = computed<ListColumn[]>(() => [
  { key: 'id',        label: 'Écart / Voyage', sortable: true, width: 150 },
  { key: 'type',      label: 'Type',           width: 220 },
  { key: 'gravite',   label: 'Gravité',        sortable: true, width: 100 },
  { key: 'nature',    label: 'Nature',         sortable: true, width: 160 },
  { key: 'chauffeur', label: 'Chauffeur',      width: 170 },
  { key: 'mesure',    label: 'Mesure',         width: 120 },
  { key: 'detecte',   label: 'Détecté le',     sortable: true, width: 140 },
])

watch([activeScope, filterType, filterGravite, searchQuery, pageSize], () => { page.value = 1 })

function resetFilters() {
  activeScope.value = ''
  filterType.value = ''
  filterGravite.value = ''
  searchQuery.value = ''
  page.value = 1
}

const filtered = computed(() => {
  let rows = store.ecarts.filter(e => {
    if (activeScope.value   && e.nature  !== activeScope.value)   return false
    if (filterType.value    && e.type    !== filterType.value)    return false
    if (filterGravite.value && e.gravite !== filterGravite.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!`${e.id} ${e.voyageRef} ${e.vehiculePlaque} ${e.chauffeurNom}`.toLowerCase().includes(q)) return false
    }
    return true
  })
  if (sortKey.value) {
    const k = sortKey.value as keyof EcartItineraire
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

/** Ouvre la fiche en superposition, comme les pages Véhicules et Carburant. */
function openCard(id: string) {
  selectedId.value = id
}

/** Ouvre le tableau de bord du conducteur - ses six onglets : itinéraires,
 *  carburant, documents, formations, planning, ressources humaines. */
function voirConducteur(chauffeurId: string) {
  router.push({ name: 'fleet-conducteur-detail', params: { id: chauffeurId } })
}

const optfilterGravite: DropdownItem[] = [
          { id: 'mineur', label: "Mineur" },
          { id: 'majeur', label: "Majeur" },
          { id: 'critique', label: "Critique" },
]
</script>
