<template>
  <ListPageLayout
    title="Véhicules"
    :subtitle="sousTitre"
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
      <!-- Accès direct aux véhicules sortis : le sélecteur Statut y menait
           déjà, mais rien ne signalait leur existence depuis la liste. -->
      <button :class="L.btnOutline" @click="basculerArchives">
        <component :is="vueArchives ? Truck : Archive" class="w-4 h-4" />
        {{ vueArchives ? 'Revenir au parc' : `Archives (${store.archives.length})` }}
      </button>
      <button v-if="!vueArchives" :class="L.btnOutline" @click="importOuvert = true">
        <Upload class="w-4 h-4" />
        Importer le parc
      </button>
      <button v-if="!vueArchives" :class="L.btnPrimary" @click="showForm = true">
        <Plus class="w-4 h-4" />
        Ajouter un véhicule
      </button>
    </template>

    <template #above-table>
      <!-- US 2.1.5 - la sortie du parc est une clôture de cycle de vie,
           pas un statut de plus : la vue le rappelle explicitement -->
      <div v-if="vueArchives"
        class="flex items-start gap-2.5 bg-gray-100 text-gray-600 rounded-lg px-3.5 py-2.5 mb-3.5">
        <Archive class="w-4 h-4 shrink-0 mt-px" />
        <p class="text-xs leading-relaxed">
          Ces {{ store.archives.length }} véhicule(s) sont sortis du parc. Ils n’entrent plus
          dans les affectations ni dans les indicateurs de disponibilité, mais leur historique
          d’interventions, leurs documents et leurs sinistres restent consultables et opposables.
          Leurs plaques demeurent réservées.
        </p>
      </div>

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
        <SearchableDropdown
          v-model="filterStatut"
          :items="optfilterStatut"
          placeholder="Tous (parc courant)"
          compact
        />
      </div>
      <div>
        <label :class="L.fpFieldLabel">Site</label>
        <SearchableDropdown
          v-model="filterSite" :items="optionsSites"
          placeholder="Tous les sites" compact
        />
      </div>
      <button class="mt-auto py-[7px] bg-transparent border-0 text-xs text-muted-foreground cursor-pointer hover:text-primary" @click="resetFilters">
        Réinitialiser
      </button>
    </template>

    <!-- Colonnes -->
    <!-- US 2.1.2 - la remorque attelée se lit sans ouvrir la fiche -->
    <template #cell-plaque="{ item }">
      <button class="text-left bg-transparent border-0 p-0 cursor-pointer group" @click="openCard(item.id)">
        <span class="font-mono font-semibold text-foreground group-hover:text-primary group-hover:underline block">
          {{ item.plaque }}
        </span>
        <span v-if="item.vehiculeLiePlaque" class="font-mono text-[11px] text-primary flex items-center gap-1 mt-0.5">
          <Link2 class="w-3 h-3" />{{ item.vehiculeLiePlaque }}
        </span>
        <span v-else-if="item.typeVehicule === 'tracteur'" class="text-[11px] text-gray-400 mt-0.5 block">
          non attelé
        </span>
      </button>
    </template>

    <template #cell-chauffeur="{ item }">
      <span v-if="item.chauffeurNom" class="text-xs text-gray-600">{{ item.chauffeurNom }}</span>
      <span v-else-if="item.typeVehicule === 'tracteur'" class="text-[11px] text-gray-400">non affecté</span>
      <span v-else class="text-gray-300">-</span>
    </template>

    <template #cell-typeVehicule="{ item }">
      <span :class="item.typeVehicule === 'tracteur' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'"
        class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">
        {{ item.typeVehicule }}
      </span>
    </template>

    <template #cell-marque="{ item }">
      <span class="font-medium text-foreground">{{ item.marque ?? '-' }}</span>
      <span v-if="item.modele" class="text-muted-foreground text-xs"> / {{ item.modele }}</span>
    </template>

    <template #cell-statutAdmin="{ item }">
      <span :class="statutClass(item.statutAdmin)" class="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
        {{ statutLabel(item.statutAdmin) }}
      </span>
    </template>

    <!-- US 2.1.5 - visible uniquement dans la vue des véhicules sortis -->
    <template #cell-sortie="{ item }">
      <span v-if="item.sortie" class="text-xs">
        <span class="text-foreground">{{ LIB_MOTIF_SORTIE[item.sortie.motif] }}</span>
        <span class="text-muted-foreground text-[11px] block">{{ fmtDate(item.sortie.date) }}</span>
      </span>
      <span v-else class="text-gray-300">-</span>
    </template>

    <template #cell-site="{ item }">
      <span class="text-xs text-gray-600">{{ item.siteAffectation ?? '-' }}</span>
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
            <div class="text-muted-foreground text-[11px]">Chauffeur</div>{{ item.chauffeurNom ?? '-' }}
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">{{ item.typeVehicule === 'tracteur' ? 'Remorque' : 'Tracteur' }}</div>
            <span class="font-mono">{{ item.vehiculeLiePlaque ?? '-' }}</span>
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Site</div>{{ item.siteAffectation ?? '-' }}
          </div>
          <div v-if="item.typeVehicule === 'tracteur' && item.kilometrage != null">
            <div class="text-muted-foreground text-[11px]">Kilométrage</div>{{ item.kilometrage.toLocaleString('fr-FR') }} km
          </div>
        </div>
        <!-- US 2.1.5 - la sortie porte son motif, sa date et son auteur -->
        <div v-if="item.sortie" class="bg-gray-100 rounded-md px-2.5 py-2">
          <p class="text-xs font-semibold text-gray-700">{{ LIB_MOTIF_SORTIE[item.sortie.motif] }}</p>
          <p class="text-[11px] text-gray-500 mt-0.5">
            Sorti le {{ fmtDate(item.sortie.date) }} par {{ item.sortie.par }}
            <template v-if="item.sortie.kilometrageSortie">
              · {{ item.sortie.kilometrageSortie.toLocaleString('fr-FR') }} km au compteur
            </template>
          </p>
          <p v-if="item.sortie.commentaire" class="text-[11px] text-gray-500 mt-1 leading-snug">
            {{ item.sortie.commentaire }}
          </p>
        </div>

        <button :class="L.btnPrimary" class="w-full justify-center" @click="openCard(item.id)">Ouvrir la fiche</button>

        <button v-if="item.sortie" :class="L.btnOutline" class="w-full justify-center"
          @click="reintegrer(item.id)">
          <Undo2 class="w-4 h-4" /> Réintégrer au parc
        </button>
      </div>
    </template>

    <template #empty>
      <component :is="vueArchives ? Archive : Truck" class="w-8 h-8" />
      <p class="text-sm">
        {{ vueArchives ? 'Aucun véhicule sorti du parc' : 'Aucun véhicule trouvé' }}
      </p>
    </template>

    <ImportParcModal
      v-if="importOuvert"
      @close="importOuvert = false"
      @imported="() => { importOuvert = false }"
    />

    <VehiculeCard v-if="selectedId !== null" :vehicule="store.getById(selectedId)!" @close="selectedId = null" />
    <VehiculeFormModal v-if="showForm" @close="showForm = false" />
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { AlertTriangle, Archive, Link2, Plus, Truck, Undo2, Upload } from 'lucide-vue-next'
import SearchableDropdown from '../../components/ui/SearchableDropdown.vue'
import type { DropdownItem } from '../../components/ui/SearchableDropdown.vue'
import { ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import VehiculeCard from '../../components/fleet/VehiculeCard.vue'
import ImportParcModal from '../../components/fleet/ImportParcModal.vue'
import VehiculeFormModal from '../../components/fleet/VehiculeFormModal.vue'
import { useVehiculesStore } from '../../stores/vehicules'
import type { Vehicule, StatutAdminVehicule } from '../../types'
import { LIB_MOTIF_SORTIE } from '../../types'
import { fmtDate } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'

const store    = useVehiculesStore()
const showForm = ref(false)

/* US 2.1.5 - un véhicule sorti du parc quitte la liste courante.
   Le sélecteur Statut « Archivés » est le seul chemin qui les ramène :
   sans cette bascule, un camion vendu resterait mêlé au parc actif et
   fausserait chaque total affiché à l'écran. */
const vueArchives = computed(() => filterStatut.value === 'archive')
const selectedId   = ref<string | null>(null)
const importOuvert = ref(false)

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
  const s = new Set(store.auParc.map(v => v.siteAffectation).filter(Boolean) as string[])
  return [...s].sort()
})

