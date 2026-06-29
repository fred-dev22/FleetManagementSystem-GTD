<template>
  <ListPageLayout
    title="Historique des Trajets"
    :subtitle="`${filteredTrajets.length} trajet(s) trouvé(s)`"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} trajet(s)`"
    search-placeholder="Rechercher par plaque, chauffeur ou site…"
    scope-label="Tracteur :"
    :scope-options="tracteurOptions"
    v-model:scope="filterTracteur"
    v-model:search-query="searchQuery"
    v-model:sort-key="sortKey"
    v-model:sort-dir="sortDir"
    v-model:page="page"
    v-model:page-size="pageSize"
    @reset-filters="resetFilters"
    @open-card="(e) => openDetail(e.id)"
  >
    <template #header-actions>
      <button :class="L.btnOutline" @click="exportCSV">
        <Download class="w-4 h-4" /> Exporter CSV
      </button>
    </template>

    <template #above-table>
      <div class="grid grid-cols-4 gap-2.5 mb-3.5 max-md:grid-cols-2">
        <div :class="kpiItem"><div :class="kpiIcon" class="bg-primary/10"><Route class="w-[18px] h-[18px] text-primary" /></div><div><div :class="kpiVal">{{ mockTrajets.length }}</div><div :class="kpiLbl">Total trajets</div></div></div>
        <div :class="kpiItem"><div :class="kpiIcon" class="bg-success-bg"><Gauge class="w-[18px] h-[18px] text-success" /></div><div><div :class="kpiVal">{{ totalKm.toLocaleString('fr-FR') }}</div><div :class="kpiLbl">km parcourus</div></div></div>
        <div :class="kpiItem"><div :class="kpiIcon" class="bg-primary/10"><Truck class="w-[18px] h-[18px] text-primary" /></div><div><div :class="kpiVal">{{ uniqueTracteurs }}</div><div :class="kpiLbl">Tracteurs actifs</div></div></div>
        <div :class="kpiItem"><div :class="kpiIcon" class="bg-warning-bg"><Clock class="w-[18px] h-[18px] text-warning" /></div><div><div :class="kpiVal">{{ avgDuree }}</div><div :class="kpiLbl">Durée moy.</div></div></div>
      </div>
    </template>

    <template #filters>
      <div :class="L.fpField">
        <label :class="L.fpFieldLabel">Du</label>
        <input type="date" v-model="filterDateFrom" :class="L.fpSelect" />
      </div>
      <div :class="L.fpField">
        <label :class="L.fpFieldLabel">Au</label>
        <input type="date" v-model="filterDateTo" :class="L.fpSelect" />
      </div>
      <button class="mt-auto py-[7px] bg-transparent border-0 text-xs text-muted-foreground cursor-pointer text-left hover:text-primary" @click="resetFilters">
        Réinitialiser
      </button>
    </template>

    <!-- Colonnes personnalisées -->
    <template #cell-tracteurPlaque="{ item }">
      <span class="text-[11px] font-bold px-[7px] py-0.5 rounded bg-primary/10 text-primary font-mono tracking-[0.04em]">{{ item.tracteurPlaque }}</span>
    </template>
    <template #cell-chauffeurNom="{ item }">
      <span class="font-medium text-foreground">{{ item.chauffeurNom }}</span>
    </template>
    <template #cell-dateDebut="{ item }">
      <span class="text-foreground text-xs">{{ formatDateTime(item.dateDebut) }}</span>
    </template>
    <template #cell-dateFin="{ item }">
      <span class="text-foreground text-xs">{{ formatDateTime(item.dateFin) }}</span>
    </template>
    <template #cell-distance="{ item }">
      <span class="font-semibold text-foreground">{{ item.distance }}</span>
      <span class="text-muted-foreground text-xs"> km</span>
    </template>
    <template #cell-sitesTraverses="{ item }">
      <div class="flex flex-wrap gap-1">
        <span v-for="site in item.sitesTraverses" :key="site" class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">{{ site }}</span>
      </div>
    </template>
    <template #cell-duree="{ item }">
      <span class="text-muted-foreground text-xs">{{ computeDuree(item.dateDebut, item.dateFin) }}</span>
    </template>

    <!-- Panneau latéral rapide -->
    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3">
        <div>
          <span class="text-[11px] font-bold px-[7px] py-0.5 rounded bg-primary/10 text-primary font-mono tracking-[0.04em]">{{ item.tracteurPlaque }}</span>
          <div class="font-medium text-foreground mt-1.5">{{ item.chauffeurNom }}</div>
          <div class="text-xs text-muted-foreground">{{ formatDateTime(item.dateDebut) }}</div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-[12px]">
          <div><div class="text-muted-foreground text-[11px]">Distance</div><span class="font-semibold">{{ item.distance }} km</span></div>
          <div><div class="text-muted-foreground text-[11px]">Durée</div>{{ computeDuree(item.dateDebut, item.dateFin) }}</div>
        </div>
        <div>
          <div class="text-muted-foreground text-[11px] mb-1">Sites traversés</div>
          <div class="flex flex-wrap gap-1">
            <span v-for="site in item.sitesTraverses" :key="site" class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">{{ site }}</span>
          </div>
        </div>
        <button :class="L.btnPrimary" class="w-full justify-center" @click="openDetail(item.id)">
          Voir le détail
        </button>
      </div>
    </template>

    <template #empty>
      <Route class="w-8 h-8" />
      <p class="text-[13px]">Aucun trajet trouvé</p>
    </template>
  </ListPageLayout>

  <!-- Modal détail trajet -->
  <Teleport to="body">
    <div v-if="selectedTrajet" class="fixed inset-0 bg-black/40 flex items-center justify-center z-[900]" @click.self="selectedTrajet = null">
      <div class="bg-card rounded-xl w-full max-w-2xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-border bg-primary">
          <div class="flex items-center gap-3">
            <Route class="w-4 h-4 text-white/70" />
            <div>
              <div class="text-white font-semibold text-[14px]">Trajet — {{ selectedTrajet.tracteurPlaque }}</div>
              <div class="text-white/70 text-xs">{{ selectedTrajet.id }} · {{ selectedTrajet.chauffeurNom }}</div>
            </div>
          </div>
          <button class="text-white/70 hover:text-white" @click="selectedTrajet = null">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="overflow-y-auto flex-1">
          <!-- KPIs -->
          <div class="grid grid-cols-3 gap-0 border-b border-border">
            <div class="flex flex-col gap-0.5 px-5 py-4 border-r border-border">
              <span class="text-[11px] text-muted-foreground uppercase tracking-wide">Distance</span>
              <span class="text-[22px] font-bold text-foreground leading-none">{{ selectedTrajet.distance }}</span>
              <span class="text-xs text-muted-foreground">km parcourus</span>
            </div>
            <div class="flex flex-col gap-0.5 px-5 py-4 border-r border-border">
              <span class="text-[11px] text-muted-foreground uppercase tracking-wide">Durée</span>
              <span class="text-[22px] font-bold text-foreground leading-none">{{ computeDuree(selectedTrajet.dateDebut, selectedTrajet.dateFin) }}</span>
              <span class="text-xs text-muted-foreground">temps de trajet</span>
            </div>
            <div class="flex flex-col gap-0.5 px-5 py-4">
              <span class="text-[11px] text-muted-foreground uppercase tracking-wide">Sites</span>
              <span class="text-[22px] font-bold text-foreground leading-none">{{ selectedTrajet.sitesTraverses.length }}</span>
              <span class="text-xs text-muted-foreground">points traversés</span>
            </div>
          </div>

          <!-- Carte placeholder + itinéraire -->
          <div class="grid grid-cols-2 border-b border-border max-md:grid-cols-1">
            <!-- Carte -->
            <div class="flex flex-col items-center justify-center gap-3 py-10 bg-primary/5 border-r border-border max-md:border-r-0 max-md:border-b">
              <MapPin class="w-10 h-10 text-primary/40" />
              <div class="text-center">
                <p class="text-[13px] font-medium text-foreground">Tracé GPS</p>
                <p class="text-xs text-muted-foreground mt-0.5">Disponible via le module carte en temps réel</p>
              </div>
            </div>

            <!-- Itinéraire -->
            <div class="px-5 py-4">
              <p class="text-[12px] font-semibold text-foreground mb-3 uppercase tracking-wide">Itinéraire</p>
              <ol class="relative pl-5 border-l-2 border-primary/30">
                <li v-for="(wp, idx) in getWaypoints(selectedTrajet)" :key="idx" class="relative mb-4 last:mb-0">
                  <div class="absolute -left-[21px] w-3 h-3 rounded-full border-2 border-primary" :class="idx === 0 || idx === selectedTrajet.sitesTraverses.length - 1 ? 'bg-primary' : 'bg-card'"></div>
                  <div class="text-[11px] text-muted-foreground">{{ wp.time }}</div>
                  <div class="text-[13px] font-semibold text-foreground">{{ wp.label }}</div>
                </li>
              </ol>
            </div>
          </div>

          <!-- Détails -->
          <div class="grid grid-cols-2 gap-4 px-5 py-4 text-[13px]">
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] text-muted-foreground uppercase tracking-wide">Départ</span>
              <span class="font-medium text-foreground">{{ formatDateTime(selectedTrajet.dateDebut) }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] text-muted-foreground uppercase tracking-wide">Arrivée</span>
              <span class="font-medium text-foreground">{{ formatDateTime(selectedTrajet.dateFin) }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] text-muted-foreground uppercase tracking-wide">Chauffeur</span>
              <span class="font-medium text-foreground">{{ selectedTrajet.chauffeurNom }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] text-muted-foreground uppercase tracking-wide">Tracteur</span>
              <span class="font-mono font-bold text-primary text-[12px]">{{ selectedTrajet.tracteurPlaque }}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 px-5 py-3 border-t border-border bg-muted/30">
          <button :class="L.btnOutline" @click="selectedTrajet = null">Fermer</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Download, Route, Gauge, Truck, Clock, MapPin, X } from 'lucide-vue-next'
import { ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import * as L from '../../lib/listClasses'

interface Trajet {
  id: string
  tracteurId: string
  tracteurPlaque: string
  chauffeurNom: string
  dateDebut: string
  dateFin: string
  distance: number
  sitesTraverses: string[]
}

const mockTrajets: Trajet[] = [
  { id: 'TRJ-001', tracteurId: 'TRC-001', tracteurPlaque: '1234 TAN A', chauffeurNom: 'Rakoto Jean',       dateDebut: '2026-06-20T06:15:00', dateFin: '2026-06-20T14:30:00', distance: 312, sitesTraverses: ['TNR', 'AMBATONDRAZAKA', 'TOAMASINA'] },
  { id: 'TRJ-002', tracteurId: 'TRC-002', tracteurPlaque: '2345 TNR B', chauffeurNom: 'Andriantsoa Paul', dateDebut: '2026-06-21T05:00:00', dateFin: '2026-06-21T17:45:00', distance: 487, sitesTraverses: ['TNR', 'ANTSIRABE', 'FIANARANTSOA'] },
  { id: 'TRJ-003', tracteurId: 'TRC-003', tracteurPlaque: '3456 TNR C', chauffeurNom: 'Razafy Michel',    dateDebut: '2026-06-22T07:30:00', dateFin: '2026-06-22T12:10:00', distance: 178, sitesTraverses: ['TNR', 'MAHITSY', 'MIARINARIVO'] },
  { id: 'TRJ-004', tracteurId: 'TRC-001', tracteurPlaque: '1234 TAN A', chauffeurNom: 'Rakoto Jean',       dateDebut: '2026-06-23T04:45:00', dateFin: '2026-06-23T16:20:00', distance: 524, sitesTraverses: ['TOAMASINA', 'BRICKAVILLE', 'MORAMANGA', 'TNR'] },
  { id: 'TRJ-005', tracteurId: 'TRC-004', tracteurPlaque: '4567 TNR D', chauffeurNom: 'Rasolofo Hery',    dateDebut: '2026-06-24T06:00:00', dateFin: '2026-06-24T19:30:00', distance: 601, sitesTraverses: ['TNR', 'MIANDRIVAZO', 'MORONDAVA'] },
  { id: 'TRJ-006', tracteurId: 'TRC-005', tracteurPlaque: '5678 TNR E', chauffeurNom: 'Randria Luc',      dateDebut: '2026-06-25T08:00:00', dateFin: '2026-06-25T11:50:00', distance: 142, sitesTraverses: ['TNR', 'AMBOHIDRATRIMO', 'IVATO'] },
  { id: 'TRJ-007', tracteurId: 'TRC-002', tracteurPlaque: '2345 TNR B', chauffeurNom: 'Andriantsoa Paul', dateDebut: '2026-06-26T05:30:00', dateFin: '2026-06-26T14:00:00', distance: 396, sitesTraverses: ['FIANARANTSOA', 'IHOSY', 'TOLIARA'] },
  { id: 'TRJ-008', tracteurId: 'TRC-003', tracteurPlaque: '3456 TNR C', chauffeurNom: 'Razafy Michel',    dateDebut: '2026-06-27T07:00:00', dateFin: '2026-06-27T10:45:00', distance: 165, sitesTraverses: ['TNR', 'ANJOZOROBE'] },
]

const kpiItem = 'bg-card border border-border rounded-lg px-3.5 py-3 flex items-center gap-3'
const kpiIcon = 'w-9 h-9 rounded-lg flex items-center justify-center shrink-0'
const kpiVal  = 'text-[22px] font-bold leading-none'
const kpiLbl  = 'text-xs text-muted-foreground mt-0.5'

const selectedTrajet = ref<Trajet | null>(null)
const filterTracteur = ref('')
const filterDateFrom = ref('')
const filterDateTo   = ref('')
const searchQuery    = ref('')
const sortKey        = ref('')
const sortDir        = ref<'asc' | 'desc'>('asc')
const page           = ref(1)
const pageSize       = ref(15)

const tracteurOptions = computed(() => [
  { value: '', label: 'Tous' },
  ...[...new Set(mockTrajets.map(t => t.tracteurPlaque))].sort().map(p => ({ value: p, label: p })),
])

const columns = computed<ListColumn[]>(() => [
  { key: 'tracteurPlaque', label: 'Tracteur',    sortable: true, width: 130 },
  { key: 'chauffeurNom',   label: 'Chauffeur',   sortable: true, width: 160 },
  { key: 'dateDebut',      label: 'Départ',       sortable: true, width: 140 },
  { key: 'dateFin',        label: 'Arrivée',      width: 140 },
  { key: 'distance',       label: 'Distance',     sortable: true, align: 'center', width: 100 },
  { key: 'sitesTraverses', label: 'Sites traversés', width: 260 },
  { key: 'duree',          label: 'Durée',        align: 'center', width: 90 },
])

watch([filterTracteur, filterDateFrom, filterDateTo, searchQuery, pageSize], () => { page.value = 1 })
function resetFilters() { filterTracteur.value = ''; filterDateFrom.value = ''; filterDateTo.value = ''; searchQuery.value = ''; page.value = 1 }

const filteredTrajets = computed(() => {
  return mockTrajets.filter(t => {
    if (filterTracteur.value && t.tracteurPlaque !== filterTracteur.value) return false
    if (filterDateFrom.value && t.dateDebut < filterDateFrom.value) return false
    if (filterDateTo.value && t.dateFin > filterDateTo.value + 'T23:59:59') return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!t.tracteurPlaque.toLowerCase().includes(q) && !t.chauffeurNom.toLowerCase().includes(q) && !t.sitesTraverses.some(s => s.toLowerCase().includes(q))) return false
    }
    return true
  })
})

const totalCount     = computed(() => filteredTrajets.value.length)
const pageItems      = computed(() => { const s = (page.value - 1) * pageSize.value; return filteredTrajets.value.slice(s, s + pageSize.value) })
const totalKm        = computed(() => mockTrajets.reduce((acc, t) => acc + t.distance, 0))
const uniqueTracteurs = computed(() => new Set(mockTrajets.map(t => t.tracteurId)).size)
const avgDuree       = computed(() => {
  if (!mockTrajets.length) return '—'
  const avgMs = mockTrajets.reduce((acc, t) => acc + (new Date(t.dateFin).getTime() - new Date(t.dateDebut).getTime()), 0) / mockTrajets.length
  const h = Math.floor(avgMs / 3600000); const m = Math.floor((avgMs % 3600000) / 60000)
  return `${h}h${m.toString().padStart(2, '0')}`
})

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function computeDuree(debut: string, fin: string) {
  const diff = new Date(fin).getTime() - new Date(debut).getTime()
  const h = Math.floor(diff / 3600000); const m = Math.floor((diff % 3600000) / 60000)
  return `${h}h ${m.toString().padStart(2, '0')}min`
}
function getWaypoints(t: Trajet) {
  const depart = new Date(t.dateDebut); const arrive = new Date(t.dateFin); const total = arrive.getTime() - depart.getTime()
  return t.sitesTraverses.map((site, idx) => {
    const ratio = idx / (t.sitesTraverses.length - 1 || 1)
    const ts = new Date(depart.getTime() + ratio * total)
    return { time: ts.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), label: site }
  })
}

function openDetail(id: string) {
  selectedTrajet.value = mockTrajets.find(t => t.id === id) ?? null
}

function exportCSV() {
  const headers = ['ID', 'Tracteur', 'Chauffeur', 'Début', 'Fin', 'Distance (km)', 'Sites traversés', 'Durée']
  const rows = filteredTrajets.value.map(t => [t.id, t.tracteurPlaque, t.chauffeurNom, t.dateDebut, t.dateFin, t.distance, t.sitesTraverses.join(' | '), computeDuree(t.dateDebut, t.dateFin)])
  const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob); const a = document.createElement('a')
  a.href = url; a.download = 'trajets_gtd.csv'; a.click(); URL.revokeObjectURL(url)
}
</script>
