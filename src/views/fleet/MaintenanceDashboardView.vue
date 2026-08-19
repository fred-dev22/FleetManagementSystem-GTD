<template>
  <div :class="L.pagePadding">

    <div :class="L.pageHeader">
      <div>
        <h1 :class="L.pageTitle">Tableau de bord maintenance</h1>
        <p :class="L.pageSub">Fiabilité, coûts et échéances préventives</p>
      </div>
    </div>

    <!-- ═══ Indicateurs, mêmes tuiles que les autres pages ═══ -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-3.5">
      <div v-for="k in kpis" :key="k.label"
        class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        <p class="text-xl font-bold leading-none" :class="k.cls">{{ k.value }}</p>
        <p class="text-xs text-gray-500 mt-1">{{ k.label }}</p>
        <p v-if="k.cible" class="text-[11px] text-muted-foreground mt-0.5">{{ k.cible }}</p>
      </div>
    </div>

    <!-- Onglets, même style que Configuration et fiche conducteur -->
    <div class="flex gap-1 border-b border-border mb-3.5 overflow-x-auto">
      <button v-for="t in onglets" :key="t.key" @click="onglet = t.key"
        class="px-3.5 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer bg-transparent"
        :class="onglet === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'">
        {{ t.label }}
        <span v-if="t.badge" class="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-danger-bg text-danger">{{ t.badge }}</span>
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         ÉCHÉANCES PRÉVENTIVES - US 3.1.2
         ═══════════════════════════════════════════════════════ -->
    <div v-if="onglet === 'echeances'" class="flex flex-col gap-3.5">
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle"><CalendarClock class="w-4 h-4 text-primary" /> Échéances à venir</h2>
          <span class="text-[11px] text-muted-foreground">
          </span>
        </div>

        <div v-if="!echeances.length" class="text-xs text-muted-foreground py-3">
          Aucune échéance calculable - le plan d’entretien n’est défini que pour le modèle SINOTRUCK HOWO NX-400.
        </div>

        <table v-else :class="L.table">
          <thead><tr>
            <th :class="L.th" class="cursor-default">Véhicule</th>
            <th :class="L.th" class="cursor-default">Opération</th>
            <th :class="L.th" class="cursor-default">Sous-système</th>
            <th :class="L.th" class="cursor-default">Nature</th>
            <th :class="L.th" class="cursor-default">Échéance</th>
            <th :class="L.th" class="cursor-default">État</th>
          </tr></thead>
          <tbody>
            <tr v-for="e in echeances" :key="e.vehiculeId + e.operationId" :class="L.rowHover">
              <td :class="L.td"><span class="font-mono text-xs font-medium">{{ e.vehiculePlaque }}</span></td>
              <td :class="L.td"><span class="text-xs">{{ e.operationLibelle }}</span></td>
              <td :class="L.td"><span class="text-xs text-muted-foreground">{{ LIB_SOUS_SYSTEME[e.sousSysteme] }}</span></td>
              <td :class="L.td">
                <span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {{ LIB_NATURE_OPERATION[e.nature] }}
                </span>
              </td>
              <td :class="L.td">
                <span v-if="e.kmProchain" class="text-xs">{{ e.kmProchain.toLocaleString('fr-FR') }} km</span>
                <div v-if="e.kmRestants != null" class="text-[11px]"
                  :class="e.kmRestants < 0 ? 'text-danger font-medium' : 'text-muted-foreground'">
                  {{ e.kmRestants < 0 ? `dépassée de ${Math.abs(e.kmRestants).toLocaleString('fr-FR')} km`
                                      : `dans ${e.kmRestants.toLocaleString('fr-FR')} km` }}
                </div>
              </td>
              <td :class="L.td">
                <span class="text-[11px] font-medium px-2 py-0.5 rounded-full" :class="CLS_ECHEANCE[e.statut]">
                  {{ LIB_ECHEANCE[e.statut] }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          Le déclenchement se fait au premier des deux seuils atteint - kilométrage ou date.
          Le plan constructeur du SINOTRUCK HOWO NX-400 sert de référence, il reste modifiable.
        </p>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         FIABILITÉ - US 3.5.1
         ═══════════════════════════════════════════════════════ -->
    <div v-else-if="onglet === 'fiabilite'" class="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
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
              <td :class="L.td"><span class="text-xs font-medium">Ratio humain / technique</span></td>
              <td :class="L.td"><span class="text-[11px] text-muted-foreground">Jours perdus humains ÷ techniques</span></td>
              <td :class="L.td"><span class="text-xs font-semibold">{{ store.ratioHumainTechnique ?? '-' }}</span></td>
            </tr>
          </tbody>
        </table>

        <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          Le MTBF est exprimé en kilomètres : GTD ne relève pas d’heures de fonctionnement moteur.
          La cible du ratio préventif est de 60 % au cahier des charges.
        </p>
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
          <h2 :class="L.cardTitle"><CalendarOff class="w-4 h-4 text-primary" /> Jours perdus par cause</h2>
        </div>
        <div class="flex flex-col gap-2.5">
          <div v-for="(jours, famille) in store.joursPerdusParFamille" :key="famille">
            <div class="flex items-baseline justify-between mb-1">
              <span class="text-xs text-foreground">{{ LIB_FAMILLE_INDISPO[famille as FamilleIndispo] }}</span>
              <span class="text-xs font-semibold">{{ jours }} j</span>
            </div>
            <div class="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div class="h-full rounded-full" :class="CLS_FAMILLE[famille as FamilleIndispo]"
                :style="{ width: (totalJours ? (jours as number) / totalJours * 100 : 0) + '%' }" />
            </div>
          </div>
        </div>
        <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          Les jours perdus sont comptés mais non valorisés : le coût d’immobilisation journalier
          n’a pas été communiqué par GTD.
        </p>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         COÛTS - US 3.5.2
         ═══════════════════════════════════════════════════════ -->
    <div v-else-if="onglet === 'couts'" :class="L.card">
      <div :class="L.cardHeader">
        <h2 :class="L.cardTitle"><Coins class="w-4 h-4 text-primary" /> Coûts par ordre de travail</h2>
        <span class="text-[11px] text-muted-foreground">pièces et sous-traitance</span>
      </div>

      <table :class="L.table">
        <thead><tr>
          <th :class="L.th" class="cursor-default">Ordre</th>
          <th :class="L.th" class="cursor-default">Véhicule</th>
          <th :class="L.th" class="cursor-default">Sous-système</th>
          <th :class="L.th" class="cursor-default">Type</th>
          <th :class="L.th" class="cursor-default">Coût</th>
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
            <td :class="L.td"><span class="text-xs font-semibold">{{ fmtAr(store.coutOT(o)) }}</span></td>
          </tr>
        </tbody>
      </table>

      <div class="flex items-start gap-2.5 bg-background border border-border rounded-lg px-3.5 py-2.5 mt-3">
        <FileQuestion class="w-4 h-4 shrink-0 mt-px text-muted-foreground" />
        <p class="text-[11px] text-muted-foreground leading-relaxed">
          Le coût au kilomètre et le coût moyen par sous-système ne sont pas produits : ils supposent
          le tarif horaire de la main-d’œuvre interne, que GTD n’a pas communiqué. Seules les pièces
          et la sous-traitance sont valorisées.
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
 * Deux valeurs manquent et sont signalées à l'écran plutôt qu'inventées :
 * le tarif horaire de l'atelier et le coût d'immobilisation journalier.
 */
import { ref, computed } from 'vue'
import {
  CalendarClock, Gauge, AlertTriangle, CalendarOff, Coins, FileQuestion,
} from 'lucide-vue-next'
import { useMaintenanceStore } from '../../stores/maintenance'
import { useVehiculesStore } from '../../stores/vehicules'
import {
  LIB_SOUS_SYSTEME, LIB_NATURE_OPERATION, LIB_TYPE_MAINTENANCE, LIB_FAMILLE_INDISPO,
} from '../../types/maintenance'
import type { EcheanceEntretien, FamilleIndispo } from '../../types/maintenance'
import { fmtAr } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'

const store    = useMaintenanceStore()
const vehicules = useVehiculesStore()

const onglet = ref<'echeances' | 'fiabilite' | 'couts'>('echeances')

const LIB_ECHEANCE: Record<EcheanceEntretien['statut'], string> = {
  a_venir:  'À venir',
  proche:   'Proche',
  depassee: 'Dépassée',
}

const CLS_ECHEANCE: Record<EcheanceEntretien['statut'], string> = {
  a_venir:  'bg-gray-100 text-gray-600',
  proche:   'bg-warning-bg text-warning',
  depassee: 'bg-danger-bg text-danger',
}

const CLS_FAMILLE: Record<FamilleIndispo, string> = {
  technique:      'bg-danger',
  reglementaire:  'bg-warning',
  administrative: 'bg-info',
  humaine:        'bg-primary',
}

/* ── Échéances calculées pour les tracteurs du parc ────────── */
const echeances = computed<EcheanceEntretien[]>(() =>
  vehicules.auParc
    .filter(v => v.typeVehicule === 'tracteur' && v.kilometrage != null)
    .flatMap(v => {
      /* Le relevé des derniers passages est désormais tenu par le store :
         sans lui, chaque opération repartait de zéro kilomètre. */
      const p = store.passagesDe(v.id)
      return store.echeancesDuVehicule(v.id, v.plaque, v.modele, v.kilometrage ?? 0, p.km, p.dates)
    })
    .filter(e => e.statut !== 'a_venir' || (e.kmRestants ?? 0) < 5_000)
    .sort((a, b) => (a.kmRestants ?? 0) - (b.kmRestants ?? 0)))

const echeancesDepassees = computed(() => echeances.value.filter(e => e.statut === 'depassee').length)

const maxPannes = computed(() =>
  Math.max(1, ...store.pannesParSousSysteme.map(p => p.nb)))

const totalJours = computed(() =>
  Object.values(store.joursPerdusParFamille).reduce((s, v) => s + (v as number), 0))

const ordresParCout = computed(() =>
  [...store.ordres].sort((a, b) => store.coutOT(b) - store.coutOT(a)))

const onglets = computed(() => [
  { key: 'echeances' as const, label: 'Échéances préventives', badge: echeancesDepassees.value },
  { key: 'fiabilite' as const, label: 'Fiabilité',             badge: 0 },
  { key: 'couts' as const,     label: 'Coûts',                 badge: 0 },
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
    cls: 'text-foreground', cible: '' },
])
</script>
