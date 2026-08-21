<template>
  <div :class="L.pagePadding">

    <div :class="L.pageHeader">
      <div>
        <h1 :class="L.pageTitle">Fiabilité</h1>
        <p :class="L.pageSub">Indicateurs de fiabilité et coûts de maintenance</p>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-6 gap-2.5 mb-3.5">
      <div v-for="k in kpis" :key="k.label"
        class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        <p class="text-xl font-bold leading-none" :class="k.cls">{{ k.value }}</p>
        <p class="text-xs text-gray-500 mt-1">{{ k.label }}</p>
        <p v-if="k.cible" class="text-[11px] text-muted-foreground mt-0.5">{{ k.cible }}</p>
      </div>
    </div>

    <div class="flex gap-1 border-b border-border mb-3.5 overflow-x-auto">
      <button v-for="t in onglets" :key="t.key" @click="onglet = t.key"
        class="px-3.5 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer bg-transparent"
        :class="onglet === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'">
        {{ t.label }}
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         FIABILITÉ - US 3.5.1
         ═══════════════════════════════════════════════════════ -->
    <div v-if="onglet === 'fiabilite'" class="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle"><Gauge class="w-4 h-4 text-primary" /> Indicateurs de fiabilité</h2>
        </div>
        <table :class="L.table">
          <thead><tr>
            <th :class="L.th" class="cursor-default">Indicateur</th>
            <th :class="L.th" class="cursor-default">Formule</th>
            <th :class="L.th" class="cursor-default">Valeur</th>
          </tr></thead>
          <tbody>
            <tr :class="L.rowHover">
              <td :class="L.td"><span class="text-xs font-medium">MTTR</span></td>
              <td :class="L.td"><span class="text-[11px] text-muted-foreground">Durée moyenne ouverture → clôture</span></td>
              <td :class="L.td"><span class="text-xs font-semibold">{{ store.mttrHeures != null ? store.mttrHeures + ' h' : '-' }}</span></td>
            </tr>
            <tr :class="L.rowHover">
              <td :class="L.td"><span class="text-xs font-medium">MTBF</span></td>
              <td :class="L.td"><span class="text-[11px] text-muted-foreground">Kilomètres moyens entre deux pannes</span></td>
              <td :class="L.td"><span class="text-xs font-semibold">{{ store.mtbfKm != null ? store.mtbfKm.toLocaleString('fr-FR') + ' km' : '-' }}</span></td>
            </tr>
            <tr :class="L.rowHover">
              <td :class="L.td"><span class="text-xs font-medium">Ratio préventif</span></td>
              <td :class="L.td"><span class="text-[11px] text-muted-foreground">Préventifs ÷ total des ordres</span></td>
              <td :class="L.td">
                <span class="text-xs font-semibold" :class="(store.ratioPreventif ?? 0) >= 60 ? 'text-success' : 'text-danger'">
                  {{ store.ratioPreventif != null ? store.ratioPreventif + ' %' : '-' }}
                </span>
              </td>
            </tr>
            <tr :class="L.rowHover">
              <td :class="L.td"><span class="text-xs font-medium">Taux de disponibilité</span></td>
              <td :class="L.td"><span class="text-[11px] text-muted-foreground">(Jours théoriques − jours perdus) ÷ jours théoriques</span></td>
              <td :class="L.td">
                <span class="text-xs font-semibold" :class="(tauxDispo ?? 0) >= 80 ? 'text-success' : 'text-danger'">
                  {{ tauxDispo != null ? tauxDispo + ' %' : '-' }}
                </span>
              </td>
            </tr>
            <tr :class="L.rowHover">
              <td :class="L.td"><span class="text-xs font-medium">Préventif réalisé dans les délais</span></td>
              <td :class="L.td"><span class="text-[11px] text-muted-foreground">Préventifs clôturés ÷ préventifs planifiés</span></td>
              <td :class="L.td">
                <span class="text-xs font-semibold">
                  {{ store.tauxRealisationPreventif != null ? store.tauxRealisationPreventif + ' %' : '-' }}
                </span>
              </td>
            </tr>
            <tr :class="L.rowHover">
              <td :class="L.td"><span class="text-xs font-medium">Ratio humain / technique</span></td>
              <td :class="L.td"><span class="text-[11px] text-muted-foreground">Jours perdus humains ÷ techniques</span></td>
              <td :class="L.td"><span class="text-xs font-semibold">{{ store.ratioHumainTechnique ?? '-' }}</span></td>
            </tr>
          </tbody>
        </table>

        <!-- -->
      </div>

      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle"><AlertTriangle class="w-4 h-4 text-primary" /> Pannes par sous-système</h2>
        </div>
        <div v-if="!store.pannesParSousSysteme.length" class="text-xs text-muted-foreground py-3">
          Aucune panne corrective enregistrée.
        </div>
        <div v-else class="flex flex-col gap-2.5">
          <div v-for="p in store.pannesParSousSysteme" :key="p.sousSysteme">
            <div class="flex items-baseline justify-between mb-1">
              <span class="text-xs text-foreground">{{ LIB_SOUS_SYSTEME[p.sousSysteme] }}</span>
              <span class="text-xs font-semibold">{{ p.nb }}</span>
            </div>
            <div class="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div class="h-full bg-primary rounded-full"
                :style="{ width: (p.nb / maxPannes * 100) + '%' }" />
            </div>
          </div>
        </div>
      </div>

      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle"><Gauge class="w-4 h-4 text-primary" /> MTBF par sous-système</h2>
          <span class="text-[11px] text-muted-foreground">kilomètres entre deux pannes</span>
        </div>
        <div v-if="!store.mtbfParSousSysteme.length" class="text-xs text-muted-foreground py-3">
          Pas assez de pannes enregistrées pour calculer un MTBF par organe.
        </div>
        <table v-else :class="L.table">
          <thead><tr>
            <th :class="L.th" class="cursor-default">Sous-système</th>
            <th :class="L.th" class="cursor-default">Pannes</th>
            <th :class="L.th" class="cursor-default">MTBF</th>
          </tr></thead>
          <tbody>
            <tr v-for="m in store.mtbfParSousSysteme" :key="m.sousSysteme" :class="L.rowHover">
              <td :class="L.td"><span class="text-xs">{{ LIB_SOUS_SYSTEME[m.sousSysteme] }}</span></td>
              <td :class="L.td"><span class="text-xs">{{ m.nb }}</span></td>
              <td :class="L.td">
                <span class="text-xs font-semibold">
                  {{ m.mtbfKm != null ? m.mtbfKm.toLocaleString('fr-FR') + ' km' : 'panne unique' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle"><CalendarOff class="w-4 h-4 text-primary" /> Jours perdus par cause</h2>
          <span class="flex items-center gap-2">
            <MentionSimulation groupe="immobilisation" texte="coût simulé" />
            <span v-if="store.coutTotalImmobilisations != null" class="text-[11px] font-semibold text-danger">
              {{ fmtAr(store.coutTotalImmobilisations) }}
            </span>
          </span>
        </div>
        <div class="flex flex-col gap-2.5">
          <div v-for="(jours, famille) in store.joursPerdusParFamille" :key="famille">
            <div class="flex items-baseline justify-between mb-1">
              <span class="text-xs text-foreground">{{ LIB_FAMILLE_INDISPO[famille as FamilleIndispo] }}</span>
              <span class="flex items-baseline gap-2">
                <span v-if="store.coutParFamille" class="text-[11px] text-danger">
                  {{ fmtAr(store.coutParFamille[famille as string] ?? 0) }}
                </span>
                <span class="text-xs font-semibold">{{ jours }} j</span>
              </span>
            </div>
            <div class="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div class="h-full rounded-full" :class="CLS_FAMILLE[famille as FamilleIndispo]"
                :style="{ width: (totalJours ? (jours as number) / totalJours * 100 : 0) + '%' }" />
            </div>
          </div>
        </div>

        <p v-if="!store.coutImmoRenseigne" class="text-[11px] text-muted-foreground mt-3">
          Coût journalier non renseigné.
          <RouterLink :to="{ name: 'maintenance-parametres' }" class="underline">Paramétrer</RouterLink>
        </p>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         COÛTS - US 3.5.2
         ═══════════════════════════════════════════════════════ -->
    <div v-else-if="onglet === 'couts'" :class="L.card">
      <div :class="L.cardHeader">
        <h2 :class="L.cardTitle"><Coins class="w-4 h-4 text-primary" /> Coûts par ordre de travail</h2>
        <span class="flex items-center gap-2">
          <MentionSimulation groupe="mainOeuvre" texte="tarif horaire simulé" />
          <span class="text-[11px] text-muted-foreground">
            {{ store.tarifRenseigne ? 'pièces, sous-traitance et main-d’œuvre' : 'pièces et sous-traitance' }}
          </span>
        </span>
      </div>

      <table :class="L.table">
        <thead><tr>
          <th :class="L.th" class="cursor-default">Ordre</th>
          <th :class="L.th" class="cursor-default">Véhicule</th>
          <th :class="L.th" class="cursor-default">Sous-système</th>
          <th :class="L.th" class="cursor-default">Type</th>
          <th :class="L.th" class="cursor-default">Pièces</th>
          <th :class="L.th" class="cursor-default">Sous-traitance</th>
          <th :class="L.th" class="cursor-default">Main-d’œuvre</th>
          <th :class="L.th" class="cursor-default">Coût complet</th>
        </tr></thead>
        <tbody>
          <tr v-for="o in ordresParCout" :key="o.id" :class="L.rowHover">
            <td :class="L.td"><span class="font-mono text-xs">{{ o.reference }}</span></td>
            <td :class="L.td"><span class="font-mono text-xs">{{ o.vehiculePlaque }}</span></td>
            <td :class="L.td">
              <span class="text-xs">{{ o.sousSysteme ? LIB_SOUS_SYSTEME[o.sousSysteme] : '-' }}</span>
            </td>
            <td :class="L.td">
              <span class="text-[10px] font-medium px-2 py-0.5 rounded-full"
                :class="o.typeMaintenance === 'preventif' ? 'bg-success-bg text-success' : 'bg-info-bg text-info'">
                {{ LIB_TYPE_MAINTENANCE[o.typeMaintenance] }}
              </span>
            </td>
            <td :class="L.td">
              <span class="text-xs">{{ store.coutPieces(o) ? fmtAr(store.coutPieces(o)) : '-' }}</span>
            </td>
            <td :class="L.td">
              <span class="text-xs">{{ store.coutSousTraitance(o) ? fmtAr(store.coutSousTraitance(o)) : '-' }}</span>
            </td>
            <td :class="L.td">
              <span v-if="store.coutMainOeuvre(o) != null" class="text-xs">
                {{ fmtAr(store.coutMainOeuvre(o)!) }}
                <span class="text-[10px] text-muted-foreground">({{ store.heuresOT(o) }} h)</span>
              </span>
              <span v-else class="text-[11px] text-warning">{{ store.heuresOT(o) }} h non valorisées</span>
            </td>
            <td :class="L.td"><span class="text-xs font-semibold">{{ fmtAr(store.coutOT(o)) }}</span></td>
          </tr>
        </tbody>
      </table>

      <p class="text-[13px] font-semibold text-foreground mt-5 mb-2">Coût cumulé par véhicule</p>
      <table :class="L.table">
        <thead><tr>
          <th :class="L.th" class="cursor-default">Véhicule</th>
          <th :class="L.th" class="cursor-default">Interventions</th>
          <th :class="L.th" class="cursor-default">Jours immobilisé</th>
          <th :class="L.th" class="cursor-default">Coût immobilisation</th>
          <th :class="L.th" class="cursor-default">Coût réparations</th>
          <th :class="L.th" class="cursor-default">Coût au km</th>
        </tr></thead>
        <tbody>
          <tr v-for="v in store.coutCumuleParVehicule" :key="v.vehiculeId" :class="L.rowHover">
            <td :class="L.td"><span class="font-mono text-xs">{{ v.plaque }}</span></td>
            <td :class="L.td"><span class="text-xs">{{ v.nb }}</span></td>
            <td :class="L.td">
              <span class="text-xs" :class="v.joursImmo > 5 ? 'text-danger font-medium' : ''">
                {{ v.joursImmo }} j
              </span>
            </td>
            <td :class="L.td">
              <span v-if="v.coutImmo != null" class="text-xs text-danger font-medium">{{ fmtAr(v.coutImmo) }}</span>
              <span v-else class="text-gray-300">-</span>
            </td>
            <td :class="L.td"><span class="text-xs font-semibold">{{ fmtAr(v.cout) }}</span></td>
            <td :class="L.td">
              <span class="text-xs">{{ coutKm(v.vehiculeId) != null ? fmtAr(coutKm(v.vehiculeId)!) + ' / km' : '-' }}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Le coût complet n'est atteint que si le tarif horaire est connu -->
      <div v-if="store.tarifRenseigne"
        class="flex items-start gap-2.5 bg-success-bg border border-success/20 rounded-lg px-3.5 py-2.5 mt-3">
        <Coins class="w-4 h-4 shrink-0 mt-px text-success" />
        <p class="text-[11px] text-success leading-relaxed">
          Main-d’œuvre : {{ fmtAr(store.coutMainOeuvreTotal ?? 0) }}, soit {{ partMainOeuvre }} % du total.
        </p>
      </div>
      <div v-else class="flex items-start gap-2.5 bg-background border border-border rounded-lg px-3.5 py-2.5 mt-3">
        <FileQuestion class="w-4 h-4 shrink-0 mt-px text-muted-foreground" />
        <p class="text-[11px] text-muted-foreground leading-relaxed">
          {{ heuresNonValorisees }} h sans tarif horaire.
          <RouterLink :to="{ name: 'maintenance-parametres' }" class="underline">Paramétrer</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Tableau de bord maintenance - US 3.5.3, avec les échéances (3.1.2),
 * la fiabilité (3.5.1) et les coûts (3.5.2).
 *
 * Le tarif horaire de l'atelier et le coût d'immobilisation journalier se
 * paramètrent désormais dans Paramétrage → Paramètres de l'atelier. Tant
 * qu'ils sont vides, le coût reste partiel et l'écran dit pourquoi.
 */
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Gauge, AlertTriangle, CalendarOff, Coins, FileQuestion,
} from 'lucide-vue-next'
import { useMaintenanceStore } from '../../stores/maintenance'
import MentionSimulation from '../../components/maintenance/MentionSimulation.vue'
import { useVehiculesStore } from '../../stores/vehicules'
import {
  LIB_SOUS_SYSTEME, LIB_TYPE_MAINTENANCE, LIB_FAMILLE_INDISPO,
} from '../../types/maintenance'
import type { FamilleIndispo } from '../../types/maintenance'
import { fmtAr } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'

const store    = useMaintenanceStore()

const onglet = ref<'fiabilite' | 'couts'>('fiabilite')

const CLS_FAMILLE: Record<FamilleIndispo, string> = {
  technique:      'bg-danger',
  reglementaire:  'bg-warning',
  administrative: 'bg-info',
  humaine:        'bg-primary',
}

/** Heures déjà pointées par les mécaniciens et qui attendent un tarif. */
const heuresNonValorisees = computed(() =>
  store.ordres.reduce((s, o) => s + store.heuresOT(o), 0))

/** Part de la main-d'œuvre dans le coût total, quand elle est valorisée. */
const partMainOeuvre = computed(() => {
  const mo = store.coutMainOeuvreTotal
  if (mo == null || !store.coutTotal) return 0
  return Math.round((mo / store.coutTotal) * 100)
})


/* ── Indicateurs exigés par les user stories 3.3.1 et 3.5.2 ── */
const vehicules = useVehiculesStore()

const tauxDispo = computed(() =>
  store.tauxDisponibilite(vehicules.auParc.length))

/** Coût au kilomètre d'un véhicule, à partir de son kilométrage réel. */
/* Le dénominateur est la distance parcourue pendant la période des
   interventions, pas le compteur du véhicule : rapporter des coûts de
   quelques mois à un kilométrage de toute une vie donnait un chiffre
   dix fois trop bas. */
function coutKm(vehiculeId: string): number | null {
  return store.coutParKmObserve(vehiculeId)
}

const maxPannes = computed(() =>
  Math.max(1, ...store.pannesParSousSysteme.map(p => p.nb)))

const totalJours = computed(() =>
  Object.values(store.joursPerdusParFamille).reduce((s, v) => s + (v as number), 0))

const ordresParCout = computed(() =>
  [...store.ordres].sort((a, b) => store.coutOT(b) - store.coutOT(a)))

const onglets = computed(() => [
  { key: 'fiabilite' as const, label: 'Fiabilité' },
  { key: 'couts' as const,     label: 'Coûts' },
])

const kpis = computed(() => [
  { label: 'MTTR',            value: store.mttrHeures != null ? store.mttrHeures + ' h' : '-',
    cls: 'text-foreground', cible: '' },
  { label: 'MTBF',            value: store.mtbfKm != null ? Math.round(store.mtbfKm / 1000) + 'k km' : '-',
    cls: 'text-foreground', cible: '' },
  { label: 'Préventif',       value: store.ratioPreventif != null ? store.ratioPreventif + ' %' : '-',
    cls: (store.ratioPreventif ?? 0) >= 60 ? 'text-success' : 'text-danger', cible: 'cible ≥ 60 %' },
  { label: 'Ordres ouverts',  value: String(store.ouverts.length),
    cls: 'text-foreground', cible: '' },
  { label: 'Coût pièces',     value: fmtAr(store.coutTotal),
    cls: 'text-foreground', cible: store.tarifRenseigne ? 'main-d’œuvre incluse' : 'hors main-d’œuvre' },
  { label: 'Coût immobilisations',
    value: store.coutTotalImmobilisations != null ? fmtAr(store.coutTotalImmobilisations) : '-',
    cls: store.coutTotalImmobilisations != null ? 'text-danger' : 'text-gray-300',
    cible: store.coutImmoRenseigne ? '' : 'coût journalier à renseigner' },
])
</script>
