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

    <!-- <div v-if="store.groupesSimules.length"
      class="flex items-start gap-2.5 bg-warning-bg text-warning rounded-lg px-3.5 py-2.5 mb-3.5">
      <FlaskConical class="w-4 h-4 shrink-0 mt-px" />
      <div class="text-xs leading-relaxed">
        <strong>{{ store.groupesSimules.length }} valeur(s) de simulation en service.</strong>
        Les indicateurs sont calculés et visibles dans leurs écrans respectifs, mais ils
        reposent sur des valeurs de départ, pas sur des données de GTD. Chaque écran
        concerné le signale. Remplacez-les par les valeurs réelles : la mention disparaîtra
        d’elle-même, ici et partout ailleurs.
      </div>
    </div>

    <div v-else class="flex items-start gap-2.5 bg-success-bg text-success rounded-lg px-3.5 py-2.5 mb-3.5">
      <BadgeCheck class="w-4 h-4 shrink-0 mt-px" />
      <p class="text-xs leading-relaxed">
        Tous les paramètres proviennent de GTD. Les indicateurs de charge et de coût
        reposent sur des données réelles.
      </p>
    </div> -->

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">

      <!-- ═══ 1. Capacité de l'atelier ═══════════════════════════ -->
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle">
            <Building2 class="w-4 h-4 text-primary" /> Capacité de l’atelier
          </h2>
          <BadgeOrigine groupe="capacite" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div :class="F.field">
            <label :class="F.fieldLabel">Garage</label>
            <input :value="cap.site" type="text" :class="F.fieldInput"
              @input="saisirTexte('capacite', 'site', ($event.target as HTMLInputElement).value)" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Postes de travail</label>
            <input :value="cap.postes" type="number" min="1" :class="F.fieldInput"
              placeholder="ex. 3"
              @input="saisir('capacite', 'postes', ($event.target as HTMLInputElement).value)" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Heures d’ouverture par jour</label>
            <input :value="cap.heuresParJour" type="number" min="1" max="24"
              :class="F.fieldInput" placeholder="ex. 8"
              @input="saisir('capacite', 'heuresParJour', ($event.target as HTMLInputElement).value)" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Jours ouvrés par semaine</label>
            <input :value="cap.joursOuvresParSemaine" type="number" min="1" max="7"
              :class="F.fieldInput" placeholder="ex. 6"
              @input="saisir('capacite', 'joursOuvresParSemaine', ($event.target as HTMLInputElement).value)" />
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

        <!-- <BlocOrigine groupe="capacite" />
 -->
      </div>

      <!-- ═══ 2. Tarif horaire de la main-d'œuvre ════════════════ -->
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle">
            <Coins class="w-4 h-4 text-primary" /> Tarif horaire de la main-d’œuvre
          </h2>
          <BadgeOrigine groupe="mainOeuvre" />
        </div>

        <div :class="F.field">
          <label :class="F.fieldLabel">Tarif unique (Ar / heure)</label>
          <input :value="mo.tarifUniqueAr" type="number" min="0" step="1000"
            :class="F.fieldInput" placeholder="ex. 12 000"
            @input="saisir('mainOeuvre', 'tarifUniqueAr', ($event.target as HTMLInputElement).value)" />
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

        <!-- <BlocOrigine groupe="mainOeuvre" />
 -->
      </div>

      <!-- ═══ 3. Coût d'immobilisation ═══════════════════════════ -->
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle">
            <CalendarOff class="w-4 h-4 text-primary" /> Coût d’immobilisation par jour
          </h2>
          <BadgeOrigine groupe="immobilisation" />
        </div>

        <div :class="F.field">
          <label :class="F.fieldLabel">Manque à gagner moyen (Ar / jour)</label>
          <input :value="immo.moyenJourAr" type="number" min="0" step="10000"
            :class="F.fieldInput" placeholder="ex. 850 000"
            @input="saisir('immobilisation', 'moyenJourAr', ($event.target as HTMLInputElement).value)" />
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
            <input :value="immo.tracteurJourAr" type="number" min="0" step="10000"
              :class="F.fieldInput" :placeholder="immo.moyenJourAr ? `défaut ${immo.moyenJourAr}` : 'Ar / j'"
              @input="saisir('immobilisation', 'tracteurJourAr', ($event.target as HTMLInputElement).value)" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Citerne / remorque (Ar / jour)</label>
            <input :value="immo.citerneJourAr" type="number" min="0" step="10000"
              :class="F.fieldInput" :placeholder="immo.moyenJourAr ? `défaut ${immo.moyenJourAr}` : 'Ar / j'"
              @input="saisir('immobilisation', 'citerneJourAr', ($event.target as HTMLInputElement).value)" />
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

        <!-- <BlocOrigine groupe="immobilisation" />
 -->
      </div>

      <!-- ═══ Indicateurs, formules et valeurs ════════════════════
           Chaque indicateur montre sa formule, les termes qui la
           composent et la valeur obtenue. Le client remplace les termes
           manquants sur place : le résultat se recalcule à la frappe,
           et l'indicateur cesse d'être masqué.
           ══════════════════════════════════════════════════════════ -->
      <!-- <div :class="L.card" class="lg:col-span-2">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle">
            <component :is="manquants.length ? EyeOff : Eye" class="w-4 h-4 text-primary" />
            Indicateurs et formules de calcul
          </h2>
          <span class="text-[11px]" :class="manquants.length ? 'text-warning' : 'text-success'">
            {{ calcules.length }} calculé(s) sur {{ INDICATEURS.length }}
          </span>
        </div>

        <table :class="L.table">
          <thead><tr>
            <th :class="L.th" class="cursor-default">Indicateur</th>
            <th :class="L.th" class="cursor-default">Formule</th>
            <th :class="L.th" class="cursor-default">Termes</th>
            <th :class="L.th" class="cursor-default">Valeur</th>
            <th :class="L.th" class="cursor-default">Écran</th>
          </tr></thead>
          <tbody>
            <tr v-for="i in INDICATEURS" :key="i.cle" :class="L.rowHover">
              <td :class="L.td">
                <span class="text-xs font-medium">{{ i.libelle }}</span>
                <span class="text-[10px] text-muted-foreground block">{{ i.unite }}</span>
              </td>

              <td :class="L.td">
                <code class="text-[11px] font-mono text-foreground bg-background rounded px-1.5 py-0.5 inline-block leading-relaxed">
                  {{ i.formule }}
                </code>
              </td>

              <!-- Les termes manquants se saisissent ici, sans quitter l'écran -->
              <!-- <td :class="L.td">
                <div class="flex flex-col gap-1.5">
                  <div v-for="t in i.termes" :key="t.cle" class="flex items-center gap-1.5">
                    <span class="text-[11px] text-muted-foreground w-36 shrink-0">{{ t.libelle }}</span>
                    <input
                      v-if="t.saisissable"
                      :value="t.valeur()" type="number" min="0" :step="t.pas ?? 1"
                      class="w-28 h-7 border rounded px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                      :class="t.valeur() == null ? 'border-warning bg-warning-bg/30' : 'border-border'"
                      :placeholder="t.exemple"
                      @input="t.saisir(($event.target as HTMLInputElement).value)"
                    />
                    <span v-else class="text-xs font-medium text-foreground">
                      {{ t.valeur() != null ? Number(t.valeur()).toLocaleString('fr-FR') : '-' }}
                      <span class="text-[10px] text-muted-foreground">{{ t.origine }}</span>
                    </span>
                  </div>
                </div>
              </td>

              <td :class="L.td">
                <span v-if="i.resultat() != null" class="text-sm font-bold text-foreground">
                  {{ i.format(i.resultat()!) }}
                </span>
                <span v-else class="text-[11px] text-warning leading-snug block">
                  Masqué : {{ i.manque() }}
                </span>
              </td>

              <td :class="L.td">
                <span class="text-[11px] text-muted-foreground">{{ i.ecran }}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- <div class="flex items-start gap-2.5 bg-info-bg text-info rounded-lg px-3.5 py-2.5 mt-3">
          <Info class="w-4 h-4 shrink-0 mt-px" />
        </div> -->
      <!--</div> -->
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
  Info, Building2, Coins, CalendarOff, ChevronRight, EyeOff, Eye,
  FlaskConical, BadgeCheck,
} from 'lucide-vue-next'
import { useMaintenanceStore } from '../../stores/maintenance'
import { useVehiculesStore } from '../../stores/vehicules'
import BadgeOrigine from '../../components/maintenance/BadgeOrigine.vue'
import BlocOrigine from '../../components/maintenance/BlocOrigine.vue'
import { LIB_COMPETENCE } from '../../types/maintenance'
import type { CompetenceAtelier } from '../../types/maintenance'
import { fmtAr } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'
import * as F from '../../lib/formClasses'

