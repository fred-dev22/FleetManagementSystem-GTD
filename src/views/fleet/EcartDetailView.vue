<template>
  <div :class="L.pagePadding">
    <div v-if="!ecart" :class="L.emptyState">
      <AlertTriangle class="w-8 h-8" />
      <p class="text-sm">Écart introuvable</p>
      <button :class="L.btnOutline" @click="router.push({ name: 'fleet-ecarts' })">Retour au registre</button>
    </div>

    <template v-else>
      <!-- ── En-tête ──────────────────────────────────────────── -->
      <div :class="L.pageHeader">
        <div class="flex items-start gap-3">
          <button :class="L.tbIconBtn" @click="router.back()"><ArrowLeft class="w-4 h-4" /></button>
          <div>
            <div class="flex items-center gap-2">
              <h1 :class="L.pageTitle">{{ LIB_TYPE_ECART[ecart.type] }}</h1>
              <span :class="LIB_GRAVITE[ecart.gravite].cls" class="text-xs font-medium px-2 py-0.5 rounded-full">
                {{ LIB_GRAVITE[ecart.gravite].label }}
              </span>
              <span :class="LIB_NATURE[ecart.nature].cls" class="text-xs font-medium px-2 py-0.5 rounded-full">
                {{ LIB_NATURE[ecart.nature].label }}
              </span>
            </div>
            <p :class="L.pageSub">
              {{ ecart.id }} · voyage
              <button class="text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer font-mono"
                @click="router.push({ name: 'fleet-voyage-detail', params: { id: ecart.voyageId } })">
                {{ ecart.voyageRef }}
              </button>
              · détecté le {{ fmtDateTime(ecart.detecteLe) }}
            </p>
          </div>
        </div>
      </div>

      <!-- ── Bandeau : le système mesure, il ne présume pas ────── -->
      <!-- <div v-if="ecart.nature === 'a_qualifier'"
        class="flex items-start gap-2.5 bg-warning-bg text-warning rounded-lg px-3.5 py-2.5 mb-3.5">
        <Info class="w-4 h-4 shrink-0 mt-px" />
        <p class="text-xs leading-relaxed">
          Cet écart est enregistré au statut <strong>« à qualifier »</strong>. Le système mesure un écart de trajectoire ;
          il ne présume d’aucune intention. Seule une qualification en <strong>déviation non justifiée</strong> par
          l’exploitation alimente le score du conducteur et peut ouvrir un dossier disciplinaire.
        </p>
      </div> -->

      <div class="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-3.5 items-start">

        <!-- ══ Colonne gauche ══════════════════════════════════ -->
        <div class="flex flex-col gap-3.5">

          <!-- Carte comparée -->
          <div :class="L.card">
            <div :class="L.cardHeader">
              <h2 :class="L.cardTitle"><MapIcon class="w-4 h-4 text-primary" /> Itinéraire prévu / trajet réel</h2>
              <span class="text-[11px] text-muted-foreground">{{ ecart.trajetLibelle ?? "Trajet ponctuel" }}</span>
            </div>
            <FleetMap
              :trace-prevu="ecart.tracePrevu"
              :trace-reel="ecart.traceReel"
              :points-passage="[]"
              :arrets="arretsCarte"
              :couloir-m="0"
              height="440px"
            />
          </div>

          <!-- Mesures -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div v-for="m in mesures" :key="m.label"
              class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
              <p class="text-xl font-bold leading-none" :class="m.cls">{{ m.value }}</p>
              <p class="text-[11px] text-gray-500 mt-1">{{ m.label }}</p>
            </div>
          </div>

          <!-- Chronologie -->
          <div :class="L.card">
            <div :class="L.cardHeader">
              <h2 :class="L.cardTitle"><Clock class="w-4 h-4 text-primary" /> Chronologie</h2>
            </div>
            <ol class="relative pl-5 border-l-2 border-border flex flex-col gap-3.5">
              <li v-for="(e, i) in chronologie" :key="i" class="relative">
                <span class="absolute -left-[26px] top-0.5 w-3 h-3 rounded-full border-2 border-card"
                  :class="e.cls" />
                <div class="text-xs font-medium text-foreground">{{ e.titre }}</div>
                <div class="text-[11px] text-muted-foreground">{{ e.heure }}<span v-if="e.detail"> · {{ e.detail }}</span></div>
              </li>
            </ol>
          </div>
        </div>

        <!-- ══ Colonne droite ══════════════════════════════════ -->
        <div class="flex flex-col gap-3.5">

          <!-- Contexte -->
          <div :class="L.card">
            <div :class="L.cardHeader"><h2 :class="L.cardTitle">Contexte</h2></div>
            <dl class="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
              <div><dt class="text-muted-foreground text-[11px]">Véhicule</dt>
                <dd class="font-mono">{{ ecart.vehiculePlaque }}</dd></div>
              <div><dt class="text-muted-foreground text-[11px]">Chauffeur</dt>
                <dd>
                  <button class="text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer text-left"
                    @click="ecart.chauffeurId && router.push({ name: 'fleet-conducteur-detail', params: { id: ecart.chauffeurId } })">
                    {{ ecart.chauffeurNom }}
                  </button>
                </dd></div>
              <div class="col-span-2"><dt class="text-muted-foreground text-[11px]">Lieu</dt>
                <dd>{{ ecart.lieu ?? '-' }}</dd></div>
              <div class="col-span-2"><dt class="text-muted-foreground text-[11px]">Coordonnées</dt>
                <dd class="font-mono text-[11px]">{{ ecart.lat.toFixed(4) }}, {{ ecart.lng.toFixed(4) }}</dd></div>
            </dl>
          </div>

          <!-- Justification du chauffeur -->
          <div :class="L.card">
            <div :class="L.cardHeader">
              <h2 :class="L.cardTitle"><MessageSquare class="w-4 h-4 text-primary" /> Justification</h2>
            </div>
            <template v-if="ecart.justificationChauffeur">
              <p class="text-xs text-foreground leading-relaxed bg-background rounded-md px-2.5 py-2">
                {{ ecart.justificationChauffeur }}
              </p>
              <p class="text-[11px] text-muted-foreground mt-1.5">
                Déposée le {{ fmtDateTime(ecart.justifieLe) }}
              </p>
            </template>
            <template v-else>
              <p class="text-xs text-muted-foreground mb-2">
                Aucune justification déposée. Fenêtre ouverte jusqu’au {{ fmtDateTime(dateLimite) }}.
              </p>
              <textarea v-model="saisieJustif" rows="3" :class="F.fieldTextarea"
                placeholder="Saisir la justification transmise par le chauffeur…" />
              <button :class="L.btnOutline" class="mt-2 w-full justify-center"
                :disabled="!saisieJustif.trim()" @click="deposerJustification">
                Enregistrer la justification
              </button>
            </template>
          </div>

          <!-- Qualification -->
          <div :class="L.card">
            <div :class="L.cardHeader">
              <h2 :class="L.cardTitle"><Gavel class="w-4 h-4 text-primary" /> Qualification</h2>
            </div>

            <template v-if="ecart.nature === 'a_qualifier'">
              <div class="flex flex-col gap-1.5 mb-3">
                <label v-for="opt in OPTIONS_NATURE" :key="opt.value"
                  class="flex items-start gap-2 rounded-md border px-2.5 py-2 cursor-pointer transition-colors"
                  :class="nature === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-background'">
                  <input type="radio" :value="opt.value" v-model="nature" class="accent-primary mt-0.5" />
                  <span>
                    <span class="text-xs font-medium text-foreground block">{{ opt.label }}</span>
                    <span class="text-[11px] text-muted-foreground">{{ opt.aide }}</span>
                  </span>
                </label>
              </div>

              <div :class="F.field" class="mb-2.5">
                <label :class="F.fieldLabel">Motif <span class="text-danger">*</span></label>
                <textarea v-model="motif" rows="3" :class="F.fieldTextarea"
                  placeholder="Motiver la décision - c’est ce qui rend le dossier opposable." />
              </div>

              <div v-if="nature === 'non_justifiee'" :class="F.field" class="mb-2.5">
                <label :class="F.fieldLabel">Suite donnée</label>
                <select v-model="decision" :class="F.fieldSelect">
                  <option value="classe">Classement sans suite</option>
                  <option value="avertissement">Avertissement</option>
                  <option value="codis">Saisine du comité de discipline</option>
                </select>
              </div>

              <p v-if="erreur" :class="F.fieldErrorBlock" class="mb-2">
                <AlertCircle class="w-3.5 h-3.5" /> {{ erreur }}
              </p>

              <button :class="L.btnPrimary" class="w-full justify-center" @click="qualifier">
                Enregistrer la qualification
              </button>
            </template>

            <template v-else>
              <dl class="flex flex-col gap-2 text-xs">
                <div><dt class="text-muted-foreground text-[11px]">Nature retenue</dt>
                  <dd><span :class="LIB_NATURE[ecart.nature].cls" class="text-xs font-medium px-2 py-0.5 rounded-full">
                    {{ LIB_NATURE[ecart.nature].label }}</span></dd></div>
                <div><dt class="text-muted-foreground text-[11px]">Motif</dt>
                  <dd class="leading-relaxed">{{ ecart.motifQualification }}</dd></div>
                <div><dt class="text-muted-foreground text-[11px]">Qualifié par</dt>
                  <dd>{{ ecart.qualifiePar }} - {{ fmtDateTime(ecart.qualifieLe) }}</dd></div>
                <div v-if="ecart.decision"><dt class="text-muted-foreground text-[11px]">Suite donnée</dt>
                  <dd>{{ LIB_DECISION[ecart.decision] }}<span v-if="ecart.refCodis" class="font-mono"> · {{ ecart.refCodis }}</span></dd></div>
              </dl>
            </template>
          </div>
        </div>
      </div>
    </template>
