<template>
  <ListPageLayout
    title="Immobilisations"
    :subtitle="`${store.indisposEnCours.length} véhicule(s) immobilisé(s) · ${totalJours} jour(s) perdus sur la période`"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} immobilisation(s)`"
    search-placeholder="Plaque, motif…"
    scope-label="Famille :"
    :scope-options="scopeOptions"
    v-model:scope="activeScope"
    v-model:search-query="searchQuery"
    v-model:sort-key="sortKey"
    v-model:sort-dir="sortDir"
    v-model:page="page"
    v-model:page-size="pageSize"
    @reset-filters="resetFilters"
  >
    <template #above-table>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5">
        <div v-for="k in kpis" :key="k.label"
          class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
          <p class="text-xl font-bold leading-none" :class="k.cls">{{ k.value }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ k.label }}</p>
        </div>
      </div>
    </template>

    <template #cell-vehicule="{ item }">
      <span class="font-mono font-semibold text-foreground">{{ item.vehiculePlaque }}</span>
    </template>

    <template #cell-code="{ item }">
      <span class="text-[11px] font-mono font-bold px-2 py-0.5 rounded" :class="CLS_FAMILLE[item.famille]">
        {{ item.code }}
      </span>
      <div class="text-[11px] text-muted-foreground">{{ libelleDuCode(item.code) }}</div>
    </template>

    <template #cell-famille="{ item }">
      <span class="text-xs">{{ LIB_FAMILLE_INDISPO[item.famille] }}</span>
    </template>

    <template #cell-periode="{ item }">
      <span class="text-xs">{{ fmtDate(item.debut) }}</span>
      <div class="text-[11px] text-muted-foreground">
        {{ item.fin ? `au ${fmtDate(item.fin)}` : 'en cours' }}
      </div>
    </template>

    <template #cell-duree="{ item }">
      <span class="text-sm font-bold" :class="store.dureeIndispo(item) > 3 ? 'text-danger' : 'text-foreground'">
        {{ store.dureeIndispo(item) }} j
      </span>
    </template>

    <template #cell-ot="{ item }">
      <span v-if="item.ordreTravailId" class="font-mono text-[11px] text-primary">{{ item.ordreTravailId }}</span>
      <span v-else class="text-gray-300">-</span>
    </template>

    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3">
        <div>
          <span class="text-[11px] font-mono font-bold px-2 py-0.5 rounded" :class="CLS_FAMILLE[item.famille]">
            {{ item.code }}
          </span>
          <div class="font-mono font-semibold text-foreground mt-1.5">{{ item.vehiculePlaque }}</div>
          <div class="text-xs text-muted-foreground">{{ libelleDuCode(item.code) }}</div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <div><div class="text-muted-foreground text-[11px]">Début</div>{{ fmtDate(item.debut) }}</div>
          <div><div class="text-muted-foreground text-[11px]">Fin</div>{{ item.fin ? fmtDate(item.fin) : 'en cours' }}</div>
          <div><div class="text-muted-foreground text-[11px]">Durée</div>{{ store.dureeIndispo(item) }} jour(s)</div>
          <div><div class="text-muted-foreground text-[11px]">Famille</div>{{ LIB_FAMILLE_INDISPO[item.famille] }}</div>
        </div>

        <p v-if="item.commentaire" class="text-[11px] text-muted-foreground leading-snug">
          {{ item.commentaire }}
        </p>

        <div class="bg-background border border-border rounded-md px-2.5 py-2 text-[11px] text-muted-foreground leading-snug">
          Les jours perdus sont comptés mais non valorisés : le coût d’immobilisation journalier
          n’a pas été communiqué par GTD.
        </div>
      </div>
    </template>

    <template #empty>
      <CalendarOff class="w-8 h-8" />
      <p class="text-sm">Aucune immobilisation</p>
    </template>
  </ListPageLayout>
</template>

<script setup lang="ts">
/**
 * US 3.3.1 - Immobilisations et codes d'indisponibilité.
 * Les 19 codes sont repris du classeur CRM 2025 de GTD.
 */
import { ref, computed, watch } from 'vue'
import { CalendarOff } from 'lucide-vue-next'
import { ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import { useMaintenanceStore } from '../../stores/maintenance'
import { LIB_FAMILLE_INDISPO, libelleDuCode } from '../../types/maintenance'
import type { FamilleIndispo } from '../../types/maintenance'
import { fmtDate } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'

const store = useMaintenanceStore()

const searchQuery = ref('')
const activeScope = ref('')
const sortKey     = ref('')
const sortDir     = ref<'asc' | 'desc'>('desc')
const page        = ref(1)
const pageSize    = ref(20)

const CLS_FAMILLE: Record<FamilleIndispo, string> = {
  technique:      'bg-danger-bg text-danger',
  reglementaire:  'bg-warning-bg text-warning',
  administrative: 'bg-info-bg text-info',
  humaine:        'bg-primary/10 text-primary',
}

const scopeOptions = [
  { value: '',               label: 'Toutes les familles' },
  { value: 'technique',      label: 'Technique' },
  { value: 'reglementaire',  label: 'Réglementaire' },
  { value: 'administrative', label: 'Administrative' },
  { value: 'humaine',        label: 'Humaine' },
]

const totalJours = computed(() =>
  Object.values(store.joursPerdusParFamille).reduce((s, v) => s + (v as number), 0))

const kpis = computed(() => [
  { label: 'En cours',                 value: String(store.indisposEnCours.length), cls: 'text-danger' },
  { label: 'Jours techniques',         value: String(store.joursPerdusParFamille.technique ?? 0), cls: 'text-foreground' },
  { label: 'Jours réglementaires',     value: String(store.joursPerdusParFamille.reglementaire ?? 0), cls: 'text-foreground' },
  { label: 'Ratio humain / technique', value: store.ratioHumainTechnique != null ? String(store.ratioHumainTechnique) : '-', cls: 'text-foreground' },
])

const columns = computed<ListColumn[]>(() => [
  { key: 'vehicule', label: 'Véhicule',         sortable: true, width: 150 },
  { key: 'code',     label: 'Motif',            width: 230 },
  { key: 'famille',  label: 'Famille',          sortable: true, width: 150 },
  { key: 'periode',  label: 'Période',          sortable: true, width: 175 },
  { key: 'duree',    label: 'Durée',            width: 110 },
  { key: 'ot',       label: 'Ordre de travail', width: 160 },
])

watch([activeScope, searchQuery, pageSize], () => { page.value = 1 })

function resetFilters() {
  activeScope.value = ''
  searchQuery.value = ''
  page.value = 1
}

const filtered = computed(() =>
  store.indisponibilites
    .filter(i => {
      if (activeScope.value && i.famille !== activeScope.value) return false
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        if (!`${i.vehiculePlaque} ${i.code} ${libelleDuCode(i.code)}`.toLowerCase().includes(q)) return false
      }
      return true
    })
    .sort((a, b) => +new Date(b.debut) - +new Date(a.debut)))

const totalCount = computed(() => filtered.value.length)

const pageItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})
</script>
