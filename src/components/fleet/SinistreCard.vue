<template>
  <CardModalShell
    page-title="Sinistre"
    :page-number="item.reference"
    banner-label="Flotte · Assurances"
    :sidebar-items="sidebarItems"
    :current-no="item.id"
    :has-prev="indexCourant > 0"
    :has-next="indexCourant < liste.length - 1"
    :is-edit-mode="false"
    :show-edit="false"
    :status-label="LIB_INDEMNISATION[item.statutIndemnisation]"
    @close="emit('close')"
    @go-prev="naviguer(-1)"
    @go-next="naviguer(1)"
    @select-sidebar="(id: string) => emit('navigate', id)"
  >
    <template #title-badges>
      <span class="px-2.5 py-0.5 rounded-full text-xs font-medium" :class="LIB_GRAVITE_SINISTRE[item.gravite].cls">
        {{ LIB_GRAVITE_SINISTRE[item.gravite].label }}
      </span>
      <span v-if="item.responsabiliteGtd" class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-bg text-danger">
        Responsabilité GTD
      </span>
    </template>

    <template #form>
      <div class="flex-1 overflow-y-auto px-8 py-6 max-w-3xl mx-auto">

        <FormSection title="Circonstances" :recaps="[fmtDate(item.date), item.lieu]">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Référence</label>
              <span class="text-sm font-mono font-semibold text-foreground">{{ item.reference }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Date et heure</label>
              <span class="text-sm text-foreground">{{ fmtDateTime(item.date) }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Véhicule</label>
              <span class="text-sm font-mono text-foreground">{{ item.vehiculePlaque }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Chauffeur au volant</label>
              <span class="text-sm text-foreground">{{ item.chauffeurNom ?? '—' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Lieu</label>
              <span class="text-sm text-foreground">{{ item.lieu }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Kilométrage</label>
              <span class="text-sm text-foreground">
                {{ item.kilometrage ? item.kilometrage.toLocaleString('fr-FR') + ' km' : '—' }}
              </span>
            </div>
          </div>

          <div class="flex flex-col gap-1 mt-4">
            <label :class="F.fieldLabel">Circonstances</label>
            <p class="text-sm text-foreground leading-relaxed">{{ item.circonstances }}</p>
          </div>

          <div v-if="item.tiersImpliques" class="flex flex-col gap-1 mt-4">
            <label :class="F.fieldLabel">Tiers impliqués</label>
            <p class="text-sm text-foreground leading-relaxed">{{ item.tiersImpliques }}</p>
          </div>
        </FormSection>

        <!-- Le coût de réparation et l'indemnisation sont suivis séparément -->
        <FormSection
          title="Coût et indemnisation"
          :recaps="[fmtAr(item.montantDommagesAr ?? 0), LIB_INDEMNISATION[item.statutIndemnisation]]"
          :default-open="true"
        >
          <div class="grid grid-cols-3 gap-3 mb-4 max-sm:grid-cols-1">
            <div>
              <label :class="F.fieldLabel">Dommages constatés</label>
              <p class="text-lg font-bold text-foreground">
                {{ item.montantDommagesAr ? fmtAr(item.montantDommagesAr) : '—' }}
              </p>
            </div>
            <div>
              <label :class="F.fieldLabel">Indemnisation reçue</label>
              <p class="text-lg font-bold" :class="item.montantIndemniseAr ? 'text-success' : 'text-muted-foreground'">
                {{ item.montantIndemniseAr ? fmtAr(item.montantIndemniseAr) : '—' }}
              </p>
            </div>
            <div>
              <label :class="F.fieldLabel">Reste à charge</label>
              <p class="text-lg font-bold" :class="reste > 0 ? 'text-danger' : 'text-success'">
                {{ fmtAr(reste) }}
              </p>
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label :class="F.fieldLabel">Suite donnée</label>
            <span class="text-sm font-medium text-foreground">{{ LIB_INDEMNISATION[item.statutIndemnisation] }}</span>
          </div>

          <div v-if="police" class="grid grid-cols-2 gap-x-6 gap-y-4 mt-4">
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Police</label>
              <span class="text-sm font-mono text-foreground">{{ police.numeroPolice }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Compagnie</label>
              <span class="text-sm text-foreground">{{ police.compagnie }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Franchise</label>
              <span class="text-sm text-foreground">{{ police.franchiseAr ? fmtAr(police.franchiseAr) : '—' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Échéance de la police</label>
              <span class="text-sm text-foreground">{{ fmtDate(police.dateEcheance) }}</span>
            </div>
          </div>

          <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Le suivi de l’indemnisation est distinct du coût de réparation : un sinistre peut être
            réparé sans être encore indemnisé, ou indemnisé partiellement.
          </p>
        </FormSection>

        <FormSection title="Conséquences" :recaps="[item.ordreTravailId ? 'réparation ouverte' : 'aucune réparation']">
          <div v-if="item.ordreTravailId"
            class="flex items-start gap-2.5 bg-info-bg text-info rounded-lg px-3.5 py-2.5 mb-3">
            <Wrench class="w-4 h-4 shrink-0 mt-px" />
            <p class="text-xs leading-relaxed">
              Un ordre de travail a été ouvert : <strong class="font-mono">{{ item.ordreTravailId }}</strong>.
              Le véhicule est passé en indisponibilité avec le code <strong class="font-mono">ACC</strong>.
            </p>
          </div>

          <div class="flex items-start gap-2.5 bg-background border border-border rounded-lg px-3.5 py-2.5">
            <TrendingDown class="w-4 h-4 shrink-0 mt-px text-muted-foreground" />
            <p class="text-[11px] text-muted-foreground leading-relaxed">
              Ce sinistre alimente l’indicateur « accidents par million de kilomètres » du cahier
              des charges, dont la cible est de tendre vers zéro.
            </p>
          </div>
        </FormSection>

      </div>
    </template>
  </CardModalShell>
</template>

<script setup lang="ts">
/** US 2.7.3 — Fiche d'un sinistre. */
import { computed } from 'vue'
import { Wrench, TrendingDown } from 'lucide-vue-next'
import CardModalShell from '../shared/CardModalShell.vue'
import FormSection    from '../ui/form-field/FormSection.vue'
import { useFlotteStore } from '../../stores/flotte'
import { LIB_GRAVITE_SINISTRE, LIB_INDEMNISATION } from '../../types/flotte'
import type { Sinistre } from '../../types/flotte'
import { fmtAr, fmtDate, fmtDateTime } from '../../lib/fmsUtils'
import * as F from '../../lib/formClasses'

const props = defineProps<{ sinistre: Sinistre }>()
const emit  = defineEmits<{ close: []; navigate: [id: string] }>()

const store = useFlotteStore()
const item  = computed(() => store.sinistres.find(s => s.id === props.sinistre.id) ?? props.sinistre)

const reste  = computed(() => store.resteACharge(item.value))
const police = computed(() => store.polices.find(p => p.id === item.value.policeId))

const liste = computed(() =>
  [...store.sinistres].sort((a, b) => +new Date(b.date) - +new Date(a.date)))
const indexCourant = computed(() => liste.value.findIndex(s => s.id === item.value.id))
const sidebarItems = computed(() =>
  liste.value.map(s => ({ no: s.id, label: `${s.reference} · ${s.vehiculePlaque}` })))

function naviguer(d: number) {
  const s = liste.value[indexCourant.value + d]
  if (s) emit('navigate', s.id)
}
</script>