const store     = useMaintenanceStore()
const vehicules = useVehiculesStore()

const COMPETENCES: CompetenceAtelier[] = ['mecanique', 'electricite', 'citerne', 'pneumatique']

const detailSpecialite    = ref(false)
const detailTypeVehicule  = ref(false)

/* Les trois blocs du store, édités directement : Pinia rend la mutation
   réactive et les indicateurs se recalculent à la frappe. */
const cap  = store.parametresAtelier.capacite
const mo   = store.parametresAtelier.mainOeuvre
const immo = store.parametresAtelier.immobilisation

type Groupe = 'capacite' | 'mainOeuvre' | 'immobilisation'

/**
 * Écrit une valeur numérique et bascule le groupe sur « donnée GTD ».
 *
 * Le marquage est fait à la saisie, pas à la validation : une valeur
 * touchée cesse d'être une simulation même si le client a retapé le même
 * chiffre. Le contraire laisserait une mention « simulation » sur une
 * valeur que le client a pourtant confirmée.
 */
function saisir(groupe: Groupe, champ: string, valeur: string) {
  const n = Number(valeur)
  const cible = store.parametresAtelier[groupe] as unknown as Record<string, unknown>
  cible[champ] = !valeur.trim() || Number.isNaN(n) || n <= 0 ? null : n
  store.marquerSaisiParClient(groupe)
}

