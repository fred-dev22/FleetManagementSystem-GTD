<template>
  <ListPageLayout
    title="Autorisations de départ"
    :subtitle="`Contrôle des départs de 5 h à 6 h · ${store.autorisationsEnAttente.length} en attente de décision`"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} autorisation(s)`"
    search-placeholder="Référence, plaque, chauffeur…"
    scope-label="Statut :"
    :scope-options="scopeOptions"
    v-model:scope="activeScope"
    v-model:search-query="searchQuery"
    v-model:sort-key="sortKey"
    v-model:sort-dir="sortDir"
    v-model:page="page"
    v-model:page-size="pageSize"
    @reset-filters="resetFilters"
    @open-card="(a: AutorisationDepart) => openCard(a.id)"
  >
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

    <template #cell-reference="{ item }">
      <button class="font-mono font-semibold text-foreground hover:text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer text-left"
        @click="openCard(item.id)">
        {{ item.reference }}
      </button>
      <div v-if="item.voyageRef" class="text-[11px] text-muted-foreground font-mono">{{ item.voyageRef }}</div>
    </template>

    <template #cell-vehicule="{ item }">
      <span class="font-mono text-xs">{{ item.vehiculePlaque }}</span>
    </template>

    <template #cell-chauffeur="{ item }">
      <span class="text-xs">{{ item.chauffeurNom }}</span>
    </template>

    <!-- Les quatre contrôles, en pastilles -->
    <template #cell-controles="{ item }">
      <div class="flex items-center gap-1">
        <span v-for="c in item.controles" :key="c.controle"
          class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
          :class="c.conforme ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'"
          :title="`${LIB_CONTROLE_DEPART[c.controle]} - ${c.conforme ? 'conforme' : 'non conforme'}`">
          {{ c.conforme ? '✓' : '✗' }}
        </span>
      </div>
      <div class="text-[11px] text-muted-foreground mt-0.5">
        {{ item.controles.filter((c: ResultatControleDepart) => c.conforme).length }}/4 conformes
      </div>
    </template>

    <template #cell-decision="{ item }">
      <span v-if="!item.decideLe" class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-warning-bg text-warning">
        En attente
      </span>
      <span v-else-if="item.accordee" class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-success-bg text-success">
        Accordée
      </span>
      <span v-else class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-danger-bg text-danger">
        Refusée
      </span>
      <div v-if="item.decidePar" class="text-[11px] text-muted-foreground">{{ item.decidePar }}</div>
    </template>

    <template #cell-demandee="{ item }">
      <span class="text-xs">{{ fmtDateTime(item.demandeeLe) }}</span>
    </template>

    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3">
        <div>
          <span class="text-[11px] font-medium px-2 py-0.5 rounded-full"
            :class="!item.decideLe ? 'bg-warning-bg text-warning'
                  : item.accordee ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'">
            {{ !item.decideLe ? 'En attente' : item.accordee ? 'Accordée' : 'Refusée' }}
          </span>
          <div class="font-mono font-semibold text-foreground mt-1.5">{{ item.reference }}</div>
          <div class="text-xs text-muted-foreground">{{ item.vehiculePlaque }} · {{ item.chauffeurNom }}</div>
        </div>

        <div class="flex flex-col gap-1.5">
          <div v-for="c in item.controles" :key="c.controle"
            class="flex items-start gap-2 text-[11px]">
            <component :is="c.conforme ? CheckCircle2 : XCircle" class="w-3.5 h-3.5 shrink-0 mt-px"
              :class="c.conforme ? 'text-success' : 'text-danger'" />
            <div class="min-w-0">
              <span :class="c.conforme ? 'text-foreground' : 'text-danger font-medium'">
                {{ LIB_CONTROLE_DEPART[c.controle] }}
              </span>
              <div v-if="c.detail" class="text-muted-foreground">{{ c.detail }}</div>
            </div>
          </div>
        </div>

        <div v-if="item.motifRefus" class="bg-danger-bg text-danger rounded-md px-2.5 py-2 text-[11px] leading-snug">
          {{ item.motifRefus }}
        </div>

        <button :class="L.btnPrimary" class="w-full justify-center" @click="openCard(item.id)">
          Ouvrir la fiche
        </button>
      </div>
    </template>

    <template #empty>
      <ShieldCheck class="w-8 h-8" />
      <p class="text-sm">Aucune autorisation</p>
    </template>

    <AutorisationCard
      v-if="selectedId !== null"
      :autorisation="store.autorisations.find(a => a.id === selectedId)!"
      @close="selectedId = null"
      @navigate="(id: string) => (selectedId = id)"
    />
  </ListPageLayout>
</template>

<script setup lang="ts">
/**
 * US 2.4.1 - Autorisation de départ.
 *
 * Le Control Room contrôle chaque départ entre 5 h et 6 h. L'autorisation
 * exige quatre validations simultanées ; aucun voyage ne peut être créé
 * sans elle.
 * Source : projet Control Room, phase 5 h – 6 h.
 */
import { ref, computed, watch } from 'vue'
import { ShieldCheck, CheckCircle2, XCircle, Clock, ThumbsUp, ThumbsDown } from 'lucide-vue-next'
import { ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import AutorisationCard from '../../components/fleet/AutorisationCard.vue'
import { useFlotteStore } from '../../stores/flotte'
import { LIB_CONTROLE_DEPART } from '../../types/flotte'
import type { AutorisationDepart, ResultatControleDepart } from '../../types/flotte'
import { fmtDateTime } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'

const store = useFlotteStore()

const searchQuery = ref('')
const activeScope = ref('')
const sortKey     = ref('')
const sortDir     = ref<'asc' | 'desc'>('desc')
const page        = ref(1)
const pageSize    = ref(15)
const selectedId  = ref<string | null>(null)

const scopeOptions = [
  { value: '',         label: 'Toutes' },
  { value: 'attente',  label: 'En attente de décision' },
  { value: 'accordee', label: 'Accordées' },
  { value: 'refusee',  label: 'Refusées' },
]

const kpis = computed(() => [
  { label: 'Total',        value: String(store.autorisations.length),
    icon: ShieldCheck, bg: 'bg-primary/10', iconColor: 'text-primary' },
  { label: 'En attente',   value: String(store.autorisationsEnAttente.length),
    icon: Clock, bg: 'bg-warning-bg', iconColor: 'text-warning' },
  { label: 'Accordées',    value: String(store.autorisations.filter(a => a.decideLe && a.accordee).length),
    icon: ThumbsUp, bg: 'bg-success-bg', iconColor: 'text-success' },
  { label: 'Refusées',     value: String(store.autorisations.filter(a => a.decideLe && !a.accordee).length),
    icon: ThumbsDown, bg: 'bg-danger-bg', iconColor: 'text-danger' },
])

const columns = computed<ListColumn[]>(() => [
  { key: 'reference', label: 'Autorisation', sortable: true, width: 170 },
  { key: 'vehicule',  label: 'Véhicule',     sortable: true, width: 130 },
  { key: 'chauffeur', label: 'Chauffeur',    width: 190 },
  { key: 'controles', label: 'Contrôles',    width: 165 },
  { key: 'decision',  label: 'Décision',     width: 150 },
  { key: 'demandee',  label: 'Demandée le',  sortable: true, width: 155 },
])

watch([activeScope, searchQuery, pageSize], () => { page.value = 1 })

function resetFilters() {
  activeScope.value = ''
  searchQuery.value = ''
  page.value = 1
}

const filtered = computed(() =>
  store.autorisations
    .filter(a => {
      if (activeScope.value === 'attente'  && a.decideLe) return false
      if (activeScope.value === 'accordee' && !(a.decideLe && a.accordee)) return false
      if (activeScope.value === 'refusee'  && !(a.decideLe && !a.accordee)) return false
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        if (!`${a.reference} ${a.vehiculePlaque} ${a.chauffeurNom}`.toLowerCase().includes(q)) return false
      }
      return true
    })
    .sort((a, b) => +new Date(b.demandeeLe) - +new Date(a.demandeeLe)))

const totalCount = computed(() => filtered.value.length)

const pageItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

function openCard(id: string) { selectedId.value = id }
</script>