const optionsSites = computed<DropdownItem[]>(() =>
  sites.value.map(s => ({ id: s, label: s })))

/* Les indicateurs portent sur le parc courant : compter un camion vendu
   dans le total du parc gonflerait la flotte d'un véhicule qui n'existe plus. */
const kpis = computed(() => [
  { label: 'Parc courant', value: store.auParc.length,   icon: Truck,         bg: 'bg-primary/10', iconColor: 'text-primary'    },
  { label: 'Tracteurs',    value: store.tracteurs.length, icon: Truck,         bg: 'bg-blue-50',    iconColor: 'text-blue-600'   },
  { label: 'Remorques',    value: store.remorques.length, icon: Truck,         bg: 'bg-purple-50',  iconColor: 'text-purple-600' },
  { label: 'Immobilisés',  value: store.auParc.filter(v => v.statutAdmin === 'hors_service' || v.statutAdmin === 'en_reparation').length,
    icon: AlertTriangle, bg: 'bg-danger-bg', iconColor: 'text-danger' },
])

const sousTitre = computed(() => {
  const base = `${store.auParc.length} véhicule(s) au parc · tracteurs & remorques`
  return store.archives.length ? `${base} · ${store.archives.length} sorti(s) du parc` : base
})

const columns = computed<ListColumn[]>(() => {
  const base: ListColumn[] = [
    { key: 'plaque',       label: 'Véhicule',        sortable: true, width: 150 },
    { key: 'typeVehicule', label: 'Type',            width: 110 },
    { key: 'marque',       label: 'Marque / Modèle', width: 190 },
    { key: 'statutAdmin',  label: 'Statut',          sortable: true, width: 130 },
  ]
  /* La colonne Sortie remplace Chauffeur en vue archives : un véhicule
     sorti n'a plus de chauffeur, mais il a un motif de sortie. */
  return vueArchives.value
    ? [...base, { key: 'sortie', label: 'Sortie du parc', width: 180 },
                { key: 'site',   label: 'Dernier site',   width: 140 }]
    : [...base, { key: 'chauffeur', label: 'Chauffeur', width: 170 },
                { key: 'site',      label: 'Site',       width: 140 }]
})

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
    /* Le point du critère : hors sélection explicite de « Archivés »,
       un véhicule sorti du parc n'apparaît nulle part. */
    const estArchive = v.statutAdmin === 'archive'
    if (vueArchives.value ? !estArchive : estArchive) return false

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

