<template>
  <ListPageLayout
    title="Assurances & sinistres"
    :subtitle="sousTitre"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="totalText"
    :search-placeholder="vue === 'sinistres' ? 'Référence, plaque, lieu…' : 'Plaque, compagnie, n° police…'"
    scope-label="Vue :"
    :scope-options="scopeOptions"
    v-model:scope="vue"
    v-model:search-query="searchQuery"
    v-model:sort-key="sortKey"
    v-model:sort-dir="sortDir"
    v-model:page="page"
    v-model:page-size="pageSize"
    @reset-filters="resetFilters"
    @open-card="(r: LigneAssurance) => vue === 'sinistres' && r.id && openCard(r.id)"
  >
    <template #above-table>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5">
        <div v-for="k in kpis" :key="k.label"
          class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
          <p class="text-xl font-bold leading-none" :class="k.cls">{{ k.value }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ k.label }}</p>
          <p v-if="k.cible" class="text-[11px] text-muted-foreground mt-0.5">{{ k.cible }}</p>
        </div>
      </div>
    </template>

    <!-- ══════════ SINISTRES ══════════ -->
    <template #cell-reference="{ item }">
      <button class="font-mono font-semibold text-foreground hover:text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer text-left"
        @click="item.id && openCard(item.id)">
        {{ item.reference }}
      </button>
      <div class="text-[11px] text-muted-foreground">{{ item.lieu }}</div>
    </template>

    <template #cell-vehicule="{ item }">
      <span class="font-mono text-xs">{{ item.vehiculePlaque }}</span>
      <div v-if="item.chauffeurNom" class="text-[11px] text-muted-foreground">{{ item.chauffeurNom }}</div>
    </template>

    <template #cell-gravite="{ item }">
      <span v-if="item.gravite" class="text-[11px] font-medium px-2 py-0.5 rounded-full"
        :class="LIB_GRAVITE_SINISTRE[item.gravite].cls">
        {{ LIB_GRAVITE_SINISTRE[item.gravite].label }}
      </span>
      <div v-if="item.responsabiliteGtd != null" class="text-[11px] mt-0.5"
        :class="item.responsabiliteGtd ? 'text-danger' : 'text-muted-foreground'">
        {{ item.responsabiliteGtd ? 'responsabilité GTD' : 'tiers responsable' }}
      </div>
    </template>

    <template #cell-dommages="{ item }">
      <span class="text-xs">{{ item.montantDommagesAr ? fmtAr(item.montantDommagesAr) : '-' }}</span>
    </template>

    <!-- L'indemnisation est suivie séparément du coût de réparation -->
    <template #cell-indemnisation="{ item }">
      <span v-if="item.statutIndemnisation" class="text-[11px] font-medium px-2 py-0.5 rounded-full"
        :class="CLS_INDEMNISATION[item.statutIndemnisation]">
        {{ LIB_INDEMNISATION[item.statutIndemnisation] }}
      </span>
      <div v-if="item.montantIndemniseAr" class="text-[11px] text-success mt-0.5">
        {{ fmtAr(item.montantIndemniseAr) }}
      </div>
    </template>

    <template #cell-reste="{ item }">
      <span class="text-xs font-semibold" :class="(item.resteACharge ?? 0) > 0 ? 'text-danger' : 'text-success'">
        {{ item.resteACharge != null ? fmtAr(item.resteACharge) : '-' }}
      </span>
    </template>

    <template #cell-date="{ item }">
      <span class="text-xs">{{ fmtDate(item.dateAffichee) }}</span>
    </template>

    <!-- ══════════ POLICES ══════════ -->
    <template #cell-police="{ item }">
      <span class="font-mono font-semibold text-foreground">{{ item.numeroPolice }}</span>
      <div class="text-[11px] text-muted-foreground">{{ item.compagnie }}</div>
    </template>

    <template #cell-couverture="{ item }">
      <span class="text-xs">{{ item.couverture }}</span>
    </template>

    <template #cell-echeance="{ item }">
      <span class="text-xs">{{ item.dateEcheance ? fmtDate(item.dateEcheance) : "-" }}</span>
      <div v-if="item.dateEcheance" class="text-[11px]" :class="clsEcheance(item.dateEcheance)">
        {{ libelleEcheance(item.dateEcheance) }}
      </div>
    </template>

    <template #cell-prime="{ item }">
      <span class="text-xs">{{ item.primeAnnuelleAr ? fmtAr(item.primeAnnuelleAr) : '-' }}</span>
      <div v-if="item.franchiseAr" class="text-[11px] text-muted-foreground">
        franchise {{ fmtAr(item.franchiseAr) }}
      </div>
    </template>

    <template #cell-statutPolice="{ item }">
      <span v-if="item.statut" class="text-[11px] font-medium px-2 py-0.5 rounded-full"
        :class="LIB_STATUT_POLICE[item.statut].cls">
        {{ LIB_STATUT_POLICE[item.statut].label }}
      </span>
    </template>

    <!-- ══════════ APERÇU ══════════ -->
    <template #details-panel="{ item }">
      <div v-if="vue === 'sinistres'" class="flex flex-col gap-3">
        <div>
          <span v-if="item.gravite" class="text-[11px] font-medium px-2 py-0.5 rounded-full"
            :class="LIB_GRAVITE_SINISTRE[item.gravite].cls">
            {{ LIB_GRAVITE_SINISTRE[item.gravite].label }}
          </span>
          <div class="font-mono font-semibold text-foreground mt-1.5">{{ item.reference }}</div>
          <div class="text-xs text-muted-foreground">{{ fmtDate(item.dateAffichee) }} · {{ item.lieu }}</div>
        </div>

        <p class="text-xs text-foreground leading-relaxed">{{ item.circonstances }}</p>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div class="text-muted-foreground text-[11px]">Véhicule</div>
            <span class="font-mono">{{ item.vehiculePlaque }}</span>
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Chauffeur</div>{{ item.chauffeurNom ?? '-' }}
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Dommages</div>
            {{ item.montantDommagesAr ? fmtAr(item.montantDommagesAr) : '-' }}
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Reste à charge</div>
            <span :class="(item.resteACharge ?? 0) > 0 ? 'text-danger font-medium' : 'text-success'">
              {{ item.resteACharge != null ? fmtAr(item.resteACharge) : '-' }}
            </span>
          </div>
        </div>

        <div v-if="item.ordreTravailId" class="bg-info-bg text-info rounded-md px-2.5 py-2 text-[11px] leading-snug">
          Ordre de travail ouvert : <strong class="font-mono">{{ item.ordreTravailId }}</strong>
        </div>

        <button :class="L.btnPrimary" class="w-full justify-center" @click="item.id && openCard(item.id)">
          Ouvrir la fiche
        </button>
      </div>

      <div v-else class="flex flex-col gap-3">
        <div>
          <span v-if="item.statut" class="text-[11px] font-medium px-2 py-0.5 rounded-full"
            :class="LIB_STATUT_POLICE[item.statut].cls">
            {{ LIB_STATUT_POLICE[item.statut].label }}
          </span>
          <div class="font-mono font-semibold text-foreground mt-1.5">{{ item.numeroPolice }}</div>
          <div class="text-xs text-muted-foreground">{{ item.compagnie }}</div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="col-span-2">
            <div class="text-muted-foreground text-[11px]">Couverture</div>{{ item.couverture }}
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Véhicule</div>
            <span class="font-mono">{{ item.vehiculePlaque }}</span>
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Échéance</div>{{ fmtDate(item.dateEcheance) }}
          </div>
        </div>

        <div v-if="item.statut === 'expiree'"
          class="bg-danger-bg text-danger rounded-md px-2.5 py-2 text-[11px] leading-snug">
          Police expirée. Le véhicule ne devrait pas rouler tant qu’elle n’est pas renouvelée.
        </div>
      </div>
    </template>

    <template #empty>
      <ShieldAlert class="w-8 h-8" />
      <p class="text-sm">{{ vue === 'sinistres' ? 'Aucun sinistre' : 'Aucune police' }}</p>
    </template>

    <SinistreCard
      v-if="selectedId && vue === 'sinistres'"
      :sinistre="store.sinistres.find(s => s.id === selectedId)!"
      @close="selectedId = null"
      @navigate="(id: string) => (selectedId = id)"
    />
  </ListPageLayout>