</div>
</template>

<script setup lang="ts">
/**
 * Fiche d'écart - écran central de la démonstration « conformité d'itinéraire ».
 * Superpose l'itinéraire de référence et le trajet réellement suivi, présente
 * les mesures, la chronologie, et porte le circuit de qualification en trois natures.
 */
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, AlertTriangle, AlertCircle, Clock, Gavel, Info,
  Map as MapIcon, MessageSquare,
} from 'lucide-vue-next'
import FleetMap from '../../components/fleet/FleetMap.vue'
import { useEcartsStore, LIB_TYPE_ECART, LIB_NATURE, LIB_GRAVITE } from '../../stores/ecarts'
import { useConfigurationStore } from '../../stores/configuration'
import { useVoyagesStore } from '../../stores/voyages'
import { useAuthStore } from '../../stores/auth'
import type { NatureEcart, DecisionEcart, MapArret } from '../../types/fms'
import { fmtDateTime, fmtDuree, fmtHeure } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'
import * as F from '../../lib/formClasses'

const route  = useRoute()
const router = useRouter()
const store  = useEcartsStore()
const configStore = useConfigurationStore()
const voyagesStore   = useVoyagesStore()
const auth = useAuthStore()

const ecart = computed(() => store.getById(String(route.params.id)))
const typeConfig = computed(() =>
  ecart.value?.typeEcartId ? configStore.getTypeEcart(ecart.value.typeEcartId) : undefined)