function saisirTexte(groupe: Groupe, champ: string, valeur: string) {
  const cible = store.parametresAtelier[groupe] as unknown as Record<string, unknown>
  cible[champ] = valeur
  store.marquerSaisiParClient(groupe)
}

/** Un champ vidé retire la spécialité plutôt que d'y stocker zéro. */
function majTarifCompetence(c: CompetenceAtelier, valeur: string) {
  const n = Number(valeur)
  if (!valeur.trim() || Number.isNaN(n) || n <= 0) delete mo.parCompetence[c]
  else mo.parCompetence[c] = n
  store.marquerSaisiParClient('mainOeuvre')
}

const totalJoursPerdus = computed(() =>
  Object.values(store.joursPerdusParFamille).reduce((s, v) => s + (v as number), 0))

/* ══════════════════════════════════════════════════════════════
   Indicateurs, formules et termes
   ══════════════════════════════════════════════════════════════
   Chaque indicateur expose sa formule et les termes qui la composent.
   Un terme est soit mesuré par le système - charge, heures pointées,
   jours perdus - soit attendu de GTD, et alors saisissable ici même.

   Le résultat se recalcule à la frappe. Tant qu'un terme manque, la
   fonction `resultat` renvoie null et `manque` dit lequel : l'écran
   n'affiche jamais un chiffre partiel qui passerait pour complet.
   ══════════════════════════════════════════════════════════════ */

interface Terme {
  cle: string
  libelle: string
  valeur: () => number | null
  /** Vrai si GTD doit fournir la valeur ; faux si le système la mesure */
  saisissable: boolean
  saisir?: (v: string) => void
  exemple?: string
  pas?: number
  /** D'où vient la valeur, pour les termes mesurés */
  origine?: string
}

interface Indicateur {
  cle: string
  libelle: string
  unite: string
  formule: string
  termes: Terme[]
  resultat: () => number | null
  format: (v: number) => string
  manque: () => string
  ecran: string
}

/** Écrit une valeur numérique, ou efface le terme si la saisie est vide. */
const ecrire = (groupe: Groupe, champ: string) => (v: string) => saisir(groupe, champ, v)

const nb = (v: number) => v.toLocaleString('fr-FR')

