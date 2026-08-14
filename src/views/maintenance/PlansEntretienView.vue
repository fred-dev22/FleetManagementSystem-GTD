<template>
  <div :class="L.pagePadding">

    <div :class="L.pageHeader">
      <div>
        <h1 :class="L.pageTitle">Plans d’entretien</h1>
        <p :class="L.pageSub">Les échéances constructeur, par modèle de véhicule</p>
      </div>
    </div>

    <div class="flex flex-col gap-3.5">
      <div v-for="plan in store.plans" :key="plan.id" :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle">
            <Wrench class="w-4 h-4 text-primary" /> {{ plan.marque }} {{ plan.modele }}
          </h2>
          <div class="flex items-center gap-2">
            <span class="text-[11px] text-muted-foreground">
              {{ plan.operations.length }} opération(s) · {{ nbVehicules(plan.modele) }} véhicule(s) concerné(s)
            </span>
            <span class="text-[11px] font-medium px-2 py-0.5 rounded-full"
              :class="plan.actif ? 'bg-success-bg text-success' : 'bg-gray-100 text-gray-400'">
              {{ plan.actif ? 'Actif' : 'Inactif' }}
            </span>
          </div>
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
                <span class="text-[10px] font-medium px-2 py-0.5 rounded-full" :class="CLS_NATURE[op.nature]">
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
          Le déclenchement se fait au premier des deux seuils atteint, kilométrage ou date.
          Ce plan s’applique à tous les véhicules de ce modèle et alimente l’écran des échéances.
        </p>
      </div>

      <!-- Ce qui manque est signalé, pas inventé -->
      <!-- <div class="flex items-start gap-2.5 bg-background border border-border rounded-lg px-3.5 py-3">
        <FileQuestion class="w-4 h-4 shrink-0 mt-px text-muted-foreground" />
        <div>
          <p class="text-xs font-medium text-foreground">Un seul plan constructeur transmis</p>
          <p class="text-[11px] text-muted-foreground leading-relaxed mt-1">
            Seul le plan du SINOTRUCK HOWO NX-400 a été communiqué. Les échéances ne sont donc
            calculées que pour ce modèle. Les plans des autres modèles du parc restent à fournir
            par GTD pour que leurs entretiens soient suivis automatiquement.
          </p>
          <p v-if="modelesSansPlan.length" class="text-[11px] text-warning leading-relaxed mt-1.5">
            Modèles du parc sans plan d’entretien : {{ modelesSansPlan.join(', ') }}.
          </p>
        </div>
      </div> -->
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * US 3.1.1 - Plans d'entretien par modèle.
 * Source : plan constructeur SINOTRUCK HOWO NX-400 fourni par GTD.
 */
import { computed } from 'vue'
import { Wrench, FileQuestion } from 'lucide-vue-next'
import { useMaintenanceStore } from '../../stores/maintenance'
import { useVehiculesStore } from '../../stores/vehicules'
import { LIB_SOUS_SYSTEME, LIB_NATURE_OPERATION } from '../../types/maintenance'
import type { NatureOperation } from '../../types/maintenance'
import * as L from '../../lib/listClasses'

const store     = useMaintenanceStore()
const vehicules = useVehiculesStore()

const CLS_NATURE: Record<NatureOperation, string> = {
  verifier:  'bg-info-bg text-info',
  lubrifier: 'bg-warning-bg text-warning',
  remplacer: 'bg-primary/10 text-primary',
}

const nbVehicules = (modele: string) =>
  vehicules.vehicules.filter(v => v.modele === modele).length

/** Modèles présents au parc mais dépourvus de plan d'entretien. */
const modelesSansPlan = computed(() => {
  const avecPlan = new Set(store.plans.map(p => p.modele))
  return [...new Set(
    vehicules.vehicules
      .filter(v => v.typeVehicule === 'tracteur' && v.modele && !avecPlan.has(v.modele))
      .map(v => v.modele as string),
  )].sort()
})
</script>
