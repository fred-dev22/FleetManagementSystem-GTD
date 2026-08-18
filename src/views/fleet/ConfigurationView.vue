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
    <!-- ═══════════════════════════════════════════════════════
         US 3.1.1 - Plans d'entretien par modèle
         Source : plan constructeur SINOTRUCK HOWO NX-400,
         cinq échéances de 5 000 à 45 000 km.
         ═══════════════════════════════════════════════════════ -->
    <div v-else-if="onglet === 'entretien'" class="flex flex-col gap-3.5">
      <div v-for="plan in maintStore.plans" :key="plan.id" :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle">
            <Wrench class="w-4 h-4 text-primary" /> {{ plan.marque }} {{ plan.modele }}
          </h2>
          <span class="text-[11px] font-medium px-2 py-0.5 rounded-full"
            :class="plan.actif ? 'bg-success-bg text-success' : 'bg-gray-100 text-gray-400'">
            {{ plan.actif ? 'Actif' : 'Inactif' }}
          </span>
        </div>

        <table :class="L.table">
          <thead><tr>
            <th :class="L.th" class="cursor-default">Opération</th>
            <th :class="L.th" class="cursor-default">Sous-système</th>
            <th :class="L.th" class="cursor-default">Nature</th>
            <th :class="L.th" class="cursor-default">Intervalle</th>
          </tr></thead>
          <tbody>
            <tr v-for="op in plan.operations" :key="op.id" :class="L.rowHover">
              <td :class="L.td"><span class="text-xs font-medium">{{ op.libelle }}</span></td>
              <td :class="L.td">
                <span class="text-xs text-muted-foreground">{{ LIB_SOUS_SYSTEME[op.sousSysteme] }}</span>
              </td>
              <td :class="L.td">
                <span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {{ LIB_NATURE_OPERATION[op.nature] }}
                </span>
              </td>
              <td :class="L.td">
                <span v-if="op.intervalleKm" class="text-xs">
                  tous les {{ op.intervalleKm.toLocaleString('fr-FR') }} km
                </span>
                <span v-else-if="op.intervalleJours" class="text-xs">
                  tous les {{ op.intervalleJours }} jours
                </span>
                <span v-else class="text-gray-300">-</span>
              </td>
            </tr>
          </tbody>
        </table>

        <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          Le déclenchement se fait au premier des deux seuils atteint. Ce plan s’applique à tous
          les véhicules de ce modèle et sert de base au calcul des échéances.
        </p>
      </div>

      </div>

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

      <!-- ═══════════════════════════════════════════════════════
           Seuils d'alerte - US 3.1.2, 2.5.2, 2.7.1
           Ces trois seuils gouvernent le déclenchement des alertes.
           Ils étaient figés dans le code : l'exploitation devait passer
           par un développeur pour ajuster un préavis. Ils sont ici.
           ═══════════════════════════════════════════════════════ -->
      <div :class="L.card" class="lg:col-span-2">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle"><BellRing class="w-4 h-4 text-primary" /> Seuils d’alerte</h2>
          <span class="text-[11px] text-muted-foreground">
            ajustables sans intervention technique
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

          <!-- Préavis d'alerte préventive -->
          <div class="flex flex-col gap-2">
            <p class="text-xs font-semibold text-foreground">Préavis d’entretien préventif</p>
            <div class="grid grid-cols-2 gap-2">
              <div :class="F.field">
                <label :class="F.fieldLabel">Kilomètres avant</label>
                <input v-model.number="p.preavisEntretienKm" type="number" min="0"
                  :class="[F.fieldInput, configStore.seuilHorsBornes('preavisEntretienKm') ? F.inputError : '']" />
              </div>
              <div :class="F.field">
                <label :class="F.fieldLabel">Jours avant</label>
                <input v-model.number="p.preavisEntretienJours" type="number" min="0"
                  :class="[F.fieldInput, configStore.seuilHorsBornes('preavisEntretienJours') ? F.inputError : '']" />
              </div>
            </div>
            <p class="text-[11px] text-muted-foreground leading-relaxed">
              Combien de kilomètres ou de jours avant l’échéance le garage est prévenu.
              Ce délai doit couvrir l’approvisionnement des pièces : un préavis plus court
              que le délai fournisseur garantit l’immobilisation.
            </p>
            <p v-if="configStore.seuilHorsBornes('preavisEntretienKm')" :class="F.fieldError">
              <AlertCircle class="w-3 h-3" />
              Attendu entre {{ B.preavisEntretienKm.min }} et
              {{ B.preavisEntretienKm.max.toLocaleString('fr-FR') }} km.
            </p>
          </div>

          <!-- Rayon de validation d'un passage -->
          <div class="flex flex-col gap-2">
            <p class="text-xs font-semibold text-foreground">Rayon de validation d’un passage</p>
            <div :class="F.field">
              <label :class="F.fieldLabel">Distance au site (m)</label>
              <input v-model.number="p.rayonValidationPassageM" type="number" min="0" step="100"
                :class="[F.fieldInput, configStore.seuilHorsBornes('rayonValidationPassageM') ? F.inputError : '']" />
            </div>
            <p class="text-[11px] text-muted-foreground leading-relaxed">
              À quelle distance d’un site le camion est réputé y être passé. Trop court, des
              passages réels sont manqués ; trop long, un site simplement longé est validé.
              La valeur doit rester cohérente avec la précision d’un relevé télématique
              en zone rurale.
            </p>
            <p v-if="configStore.seuilHorsBornes('rayonValidationPassageM')" :class="F.fieldError">
              <AlertCircle class="w-3 h-3" />
              Attendu entre {{ B.rayonValidationPassageM.min }} et
              {{ B.rayonValidationPassageM.max.toLocaleString('fr-FR') }} m.
            </p>
          </div>

          <!-- Préavis d'échéance documentaire -->
          <div class="flex flex-col gap-2">
            <p class="text-xs font-semibold text-foreground">Préavis d’échéance documentaire</p>
            <div :class="F.field">
              <label :class="F.fieldLabel">Jours avant expiration</label>
              <input v-model.number="p.preavisDocumentaireJours" type="number" min="0"
                :class="[F.fieldInput, configStore.seuilHorsBornes('preavisDocumentaireJours') ? F.inputError : '']" />
            </div>
            <p class="text-[11px] text-muted-foreground leading-relaxed">
              Combien de jours avant l’expiration d’un permis, d’un vetting, d’une assurance
              ou d’une visite médicale l’alerte est émise. Le cahier des charges retient J-30 ;
              ce délai s’applique aux documents véhicule et conducteur.
            </p>
            <p v-if="configStore.seuilHorsBornes('preavisDocumentaireJours')" :class="F.fieldError">
              <AlertCircle class="w-3 h-3" />
              Attendu entre {{ B.preavisDocumentaireJours.min }} et
              {{ B.preavisDocumentaireJours.max }} jours.
            </p>
          </div>
        </div>

        <div class="flex items-start gap-2.5 bg-info-bg text-info rounded-lg px-3.5 py-2.5 mt-3.5">
          <Info class="w-4 h-4 shrink-0 mt-px" />
          <p class="text-[11px] leading-relaxed">
            Une modification s’applique immédiatement à tous les écrans qui en dépendent :
            les échéances préventives, la détection des passages sur site et les alertes
            documentaires du véhicule comme du conducteur. Aucun de ces seuils n’est
            recopié ailleurs dans le code.
          </p>
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
import { Info, Route, Clock, SlidersHorizontal, Wrench, BellRing, AlertCircle } from 'lucide-vue-next'
import FleetMap from '../../components/fleet/FleetMap.vue'
import { useTrajetsStore } from '../../stores/trajets'
import { useConfigurationStore } from '../../stores/configuration'
import { useMaintenanceStore } from '../../stores/maintenance'
import { LIB_SOUS_SYSTEME, LIB_NATURE_OPERATION } from '../../types/maintenance'
import { LIB_ROLE_ETAPE, LIB_CATEGORIE_ECART } from '../../types/fms'
import type { GraviteEcart, MapMarker } from '../../types/fms'
import { fmtDuree } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'
import * as F from '../../lib/formClasses'

const trajetsStore = useTrajetsStore()
const configStore = useConfigurationStore()
const maintStore  = useMaintenanceStore()

const onglet = ref<'trajets' | 'ecarts' | 'entretien' | 'parametres'>('trajets')
const trajetSel = ref<string | null>(trajetsStore.trajets[0]?.id ?? null)

const onglets = computed(() => [
  { key: 'trajets' as const,    label: 'Trajets de référence', compte: trajetsStore.trajets.length },
  { key: 'ecarts' as const,     label: 'Types d’écart',        compte: configStore.typesEcart.length },
  { key: 'entretien' as const,  label: 'Plans d’entretien',   compte: maintStore.plans.length },
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

/** Bornes de saisie, affichées dans les messages d'erreur des seuils. */
const B = configStore.BORNES_SEUILS
</script>