const LIB_DECISION: Record<DecisionEcart, string> = {
  classe:        'Classement sans suite',
  avertissement: 'Avertissement',
  codis:         'Saisine du comité de discipline',
}

const OPTIONS_NATURE: { value: Exclude<NatureEcart, 'a_qualifier'>; label: string; aide: string }[] = [
  { value: 'autorisee',     label: 'Déviation autorisée',
    aide: 'Consécutive à une instruction enregistrée de la tour de contrôle ou du client.' },
  { value: 'subie',         label: 'Déviation subie',
    aide: 'Route coupée, accident, barrage, intempérie, panne, consigne de sécurité.' },
  { value: 'non_justifiee', label: 'Déviation non justifiée',
    aide: 'Aucune justification recevable dans le délai. Devient une infraction du conducteur.' },
]

const nature   = ref<Exclude<NatureEcart, 'a_qualifier'>>('subie')
const motif    = ref('')
const decision = ref<DecisionEcart>('avertissement')
const erreur   = ref('')
const saisieJustif = ref('')

/* Arrêts relevés sur le voyage, projetés sur la carte */
const arretsCarte = computed<MapArret[]>(() => {
  if (!ecart.value) return []
  return voyagesStore.arretsDuVoyage(ecart.value.voyageId)
    .filter(a => !a.dansSiteDeclare)
    .map(a => ({
      id: a.id, lat: a.lat, lng: a.lng,
      label: a.lieu ?? 'Arrêt relevé',
      dureeMin: a.dureeMin, justifie: a.justifie,
    }))
})

