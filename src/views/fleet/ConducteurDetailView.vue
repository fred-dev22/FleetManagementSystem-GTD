<template>
  <div :class="L.pagePadding">
    <div v-if="!score" :class="L.emptyState">
      <UserX class="w-8 h-8" />
      <p class="text-sm">Conducteur introuvable</p>
    </div>

    <template v-else>
      <!-- ── En-tête ──────────────────────────────────────────── -->
      <div :class="L.pageHeader">
        <div class="flex items-start gap-3">
          <button :class="L.tbIconBtn" @click="router.back()"><ArrowLeft class="w-4 h-4" /></button>
          <div>
            <h1 :class="L.pageTitle">{{ score.chauffeurNom }}</h1>
            <p :class="L.pageSub">
              {{ score.voyagesPeriode }} voyage(s) · {{ score.kmPeriode.toLocaleString('fr-FR') }} km sur la période
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-right">
            <p class="text-3xl font-bold leading-none" :class="couleurScore(score.score)">{{ score.score }}</p>
            <p class="text-[11px] text-muted-foreground">
              sur 100
              <span :class="delta >= 0 ? 'text-success' : 'text-danger'">
                ({{ delta >= 0 ? '+' : '' }}{{ delta }})
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- Alertes d'échéance -->
      <div v-if="echeances.length" class="flex flex-col gap-1.5 mb-3.5">
        <div v-for="e in echeances" :key="e.type"
          class="flex items-center gap-2.5 rounded-lg px-3.5 py-2"
          :class="e.expire ? 'bg-danger-bg text-danger' : 'bg-warning-bg text-warning'">
          <AlertTriangle class="w-4 h-4 shrink-0" />
          <p class="text-xs flex-1">
            <strong>{{ e.type }}</strong> — {{ e.expire ? 'expiré' : 'expire' }} le {{ fmtDate(e.date) }}.
          </p>
          <span class="text-[11px] font-medium">
            {{ e.expire ? 'Affectation bloquée' : 'Régularisation requise' }}
          </span>
        </div>
      </div>

      <!-- ── Onglets ──────────────────────────────────────────── -->
      <div class="flex gap-1 border-b border-border mb-3.5 overflow-x-auto">
        <button v-for="t in tabs" :key="t.key" @click="tab = t.key"
          class="px-3.5 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer bg-transparent"
          :class="tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'">
          {{ t.label }}
        </button>
      </div>

      <!-- ══ SYNTHÈSE ═══════════════════════════════════════════ -->
      <div v-if="tab === 'synthese'" class="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-3.5 items-start">
        <div class="flex flex-col gap-3.5">

          <!-- Décomposition du score : la transparence rend le score acceptable -->
          <div :class="L.card">
            <div :class="L.cardHeader">
              <h2 :class="L.cardTitle"><Gauge class="w-4 h-4 text-primary" /> Décomposition du score</h2>
              <span class="text-[11px] text-muted-foreground">Pondérations paramétrables</span>
            </div>

            <div class="flex flex-col gap-3">
              <div v-for="f in score.familles" :key="f.famille">
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: PONDERATIONS[f.famille].couleur }" />
                    <span class="text-xs font-medium text-foreground">{{ f.libelle }}</span>
                    <span class="text-[11px] text-muted-foreground">coef. {{ f.poids }} %</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span v-if="f.evenements" class="text-[11px] text-muted-foreground">
                      {{ f.evenements }} évènement(s)
                    </span>
                    <span class="text-xs font-semibold" :class="couleurScore(f.note)">{{ f.note }}</span>
                  </div>
                </div>
                <div class="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div class="h-full rounded-full transition-all"
                    :style="{ width: f.note + '%', backgroundColor: PONDERATIONS[f.famille].couleur }" />
                </div>
              </div>
            </div>

            <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
              Score calculé sur une fenêtre glissante de 12 mois, avec atténuation : une infraction ancienne
              pèse moins qu’une infraction récente. Un conducteur qui corrige son comportement voit son score remonter.
            </p>
          </div>

          <!-- Historique 12 mois -->
          <div :class="L.card">
            <div :class="L.cardHeader"><h2 :class="L.cardTitle"><TrendingUp class="w-4 h-4 text-primary" /> Évolution sur 12 mois</h2></div>
            <svg :viewBox="`0 0 ${sparkW} ${sparkH}`" class="w-full h-24">
              <line x1="0" :y1="yFor(80)" :x2="sparkW" :y2="yFor(80)" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="4 4" />
              <polyline :points="sparkPoints" fill="none" stroke="#0072C5" stroke-width="2"
                stroke-linejoin="round" stroke-linecap="round" />
              <circle v-for="(v, i) in score.historique12m" :key="i"
                :cx="xFor(i)" :cy="yFor(v)" r="2.5" fill="#0072C5" />
            </svg>
            <div class="flex justify-between text-[10px] text-muted-foreground">
              <span>il y a 12 mois</span><span>seuil de prime 80</span><span>aujourd’hui</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-3.5">
          <!-- Prime -->
          <div :class="L.card">
            <div :class="L.cardHeader"><h2 :class="L.cardTitle"><Award class="w-4 h-4 text-primary" /> Prime de la période</h2></div>
            <p class="text-2xl font-bold leading-none" :class="score.primeEligible ? 'text-success' : 'text-muted-foreground'">
              {{ fmtAr(score.primeMontant) }}
            </p>
            <p class="text-[11px] text-muted-foreground mt-1">{{ palier.libelle }}</p>

            <div v-if="!score.primeEligible" class="mt-2.5 bg-danger-bg text-danger rounded-md px-2.5 py-2 text-[11px] leading-snug">
              Non éligible — {{ score.motifNonEligibilite }}
            </div>

            <div class="mt-3 pt-3 border-t border-border">
              <p class="text-[11px] font-semibold text-foreground mb-1.5">Grille en vigueur</p>
              <ul class="flex flex-col gap-1">
                <li v-for="g in GRILLE_PRIME.filter(x => x.montant > 0)" :key="g.min"
                  class="flex justify-between text-[11px]"
                  :class="score.score >= g.min ? 'text-foreground font-medium' : 'text-muted-foreground'">
                  <span>{{ g.libelle }} — score ≥ {{ g.min }}</span>
                  <span>{{ fmtAr(g.montant) }}</span>
                </li>
              </ul>
              <p class="text-[10px] text-muted-foreground mt-2 leading-snug">
                Calcul automatique, validation hiérarchique par le circuit RH existant.
                Grille à valider par la direction et les ressources humaines.
              </p>
            </div>
          </div>

          <!-- Positionnement -->
          <div :class="L.card">
            <div :class="L.cardHeader"><h2 :class="L.cardTitle">Positionnement</h2></div>
            <p class="text-xs text-muted-foreground mb-1.5">
              Rang {{ rang }} sur {{ scoresStore.scores.length }} — {{ percentile }}<sup>e</sup> centile
            </p>
            <div class="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div class="h-full bg-primary rounded-full" :style="{ width: percentile + '%' }" />
            </div>
            <p class="text-[10px] text-muted-foreground mt-2 leading-snug">
              Le classement nominatif reste réservé à la direction et à l’encadrement ;
              le conducteur accède à son score et à son positionnement relatif anonymisé.
            </p>
          </div>
        </div>
      </div>

      <!-- ══ ITINÉRAIRES ════════════════════════════════════════ -->
      <div v-else-if="tab === 'itineraires'" class="flex flex-col gap-3.5">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none">{{ score.tauxConformiteItineraire }} %</p>
            <p class="text-[11px] text-gray-500 mt-1">Conformité d’itinéraire</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none">{{ ecarts.length }}</p>
            <p class="text-[11px] text-gray-500 mt-1">Écarts sur la période</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none" :class="score.depassementsKm ? 'text-warning' : ''">
              {{ score.depassementsKm }}
            </p>
            <p class="text-[11px] text-gray-500 mt-1">Dépassements km / voyage</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none">{{ score.kmMoyenParVoyage.toLocaleString('fr-FR') }}</p>
            <p class="text-[11px] text-gray-500 mt-1">Km moyen par voyage</p>
          </div>
        </div>

        <div :class="L.card">
          <div :class="L.cardHeader"><h2 :class="L.cardTitle">Écarts relevés</h2></div>
          <div v-if="!ecarts.length" class="text-xs text-muted-foreground py-3">Aucun écart sur la période.</div>
          <table v-else :class="L.table">
            <thead><tr>
              <th :class="L.th" class="cursor-default">Écart</th>
              <th :class="L.th" class="cursor-default">Type</th>
              <th :class="L.th" class="cursor-default">Nature</th>
              <th :class="L.th" class="cursor-default">Détecté le</th>
              <th :class="L.th" class="cursor-default"></th>
            </tr></thead>
            <tbody>
              <tr v-for="e in ecarts" :key="e.id" :class="L.rowHover">
                <td :class="L.td"><span class="font-mono text-xs">{{ e.id }}</span></td>
                <td :class="L.td"><span class="text-xs">{{ LIB_TYPE_ECART[e.type] }}</span></td>
                <td :class="L.td"><span :class="LIB_NATURE[e.nature].cls" class="text-[11px] font-medium px-2 py-0.5 rounded-full">{{ LIB_NATURE[e.nature].label }}</span></td>
                <td :class="L.td"><span class="text-xs">{{ fmtDateTime(e.detecteLe) }}</span></td>
                <td :class="L.td"><button :class="L.actView" @click="router.push({ name: 'fleet-ecart-detail', params: { id: e.id } })">Ouvrir</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ══ CARBURANT ══════════════════════════════════════════ -->
      <div v-else-if="tab === 'carburant'" class="flex flex-col gap-3.5">
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none">{{ score.consoMoyenne100km }}</p>
            <p class="text-[11px] text-gray-500 mt-1">Conso moyenne (L/100 km)</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none"
              :class="score.ecartConsoPct > 5 ? 'text-danger' : score.ecartConsoPct > 0 ? 'text-warning' : 'text-success'">
              {{ score.ecartConsoPct > 0 ? '+' : '' }}{{ score.ecartConsoPct }} %
            </p>
            <p class="text-[11px] text-gray-500 mt-1">Écart à la référence trajet</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none">{{ recharges.length }}</p>
            <p class="text-[11px] text-gray-500 mt-1">Recharges sur la période</p>
          </div>
        </div>

        <div :class="L.card">
          <div :class="L.cardHeader"><h2 :class="L.cardTitle"><Fuel class="w-4 h-4 text-primary" /> Recharges</h2></div>
          <table :class="L.table">
            <thead><tr>
              <th :class="L.th" class="cursor-default">Date</th>
              <th :class="L.th" class="cursor-default">Véhicule</th>
              <th :class="L.th" class="cursor-default">Litres</th>
              <th :class="L.th" class="cursor-default">Lieu</th>
              <th :class="L.th" class="cursor-default">Contrôles</th>
            </tr></thead>
            <tbody>
              <tr v-for="r in recharges" :key="r.id" :class="L.rowHover">
                <td :class="L.td"><span class="text-xs">{{ fmtDateTime(r.date) }}</span></td>
                <td :class="L.td"><span class="font-mono text-xs">{{ r.vehiculePlaque }}</span></td>
                <td :class="L.td"><span class="text-xs">{{ fmtL(r.litres) }}</span></td>
                <td :class="L.td"><span class="text-xs">{{ r.lieu }}</span></td>
                <td :class="L.td">
                  <span v-if="r.statut === 'valide'" class="text-[11px] px-2 py-0.5 rounded-full bg-success-bg text-success">Conforme</span>
                  <span v-else class="text-[11px] px-2 py-0.5 rounded-full bg-danger-bg text-danger">Anomalie</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ══ RH ═════════════════════════════════════════════════ -->
      <div v-else-if="tab === 'rh'" :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle"><IdCard class="w-4 h-4 text-primary" /> Données administratives</h2>
        </div>
        <dl class="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-xs">
          <div><dt class="text-muted-foreground text-[11px]">Permis de conduire</dt>
            <dd :class="estProche(score.permisExpireLe) ? 'text-danger font-medium' : ''">
              expire le {{ fmtDate(score.permisExpireLe) }}</dd></div>
          <div><dt class="text-muted-foreground text-[11px]">Visite médicale</dt>
            <dd :class="estProche(score.visiteMedicaleExpireLe) ? 'text-danger font-medium' : ''">
              expire le {{ fmtDate(score.visiteMedicaleExpireLe) }}</dd></div>
          <div><dt class="text-muted-foreground text-[11px]">Voyages sur la période</dt>
            <dd>{{ score.voyagesPeriode }}</dd></div>
          <div><dt class="text-muted-foreground text-[11px]">Kilométrage cumulé</dt>
            <dd>{{ score.kmPeriode.toLocaleString('fr-FR') }} km</dd></div>
          <div><dt class="text-muted-foreground text-[11px]">Infractions</dt><dd>{{ score.infractions }}</dd></div>
          <div><dt class="text-muted-foreground text-[11px]">Excès de vitesse</dt><dd>{{ score.exces }}</dd></div>
        </dl>

        <p class="text-[11px] text-muted-foreground mt-3.5 leading-relaxed">
          Congés, absences, soldes et formations sont gérés dans le module Administration.
          Cet onglet en présentera la synthèse une fois le rapprochement des référentiels employé et conducteur effectué.
        </p>
      </div>
    </template>
