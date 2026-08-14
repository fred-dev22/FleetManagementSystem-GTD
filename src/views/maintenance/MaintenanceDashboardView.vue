<template>
  <div :class="L.pagePadding">

    <div :class="L.pageHeader">
      <div>
        <h1 :class="L.pageTitle">Maintenance</h1>
        <p :class="L.pageSub">Vue d’ensemble de l’atelier au {{ dateDuJour }}</p>
      </div>
    </div>

    <!-- Indicateurs, mêmes tuiles que les autres pages -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-3.5">
      <div v-for="k in kpis" :key="k.label"
        class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" :class="k.bg">
          <component :is="k.icon" class="w-4.5 h-4.5" :class="k.iconColor" />
        </div>
        <div class="min-w-0">
          <p class="text-xl font-bold leading-none truncate" :class="k.cls">{{ k.value }}</p>
          <p class="text-xs text-gray-500 mt-0.5">{{ k.label }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">

      <!-- ═══ Ce qui demande une action aujourd'hui ═══ -->
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle"><AlertTriangle class="w-4 h-4 text-primary" /> À traiter</h2>
        </div>

        <div class="flex flex-col gap-1.5">
          <button v-for="a in aTraiter" :key="a.libelle"
            class="flex items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left bg-transparent border-0 cursor-pointer transition-colors hover:bg-background"
            @click="router.push({ name: a.route })">
            <div class="flex items-start gap-2.5 min-w-0">
              <component :is="a.icon" class="w-4 h-4 shrink-0 mt-px"
                :class="a.nb ? a.cls : 'text-muted-foreground'" />
              <div class="min-w-0">
                <p class="text-xs font-medium text-foreground">{{ a.libelle }}</p>
                <p class="text-[11px] text-muted-foreground">{{ a.detail }}</p>
              </div>
            </div>
            <span class="text-sm font-bold shrink-0" :class="a.nb ? a.cls : 'text-muted-foreground'">
              {{ a.nb }}
            </span>
          </button>
        </div>
      </div>

      <!-- ═══ Interventions en cours ═══ -->
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle"><Wrench class="w-4 h-4 text-primary" /> Interventions en cours</h2>
          <button :class="L.btnOutline" @click="router.push({ name: 'maintenance-ordres' })">
            Tout voir
          </button>
        </div>

        <div v-if="!store.ouverts.length" class="text-xs text-muted-foreground py-3">
          Aucune intervention en cours.
        </div>

        <table v-else :class="L.table">
          <thead><tr>
            <th :class="L.th" class="cursor-default">Ordre</th>
            <th :class="L.th" class="cursor-default">Véhicule</th>
            <th :class="L.th" class="cursor-default">Diagnostic</th>
            <th :class="L.th" class="cursor-default">Statut</th>
          </tr></thead>
          <tbody>
            <tr v-for="o in store.ouverts.slice(0, 6)" :key="o.id" :class="L.rowHover">
              <td :class="L.td"><span class="font-mono text-xs">{{ o.reference }}</span></td>
              <td :class="L.td"><span class="font-mono text-xs">{{ o.vehiculePlaque }}</span></td>
              <td :class="L.td">
                <span class="text-xs">{{ o.sousSysteme ? LIB_SOUS_SYSTEME[o.sousSysteme] : '-' }}</span>
              </td>
              <td :class="L.td">
                <span class="text-[10px] font-medium px-2 py-0.5 rounded-full" :class="CLS_STATUT[o.statut]">
                  {{ LIB_STATUT_OT[o.statut] }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ═══ Véhicules immobilisés ═══ -->
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle"><CalendarOff class="w-4 h-4 text-primary" /> Véhicules immobilisés</h2>
          <button :class="L.btnOutline" @click="router.push({ name: 'maintenance-indisponibilites' })">
            Tout voir
          </button>
        </div>

        <div v-if="!store.indisposEnCours.length" class="text-xs text-success py-3">
          Aucun véhicule immobilisé.
        </div>

        <table v-else :class="L.table">
          <thead><tr>
            <th :class="L.th" class="cursor-default">Véhicule</th>
            <th :class="L.th" class="cursor-default">Motif</th>
            <th :class="L.th" class="cursor-default">Depuis</th>
          </tr></thead>
          <tbody>
            <tr v-for="i in store.indisposEnCours" :key="i.id" :class="L.rowHover">
              <td :class="L.td"><span class="font-mono text-xs">{{ i.vehiculePlaque }}</span></td>
              <td :class="L.td">
                <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-danger-bg text-danger">
                  {{ i.code }}
                </span>
                <div class="text-[11px] text-muted-foreground">{{ libelleDuCode(i.code) }}</div>
              </td>
              <td :class="L.td">
                <span class="text-xs font-medium"
                  :class="store.dureeIndispo(i) > 3 ? 'text-danger' : 'text-foreground'">
                  {{ store.dureeIndispo(i) }} j
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ═══ Répartition des pannes ═══ -->
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle"><Gauge class="w-4 h-4 text-primary" /> Pannes par sous-système</h2>
          <button :class="L.btnOutline" @click="router.push({ name: 'maintenance-fiabilite' })">
            Fiabilité
          </button>
        </div>

        <div v-if="!store.pannesParSousSysteme.length" class="text-xs text-muted-foreground py-3">
          Aucune panne corrective enregistrée.
        </div>
        <div v-else class="flex flex-col gap-2.5">
          <div v-for="p in store.pannesParSousSysteme.slice(0, 6)" :key="p.sousSysteme">
            <div class="flex items-baseline justify-between mb-1">
              <span class="text-xs text-foreground">{{ LIB_SOUS_SYSTEME[p.sousSysteme] }}</span>
              <span class="text-xs font-semibold">{{ p.nb }}</span>
            </div>
            <div class="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div class="h-full bg-primary rounded-full" :style="{ width: (p.nb / maxPannes * 100) + '%' }" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Vue d'ensemble du module Maintenance.
 *
 * Chaque bloc renvoie vers l'écran détaillé correspondant : cette page sert
 * à voir ce qui demande une action, pas à tout consulter ici.
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Wrench, Gauge, AlertTriangle, CalendarOff, CalendarClock, PackageSearch, Users,
} from 'lucide-vue-next'
import { useMaintenanceStore } from '../../stores/maintenance'
import { useVehiculesStore } from '../../stores/vehicules'
import { LIB_SOUS_SYSTEME, LIB_STATUT_OT, libelleDuCode } from '../../types/maintenance'
import type { StatutOT } from '../../types/maintenance'
import { fmtAr } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'

const router    = useRouter()
const store     = useMaintenanceStore()
const vehicules = useVehiculesStore()

const dateDuJour = new Date().toLocaleDateString('fr-FR', {
  day: '2-digit', month: 'long', year: 'numeric',
})

const CLS_STATUT: Record<StatutOT, string> = {
  ouvert:             'bg-info-bg text-info',
  diagnostique:       'bg-primary/10 text-primary',
  attente_piece:      'bg-warning-bg text-warning',
  en_cours:           'bg-primary/10 text-primary',
  attente_validation: 'bg-warning-bg text-warning',
  cloture:            'bg-success-bg text-success',
  annule:             'bg-gray-100 text-gray-400',
}

/** Échéances dépassées, calculées depuis les plans d'entretien. */
const echeancesDepassees = computed(() =>
  vehicules.vehicules
    .filter(v => v.typeVehicule === 'tracteur' && v.kilometrage != null)
    .flatMap(v => store.echeancesDuVehicule(v.id, v.plaque, v.modele, v.kilometrage ?? 0, {}))
    .filter(e => e.statut === 'depassee').length)

/** Ordres sans diagnostic complet : leur clôture est impossible. */
const sansDiagnostic = computed(() =>
  store.ouverts.filter(o => !o.sousSysteme || !o.modeDefaillance || !o.causeRacine).length)

const aTraiter = computed(() => [
  { libelle: 'Échéances dépassées', detail: 'Entretiens préventifs en retard',
    nb: echeancesDepassees.value, icon: CalendarClock, cls: 'text-danger',
    route: 'maintenance-echeances' },
  { libelle: 'En attente de pièce', detail: 'Véhicules immobilisés faute de pièce',
    nb: store.enAttentePiece.length, icon: PackageSearch, cls: 'text-warning',
    route: 'maintenance-ordres' },
  { libelle: 'Diagnostic à établir', detail: 'La clôture reste impossible sans lui',
    nb: sansDiagnostic.value, icon: Wrench, cls: 'text-warning',
    route: 'maintenance-ordres' },
  { libelle: 'Interventions mobiles en cours', detail: 'Équipe déployée sur la route',
    nb: store.mobilesEnCours.length, icon: Users, cls: 'text-info',
    route: 'maintenance-equipe-mobile' },
])

const maxPannes = computed(() => Math.max(1, ...store.pannesParSousSysteme.map(p => p.nb)))

const kpis = computed(() => [
  { label: 'Interventions en cours', value: String(store.ouverts.length),
    icon: Wrench, bg: 'bg-primary/10', iconColor: 'text-primary', cls: 'text-foreground' },
  { label: 'Véhicules immobilisés', value: String(store.indisposEnCours.length),
    icon: CalendarOff, bg: 'bg-danger-bg', iconColor: 'text-danger',
    cls: store.indisposEnCours.length ? 'text-danger' : 'text-success' },
  { label: 'MTTR', value: store.mttrHeures != null ? store.mttrHeures + ' h' : '-',
    icon: Gauge, bg: 'bg-info-bg', iconColor: 'text-info', cls: 'text-foreground' },
  { label: 'Préventif', value: store.ratioPreventif != null ? store.ratioPreventif + ' %' : '-',
    icon: AlertTriangle, bg: 'bg-success-bg', iconColor: 'text-success',
    cls: (store.ratioPreventif ?? 0) >= 60 ? 'text-success' : 'text-danger' },
  { label: 'Coût pièces', value: fmtAr(store.coutTotal),
    icon: PackageSearch, bg: 'bg-gray-100', iconColor: 'text-gray-600', cls: 'text-foreground' },
])
</script>