</template>

<script setup lang="ts">
/**
 * US 2.7.3 - Assurances et sinistres.
 *
 * Deux vues qui partagent la même coquille : les sinistres et les polices.
 * Le suivi de l'indemnisation est volontairement distinct du coût de
 * réparation, comme le demande la user story.
 *
 * Source : cahier des charges ERP GTD, domaine Infractions & discipline -
 * « accidents par million de km, tendre vers 0 ».
 */
import { ref, computed, watch } from 'vue'
import { ShieldAlert, TrendingDown, Coins, HandCoins } from 'lucide-vue-next'
import { ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import SinistreCard from '../../components/fleet/SinistreCard.vue'
import { useFlotteStore } from '../../stores/flotte'
import { useVehiculesStore } from '../../stores/vehicules'
import { useConfigurationStore } from '../../stores/configuration'
import { LIB_GRAVITE_SINISTRE, LIB_INDEMNISATION, LIB_STATUT_POLICE } from '../../types/flotte'
import type { GraviteSinistre, StatutIndemnisation, StatutPolice } from '../../types/flotte'
import { fmtAr, fmtDate } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'

const store     = useFlotteStore()
const vehicules = useVehiculesStore()

type Vue = 'sinistres' | 'polices'

/** Ligne unifiée : chaque vue ne renseigne que sa part. */
interface LigneAssurance {
  id?: string
  reference?: string
  vehiculePlaque?: string
  chauffeurNom?: string
  lieu?: string
  circonstances?: string
  gravite?: GraviteSinistre
  responsabiliteGtd?: boolean
  montantDommagesAr?: number
  statutIndemnisation?: StatutIndemnisation
  montantIndemniseAr?: number
  resteACharge?: number
  ordreTravailId?: string
  dateAffichee?: string
  numeroPolice?: string
  compagnie?: string
  couverture?: string
  dateEcheance?: string
  primeAnnuelleAr?: number
  franchiseAr?: number
  statut?: StatutPolice
}

const vue         = ref<Vue>('sinistres')
const searchQuery = ref('')
const sortKey     = ref('')
const sortDir     = ref<'asc' | 'desc'>('desc')
const page        = ref(1)
const pageSize    = ref(15)
const selectedId  = ref<string | null>(null)

const CLS_INDEMNISATION: Record<StatutIndemnisation, string> = {
  non_declare: 'bg-gray-100 text-gray-500',
  declare:     'bg-info-bg text-info',
  expertise:   'bg-warning-bg text-warning',
  accepte:     'bg-primary/10 text-primary',
  refuse:      'bg-danger-bg text-danger',
  regle:       'bg-success-bg text-success',
}

const scopeOptions = [
  { value: 'sinistres', label: 'Sinistres' },
  { value: 'polices',   label: 'Polices d’assurance' },
]

const sousTitre = computed(() =>
  vue.value === 'sinistres'
    ? `${store.sinistres.length} sinistre(s) · reste à charge ${fmtAr(resteTotal.value)}`
    : `${store.polices.length} police(s) · ${store.policesExpirees.length} expirée(s)`)

/* ── Kilométrage total, détenu par le référentiel véhicules ── */
const kmTotalFlotte = computed(() =>
  vehicules.auParc.reduce((s, v) => s + (v.kilometrage ?? 0), 0))

const accidentsParMKm = computed(() => store.accidentsParMillionKm(kmTotalFlotte.value))

const resteTotal = computed(() =>
  store.sinistres.reduce((s, x) => s + store.resteACharge(x), 0))

const kpis = computed(() =>
  vue.value === 'sinistres'
    ? [
        { label: 'Sinistres', value: String(store.sinistres.length), cls: 'text-foreground', cible: '' },
        { label: 'Accidents par million de km',
          value: accidentsParMKm.value != null ? String(accidentsParMKm.value) : '-',
          cls: 'text-foreground', cible: 'cible : tendre vers 0' },
        { label: 'Dommages', value: fmtAr(store.totalDommages), cls: 'text-foreground', cible: '' },
        { label: 'Reste à charge', value: fmtAr(resteTotal.value),
          cls: resteTotal.value > 0 ? 'text-danger' : 'text-success', cible: 'dommages − indemnisation' },
      ]
    : [
        { label: 'Polices', value: String(store.polices.length), cls: 'text-foreground', cible: '' },
        { label: 'Actives', value: String(store.polices.filter(p => p.statut === 'active').length),
          cls: 'text-success', cible: '' },
        { label: 'Expirées', value: String(store.policesExpirees.length),
          cls: store.policesExpirees.length ? 'text-danger' : 'text-success', cible: '' },
        { label: 'Primes annuelles',
          value: fmtAr(store.polices.filter(p => p.statut === 'active').reduce((s, p) => s + (p.primeAnnuelleAr ?? 0), 0)),
          cls: 'text-foreground', cible: '' },
      ])

const COLONNES: Record<Vue, ListColumn[]> = {
  sinistres: [
    { key: 'reference',      label: 'Sinistre',      sortable: true, width: 210 },
    { key: 'vehicule',       label: 'Véhicule',      width: 165 },
    { key: 'gravite',        label: 'Gravité',       width: 155 },
    { key: 'dommages',       label: 'Dommages',      width: 135 },
    { key: 'indemnisation',  label: 'Indemnisation', width: 185 },
    { key: 'reste',          label: 'Reste à charge', width: 140 },
    { key: 'date',           label: 'Date',          sortable: true, width: 115 },
  ],
  polices: [
    { key: 'police',        label: 'Police',      sortable: true, width: 190 },
    { key: 'vehicule',      label: 'Véhicule',    width: 130 },
    { key: 'couverture',    label: 'Couverture',  width: 300 },
    { key: 'echeance',      label: 'Échéance',    sortable: true, width: 160 },
    { key: 'prime',         label: 'Prime',       width: 160 },
    { key: 'statutPolice',  label: 'Statut',      width: 110 },
  ],
}

const columns = computed(() => COLONNES[vue.value])

const totalText = computed(() =>
  vue.value === 'sinistres' ? `${totalCount.value} sinistre(s)` : `${totalCount.value} police(s)`)

/* ── Échéance des polices, même règle que les documents ────── */
/* Le préavis d'échéance documentaire n'est plus figé ici : il vient des
   paramètres d'exploitation, ajustables sans intervention technique. */
const configStore = useConfigurationStore()
const PREAVIS_JOURS = computed(() => configStore.parametres.preavisDocumentaireJours)

function joursRestants(iso: string): number {
  return Math.ceil((+new Date(iso) - Date.now()) / 86_400_000)
}

function libelleEcheance(iso: string): string {
  const j = joursRestants(iso)
  if (j < 0) return `expirée depuis ${Math.abs(j)} j`
  if (j <= PREAVIS_JOURS.value) return `dans ${j} j - à renouveler`
  return `dans ${j} j`
}

function clsEcheance(iso: string): string {
  const j = joursRestants(iso)
  if (j < 0) return 'text-danger font-medium'
  if (j <= PREAVIS_JOURS.value) return 'text-warning'
  return 'text-muted-foreground'
}

watch([vue, searchQuery, pageSize], () => { page.value = 1 })
watch(vue, () => { sortKey.value = ''; selectedId.value = null })

function resetFilters() {
  searchQuery.value = ''
  page.value = 1
}

const donnees = computed<LigneAssurance[]>(() => {
  const q = searchQuery.value.toLowerCase()

  if (vue.value === 'sinistres') {
    return store.sinistres
      .filter(s => !q || `${s.reference} ${s.vehiculePlaque} ${s.lieu}`.toLowerCase().includes(q))
      .map(s => ({
        id: s.id, reference: s.reference,
        vehiculePlaque: s.vehiculePlaque, chauffeurNom: s.chauffeurNom,
        lieu: s.lieu, circonstances: s.circonstances,
        gravite: s.gravite, responsabiliteGtd: s.responsabiliteGtd,
        montantDommagesAr: s.montantDommagesAr,
        statutIndemnisation: s.statutIndemnisation,
        montantIndemniseAr: s.montantIndemniseAr,
        resteACharge: store.resteACharge(s),
        ordreTravailId: s.ordreTravailId,
        dateAffichee: s.date,
      }))
      .sort((a, b) => +new Date(b.dateAffichee!) - +new Date(a.dateAffichee!))
  }

  return store.polices
    .filter(p => !q || `${p.numeroPolice} ${p.vehiculePlaque} ${p.compagnie}`.toLowerCase().includes(q))
    .map(p => ({
      id: p.id, vehiculePlaque: p.vehiculePlaque,
      numeroPolice: p.numeroPolice, compagnie: p.compagnie, couverture: p.couverture,
      dateEcheance: p.dateEcheance, primeAnnuelleAr: p.primeAnnuelleAr,
      franchiseAr: p.franchiseAr, statut: p.statut,
      dateAffichee: p.dateEcheance,
    }))
})

const totalCount = computed(() => donnees.value.length)

const pageItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return donnees.value.slice(start, start + pageSize.value)
})

function openCard(id: string) { selectedId.value = id }
</script>
