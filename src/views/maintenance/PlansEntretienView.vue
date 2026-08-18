<template>
  <div :class="L.pagePadding">

    <div :class="L.pageHeader">
      <div>
        <h1 :class="L.pageTitle">Plans d’entretien</h1>
        <p :class="L.pageSub">
          Les échéances constructeur, par modèle de véhicule ·
          {{ store.plans.length }} plan(s) · {{ vehiculesCouverts }} véhicule(s) couvert(s)
          sur {{ vehiculesActifs.length }}
        </p>
      </div>
      <button :class="L.btnPrimary" @click="ouvrirCreation()">
        <Plus class="w-4 h-4" /> Nouveau plan
      </button>
    </div>

    <!-- ═══ Modèles du parc dépourvus de plan ═══════════════════
         Un seul plan constructeur a été transmis. Les véhicules des
         autres modèles n'ont aucune échéance calculée : le dire, et
         proposer de créer le plan manquant en un clic.
         ═══════════════════════════════════════════════════════════ -->
    <div v-if="modelesSansPlan.length"
      class="flex items-start gap-2.5 bg-warning-bg text-warning rounded-lg px-3.5 py-3 mb-3.5">
      <FileQuestion class="w-4 h-4 shrink-0 mt-px" />
      <div class="flex-1">
        <p class="text-xs font-medium">
          {{ modelesSansPlan.length }} modèle(s) du parc sans plan d’entretien
        </p>
        <p class="text-[11px] leading-relaxed mt-1">
          Aucune échéance préventive n’est calculée pour ces véhicules : ils ne remonteront
          jamais dans l’écran Échéances, quel que soit leur kilométrage. Le plan constructeur
          de chaque modèle - liste des opérations, intervalle en kilomètres ou en mois, et
          nature de l’opération - reste à obtenir de GTD.
        </p>
        <div class="flex flex-wrap gap-1.5 mt-2">
          <button
            v-for="m in modelesSansPlan" :key="m.modele"
            class="text-[11px] font-medium px-2.5 py-1 rounded-full border border-warning/30 bg-card text-warning cursor-pointer inline-flex items-center gap-1 hover:bg-warning/10"
            @click="ouvrirCreation(m.marque, m.modele)"
          >
            <Plus class="w-3 h-3" />
            {{ m.marque }} {{ m.modele }}
            <span class="opacity-70">({{ m.nb }} véh.)</span>
          </button>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-3.5">
      <div v-for="plan in store.plans" :key="plan.id" :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle">
            <Wrench class="w-4 h-4 text-primary" /> {{ plan.marque }} {{ plan.modele }}
          </h2>
          <div class="flex items-center gap-2">
            <span class="text-[11px]"
              :class="nbVehicules(plan.modele) ? 'text-muted-foreground' : 'text-warning'">
              {{ plan.operations.length }} opération(s) ·
              {{ nbVehicules(plan.modele) }} véhicule(s) concerné(s)
            </span>
            <button
              class="text-[11px] font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer"
              :class="plan.actif ? 'bg-success-bg text-success' : 'bg-gray-100 text-gray-400'"
              @click="store.basculerPlanActif(plan.id)"
            >{{ plan.actif ? 'Actif' : 'Inactif' }}</button>
            <button :class="L.actView" @click="ouvrirDuplication(plan.id)">
              <Copy class="w-3 h-3" /> Dupliquer
            </button>
            <button :class="L.actReject" @click="demanderSuppression(plan)">
              <Trash2 class="w-3 h-3" /> Supprimer
            </button>
          </div>
        </div>

        <div v-if="!plan.operations.length" class="text-xs text-warning py-3">
          Ce plan ne contient aucune opération : il ne déclenche donc aucune échéance.
        </div>

        <table v-else :class="L.table">
          <thead><tr>
            <th :class="L.th" class="cursor-default">Opération</th>
            <th :class="L.th" class="cursor-default">Sous-système</th>
            <th :class="L.th" class="cursor-default">Nature</th>
            <th :class="L.th" class="cursor-default">Intervalle</th>
            <th :class="L.th" class="cursor-default w-10"></th>
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
                <span v-if="op.intervalleKm && op.intervalleJours" class="text-xs">
                  tous les {{ op.intervalleKm.toLocaleString('fr-FR') }} km
                  <span class="text-muted-foreground">ou {{ op.intervalleJours }} jours</span>
                </span>
                <span v-else-if="op.intervalleKm" class="text-xs">
                  tous les {{ op.intervalleKm.toLocaleString('fr-FR') }} km
                </span>
                <span v-else-if="op.intervalleJours" class="text-xs">
                  tous les {{ op.intervalleJours }} jours
                </span>
                <span v-else class="text-[11px] text-danger">aucun intervalle</span>
              </td>
              <td :class="L.td">
                <button
                  class="w-6 h-6 rounded border-0 bg-transparent text-muted-foreground cursor-pointer inline-flex items-center justify-center hover:text-danger hover:bg-danger-bg"
                  :title="`Retirer ${op.libelle}`"
                  @click="store.supprimerOperation(plan.id, op.id)"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Ajout d'une opération, en ligne sous le tableau du plan -->
        <div v-if="brouillons[plan.id]"
          class="grid grid-cols-1 sm:grid-cols-[1fr_150px_130px_110px_110px_auto] gap-2 mt-3 items-end">
          <div :class="F.field">
            <label :class="F.fieldLabel">Opération</label>
            <input
              v-model="brouillons[plan.id]!.libelle" type="text" :class="F.fieldInput"
              class="!h-[32px] !text-xs"
              placeholder="ex. Vidange du pont"
              @keyup.enter="ajouter(plan.id)"
            />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Sous-système</label>
            <select v-model="brouillons[plan.id]!.sousSysteme" :class="F.fieldSelect" class="!h-[32px] !text-xs">
              <option v-for="(lib, ss) in LIB_SOUS_SYSTEME" :key="ss" :value="ss">{{ lib }}</option>
            </select>
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Nature</label>
            <select v-model="brouillons[plan.id]!.nature" :class="F.fieldSelect" class="!h-[32px] !text-xs">
              <option v-for="(lib, n) in LIB_NATURE_OPERATION" :key="n" :value="n">{{ lib }}</option>
            </select>
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Tous les … km</label>
            <input v-model.number="brouillons[plan.id]!.intervalleKm" type="number" min="0" step="1000"
              :class="F.fieldInput" class="!h-[32px] !text-xs" placeholder="15000" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">… ou … jours</label>
            <input v-model.number="brouillons[plan.id]!.intervalleJours" type="number" min="0"
              :class="F.fieldInput" class="!h-[32px] !text-xs" placeholder="365" />
          </div>
          <button :class="L.btnOutline" class="!h-[32px] !py-0" @click="ajouter(plan.id)">
            <Plus class="w-3.5 h-3.5" /> Ajouter
          </button>
        </div>

        <p v-if="erreurs[plan.id]" :class="F.fieldError" class="mt-2">
          <AlertCircle class="w-3 h-3" /> {{ erreurs[plan.id] }}
        </p>

        <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          Le déclenchement se fait au premier des deux seuils atteint, kilométrage ou date.
          Une opération doit porter au moins un intervalle, sinon elle ne déclenche rien.
          Le préavis d’alerte - {{ store.PREAVIS_KM.toLocaleString('fr-FR') }} km ou
          {{ store.PREAVIS_JOURS }} jours - se règle dans Flotte → Configuration, onglet Paramètres.
        </p>
      </div>

      <div v-if="!store.plans.length" :class="L.card">
        <div class="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <ClipboardList class="w-8 h-8" />
          <p class="text-sm">Aucun plan d’entretien enregistré</p>
          <p class="text-[11px]">Aucune échéance préventive n’est calculée pour le parc.</p>
        </div>
      </div>
    </div>

    <!-- ═══ Création ou duplication d'un plan ═══════════════════ -->
    <div v-if="modale" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      @click.self="modale = null">
      <div class="bg-card rounded-lg border border-border shadow-lg w-full max-w-md p-4">
        <h3 class="text-sm font-semibold text-foreground mb-3">
          {{ modale.source ? 'Dupliquer le plan' : 'Nouveau plan d’entretien' }}
        </h3>

        <p v-if="modale.source" class="text-[11px] text-muted-foreground mb-3 leading-relaxed">
          Les {{ store.getPlan(modale.source)?.operations.length ?? 0 }} opérations du plan
          {{ store.getPlan(modale.source)?.marque }} {{ store.getPlan(modale.source)?.modele }}
          seront recopiées et resteront modifiables indépendamment.
        </p>

        <div class="flex flex-col gap-3">
          <div :class="F.field">
            <label :class="F.fieldLabel">Marque</label>
            <input v-model="modale.marque" type="text" :class="F.fieldInput" placeholder="ex. Scania" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Modèle</label>
            <input v-model="modale.modele" type="text" :class="F.fieldInput" placeholder="ex. R 450" />
          </div>
        </div>

        <p v-if="modale.erreur" :class="F.fieldError" class="mt-2">
          <AlertCircle class="w-3 h-3" /> {{ modale.erreur }}
        </p>

        <div class="flex justify-end gap-2 mt-4">
          <button :class="F.btnOutline" @click="modale = null">Annuler</button>
          <button :class="F.btnPrimary" @click="validerModale">
            {{ modale.source ? 'Dupliquer' : 'Créer' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ Confirmation de suppression ════════════════════════ -->
    <div v-if="aSupprimer" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      @click.self="aSupprimer = null">
      <div class="bg-card rounded-lg border border-border shadow-lg w-full max-w-md p-4">
        <h3 class="text-sm font-semibold text-foreground mb-2">Supprimer ce plan ?</h3>
        <p class="text-xs text-muted-foreground leading-relaxed">
          Le plan {{ aSupprimer.marque }} {{ aSupprimer.modele }} et ses
          {{ aSupprimer.operations.length }} opérations seront retirés.
          <template v-if="nbVehicules(aSupprimer.modele)">
            <strong class="text-danger">
              {{ nbVehicules(aSupprimer.modele) }} véhicule(s) du parc perdront leurs échéances
              préventives.
            </strong>
            Désactiver le plan plutôt que le supprimer conserve l’historique.
          </template>
        </p>
        <div class="flex justify-end gap-2 mt-4">
          <button :class="F.btnOutline" @click="aSupprimer = null">Annuler</button>
          <button :class="F.btnDestructive" @click="confirmerSuppression">Supprimer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * US 3.1.1 - Plans d'entretien par modèle.
 *
 * Un seul plan constructeur a été transmis par GTD, celui du SINOTRUCK
 * HOWO NX-400. Les échéances n'étaient donc calculées que pour ce modèle
 * et l'écran était en lecture seule : il fallait un développeur pour
 * enregistrer un plan supplémentaire.
 *
 * Le responsable maintenance saisit désormais lui-même le plan de chaque
 * modèle du parc. Ce qui manque reste signalé : les modèles dépourvus de
 * plan sont listés en tête, avec le nombre de véhicules qu'ils privent
 * d'échéances préventives.
 */
import { ref, computed, reactive, watchEffect } from 'vue'
import {
  Wrench, FileQuestion, Plus, X, Copy, Trash2, AlertCircle, ClipboardList,
} from 'lucide-vue-next'
import { useMaintenanceStore } from '../../stores/maintenance'
import { useVehiculesStore } from '../../stores/vehicules'
import { LIB_SOUS_SYSTEME, LIB_NATURE_OPERATION } from '../../types/maintenance'
import type { NatureOperation, SousSysteme, PlanEntretien } from '../../types/maintenance'
import * as L from '../../lib/listClasses'
import * as F from '../../lib/formClasses'

const store     = useMaintenanceStore()
const vehicules = useVehiculesStore()

const CLS_NATURE: Record<NatureOperation, string> = {
  verifier:  'bg-info-bg text-info',
  lubrifier: 'bg-warning-bg text-warning',
  remplacer: 'bg-primary/10 text-primary',
}

/* ── Parc ───────────────────────────────────────────────────── */

const vehiculesActifs = computed(() =>
  vehicules.auParc)

const nbVehicules = (modele: string) =>
  vehiculesActifs.value.filter(v => v.modele === modele).length

const vehiculesCouverts = computed(() => {
  const modelesAvecPlan = new Set(store.plans.filter(p => p.actif).map(p => p.modele))
  return vehiculesActifs.value.filter(v => v.modele && modelesAvecPlan.has(v.modele)).length
})

/**
 * Modèles présents au parc mais dépourvus de plan.
 * Comptés par modèle, pour mesurer ce que chaque plan manquant coûte
 * en véhicules privés d'échéances.
 */
const modelesSansPlan = computed(() => {
  const avecPlan = new Set(store.plans.map(p => p.modele.toLowerCase()))
  const acc = new Map<string, { marque: string; modele: string; nb: number }>()
  vehiculesActifs.value.forEach(v => {
    if (!v.modele || avecPlan.has(v.modele.toLowerCase())) return
    const e = acc.get(v.modele) ?? { marque: v.marque ?? '', modele: v.modele, nb: 0 }
    e.nb += 1
    acc.set(v.modele, e)
  })
  return [...acc.values()].sort((a, b) => b.nb - a.nb)
})

/* ── Saisie d'une opération, un brouillon par plan ──────────── */

interface Brouillon {
  libelle: string
  sousSysteme: SousSysteme
  nature: NatureOperation
  intervalleKm: number | null
  intervalleJours: number | null
}

const nouveauBrouillon = (): Brouillon => ({
  libelle: '', sousSysteme: 'moteur', nature: 'verifier',
  intervalleKm: null, intervalleJours: null,
})

const brouillons = reactive<Record<string, Brouillon>>({})
const erreurs    = reactive<Record<string, string>>({})

/* Un plan créé reçoit son brouillon sans qu'on ait à y penser. */
watchEffect(() => {
  store.plans.forEach(p => {
    if (!brouillons[p.id]) brouillons[p.id] = nouveauBrouillon()
  })
})

function ajouter(planId: string) {
  const b = brouillons[planId]
  if (!b) return
  erreurs[planId] = ''

  if (!b.libelle.trim()) {
    erreurs[planId] = 'Le libellé de l’opération est obligatoire.'
    return
  }
  if (!b.intervalleKm && !b.intervalleJours) {
    erreurs[planId] = 'Une opération sans intervalle ne déclenche aucune échéance : indiquez des kilomètres, des jours, ou les deux.'
    return
  }

  const ok = store.ajouterOperation(planId, {
    libelle: b.libelle,
    sousSysteme: b.sousSysteme,
    nature: b.nature,
    intervalleKm: b.intervalleKm || undefined,
    intervalleJours: b.intervalleJours || undefined,
  })

  if (ok) brouillons[planId] = nouveauBrouillon()
  else erreurs[planId] = 'L’opération n’a pas pu être ajoutée.'
}

/* ── Création et duplication d'un plan ──────────────────────── */

interface Modale { marque: string; modele: string; source?: string; erreur?: string }

const modale = ref<Modale | null>(null)

function ouvrirCreation(marque = '', modele = '') {
  modale.value = { marque, modele }
}

function ouvrirDuplication(source: string) {
  const p = store.getPlan(source)
  modale.value = { marque: p?.marque ?? '', modele: '', source }
}

function validerModale() {
  const m = modale.value
  if (!m) return
  m.erreur = ''

  if (!m.marque.trim() || !m.modele.trim()) {
    m.erreur = 'La marque et le modèle sont obligatoires.'
    return
  }

  const id = m.source
    ? store.dupliquerPlan(m.source, m.marque, m.modele)
    : store.creerPlan(m.marque, m.modele)

  if (!id) {
    m.erreur = `Un plan existe déjà pour le modèle ${m.modele.trim()}.`
    return
  }
  modale.value = null
}

/* ── Suppression ────────────────────────────────────────────── */

const aSupprimer = ref<PlanEntretien | null>(null)

function demanderSuppression(plan: PlanEntretien) {
  aSupprimer.value = plan
}

function confirmerSuppression() {
  if (aSupprimer.value) store.supprimerPlan(aSupprimer.value.id)
  aSupprimer.value = null
}
</script>
