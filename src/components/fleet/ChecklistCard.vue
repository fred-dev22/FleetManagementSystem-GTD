<template>
  <CardModalShell
    page-title="Checklist sur route"
    :page-number="item.reference"
    banner-label="Flotte · Contrôles techniques"
    :sidebar-items="sidebarItems"
    :current-no="item.id"
    :has-prev="indexCourant > 0"
    :has-next="indexCourant < listeOrdonnee.length - 1"
    :is-edit-mode="false"
    :show-edit="false"
    :status-label="anomalies.length ? `${anomalies.length} anomalie(s)` : 'Conforme'"
    @close="emit('close')"
    @go-prev="naviguer(-1)"
    @go-next="naviguer(1)"
    @select-sidebar="(id: string) => emit('navigate', id)"
  >
    <template #title-badges>
      <span class="px-2.5 py-0.5 rounded-full text-xs font-medium"
        :class="anomalies.length ? 'bg-danger-bg text-danger' : 'bg-success-bg text-success'">
        {{ anomalies.length ? `${anomalies.length} anomalie(s)` : 'Conforme' }}
      </span>
      <span v-if="item.signeParChauffeur" class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        Signée
      </span>
    </template>

    <template #form>
      <div class="flex-1 overflow-y-auto px-8 py-6 max-w-3xl mx-auto">

        <FormSection title="Identification" :recaps="[item.tracteurPlaque, item.chauffeurNom]">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Référence</label>
              <span class="text-sm font-mono font-semibold text-foreground">{{ item.reference }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Voyage</label>
              <span class="text-sm font-mono text-foreground">{{ item.voyageRef ?? '—' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Tracteur</label>
              <span class="text-sm font-mono text-foreground">{{ item.tracteurPlaque }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Citerne</label>
              <span class="text-sm font-mono text-foreground">{{ item.citernePlaque ?? '—' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Chauffeur</label>
              <span class="text-sm text-foreground">{{ item.chauffeurNom }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Période</label>
              <span class="text-sm text-foreground">
                {{ fmtDateTime(item.dateDebut) }}<span v-if="item.dateFin"> → {{ fmtHeure(item.dateFin) }}</span>
              </span>
            </div>
          </div>
          <p v-if="item.synchroniseLe" class="text-[11px] text-muted-foreground mt-3">
            Saisie hors connexion, synchronisée le {{ fmtDateTime(item.synchroniseLe) }}.
          </p>
        </FormSection>

        <FormSection v-if="anomalies.length" title="Anomalies relevées" :recaps="[`${anomalies.length}`]">
          <div v-for="(a, i) in anomalies" :key="i"
            class="flex items-start gap-2.5 rounded-md bg-danger-bg px-3 py-2 mb-1.5">
            <AlertTriangle class="w-3.5 h-3.5 shrink-0 mt-0.5 text-danger" />
            <div class="min-w-0">
              <p class="text-xs font-medium text-danger">{{ a.libelle }}</p>
              <p class="text-[11px] text-muted-foreground">
                Pause {{ a.pause }}<span v-if="a.commentaire"> · {{ a.commentaire }}</span>
              </p>
            </div>
          </div>
          <p class="text-[11px] text-muted-foreground mt-2 leading-relaxed">
            Toute anomalie alerte immédiatement le responsable maintenance et le Control Room.
            Un ordre de travail peut être ouvert directement depuis ce relevé.
          </p>
        </FormSection>

        <FormSection
          title="Relevés par pause"
          :recaps="[`${item.releves.length} relevé(s) sur 11 possibles`]"
        >
          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr class="border-b border-border">
                  <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground sticky left-0 bg-card">Point de contrôle</th>
                  <th v-for="r in item.releves" :key="r.pause"
                    class="py-1.5 text-[11px] font-semibold text-muted-foreground text-center px-1.5">
                    P{{ r.pause }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in POINTS_CHECKLIST_ROUTE" :key="p.code" class="border-b border-border/60">
                  <td class="py-1.5 text-[11px] text-foreground sticky left-0 bg-card pr-3">{{ p.libelle }}</td>
                  <td v-for="r in item.releves" :key="r.pause" class="py-1.5 text-center">
                    <span v-if="r.resultats[p.code] === 'conforme'" class="text-success text-xs">✓</span>
                    <span v-else-if="r.resultats[p.code] === 'anomalie'" class="text-danger text-xs font-bold">0</span>
                    <span v-else class="text-gray-300 text-xs">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Notation reprise du formulaire papier : une coche si le point est conforme, un zéro
            s’il est absent ou défectueux. Seize points, jusqu’à onze pauses par voyage.
          </p>
        </FormSection>

        <FormSection title="Détail des pauses" :recaps="[`${item.releves.length}`]" :default-open="false">
          <div v-for="r in item.releves" :key="r.pause" class="border-b border-border/60 py-2.5">
            <div class="flex items-baseline justify-between">
              <span class="text-xs font-medium text-foreground">Pause {{ r.pause }} — {{ r.lieu ?? 'lieu non renseigné' }}</span>
              <span class="text-[11px] text-muted-foreground">{{ fmtDateTime(r.horodatage) }}</span>
            </div>
            <p v-if="r.commentaire" class="text-[11px] text-muted-foreground mt-1">{{ r.commentaire }}</p>
          </div>
        </FormSection>

      </div>
    </template>
  </CardModalShell>
</template>

<script setup lang="ts">
/** US 2.3.1 — Fiche d'une checklist sur route. */
import { computed } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'
import CardModalShell from '../shared/CardModalShell.vue'
import FormSection    from '../ui/form-field/FormSection.vue'
import { useFlotteStore } from '../../stores/flotte'
import { POINTS_CHECKLIST_ROUTE } from '../../types/flotte'
import type { ChecklistRoute } from '../../types/flotte'
import { fmtDateTime, fmtHeure } from '../../lib/fmsUtils'
import * as F from '../../lib/formClasses'

const props = defineProps<{ checklist: ChecklistRoute }>()
const emit  = defineEmits<{ close: []; navigate: [id: string] }>()

const store = useFlotteStore()
const item = computed(() => store.checklists.find(c => c.id === props.checklist.id) ?? props.checklist)
const anomalies = computed(() => store.anomaliesDe(item.value))

const listeOrdonnee = computed(() =>
  [...store.checklists].sort((a, b) => +new Date(b.dateDebut) - +new Date(a.dateDebut)))
const indexCourant = computed(() => listeOrdonnee.value.findIndex(c => c.id === item.value.id))
const sidebarItems = computed(() =>
  listeOrdonnee.value.map(c => ({ no: c.id, label: `${c.reference} · ${c.tracteurPlaque}` })))

function naviguer(d: number) {
  const c = listeOrdonnee.value[indexCourant.value + d]
  if (c) emit('navigate', c.id)
}
</script>
