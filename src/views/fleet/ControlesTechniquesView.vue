<template>
  <ListPageLayout
    :title="vue === 'checklists' ? 'Contrôles techniques' : 'Contrôles techniques'"
    :subtitle="sousTitre"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="totalText"
    :search-placeholder="vue === 'checklists' ? 'Référence, plaque, chauffeur…' : 'Référence, plaque, auditeur…'"
    scope-label="Vue :"
    :scope-options="scopeOptions"
    v-model:scope="vue"
    v-model:search-query="searchQuery"
    v-model:sort-key="sortKey"
    v-model:sort-dir="sortDir"
    v-model:page="page"
    v-model:page-size="pageSize"
    @reset-filters="resetFilters"
    @open-card="(r: LigneControle) => r.id && openCard(r.id)"
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

    <!-- ══════════ CHECKLISTS SUR ROUTE ══════════ -->
    <template #cell-reference="{ item }">
      <button class="font-mono font-semibold text-foreground hover:text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer text-left"
        @click="item.id && openCard(item.id)">
        {{ item.reference }}
      </button>
      <div v-if="item.voyageRef" class="text-[11px] text-muted-foreground font-mono">{{ item.voyageRef }}</div>
    </template>

    <template #cell-vehicule="{ item }">
      <span class="font-mono text-xs">{{ item.tracteurPlaque }}</span>
      <div v-if="item.citernePlaque" class="text-[11px] text-muted-foreground font-mono">{{ item.citernePlaque }}</div>
    </template>

    <template #cell-chauffeur="{ item }">
      <span class="text-xs">{{ item.chauffeurNom }}</span>
    </template>

    <template #cell-pauses="{ item }">
      <span class="text-xs font-semibold">{{ item.nbReleves }}</span>
      <div class="text-[11px] text-muted-foreground">sur 11 possibles</div>
    </template>

    <template #cell-anomalies="{ item }">
      <span v-if="item.nbAnomalies" class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-danger-bg text-danger">
        {{ item.nbAnomalies }} anomalie(s)
      </span>
      <span v-else class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-success-bg text-success">
        Conforme
      </span>
    </template>

    <template #cell-signature="{ item }">
      <span class="text-[11px]" :class="item.signeParChauffeur ? 'text-success' : 'text-warning'">
        {{ item.signeParChauffeur ? 'Signée' : 'Non signée' }}
      </span>
      <div v-if="item.synchroniseLe" class="text-[11px] text-muted-foreground">
        synchro. {{ fmtDate(item.synchroniseLe) }}
      </div>
    </template>

    <!-- ══════════ AUDITS DE CONFORMITÉ ══════════ -->
    <template #cell-refAudit="{ item }">
      <button class="font-mono font-semibold text-foreground hover:text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer text-left"
        @click="item.id && openCard(item.id)">
        {{ item.reference }}
      </button>
    </template>

    <template #cell-auditeur="{ item }">
      <span class="text-xs">{{ item.auditeur }}</span>
    </template>

    <template #cell-postes="{ item }">
      <span class="text-xs">{{ item.nbPostes }} poste(s)</span>
      <div v-if="item.nbNonConformes" class="text-[11px] text-danger font-medium">
        {{ item.nbNonConformes }} non conforme(s)
      </div>
    </template>

    <template #cell-verdict="{ item }">
      <span class="text-[11px] font-medium px-2 py-0.5 rounded-full"
        :class="item.conforme ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'">
        {{ item.conforme ? 'Conforme' : 'Non conforme' }}
      </span>
    </template>

    <template #cell-contreVisite="{ item }">
      <span v-if="item.contreVisiteLe" class="text-xs text-warning font-medium">
        {{ fmtDate(item.contreVisiteLe) }}
      </span>
      <span v-else class="text-gray-300">-</span>
    </template>

    <template #cell-date="{ item }">
      <span class="text-xs">{{ fmtDate(item.dateAffichee) }}</span>
    </template>

    <!-- ══════════ APERÇU ══════════ -->
    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3">
        <div>
          <div class="font-mono font-semibold text-foreground">{{ item.reference }}</div>
          <div class="text-xs text-muted-foreground">
            {{ vue === 'checklists' ? 'Checklist sur route' : 'Audit de conformité' }}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div class="text-muted-foreground text-[11px]">Tracteur</div>
            <span class="font-mono">{{ item.tracteurPlaque }}</span>
          </div>
          <div v-if="item.citernePlaque">
            <div class="text-muted-foreground text-[11px]">Citerne</div>
            <span class="font-mono">{{ item.citernePlaque }}</span>
          </div>
          <div class="col-span-2">
            <div class="text-muted-foreground text-[11px]">
              {{ vue === 'checklists' ? 'Chauffeur' : 'Auditeur' }}
            </div>
            {{ item.chauffeurNom ?? item.auditeur }}
          </div>
        </div>

        <div v-if="vue === 'checklists' && item.nbAnomalies"
          class="bg-danger-bg text-danger rounded-md px-2.5 py-2 text-[11px] leading-snug">
          {{ item.nbAnomalies }} anomalie(s) relevée(s). Elles ont été signalées au responsable
          maintenance et au Control Room.
        </div>

        <div v-if="vue === 'audits' && !item.conforme"
          class="bg-danger-bg text-danger rounded-md px-2.5 py-2 text-[11px] leading-snug">
          {{ item.nbNonConformes }} poste(s) non conforme(s). Le véhicule ne peut pas être présenté
          au chargement tant que la contre-visite n’est pas passée.
        </div>

        <button :class="L.btnPrimary" class="w-full justify-center" @click="item.id && openCard(item.id)">
          Ouvrir la fiche
        </button>
      </div>
    </template>

    <template #empty>
      <ClipboardCheck class="w-8 h-8" />
      <p class="text-sm">{{ vue === 'checklists' ? 'Aucune checklist' : 'Aucun audit' }}</p>
    </template>

    <ChecklistCard
      v-if="selectedId && vue === 'checklists'"
      :checklist="store.checklists.find(c => c.id === selectedId)!"
      @close="selectedId = null"
      @navigate="(id: string) => (selectedId = id)"
    />

    <AuditCard
      v-if="selectedId && vue === 'audits'"
      :audit="store.audits.find(a => a.id === selectedId)!"
      @close="selectedId = null"
      @navigate="(id: string) => (selectedId = id)"
    />
  </ListPageLayout>
