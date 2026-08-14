<template>
  <CardModalShell
    page-title="Ordre de travail"
    :page-number="item.reference"
    banner-label="Flotte · Maintenance"
    :sidebar-items="sidebarItems"
    :current-no="item.id"
    :has-prev="indexCourant > 0"
    :has-next="indexCourant < ordresOrdonnes.length - 1"
    :is-edit-mode="false"
    :show-edit="false"
    :status-label="LIB_STATUT_OT[item.statut]"
    @close="emit('close')"
    @go-prev="naviguer(-1)"
    @go-next="naviguer(1)"
    @select-sidebar="(id: string) => emit('navigate', id)"
  >
    <template #title-badges>
      <span class="px-2.5 py-0.5 rounded-full text-xs font-medium" :class="LIB_GRAVITE_OT[item.gravite].cls">
        {{ LIB_GRAVITE_OT[item.gravite].label }}
      </span>
      <span class="px-2.5 py-0.5 rounded-full text-xs font-medium"
        :class="item.typeMaintenance === 'preventif' ? 'bg-success-bg text-success' : 'bg-info-bg text-info'">
        {{ LIB_TYPE_MAINTENANCE[item.typeMaintenance] }}
      </span>
    </template>

    <template #form>
      <div class="flex-1 overflow-y-auto px-8 py-6 max-w-3xl mx-auto">

        <!-- ═══════════════════════════════════════════════════
             1. DÉCLARATION - US 3.2.1
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Déclaration"
          :recaps="[item.reference, item.vehiculePlaque, LIB_ORIGINE_OT[item.origine]]"
        >
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Référence</label>
              <span class="text-sm font-mono font-semibold text-foreground">{{ item.reference }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Véhicule</label>
              <button class="text-sm font-mono text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer text-left w-fit"
                title="Ouvrir la fiche du véhicule"
                @click="emit('voir-vehicule', item.vehiculeId)">
                {{ item.vehiculePlaque }}
              </button>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Origine de la déclaration</label>
              <span class="text-sm text-foreground">{{ LIB_ORIGINE_OT[item.origine] }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Déclaré par</label>
              <span class="text-sm text-foreground">{{ item.declarePar }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Déclaré le</label>
              <span class="text-sm text-foreground">{{ fmtDateTime(item.declareLe) }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Kilométrage</label>
              <span class="text-sm text-foreground">
                {{ item.kilometrage ? item.kilometrage.toLocaleString('fr-FR') + ' km' : '-' }}
              </span>
            </div>
          </div>

          <div class="flex flex-col gap-1 mt-4">
            <label :class="F.fieldLabel">Symptôme constaté</label>
            <p class="text-sm text-foreground leading-relaxed">{{ item.symptome }}</p>
          </div>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             2. DIAGNOSTIC ISO 14224 - US 3.2.2
             Trois axes normalisés, repris du classeur de GTD.
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Diagnostic ISO 14224"
          :recaps="item.sousSysteme
            ? [LIB_SOUS_SYSTEME[item.sousSysteme], item.modeDefaillance ? LIB_MODE_DEFAILLANCE[item.modeDefaillance] : '']
            : ['à établir']"
          :default-open="true"
        >
          <template v-if="item.sousSysteme">
            <div class="grid grid-cols-3 gap-x-6 gap-y-4 max-sm:grid-cols-1">
              <div class="flex flex-col gap-1">
                <label :class="F.fieldLabel">Sous-système</label>
                <span class="text-sm font-medium text-foreground">{{ LIB_SOUS_SYSTEME[item.sousSysteme] }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <label :class="F.fieldLabel">Mode de défaillance</label>
                <span class="text-sm text-foreground">
                  {{ item.modeDefaillance ? LIB_MODE_DEFAILLANCE[item.modeDefaillance] : '-' }}
                </span>
              </div>
              <div class="flex flex-col gap-1">
                <label :class="F.fieldLabel">Cause racine</label>
                <span class="text-sm text-foreground">
                  {{ item.causeRacine ? LIB_CAUSE_RACINE[item.causeRacine] : '-' }}
                </span>
              </div>
            </div>
            <p class="text-[11px] text-muted-foreground mt-3">
              Diagnostiqué par {{ item.diagnostiquePar }} le {{ fmtDateTime(item.diagnostiqueLe) }}.
            </p>

            <!-- US 3.2.2 - jusqu'à quatre pannes sur le même véhicule -->
            <template v-if="item.pannes?.length">
              <p class="text-[11px] font-semibold text-foreground mt-4 mb-1.5">
                Pannes additionnelles relevées
              </p>
              <div v-for="pa in item.pannes" :key="pa.id"
                class="rounded-md border border-border px-3 py-2 mb-1.5">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="text-xs font-medium text-foreground">
                      {{ LIB_SOUS_SYSTEME[pa.sousSysteme] }} - {{ LIB_MODE_DEFAILLANCE[pa.modeDefaillance] }}
                    </p>
                    <p class="text-[11px] text-muted-foreground">{{ LIB_CAUSE_RACINE[pa.causeRacine] }}</p>
                  </div>
                  <span class="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                    :class="LIB_GRAVITE_OT[pa.gravite].cls">
                    {{ LIB_GRAVITE_OT[pa.gravite].label }}
                  </span>
                </div>
              </div>
            </template>

            <button v-if="peutAjouterPanne" :class="Lc.btnOutline" class="mt-2.5"
              @click="ajoutPanneOuvert = !ajoutPanneOuvert">
              <Plus class="w-3.5 h-3.5" />
              Ajouter une panne
            </button>
            <p v-else class="text-[11px] text-muted-foreground mt-2">
              Limite de {{ MAX_PANNES_SIMULTANEES }} pannes simultanées atteinte.
            </p>

            <div v-if="ajoutPanneOuvert" class="mt-3 p-3 rounded-lg bg-background border border-border">
              <div class="grid grid-cols-2 gap-3 mb-2.5 max-sm:grid-cols-1">
                <div :class="F.field">
                  <label :class="F.fieldLabel">Sous-système</label>
                  <select v-model="nouvellePanne.sousSysteme" :class="F.fieldSelect">
                    <option value="">Choisir…</option>
                    <option v-for="(lib, k) in LIB_SOUS_SYSTEME" :key="k" :value="k">{{ lib }}</option>
                  </select>
                </div>
                <div :class="F.field">
                  <label :class="F.fieldLabel">Mode de défaillance</label>
                  <select v-model="nouvellePanne.modeDefaillance" :class="F.fieldSelect">
                    <option value="">Choisir…</option>
                    <option v-for="(lib, k) in LIB_MODE_DEFAILLANCE" :key="k" :value="k">{{ lib }}</option>
                  </select>
                </div>
                <div :class="F.field">
                  <label :class="F.fieldLabel">Cause racine</label>
                  <select v-model="nouvellePanne.causeRacine" :class="F.fieldSelect">
                    <option value="">Choisir…</option>
                    <option v-for="(lib, k) in LIB_CAUSE_RACINE" :key="k" :value="k">{{ lib }}</option>
                  </select>
                </div>
                <div :class="F.field">
                  <label :class="F.fieldLabel">Gravité</label>
                  <select v-model="nouvellePanne.gravite" :class="F.fieldSelect">
                    <option value="mineure">Mineure</option>
                    <option value="majeure">Majeure</option>
                    <option value="critique">Critique</option>
                  </select>
                </div>
              </div>
              <button :class="Lc.btnPrimary" :disabled="!panneComplete" @click="ajouterPanne">
                Enregistrer cette panne
              </button>
            </div>
          </template>

          <!-- Saisie du diagnostic -->
          <template v-else>
            <div class="flex items-start gap-2.5 bg-warning-bg text-warning rounded-lg px-3.5 py-2.5 mb-3.5">
              <AlertCircle class="w-4 h-4 shrink-0 mt-px" />
              <p class="text-xs leading-relaxed">
                Le diagnostic remplace la description libre par trois codes normalisés.
                C’est ce qui permet de comparer les pannes entre véhicules et de repérer les récurrences.
              </p>
            </div>

            <div class="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
              <div :class="F.field">
                <label :class="F.fieldLabel">Sous-système <span class="text-danger">*</span></label>
                <select v-model="diag.sousSysteme" :class="F.fieldSelect">
                  <option value="">Choisir…</option>
                  <option v-for="(lib, k) in LIB_SOUS_SYSTEME" :key="k" :value="k">{{ lib }}</option>
                </select>
              </div>
              <div :class="F.field">
                <label :class="F.fieldLabel">Mode de défaillance <span class="text-danger">*</span></label>
                <select v-model="diag.modeDefaillance" :class="F.fieldSelect">
                  <option value="">Choisir…</option>
                  <option v-for="(lib, k) in LIB_MODE_DEFAILLANCE" :key="k" :value="k">{{ lib }}</option>
                </select>
              </div>
              <div :class="F.field">
                <label :class="F.fieldLabel">Cause racine <span class="text-danger">*</span></label>
                <select v-model="diag.causeRacine" :class="F.fieldSelect">
                  <option value="">Choisir…</option>
                  <option v-for="(lib, k) in LIB_CAUSE_RACINE" :key="k" :value="k">{{ lib }}</option>
                </select>
              </div>
            </div>

            <button :class="Lc.btnPrimary" class="mt-2.5" :disabled="!diagComplet" @click="enregistrerDiagnostic">
              Enregistrer le diagnostic
            </button>
          </template>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             3. PIÈCES ET ACHATS - US 3.2.3
             La chaîne intervention → achat → réception → imputation.
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Pièces et achats"
          :recaps="[`${item.pieces.length} pièce(s)`, fmtAr(coutPieces)]"
        >
          <div v-if="!item.pieces.length" class="text-xs text-muted-foreground py-2">
            Aucune pièce imputée à cette intervention.
          </div>

          <table v-else class="w-full border-collapse">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Référence</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Désignation</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Qté</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Prix unitaire</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Origine</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in item.pieces" :key="p.id" class="border-b border-border/60">
                <td class="py-2 text-xs font-mono">{{ p.reference }}</td>
                <td class="py-2 text-xs">{{ p.designation }}</td>
                <td class="py-2 text-xs">{{ p.quantite }}</td>
                <td class="py-2 text-xs">{{ fmtAr(p.prixUnitaireAr) }}</td>
                <td class="py-2">
                  <span class="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    :class="p.origine === 'stock' ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'">
                    {{ p.origine === 'stock' ? 'Sortie de stock' : 'Achat' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Demandes d'achat rattachées : le lien que le client désigne comme urgence -->
          <template v-if="demandes.length">
            <p class="text-[11px] font-semibold text-foreground mt-4 mb-1.5">Demandes d’achat rattachées</p>
            <div v-for="d in demandes" :key="d.id"
              class="rounded-md border border-border px-3 py-2.5 mb-1.5">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-xs font-medium text-foreground">{{ d.designation }}</p>
                  <p class="text-[11px] text-muted-foreground">
                    <span class="font-mono">{{ d.reference }}</span>
                    <span v-if="d.fournisseur"> · {{ d.fournisseur }}</span>
                    <span v-if="d.numeroBonCommande"> · BC {{ d.numeroBonCommande }}</span>
                  </p>
                </div>
                <span class="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 bg-info-bg text-info">
                  {{ LIB_STATUT_ACHAT[d.statut] }}
                </span>
              </div>
              <p class="text-[11px] text-muted-foreground mt-1">
                Demandée le {{ fmtDate(d.dateDemande) }}
                <span v-if="d.dateCommande"> · commandée le {{ fmtDate(d.dateCommande) }}</span>
                <span v-if="d.dateReception"> · reçue le {{ fmtDate(d.dateReception) }}</span>
                <span v-else class="text-warning"> · en attente de réception</span>
              </p>
            </div>
          </template>

          <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Toute pièce sortie du stock est imputée à cette intervention. Le délai d’attente d’une
            pièce achetée est isolé du temps de réparation, afin de ne pas fausser le MTTR.
          </p>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             4. RÉALISATION
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Réalisation"
          :recaps="[item.prestataire ? 'sous-traité' : `${heures} h`, LIB_STATUT_OT[item.statut]]"
        >
          <!-- Sous-traitance - US 3.2.5 -->
          <template v-if="item.prestataire">
            <div class="grid grid-cols-3 gap-x-6 gap-y-4 max-sm:grid-cols-1 mb-3">
              <div class="flex flex-col gap-1">
                <label :class="F.fieldLabel">Prestataire</label>
                <span class="text-sm text-foreground">{{ item.prestataire }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <label :class="F.fieldLabel">Devis accepté</label>
                <span class="text-sm text-foreground">{{ item.montantDevisAr ? fmtAr(item.montantDevisAr) : '-' }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <label :class="F.fieldLabel">Garantie constructeur</label>
                <span class="text-sm" :class="item.sousGarantie ? 'text-success font-medium' : 'text-foreground'">
                  {{ item.sousGarantie ? 'Oui - non facturé' : 'Non' }}
                </span>
              </div>
            </div>
          </template>

          <!-- Main-d'œuvre interne -->
          <template v-else>
            <div v-if="!item.temps.length" class="text-xs text-muted-foreground py-2">
              Aucun temps consigné.
            </div>
            <table v-else class="w-full border-collapse mb-3">
              <thead>
                <tr class="border-b border-border">
                  <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Mécanicien</th>
                  <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Date</th>
                  <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Heures</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in item.temps" :key="t.id" class="border-b border-border/60">
                  <td class="py-2 text-xs">{{ t.mecanicienNom }}</td>
                  <td class="py-2 text-xs">{{ fmtDate(t.date) }}</td>
                  <td class="py-2 text-xs font-medium">{{ t.heures }} h</td>
                </tr>
              </tbody>
            </table>
          </template>

          <div v-if="item.travauxRealises" class="flex flex-col gap-1">
            <label :class="F.fieldLabel">Travaux réalisés</label>
            <p class="text-sm text-foreground leading-relaxed">{{ item.travauxRealises }}</p>
          </div>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             5. CLÔTURE ET COÛT - US 3.2.4
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Clôture et coût"
          :recaps="[item.statut === 'cloture' ? 'clôturé' : 'en cours', fmtAr(coutTotal)]"
          :default-open="item.statut !== 'cloture'"
        >
          <div class="grid grid-cols-3 gap-3 mb-4 max-sm:grid-cols-2">
            <div>
              <label :class="F.fieldLabel">Coût des pièces</label>
              <p class="text-lg font-bold text-foreground">{{ fmtAr(coutPieces) }}</p>
            </div>
            <div>
              <label :class="F.fieldLabel">Sous-traitance</label>
              <p class="text-lg font-bold text-foreground">
                {{ item.prestataire && !item.sousGarantie ? fmtAr(item.montantDevisAr ?? 0) : '-' }}
              </p>
            </div>
            <div>
              <label :class="F.fieldLabel">Immobilisation</label>
              <p class="text-lg font-bold" :class="joursImmo > 3 ? 'text-danger' : 'text-foreground'">
                {{ joursImmo }} j
              </p>
            </div>
          </div>

          <!-- Le tarif horaire n'a pas été communiqué : on le signale plutôt que d'inventer -->
          <!-- <div class="flex items-start gap-2.5 bg-background border border-border rounded-lg px-3.5 py-2.5 mb-3">
            <FileQuestion class="w-4 h-4 shrink-0 mt-px text-muted-foreground" />
            <p class="text-[11px] text-muted-foreground leading-relaxed">
              La main-d’œuvre interne n’est pas valorisée : le tarif horaire de l’atelier n’a pas été
              communiqué par GTD. Le coût affiché couvre les pièces et la sous-traitance.
            </p>
          </div> -->

          <template v-if="item.statut === 'cloture'">
            <p class="text-[11px] text-muted-foreground">
              Clôturé par {{ item.cloturePar }} le {{ fmtDateTime(item.clotureLe) }}.
              Le véhicule a été remis en service à cette date.
            </p>
          </template>

          <!-- US 3.2.4 - validation hiérarchique avant clôture définitive -->
          <template v-else-if="item.statut === 'attente_validation'">
            <div class="flex items-start gap-2.5 bg-warning-bg text-warning rounded-lg px-3.5 py-2.5 mb-3">
              <ShieldCheck class="w-4 h-4 shrink-0 mt-px" />
              <p class="text-xs leading-relaxed">
                Les travaux sont décrits et le diagnostic est complet. La clôture définitive exige
                la <strong>validation du responsable maintenance</strong>. Le véhicule reste
                immobilisé jusque-là.
              </p>
            </div>
            <button :class="Lc.btnPrimary" @click="valider">
              Valider et remettre en service
            </button>
          </template>

          <template v-else>
            <div :class="F.field" class="mb-2.5">
              <label :class="F.fieldLabel">Travaux réalisés <span class="text-danger">*</span></label>
              <textarea v-model="travaux" rows="3" :class="F.fieldTextarea"
                placeholder="Description des travaux effectués…" />
            </div>

            <div v-if="!diagnosticComplet"
              class="flex items-start gap-2.5 bg-danger-bg text-danger rounded-lg px-3.5 py-2.5 mb-2.5">
              <AlertCircle class="w-4 h-4 shrink-0 mt-px" />
              <p class="text-xs leading-relaxed">
                La clôture exige un diagnostic complet - sous-système, mode de défaillance et cause racine.
              </p>
            </div>

            <button :class="Lc.btnPrimary" :disabled="!peutCloturer" @click="cloturer">
              Soumettre à validation
            </button>
          </template>
        </FormSection>

      </div>
    </template>
  </CardModalShell>
</template>

<script setup lang="ts">
/**
 * Fiche d'un ordre de travail.
 * Même coquille et même langage visuel que la fiche véhicule.
 */
import { ref, reactive, computed } from 'vue'
import { AlertCircle, FileQuestion, ShieldCheck, Plus } from 'lucide-vue-next'
import CardModalShell from '../shared/CardModalShell.vue'
import FormSection    from '../ui/form-field/FormSection.vue'
import { useMaintenanceStore } from '../../stores/maintenance'
import { useAuthStore } from '../../stores/auth'
import {
  LIB_SOUS_SYSTEME, LIB_MODE_DEFAILLANCE, LIB_CAUSE_RACINE,
  LIB_STATUT_OT, LIB_ORIGINE_OT, LIB_TYPE_MAINTENANCE,
  LIB_GRAVITE_OT, LIB_STATUT_ACHAT, MAX_PANNES_SIMULTANEES,
} from '../../types/maintenance'
import type {
  OrdreTravail, SousSysteme, ModeDefaillance, CauseRacine, GraviteOT,
} from '../../types/maintenance'
import { fmtAr, fmtDate, fmtDateTime } from '../../lib/fmsUtils'
import * as F  from '../../lib/formClasses'
import * as Lc from '../../lib/listClasses'

const props = defineProps<{ ordre: OrdreTravail }>()
const emit  = defineEmits<{
  close: []
  navigate: [id: string]
  'voir-vehicule': [id: string]
}>()

const store = useMaintenanceStore()
const auth  = useAuthStore()

const item = computed(() => store.getById(props.ordre.id) ?? props.ordre)

const demandes   = computed(() => store.demandesDeLOT(item.value.id))
const coutPieces = computed(() =>
  item.value.pieces.reduce((s, p) => s + p.quantite * p.prixUnitaireAr, 0))
const coutTotal  = computed(() => store.coutOT(item.value))
const heures     = computed(() => store.heuresOT(item.value))

/** Jours d'immobilisation liés à cet ordre de travail. */
const joursImmo = computed(() => {
  const ind = store.indisponibilites.find(i => i.ordreTravailId === item.value.id)
  return ind ? store.dureeIndispo(ind) : 0
})

/* ── Diagnostic ───────────────────────────────────────────── */
const diag = reactive({
  sousSysteme: '' as SousSysteme | '',
  modeDefaillance: '' as ModeDefaillance | '',
  causeRacine: '' as CauseRacine | '',
})

const diagComplet = computed(() =>
  !!diag.sousSysteme && !!diag.modeDefaillance && !!diag.causeRacine)

function enregistrerDiagnostic() {
  if (!diagComplet.value) return
  store.diagnostiquer(item.value.id, {
    sousSysteme: diag.sousSysteme as SousSysteme,
    modeDefaillance: diag.modeDefaillance as ModeDefaillance,
    causeRacine: diag.causeRacine as CauseRacine,
  }, auth.user?.name ?? 'Atelier')
}

/* ── US 3.2.2 - Pannes additionnelles sur le même véhicule ── */
const ajoutPanneOuvert = ref(false)

const nouvellePanne = reactive({
  sousSysteme: '' as SousSysteme | '',
  modeDefaillance: '' as ModeDefaillance | '',
  causeRacine: '' as CauseRacine | '',
  gravite: 'majeure' as GraviteOT,
})

const panneComplete = computed(() =>
  !!nouvellePanne.sousSysteme && !!nouvellePanne.modeDefaillance && !!nouvellePanne.causeRacine)

/** Le diagnostic principal compte pour une panne : la limite est donc de 4 au total. */
const peutAjouterPanne = computed(() =>
  (item.value.pannes?.length ?? 0) < MAX_PANNES_SIMULTANEES - 1)

function ajouterPanne() {
  if (!panneComplete.value) return
  store.ajouterPanne(item.value.id, {
    sousSysteme: nouvellePanne.sousSysteme as SousSysteme,
    modeDefaillance: nouvellePanne.modeDefaillance as ModeDefaillance,
    causeRacine: nouvellePanne.causeRacine as CauseRacine,
    gravite: nouvellePanne.gravite,
  })
  nouvellePanne.sousSysteme = ''
  nouvellePanne.modeDefaillance = ''
  nouvellePanne.causeRacine = ''
  ajoutPanneOuvert.value = false
}

/* ── US 3.2.4 - Validation hiérarchique ───────────────────── */
function valider() {
  store.validerCloture(item.value.id, auth.user?.name ?? 'Responsable', 'responsable maintenance')
}

/* ── Clôture ──────────────────────────────────────────────── */
const travaux = ref('')

const diagnosticComplet = computed(() =>
  !!item.value.sousSysteme && !!item.value.modeDefaillance && !!item.value.causeRacine)

const peutCloturer = computed(() => diagnosticComplet.value && !!travaux.value.trim())

function cloturer() {
  if (!peutCloturer.value) return
  store.cloturer(item.value.id, travaux.value, auth.user?.name ?? 'Atelier')
  travaux.value = ''
}

/* ── Navigation d'un ordre à l'autre ──────────────────────── */
const ordresOrdonnes = computed(() =>
  [...store.ordres].sort((a, b) => +new Date(b.declareLe) - +new Date(a.declareLe)))

const indexCourant = computed(() =>
  ordresOrdonnes.value.findIndex(o => o.id === item.value.id))

const sidebarItems = computed(() =>
  ordresOrdonnes.value.map(o => ({ no: o.id, label: `${o.reference} · ${o.vehiculePlaque}` })))

function naviguer(delta: number) {
  const cible = ordresOrdonnes.value[indexCourant.value + delta]
  if (cible) emit('navigate', cible.id)
}
</script>
