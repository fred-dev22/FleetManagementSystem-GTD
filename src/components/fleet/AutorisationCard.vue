<template>
  <CardModalShell
    page-title="Autorisation de départ"
    :page-number="item.reference"
    banner-label="Flotte · Control Room"
    :sidebar-items="sidebarItems"
    :current-no="item.id"
    :has-prev="indexCourant > 0"
    :has-next="indexCourant < liste.length - 1"
    :is-edit-mode="false"
    :show-edit="false"
    :status-label="statutLabel"
    @close="emit('close')"
    @go-prev="naviguer(-1)"
    @go-next="naviguer(1)"
    @select-sidebar="(id: string) => emit('navigate', id)"
  >
    <template #title-badges>
      <span class="px-2.5 py-0.5 rounded-full text-xs font-medium" :class="statutCls">
        {{ statutLabel }}
      </span>
    </template>

    <template #form>
      <div class="flex-1 overflow-y-auto px-8 py-6 max-w-3xl mx-auto">

        <FormSection title="Identification" :recaps="[item.vehiculePlaque, item.chauffeurNom]">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Référence</label>
              <span class="text-sm font-mono font-semibold text-foreground">{{ item.reference }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Voyage</label>
              <span class="text-sm font-mono text-foreground">{{ item.voyageRef ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Véhicule</label>
              <span class="text-sm font-mono text-foreground">{{ item.vehiculePlaque }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Chauffeur</label>
              <span class="text-sm text-foreground">{{ item.chauffeurNom }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Demandée le</label>
              <span class="text-sm text-foreground">{{ fmtDateTime(item.demandeeLe) }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Suivi activé</label>
              <span class="text-sm text-foreground">
                {{ item.suiviActiveLe ? fmtDateTime(item.suiviActiveLe) : 'non activé' }}
              </span>
            </div>
          </div>
        </FormSection>

        <!-- Les quatre contrôles simultanés -->
        <FormSection
          title="Contrôles avant départ"
          :recaps="[`${nbConformes}/4 conformes`]"
          :default-open="true"
        >
          <div class="flex flex-col gap-1.5">
            <div v-for="c in item.controles" :key="c.controle">
              <!-- Le contrôle « checklist » ouvre la grille des 16 points -
                   c'est celui que le client a signalé comme manquant :
                   avant, seul un drapeau conforme/non-conforme s'affichait
                   ici, sans le détail que fournit la checklist sur route. -->
              <template v-if="c.controle === 'checklist'">
                <button type="button"
                  class="w-full flex items-start gap-2.5 rounded-md px-3 py-2.5 text-left cursor-pointer border-0"
                  :class="c.conforme ? 'bg-background' : 'bg-danger-bg'"
                  @click="checklistOuverte = !checklistOuverte">
                  <component :is="c.conforme ? CheckCircle2 : XCircle" class="w-4 h-4 shrink-0 mt-px"
                    :class="c.conforme ? 'text-success' : 'text-danger'" />
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-medium" :class="c.conforme ? 'text-foreground' : 'text-danger'">
                      {{ LIB_CONTROLE_DEPART[c.controle] }}
                    </p>
                    <p v-if="c.detail" class="text-[11px] text-muted-foreground">{{ c.detail }}</p>
                    <p v-else-if="!releveDepart" class="text-[11px] text-warning">Checklist avant départ non encore réalisée</p>
                  </div>
                  <ChevronDown class="w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform"
                    :class="{ 'rotate-180': checklistOuverte }" />
                </button>

                <div v-if="checklistOuverte" class="mt-1.5 rounded-md border border-border p-3">
                  <!-- Déjà réalisée : lecture seule -->
                  <div v-if="releveDepart" class="grid grid-cols-2 gap-1.5">
                    <div v-for="p in POINTS_CHECKLIST_ROUTE" :key="p.code"
                      class="flex items-center gap-1.5 text-[11px]">
                      <component :is="releveDepart.resultats[p.code] === 'conforme' ? CheckCircle2 : XCircle"
                        class="w-3 h-3 shrink-0" :class="releveDepart.resultats[p.code] === 'conforme' ? 'text-success' : 'text-danger'" />
                      <span :class="releveDepart.resultats[p.code] !== 'conforme' ? 'text-danger' : 'text-foreground'">{{ p.libelle }}</span>
                    </div>
                    <p class="col-span-2 text-[11px] text-muted-foreground mt-1">
                      Réalisée le {{ fmtDateTime(releveDepart.horodatage) }}
                    </p>
                  </div>

                  <!-- Pas encore réalisée : saisie, uniquement tant que
                       l'autorisation n'est pas encore décidée. -->
                  <template v-else-if="!item.decideLe">
                    <p class="text-[11px] text-muted-foreground mb-2">
                      Point par point, avant que le camion ne quitte l'atelier.
                    </p>
                    <div class="grid grid-cols-2 gap-1.5">
                      <label v-for="p in POINTS_CHECKLIST_ROUTE" :key="p.code"
                        class="flex items-center gap-1.5 text-[11px] cursor-pointer">
                        <input type="checkbox" v-model="saisieChecklist[p.code]" class="shrink-0" />
                        <span>{{ p.libelle }}</span>
                      </label>
                    </div>
                    <button :class="Lc.btnOutline" class="mt-3 w-full justify-center"
                      @click="validerChecklistDepart">
                      Valider la checklist avant départ
                    </button>
                  </template>

                  <p v-else class="text-[11px] text-muted-foreground">
                    Aucune checklist avant départ n'a été saisie pour cette autorisation.
                  </p>
                </div>
              </template>

              <!-- Les trois autres contrôles : inchangés. -->
              <div v-else
                class="flex items-start gap-2.5 rounded-md px-3 py-2.5"
                :class="c.conforme ? 'bg-background' : 'bg-danger-bg'">
                <component :is="c.conforme ? CheckCircle2 : XCircle" class="w-4 h-4 shrink-0 mt-px"
                  :class="c.conforme ? 'text-success' : 'text-danger'" />
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-medium" :class="c.conforme ? 'text-foreground' : 'text-danger'">
                    {{ LIB_CONTROLE_DEPART[c.controle] }}
                  </p>
                  <p v-if="c.detail" class="text-[11px] text-muted-foreground">{{ c.detail }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-x-6 gap-y-3 mt-4">
            <div class="flex items-center gap-2">
              <component :is="item.briefingSecuriteFait ? CheckCircle2 : Circle" class="w-3.5 h-3.5 shrink-0"
                :class="item.briefingSecuriteFait ? 'text-success' : 'text-muted-foreground'" />
              <span class="text-xs text-foreground">Briefing sécurité</span>
            </div>
            <div class="flex items-center gap-2">
              <component :is="item.reposHebdoVerifie ? CheckCircle2 : Circle" class="w-3.5 h-3.5 shrink-0"
                :class="item.reposHebdoVerifie ? 'text-success' : 'text-muted-foreground'" />
              <span class="text-xs text-foreground">Repos hebdomadaire vérifié</span>
            </div>
          </div>

          <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Les quatre contrôles doivent tous être conformes. Aucun voyage ne peut être créé
            sans autorisation délivrée.
          </p>
        </FormSection>

        <FormSection title="Décision" :recaps="[statutLabel]" :default-open="!item.decideLe">
          <template v-if="item.decideLe">
            <div class="grid grid-cols-2 gap-x-6 gap-y-4">
              <div class="flex flex-col gap-1">
                <label :class="F.fieldLabel">Décision</label>
                <span class="text-sm font-medium" :class="item.accordee ? 'text-success' : 'text-danger'">
                  {{ item.accordee ? 'Départ autorisé' : 'Départ refusé' }}
                </span>
              </div>
              <div class="flex flex-col gap-1">
                <label :class="F.fieldLabel">Décidée par</label>
                <span class="text-sm text-foreground">{{ item.decidePar }} - {{ fmtDateTime(item.decideLe) }}</span>
              </div>
            </div>
            <div v-if="item.motifRefus" class="flex flex-col gap-1 mt-4">
              <label :class="F.fieldLabel">Motif du refus</label>
              <p class="text-sm text-foreground leading-relaxed">{{ item.motifRefus }}</p>
            </div>
          </template>

          <template v-else>
            <div v-if="!peutPartir"
              class="flex items-start gap-2.5 bg-danger-bg text-danger rounded-lg px-3.5 py-2.5 mb-3">
              <AlertCircle class="w-4 h-4 shrink-0 mt-px" />
              <p class="text-xs leading-relaxed">
                {{ 4 - nbConformes }} contrôle(s) non conforme(s). Le départ ne peut pas être autorisé
                tant qu’ils ne sont pas levés.
              </p>
            </div>

            <div :class="F.field" class="mb-2.5">
              <label :class="F.fieldLabel">Motif <span v-if="!peutPartir" class="text-danger">*</span></label>
              <textarea v-model="motif" rows="2" :class="F.fieldTextarea"
                placeholder="Observation ou motif du refus…" />
            </div>

            <div class="flex items-center gap-2">
              <button :class="Lc.btnPrimary" :disabled="!peutPartir" @click="decider(true)">
                Autoriser le départ
              </button>
              <button :class="Lc.btnOutline" :disabled="!motif.trim()" @click="decider(false)">
                Refuser
              </button>
            </div>
          </template>
        </FormSection>

      </div>
    </template>
  </CardModalShell>
</template>

<script setup lang="ts">
/** US 2.4.1 - Fiche d'une autorisation de départ. */
import { ref, computed, reactive } from 'vue'
import { CheckCircle2, XCircle, Circle, AlertCircle, ChevronDown } from 'lucide-vue-next'
import CardModalShell from '../shared/CardModalShell.vue'
import FormSection    from '../ui/form-field/FormSection.vue'
import { useFlotteStore } from '../../stores/flotte'
import { useAuthStore } from '../../stores/auth'
import { LIB_CONTROLE_DEPART, POINTS_CHECKLIST_ROUTE } from '../../types/flotte'
import type { AutorisationDepart, ResultatPoint } from '../../types/flotte'
import { fmtDateTime } from '../../lib/fmsUtils'
import * as F  from '../../lib/formClasses'
import * as Lc from '../../lib/listClasses'

const props = defineProps<{ autorisation: AutorisationDepart }>()
const emit  = defineEmits<{ close: []; navigate: [id: string] }>()

const store = useFlotteStore()
const auth  = useAuthStore()

const item = computed(() =>
  store.autorisations.find(a => a.id === props.autorisation.id) ?? props.autorisation)

const nbConformes = computed(() => item.value.controles.filter(c => c.conforme).length)
const peutPartir  = computed(() => store.peutPartir(item.value))

const statutLabel = computed(() =>
  !item.value.decideLe ? 'En attente' : item.value.accordee ? 'Accordée' : 'Refusée')

const statutCls = computed(() =>
  !item.value.decideLe ? 'bg-warning-bg text-warning'
    : item.value.accordee ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger')

const motif = ref('')

function decider(accordee: boolean) {
  store.decider(item.value.id, accordee, auth.user?.name ?? 'Control Room', motif.value)
  motif.value = ''
}

/* ── Checklist avant départ (US 2.4.1 / retour client 02/09/2026) ── */
const checklistOuverte = ref(false)
const releveDepart = computed(() => store.checklistDepartDe(item.value))

/** Tout coché par défaut - le chauffeur décoche ce qui est en anomalie. */
const saisieChecklist = reactive<Record<string, boolean>>(
  Object.fromEntries(POINTS_CHECKLIST_ROUTE.map(p => [p.code, true])))

function validerChecklistDepart() {
  const resultats: Record<string, ResultatPoint> = {}
  POINTS_CHECKLIST_ROUTE.forEach(p => {
    resultats[p.code] = saisieChecklist[p.code] ? 'conforme' : 'anomalie'
  })
  store.saisirChecklistDepart(item.value.id, resultats)
}

const liste = computed(() =>
  [...store.autorisations].sort((a, b) => +new Date(b.demandeeLe) - +new Date(a.demandeeLe)))
const indexCourant = computed(() => liste.value.findIndex(a => a.id === item.value.id))
const sidebarItems = computed(() =>
  liste.value.map(a => ({ no: a.id, label: `${a.reference} · ${a.vehiculePlaque}` })))

function naviguer(d: number) {
  const a = liste.value[indexCourant.value + d]
  if (a) emit('navigate', a.id)
}
</script>