const mesures = computed(() => {
  const e = ecart.value!
  return [
    { label: 'Durée hors séquence', value: fmtDuree(e.dureeMin),
      cls: (e.dureeMin ?? 0) > 30 ? 'text-danger' : 'text-foreground' },
    { label: 'Distance parcourue hors séquence', value: e.distanceKm != null ? `${e.distanceKm} km` : '-',
      cls: 'text-foreground' },
    { label: 'Écart latéral maximal', value: e.ecartLateralMaxM != null
        ? `${(e.ecartLateralMaxM / 1000).toFixed(1)} km` : '-',
      cls: (e.ecartLateralMaxM ?? 0) > 5000 ? 'text-danger' : 'text-foreground' },
    { label: 'Seuil configuré', value: typeConfig.value?.seuilValeur != null ? `${typeConfig.value.seuilValeur} ${typeConfig.value.seuilUnite ?? ''}` : '-',
      cls: 'text-muted-foreground' },
  ]
})

const chronologie = computed(() => {
  const e = ecart.value!
  const out: { titre: string; heure: string; detail?: string; cls: string }[] = []

  out.push({ titre: 'Sortie du couloir de tolérance détectée', heure: fmtHeure(e.detecteLe),
    detail: typeConfig.value?.libelle, cls: 'bg-warning' })

  voyagesStore.arretsDuVoyage(e.voyageId)
    .filter(a => !a.dansSiteDeclare)
    .forEach(a => out.push({
      titre: `Arrêt non planifié - ${fmtDuree(a.dureeMin)}`,
      heure: fmtHeure(a.debut),
      detail: a.lieu,
      cls: a.justifie ? 'bg-success' : 'bg-danger',
    }))

  out.push({ titre: 'Retour dans la séquence', heure: fmtHeure(
    new Date(+new Date(e.detecteLe) + (e.dureeMin ?? 0) * 60_000).toISOString()),
    cls: 'bg-primary' })

  if (e.justifieLe) out.push({ titre: 'Justification déposée par le chauffeur',
    heure: fmtDateTime(e.justifieLe), cls: 'bg-info' })

  if (e.qualifieLe) out.push({ titre: `Qualifié - ${LIB_NATURE[e.nature].label}`,
    heure: fmtDateTime(e.qualifieLe), detail: e.qualifiePar, cls: 'bg-foreground' })

  return out
})

/** Fenêtre de justification : 24 h ouvrées par défaut. */
const dateLimite = computed(() =>
  ecart.value ? new Date(+new Date(ecart.value.detecteLe) + 24 * 3_600_000).toISOString() : undefined)

function deposerJustification() {
  if (!ecart.value || !saisieJustif.value.trim()) return
  store.justifier(ecart.value.id, saisieJustif.value.trim())
  saisieJustif.value = ''
}

function qualifier() {
  erreur.value = ''
  if (!motif.value.trim()) {
    erreur.value = 'Le motif est obligatoire : c’est lui qui rend le dossier opposable.'
    return
  }
  store.qualifier(
    ecart.value!.id,
    nature.value,
    motif.value.trim(),
    auth.user?.name ?? 'Exploitation',
    nature.value === 'non_justifiee' ? decision.value : 'classe',
  )
  motif.value = ''
}
</script>
