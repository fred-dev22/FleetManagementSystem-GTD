<template>
  <div class="fixed inset-0 z-[1000] flex items-start justify-center bg-black/40 overflow-y-auto py-8"
    @click.self="emit('close')">
    <div class="bg-card rounded-xl shadow-xl w-full max-w-[820px] mx-4 flex flex-col">

      <div class="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div>
          <h2 class="text-base font-semibold text-foreground">Déclarer une panne</h2>
          <p class="text-[11px] text-muted-foreground">
            L’ouverture de l’ordre de travail immobilise automatiquement le véhicule.
          </p>
        </div>
        <button :class="L.tbIconBtn" @click="emit('close')"><X class="w-4 h-4" /></button>
      </div>

      <div class="px-5 py-4 flex flex-col gap-4">

        <!-- ═══ Champs obligatoires - US 3.2.1 ═══ -->
        <div class="grid grid-cols-2 gap-x-5 gap-y-3 max-sm:grid-cols-1">
          <div :class="F.field">
            <label :class="F.fieldLabel">Véhicule <span class="text-danger">*</span></label>
            <SearchableDropdown
              v-model="form.vehiculeId"
              :items="optVehicules"
              placeholder="Choisir un véhicule…"
            />
          </div>

          <div :class="F.field">
            <label :class="F.fieldLabel">Date de constat <span class="text-danger">*</span></label>
            <input v-model="form.date" type="datetime-local" :class="F.fieldInput" />
          </div>

          <div :class="F.field">
            <label :class="F.fieldLabel">Origine de la déclaration <span class="text-danger">*</span></label>
            <SearchableDropdown
              v-model="form.origine"
              :items="optOrigines"
              placeholder="Origine…"
            />
          </div>

          <div :class="F.field">
            <label :class="F.fieldLabel">Déclaré par <span class="text-danger">*</span></label>
            <input v-model="form.declarePar" :class="F.fieldInput" placeholder="Nom de la personne" />
          </div>

          <div :class="F.field">
            <label :class="F.fieldLabel">Organe concerné <span class="text-danger">*</span></label>
            <SearchableDropdown
              v-model="form.sousSysteme"
              :items="optSousSystemes"
              placeholder="Choisir un sous-système…"
            />
          </div>

          <div :class="F.field">
            <label :class="F.fieldLabel">Gravité <span class="text-danger">*</span></label>
            <SearchableDropdown
              v-model="form.gravite"
              :items="optform_gravite"
              placeholder="Sélectionner…"
            />
          </div>

          <div :class="F.field">
            <label :class="F.fieldLabel">Type de maintenance</label>
            <SearchableDropdown
              v-model="form.typeMaintenance"
              :items="optform_typeMaintenance"
              placeholder="Sélectionner…"
            />
          </div>

          <div :class="F.field">
            <label :class="F.fieldLabel">Kilométrage <span :class="F.fieldOptional">- au constat</span></label>
            <input v-model.number="form.kilometrage" type="number" min="0" :class="F.fieldInput"
              :placeholder="kmVehicule ? String(kmVehicule) : ''" />
          </div>
        </div>

        <div :class="F.field">
          <label :class="F.fieldLabel">Symptôme constaté <span class="text-danger">*</span></label>
          <textarea v-model="form.symptome" rows="3" :class="F.fieldTextarea"
            placeholder="Ce qui a été observé : bruit, fuite, voyant, comportement anormal…" />
          <p class="text-[11px] text-muted-foreground mt-1">
            Décrire le constat, pas la cause. Le diagnostic codifié se fait ensuite dans la fiche.
          </p>
        </div>

        <!-- Affectation des mécaniciens -->
        <div :class="F.field">
          <label :class="F.fieldLabel">
            Mécanicien(s) affecté(s)
            <span :class="F.fieldOptional">- peut être renseigné plus tard</span>
          </label>
          <div class="flex flex-wrap gap-1.5">
            <button v-for="m in MECANICIENS" :key="m"
              class="text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer"
              :class="form.mecaniciens.includes(m)
                ? 'bg-primary text-white border-primary'
                : 'bg-transparent text-muted-foreground border-border hover:border-primary'"
              @click="basculerMecanicien(m)">
              {{ m }}
            </button>
          </div>

        </div>

        <!-- Conséquence annoncée avant enregistrement -->
        <div v-if="form.vehiculeId" class="flex items-start gap-2.5 bg-warning-bg text-warning rounded-lg px-3.5 py-2.5">
          <AlertCircle class="w-4 h-4 shrink-0 mt-px" />
          <p class="text-xs leading-relaxed">
            À l’enregistrement, <strong>{{ plaqueChoisie }}</strong> passera en immobilisation avec le code
            <strong class="font-mono">{{ form.typeMaintenance === 'preventif' ? 'MTN' : 'PNN' }}</strong>.
            Il disparaîtra des véhicules affectables jusqu’à la clôture de l’intervention.
          </p>
        </div>
      </div>

      <div class="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-border">
        <span class="text-[11px] text-muted-foreground">
          {{ manquants.length ? `${manquants.length} champ(s) obligatoire(s) à renseigner` : 'Prêt à enregistrer' }}
        </span>
        <div class="flex items-center gap-2 shrink-0">
          <button :class="L.btnOutline" @click="emit('close')">Annuler</button>
          <button :class="L.btnPrimary" :disabled="!!manquants.length" @click="enregistrer">
            Créer l’ordre de travail
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * US 3.2.1 - Déclarer une panne et créer un ordre de travail.
 *
 * Les champs obligatoires sont ceux de la user story : date, véhicule,
 * organe concerné, symptôme, gravité, origine de la déclaration.
 * L'ouverture bascule le véhicule en indisponibilité avec le code
 * correspondant - MTN pour un préventif, PNN pour un correctif.
 */