</template>

<script setup lang="ts">
/**
 * Contrôles techniques - deux vues qui partagent la même coquille.
 *
 * US 2.3.1 - Checklist sur route : 16 points, jusqu'à 11 pauses.
 *   Source : formulaire « Checklist sur Route » version 4.
 * US 2.3.2 - Audit de conformité : postes codés, prépare le vetting.
 *   Source : classeur « base gestion véhicule et maintenance ».
 */
import { ref, computed, watch } from 'vue'
import { ClipboardCheck, ShieldCheck, AlertTriangle, FileCheck } from 'lucide-vue-next'
import { ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import ChecklistCard from '../../components/fleet/ChecklistCard.vue'
import AuditCard from '../../components/fleet/AuditCard.vue'
import { useFlotteStore } from '../../stores/flotte'
import { fmtDate } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'

const store = useFlotteStore()

type Vue = 'checklists' | 'audits'

/** Ligne unifiée : chaque vue ne renseigne que sa part. */
interface LigneControle {
  id?: string
  reference?: string
  tracteurPlaque?: string
  citernePlaque?: string
  chauffeurNom?: string
  auditeur?: string
  voyageRef?: string
  dateAffichee?: string
  nbReleves?: number
  nbAnomalies?: number
  signeParChauffeur?: boolean
  synchroniseLe?: string
  nbPostes?: number
  nbNonConformes?: number
  conforme?: boolean
  contreVisiteLe?: string
}

const vue         = ref<Vue>('checklists')
const searchQuery = ref('')
const sortKey     = ref('')
const sortDir     = ref<'asc' | 'desc'>('desc')
const page        = ref(1)
const pageSize    = ref(15)
const selectedId  = ref<string | null>(null)

const scopeOptions = [
  { value: 'checklists', label: 'Checklists sur route' },
  { value: 'audits',     label: 'Audits de conformité' },
]

const sousTitre = computed(() =>
  vue.value === 'checklists'
    ? `16 points contrôlés à chaque pause · ${store.checklistsAvecAnomalie.length} checklist(s) avec anomalie`
    : `Postes codés préparant le vetting · ${store.auditsNonConformes.length} audit(s) non conforme(s)`)

const kpis = computed(() =>
  vue.value === 'checklists'
    ? [
        { label: 'Checklists',        value: String(store.checklists.length), icon: ClipboardCheck, bg: 'bg-primary/10', iconColor: 'text-primary' },
        { label: 'Avec anomalie',     value: String(store.checklistsAvecAnomalie.length), icon: AlertTriangle, bg: 'bg-danger-bg', iconColor: 'text-danger' },
        { label: 'Signées',           value: String(store.checklists.filter(c => c.signeParChauffeur).length), icon: FileCheck, bg: 'bg-success-bg', iconColor: 'text-success' },
        { label: 'Relevés totaux',    value: String(store.checklists.reduce((s, c) => s + c.releves.length, 0)), icon: ShieldCheck, bg: 'bg-info-bg', iconColor: 'text-info' },
      ]
    : [
        { label: 'Audits',            value: String(store.audits.length), icon: ClipboardCheck, bg: 'bg-primary/10', iconColor: 'text-primary' },
        { label: 'Non conformes',     value: String(store.auditsNonConformes.length), icon: AlertTriangle, bg: 'bg-danger-bg', iconColor: 'text-danger' },
        { label: 'Contre-visites',    value: String(store.audits.filter(a => a.contreVisiteLe).length), icon: FileCheck, bg: 'bg-warning-bg', iconColor: 'text-warning' },
        { label: 'Conformes',         value: String(store.audits.filter(a => a.conforme).length), icon: ShieldCheck, bg: 'bg-success-bg', iconColor: 'text-success' },
      ])

const COLONNES: Record<Vue, ListColumn[]> = {
  checklists: [
    { key: 'reference', label: 'Checklist',  sortable: true, width: 165 },
    { key: 'vehicule',  label: 'Véhicule',   width: 145 },
    { key: 'chauffeur', label: 'Chauffeur',  width: 185 },
    { key: 'pauses',    label: 'Relevés',    width: 120 },
    { key: 'anomalies', label: 'Résultat',   width: 140 },
    { key: 'signature', label: 'Signature',  width: 150 },
    { key: 'date',      label: 'Date',       sortable: true, width: 120 },
  ],
  audits: [
    { key: 'refAudit',      label: 'Audit',         sortable: true, width: 165 },
    { key: 'vehicule',      label: 'Véhicule',      width: 145 },
    { key: 'auditeur',      label: 'Auditeur',      width: 165 },
    { key: 'postes',        label: 'Postes',        width: 150 },
    { key: 'verdict',       label: 'Verdict',       width: 130 },
    { key: 'contreVisite',  label: 'Contre-visite', width: 140 },
    { key: 'date',          label: 'Date',          sortable: true, width: 120 },
  ],
}

const columns = computed(() => COLONNES[vue.value])

const totalText = computed(() =>
  vue.value === 'checklists' ? `${totalCount.value} checklist(s)` : `${totalCount.value} audit(s)`)

watch([vue, searchQuery, pageSize], () => { page.value = 1 })
watch(vue, () => { sortKey.value = ''; selectedId.value = null })

function resetFilters() {
  searchQuery.value = ''
  page.value = 1
}

const donnees = computed<LigneControle[]>(() => {
  const q = searchQuery.value.toLowerCase()

  if (vue.value === 'checklists') {
    return store.checklists
      .filter(c => !q || `${c.reference} ${c.tracteurPlaque} ${c.chauffeurNom}`.toLowerCase().includes(q))
      .map(c => ({
        id: c.id, reference: c.reference,
        tracteurPlaque: c.tracteurPlaque, citernePlaque: c.citernePlaque,
        chauffeurNom: c.chauffeurNom, voyageRef: c.voyageRef,
        dateAffichee: c.dateDebut,
        nbReleves: c.releves.length,
        nbAnomalies: store.anomaliesDe(c).length,
        signeParChauffeur: c.signeParChauffeur,
        synchroniseLe: c.synchroniseLe,
      }))
      .sort((a, b) => +new Date(b.dateAffichee!) - +new Date(a.dateAffichee!))
  }

  return store.audits
    .filter(a => !q || `${a.reference} ${a.tracteurPlaque} ${a.auditeur}`.toLowerCase().includes(q))
    .map(a => ({
      id: a.id, reference: a.reference,
      tracteurPlaque: a.tracteurPlaque, citernePlaque: a.citernePlaque,
      auditeur: a.auditeur, dateAffichee: a.date,
      nbPostes: a.resultats.length,
      nbNonConformes: a.resultats.filter(r => r.verdict === 'non_conforme').length,
      conforme: a.conforme, contreVisiteLe: a.contreVisiteLe,
    }))
    .sort((a, b) => +new Date(b.dateAffichee!) - +new Date(a.dateAffichee!))
})

const totalCount = computed(() => donnees.value.length)

const pageItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return donnees.value.slice(start, start + pageSize.value)
})

function openCard(id: string) { selectedId.value = id }
</script>
