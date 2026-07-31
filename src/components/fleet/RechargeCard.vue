<template>
  <CardModalShell
    page-title="Fiche de recharge"
    :page-number="item.id"
    banner-label="Flotte · Carburant"
    :sidebar-items="sidebarItems"
    :current-no="item.id"
    :has-prev="indexCourant > 0"
    :has-next="indexCourant < rechargesOrdonnees.length - 1"
    :is-edit-mode="false"
    :show-edit="false"
    :status-label="STATUT[item.statut].label"
    @close="emit('close')"
    @go-prev="naviguer(-1)"
    @go-next="naviguer(1)"
    @select-sidebar="id => emit('navigate', id)"
  >
    <template #title-badges>
      <span :class="STATUT[item.statut].cls" class="px-2.5 py-0.5 rounded-full text-xs font-medium">
        {{ STATUT[item.statut].label }}
      </span>
      <span v-if="nbEchecs" class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-bg text-danger">
        {{ nbEchecs }} contrôle(s) en échec
      </span>
    </template>

    <template #form>
      <div class="flex-1 overflow-y-auto px-8 py-6 max-w-3xl mx-auto">

        <!-- ═══════════════════════════════════════════════════
             1. LA RECHARGE — ce qui a été déclaré
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="La recharge"
          :recaps="[item.vehiculePlaque, `${item.nombreBons ?? '—'} bon(s)`, fmtL(item.litres)]"
        >
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Date et heure déclarées</label>
              <span class="text-sm text-foreground">{{ fmtDateTime(item.date) }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Canal de collecte</label>
              <span class="text-sm text-foreground">{{ LIB_CANAL[item.canal] }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Véhicule</label>
              <span class="text-sm font-mono font-semibold text-foreground">{{ item.vehiculePlaque }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Chauffeur affecté</label>
              <span class="text-sm text-foreground">{{ item.chauffeurNom ?? '—' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Lieu déclaré</label>
              <span class="text-sm text-foreground">{{ item.lieu }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Voyage rattaché</label>
              <span class="text-sm font-mono text-foreground">{{ item.voyageRef ?? '—' }}</span>
            </div>
          </div>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             2. QUANTITÉS ET BONS
             Le client délivre des bons d'un litrage fixe.
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Quantités et bons"
          :recaps="[fmtL(item.litres), fmtAr(item.montant)]"
        >
          <div class="grid grid-cols-3 gap-x-6 gap-y-4 max-sm:grid-cols-2">
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Bons délivrés</label>
              <span class="text-lg font-bold text-primary">{{ item.nombreBons ?? '—' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Litres par bon</label>
              <span class="text-sm text-foreground">{{ item.litresParBon ? fmtL(item.litresParBon) : '—' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Litres délivrés</label>
              <span class="text-lg font-bold text-foreground">{{ fmtL(item.litres) }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Prix au litre</label>
              <span class="text-sm text-foreground">{{ fmtAr(item.prixLitre) }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Montant total</label>
              <span class="text-sm font-semibold text-foreground">{{ fmtAr(item.montant) }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Index kilométrique</label>
              <span class="text-sm text-foreground">{{ item.odometre.toLocaleString('fr-FR') }} km</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Plein complet</label>
              <span class="text-sm" :class="item.pleinComplet ? 'text-success font-medium' : 'text-muted-foreground'">
                {{ item.pleinComplet ? 'Oui' : 'Non' }}
              </span>
            </div>
          </div>

          <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Seuls les pleins complets servent au calcul de la consommation : entre deux pleins,
            les litres délivrés correspondent exactement à ce qui a été consommé.
          </p>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             3. CONTRÔLES DE VRAISEMBLANCE
             Six croisements automatiques, sans aucun capteur.
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Contrôles de vraisemblance"
          :recaps="[nbEchecs ? `${nbEchecs} en échec` : 'tous conformes']"
        >
          <ul class="flex flex-col gap-1.5">
            <li v-for="c in item.controles" :key="c.code"
              class="flex items-start gap-2.5 rounded-md px-3 py-2"
              :class="c.ok ? 'bg-background' : 'bg-danger-bg'">
              <component :is="c.ok ? CheckCircle2 : XCircle" class="w-4 h-4 shrink-0 mt-px"
                :class="c.ok ? 'text-success' : 'text-danger'" />
              <div class="min-w-0">
                <p class="text-xs font-medium" :class="c.ok ? 'text-foreground' : 'text-danger'">{{ c.libelle }}</p>
                <p class="text-[11px] text-muted-foreground">{{ c.detail }}</p>
              </div>
            </li>
          </ul>

          <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Ces contrôles croisent trois informations que GTD possédait déjà séparément :
            le relevé de recharge, la position du véhicule donnée par la télématique, et
            l’affectation du chauffeur ce jour-là. Aucun capteur n’est nécessaire.
          </p>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             4. POSITION — la carte du croisement
             Ne s'affiche que si l'écart est significatif.
             ═══════════════════════════════════════════════════ -->
        <FormSection
          v-if="item.positionVehicule"
          title="Position du véhicule"
          :recaps="[`écart ${item.positionVehicule.ecartKm.toFixed(1)} km`]"
          :default-open="ecartPosition > 2"
        >
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 mb-3">
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Lieu déclaré</label>
              <span class="text-sm text-foreground">{{ item.lieu }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Écart à la position réelle</label>
              <span class="text-sm font-semibold"
                :class="ecartPosition > 2 ? 'text-danger' : 'text-success'">
                {{ item.positionVehicule.ecartKm.toFixed(1) }} km
              </span>
            </div>
          </div>

          <FleetMap :markers="marqueurs" height="240px" :show-legend="false" />

          <p v-if="ecartPosition > 2" class="text-[11px] text-danger mt-2 leading-relaxed">
            Le véhicule se trouvait à {{ item.positionVehicule.ecartKm.toFixed(1) }} km du lieu de
            recharge déclaré à l’horodatage indiqué, selon la télématique. Le point bleu est le lieu
            déclaré, le point rouge la position réelle.
          </p>
          <p v-else class="text-[11px] text-success mt-2">
            Position cohérente avec le lieu déclaré.
          </p>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             5. QUALIFICATION — le circuit de refacturation
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Qualification de l’écart"
          :recaps="[item.qualification ? LIB_QUALIF[item.qualification] : 'non qualifié']"
          :default-open="item.statut === 'anomalie' || item.statut === 'qualifie'"
        >
          <template v-if="item.statut === 'qualifie'">
            <div class="grid grid-cols-2 gap-x-6 gap-y-4">
              <div class="flex flex-col gap-1">
                <label :class="F.fieldLabel">Cause retenue</label>
                <span class="text-sm font-medium text-foreground">{{ LIB_QUALIF[item.qualification!] }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <label :class="F.fieldLabel">Statut du dossier</label>
                <span class="text-sm text-foreground">Qualifié</span>
              </div>
            </div>
            <div class="flex flex-col gap-1 mt-4">
              <label :class="F.fieldLabel">Éléments recueillis</label>
              <p class="text-sm text-foreground leading-relaxed">{{ item.commentaire || '—' }}</p>
            </div>
          </template>

          <template v-else-if="item.statut === 'anomalie'">
            <div :class="F.field" class="mb-2.5">
              <label :class="F.fieldLabel">Cause de l’écart</label>
              <select v-model="qualif" :class="F.fieldSelect">
                <option value="">Choisir…</option>
                <option v-for="(lib, k) in LIB_QUALIF" :key="k" :value="k">{{ lib }}</option>
              </select>
            </div>
            <div :class="F.field" class="mb-2.5">
              <label :class="F.fieldLabel">Éléments recueillis</label>
              <textarea v-model="commentaire" rows="3" :class="F.fieldTextarea"
                placeholder="Justification du chauffeur, vérification de l’exploitation…" />
            </div>
            <button :class="Lc.btnPrimary" :disabled="!qualif" @click="qualifier">
              Enregistrer la qualification
            </button>
            <p class="text-[11px] text-muted-foreground mt-2.5 leading-relaxed">
              Toute refacturation suppose une qualification préalable et une double validation
              hiérarchique. La grille doit être validée par la direction des ressources humaines.
            </p>
          </template>

          <p v-else class="text-xs text-muted-foreground py-2">
            Recharge conforme — aucune qualification nécessaire.
          </p>
        </FormSection>

      </div>
    </template>
  </CardModalShell>
</template>

<script setup lang="ts">
/**
 * Fiche de recharge de carburant.
 * Même coquille et même langage visuel que la fiche véhicule.
 */
import { ref, computed } from 'vue'
import { CheckCircle2, XCircle } from 'lucide-vue-next'
import CardModalShell from '../shared/CardModalShell.vue'
import FormSection    from '../ui/form-field/FormSection.vue'
import FleetMap       from './FleetMap.vue'
import { useCarburantStore, LIB_CANAL, LIB_QUALIF } from '../../stores/carburant.ts'
import type { RechargeCarburant, StatutRecharge, QualifEcartCarburant, MapMarker } from '../../types/fms.ts'
import { fmtDateTime, fmtL, fmtAr } from '../../lib/fmsUtils.ts'
import * as F  from '../../lib/formClasses.ts'
import * as Lc from '../../lib/listClasses.ts'

const props = defineProps<{ recharge: RechargeCarburant }>()
const emit  = defineEmits<{ close: []; navigate: [id: string] }>()

const store = useCarburantStore()
const item  = computed(() => store.getById(props.recharge.id) ?? props.recharge)

const STATUT: Record<StatutRecharge, { label: string; cls: string }> = {
  valide:           { label: 'Conforme',         cls: 'bg-success-bg text-success' },
  anomalie:         { label: 'En anomalie',      cls: 'bg-danger-bg text-danger'   },
  en_qualification: { label: 'En qualification', cls: 'bg-warning-bg text-warning' },
  qualifie:         { label: 'Qualifiée',        cls: 'bg-gray-100 text-gray-600'  },
}

const nbEchecs = computed(() => item.value.controles.filter(c => !c.ok).length)
const ecartPosition = computed(() => item.value.positionVehicule?.ecartKm ?? 0)

/** Deux marqueurs : lieu déclaré en bleu, position réelle en rouge. */
const marqueurs = computed<MapMarker[]>(() => {
  const r = item.value
  if (!r.positionVehicule) return []
  return [
    { id: 'declare', lat: r.lat, lng: r.lng, label: 'Lieu de recharge déclaré', color: '#0072C5' },
    { id: 'reel', lat: r.positionVehicule.lat, lng: r.positionVehicule.lng,
      label: 'Position réelle du véhicule', sublabel: 'Source télématique', color: '#dc2626' },
  ]
})

/* ── Qualification ────────────────────────────────────────── */
const qualif      = ref<QualifEcartCarburant | ''>('')
const commentaire = ref('')

function qualifier() {
  if (!qualif.value) return
  store.qualifier(item.value.id, qualif.value, commentaire.value)
  qualif.value = ''
  commentaire.value = ''
}

/* ── Navigation d'une recharge à l'autre ──────────────────── */
const rechargesOrdonnees = computed(() =>
  [...store.recharges].sort((a, b) => +new Date(b.date) - +new Date(a.date)))

const indexCourant = computed(() =>
  rechargesOrdonnees.value.findIndex(r => r.id === item.value.id))

const sidebarItems = computed(() =>
  rechargesOrdonnees.value.map(r => ({ no: r.id, label: `${r.vehiculePlaque} · ${fmtL(r.litres)}` })))

function naviguer(delta: number) {
  const cible = rechargesOrdonnees.value[indexCourant.value + delta]
  if (cible) emit('navigate', cible.id)
}
</script>