<template>
  <ListPageLayout
    title="Carburant"
    :subtitle="`Méthode plein-à-plein ↔ aucun capteur requis · ${store.anomalies.length} recharge(s) en anomalie`"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="totalText"
    :search-placeholder="searchPlaceholder"
    scope-label="Vue :"
    :scope-options="scopeOptions"
    v-model:scope="vue"
    v-model:search-query="searchQuery"
    v-model:sort-key="sortKey"
    v-model:sort-dir="sortDir"
    v-model:page="page"
    v-model:page-size="pageSize"
    @reset-filters="resetFilters"
    @open-card="(r) => { if (vue === 'recharges' && r.id) openCard(r.id) }"
  >
    <template #header-actions>
      <button :class="L.btnPrimary" @click="importOuvert = true">
        <Upload class="w-4 h-4" />
        Importer un relevé
      </button>
    </template>

    <!-- Indicateurs, même présentation que la page Véhicules -->
    <template #above-table>
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-3.5">
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
      <div v-if="vue === 'recharges'">
        <label :class="L.fpFieldLabel">Statut</label>
        <select v-model="filterStatut" :class="L.fpSelect">
          <option value="">Tous</option>
          <option value="valide">Conforme</option>
          <option value="anomalie">En anomalie</option>
          <option value="qualifie">Qualifiée</option>
        </select>
      </div>
      <div v-if="vue === 'recharges'">
        <label :class="L.fpFieldLabel">Canal</label>
        <select v-model="filterCanal" :class="L.fpSelect">
          <option value="">Tous</option>
          <option v-for="(lib, k) in LIB_CANAL" :key="k" :value="k">{{ lib }}</option>
        </select>
      </div>
      <div>
        <label :class="L.fpFieldLabel">Véhicule</label>
        <select v-model="filterVehicule" :class="L.fpSelect">
          <option value="">Tous</option>
          <option v-for="p in plaques" :key="p" :value="p">{{ p }}</option>
        </select>
      </div>
      <button class="mt-auto py-[7px] bg-transparent border-0 text-xs text-muted-foreground cursor-pointer hover:text-primary"
        @click="resetFilters">
        Réinitialiser
      </button>
    </template>

    <!-- ══════════ VUE 1 — REGISTRE DES RECHARGES ══════════ -->
    <template #cell-date="{ item }">
      <button class="font-medium text-foreground hover:text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer text-left"
        @click="item.id && openCard(item.id)">
        {{ fmtDateTime(item.date) }}
      </button>
    </template>

    <template #cell-vehicule="{ item }">
      <span class="font-mono font-semibold text-foreground">{{ item.vehiculePlaque }}</span>
      <div class="text-[11px] text-muted-foreground">{{ item.chauffeurNom ?? '—' }}</div>
    </template>

    <template #cell-bons="{ item }">
      <span class="text-sm font-bold text-primary">{{ item.nombreBons ?? '—' }}</span>
      <div v-if="item.litresParBon" class="text-[11px] text-muted-foreground">{{ item.litresParBon }} L/bon</div>
    </template>

    <template #cell-litres="{ item }">
      <span class="text-xs font-medium">{{ fmtL(item.litres) }}</span>
      <div v-if="item.pleinComplet" class="text-[11px] text-primary">plein complet</div>
    </template>

    <template #cell-montant="{ item }">
      <span class="text-xs">{{ fmtAr(item.montant) }}</span>
    </template>

    <template #cell-canal="{ item }">
      <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{{ item.canal ? LIB_CANAL[item.canal] : "—" }}</span>
    </template>

    <template #cell-controles="{ item }">
      <span v-if="item.statut === 'valide'" class="text-xs font-medium px-2 py-0.5 rounded-full bg-success-bg text-success">Conforme</span>
      <span v-else-if="item.statut === 'qualifie'" class="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Qualifiée</span>
      <span v-else class="text-xs font-medium px-2 py-0.5 rounded-full bg-danger-bg text-danger">
        {{ (item.controles ?? []).filter(c => !c.ok).length }} anomalie(s)
      </span>
    </template>

    <!-- ══════════ VUE 2 — CONSOMMATION PLEIN-À-PLEIN ══════════ -->
    <template #cell-periode="{ item }">
      <span class="text-xs">{{ fmtDate(item.du) }} → {{ fmtDate(item.au) }}</span>
    </template>

    <template #cell-plaqueConso="{ item }">
      <span class="font-mono font-semibold text-foreground">{{ item.vehiculePlaque }}</span>
      <div class="text-[11px] text-muted-foreground">{{ item.chauffeurNom ?? '—' }}</div>
    </template>

    <template #cell-km="{ item }">
      <span class="text-xs">{{ (item.km ?? 0).toLocaleString('fr-FR') }} km</span>
    </template>

    <template #cell-litresConso="{ item }">
      <span class="text-xs">{{ (item.litres ?? 0).toLocaleString('fr-FR') }} L</span>
    </template>

    <template #cell-l100="{ item }">
      <span class="text-sm font-bold">{{ item.litresPour100km }}</span>
    </template>

    <template #cell-reference="{ item }">
      <span class="text-xs text-muted-foreground">{{ item.refConso }}</span>
      <div v-if="item.trajetCode" class="text-[11px] text-muted-foreground font-mono">{{ item.trajetCode }}</div>
    </template>

    <template #cell-ecartConso="{ item }">
      <span class="text-xs font-medium"
        :class="Math.abs(item.ecartPct ?? 0) > 8 ? 'text-danger' : (item.ecartPct ?? 0) > 3 ? 'text-warning' : 'text-success'">
        {{ (item.ecartPct ?? 0) > 0 ? '+' : '' }}{{ item.ecartPct }} %
      </span>
    </template>

    <!-- ══════════ VUE 3 — BONS PAR VÉHICULE ══════════ -->
    <template #cell-plaqueBons="{ item }">
      <span class="font-mono font-semibold text-foreground">{{ item.plaque }}</span>
    </template>

    <template #cell-nbBons="{ item }">
      <span class="text-lg font-bold text-primary">{{ item.bons }}</span>
    </template>

    <template #cell-litresBons="{ item }">
      <span class="text-xs">{{ fmtL(item.litres) }}</span>
    </template>

    <template #cell-montantBons="{ item }">
      <span class="text-xs">{{ fmtAr(item.montant) }}</span>
    </template>

    <template #cell-part="{ item }">
      <div class="flex items-center gap-2">
        <div class="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div class="h-full bg-primary rounded-full"
            :style="{ width: (store.totalBons ? ((item.bons ?? 0) / store.totalBons) * 100 : 0) + '%' }" />
        </div>
        <span class="text-[11px] text-muted-foreground">
          {{ store.totalBons ? Math.round(((item.bons ?? 0) / store.totalBons) * 100) : 0 }} %
        </span>
      </div>
    </template>

    <!-- Panneau d'aperçu, comme sur la page Véhicules -->
    <template #details-panel="{ item }">
      <div v-if="vue === 'recharges'" class="flex flex-col gap-3">
        <div>
          <span class="text-xs font-medium px-2 py-0.5 rounded-full"
            :class="item.statut === 'valide' ? 'bg-success-bg text-success'
                  : item.statut === 'qualifie' ? 'bg-gray-100 text-gray-600' : 'bg-danger-bg text-danger'">
            {{ item.statut === 'valide' ? 'Conforme' : item.statut === 'qualifie' ? 'Qualifiée' : 'En anomalie' }}
          </span>
          <div class="font-mono font-semibold text-foreground mt-1.5">{{ item.vehiculePlaque }}</div>
          <div class="text-xs text-muted-foreground">{{ fmtDateTime(item.date) }}</div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div><div class="text-muted-foreground text-[11px]">Bons</div>{{ item.nombreBons ?? '—' }}</div>
          <div><div class="text-muted-foreground text-[11px]">Litres</div>{{ fmtL(item.litres) }}</div>
          <div><div class="text-muted-foreground text-[11px]">Montant</div>{{ fmtAr(item.montant) }}</div>
          <div><div class="text-muted-foreground text-[11px]">Chauffeur</div>{{ item.chauffeurNom ?? '—' }}</div>
          <div class="col-span-2"><div class="text-muted-foreground text-[11px]">Lieu déclaré</div>{{ item.lieu }}</div>
        </div>
        <div v-if="item.positionVehicule && item.positionVehicule.ecartKm > 2"
          class="bg-danger-bg text-danger rounded-md px-2.5 py-2 text-[11px] leading-snug">
          Véhicule à {{ item.positionVehicule.ecartKm.toFixed(1) }} km du lieu déclaré à l’horodatage indiqué.
        </div>
        <button :class="L.btnPrimary" class="w-full justify-center" @click="item.id && openCard(item.id)">
          Ouvrir la fiche
        </button>
      </div>

      <div v-else-if="vue === 'conso'" class="flex flex-col gap-3">
        <div>
          <div class="font-mono font-semibold text-foreground">{{ item.vehiculePlaque }}</div>
          <div class="text-xs text-muted-foreground">{{ fmtDate(item.du) }} → {{ fmtDate(item.au) }}</div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div><div class="text-muted-foreground text-[11px]">Kilomètres</div>{{ (item.km ?? 0).toLocaleString('fr-FR') }}</div>
          <div><div class="text-muted-foreground text-[11px]">Litres</div>{{ (item.litres ?? 0).toLocaleString('fr-FR') }}</div>
          <div><div class="text-muted-foreground text-[11px]">L / 100 km</div>{{ item.litresPour100km }}</div>
          <div><div class="text-muted-foreground text-[11px]">Référence</div>{{ item.refConso }}</div>
        </div>
      </div>

      <div v-else class="flex flex-col gap-3">
        <div class="font-mono font-semibold text-foreground">{{ item.plaque }}</div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div><div class="text-muted-foreground text-[11px]">Bons</div>{{ item.bons }}</div>
          <div><div class="text-muted-foreground text-[11px]">Litres</div>{{ fmtL(item.litres) }}</div>
          <div class="col-span-2"><div class="text-muted-foreground text-[11px]">Montant</div>{{ fmtAr(item.montant) }}</div>
        </div>
      </div>
    </template>

    <template #empty>
      <Fuel class="w-8 h-8" />
      <p class="text-sm">{{ messageVide }}</p>
    </template>

    <!-- Fiche de recharge, même coquille que la fiche véhicule -->
    <RechargeCard
      v-if="selectedId"
      :recharge="store.getById(selectedId)!"
      @close="selectedId = null"
      @navigate="id => (selectedId = id)"
    />
  </ListPageLayout>
