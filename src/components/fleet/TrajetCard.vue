<template>
  <CardModalShell
    page-title="Trajet de référence"
    :page-number="item.code"
    banner-label="Flotte · Trajets"
    :sidebar-items="sidebarItems"
    :current-no="item.id"
    :has-prev="indexCourant > 0"
    :has-next="indexCourant < trajetsOrdonnes.length - 1"
    :is-edit-mode="false"
    :show-edit="false"
    :status-label="item.statut === 'actif' ? 'Actif' : 'Archivé'"
    @close="emit('close')"
    @go-prev="naviguer(-1)"
    @go-next="naviguer(1)"
    @select-sidebar="id => emit('navigate', id)"
  >
    <template #title-badges>
      <span class="px-2.5 py-0.5 rounded-full text-xs font-medium"
        :class="item.statut === 'actif' ? 'bg-success-bg text-success' : 'bg-gray-100 text-gray-400'">
        {{ item.statut === 'actif' ? 'Actif' : 'Archivé' }}
      </span>
      <span v-if="item.recurrent" class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-bg text-info">
        Réutilisable
      </span>
    </template>

    <template #form>
      <div class="flex-1 overflow-y-auto px-8 py-6 max-w-3xl mx-auto">

        <!-- ═══════════════════════════════════════════════════
             1. IDENTIFICATION
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Identification"
          :recaps="[item.code, item.clientNom ?? 'Tous clients']"
        >
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Code</label>
              <span class="text-sm font-mono font-semibold text-foreground">{{ item.code }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Libellé</label>
              <span class="text-sm text-foreground">{{ item.libelle }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Client</label>
              <span class="text-sm text-foreground">{{ item.clientNom ?? 'Tous clients' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Réutilisable</label>
              <span class="text-sm text-foreground">{{ item.recurrent ? 'Oui - trajet de référence' : 'Non - ponctuel' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Distance estimée</label>
              <span class="text-sm text-foreground">{{ item.distanceEstimeeKm }} km</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Durée estimée</label>
              <span class="text-sm text-foreground">{{ fmtDuree(item.dureeEstimeeMin) }}</span>
            </div>
          </div>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             2. LA SÉQUENCE SUR CARTE
             Le tracé relie les sites dans l'ordre : il n'est pas
             calculé par un moteur d'itinéraire.
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Séquence de sites"
          :recaps="[`${item.etapes.length} sites`, `${compter('livraison')} livraison(s)`]"
        >
          <FleetMap
            :trace-prevu="item.etapes.map(e => ({ lat: e.lat, lng: e.lng }))"
            :markers="marqueurs"
            height="300px"
            :show-legend="false"
          />

          <p class="text-[11px] text-muted-foreground mt-2 leading-relaxed">
            Le camion quitte le premier site et dessert les suivants dans cet ordre.
            Le tracé affiché relie simplement les points : le système ne calcule aucun itinéraire,
            il vérifie que les sites ont été atteints.
          </p>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             3. LE DÉTAIL DES ÉTAPES
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Détail des étapes"
          :recaps="[`${item.etapes.length} étapes`]"
        >
          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">#</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Site</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Rôle</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Depuis l’étape précédente</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Pause</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Volume prévu</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in item.etapes" :key="e.id" class="border-b border-border/60">
                <td class="py-2 text-xs font-mono">{{ e.ordre }}</td>
                <td class="py-2 text-xs font-medium">{{ e.siteNom }}</td>
                <td class="py-2">
                  <span class="text-[10px] font-medium px-2 py-0.5 rounded-full" :class="CLS_ROLE[e.role]">
                    {{ LIB_ROLE_ETAPE[e.role] }}
                  </span>
                </td>
                <td class="py-2 text-xs">{{ e.intervalleMin ? fmtDuree(e.intervalleMin) : '-' }}</td>
                <td class="py-2 text-xs">{{ e.pausePrevueMin ? fmtDuree(e.pausePrevueMin) : '-' }}</td>
                <td class="py-2 text-xs">{{ e.volumePrevuL ? fmtL(e.volumePrevuL) : '-' }}</td>
              </tr>
            </tbody>
          </table>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             4. UTILISATION
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Utilisation"
          :recaps="[`${voyagesLies.length} voyage(s)`]"
          :default-open="false"
        >
          <div v-if="!voyagesLies.length" class="text-xs text-muted-foreground py-2">
            Ce trajet n’a encore été utilisé par aucun voyage.
          </div>
          <table v-else class="w-full border-collapse">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Voyage</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Véhicule</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Date</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in voyagesLies" :key="v.id" class="border-b border-border/60">
                <td class="py-2 text-xs font-mono">{{ v.reference }}</td>
                <td class="py-2 text-xs font-mono">{{ v.vehiculePlaque ?? '-' }}</td>
                <td class="py-2 text-xs">{{ fmtDate(v.datePlanifiee) }}</td>
                <td class="py-2 text-xs">{{ v.statut }}</td>
              </tr>
            </tbody>
          </table>
        </FormSection>

      </div>
    </template>
  </CardModalShell>
</template>

<script setup lang="ts">
/**
 * Fiche d'un trajet de référence.
 * Même coquille que la fiche véhicule et la fiche voyage.
 */
import { computed } from 'vue'
import CardModalShell from '../shared/CardModalShell.vue'
import FormSection    from '../ui/form-field/FormSection.vue'
import FleetMap       from './FleetMap.vue'
import { useTrajetsStore } from '../../stores/trajets'
import { useVoyagesStore } from '../../stores/voyages'
import { LIB_ROLE_ETAPE } from '../../types/fms'
import type { Trajet, RoleEtape, MapMarker } from '../../types/fms'
import { fmtDuree, fmtL, fmtDate } from '../../lib/fmsUtils'
import * as F from '../../lib/formClasses'

const props = defineProps<{ trajet: Trajet }>()
const emit  = defineEmits<{ close: []; navigate: [id: string] }>()

const store        = useTrajetsStore()
const voyagesStore = useVoyagesStore()

const item = computed(() => store.getById(props.trajet.id) ?? props.trajet)

const CLS_ROLE: Record<RoleEtape, string> = {
  depart:     'bg-gray-100 text-gray-600',
  chargement: 'bg-primary/10 text-primary',
  livraison:  'bg-success-bg text-success',
  controle:   'bg-info-bg text-info',
  repos:      'bg-warning-bg text-warning',
  arrivee:    'bg-gray-100 text-gray-600',
}

const COULEUR_ROLE: Record<RoleEtape, string> = {
  depart:     '#0B4480',
  chargement: '#0072C5',
  livraison:  '#16a34a',
  controle:   '#6b7280',
  repos:      '#ca8a04',
  arrivee:    '#0B4480',
}

const compter = (role: RoleEtape) => item.value.etapes.filter(e => e.role === role).length

const marqueurs = computed<MapMarker[]>(() =>
  item.value.etapes.map(e => ({
    id: e.id, lat: e.lat, lng: e.lng,
    label: `${e.ordre}. ${e.siteNom}`,
    sublabel: LIB_ROLE_ETAPE[e.role],
    color: COULEUR_ROLE[e.role],
  })))

/** Voyages ayant utilisé ce trajet de référence. */
const voyagesLies = computed(() =>
  voyagesStore.voyages.filter(v => v.trajetId === item.value.id))

/* ── Navigation d'un trajet à l'autre ─────────────────────── */
const trajetsOrdonnes = computed(() =>
  [...store.trajets].sort((a, b) => a.code.localeCompare(b.code)))

const indexCourant = computed(() =>
  trajetsOrdonnes.value.findIndex(t => t.id === item.value.id))

const sidebarItems = computed(() =>
  trajetsOrdonnes.value.map(t => ({ no: t.id, label: t.code })))

function naviguer(delta: number) {
  const cible = trajetsOrdonnes.value[indexCourant.value + delta]
  if (cible) emit('navigate', cible.id)
}
</script>