</div>
</template>

<script setup lang="ts">
/**
 * Fiche conducteur unifiée — point de jonction entre le module RH et le module Flotte.
 * Le score est présenté décomposé : un score opaque est un score contesté.
 */
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, UserX, Gauge, TrendingUp, Award, AlertTriangle, Fuel, IdCard,
} from 'lucide-vue-next'
import {
  useScoresConducteursStore, PONDERATIONS, GRILLE_PRIME, primePour,
} from '../../stores/scoresConducteurs'
import { useEcartsStore, LIB_TYPE_ECART, LIB_NATURE } from '../../stores/ecarts'
import { useCarburantStore } from '../../stores/carburant'
import { fmtAr, fmtL, fmtDate, fmtDateTime } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'

const route  = useRoute()
const router = useRouter()
const scoresStore    = useScoresConducteursStore()
const ecartsStore    = useEcartsStore()
const carburantStore = useCarburantStore()

const chauffeurId = computed(() => String(route.params.id))
const score = computed(() => scoresStore.getById(chauffeurId.value))

const tab = ref<'synthese' | 'itineraires' | 'carburant' | 'rh'>('synthese')
const tabs = [
  { key: 'synthese' as const,    label: 'Synthèse' },
  { key: 'itineraires' as const, label: 'Itinéraires' },
  { key: 'carburant' as const,   label: 'Carburant' },
  { key: 'rh' as const,          label: 'Ressources humaines' },
]

