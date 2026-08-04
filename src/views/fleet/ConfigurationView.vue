<template>
  <div :class="L.pagePadding">

    <div :class="L.pageHeader">
      <div>
        <h1 :class="L.pageTitle">Configuration</h1>
        <p :class="L.pageSub">Données de référence de l’exploitation</p>
      </div>
    </div>

    <div class="flex items-start gap-2.5 bg-info-bg text-info rounded-lg px-3.5 py-2.5 mb-3.5">
      <Info class="w-4 h-4 shrink-0 mt-px" />
      <p class="text-xs leading-relaxed">
        La page <strong>Conformité</strong> contient les écarts <strong>relevés</strong> - des faits.
        Cette page contient les <strong>règles</strong> : les types d’écart, leurs gravités et leurs seuils.
        Sans cette séparation, l’application afficherait des gravités que personne ne peut expliquer.
      </p>
    </div>

    <!-- Onglets -->
    <div class="flex gap-1 border-b border-border mb-3.5 overflow-x-auto">
      <button
        v-for="t in onglets" :key="t.key" @click="onglet = t.key"
        class="px-3.5 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer bg-transparent"
        :class="onglet === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
      >
        {{ t.label }}
        <span v-if="t.compte" class="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{{ t.compte }}</span>
      </button>
    </div>

    <!-- ══ TRAJETS DE RÉFÉRENCE ══════════════════════════════ -->
    <div v-if="onglet === 'trajets'" class="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-3.5 items-start">
      <div class="flex flex-col gap-2">
        <button
          v-for="t in trajetsStore.trajets" :key="t.id"
          class="text-left rounded-lg border px-3.5 py-3 cursor-pointer transition-colors"
          :class="trajetSel === t.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-background'"
          @click="trajetSel = t.id"
        >
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="font-mono text-xs font-semibold text-foreground">{{ t.code }}</span>
            <span
              class="text-[11px] font-medium px-2 py-0.5 rounded-full"
              :class="t.statut === 'actif' ? 'bg-success-bg text-success' : 'bg-gray-100 text-gray-400'"
            >{{ t.statut === 'actif' ? 'Actif' : 'Archivé' }}</span>
          </div>
          <p class="text-[13px] font-medium text-foreground">{{ t.libelle }}</p>
          <div class="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
            <span>{{ t.etapes.length }} sites</span>
            <span>{{ t.distanceEstimeeKm }} km</span>
            <span>{{ fmtDuree(t.dureeEstimeeMin) }}</span>
          </div>
        </button>
      </div>

      <div v-if="trajet" :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle"><Route class="w-4 h-4 text-primary" /> {{ trajet.libelle }}</h2>
          <span v-if="trajet.clientNom" class="text-[11px] text-muted-foreground">{{ trajet.clientNom }}</span>
        </div>

        <FleetMap
          :trace-prevu="trajetsStore.traceDe(trajet.etapes)"
          :markers="marqueursTrajet"
          height="320px"
          :show-legend="false"
        />

        <table :class="L.table" class="mt-3">
          <thead><tr>
            <th :class="L.th" class="cursor-default">#</th>
            <th :class="L.th" class="cursor-default">Site</th>
            <th :class="L.th" class="cursor-default">Rôle</th>
            <th :class="L.th" class="cursor-default">Intervalle</th>
            <th :class="L.th" class="cursor-default">Pause</th>
          </tr></thead>
          <tbody>
            <tr v-for="e in trajet.etapes" :key="e.id" :class="L.rowHover">
              <td :class="L.td"><span class="font-mono text-xs">{{ e.ordre }}</span></td>
              <td :class="L.td"><span class="text-xs font-medium">{{ e.siteNom }}</span></td>
              <td :class="L.td"><span class="text-xs text-muted-foreground">{{ LIB_ROLE_ETAPE[e.role] }}</span></td>
              <td :class="L.td"><span class="text-xs">{{ e.intervalleMin ? e.intervalleMin + ' min' : '-' }}</span></td>
              <td :class="L.td"><span class="text-xs">{{ e.pausePrevueMin ? e.pausePrevueMin + ' min' : '-' }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══ TYPES D'ÉCART ═════════════════════════════════════ -->
    <div v-else-if="onglet === 'ecarts'" class="flex flex-col gap-3.5">
      <div v-for="(liste, cat) in configStore.parCategorie" :key="cat" :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle">{{ LIB_CATEGORIE_ECART[cat] }}</h2>
          <span class="text-[11px] text-muted-foreground">{{ liste.length }} type(s)</span>
        </div>
        <table :class="L.table">
          <thead><tr>
            <th :class="L.th" class="cursor-default">Code</th>
            <th :class="L.th" class="cursor-default">Libellé</th>
            <th :class="L.th" class="cursor-default">Gravité</th>
            <th :class="L.th" class="cursor-default">Seuil</th>
            <th :class="L.th" class="cursor-default">Actif</th>
          </tr></thead>
          <tbody>
            <tr v-for="t in liste" :key="t.id" :class="L.rowHover">
              <td :class="L.td"><span class="font-mono text-xs">{{ t.code }}</span></td>
              <td :class="L.td">
                <span class="text-xs font-medium">{{ t.libelle }}</span>
                <div v-if="t.description" class="text-[11px] text-muted-foreground">{{ t.description }}</div>
              </td>
              <td :class="L.td">
                <select
                  :value="t.gravite" :class="F.fieldSelect" class="!h-[28px] !text-[11px] w-[100px]"
                  @change="e => configStore.majTypeEcart(t.id, { gravite: (e.target as HTMLSelectElement).value as GraviteEcart })"
                >
                  <option value="mineur">Mineur</option>
                  <option value="majeur">Majeur</option>
                  <option value="critique">Critique</option>
                </select>
              </td>
              <td :class="L.td">
                <span v-if="t.seuilValeur != null" class="text-xs">{{ t.seuilValeur }} {{ t.seuilUnite }}</span>
                <span v-else class="text-gray-300">-</span>
              </td>
              <td :class="L.td">
                <button
                  class="text-[11px] font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer"
                  :class="t.actif ? 'bg-success-bg text-success' : 'bg-gray-100 text-gray-400'"
                  @click="configStore.basculerActif(t.id)"
                >{{ t.actif ? 'Actif' : 'Inactif' }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══ PARAMÈTRES ════════════════════════════════════════ -->
    <div v-else-if="onglet === 'parametres'" class="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
      <div :class="L.card">
        <div :class="L.cardHeader"><h2 :class="L.cardTitle"><Clock class="w-4 h-4 text-primary" /> Temps réglementaires</h2></div>
        <div class="grid grid-cols-2 gap-3">
          <div :class="F.field">
            <label :class="F.fieldLabel">Conduite continue max (min)</label>
            <input v-model.number="p.tccMaxMin" type="number" :class="F.fieldInput" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Arrêt après conduite continue (min)</label>
            <input v-model.number="p.pauseApresTccMin" type="number" :class="F.fieldInput" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Conduite journalière max (min)</label>
            <input v-model.number="p.tcjMaxMin" type="number" :class="F.fieldInput" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Travail journalier max (min)</label>
            <input v-model.number="p.ttjMaxMin" type="number" :class="F.fieldInput" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Repos hebdomadaire (h)</label>
            <input v-model.number="p.trhMinH" type="number" :class="F.fieldInput" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Plafond hebdomadaire (h)</label>
            <input v-model.number="p.plafondHebdoH" type="number" :class="F.fieldInput" />
          </div>
        </div>
        <p class="text-[11px] text-muted-foreground mt-2.5">
          Valeurs en vigueur chez GTD : 4 h 30 de conduite continue suivie de 45 min d’arrêt,
          10 h de conduite journalière, 12 h de travail, 24 h de repos hebdomadaire,
          plafonds de 56 h par semaine et 90 h sur deux semaines.
        </p>
      </div>

      <div :class="L.card">
        <div :class="L.cardHeader"><h2 :class="L.cardTitle"><SlidersHorizontal class="w-4 h-4 text-primary" /> Seuils d’exploitation</h2></div>
        <div class="grid grid-cols-2 gap-3">
          <div :class="F.field">
            <label :class="F.fieldLabel">Litres par bon de carburant</label>
            <input v-model.number="p.litresParBonDefaut" type="number" :class="F.fieldInput" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Tolérance kilométrique (%)</label>
            <input v-model.number="p.toleranceKmPct" type="number" :class="F.fieldInput" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Seuil d’arrêt non planifié (min)</label>
            <input v-model.number="p.seuilArretMin" type="number" :class="F.fieldInput" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Plafond bihebdomadaire (h)</label>
            <input v-model.number="p.plafondBihebdoH" type="number" :class="F.fieldInput" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Configuration - page unique regroupant les données de référence.
 * Décision de séance : un seul bouton « Configuration » plutôt que des
 * réglages dispersés dans chaque écran.
 */
import { ref, computed } from 'vue'
import { Info, Route, Clock, SlidersHorizontal } from 'lucide-vue-next'
import FleetMap from '../../components/fleet/FleetMap.vue'
import { useTrajetsStore } from '../../stores/trajets'
import { useConfigurationStore } from '../../stores/configuration'
import { LIB_ROLE_ETAPE, LIB_CATEGORIE_ECART } from '../../types/fms'
import type { GraviteEcart, MapMarker } from '../../types/fms'
import { fmtDuree } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'
import * as F from '../../lib/formClasses'

const trajetsStore = useTrajetsStore()
const configStore = useConfigurationStore()

const onglet = ref<'trajets' | 'ecarts' | 'parametres'>('trajets')
const trajetSel = ref<string | null>(trajetsStore.trajets[0]?.id ?? null)

const onglets = computed(() => [
  { key: 'trajets' as const,    label: 'Trajets de référence', compte: trajetsStore.trajets.length },
  { key: 'ecarts' as const,     label: 'Types d’écart',        compte: configStore.typesEcart.length },
  { key: 'parametres' as const, label: 'Paramètres',           compte: 0 },
])

const trajet = computed(() => trajetSel.value ? trajetsStore.getById(trajetSel.value) : undefined)

const marqueursTrajet = computed<MapMarker[]>(() =>
  trajet.value
    ? trajet.value.etapes.map(e => ({
        id: e.id, lat: e.lat, lng: e.lng,
        label: `${e.ordre}. ${e.siteNom}`,
        sublabel: LIB_ROLE_ETAPE[e.role],
      }))
    : [])

const p = configStore.parametres
</script>
