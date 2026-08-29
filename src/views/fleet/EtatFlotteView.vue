<template>
  <ListPageLayout
    title="État de flotte"
    :subtitle="sousTitre"
    :columns="columns"
    row-key="vehiculeId"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} véhicule(s)`"
    search-placeholder="Plaque, chauffeur, voyage…"
    scope-label="Groupe :"
    :scope-options="scopeOptions"
    v-model:scope="activeScope"
    v-model:search-query="searchQuery"
    v-model:sort-key="sortKey"
    v-model:sort-dir="sortDir"
    v-model:page="page"
    v-model:page-size="pageSize"
    @reset-filters="resetFilters"
  >
    <template #header-actions>
      <SearchableDropdown
        v-model="dateAffichee" :items="optionsJours"
        placeholder="Situation du jour" compact class="mr-2"
      />
      <button :class="L.btnOutline" @click="archiver">
        <Archive class="w-4 h-4" />
        Archiver
      </button>
      <button v-if="etatConsulte && !etatConsulte.transmisLe" :class="L.btnOutline"
        title="Marquer l’état comme transmis au client : son contenu sera figé"
        @click="marquerTransmis">
        <Send class="w-4 h-4" />
        Marquer transmis
      </button>
      <button :class="L.btnOutline" @click="exporter">
        <Download class="w-4 h-4" />
        Exporter
      </button>
    </template>

    <template #above-table>
      <!-- US 2.2.4 - la nature de la pièce consultée, et ce qui la rend opposable -->
      <div v-if="etatConsulte"
        class="flex items-start gap-2.5 rounded-lg px-3.5 py-2.5 mb-3.5"
        :class="etatConsulte.rectifieDe ? 'bg-warning-bg text-warning' : 'bg-gray-100 text-gray-600'">
        <FileCheck2 class="w-4 h-4 shrink-0 mt-px" />
        <div class="text-xs leading-relaxed">
          <template v-if="etatConsulte.rectifieDe">
            <strong>Rectificatif, version {{ etatConsulte.version }}.</strong>
            Il corrige l’état {{ etatConsulte.rectifieDe }} sans l’effacer :
            la version initiale reste consultable et opposable pour la période
            où elle a fait foi. Motif de la rectification : {{ etatConsulte.motifRectification }}.
          </template>
          <template v-else>
            <strong>Pièce opposable, non modifiable.</strong>
            Produit par {{ etatConsulte.produitPar }}.
          </template>
          <template v-if="etatConsulte.transmisLe">
            Transmis au client le {{ fmtDate(etatConsulte.transmisLe.slice(0, 10)) }} :
            son contenu est figé. Une correction ne l’écrase pas, elle produit un rectificatif.
          </template>
          <template v-else>
            Non encore transmis au client : tant qu’il ne l’est pas, cet état reste un brouillon
            et se régénère librement.
          </template>
        </div>
      </div>

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
        <label :class="L.fpFieldLabel">État</label>
        <SearchableDropdown
          v-model="filterEtat" :items="optEtats"
          placeholder="Tous" compact
        />
      </div>
      <div>
        <label :class="L.fpFieldLabel">Immobilisation</label>
        <SearchableDropdown
          v-model="filterImmo"
          :items="optfilterImmo"
          placeholder="Tous"
          compact
        />
      </div>
      <button class="mt-auto py-[7px] bg-transparent border-0 text-xs text-muted-foreground cursor-pointer hover:text-primary"
        @click="resetFilters">
        Réinitialiser
      </button>
    </template>

    <template #cell-vehicule="{ item }">
      <span class="font-mono font-semibold text-foreground">{{ item.vehiculePlaque }}</span>
      <div v-if="item.citernePlaque" class="text-[11px] text-muted-foreground font-mono">
        {{ item.citernePlaque }}
      </div>
    </template>

    <template #cell-chauffeur="{ item }">
      <span class="text-xs">{{ item.chauffeurNom ?? 'Non assigné' }}</span>
      <div v-if="item.voyageRef" class="text-[11px] text-muted-foreground font-mono">
        {{ item.voyageRef }}
      </div>
    </template>

    <template #cell-etat="{ item }">
      <span class="text-[11px] font-mono font-bold px-2 py-0.5 rounded" :class="CLS_GROUPE[groupeDeLEtat(item.etat)]">
        {{ item.etat }}
      </span>
      <div class="text-[11px] text-muted-foreground">{{ libelleEtat(item.etat) }}</div>
    </template>

    <template #cell-immobilisation="{ item }">
      <template v-if="item.codeIndispo">
        <span class="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-danger-bg text-danger">
          {{ item.codeIndispo }}
        </span>
        <div class="text-[11px] text-muted-foreground">{{ item.motifIndispo }}</div>
      </template>
      <span v-else class="text-[11px] text-success font-medium">Disponible</span>
    </template>

    <template #cell-remise="{ item }">
      <span v-if="item.remiseEnServicePrevue" class="text-xs">
        {{ fmtDate(item.remiseEnServicePrevue) }}
      </span>
      <span v-else class="text-gray-300">-</span>
    </template>

    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3">
        <div>
          <span class="text-[11px] font-mono font-bold px-2 py-0.5 rounded"
            :class="CLS_GROUPE[groupeDeLEtat(item.etat)]">{{ item.etat }}</span>
          <div class="font-mono font-semibold text-foreground mt-1.5">{{ item.vehiculePlaque }}</div>
          <div class="text-xs text-muted-foreground">{{ libelleEtat(item.etat) }}</div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <div v-if="item.citernePlaque">
            <div class="text-muted-foreground text-[11px]">Citerne</div>
            <span class="font-mono">{{ item.citernePlaque }}</span>
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Chauffeur</div>{{ item.chauffeurNom ?? 'Non assigné' }}
          </div>
          <div v-if="item.voyageRef" class="col-span-2">
            <div class="text-muted-foreground text-[11px]">Voyage</div>
            <span class="font-mono">{{ item.voyageRef }}</span>
          </div>
        </div>

        <div v-if="item.codeIndispo" class="bg-danger-bg text-danger rounded-md px-2.5 py-2 text-[11px] leading-snug">
          <strong class="font-mono">{{ item.codeIndispo }}</strong> - {{ item.motifIndispo }}
          <div v-if="item.remiseEnServicePrevue" class="mt-1">
            Remise en service prévue le {{ fmtDate(item.remiseEnServicePrevue) }}.
          </div>
        </div>

        <p v-if="item.observation" class="text-[11px] text-muted-foreground leading-snug">
          {{ item.observation }}
        </p>
      </div>
    </template>

    <template #empty>
      <ClipboardList class="w-8 h-8" />
      <p class="text-sm">Aucun véhicule</p>
    </template>
  </ListPageLayout>

  <!-- ══ US 2.2.4 - Rectification d'un état transmis ═══════════
       Un état transmis ne s'écrase pas. La correction passe par ici,
       elle exige un motif et laisse les deux versions consultables. -->
  <Teleport to="body">
    <div v-if="demandeRectification"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
      @click.self="demandeRectification = ''">
      <div class="bg-card rounded-lg border border-border shadow-lg w-full max-w-lg p-4">
        <h3 class="text-sm font-semibold text-foreground mb-2">État déjà transmis</h3>
        <p class="text-xs text-muted-foreground leading-relaxed">{{ demandeRectification }}</p>

        <div class="flex flex-col gap-1 mt-3.5">
          <label class="text-xs font-medium text-foreground">
            Motif de la rectification <span class="text-danger">*</span>
          </label>
          <textarea v-model="motifRectification" rows="3"
            class="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Ex. : le code d’indisponibilité de MG-3356-TX était VET, il aurait dû être MTN." />
        </div>

        <p v-if="erreurRectification" class="text-[11px] text-danger flex items-start gap-1.5 mt-2">
          <AlertCircle class="w-3.5 h-3.5 shrink-0 mt-px" /> {{ erreurRectification }}
        </p>

        <div class="flex justify-end gap-2 mt-4">
          <button :class="L.btnOutline" @click="demandeRectification = ''">Annuler</button>
          <button :class="L.btnPrimary" @click="confirmerRectification">
            Produire le rectificatif
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/* row-key="vehiculeId" : LigneEtatFlotte n'a pas de champ id : sans clé explicite, toutes les lignes
   sont indistinguables, la sélection porte sur le tableau entier et l'aperçu
   affiche toujours le premier véhicule. */
/**
 * US 2.2.4 - État de flotte quotidien.
 *
 * GTD produit chaque jour ce fichier à la main sous Excel, puis l'envoie
 * par courriel à son client. Les treize codes affichés sont repris tels
 * quels des courriels « ÉTAT FLOTTE GTD LPSA » et « CC immobilisé base TVE ».
 *
 * La date prévisionnelle de remise en service est renseignée quand elle est
 * connue ; la colonne reste vide sinon.
 */
import { ref, computed, watch } from 'vue'
import SearchableDropdown from '../../components/ui/SearchableDropdown.vue'
import type { DropdownItem } from '../../components/ui/SearchableDropdown.vue'
import {
  ClipboardList, Download, Archive, Truck, Route, Clock, AlertTriangle,
  FileCheck2, Send, AlertCircle,
} from 'lucide-vue-next'
import { ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import { useFlotteStore } from '../../stores/flotte'
import { useAuthStore } from '../../stores/auth'
import { ETATS_FLOTTE, groupeDeLEtat, libelleEtat } from '../../types/flotte'
import type { GroupeEtatFlotte } from '../../types/flotte'
import { fmtDate } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'

const store = useFlotteStore()

/* Une date rectifiée porte son numéro de version dans le libellé. */
const optionsJours = computed(() =>
  store.joursArchives.map(j => {
    const v = store.etatDuJour(j)?.version ?? 1
    return { id: j, label: `État du ${fmtDate(j)}${v > 1 ? ` (v${v})` : ''}` }
  }))
const auth  = useAuthStore()

const searchQuery = ref('')
const activeScope = ref('')
const filterEtat  = ref('')
const filterImmo  = ref('')
const sortKey     = ref('')
const sortDir     = ref<'asc' | 'desc'>('asc')
const page        = ref(1)
const pageSize    = ref(20)

const dateDuJour = new Date().toLocaleDateString('fr-FR', {
  day: '2-digit', month: 'long', year: 'numeric',
})

const CLS_GROUPE: Record<GroupeEtatFlotte, string> = {
  operationnel: 'bg-success-bg text-success',
  transit:      'bg-info-bg text-info',
  attente:      'bg-warning-bg text-warning',
}

const scopeOptions = [
  { value: '',             label: 'Tous les groupes' },
  { value: 'operationnel', label: 'Opérationnel' },
  { value: 'transit',      label: 'En transit' },
  { value: 'attente',      label: 'En attente' },
]

const kpis = computed(() => [
  { label: 'Opérationnels', value: String(store.etatParGroupe.operationnel ?? 0),
    icon: Truck, bg: 'bg-success-bg', iconColor: 'text-success' },
  { label: 'En transit',    value: String(store.etatParGroupe.transit ?? 0),
    icon: Route, bg: 'bg-info-bg', iconColor: 'text-info' },
  { label: 'En attente',    value: String(store.etatParGroupe.attente ?? 0),
    icon: Clock, bg: 'bg-warning-bg', iconColor: 'text-warning' },
  { label: 'Immobilisés',   value: String(store.immobilises.length),
    icon: AlertTriangle, bg: 'bg-danger-bg', iconColor: 'text-danger' },
])

const columns = computed<ListColumn[]>(() => [
  { key: 'vehicule',       label: 'Véhicule',       sortable: true, width: 160 },
  { key: 'chauffeur',      label: 'Chauffeur',      width: 190 },
  { key: 'etat',           label: 'État',           sortable: true, width: 190 },
  { key: 'immobilisation', label: 'Immobilisation', width: 230 },
  { key: 'remise',         label: 'Remise en service', width: 150 },
])

watch([activeScope, filterEtat, filterImmo, searchQuery, pageSize], () => { page.value = 1 })

function resetFilters() {
  activeScope.value = ''
  filterEtat.value = ''
  filterImmo.value = ''
  searchQuery.value = ''
  page.value = 1
}

/* US 2.2.4 - L'état d'un jour passé reste consultable : c'est la preuve
   de ce qui a été déclaré au client à cette date. */
const dateAffichee = ref('')

const lignesSource = computed(() =>
  dateAffichee.value
    ? (store.etatDuJour(dateAffichee.value)?.lignes ?? [])
    : store.etatFlotte)

/** État actuellement consulté, ou null quand on regarde la situation vive. */
const etatConsulte = computed(() =>
  dateAffichee.value ? store.etatDuJour(dateAffichee.value) ?? null : null)

const sousTitre = computed(() => {
  const e = etatConsulte.value
  if (!e) return `Situation au ${dateDuJour} · ${store.immobilises.length} véhicule(s) immobilisé(s)`
  const nature = e.rectifieDe
    ? `rectificatif v${e.version}`
    : 'pièce opposable, non modifiable'
  return `État archivé du ${fmtDate(e.date)} - ${nature}`
})

/**
 * Archive l'état du jour.
 * Un état déjà transmis ne s'écrase pas : le store refuse et demande un
 * motif de rectification, que l'exploitant saisit avant de recommencer.
 */
function archiver() {
  const res = store.archiverEtat(auth.user?.name ?? 'Exploitation')
  if ('erreur' in res) {
    demandeRectification.value = res.erreur
    return
  }
  dateAffichee.value = res.etat.date
}

const demandeRectification = ref('')
const motifRectification   = ref('')
const erreurRectification  = ref('')

function confirmerRectification() {
  erreurRectification.value = ''
  if (!motifRectification.value.trim()) {
    erreurRectification.value = 'Le motif de la rectification est obligatoire.'
    return
  }
  const res = store.archiverEtat(auth.user?.name ?? 'Exploitation', motifRectification.value)
  if ('erreur' in res) {
    erreurRectification.value = res.erreur
    return
  }
  dateAffichee.value = res.etat.date
  demandeRectification.value = ''
  motifRectification.value = ''
}

/** Marque l'état consulté comme transmis : à partir de là, il est figé. */
function marquerTransmis() {
  if (!etatConsulte.value) return
  const res = store.marquerTransmis(etatConsulte.value.id)
  if ('erreur' in res) erreurRectification.value = res.erreur
}

const filtered = computed(() =>
  lignesSource.value.filter(l => {
    if (activeScope.value && groupeDeLEtat(l.etat) !== activeScope.value) return false
    if (filterEtat.value  && l.etat !== filterEtat.value) return false
    if (filterImmo.value === 'oui' && !l.codeIndispo) return false
    if (filterImmo.value === 'non' && l.codeIndispo)  return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!`${l.vehiculePlaque} ${l.citernePlaque ?? ''} ${l.chauffeurNom ?? ''} ${l.voyageRef ?? ''}`
        .toLowerCase().includes(q)) return false
    }
    return true
  }))

const totalCount = computed(() => filtered.value.length)

const pageItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

/** Export au format attendu par le client - une ligne par véhicule. */
function exporter() {
  const entetes = ['Tracteur', 'Citerne', 'Chauffeur', 'État', 'Libellé', 'Code indispo', 'Motif', 'Remise en service', 'Voyage', 'Observation']
  const lignes = filtered.value.map(l => [
    l.vehiculePlaque, l.citernePlaque ?? '', l.chauffeurNom ?? '',
    l.etat, libelleEtat(l.etat), l.codeIndispo ?? '', l.motifIndispo ?? '',
    l.remiseEnServicePrevue ?? '', l.voyageRef ?? '', l.observation ?? '',
  ])
  const csv = [entetes, ...lignes]
    .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `etat-flotte-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const optfilterImmo: DropdownItem[] = [
          { id: 'oui', label: "Immobilisés" },
          { id: 'non', label: "Disponibles" },
]

/* Le code identifie l'état, le libellé l'explique : les deux sont cherchables. */
const optEtats = computed<DropdownItem[]>(() =>
  ETATS_FLOTTE.map(e => ({ id: e.code, label: e.code, sublabel: e.libelle })))
</script>
