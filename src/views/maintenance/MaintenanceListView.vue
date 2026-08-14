<template>
  <ListPageLayout
    title="Maintenance"
    :subtitle="`${store.ouverts.length} intervention(s) en cours · ${store.enAttentePiece.length} en attente de pièce`"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} ordre(s) de travail`"
    search-placeholder="Référence, plaque, symptôme…"
    scope-label="Statut :"
    :scope-options="scopeOptions"
    v-model:scope="activeScope"
    v-model:search-query="searchQuery"
    v-model:sort-key="sortKey"
    v-model:sort-dir="sortDir"
    v-model:page="page"
    v-model:page-size="pageSize"
    @reset-filters="resetFilters"
    @open-card="(o: OrdreTravail) => openCard(o.id)"
  >
    <template #header-actions>
      <button :class="L.btnPrimary" @click="creationOuverte = true">
        <Plus class="w-4 h-4" />
        Déclarer une panne
      </button>
    </template>

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
      <div>
        <label :class="L.fpFieldLabel">Type</label>
        <select v-model="filterType" :class="L.fpSelect">
          <option value="">Tous</option>
          <option value="preventif">Préventif</option>
          <option value="correctif">Correctif</option>
          <option value="ameliorative">Améliorative</option>
        </select>
      </div>
      <div>
        <label :class="L.fpFieldLabel">Sous-système</label>
        <select v-model="filterSousSysteme" :class="L.fpSelect">
          <option value="">Tous</option>
          <option v-for="(lib, k) in LIB_SOUS_SYSTEME" :key="k" :value="k">{{ lib }}</option>
        </select>
      </div>
      <div>
        <label :class="L.fpFieldLabel">Gravité</label>
        <select v-model="filterGravite" :class="L.fpSelect">
          <option value="">Toutes</option>
          <option value="mineure">Mineure</option>
          <option value="majeure">Majeure</option>
          <option value="critique">Critique</option>
        </select>
      </div>
      <button class="mt-auto py-[7px] bg-transparent border-0 text-xs text-muted-foreground cursor-pointer hover:text-primary"
        @click="resetFilters">
        Réinitialiser
      </button>
    </template>

    <!-- ══════════ CELLULES ══════════ -->
    <template #cell-reference="{ item }">
      <button class="font-mono font-semibold text-foreground hover:text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer text-left"
        @click="openCard(item.id)">
        {{ item.reference }}
      </button>
      <div class="text-[11px] text-muted-foreground">{{ LIB_ORIGINE_OT[item.origine] }}</div>
    </template>

    <template #cell-vehicule="{ item }">
      <button class="font-mono text-xs text-foreground hover:text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer text-left"
        title="Ouvrir la fiche du véhicule"
        @click.stop="voirVehicule(item.vehiculeId)">
        {{ item.vehiculePlaque }}
      </button>
      <div class="text-[11px] text-muted-foreground">
        {{ item.kilometrage ? item.kilometrage.toLocaleString('fr-FR') + ' km' : '-' }}
      </div>
    </template>

    <template #cell-diagnostic="{ item }">
      <template v-if="item.sousSysteme">
        <span class="text-xs font-medium">{{ LIB_SOUS_SYSTEME[item.sousSysteme] }}</span>
        <div class="text-[11px] text-muted-foreground">
          {{ item.modeDefaillance ? LIB_MODE_DEFAILLANCE[item.modeDefaillance] : '' }}
        </div>
      </template>
      <span v-else class="text-[11px] text-warning font-medium">À diagnostiquer</span>
    </template>

    <template #cell-type="{ item }">
      <span class="text-[11px] font-medium px-2 py-0.5 rounded-full"
        :class="item.typeMaintenance === 'preventif' ? 'bg-success-bg text-success' : 'bg-info-bg text-info'">
        {{ LIB_TYPE_MAINTENANCE[item.typeMaintenance] }}
      </span>
    </template>

    <template #cell-gravite="{ item }">
      <span class="text-[11px] font-medium px-2 py-0.5 rounded-full" :class="LIB_GRAVITE_OT[item.gravite].cls">
        {{ LIB_GRAVITE_OT[item.gravite].label }}
      </span>
    </template>

    <template #cell-statut="{ item }">
      <span class="text-[11px] font-medium px-2 py-0.5 rounded-full" :class="CLS_STATUT[item.statut]">
        {{ LIB_STATUT_OT[item.statut] }}
      </span>
    </template>

    <template #cell-cout="{ item }">
      <span class="text-xs">{{ store.coutOT(item) ? fmtAr(store.coutOT(item)) : '-' }}</span>
      <div v-if="item.prestataire" class="text-[11px] text-muted-foreground">sous-traité</div>
    </template>

    <template #cell-declare="{ item }">
      <span class="text-xs">{{ fmtDate(item.declareLe) }}</span>
    </template>

    <!-- ══════════ APERÇU ══════════ -->
    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3">
        <div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[11px] font-medium px-2 py-0.5 rounded-full" :class="LIB_GRAVITE_OT[item.gravite].cls">
              {{ LIB_GRAVITE_OT[item.gravite].label }}
            </span>
            <span class="text-[11px] font-medium px-2 py-0.5 rounded-full" :class="CLS_STATUT[item.statut]">
              {{ LIB_STATUT_OT[item.statut] }}
            </span>
          </div>
          <div class="font-mono font-semibold text-foreground mt-1.5">{{ item.reference }}</div>
          <div class="text-xs text-muted-foreground">{{ LIB_ORIGINE_OT[item.origine] }}</div>
        </div>

        <div class="text-xs text-foreground leading-relaxed">{{ item.symptome }}</div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div class="text-muted-foreground text-[11px]">Véhicule</div>
            <span class="font-mono">{{ item.vehiculePlaque }}</span>
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Déclaré le</div>{{ fmtDate(item.declareLe) }}
          </div>
          <div class="col-span-2">
            <div class="text-muted-foreground text-[11px]">Diagnostic</div>
            <template v-if="item.sousSysteme">
              {{ LIB_SOUS_SYSTEME[item.sousSysteme] }}
              <span v-if="item.modeDefaillance"> - {{ LIB_MODE_DEFAILLANCE[item.modeDefaillance] }}</span>
            </template>
            <span v-else class="text-warning">à établir</span>
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Pièces</div>{{ item.pieces.length }}
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Coût</div>
            {{ store.coutOT(item) ? fmtAr(store.coutOT(item)) : '-' }}
          </div>
        </div>

        <div v-if="item.statut === 'attente_piece'"
          class="bg-warning-bg text-warning rounded-md px-2.5 py-2 text-[11px] leading-snug">
          Le véhicule reste immobilisé tant que la pièce n’est pas réceptionnée.
          Ce délai est isolé du temps de réparation.
        </div>

        <button :class="L.btnPrimary" class="w-full justify-center" @click="openCard(item.id)">
          Ouvrir la fiche
        </button>
      </div>
    </template>

    <template #empty>
      <Wrench class="w-8 h-8" />
      <p class="text-sm">Aucun ordre de travail</p>
    </template>

    <DeclarationPanneModal
      v-if="creationOuverte"
      @close="creationOuverte = false"
      @created="(id: string) => { creationOuverte = false; selectedId = id }"
    />

    <OrdreTravailCard
      v-if="selectedId !== null"
      :ordre="store.getById(selectedId)!"
      @close="selectedId = null"
      @navigate="(id: string) => (selectedId = id)"
      @voir-vehicule="voirVehicule"
    />
  </ListPageLayout>
</template>

<script setup lang="ts">
/**
 * Maintenance - liste des ordres de travail.
 * Même coquille et même comportement que les pages Véhicules et Carburant :
 * clic simple → aperçu, double-clic → fiche complète.
 */
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Wrench, Plus, Clock, PackageSearch, ShieldCheck, Coins } from 'lucide-vue-next'
import { ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import OrdreTravailCard from '../../components/maintenance/OrdreTravailCard.vue'
import DeclarationPanneModal from '../../components/maintenance/DeclarationPanneModal.vue'
import { useMaintenanceStore } from '../../stores/maintenance'
import {
  LIB_SOUS_SYSTEME, LIB_MODE_DEFAILLANCE, LIB_STATUT_OT,
  LIB_ORIGINE_OT, LIB_TYPE_MAINTENANCE, LIB_GRAVITE_OT,
} from '../../types/maintenance'
import type { OrdreTravail, StatutOT } from '../../types/maintenance'
import { fmtAr, fmtDate } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'

const router = useRouter()
const store  = useMaintenanceStore()

const searchQuery       = ref('')
const activeScope       = ref('')
const filterType        = ref('')
const filterSousSysteme = ref('')
const filterGravite     = ref('')
const sortKey           = ref('')
const sortDir           = ref<'asc' | 'desc'>('desc')
const page              = ref(1)
const pageSize          = ref(15)
const selectedId        = ref<string | null>(null)
const creationOuverte   = ref(false)

const CLS_STATUT: Record<StatutOT, string> = {
  ouvert:             'bg-info-bg text-info',
  diagnostique:       'bg-primary/10 text-primary',
  attente_piece:      'bg-warning-bg text-warning',
  en_cours:           'bg-primary/10 text-primary',
  attente_validation: 'bg-warning-bg text-warning',
  cloture:            'bg-success-bg text-success',
  annule:             'bg-gray-100 text-gray-400',
}

const scopeOptions = [
  { value: '',        label: 'Tous les ordres' },
  { value: 'ouverts', label: 'En cours' },
  { value: 'piece',   label: 'En attente de pièce' },
  { value: 'cloture', label: 'Clôturés' },
]

/* ══ Indicateurs - formules du cahier des charges ═══════════ */
const kpis = computed(() => [
  { label: 'En cours',            value: String(store.ouverts.length),
    icon: Wrench, bg: 'bg-primary/10', iconColor: 'text-primary' },
  { label: 'En attente de pièce', value: String(store.enAttentePiece.length),
    icon: PackageSearch, bg: 'bg-warning-bg', iconColor: 'text-warning' },
  { label: 'MTTR (heures)',       value: store.mttrHeures != null ? String(store.mttrHeures) : '-',
    icon: Clock, bg: 'bg-info-bg', iconColor: 'text-info' },
  { label: 'Préventif',           value: store.ratioPreventif != null ? store.ratioPreventif + ' %' : '-',
    icon: ShieldCheck, bg: 'bg-success-bg', iconColor: 'text-success' },
  { label: 'Coût pièces',         value: fmtAr(store.coutTotal),
    icon: Coins, bg: 'bg-gray-100', iconColor: 'text-gray-600' },
])

const columns = computed<ListColumn[]>(() => [
  { key: 'reference',  label: 'Ordre',       sortable: true, width: 150 },
  { key: 'vehicule',   label: 'Véhicule',    sortable: true, width: 140 },
  { key: 'diagnostic', label: 'Diagnostic',  width: 190 },
  { key: 'type',       label: 'Type',        width: 110 },
  { key: 'gravite',    label: 'Gravité',     sortable: true, width: 105 },
  { key: 'statut',     label: 'Statut',      sortable: true, width: 145 },
  { key: 'cout',       label: 'Coût',        width: 130 },
  { key: 'declare',    label: 'Déclaré le',  sortable: true, width: 120 },
])

watch([activeScope, filterType, filterSousSysteme, filterGravite, searchQuery, pageSize],
  () => { page.value = 1 })

function resetFilters() {
  activeScope.value = ''
  filterType.value = ''
  filterSousSysteme.value = ''
  filterGravite.value = ''
  searchQuery.value = ''
  page.value = 1
}

const filtered = computed(() => {
  let rows = store.ordres.filter(o => {
    if (activeScope.value === 'ouverts' && (o.statut === 'cloture' || o.statut === 'annule')) return false
    if (activeScope.value === 'piece'   && o.statut !== 'attente_piece') return false
    if (activeScope.value === 'cloture' && o.statut !== 'cloture') return false
    if (filterType.value        && o.typeMaintenance !== filterType.value) return false
    if (filterSousSysteme.value && o.sousSysteme !== filterSousSysteme.value) return false
    if (filterGravite.value     && o.gravite !== filterGravite.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!`${o.reference} ${o.vehiculePlaque} ${o.symptome}`.toLowerCase().includes(q)) return false
    }
    return true
  })

  if (sortKey.value) {
    const k = sortKey.value
    rows = [...rows].sort((a, b) => {
      const va = k === 'declare' ? a.declareLe : k === 'vehicule' ? a.vehiculePlaque : String(a[k as keyof OrdreTravail] ?? '')
      const vb = k === 'declare' ? b.declareLe : k === 'vehicule' ? b.vehiculePlaque : String(b[k as keyof OrdreTravail] ?? '')
      const cmp = String(va).localeCompare(String(vb), 'fr', { numeric: true })
      return sortDir.value === 'asc' ? cmp : -cmp
    })
  } else {
    rows = [...rows].sort((a, b) => +new Date(b.declareLe) - +new Date(a.declareLe))
  }
  return rows
})

const totalCount = computed(() => filtered.value.length)

const pageItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

function openCard(id: string) { selectedId.value = id }

/** La plaque mène à la fiche du véhicule - un identifiant affiché est un lien. */
function voirVehicule(vehiculeId: string) {
  router.push({ name: 'fleet-vehicules', query: { vehicule: vehiculeId } })
}
</script>
