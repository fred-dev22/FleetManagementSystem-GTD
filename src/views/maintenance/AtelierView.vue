<template>
  <div :class="L.pagePadding">

    <div :class="L.pageHeader">
      <div>
        <h1 :class="L.pageTitle">Charge de l’atelier</h1>
        <p :class="L.pageSub">
          {{ store.ouverts.length }} intervention(s) à réaliser · {{ store.chargeTotaleH }} h estimées
        </p>
      </div>
    </div>

    <!-- Indicateurs, mêmes tuiles que les autres pages -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5">
      <div v-for="k in kpis" :key="k.label"
        class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        <p class="text-xl font-bold leading-none" :class="k.cls">{{ k.value }}</p>
        <p class="text-xs text-gray-500 mt-1">{{ k.label }}</p>
        <p v-if="k.note" class="text-[11px] text-muted-foreground mt-0.5">{{ k.note }}</p>
      </div>
    </div>

    <!-- ═══ Taux d'occupation - US 3.4.1[4] ═══════════════════
         Le cinquième critère de la user story. Il rapporte la charge
         estimée à la capacité de l'atelier, désormais paramétrée.
         ═══════════════════════════════════════════════════════ -->
    <div v-if="store.capaciteRenseignee" :class="L.card" class="mb-3.5">
      <div :class="L.cardHeader">
        <h2 :class="L.cardTitle"><Gauge class="w-4 h-4 text-primary" /> Taux d’occupation</h2>
        <span class="flex items-center gap-2">
          <MentionSimulation groupe="capacite" texte="capacité simulée" />
          <span class="text-[11px] text-muted-foreground">
            {{ cap.postes }} poste(s) × {{ cap.heuresParJour }} h ×
            {{ cap.joursOuvresParSemaine }} j = {{ store.capaciteHeuresParSemaine }} h par semaine
          </span>
        </span>
      </div>

      <div class="flex items-baseline gap-2 mb-2">
        <span class="text-2xl font-bold leading-none" :class="clsOccupation">
          {{ store.tauxOccupationSemaine }} %
        </span>
        <span class="text-xs text-muted-foreground">
          {{ store.chargeTotaleH }} h de charge pour {{ store.capaciteHeuresParSemaine }} h ouvrables
        </span>
      </div>

      <!-- Au-delà de 100 %, la barre sature et le dépassement est écrit -->
      <div class="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div class="h-full rounded-full transition-all" :class="clsBarreOccupation"
          :style="{ width: Math.min(100, store.tauxOccupationSemaine ?? 0) + '%' }" />
      </div>

      <p class="text-[11px] mt-2.5 leading-relaxed"
        :class="(store.tauxOccupationSemaine ?? 0) > 100 ? 'text-danger' : 'text-muted-foreground'">
        <template v-if="(store.tauxOccupationSemaine ?? 0) > 100">
          L’atelier est saturé : {{ store.joursPourAbsorberCharge }} jour(s) ouvré(s) sont
          nécessaires pour absorber la charge en attente. L’exploitation ne peut pas compter
          sur une remise en service dans la semaine.
        </template>
        <template v-else>
          La charge tient dans la semaine ouvrée :
          {{ store.joursPourAbsorberCharge }} jour(s) ouvré(s) suffisent à l’absorber.
        </template>
      </p>
    </div>

    <div v-else class="flex items-start gap-2.5 bg-warning-bg text-warning rounded-lg px-3.5 py-2.5 mb-3.5">
      <FileQuestion class="w-4 h-4 shrink-0 mt-px" />
      <div>
        <p class="text-xs font-medium">Taux d’occupation non calculé</p>
        <p class="text-[11px] leading-relaxed mt-0.5">
          La charge est connue - {{ store.chargeTotaleH }} h estimées - mais pas la capacité.
          Renseignez le nombre de postes de travail du garage et ses heures d’ouverture dans
          <RouterLink :to="{ name: 'maintenance-parametres' }" class="underline font-medium">
            Paramétrage → Paramètres de l’atelier
          </RouterLink>.
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">

      <!-- ═══ Charge par mécanicien - US 3.4.1[0] ═══ -->
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle"><Users class="w-4 h-4 text-primary" /> Charge par mécanicien</h2>
          <span class="text-[11px] text-muted-foreground">triée par priorité</span>
        </div>

        <div v-if="!store.chargeParMecanicien.length" class="text-xs text-muted-foreground py-3">
          Aucun mécanicien affecté à une intervention en cours.
        </div>

        <div v-else class="flex flex-col gap-3">
          <div v-for="m in store.chargeParMecanicien" :key="m.mecanicien"
            class="border border-border rounded-lg px-3 py-2.5">
            <div class="flex items-baseline justify-between mb-2">
              <span class="text-xs font-semibold text-foreground">{{ m.mecanicien }}</span>
              <span class="text-[11px] text-muted-foreground">
                {{ m.interventions.length }} intervention(s) · {{ m.heuresEstimees }} h estimées
              </span>
            </div>

            <div v-if="!m.interventions.length" class="text-[11px] text-muted-foreground">
              Aucune intervention en cours.
            </div>

            <div v-for="o in m.interventions" :key="o.id"
              class="flex items-center gap-2 py-1.5 border-t border-border/60">
              <span class="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 text-white"
                :class="CLS_PRIORITE[store.prioriteDe(o)]">
                {{ store.prioriteDe(o) }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-[11px] font-medium text-foreground truncate">
                  {{ o.reference }} - {{ o.vehiculePlaque }}
                </p>
                <p class="text-[10px] text-muted-foreground">
                  {{ o.sousSysteme ? LIB_SOUS_SYSTEME[o.sousSysteme] : 'diagnostic à établir' }}
                  <span v-if="o.planifieeLe"> · programmée le {{ fmtDate(o.planifieeLe) }}</span>
                </p>
              </div>
              <span v-if="store.competenceDe(o)"
                class="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                :class="CLS_COMPETENCE[store.competenceDe(o)!]">
                {{ LIB_COMPETENCE[store.competenceDe(o)!] }}
              </span>
              <span class="text-[11px] text-muted-foreground shrink-0">
                {{ o.dureeEstimeeH ? o.dureeEstimeeH + ' h' : '-' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ Compétences requises - US 3.4.1[2] ═══ -->
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle"><Wrench class="w-4 h-4 text-primary" /> Compétences requises</h2>
          <span class="text-[11px] text-muted-foreground">déduites du diagnostic</span>
        </div>

        <table :class="L.table">
          <thead><tr>
            <th :class="L.th" class="cursor-default">Compétence</th>
            <th :class="L.th" class="cursor-default">Interventions</th>
            <th :class="L.th" class="cursor-default">Heures estimées</th>
          </tr></thead>
          <tbody>
            <tr v-for="c in chargeParCompetence" :key="c.competence" :class="L.rowHover">
              <td :class="L.td">
                <span class="text-[10px] font-medium px-2 py-0.5 rounded-full" :class="CLS_COMPETENCE[c.competence]">
                  {{ LIB_COMPETENCE[c.competence] }}
                </span>
              </td>
              <td :class="L.td"><span class="text-xs font-semibold">{{ c.nb }}</span></td>
              <td :class="L.td"><span class="text-xs">{{ c.heures }} h</span></td>
            </tr>
          </tbody>
        </table>

        <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          La compétence n’est pas saisie : elle se déduit du sous-système du diagnostic ISO 14224.
          Une panne de freinage relève de la mécanique, une fuite de vanne relève de la citerne.
        </p>
      </div>

      <!-- ═══ Interventions non affectées ═══ -->
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle"><AlertTriangle class="w-4 h-4 text-primary" /> Non affectées</h2>
          <span class="text-[11px]" :class="store.nonAffectees.length ? 'text-warning' : 'text-success'">
            {{ store.nonAffectees.length }} en attente
          </span>
        </div>

        <div v-if="!store.nonAffectees.length" class="text-xs text-success py-3">
          Toutes les interventions sont affectées.
        </div>

        <table v-else :class="L.table">
          <thead><tr>
            <th :class="L.th" class="cursor-default">Ordre</th>
            <th :class="L.th" class="cursor-default">Véhicule</th>
            <th :class="L.th" class="cursor-default">Priorité</th>
            <th :class="L.th" class="cursor-default">Compétence</th>
          </tr></thead>
          <tbody>
            <tr v-for="o in store.nonAffectees" :key="o.id" :class="L.rowHover">
              <td :class="L.td"><span class="font-mono text-xs">{{ o.reference }}</span></td>
              <td :class="L.td"><span class="font-mono text-xs">{{ o.vehiculePlaque }}</span></td>
              <td :class="L.td">
                <span class="text-[10px] font-medium px-2 py-0.5 rounded-full" :class="LIB_GRAVITE_OT[o.gravite].cls">
                  {{ LIB_GRAVITE_OT[o.gravite].label }}
                </span>
              </td>
              <td :class="L.td">
                <span v-if="store.competenceDe(o)" class="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  :class="CLS_COMPETENCE[store.competenceDe(o)!]">
                  {{ LIB_COMPETENCE[store.competenceDe(o)!] }}
                </span>
                <span v-else class="text-[11px] text-warning">diagnostic requis</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ═══ Immobilisations programmées - US 3.4.1[3] ═══ -->
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle"><CalendarClock class="w-4 h-4 text-primary" /> Immobilisations programmées</h2>
        </div>

        <div v-if="!programmees.length" class="text-xs text-muted-foreground py-3">
          Aucune intervention programmée à une date précise.
        </div>

        <table v-else :class="L.table">
          <thead><tr>
            <th :class="L.th" class="cursor-default">Date</th>
            <th :class="L.th" class="cursor-default">Véhicule</th>
            <th :class="L.th" class="cursor-default">Durée</th>
          </tr></thead>
          <tbody>
            <tr v-for="o in programmees" :key="o.id" :class="L.rowHover">
              <td :class="L.td"><span class="text-xs">{{ fmtDate(o.planifieeLe!) }}</span></td>
              <td :class="L.td"><span class="font-mono text-xs">{{ o.vehiculePlaque }}</span></td>
              <td :class="L.td"><span class="text-xs">{{ o.dureeEstimeeH ?? '-' }} h</span></td>
            </tr>
          </tbody>
        </table>

        <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          Ces immobilisations sont visibles de l’exploitation : le véhicule cesse d’être compté
          comme disponible sur la page État de flotte.
        </p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
/**
 * US 3.4.1 - Planifier la charge de l'atelier.
 *
 * Quatre des cinq critères étaient satisfaits sans information
 * supplémentaire : les compétences sont nommées dans la user story et se
 * déduisent du diagnostic ISO ; la priorité se déduit de la gravité.
 *
 * Le cinquième - le taux d'occupation - supposait la capacité de l'atelier.
 * Elle se saisit désormais dans Paramétrage → Paramètres de l'atelier, et
 * l'indicateur apparaît dès qu'elle est renseignée.
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Users, Wrench, AlertTriangle, CalendarClock, Gauge, FileQuestion,
} from 'lucide-vue-next'
import { useMaintenanceStore } from '../../stores/maintenance'
import MentionSimulation from '../../components/maintenance/MentionSimulation.vue'
import { LIB_SOUS_SYSTEME, LIB_GRAVITE_OT, LIB_COMPETENCE } from '../../types/maintenance'
import type { CompetenceAtelier } from '../../types/maintenance'
import { fmtDate } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'

const store = useMaintenanceStore()

const cap = computed(() => store.parametresAtelier.capacite)

/* Un atelier chargé à 70 % est sain ; au-delà de 90 % il n'absorbe plus
   d'imprévu ; au-delà de 100 % il reporte mécaniquement des sorties. */
const clsOccupation = computed(() => {
  const t = store.tauxOccupationSemaine ?? 0
  if (t > 100) return 'text-danger'
  if (t > 90)  return 'text-warning'
  return 'text-success'
})

const clsBarreOccupation = computed(() => {
  const t = store.tauxOccupationSemaine ?? 0
  if (t > 100) return 'bg-danger'
  if (t > 90)  return 'bg-warning'
  return 'bg-success'
})

const CLS_PRIORITE: Record<number, string> = {
  1: 'bg-danger',
  2: 'bg-warning',
  3: 'bg-gray-400',
}

const CLS_COMPETENCE: Record<CompetenceAtelier, string> = {
  mecanique:   'bg-primary/10 text-primary',
  electricite: 'bg-warning-bg text-warning',
  citerne:     'bg-info-bg text-info',
  pneumatique: 'bg-success-bg text-success',
}

/** Charge regroupée par compétence requise. */
const chargeParCompetence = computed(() => {
  const acc = new Map<CompetenceAtelier, { nb: number; heures: number }>()
  store.ouverts.forEach(o => {
    const c = store.competenceDe(o)
    if (!c) return
    const e = acc.get(c) ?? { nb: 0, heures: 0 }
    e.nb += 1
    e.heures += o.dureeEstimeeH ?? 0
    acc.set(c, e)
  })
  return [...acc.entries()]
    .map(([competence, e]) => ({ competence, ...e }))
    .sort((a, b) => b.nb - a.nb)
})

const programmees = computed(() =>
  store.ouverts
    .filter(o => o.planifieeLe)
    .sort((a, b) => (a.planifieeLe ?? '').localeCompare(b.planifieeLe ?? '')))

const kpis = computed(() => [
  { label: 'Interventions à réaliser', value: String(store.ouverts.length),
    cls: 'text-foreground', note: '' },
  { label: 'Charge estimée', value: store.chargeTotaleH + ' h',
    cls: 'text-foreground', note: '' },
  { label: 'Non affectées', value: String(store.nonAffectees.length),
    cls: store.nonAffectees.length ? 'text-warning' : 'text-success', note: '' },
  { label: 'Taux d’occupation',
    value: store.tauxOccupationSemaine != null ? store.tauxOccupationSemaine + ' %' : '-',
    cls: store.tauxOccupationSemaine != null ? clsOccupation.value : 'text-gray-300',
    note: store.capaciteRenseignee
      ? `sur ${store.capaciteHeuresParSemaine} h ouvrables`
      : 'capacité à renseigner' },
])
</script>
