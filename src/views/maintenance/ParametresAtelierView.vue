<template>
  <div :class="L.pagePadding">

    <div :class="L.pageHeader">
      <div>
        <h1 :class="L.pageTitle">Paramètres de l’atelier</h1>
        <p :class="L.pageSub">
          Les trois valeurs qui gouvernent les indicateurs de charge et de coût
        </p>
      </div>
    </div>

    <div class="flex items-start gap-2.5 bg-info-bg text-info rounded-lg px-3.5 py-2.5 mb-3.5">
      <Info class="w-4 h-4 shrink-0 mt-px" />
      <p class="text-xs leading-relaxed">
        Chacune de ces valeurs débloque un indicateur qui reste masqué tant qu’elle est vide.
        Rien n’est calculé à partir d’une estimation : un champ non renseigné produit un tiret,
        jamais un chiffre approché.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">

      <!-- ═══ 1. Capacité de l'atelier ═══════════════════════════ -->
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle">
            <Building2 class="w-4 h-4 text-primary" /> Capacité de l’atelier
          </h2>
          <span class="text-[11px] font-medium px-2 py-0.5 rounded-full"
            :class="store.capaciteRenseignee ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'">
            {{ store.capaciteRenseignee ? 'Renseignée' : 'À renseigner' }}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div :class="F.field">
            <label :class="F.fieldLabel">Garage</label>
            <input v-model="cap.site" type="text" :class="F.fieldInput" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Postes de travail</label>
            <input v-model.number="cap.postes" type="number" min="1" :class="F.fieldInput"
              placeholder="ex. 3" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Heures d’ouverture par jour</label>
            <input v-model.number="cap.heuresParJour" type="number" min="1" max="24"
              :class="F.fieldInput" placeholder="ex. 8" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Jours ouvrés par semaine</label>
            <input v-model.number="cap.joursOuvresParSemaine" type="number" min="1" max="7"
              :class="F.fieldInput" placeholder="ex. 6" />
          </div>
        </div>

        <div v-if="store.capaciteRenseignee"
          class="mt-3 rounded-lg bg-background border border-border px-3.5 py-2.5">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-lg font-bold leading-none text-foreground">
                {{ store.capaciteHeuresParJour }} h
              </p>
              <p class="text-[11px] text-muted-foreground mt-1">Capacité par jour</p>
            </div>
            <div>
              <p class="text-lg font-bold leading-none text-foreground">
                {{ store.capaciteHeuresParSemaine }} h
              </p>
              <p class="text-[11px] text-muted-foreground mt-1">Capacité par semaine</p>
            </div>
          </div>
        </div>

        <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          Un taux d’occupation rapporte une charge à une capacité. La charge est déjà calculée :
          le système additionne les heures estimées des interventions ouvertes. Ces deux champs
          fournissent la capacité et font apparaître le
          <strong>taux d’occupation</strong> sur l’écran Charge atelier.
        </p>
      </div>

      <!-- ═══ 2. Tarif horaire de la main-d'œuvre ════════════════ -->
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle">
            <Coins class="w-4 h-4 text-primary" /> Tarif horaire de la main-d’œuvre
          </h2>
          <span class="text-[11px] font-medium px-2 py-0.5 rounded-full"
            :class="store.tarifRenseigne ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'">
            {{ store.tarifRenseigne ? 'Renseigné' : 'À renseigner' }}
          </span>
        </div>

        <div :class="F.field">
          <label :class="F.fieldLabel">Tarif unique (Ar / heure)</label>
          <input v-model.number="mo.tarifUniqueAr" type="number" min="0" step="1000"
            :class="F.fieldInput" placeholder="ex. 12 000" />
        </div>

        <button
          class="mt-3 text-[11px] font-medium text-primary bg-transparent border-0 cursor-pointer p-0 inline-flex items-center gap-1"
          @click="detailSpecialite = !detailSpecialite"
        >
          <ChevronRight class="w-3 h-3 transition-transform" :class="detailSpecialite ? 'rotate-90' : ''" />
          Le tarif varie selon la spécialité
        </button>

        <div v-if="detailSpecialite" class="grid grid-cols-2 gap-3 mt-2.5">
          <div v-for="c in COMPETENCES" :key="c" :class="F.field">
            <label :class="F.fieldLabel">{{ LIB_COMPETENCE[c] }}</label>
            <input
              :value="mo.parCompetence[c] ?? null" type="number" min="0" step="1000"
              :class="F.fieldInput" :placeholder="mo.tarifUniqueAr ? `défaut ${mo.tarifUniqueAr}` : 'Ar / h'"
              @input="majTarifCompetence(c, ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>

        <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          Le temps passé par chaque mécanicien est enregistré depuis le début ; seul son prix
          manquait. Ce tarif fait apparaître le <strong>coût complet d’une intervention</strong>
          et le <strong>coût de maintenance au kilomètre</strong>, sur l’onglet Coûts de l’écran Fiabilité.
          Le tarif d’une spécialité prime sur le tarif unique.
        </p>
      </div>

      <!-- ═══ 3. Coût d'immobilisation ═══════════════════════════ -->
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle">
            <CalendarOff class="w-4 h-4 text-primary" /> Coût d’immobilisation par jour
          </h2>
          <span class="text-[11px] font-medium px-2 py-0.5 rounded-full"
            :class="store.coutImmoRenseigne ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'">
            {{ store.coutImmoRenseigne ? 'Renseigné' : 'À renseigner' }}
          </span>
        </div>

        <div :class="F.field">
          <label :class="F.fieldLabel">Manque à gagner moyen (Ar / jour)</label>
          <input v-model.number="immo.moyenJourAr" type="number" min="0" step="10000"
            :class="F.fieldInput" placeholder="ex. 850 000" />
        </div>

        <button
          class="mt-3 text-[11px] font-medium text-primary bg-transparent border-0 cursor-pointer p-0 inline-flex items-center gap-1"
          @click="detailTypeVehicule = !detailTypeVehicule"
        >
          <ChevronRight class="w-3 h-3 transition-transform" :class="detailTypeVehicule ? 'rotate-90' : ''" />
          Le coût diffère selon le type de véhicule
        </button>

        <div v-if="detailTypeVehicule" class="grid grid-cols-2 gap-3 mt-2.5">
          <div :class="F.field">
            <label :class="F.fieldLabel">Tracteur (Ar / jour)</label>
            <input v-model.number="immo.tracteurJourAr" type="number" min="0" step="10000"
              :class="F.fieldInput" :placeholder="immo.moyenJourAr ? `défaut ${immo.moyenJourAr}` : 'Ar / j'" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Citerne / remorque (Ar / jour)</label>
            <input v-model.number="immo.citerneJourAr" type="number" min="0" step="10000"
              :class="F.fieldInput" :placeholder="immo.moyenJourAr ? `défaut ${immo.moyenJourAr}` : 'Ar / j'" />
          </div>
        </div>

        <div v-if="store.coutTotalImmobilisations != null"
          class="mt-3 rounded-lg bg-danger-bg px-3.5 py-2.5">
          <p class="text-lg font-bold leading-none text-danger">
            {{ fmtAr(store.coutTotalImmobilisations) }}
          </p>
          <p class="text-[11px] text-danger/80 mt-1">
            Coût des {{ totalJoursPerdus }} jours d’immobilisation enregistrés
          </p>
        </div>

        <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          Les jours perdus sont comptés par famille de cause depuis le début, mais ils restaient
          des jours. Cette valeur les convertit en ariary — c’est l’argument le plus parlant face
          au client : « ce vetting expiré vous a coûté tant ». Visible sur l’écran Immobilisations
          et dans le bloc Jours perdus de l’écran Fiabilité.
        </p>
      </div>

      <!-- ═══ Ce qui reste masqué ════════════════════════════════ -->
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle">
            <EyeOff class="w-4 h-4 text-primary" /> Indicateurs encore masqués
          </h2>
        </div>

        <div v-if="!manquants.length" class="text-xs text-success py-3">
          Tous les indicateurs de charge et de coût sont calculés.
        </div>

        <table v-else :class="L.table">
          <thead><tr>
            <th :class="L.th" class="cursor-default">Indicateur</th>
            <th :class="L.th" class="cursor-default">Valeur attendue</th>
            <th :class="L.th" class="cursor-default">Écran</th>
          </tr></thead>
          <tbody>
            <tr v-for="m in manquants" :key="m.indicateur" :class="L.rowHover">
              <td :class="L.td"><span class="text-xs font-medium">{{ m.indicateur }}</span></td>
              <td :class="L.td"><span class="text-[11px] text-warning">{{ m.valeur }}</span></td>
              <td :class="L.td"><span class="text-[11px] text-muted-foreground">{{ m.ecran }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Paramètres de l'atelier.
 *
 * Trois valeurs manquaient au cahier des charges et bloquaient chacune un
 * indicateur : la capacité de l'atelier, le tarif horaire de la main-d'œuvre
 * interne et le coût d'immobilisation journalier. Elles sont désormais
 * saisissables par l'exploitation, sans intervention technique.
 *
 * Le parti pris est inchangé : rien n'est estimé. Un champ vide masque
 * l'indicateur qu'il gouverne, et cet écran dit lequel.
 */
import { ref, computed } from 'vue'
import {
  Info, Building2, Coins, CalendarOff, ChevronRight, EyeOff,
} from 'lucide-vue-next'
import { useMaintenanceStore } from '../../stores/maintenance'
import { LIB_COMPETENCE } from '../../types/maintenance'
import type { CompetenceAtelier } from '../../types/maintenance'
import { fmtAr } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'
import * as F from '../../lib/formClasses'

const store = useMaintenanceStore()

const COMPETENCES: CompetenceAtelier[] = ['mecanique', 'electricite', 'citerne', 'pneumatique']

const detailSpecialite    = ref(false)
const detailTypeVehicule  = ref(false)

/* Les trois blocs du store, édités directement : Pinia rend la mutation
   réactive et les indicateurs se recalculent à la frappe. */
const cap  = store.parametresAtelier.capacite
const mo   = store.parametresAtelier.mainOeuvre
const immo = store.parametresAtelier.immobilisation

/** Un champ vidé retire la spécialité plutôt que d'y stocker zéro. */
function majTarifCompetence(c: CompetenceAtelier, valeur: string) {
  const n = Number(valeur)
  if (!valeur.trim() || Number.isNaN(n) || n <= 0) delete mo.parCompetence[c]
  else mo.parCompetence[c] = n
}

const totalJoursPerdus = computed(() =>
  Object.values(store.joursPerdusParFamille).reduce((s, v) => s + (v as number), 0))

/** Ce qui reste à obtenir de GTD, et l'effet de chaque manque. */
const manquants = computed(() => {
  const out: { indicateur: string; valeur: string; ecran: string }[] = []
  if (!store.capaciteRenseignee) {
    out.push({
      indicateur: 'Taux d’occupation de l’atelier',
      valeur: 'Postes de travail et heures d’ouverture',
      ecran: 'Maintenance → Atelier → Charge atelier',
    })
  }
  if (!store.tarifRenseigne) {
    out.push({
      indicateur: 'Coût complet d’une intervention',
      valeur: 'Tarif horaire d’un mécanicien, en ariary',
      ecran: 'Maintenance → Fiabilité, onglet Coûts',
    })
    out.push({
      indicateur: 'Coût de maintenance au kilomètre',
      valeur: 'Tarif horaire d’un mécanicien, en ariary',
      ecran: 'Maintenance → Fiabilité, onglet Coûts',
    })
  }
  if (!store.coutImmoRenseigne) {
    out.push({
      indicateur: 'Coût réel d’une immobilisation',
      valeur: 'Manque à gagner d’une journée, en ariary',
      ecran: 'Maintenance → Immobilisations',
    })
  }
  return out
})
</script>
