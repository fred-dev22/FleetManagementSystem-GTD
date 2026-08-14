<template>
  <CardModalShell
    page-title="Écart d’itinéraire"
    :page-number="item.id"
    banner-label="Flotte · Conformité"
    :sidebar-items="sidebarItems"
    :current-no="item.id"
    :has-prev="indexCourant > 0"
    :has-next="indexCourant < ecartsOrdonnes.length - 1"
    :is-edit-mode="false"
    :show-edit="false"
    :status-label="LIB_NATURE[item.nature].label"
    @close="emit('close')"
    @go-prev="naviguer(-1)"
    @go-next="naviguer(1)"
    @select-sidebar="id => emit('navigate', id)"
  >
    <template #title-badges>
      <span :class="LIB_GRAVITE[item.gravite].cls" class="px-2.5 py-0.5 rounded-full text-xs font-medium">
        {{ LIB_GRAVITE[item.gravite].label }}
      </span>
      <span :class="LIB_NATURE[item.nature].cls" class="px-2.5 py-0.5 rounded-full text-xs font-medium">
        {{ LIB_NATURE[item.nature].label }}
      </span>
    </template>

    <template #form>
      <div class="flex-1 overflow-y-auto px-8 py-6 max-w-3xl mx-auto">

        <!-- Le système mesure un écart, il ne présume aucune intention -->
        <div v-if="item.nature === 'a_qualifier'"
          class="flex items-start gap-2.5 bg-warning-bg text-warning rounded-lg px-3.5 py-2.5 mb-5">
          <Info class="w-4 h-4 shrink-0 mt-px" />
          <p class="text-xs leading-relaxed">
            Cet écart est au statut <strong>« à qualifier »</strong>. Le système mesure un écart de trajectoire ;
            il ne présume d’aucune intention. Seule une qualification en <strong>déviation non justifiée</strong>
            alimente le score du conducteur et peut ouvrir un dossier disciplinaire.
          </p>
        </div>

        <!-- ═══ 1. IDENTIFICATION ═══ -->
        <FormSection
          title="Identification"
          :recaps="[item.id, LIB_TYPE_ECART[item.type], item.voyageRef]"
        >
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Type d’écart</label>
              <span class="text-sm font-medium text-foreground">{{ LIB_TYPE_ECART[item.type] }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Détecté le</label>
              <span class="text-sm text-foreground">{{ fmtDateTime(item.detecteLe) }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Voyage</label>
              <button class="text-sm font-mono text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer text-left"
                @click="emit('ouvrir-voyage', item.voyageId)">
                {{ item.voyageRef }}
              </button>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Trajet</label>
              <span class="text-sm text-foreground">{{ item.trajetLibelle ?? 'Trajet ponctuel' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Véhicule</label>
              <span class="text-sm font-mono font-semibold text-foreground">{{ item.vehiculePlaque }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Chauffeur</label>
              <button v-if="item.chauffeurId"
                class="text-sm text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer text-left w-fit"
                title="Ouvrir le tableau de bord du conducteur"
                @click="emit('voir-conducteur', item.chauffeurId)">
                {{ item.chauffeurNom }}
              </button>
              <span v-else class="text-sm text-foreground">{{ item.chauffeurNom ?? '-' }}</span>
            </div>
            <div class="col-span-2 flex flex-col gap-1 max-sm:col-span-1">
              <label :class="F.fieldLabel">Lieu</label>
              <span class="text-sm text-foreground">{{ item.lieu ?? '-' }}</span>
              <span class="text-[11px] text-muted-foreground font-mono">
                {{ item.lat.toFixed(4) }}, {{ item.lng.toFixed(4) }}
              </span>
            </div>
          </div>
        </FormSection>

        <!-- ═══ 2. ITINÉRAIRE COMPARÉ ═══ -->
        <FormSection
          title="Itinéraire prévu et trajet réel"
          :recaps="[fmtDuree(item.dureeMin), item.ecartLateralMaxM ? `${(item.ecartLateralMaxM / 1000).toFixed(1)} km d’écart` : '-']"
        >
          <FleetMap
            :trace-prevu="item.tracePrevu"
            :trace-reel="item.traceReel"
            :arrets="arretsCarte"
            height="320px"
          />
          <p class="text-[11px] text-muted-foreground mt-2 leading-relaxed">
            Le tracé bleu pointillé relie les sites affectés avant le départ. Le tracé rouge est le
            trajet réellement enregistré par la télématique.
          </p>
        </FormSection>

        <!-- ═══ 3. MESURES ═══ -->
        <FormSection title="Mesures" :recaps="[typeConfig?.libelle ?? '-']">
          <div class="grid grid-cols-4 gap-3 max-sm:grid-cols-2">
            <div v-for="m in mesures" :key="m.label">
              <label :class="F.fieldLabel">{{ m.label }}</label>
              <p class="text-lg font-bold" :class="m.cls">{{ m.value }}</p>
            </div>
          </div>
          <p v-if="typeConfig" class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Règle appliquée : <strong>{{ typeConfig.libelle }}</strong>
            <span v-if="typeConfig.seuilValeur != null">
              - seuil de {{ typeConfig.seuilValeur }} {{ typeConfig.seuilUnite }}</span>.
            {{ typeConfig.description }}
          </p>
        </FormSection>

        <!-- ═══ 4. CHRONOLOGIE ═══ -->
        <FormSection title="Chronologie" :recaps="[`${chronologie.length} évènement(s)`]">
          <ol class="relative pl-5 border-l-2 border-border flex flex-col gap-3.5">
            <li v-for="(e, i) in chronologie" :key="i" class="relative">
              <span class="absolute -left-[26px] top-0.5 w-3 h-3 rounded-full border-2 border-card" :class="e.cls" />
              <div class="text-xs font-medium text-foreground">{{ e.titre }}</div>
              <div class="text-[11px] text-muted-foreground">
                {{ e.heure }}<span v-if="e.detail"> · {{ e.detail }}</span>
              </div>
            </li>
          </ol>
        </FormSection>

        <!-- ═══ 5. JUSTIFICATION DU CHAUFFEUR ═══ -->
        <FormSection
          title="Justification du chauffeur"
          :recaps="[item.justificationChauffeur ? 'déposée' : 'en attente']"
        >
          <template v-if="item.justificationChauffeur">
            <p class="text-sm text-foreground leading-relaxed bg-background rounded-md px-3 py-2.5">
              {{ item.justificationChauffeur }}
            </p>
            <p class="text-[11px] text-muted-foreground mt-1.5">
              Déposée le {{ fmtDateTime(item.justifieLe) }}
            </p>
          </template>
          <template v-else>
            <p class="text-xs text-muted-foreground mb-2">
              Aucune justification déposée. Fenêtre ouverte jusqu’au {{ fmtDateTime(dateLimite) }}.
            </p>
            <textarea v-model="saisieJustif" rows="3" :class="F.fieldTextarea"
              placeholder="Saisir la justification transmise par le chauffeur…" />
            <button :class="Lc.btnOutline" class="mt-2" :disabled="!saisieJustif.trim()" @click="deposerJustification">
              Enregistrer la justification
            </button>
          </template>
        </FormSection>

        <!-- ═══ 6. QUALIFICATION ═══ -->
        <FormSection
          title="Qualification"
          :recaps="[LIB_NATURE[item.nature].label, item.decision ? LIB_DECISION[item.decision] : '-']"
          :default-open="item.nature === 'a_qualifier'"
        >
          <template v-if="item.nature === 'a_qualifier'">
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

            <button :class="Lc.btnPrimary" @click="qualifier">Enregistrer la qualification</button>
          </template>

          <template v-else>
            <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
              <div class="flex flex-col gap-1">
                <label :class="F.fieldLabel">Nature retenue</label>
                <span :class="LIB_NATURE[item.nature].cls" class="text-xs font-medium px-2 py-0.5 rounded-full w-fit">
                  {{ LIB_NATURE[item.nature].label }}
                </span>
              </div>
              <div class="flex flex-col gap-1">
                <label :class="F.fieldLabel">Suite donnée</label>
                <span class="text-sm text-foreground">
                  {{ item.decision ? LIB_DECISION[item.decision] : '-' }}
                  <span v-if="item.refCodis" class="font-mono text-[11px]"> · {{ item.refCodis }}</span>
                </span>
              </div>
              <div class="col-span-2 flex flex-col gap-1 max-sm:col-span-1">
                <label :class="F.fieldLabel">Motif</label>
                <span class="text-sm text-foreground leading-relaxed">{{ item.motifQualification }}</span>
              </div>
              <div class="col-span-2 flex flex-col gap-1 max-sm:col-span-1">
                <label :class="F.fieldLabel">Qualifié par</label>
                <span class="text-sm text-foreground">
                  {{ item.qualifiePar }} - {{ fmtDateTime(item.qualifieLe) }}
                </span>
              </div>
            </div>
          </template>
        </FormSection>

      </div>
    </template>
  </CardModalShell>
</template>

<script setup lang="ts">
/**
 * Fiche d'écart d'itinéraire.
 * Même coquille et même langage visuel que les fiches véhicule, voyage et recharge.
 */
import { ref, computed } from 'vue'
import { Info, AlertCircle } from 'lucide-vue-next'
import CardModalShell from '../shared/CardModalShell.vue'
import FormSection    from '../ui/form-field/FormSection.vue'
import FleetMap       from './FleetMap.vue'
import { useEcartsStore, LIB_TYPE_ECART, LIB_NATURE, LIB_GRAVITE } from '../../stores/ecarts'
import { useConfigurationStore } from '../../stores/configuration'
import { useVoyagesStore } from '../../stores/voyages'
import { useAuthStore } from '../../stores/auth'
import type { EcartItineraire, NatureEcart, DecisionEcart, MapArret } from '../../types/fms'
import { fmtDateTime, fmtDuree, fmtHeure } from '../../lib/fmsUtils'
import * as F  from '../../lib/formClasses'
import * as Lc from '../../lib/listClasses'

const props = defineProps<{ ecart: EcartItineraire }>()
const emit  = defineEmits<{
  close: []
  navigate: [id: string]
  'ouvrir-voyage': [id: string]
  /** Ouvre le tableau de bord du conducteur, avec ses six onglets. */
  'voir-conducteur': [id: string]
}>()

const store        = useEcartsStore()
const configStore  = useConfigurationStore()
const voyagesStore = useVoyagesStore()
const auth         = useAuthStore()

const item = computed(() => store.getById(props.ecart.id) ?? props.ecart)

const typeConfig = computed(() =>
  item.value.typeEcartId ? configStore.getTypeEcart(item.value.typeEcartId) : undefined)

const LIB_DECISION: Record<DecisionEcart, string> = {
  classe:        'Classement sans suite',
  avertissement: 'Avertissement',
  codis:         'Saisine du comité de discipline',
}

const OPTIONS_NATURE: { value: Exclude<NatureEcart, 'a_qualifier'>; label: string; aide: string }[] = [
  { value: 'autorisee',     label: 'Déviation autorisée',
    aide: 'Consécutive à une instruction enregistrée de l’exploitation ou du client.' },
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

const arretsCarte = computed<MapArret[]>(() =>
  voyagesStore.arretsDuVoyage(item.value.voyageId)
    .filter(a => !a.dansSiteDeclare)
    .map(a => ({
      id: a.id, lat: a.lat, lng: a.lng,
      label: a.lieu ?? 'Arrêt relevé', dureeMin: a.dureeMin, justifie: a.justifie,
    })))

const mesures = computed(() => {
  const e = item.value
  return [
    { label: 'Durée hors séquence', value: fmtDuree(e.dureeMin),
      cls: (e.dureeMin ?? 0) > 30 ? 'text-danger' : 'text-foreground' },
    { label: 'Distance parcourue', value: e.distanceKm != null ? `${e.distanceKm} km` : '-',
      cls: 'text-foreground' },
    { label: 'Écart latéral maximal',
      value: e.ecartLateralMaxM != null ? `${(e.ecartLateralMaxM / 1000).toFixed(1)} km` : '-',
      cls: (e.ecartLateralMaxM ?? 0) > 5000 ? 'text-danger' : 'text-foreground' },
    { label: 'Seuil configuré',
      value: typeConfig.value?.seuilValeur != null
        ? `${typeConfig.value.seuilValeur} ${typeConfig.value.seuilUnite ?? ''}` : '-',
      cls: 'text-muted-foreground' },
  ]
})

const chronologie = computed(() => {
  const e = item.value
  const out: { titre: string; heure: string; detail?: string; cls: string }[] = []

  out.push({ titre: 'Écart détecté', heure: fmtHeure(e.detecteLe),
    detail: typeConfig.value?.libelle, cls: 'bg-warning' })

  voyagesStore.arretsDuVoyage(e.voyageId)
    .filter(a => !a.dansSiteDeclare)
    .forEach(a => out.push({
      titre: `Arrêt non planifié - ${fmtDuree(a.dureeMin)}`,
      heure: fmtHeure(a.debut), detail: a.lieu,
      cls: a.justifie ? 'bg-success' : 'bg-danger',
    }))

  out.push({
    titre: 'Retour dans la séquence',
    heure: fmtHeure(new Date(+new Date(e.detecteLe) + (e.dureeMin ?? 0) * 60_000).toISOString()),
    cls: 'bg-primary',
  })

  if (e.justifieLe) out.push({ titre: 'Justification déposée par le chauffeur',
    heure: fmtDateTime(e.justifieLe), cls: 'bg-info' })

  if (e.qualifieLe) out.push({ titre: `Qualifié - ${LIB_NATURE[e.nature].label}`,
    heure: fmtDateTime(e.qualifieLe), detail: e.qualifiePar, cls: 'bg-foreground' })

  return out
})

/** Fenêtre de justification : 24 h ouvrées. */
const dateLimite = computed(() =>
  new Date(+new Date(item.value.detecteLe) + 24 * 3_600_000).toISOString())

function deposerJustification() {
  if (!saisieJustif.value.trim()) return
  store.justifier(item.value.id, saisieJustif.value.trim())
  saisieJustif.value = ''
}

function qualifier() {
  erreur.value = ''
  if (!motif.value.trim()) {
    erreur.value = 'Le motif est obligatoire : c’est lui qui rend le dossier opposable.'
    return
  }
  store.qualifier(
    item.value.id, nature.value, motif.value.trim(),
    auth.user?.name ?? 'Exploitation',
    nature.value === 'non_justifiee' ? decision.value : 'classe',
  )
  motif.value = ''
}

/* ── Navigation d'un écart à l'autre ── */
const ecartsOrdonnes = computed(() =>
  [...store.ecarts].sort((a, b) => +new Date(b.detecteLe) - +new Date(a.detecteLe)))

const indexCourant = computed(() => ecartsOrdonnes.value.findIndex(e => e.id === item.value.id))

const sidebarItems = computed(() =>
  ecartsOrdonnes.value.map(e => ({ no: e.id, label: `${e.vehiculePlaque} · ${LIB_TYPE_ECART[e.type]}` })))

function naviguer(delta: number) {
  const cible = ecartsOrdonnes.value[indexCourant.value + delta]
  if (cible) emit('navigate', cible.id)
}
</script>