const INDICATEURS = computed<Indicateur[]>(() => [
  {
    cle: 'occupation',
    libelle: 'Taux d’occupation de l’atelier',
    unite: 'pourcentage',
    formule: 'charge ÷ (postes × heures/jour × jours/semaine) × 100',
    termes: [
      { cle: 'charge', libelle: 'Charge estimée', saisissable: false,
        valeur: () => store.chargeTotaleH, origine: 'h, interventions ouvertes' },
      { cle: 'postes', libelle: 'Postes de travail', saisissable: true, exemple: '3',
        valeur: () => cap.postes, saisir: ecrire('capacite', 'postes') },
      { cle: 'heures', libelle: 'Heures par jour', saisissable: true, exemple: '8',
        valeur: () => cap.heuresParJour, saisir: ecrire('capacite', 'heuresParJour') },
      { cle: 'jours', libelle: 'Jours ouvrés / semaine', saisissable: true, exemple: '6',
        valeur: () => cap.joursOuvresParSemaine, saisir: ecrire('capacite', 'joursOuvresParSemaine') },
    ],
    resultat: () => store.tauxOccupationSemaine,
    format: v => `${v} %`,
    manque: () => 'postes de travail et heures d’ouverture à renseigner',
    ecran: 'Maintenance → Atelier → Charge atelier',
  },
  {
    cle: 'cout_intervention',
    libelle: 'Coût complet d’une intervention',
    unite: 'ariary',
    formule: 'pièces + sous-traitance + (heures pointées × tarif horaire)',
    termes: [
      { cle: 'pieces', libelle: 'Pièces et sous-traitance', saisissable: false,
        valeur: () => store.coutTotal - (store.coutMainOeuvreTotal ?? 0), origine: 'Ar, cumul du parc' },
      { cle: 'heures', libelle: 'Heures pointées', saisissable: false,
        valeur: () => heuresPointees.value, origine: 'h, relevés mécaniciens' },
      { cle: 'tarif', libelle: 'Tarif horaire', saisissable: true, exemple: '12 000', pas: 1000,
        valeur: () => mo.tarifUniqueAr, saisir: ecrire('mainOeuvre', 'tarifUniqueAr') },
    ],
    resultat: () => store.tarifRenseigne ? store.coutTotal : null,
    format: v => fmtAr(v),
    manque: () => `${nb(heuresPointees.value)} h pointées sans tarif horaire`,
    ecran: 'Maintenance → Fiabilité, onglet Coûts',
  },
  {
    cle: 'cout_km',
    libelle: 'Coût de maintenance au kilomètre',
    unite: 'ariary par km',
    formule: 'coût complet du véhicule ÷ kilomètres parcourus',
    termes: [
      { cle: 'cout', libelle: 'Coût complet', saisissable: false,
        valeur: () => store.tarifRenseigne ? store.coutTotal : null, origine: 'Ar, indicateur ci-dessus' },
      { cle: 'km', libelle: 'Kilomètres du parc', saisissable: false,
        valeur: () => kmParc.value, origine: 'km, compteurs véhicules' },
      { cle: 'tarif', libelle: 'Tarif horaire', saisissable: true, exemple: '12 000', pas: 1000,
        valeur: () => mo.tarifUniqueAr, saisir: ecrire('mainOeuvre', 'tarifUniqueAr') },
    ],
    resultat: () => store.tarifRenseigne && kmParc.value
      ? Math.round(store.coutTotal / kmParc.value) : null,
    format: v => `${fmtAr(v)} / km`,
    manque: () => 'tarif horaire à renseigner',
    ecran: 'Maintenance → Fiabilité, onglet Coûts',
  },
  {
    cle: 'cout_immo',
    libelle: 'Coût réel d’une immobilisation',
    unite: 'ariary',
    formule: 'jours d’immobilisation × manque à gagner journalier',
    termes: [
      { cle: 'jours', libelle: 'Jours perdus', saisissable: false,
        valeur: () => totalJoursPerdus.value, origine: 'j, immobilisations' },
      { cle: 'manque', libelle: 'Manque à gagner / jour', saisissable: true,
        exemple: '850 000', pas: 10000,
        valeur: () => immo.moyenJourAr, saisir: ecrire('immobilisation', 'moyenJourAr') },
    ],
    resultat: () => store.coutTotalImmobilisations,
    format: v => fmtAr(v),
    manque: () => `${totalJoursPerdus.value} jours perdus non valorisés`,
    ecran: 'Maintenance → Immobilisations',
  },
])

/** Heures déjà pointées par les mécaniciens, tous ordres confondus. */
const heuresPointees = computed(() =>
  store.ordres.reduce((s, o) => s + store.heuresOT(o), 0))

/** Kilométrage cumulé du parc courant, dénominateur du coût au km. */
const kmParc = computed(() =>
  vehicules.auParc.reduce((s, v) => s + (v.kilometrage ?? 0), 0))

const calcules = computed(() => INDICATEURS.value.filter(i => i.resultat() != null))
const manquants = computed(() => INDICATEURS.value.filter(i => i.resultat() == null))
</script>
