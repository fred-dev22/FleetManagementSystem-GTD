<template>
  <ListPageLayout
    title="Voyages"
    :subtitle="`${store.voyages.length} voyage(s) — objet pivot du suivi d'exploitation`"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} voyage(s)`"
    search-placeholder="Rechercher par référence, OT, plaque, chauffeur…"
    scope-label="Statut :"
    :scope-options="scopeOptions"
    v-model:scope="activeScope"
    v-model:search-query="searchQuery"
    v-model:sort-key="sortKey"
    v-model:sort-dir="sortDir"
    v-model:page="page"
    v-model:page-size="pageSize"
    @reset-filters="resetFilters"
    @open-card="(v) => ouvrir(v.id)"
  >
    <template #header-actions>
      <button :class="L.btnPrimary" @click="creationOuverte = true">
        <Plus class="w-4 h-4" />
        Nouveau voyage
      </button>
    </template>

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
        <label :class="L.fpFieldLabel">Trajet</label>
        <select v-model="filterTrajet" :class="L.fpSelect">
          <option value="">Tous</option>
          <option v-for="t in trajetsStore.actifs" :key="t.id" :value="t.id">{{ t.code }}</option>
        </select>
      </div>
      <div>
        <label :class="L.fpFieldLabel">Client</label>
        <select v-model="filterClient" :class="L.fpSelect">
          <option value="">Tous</option>
          <option v-for="c in clients" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <div>
        <label :class="L.fpFieldLabel">Sites</label>
        <select v-model="filterDossier" :class="L.fpSelect">
          <option value="">Tous</option>
          <option value="complet">Tous desservis</option>
          <option value="incomplet">Site(s) manqué(s)</option>
        </select>
      </div>
      <button class="mt-auto py-[7px] bg-transparent border-0 text-xs text-muted-foreground cursor-pointer hover:text-primary"
        @click="resetFilters">
        Réinitialiser
      </button>
    </template>

    <!-- ── Colonnes ───────────────────────────────────────────── -->
    <template #cell-reference="{ item }">
      <button
        class="font-mono font-semibold text-foreground hover:text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer"
        @click="ouvrir(item.id)">
        {{ item.reference }}
      </button>
      <div v-if="item.numeroOT" class="text-[11px] text-muted-foreground">OT {{ item.numeroOT }}</div>
    </template>

    <template #cell-statut="{ item }">
      <span :class="STATUT[item.statut].cls"
        class="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
        {{ STATUT[item.statut].label }}
      </span>
    </template>

    <template #cell-trajet="{ item }">
      <span class="text-xs text-foreground">{{ item.origine }} → {{ item.destination }}</span>
      <div class="text-[11px] text-muted-foreground truncate">{{ item.trajetLibelle ?? 'Trajet ponctuel' }}</div>
    </template>

    <template #cell-sites="{ item }">
      <div class="flex items-center gap-1.5">
        <div class="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div class="h-full rounded-full"
            :class="avancement(item).pct === 100 ? 'bg-success' : 'bg-primary'"
            :style="{ width: avancement(item).pct + '%' }" />
        </div>
        <span class="text-[11px] font-medium">{{ avancement(item).faits }}/{{ avancement(item).total }}</span>
      </div>
      <div class="text-[11px] text-muted-foreground">
        {{ nbLivraisons(item) }} livraison(s)
        <span v-if="nbNonDesservis(item)" class="text-danger font-medium">
          · {{ nbNonDesservis(item) }} manqué(s)
        </span>
      </div>
    </template>

    <template #cell-volumes="{ item }">
      <template v-if="coulageDe(item).chargeL">
        <span class="text-xs">{{ fmtL(coulageDe(item).chargeL!) }}</span>
        <div class="text-[11px] text-muted-foreground">
          livré {{ coulageDe(item).livreL ? fmtL(coulageDe(item).livreL!) : '—' }}
        </div>
      </template>
      <span v-else class="text-gray-300">—</span>
    </template>

    <template #cell-vehicule="{ item }">
      <span v-if="item.vehiculePlaque" class="font-mono text-xs">{{ item.vehiculePlaque }}</span>
      <span v-else class="text-gray-300">—</span>
      <div v-if="item.chauffeurNom" class="text-[11px] text-muted-foreground">{{ item.chauffeurNom }}</div>
    </template>

    <template #cell-coulage="{ item }">
      <template v-if="coulageDe(item).ecartPourMille != null">
        <span class="text-xs font-medium" :class="VERDICT[coulageDe(item).verdict].text">
          {{ coulageDe(item).ecartPourMille }} ‰
        </span>
        <div class="text-[11px] text-muted-foreground">seuil {{ item.toleranceCoulagePourMille }} ‰</div>
      </template>
      <span v-else class="text-gray-300">—</span>
    </template>

    <template #cell-conformite="{ item }">
      <div class="flex items-center gap-1.5">
        <span v-if="item.nbEcarts > 0"
          class="text-[11px] font-medium px-1.5 py-0.5 rounded bg-danger-bg text-danger">
          {{ item.nbEcarts }} écart{{ item.nbEcarts > 1 ? 's' : '' }}
        </span>
        <span v-if="item.nbArretsNonJustifies > 0"
          class="text-[11px] font-medium px-1.5 py-0.5 rounded bg-warning-bg text-warning">
          {{ item.nbArretsNonJustifies }} arrêt{{ item.nbArretsNonJustifies > 1 ? 's' : '' }}
        </span>
        <span v-if="item.nbEcarts === 0 && item.nbArretsNonJustifies === 0"
          class="text-[11px] text-success">Conforme</span>
      </div>
    </template>

    <template #cell-dossier="{ item }">
      <div class="flex items-center gap-1.5">
        <div class="w-14 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div class="h-full rounded-full"
            :class="store.completudeDossier(item.id).complet ? 'bg-success' : 'bg-warning'"
            :style="{ width: store.completudeDossier(item.id).pct + '%' }" />
        </div>
        <span class="text-[11px] text-muted-foreground">
          {{ store.completudeDossier(item.id).presents }}/{{ store.completudeDossier(item.id).total }}
        </span>
      </div>
    </template>

    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3">
        <div>
          <span :class="STATUT[item.statut].cls" class="text-xs font-medium px-2 py-0.5 rounded-full">
            {{ STATUT[item.statut].label }}
          </span>
          <div class="font-mono font-semibold text-foreground mt-1.5">{{ item.reference }}</div>
          <div class="text-xs text-muted-foreground">{{ item.origine }} → {{ item.destination }}</div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div><div class="text-muted-foreground text-[11px]">Client</div>{{ item.clientNom }}</div>
          <div><div class="text-muted-foreground text-[11px]">Produit</div>{{ item.volumes.produit }}</div>
          <div><div class="text-muted-foreground text-[11px]">Véhicule</div>
            <span class="font-mono">{{ item.vehiculePlaque ?? '—' }}</span></div>
          <div><div class="text-muted-foreground text-[11px]">Chauffeur</div>{{ item.chauffeurNom ?? '—' }}</div>
          <div><div class="text-muted-foreground text-[11px]">Km référence</div>{{ item.kmReference }} km</div>
          <div><div class="text-muted-foreground text-[11px]">Départ</div>{{ fmtDate(item.datePlanifiee) }}</div>
        </div>
        <button :class="L.btnPrimary" class="w-full justify-center" @click="ouvrir(item.id)">
          Ouvrir le dossier de voyage
        </button>
      </div>
    </template>

    <template #empty>
      <Package class="w-8 h-8" />
      <p class="text-sm">Aucun voyage trouvé</p>
    </template>

    <VoyageFormModal
      v-if="creationOuverte"
      @close="creationOuverte = false"
      @created="id => ouvrir(id)"
    />
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Package, Plus, AlertTriangle, MapPinned, Droplets } from 'lucide-vue-next'
import { ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import { useVoyagesStore } from '../../stores/voyages'
import { useTrajetsStore } from '../../stores/trajets'
import VoyageFormModal from '../../components/fleet/VoyageFormModal.vue'
import type { Voyage, StatutVoyage } from '../../types/fms'
import type { VerdictCoulage } from '../../lib/fmsUtils'
import { calculerCoulageMultiSites, fmtDate, fmtL } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'

const router        = useRouter()
const store         = useVoyagesStore()
const trajetsStore  = useTrajetsStore()

const searchQuery    = ref('')
const activeScope    = ref('')
const filterTrajet   = ref('')
const creationOuverte = ref(false)
const filterClient   = ref('')
const filterDossier  = ref('')
const sortKey        = ref('')
const sortDir        = ref<'asc' | 'desc'>('asc')
const page           = ref(1)
const pageSize       = ref(15)

const STATUT: Record<StatutVoyage, { label: string; cls: string }> = {
  planifie: { label: 'Planifié',  cls: 'bg-gray-100 text-gray-600'  },
  affecte:  { label: 'Affecté',   cls: 'bg-primary/10 text-primary' },
  en_cours: { label: 'En cours',  cls: 'bg-info-bg text-info'       },
  livre:    { label: 'Livré',     cls: 'bg-success-bg text-success' },
  cloture:  { label: 'Clôturé',   cls: 'bg-gray-100 text-gray-500'  },
  litige:   { label: 'En litige', cls: 'bg-danger-bg text-danger'   },
  annule:   { label: 'Annulé',    cls: 'bg-gray-100 text-gray-400'  },
}

const VERDICT: Record<VerdictCoulage, { text: string; label?: string }> = {
  incomplet:      { text: 'text-gray-400' },
  dans_tolerance: { text: 'text-success'  },
  hors_mineur:    { text: 'text-warning'  },
  hors_majeur:    { text: 'text-danger'   },
}

const scopeOptions = [
  { value: '',         label: 'Tous les voyages' },
  { value: 'en_cours', label: 'En cours'   },
  { value: 'livre',    label: 'À clôturer' },
  { value: 'litige',   label: 'En litige'  },
  { value: 'cloture',  label: 'Clôturés'   },
]

const clients = computed(() => [...new Set(store.voyages.map(v => v.clientNom))].sort())

const kpis = computed(() => [
  { label: 'En cours',        value: store.enCours.length,   icon: Package,      bg: 'bg-info-bg',    iconColor: 'text-info'    },
  { label: 'Sites à desservir', value: sitesRestants.value,  icon: MapPinned,    bg: 'bg-primary/10', iconColor: 'text-primary' },
  { label: 'Sites manqués',   value: sitesManques.value,     icon: AlertTriangle,bg: 'bg-danger-bg',  iconColor: 'text-danger'  },
  { label: 'Hors tolérance',  value: horsTolerance.value,    icon: Droplets,     bg: 'bg-warning-bg', iconColor: 'text-warning' },
])

const horsTolerance = computed(() =>
  store.voyages.filter(v => coulageDe(v).verdict.startsWith('hors')).length)

/** Sites restant à desservir sur les voyages en cours. */
const sitesRestants = computed(() =>
  store.enCours.reduce((n, v) => n + v.etapes.filter(e => !e.franchi).length, 0))

/** Sites affectés mais non desservis sur les voyages terminés — incident réel. */
const sitesManques = computed(() =>
  store.voyages
    .filter(v => v.statut === 'livre' || v.statut === 'cloture' || v.statut === 'litige')
    .reduce((n, v) => n + v.etapes.filter(e => !e.franchi).length, 0))

const columns = computed<ListColumn[]>(() => [
  { key: 'reference',  label: 'Référence',   sortable: true, width: 150 },
  { key: 'statut',     label: 'Statut',      sortable: true, width: 110 },
  { key: 'trajet',     label: 'Trajet',       width: 200 },
  { key: 'sites',      label: 'Sites',        width: 150 },
  { key: 'vehicule',   label: 'Véhicule',     width: 145 },
  { key: 'volumes',    label: 'Volumes',      width: 140 },
  { key: 'coulage',    label: 'Écart',        width: 105 },
  { key: 'conformite', label: 'Conformité',   width: 130 },
  { key: 'dossier',    label: 'Dossier',      width: 100 },
])

/* Le voyage dessert plusieurs sites : tout se mesure sur cette séquence. */
const coulageDe = (v: Voyage) =>
  calculerCoulageMultiSites(v.etapes, v.toleranceCoulagePourMille, v.volumes.densite)

const avancement = (v: Voyage) => {
  const total = v.etapes.length
  const faits = v.etapes.filter(e => e.franchi).length
  return { faits, total, pct: total ? Math.round((faits / total) * 100) : 0 }
}

const nbLivraisons   = (v: Voyage) => v.etapes.filter(e => e.role === 'livraison').length
const nbNonDesservis = (v: Voyage) => v.etapes.filter(e => !e.franchi).length

watch([activeScope, filterTrajet, filterClient, filterDossier, searchQuery, pageSize],
  () => { page.value = 1 })

function resetFilters() {
  activeScope.value = ''
  filterTrajet.value = ''
  filterClient.value = ''
  filterDossier.value = ''
  searchQuery.value = ''
  page.value = 1
}

const filtered = computed(() => {
  let rows = store.voyages.filter(v => {
    if (activeScope.value    && v.statut !== activeScope.value)          return false
    if (filterTrajet.value   && v.trajetId !== filterTrajet.value)      return false
    if (filterClient.value   && v.clientNom !== filterClient.value)      return false
    if (filterDossier.value) {
      const tousDesservis = v.etapes.every(e => e.franchi)
      if (filterDossier.value === 'complet'   && !tousDesservis) return false
      if (filterDossier.value === 'incomplet' &&  tousDesservis) return false
    }
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const hay = `${v.reference} ${v.numeroOT ?? ''} ${v.vehiculePlaque ?? ''} ${v.chauffeurNom ?? ''} ${v.clientNom}`
      if (!hay.toLowerCase().includes(q)) return false
    }
    return true
  })

  if (sortKey.value) {
    const k = sortKey.value as keyof Voyage
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

function ouvrir(id: string) {
  router.push({ name: 'fleet-voyage-detail', params: { id } })
}
</script>