/**
 * Bascule entre parc courant et véhicules sortis.
 * Les autres filtres sont remis à zéro : un filtre « en réparation »
 * conservé en vue archives ne renverrait jamais rien, et l'écran vide
 * passerait pour un défaut.
 */
function basculerArchives() {
  filterStatut.value = vueArchives.value ? '' : 'archive'
  activeScope.value  = ''
  filterSite.value   = ''
  searchQuery.value  = ''
  selectedId.value   = null
  page.value = 1
}

/** Réintègre un véhicule sorti par erreur - US 2.1.5. */
function reintegrer(id: string) {
  const res = store.reintegrer(id)
  if ('erreur' in res) alert(res.erreur)
}

const STATUT_MAP: Record<StatutAdminVehicule, { label: string; cls: string }> = {
  en_service:    { label: 'En service',    cls: 'bg-success-bg text-success' },
  actif:         { label: 'Actif',          cls: 'bg-success-bg text-success' },
  affecte:       { label: 'Affecté',        cls: 'bg-primary/10 text-primary' },
  en_reparation: { label: 'En réparation',  cls: 'bg-warning-bg text-warning' },
  hors_service:  { label: 'Hors service',   cls: 'bg-danger-bg text-danger'   },
  vendu:         { label: 'Vendu',          cls: 'bg-gray-100 text-gray-500'  },
  archive:       { label: 'Archivé',        cls: 'bg-gray-100 text-gray-400'  },
}
const statutLabel = (s: StatutAdminVehicule) => STATUT_MAP[s]?.label ?? s
const statutClass = (s: StatutAdminVehicule) => STATUT_MAP[s]?.cls ?? ''

const optfilterStatut: DropdownItem[] = [
          { id: 'actif', label: "Actif" },
          { id: 'affecte', label: "Affecté" },
          { id: 'en_reparation', label: "En réparation" },
          { id: 'hors_service', label: "Hors service" },
          { id: 'vendu', label: "Vendu" },
          { id: 'archive', label: "Archivés - sortis du parc" },
]
</script>
