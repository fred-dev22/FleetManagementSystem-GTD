<template>
  <ListPageLayout
    title="Registres opérationnels"
    :subtitle="sousTitre"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="totalText"
    :search-placeholder="searchPlaceholder"
    scope-label="Registre :"
    :scope-options="scopeOptions"
    v-model:scope="vue"
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
      <div v-if="vue === 'medical'">
        <label :class="L.fpFieldLabel">Type d’examen</label>
        <select v-model="filterType" :class="L.fpSelect">
          <option value="">Tous</option>
          <option v-for="(lib, k) in LIB_EXAMEN" :key="k" :value="k">{{ lib }}</option>
        </select>
      </div>
      <div v-if="vue === 'remontees' || vue === 'ncr'">
        <label :class="L.fpFieldLabel">Statut</label>
        <select v-model="filterStatut" :class="L.fpSelect">
          <option value="">Tous</option>
          <option value="ouverte">Ouverte</option>
          <option :value="vue === 'ncr' ? 'en_traitement' : 'en_cours'">En traitement</option>
          <option value="close">Close</option>
        </select>
      </div>
      <div v-if="vue === 'safe'">
        <label :class="L.fpFieldLabel">Moment</label>
        <select v-model="filterMoment" :class="L.fpSelect">
          <option value="">Tous</option>
          <option value="chargement">Chargement</option>
          <option value="dechargement">Déchargement</option>
        </select>
      </div>
      <button class="mt-auto py-[7px] bg-transparent border-0 text-xs text-muted-foreground cursor-pointer hover:text-primary"
        @click="resetFilters">Réinitialiser</button>
    </template>

    <!-- ══════════ APTITUDE ET DÉPISTAGE ══════════ -->
    <template #cell-chauffeur="{ item }">
      <span class="font-medium text-foreground">{{ item.chauffeurNom }}</span>
    </template>

    <template #cell-examen="{ item }">
      <span class="text-xs">{{ item.type ? LIB_EXAMEN[item.type] : '—' }}</span>
    </template>

    <template #cell-dateExamen="{ item }">
      <span class="text-xs">{{ fmtDate(item.date) }}</span>
    </template>

    <template #cell-resultat="{ item }">
      <span v-if="item.aptitude" :class="LIB_APTITUDE[item.aptitude].cls"
        class="text-xs font-medium px-2 py-0.5 rounded-full">{{ LIB_APTITUDE[item.aptitude].label }}</span>
      <span v-else-if="item.positif === false" class="text-xs font-medium px-2 py-0.5 rounded-full bg-success-bg text-success">Négatif</span>
      <span v-else-if="item.positif === true" class="text-xs font-medium px-2 py-0.5 rounded-full bg-danger-bg text-danger">Positif</span>
      <span v-else class="text-gray-300">—</span>
    </template>

    <template #cell-validite="{ item }">
      <span v-if="item.valableJusquau" class="text-xs"
        :class="+new Date(item.valableJusquau) < Date.now() ? 'text-danger font-medium' : ''">
        {{ fmtDate(item.valableJusquau) }}
      </span>
      <span v-else class="text-gray-300">—</span>
      <div v-if="item.valableJusquau && +new Date(item.valableJusquau) < Date.now()"
        class="text-[11px] text-danger">Affectation bloquée</div>
    </template>

    <!-- ══════════ REMONTÉES CHAUFFEURS ══════════ -->
    <template #cell-auteur="{ item }">
      <span class="font-medium text-foreground">{{ item.chauffeurNom }}</span>
      <div v-if="item.vehiculePlaque" class="text-[11px] text-muted-foreground font-mono">{{ item.vehiculePlaque }}</div>
    </template>

    <template #cell-categorie="{ item }">
      <span class="text-xs">{{ item.categorie ? LIB_CATEGORIE_REMONTEE[item.categorie] : '—' }}</span>
    </template>

    <template #cell-objet="{ item }">
      <span class="text-xs font-medium text-foreground">{{ item.objet }}</span>
    </template>

    <template #cell-delai="{ item }">
      <span class="text-xs" :class="(item.delaiH ?? 0) > 24 ? 'text-danger font-medium' : ''">
        {{ item.delaiH != null ? item.delaiH + ' h' : '—' }}
      </span>
    </template>

    <template #cell-statutRemontee="{ item }">
      <span class="text-xs font-medium px-2 py-0.5 rounded-full" :class="CLS_REMONTEE[item.statut as StatutRemontee]">
        {{ LIB_STATUT_REMONTEE[item.statut as StatutRemontee] }}
      </span>
    </template>

    <!-- ══════════ SAFE TO LOAD / UNLOAD ══════════ -->
    <template #cell-moment="{ item }">
      <span class="text-xs font-medium">
        {{ item.moment === 'chargement' ? 'Safe to Load' : 'Safe to Unload' }}
      </span>
      <div class="text-[11px] text-muted-foreground font-mono">{{ item.voyageRef }}</div>
    </template>

    <template #cell-site="{ item }">
      <span class="text-xs">{{ item.siteNom }}</span>
    </template>

    <template #cell-dateSafe="{ item }">
      <span class="text-xs">{{ fmtDateTime(item.date) }}</span>
      <div class="text-[11px] text-muted-foreground">{{ item.controleur }}</div>
    </template>

    <template #cell-anomalies="{ item }">
      <span v-if="item.nbAnomalies" class="text-xs font-semibold text-warning">{{ item.nbAnomalies }}</span>
      <span v-else class="text-xs text-success">Aucune</span>
    </template>

    <template #cell-verdict="{ item }">
      <span v-if="item.rejet" class="text-xs font-medium px-2 py-0.5 rounded-full bg-danger-bg text-danger">Rejet</span>
      <span v-else class="text-xs font-medium px-2 py-0.5 rounded-full bg-success-bg text-success">Autorisé</span>
    </template>

    <!-- ══════════ NON-CONFORMITÉS CLIENT ══════════ -->
    <template #cell-reference="{ item }">
      <span class="font-mono font-semibold text-foreground">{{ item.reference }}</span>
      <div v-if="item.voyageRef" class="text-[11px] text-muted-foreground font-mono">{{ item.voyageRef }}</div>
    </template>

    <template #cell-client="{ item }">
      <span class="text-xs">{{ item.clientNom }}</span>
    </template>

    <template #cell-nature="{ item }">
      <span class="text-xs">{{ item.nature ? LIB_NATURE_NCR[item.nature] : '—' }}</span>
    </template>

    <template #cell-gravite="{ item }">
      <span class="text-xs font-medium px-2 py-0.5 rounded-full" :class="CLS_GRAVITE_NCR[item.gravite as GraviteNCR]">
        {{ item.gravite }}
      </span>
    </template>

    <template #cell-echeance="{ item }">
      <span class="text-xs">{{ fmtDate(item.echeance) }}</span>
    </template>

    <template #cell-statutNCR="{ item }">
      <span class="text-xs font-medium px-2 py-0.5 rounded-full" :class="CLS_STATUT_NCR[item.statut as StatutNCR]">
        {{ LIB_STATUT_NCR[item.statut as StatutNCR] }}
      </span>
    </template>

    <!-- Panneau d'aperçu, comme sur toutes les autres listes -->
    <template #details-panel="{ item }">
      <!-- Médical -->
      <div v-if="vue === 'medical'" class="flex flex-col gap-3">
        <div>
          <span v-if="item.aptitude" :class="LIB_APTITUDE[item.aptitude].cls"
            class="text-xs font-medium px-2 py-0.5 rounded-full">{{ LIB_APTITUDE[item.aptitude].label }}</span>
          <div class="font-medium text-foreground mt-1.5">{{ item.chauffeurNom }}</div>
          <div class="text-xs text-muted-foreground">{{ item.type ? LIB_EXAMEN[item.type] : '' }}</div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div><div class="text-muted-foreground text-[11px]">Date</div>{{ fmtDate(item.date) }}</div>
          <div><div class="text-muted-foreground text-[11px]">Valable jusqu’au</div>{{ fmtDate(item.valableJusquau) }}</div>
          <div class="col-span-2"><div class="text-muted-foreground text-[11px]">Praticien</div>{{ item.praticien ?? '—' }}</div>
        </div>
        <div v-if="item.restrictions" class="bg-warning-bg text-warning rounded-md px-2.5 py-2 text-[11px]">
          {{ item.restrictions }}
        </div>
        <div v-if="item.observation" class="text-[11px] text-muted-foreground">{{ item.observation }}</div>
      </div>

      <!-- Remontées -->
      <div v-else-if="vue === 'remontees'" class="flex flex-col gap-3">
        <div>
          <span class="text-xs font-medium px-2 py-0.5 rounded-full" :class="CLS_REMONTEE[item.statut as StatutRemontee]">
            {{ LIB_STATUT_REMONTEE[item.statut as StatutRemontee] }}
          </span>
          <div class="font-medium text-foreground mt-1.5">{{ item.objet }}</div>
          <div class="text-xs text-muted-foreground">{{ item.chauffeurNom }}</div>
        </div>
        <div v-if="item.description" class="text-xs text-foreground leading-relaxed">{{ item.description }}</div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div><div class="text-muted-foreground text-[11px]">Événement</div>{{ fmtDate(item.dateEvenement) }}</div>
          <div><div class="text-muted-foreground text-[11px]">Remontée</div>{{ fmtDate(item.dateRemontee) }}</div>
        </div>
        <div v-if="item.reponse" class="bg-success-bg text-success rounded-md px-2.5 py-2 text-[11px]">
          {{ item.reponse }}
        </div>
        <button v-if="item.statut !== 'close'" :class="L.btnOutline" class="w-full justify-center"
          @click="item.id && store.cloturerRemontee(item.id, 'Traitée par l’exploitation.', 'Exploitation')">
          Clôturer la remontée
        </button>
      </div>

      <!-- Safe to Load / Unload : la check-list complète -->
      <div v-else-if="vue === 'safe'" class="flex flex-col gap-2.5">
        <div>
          <span class="text-xs font-medium px-2 py-0.5 rounded-full"
            :class="item.rejet ? 'bg-danger-bg text-danger' : 'bg-success-bg text-success'">
            {{ item.rejet ? 'Rejet' : 'Autorisé' }}
          </span>
          <div class="font-medium text-foreground mt-1.5">
            {{ item.moment === 'chargement' ? 'Safe to Load' : 'Safe to Unload' }}
          </div>
          <div class="text-xs text-muted-foreground">{{ item.siteNom }}</div>
        </div>
        <ul class="flex flex-col gap-1">
          <li v-for="pt in (item.points ?? [])" :key="pt.code"
            class="flex items-start gap-1.5 rounded px-2 py-1"
            :class="pt.conforme === false ? 'bg-danger-bg' : 'bg-background'">
            <component :is="pt.conforme === false ? XCircle : CheckCircle2" class="w-3 h-3 shrink-0 mt-0.5"
              :class="pt.conforme === false ? 'text-danger' : 'text-success'" />
            <div class="min-w-0">
              <p class="text-[11px]" :class="pt.conforme === false ? 'text-danger font-medium' : 'text-foreground'">
                {{ pt.libelle }}
              </p>
              <p v-if="pt.observation" class="text-[10px] text-muted-foreground">{{ pt.observation }}</p>
            </div>
          </li>
        </ul>
      </div>

      <!-- Non-conformité client : l'analyse de cause -->
      <div v-else class="flex flex-col gap-3">
        <div>
          <span class="text-xs font-medium px-2 py-0.5 rounded-full" :class="CLS_STATUT_NCR[item.statut as StatutNCR]">
            {{ LIB_STATUT_NCR[item.statut as StatutNCR] }}
          </span>
          <div class="font-mono font-semibold text-foreground mt-1.5">{{ item.reference }}</div>
          <div class="text-xs text-muted-foreground">{{ item.clientNom }}</div>
        </div>
        <div class="text-xs text-foreground leading-relaxed">{{ item.description }}</div>
        <div class="flex flex-col gap-2 text-xs">
          <div><div class="text-muted-foreground text-[11px]">Cause immédiate</div>{{ item.causeImmediate ?? '—' }}</div>
          <div><div class="text-muted-foreground text-[11px]">Cause profonde</div>{{ item.causeProfonde ?? '—' }}</div>
          <div><div class="text-muted-foreground text-[11px]">Action corrective</div>{{ item.actionCorrective ?? '—' }}</div>
          <div><div class="text-muted-foreground text-[11px]">Responsable</div>{{ item.responsable ?? '—' }}</div>
        </div>
        <button v-if="item.statut !== 'close'" :class="L.btnOutline" class="w-full justify-center"
          @click="item.id && store.cloturerNCR(item.id)">
          Clôturer la non-conformité
        </button>
      </div>
    </template>

    <template #empty>
      <ClipboardCheck class="w-8 h-8" />
      <p class="text-sm">{{ messageVide }}</p>
    </template>
  </ListPageLayout>
