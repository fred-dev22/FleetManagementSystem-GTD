<template>
  <CardModalShell
    :page-title="vehicule.typeVehicule === 'tracteur' ? 'Fiche tracteur' : 'Fiche remorque'"
    :page-number="vehicule.id"
    banner-label="Flotte · Véhicules"
    :sidebar-items="[{ no: vehicule.id, label: vehicule.plaque }]"
    :current-no="vehicule.id"
    :has-prev="false"
    :has-next="false"
    :is-edit-mode="isEditMode"
    :is-saving="saving"
    :has-unsaved-changes="isDirty"
    :show-edit="true"
    @close="emit('close')"
    @edit="isEditMode = true"
    @save="handleSave"
    @cancel="handleCancel"
  >
    <template #form>
      <div class="flex-1 overflow-y-auto px-8 py-6 max-w-3xl mx-auto">

        <!-- Badge statut -->
        <div class="flex items-center gap-2 mb-6">
          <span :class="item.typeVehicule === 'tracteur' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'"
            class="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">
            {{ vehicule.typeVehicule }}
          </span>
          <span :class="statutClass(vehicule.statutAdmin)" class="px-2.5 py-0.5 rounded-full text-xs font-medium">
            {{ statutLabel(vehicule.statutAdmin) }}
          </span>
        </div>

        <FormSection title="Identification" :recaps="[vehicule.plaque, `${vehicule.marque ?? ''} ${vehicule.modele ?? ''}`.trim()]">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Plaque</label>
              <input v-if="isEditMode" v-model="form.plaque" :class="cls.fieldInput" />
              <span v-else class="text-sm font-mono font-semibold text-foreground">{{ vehicule.plaque }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">VIN</label>
              <input v-if="isEditMode" v-model="form.vin" :class="cls.fieldInput" />
              <span v-else class="text-xs font-mono text-gray-600">{{ vehicule.vin ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Marque</label>
              <input v-if="isEditMode" v-model="form.marque" :class="cls.fieldInput" />
              <span v-else class="text-sm text-foreground">{{ vehicule.marque ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Modèle</label>
              <input v-if="isEditMode" v-model="form.modele" :class="cls.fieldInput" />
              <span v-else class="text-sm text-foreground">{{ vehicule.modele ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Année</label>
              <input v-if="isEditMode" v-model.number="form.annee" type="number" :class="cls.fieldInput" />
              <span v-else class="text-sm text-foreground">{{ vehicule.annee ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Mise en circulation</label>
              <input v-if="isEditMode" v-model="form.dateMiseEnCirculation" type="date" :class="cls.fieldInput" />
              <span v-else class="text-sm text-foreground">{{ fmtDate(vehicule.dateMiseEnCirculation) }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Site d'affectation</label>
              <input v-if="isEditMode" v-model="form.siteAffectation" :class="cls.fieldInput" />
              <span v-else class="text-sm text-foreground">{{ vehicule.siteAffectation ?? '-' }}</span>
            </div>
          </div>
        </FormSection>

        <!-- Tracteur uniquement -->
        <FormSection v-if="vehicule.typeVehicule === 'tracteur'" title="Moteur & Carburant">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4">
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Type de carburant</label>
              <select v-if="isEditMode" v-model="form.typeCarburant" :class="cls.fieldInput">
                <option value="">-</option>
                <option v-for="c in ['Diesel','GNL','Essence','Électrique','Hybride']" :key="c" :value="c">{{ c }}</option>
              </select>
              <span v-else class="text-sm text-foreground">{{ vehicule.typeCarburant ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Kilométrage</label>
              <span class="text-sm text-foreground">{{ vehicule.kilometrage != null ? vehicule.kilometrage.toLocaleString('fr-FR') + ' km' : '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Niveau carburant</label>
              <div v-if="vehicule.niveauCarburant != null" class="flex items-center gap-3 mt-1">
                <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full"
                    :style="{ width: vehicule.niveauCarburant + '%' }"
                    :class="vehicule.niveauCarburant < 20 ? 'bg-danger' : vehicule.niveauCarburant < 40 ? 'bg-warning' : 'bg-success'" />
                </div>
                <span class="text-sm font-semibold">{{ vehicule.niveauCarburant }}%</span>
              </div>
              <span v-else class="text-sm text-gray-400">-</span>
            </div>
          </div>
        </FormSection>

        <!-- Remorque uniquement -->
        <FormSection v-if="vehicule.typeVehicule === 'remorque'" title="Remorque">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4">
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Type de remorque</label>
              <select v-if="isEditMode" v-model="form.typeRemorque" :class="cls.fieldInput">
                <option v-for="t in ['Citerne','Bâchée','Frigorifique','Plateau','Autre']" :key="t" :value="t">{{ t }}</option>
              </select>
              <span v-else class="text-sm text-foreground">{{ vehicule.typeRemorque ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Capacité</label>
              <input v-if="isEditMode" v-model="form.capacite" :class="cls.fieldInput" />
              <span v-else class="text-sm text-foreground">{{ vehicule.capacite ?? '-' }}</span>
            </div>
          </div>
        </FormSection>

        <FormSection title="Statut & Liaisons">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4">
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Statut administratif</label>
              <select v-if="isEditMode" v-model="form.statutAdmin" :class="cls.fieldInput">
                <option value="actif">Actif</option>
                <option value="affecte">Affecté</option>
                <option value="en_reparation">En réparation</option>
                <option value="hors_service">Hors service</option>
                <option value="vendu">Vendu</option>
                <option value="archive">Archivé</option>
              </select>
              <span v-else>
                <span :class="statutClass(vehicule.statutAdmin)" class="text-xs font-medium px-2 py-0.5 rounded-full">
                  {{ statutLabel(vehicule.statutAdmin) }}
                </span>
              </span>
            </div>
            <div v-if="vehicule.typeVehicule === 'tracteur'" class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Statut opérationnel</label>
              <span>
                <span :class="opClass(vehicule.statutOp)" class="text-xs font-medium px-2 py-0.5 rounded-full">
                  {{ opLabel(vehicule.statutOp) }}
                </span>
              </span>
            </div>
            <div v-if="vehicule.chauffeurNom" class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Chauffeur affecté</label>
              <span class="text-sm text-foreground">{{ vehicule.chauffeurNom }}</span>
            </div>
            <div v-if="vehicule.vehiculeLiePlaque" class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">{{ vehicule.typeVehicule === 'tracteur' ? 'Remorque attelée' : 'Tracteur tracteur' }}</label>
              <span class="font-mono text-sm text-primary font-semibold">{{ vehicule.vehiculeLiePlaque }}</span>
            </div>
          </div>
        </FormSection>

        <FormSection title="Acquisition">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4">
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Mode d'acquisition</label>
              <select v-if="isEditMode" v-model="form.modeAcquisition" :class="cls.fieldInput">
                <option value="">-</option>
                <option value="achat">Achat</option>
                <option value="leasing">Leasing</option>
                <option value="location">Location</option>
              </select>
              <span v-else class="text-sm capitalize text-foreground">{{ vehicule.modeAcquisition ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Coût d'acquisition (MGA)</label>
              <input v-if="isEditMode" v-model.number="form.coutAcquisition" type="number" :class="cls.fieldInput" />
              <span v-else class="text-sm text-foreground">{{ fmtMGA(vehicule.coutAcquisition) }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.fieldLabel">Valeur résiduelle (MGA)</label>
              <input v-if="isEditMode" v-model.number="form.valeurResiduelle" type="number" :class="cls.fieldInput" />
              <span v-else class="text-sm text-foreground">{{ fmtMGA(vehicule.valeurResiduelle) }}</span>
            </div>
          </div>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             US 2.1.6 — Équipements embarqués
             Cible 100 % au cahier des charges ERP, domaine Technologie.
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Équipements embarqués"
          :recaps="[`${equipements.length} équipement(s)`, equipementsHS ? `${equipementsHS} hors service` : 'tous opérationnels']"
        >
          <div v-if="!equipements.length" class="text-xs text-muted-foreground py-2">
            Aucun équipement enregistré pour ce véhicule.
          </div>
          <table v-else class="w-full border-collapse">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Équipement</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">N° série</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Plateforme</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">État</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in equipements" :key="e.id" class="border-b border-border/60">
                <td class="py-2 text-xs">{{ LIB_EQUIPEMENT[e.type] }}</td>
                <td class="py-2 text-[11px] font-mono">{{ e.numeroSerie ?? '—' }}</td>
                <td class="py-2 text-[11px] text-muted-foreground">{{ e.plateforme ?? '—' }}</td>
                <td class="py-2">
                  <span class="text-[10px] font-medium px-2 py-0.5 rounded-full" :class="LIB_ETAT_EQUIPEMENT[e.etat].cls">
                    {{ LIB_ETAT_EQUIPEMENT[e.etat].label }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="tentatives.length" class="bg-danger-bg text-danger rounded-md px-3 py-2 mt-3 text-[11px] leading-snug">
            <strong>{{ tentatives.length }} tentative(s) de désactivation détectée(s)</strong> par la télématique.
            <div v-for="(t, i) in tentatives" :key="i" class="mt-1">{{ t.detail }}</div>
          </div>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             US 3.4.2 — Carnet d'entretien
             Toute la vie technique du véhicule en un écran.
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Carnet d'entretien"
          :recaps="[`${ordres.length} intervention(s)`, joursImmobilise ? `${joursImmobilise} j immobilisé` : '']"
          :default-open="false"
        >
          <div v-if="!ordres.length" class="text-xs text-muted-foreground py-2">
            Aucune intervention enregistrée pour ce véhicule.
          </div>
          <template v-else>
            <table class="w-full border-collapse">
              <thead>
                <tr class="border-b border-border">
                  <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Date</th>
                  <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Ordre</th>
                  <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Diagnostic</th>
                  <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Km</th>
                  <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Coût</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="o in ordres" :key="o.id" class="border-b border-border/60">
                  <td class="py-2 text-xs">{{ fmtDate(o.declareLe) }}</td>
                  <td class="py-2 text-[11px] font-mono">{{ o.reference }}</td>
                  <td class="py-2">
                    <span class="text-xs">{{ o.sousSysteme ? LIB_SOUS_SYSTEME[o.sousSysteme] : '—' }}</span>
                    <div v-if="o.modeDefaillance" class="text-[11px] text-muted-foreground">
                      {{ LIB_MODE_DEFAILLANCE[o.modeDefaillance] }}
                    </div>
                  </td>
                  <td class="py-2 text-xs">{{ o.kilometrage ? o.kilometrage.toLocaleString('fr-FR') : '—' }}</td>
                  <td class="py-2 text-xs">{{ maintStore.coutOT(o) ? fmtAr(maintStore.coutOT(o)) : '—' }}</td>
                </tr>
              </tbody>
            </table>

            <div v-if="recurrences.length" class="bg-warning-bg text-warning rounded-md px-3 py-2 mt-3 text-[11px] leading-snug">
              <strong>Récurrence signalée</strong> — {{ recurrences.join(', ') }} : ce sous-système
              a défailli plusieurs fois. Une usure répétée relève souvent d'une maintenance
              insuffisante plutôt que d'un défaut fournisseur.
            </div>
          </template>
        </FormSection>

      </div>
    </template>
  </CardModalShell>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import CardModalShell from '../shared/CardModalShell.vue'
import FormSection    from '../ui/form-field/FormSection.vue'
import { useVehiculesStore } from '../../stores/vehicules'
import { useFlotteStore } from '../../stores/flotte'
import { useMaintenanceStore } from '../../stores/maintenance'
import { LIB_EQUIPEMENT, LIB_ETAT_EQUIPEMENT } from '../../types/flotte'
import { LIB_SOUS_SYSTEME, LIB_MODE_DEFAILLANCE } from '../../types/maintenance'
import { fmtAr } from '../../lib/fmsUtils'
import type { Vehicule, StatutAdminVehicule, StatutOperationnelVehicule } from '../../types'

const props = defineProps<{ vehicule: Vehicule }>()
const emit  = defineEmits<{ close: [] }>()

// Access the vehicule from store reactively
const store      = useVehiculesStore()
const flotteStore = useFlotteStore()
const maintStore  = useMaintenanceStore()
const item  = computed(() => store.getById(props.vehicule.id) ?? props.vehicule)

/* ── US 2.1.6 — Équipements embarqués ─────────────────────── */
const equipements  = computed(() => flotteStore.equipementsDuVehicule(item.value.id))
const equipementsHS = computed(() => equipements.value.filter(e => e.etat !== 'operationnel').length)
const tentatives   = computed(() =>
  equipements.value.flatMap(e => e.tentativeDesactivation ?? []))

/* ── US 3.4.2 — Carnet d'entretien ────────────────────────── */
const ordres = computed(() => maintStore.ordresDuVehicule(item.value.id))

const joursImmobilise = computed(() =>
  maintStore.indisposDuVehicule(item.value.id)
    .reduce((s, i) => s + maintStore.dureeIndispo(i), 0))

/** Sous-systèmes ayant défailli plus d'une fois — signal d'usure répétée. */
const recurrences = computed(() => {
  const acc = new Map<string, number>()
  ordres.value
    .filter(o => o.typeMaintenance === 'correctif' && o.sousSysteme)
    .forEach(o => acc.set(o.sousSysteme!, (acc.get(o.sousSysteme!) ?? 0) + 1))
  return [...acc.entries()]
    .filter(([, n]) => n > 1)
    .map(([k]) => LIB_SOUS_SYSTEME[k as keyof typeof LIB_SOUS_SYSTEME])
})

const isEditMode = ref(false)
const saving     = ref(false)
const form       = reactive({ ...props.vehicule })

const isDirty = computed(() =>
  (Object.keys(form) as (keyof Vehicule)[]).some(k => (form as any)[k] !== (item.value as any)[k])
)

const cls = {
  fieldLabel: 'text-xs font-semibold text-muted-foreground uppercase tracking-wide',
  fieldInput: 'border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-full',
}

function handleSave() {
  saving.value = true
  store.update(props.vehicule.id, { ...form })
  isEditMode.value = false
  saving.value = false
}

function handleCancel() {
  Object.assign(form, item.value)
  isEditMode.value = false
}

function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleDateString('fr-FR') : '-'
}
function fmtMGA(n?: number) {
  return n != null ? n.toLocaleString('fr-FR') + ' MGA' : '-'
}

const STATUT_MAP: Record<StatutAdminVehicule, { label: string; cls: string }> = {
  actif:         { label: 'Actif',          cls: 'bg-success-bg text-success' },
  affecte:       { label: 'Affecté',        cls: 'bg-primary/10 text-primary' },
  en_service:    { label: 'En service',     cls: 'bg-success-bg text-success' },
  en_reparation: { label: 'En réparation',  cls: 'bg-warning-bg text-warning' },
  hors_service:  { label: 'Hors service',   cls: 'bg-danger-bg text-danger'   },
  vendu:         { label: 'Vendu',          cls: 'bg-gray-100 text-gray-500'  },
  archive:       { label: 'Archivé',        cls: 'bg-gray-100 text-gray-400'  },
}
const statutLabel = (s: StatutAdminVehicule) => STATUT_MAP[s]?.label ?? s
const statutClass = (s: StatutAdminVehicule) => STATUT_MAP[s]?.cls ?? ''

const OP_MAP: Partial<Record<StatutOperationnelVehicule, { label: string; cls: string }>> = {
  en_mouvement:    { label: 'En mouvement',    cls: 'bg-success-bg text-success' },
  allume_immobile: { label: 'Allumé·immobile', cls: 'bg-warning-bg text-warning' },
  arrete:          { label: 'Arrêté',          cls: 'bg-gray-100 text-gray-500'  },
  signal_perdu:    { label: 'Signal perdu',    cls: 'bg-danger-bg text-danger'   },
}
const opLabel = (s?: StatutOperationnelVehicule) => s ? (OP_MAP[s]?.label ?? s) : '-'
const opClass  = (s?: StatutOperationnelVehicule) => s ? (OP_MAP[s]?.cls ?? '') : ''
</script>