const delta = computed(() => score.value ? score.value.score - score.value.scoreMoisPrecedent : 0)
const palier = computed(() => score.value ? primePour(score.value.score, score.value.primeEligible) : { libelle: '' })
const percentile = computed(() => scoresStore.percentile(chauffeurId.value))
const rang = computed(() =>
  scoresStore.classement.findIndex(s => s.chauffeurId === chauffeurId.value) + 1)

const ecarts    = computed(() => ecartsStore.ecartsDuChauffeur(chauffeurId.value))
const recharges = computed(() => carburantStore.rechargesDuChauffeur(chauffeurId.value))

function couleurScore(n: number) {
  if (n >= 90) return 'text-success'
  if (n >= 80) return 'text-primary'
  if (n >= 70) return 'text-warning'
  return 'text-danger'
}

function estProche(iso?: string, jours = 30) {
  if (!iso) return false
  return +new Date(iso) <= Date.now() + jours * 86_400_000
}

const echeances = computed(() => {
  const out: { type: string; date: string; expire: boolean }[] = []
  const s = score.value
  if (!s) return out
  const push = (type: string, d?: string) => {
    if (d && estProche(d)) out.push({ type, date: d, expire: +new Date(d) < Date.now() })
  }
  push('Permis de conduire', s.permisExpireLe)
  push('Visite médicale', s.visiteMedicaleExpireLe)
  return out
})

/* ── Courbe d'évolution (SVG, sans dépendance externe) ────── */
const sparkW = 320
const sparkH = 80
const xFor = (i: number) => (i / 11) * (sparkW - 8) + 4
const yFor = (v: number) => sparkH - 6 - ((v - 60) / 40) * (sparkH - 14)
const sparkPoints = computed(() =>
  score.value ? score.value.historique12m.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ') : '')
</script>