</template>

<script setup lang="ts">
/**
 * Registres opérationnels — quatre registres réunis sous une seule coquille.
 * Même modèle d'affichage que toutes les autres listes de l'application :
 * ListPageLayout, indicateurs au-dessus, filtres, panneau d'aperçu à droite.
 */
import { ref, computed, watch } from 'vue'
import { ClipboardCheck, CheckCircle2, XCircle, Stethoscope, ShieldAlert, MessageSquare, FileWarning } from 'lucide-vue-next'
import { ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import { useRegistresStore } from '../../stores/registres'
import { LIB_EXAMEN, LIB_APTITUDE, LIB_CATEGORIE_REMONTEE, LIB_NATURE_NCR } from '../../types/fms'
import type {
  TypeExamen, ResultatAptitude, CategorieRemontee, StatutRemontee,
  MomentSafeCheck, PointSafeCheck, NatureNCR, GraviteNCR, StatutNCR,
} from '../../types/fms'
import { fmtDate, fmtDateTime } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'

const store = useRegistresStore()

type Vue = 'medical' | 'remontees' | 'safe' | 'ncr'

/** Ligne unifiée : chaque registre n'en renseigne que sa part. */
interface LigneRegistre {
  id?: string
  /* Médical */
  chauffeurNom?: string
  type?: TypeExamen
  date?: string
  positif?: boolean
  aptitude?: ResultatAptitude
  restrictions?: string
  valableJusquau?: string
  praticien?: string
  observation?: string
  /* Remontées */
  vehiculePlaque?: string
  categorie?: CategorieRemontee
  objet?: string
  description?: string
  dateEvenement?: string
  dateRemontee?: string
  statut?: string
  reponse?: string
  delaiH?: number | null
  /* Safe to Load */
  voyageRef?: string
  moment?: MomentSafeCheck
  siteNom?: string
  controleur?: string
  points?: PointSafeCheck[]
  rejet?: boolean
  nbAnomalies?: number
  /* NCR */
  reference?: string
  clientNom?: string
  nature?: NatureNCR
  gravite?: GraviteNCR
  echeance?: string
  causeImmediate?: string
  causeProfonde?: string
  actionCorrective?: string
  responsable?: string
}

const vue          = ref<Vue>('medical')
const searchQuery  = ref('')
const filterType   = ref('')
const filterStatut = ref('')
const filterMoment = ref('')
const sortKey      = ref('')
const sortDir      = ref<'asc' | 'desc'>('desc')
const page         = ref(1)
const pageSize     = ref(15)

const scopeOptions = [
  { value: 'medical',   label: 'Aptitude & dépistage' },
  { value: 'remontees', label: 'Remontées chauffeurs' },
  { value: 'safe',      label: 'Safe to Load / Unload' },
  { value: 'ncr',       label: 'Non-conformités client' },
]

const sousTitre = computed(() =>
  vue.value === 'medical'   ? `${store.visitesExpirees.length} visite(s) médicale(s) expirée(s) — affectation bloquée`
  : vue.value === 'remontees' ? `Remontée sous 24 h : ${store.tauxRemonteeSous24h} % · clôture : ${store.tauxClotureRemontees} %`
  : vue.value === 'safe'      ? 'Un rejet interdit l’opération de chargement ou de déchargement'
  : `Taux de clôture des non-conformités : ${store.tauxClotureNCR} %`)

const kpis = computed(() => [
  { label: 'Visites expirées',         value: String(store.visitesExpirees.length),
    icon: Stethoscope,   bg: 'bg-danger-bg',  iconColor: 'text-danger'  },
  { label: 'Positivité dépistage',     value: store.tauxPositivite + ' %',
    icon: ShieldAlert,   bg: 'bg-success-bg', iconColor: 'text-success' },
  { label: 'Remontées ouvertes',       value: String(store.remonteesOuvertes.length),
    icon: MessageSquare, bg: 'bg-info-bg',    iconColor: 'text-info'    },
  { label: 'Non-conformités ouvertes', value: String(store.ncrsOuvertes.length),
    icon: FileWarning,   bg: 'bg-warning-bg', iconColor: 'text-warning' },
])

/* ══ Colonnes selon le registre actif ══ */
const COLONNES: Record<Vue, ListColumn[]> = {
  medical: [
    { key: 'chauffeur',   label: 'Chauffeur',        sortable: true, width: 200 },
    { key: 'examen',      label: 'Examen',           width: 200 },
    { key: 'dateExamen',  label: 'Date',             sortable: true, width: 120 },
    { key: 'resultat',    label: 'Résultat',         width: 180 },
    { key: 'validite',    label: 'Valable jusqu’au', width: 170 },
  ],
  remontees: [
    { key: 'auteur',          label: 'Chauffeur', sortable: true, width: 180 },
    { key: 'categorie',       label: 'Catégorie', width: 180 },
    { key: 'objet',           label: 'Objet',     width: 300 },
    { key: 'delai',           label: 'Délai',     sortable: true, width: 100 },
    { key: 'statutRemontee',  label: 'Statut',    width: 120 },
  ],
  safe: [
    { key: 'moment',    label: 'Contrôle',  width: 190 },
    { key: 'site',      label: 'Site',      width: 220 },
    { key: 'dateSafe',  label: 'Date',      sortable: true, width: 190 },
    { key: 'anomalies', label: 'Anomalies', width: 120 },
    { key: 'verdict',   label: 'Verdict',   width: 120 },
  ],
  ncr: [
    { key: 'reference',  label: 'Référence', sortable: true, width: 170 },
    { key: 'client',     label: 'Client',    width: 120 },
    { key: 'nature',     label: 'Nature',    width: 140 },
    { key: 'gravite',    label: 'Gravité',   width: 110 },
    { key: 'echeance',   label: 'Échéance',  sortable: true, width: 120 },
    { key: 'statutNCR',  label: 'Statut',    width: 140 },
  ],
}

const columns = computed(() => COLONNES[vue.value])

const searchPlaceholder = computed(() =>
  vue.value === 'medical'   ? 'Chauffeur, praticien…'
  : vue.value === 'remontees' ? 'Chauffeur, objet, véhicule…'
  : vue.value === 'safe'      ? 'Site, voyage, contrôleur…'
  : 'Référence, client, description…')

const messageVide = computed(() =>
  vue.value === 'medical'   ? 'Aucun examen enregistré'
  : vue.value === 'remontees' ? 'Aucune remontée'
  : vue.value === 'safe'      ? 'Aucun contrôle enregistré'
  : 'Aucune non-conformité')

/* ══ Données ══ */
const donnees = computed<LigneRegistre[]>(() => {
  const q = searchQuery.value.toLowerCase()

  if (vue.value === 'medical') {
    return store.examens.filter(e => {
      if (filterType.value && e.type !== filterType.value) return false
      if (q && !`${e.chauffeurNom} ${e.praticien ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }

  if (vue.value === 'remontees') {
    return store.remontees.filter(r => {
      if (filterStatut.value && r.statut !== filterStatut.value) return false
      if (q && !`${r.chauffeurNom} ${r.objet} ${r.vehiculePlaque ?? ''}`.toLowerCase().includes(q)) return false
      return true
    }).map(r => ({
      ...r,
      delaiH: r.dateEvenement
        ? Math.round((+new Date(r.dateRemontee) - +new Date(r.dateEvenement)) / 3_600_000)
        : null,
    }))
  }

  if (vue.value === 'safe') {
    return store.safeChecks.filter(c => {
      if (filterMoment.value && c.moment !== filterMoment.value) return false
      if (q && !`${c.siteNom} ${c.voyageRef} ${c.controleur}`.toLowerCase().includes(q)) return false
      return true
    }).map(c => ({ ...c, nbAnomalies: c.points.filter(p => p.conforme === false).length }))
  }

  return store.ncrs.filter(n => {
    if (filterStatut.value && n.statut !== filterStatut.value) return false
    if (q && !`${n.reference} ${n.clientNom} ${n.description}`.toLowerCase().includes(q)) return false
    return true
  })
})

const totalCount = computed(() => donnees.value.length)

const totalText = computed(() =>
  vue.value === 'medical'   ? `${totalCount.value} examen(s)`
  : vue.value === 'remontees' ? `${totalCount.value} remontée(s)`
  : vue.value === 'safe'      ? `${totalCount.value} contrôle(s)`
  : `${totalCount.value} non-conformité(s)`)

const pageItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return donnees.value.slice(start, start + pageSize.value)
})

watch([vue, filterType, filterStatut, filterMoment, searchQuery, pageSize], () => { page.value = 1 })
watch(vue, () => { sortKey.value = ''; filterType.value = ''; filterStatut.value = ''; filterMoment.value = '' })

function resetFilters() {
  filterType.value = ''
  filterStatut.value = ''
  filterMoment.value = ''
  searchQuery.value = ''
  page.value = 1
}

/* ══ Libellés ══ */
const LIB_STATUT_REMONTEE: Record<StatutRemontee, string> = {
  ouverte: 'Ouverte', en_cours: 'En cours', close: 'Close',
}
const CLS_REMONTEE: Record<StatutRemontee, string> = {
  ouverte:  'bg-danger-bg text-danger',
  en_cours: 'bg-warning-bg text-warning',
  close:    'bg-success-bg text-success',
}
const CLS_GRAVITE_NCR: Record<GraviteNCR, string> = {
  mineure:  'bg-gray-100 text-gray-600',
  majeure:  'bg-warning-bg text-warning',
  critique: 'bg-danger-bg text-danger',
}
const LIB_STATUT_NCR: Record<StatutNCR, string> = {
  ouverte: 'Ouverte', en_traitement: 'En traitement', close: 'Close',
}
const CLS_STATUT_NCR: Record<StatutNCR, string> = {
  ouverte:       'bg-danger-bg text-danger',
  en_traitement: 'bg-warning-bg text-warning',
  close:         'bg-success-bg text-success',
}
</script>