import SearchableDropdown from '../ui/SearchableDropdown.vue'
import type { DropdownItem } from '../ui/SearchableDropdown.vue'
import { optionsDeLibelles, optionsDEntites } from '../../lib/dropdownItems'
import { ref, reactive, computed } from 'vue'
import { X, AlertCircle } from 'lucide-vue-next'
import { useMaintenanceStore } from '../../stores/maintenance'
import { useVehiculesStore } from '../../stores/vehicules'
import { useAuthStore } from '../../stores/auth'
import { LIB_ORIGINE_OT, LIB_SOUS_SYSTEME } from '../../types/maintenance'
import type { OrigineOT, SousSysteme, GraviteOT, TypeMaintenance } from '../../types/maintenance'
import * as L from '../../lib/listClasses'
import * as F from '../../lib/formClasses'

const emit = defineEmits<{ close: []; created: [id: string] }>()

const store     = useMaintenanceStore()
const vehicules = useVehiculesStore()
const auth      = useAuthStore()

/**
 * Mécaniciens connus, déduits des interventions déjà enregistrées.
 * Aucun effectif n'est ajouté : la liste reflète exactement ce qui figure
 * dans les ordres de travail existants.
 */
const MECANICIENS = computed(() => store.mecaniciensConnus)

const form = reactive({
  vehiculeId: '',
  date: new Date().toISOString().slice(0, 16),
  origine: 'constat_garage' as OrigineOT,
  declarePar: auth.user?.name ?? '',
  sousSysteme: '' as SousSysteme | '',
  gravite: 'majeure' as GraviteOT,
  typeMaintenance: 'correctif' as TypeMaintenance,
  symptome: '',
  kilometrage: undefined as number | undefined,
  mecaniciens: [] as string[],
})

const vehiculesDisponibles = computed(() =>
  vehicules.auParc)

const vehiculeChoisi = computed(() =>
  vehicules.vehicules.find(v => v.id === form.vehiculeId))

const plaqueChoisie = computed(() => vehiculeChoisi.value?.plaque ?? '')
const kmVehicule    = computed(() => vehiculeChoisi.value?.kilometrage)

/** Les six champs obligatoires de la user story. */
const manquants = computed(() => {
  const out: string[] = []
  if (!form.vehiculeId)      out.push('véhicule')
  if (!form.date)            out.push('date')
  if (!form.sousSysteme)     out.push('organe concerné')
  if (!form.symptome.trim()) out.push('symptôme')
  if (!form.gravite)         out.push('gravité')
  if (!form.origine)         out.push('origine')
  if (!form.declarePar.trim()) out.push('déclarant')
  return out
})

function basculerMecanicien(m: string) {
  const i = form.mecaniciens.indexOf(m)
  if (i === -1) form.mecaniciens.push(m)
  else form.mecaniciens.splice(i, 1)
}

function enregistrer() {
  if (manquants.value.length) return
  const v = vehiculeChoisi.value
  if (!v) return

  const id = store.creerOT({
    vehiculeId: v.id,
    vehiculePlaque: v.plaque,
    origine: form.origine,
    declarePar: form.declarePar,
    declareLe: new Date(form.date).toISOString(),
    symptome: form.symptome.trim(),
    gravite: form.gravite,
    typeMaintenance: form.typeMaintenance,
    sousSysteme: form.sousSysteme as SousSysteme,
    kilometrage: form.kilometrage ?? v.kilometrage,
  })

  // Les mécaniciens choisis sont affectés à l'ordre créé
  const o = store.getById(id)
  if (o) o.mecaniciens = [...form.mecaniciens]

  emit('created', id)
}

/* Options des listes déroulantes. Le sous-libellé est recherchable :
   taper une marque retrouve le véhicule, sans connaître sa plaque. */
const optVehicules = computed(() => optionsDEntites(vehicules.auParc, v => ({
  id: v.id,
  label: v.plaque,
  sublabel: [v.marque, v.modele].filter(Boolean).join(' '),
})))

const optOrigines     = computed(() => optionsDeLibelles(LIB_ORIGINE_OT))
const optSousSystemes = computed(() => optionsDeLibelles(LIB_SOUS_SYSTEME))

const optform_gravite: DropdownItem[] = [
              { id: 'mineure', label: "Mineure - le véhicule peut rouler" },
              { id: 'majeure', label: "Majeure - intervention rapide requise" },
              { id: 'critique', label: "Critique - immobilisation immédiate" },
]

const optform_typeMaintenance: DropdownItem[] = [
              { id: 'correctif', label: "Correctif - panne constatée" },
              { id: 'preventif', label: "Préventif - entretien planifié" },
              { id: 'ameliorative', label: "Améliorative - modification" },
]
</script>