</template>

<script setup lang="ts">
/**
 * Carburant — même modèle d'affichage que la page Véhicules :
 * un seul ListPageLayout, des indicateurs au-dessus, un panneau d'aperçu à droite,
 * et une fiche en superposition au clic.
 *
 * Le sélecteur « Vue » bascule entre trois tableaux qui partagent la même coquille :
 * le registre des recharges, la consommation plein-à-plein, et les bons par véhicule.
 */
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Fuel, Upload, Coins, Gauge, AlertTriangle, Ticket } from 'lucide-vue-next'
import { ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import RechargeCard from '../../components/fleet/Rechargecard.vue'
import { useCarburantStore, LIB_CANAL } from '../../stores/carburant'
import type { ControleVraisemblance, CanalRecharge, StatutRecharge } from '../../types/fms'

/**
 * Une seule coquille de tableau accueille trois jeux de données.
 * On déclare donc une ligne unifiée : chaque vue n'en renseigne que sa part.
 */
interface LigneCarburant {
  id?: string
  /* Registre des recharges */
  date?: string
  vehiculePlaque?: string
  chauffeurNom?: string
  nombreBons?: number
  litresParBon?: number
  litres?: number
  montant?: number
  canal?: CanalRecharge
  statut?: StatutRecharge
  controles?: ControleVraisemblance[]
  lieu?: string
  pleinComplet?: boolean
  positionVehicule?: { lat: number; lng: number; ecartKm: number }
  /* Consommation plein-à-plein */
  du?: string
  au?: string
  km?: number
  litresPour100km?: number
  refConso?: number
  trajetCode?: string
  ecartPct?: number
  /* Bons par véhicule */
  plaque?: string
  bons?: number
}
import { fmtAr, fmtL, fmtDate, fmtDateTime } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'

const route = useRoute()
const store = useCarburantStore()

type Vue = 'recharges' | 'conso' | 'bons'

const vue           = ref<Vue>('recharges')
const searchQuery   = ref('')
const filterStatut  = ref('')
const filterCanal   = ref('')
const filterVehicule = ref('')
const sortKey       = ref('')
const sortDir       = ref<'asc' | 'desc'>('desc')
const page          = ref(1)
const pageSize      = ref(15)
const selectedId    = ref<string | null>(null)
const importOuvert  = ref(false)

onMounted(() => {
  const id = route.query.recharge as string | undefined
  if (id) selectedId.value = id
})

const scopeOptions = [
  { value: 'recharges', label: 'Registre des recharges' },
  { value: 'conso',     label: 'Consommation plein-à-plein' },
  { value: 'bons',      label: 'Bons par véhicule' },
]

/* ══ Indicateurs ═══════════════════════════════════════════ */
const consoMoyenne = computed(() => {
  const p = store.periodesConso
  if (!p.length) return 0
  return Number((p.reduce((s, x) => s + x.litresPour100km, 0) / p.length).toFixed(1))
})

const kpis = computed(() => [
  { label: 'Litres délivrés',   value: fmtL(store.litresDelivres()), icon: Fuel,          bg: 'bg-primary/10', iconColor: 'text-primary' },
  { label: 'Dépense totale',    value: fmtAr(store.montantTotal()),  icon: Coins,         bg: 'bg-info-bg',    iconColor: 'text-info'    },
  { label: 'Bons délivrés',     value: String(store.totalBons),      icon: Ticket,        bg: 'bg-warning-bg', iconColor: 'text-warning' },
  { label: 'Conso (L/100 km)',  value: String(consoMoyenne.value),   icon: Gauge,         bg: 'bg-success-bg', iconColor: 'text-success' },
  { label: 'En anomalie',       value: String(store.anomalies.length), icon: AlertTriangle, bg: 'bg-danger-bg', iconColor: 'text-danger' },
])

/* ══ Colonnes, selon la vue active ═════════════════════════ */
const COLONNES: Record<Vue, ListColumn[]> = {
  recharges: [
    { key: 'date',      label: 'Date',      sortable: true, width: 150 },
    { key: 'vehicule',  label: 'Véhicule',  sortable: true, width: 165 },
    { key: 'bons',      label: 'Bons',      width: 105 },
    { key: 'litres',    label: 'Litres',    width: 120 },
    { key: 'montant',   label: 'Montant',   width: 130 },
    { key: 'canal',     label: 'Canal',     width: 130 },
    { key: 'controles', label: 'Contrôles', width: 130 },
  ],
  conso: [
    { key: 'plaqueConso', label: 'Véhicule',           sortable: true, width: 165 },
    { key: 'periode',     label: 'Période plein-à-plein', width: 190 },
    { key: 'km',          label: 'Kilomètres',         width: 120 },
    { key: 'litresConso', label: 'Litres',             width: 110 },
    { key: 'l100',        label: 'L / 100 km',         sortable: true, width: 110 },
    { key: 'reference',   label: 'Référence trajet',   width: 150 },
    { key: 'ecartConso',  label: 'Écart',              width: 100 },
  ],
  bons: [
    { key: 'plaqueBons',  label: 'Véhicule',      sortable: true, width: 180 },
    { key: 'nbBons',      label: 'Bons délivrés', sortable: true, width: 140 },
    { key: 'litresBons',  label: 'Litres',        width: 150 },
    { key: 'montantBons', label: 'Montant',       width: 170 },
    { key: 'part',        label: 'Répartition',   width: 200 },
  ],
}

const columns = computed(() => COLONNES[vue.value])

const searchPlaceholder = computed(() =>
  vue.value === 'recharges' ? 'Plaque, chauffeur, lieu…' : 'Rechercher un véhicule…')

const messageVide = computed(() =>
  vue.value === 'recharges' ? 'Aucune recharge trouvée'
  : vue.value === 'conso'   ? 'Aucune période plein-à-plein calculable'
  : 'Aucun bon enregistré')

const plaques = computed(() =>
  [...new Set(store.recharges.map(r => r.vehiculePlaque))].sort())

/* ══ Données, selon la vue active ══════════════════════════ */
const donnees = computed<LigneCarburant[]>(() => {
  const q = searchQuery.value.toLowerCase()

  if (vue.value === 'recharges') {
    return store.recharges.filter(r => {
      if (filterStatut.value   && r.statut !== filterStatut.value)             return false
      if (filterCanal.value    && r.canal  !== filterCanal.value)              return false
      if (filterVehicule.value && r.vehiculePlaque !== filterVehicule.value)   return false
      if (q && !`${r.vehiculePlaque} ${r.chauffeurNom ?? ''} ${r.lieu}`.toLowerCase().includes(q)) return false
      return true
    }).sort((a, b) => +new Date(b.date) - +new Date(a.date))
  }

  if (vue.value === 'conso') {
    return store.periodesConso.filter(p => {
      if (filterVehicule.value && p.vehiculePlaque !== filterVehicule.value) return false
      if (q && !`${p.vehiculePlaque} ${p.chauffeurNom ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }

  return store.bonsParVehicule.filter(b => {
    if (filterVehicule.value && b.plaque !== filterVehicule.value) return false
    if (q && !b.plaque.toLowerCase().includes(q)) return false
    return true
  })
})

const totalCount = computed(() => donnees.value.length)

const totalText = computed(() =>
  vue.value === 'recharges' ? `${totalCount.value} recharge(s)`
  : vue.value === 'conso'   ? `${totalCount.value} période(s)`
  : `${totalCount.value} véhicule(s)`)

const pageItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return donnees.value.slice(start, start + pageSize.value)
})

/* ══ Réinitialisations ═════════════════════════════════════ */
watch([vue, filterStatut, filterCanal, filterVehicule, searchQuery, pageSize], () => { page.value = 1 })
watch(vue, () => { sortKey.value = '' })

function resetFilters() {
  filterStatut.value = ''
  filterCanal.value = ''
  filterVehicule.value = ''
  searchQuery.value = ''
  page.value = 1
}

function openCard(id: string) { selectedId.value = id }
</script>