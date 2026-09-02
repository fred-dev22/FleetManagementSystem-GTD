<template>
  <div class="px-7 py-6 space-y-6">
    <!-- Header -->
    <div :class="L.pageHeader">
      <div>
        <h1 :class="L.pageTitle">Affectations chauffeurs</h1>
        <p :class="L.pageSub">Gestion des affectations chauffeur ↔ tracteur</p>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div v-for="k in kpis" :key="k.label" class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        <p class="text-xs text-gray-500 font-medium">{{ k.label }}</p>
        <p class="text-2xl font-bold mt-0.5" :class="k.color ?? 'text-gray-800'">{{ k.value }}</p>
      </div>
    </div>

    <!-- Affectations actives -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-2 text-gray-800 font-semibold">
          <UserCheck class="w-5 h-5 text-primary" />
          Affectations actives
        </div>
        <button :class="L.btnPrimary" @click="showForm = true">
          <Plus class="w-4 h-4" />
          Nouvelle affectation
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50">
              <th :class="L.th">Chauffeur</th>
              <th :class="L.th">Tracteur</th>
              <th :class="L.th">Début</th>
              <th :class="L.th">Alerte permis</th>
              <th :class="L.th">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!actives.length">
              <td colspan="5" class="text-center py-8 text-gray-400 text-sm">Aucune affectation active.</td>
            </tr>
            <tr v-for="a in actives" :key="a.id" :class="L.rowHover">
              <td :class="L.td">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    {{ a.chauffeurNom.slice(0, 2).toUpperCase() }}
                  </div>
                  <span class="font-medium text-gray-800">{{ a.chauffeurNom }}</span>
                </div>
              </td>
              <td :class="L.td">
                <span class="font-mono font-semibold text-gray-800">{{ a.tracteurPlaque }}</span>
              </td>
              <td :class="L.td"><span class="text-gray-600 text-sm">{{ formatDate(a.dateDebut) }}</span></td>
              <td :class="L.td">
                <span v-if="getAlertePermis(a.chauffeurId)" class="flex items-center gap-1 text-xs text-danger font-medium">
                  <AlertCircle class="w-3.5 h-3.5" />
                  Permis expiré
                </span>
                <span v-else class="text-xs text-success font-medium">OK</span>
              </td>
              <td :class="L.td">
                <button @click="terminerAff = a; showTerminer = true"
                  class="text-xs text-danger hover:underline">
                  Terminer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Formulaire nouvelle affectation -->
    <div v-if="showForm" class="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div class="px-6 py-4 bg-primary rounded-t-2xl">
        <h2 class="text-white font-semibold">Nouvelle affectation</h2>
      </div>
      <div class="p-6">
        <!-- Alerte blocage -->
        <div v-if="alerteBlockage" class="mb-4 flex items-start gap-2 p-3 bg-danger-bg text-danger rounded-lg text-sm border border-danger/20">
          <AlertCircle class="w-4 h-4 mt-0.5 shrink-0" />
          <span>{{ alerteBlockage }}</span>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label :class="L.fpFieldLabel">Chauffeur *</label>
            <SearchableDropdown
              :model-value="newAff.chauffeurId"
              :items="optionsChauffeurs"
              placeholder="Sélectionner un chauffeur"
              show-avatar compact
              @update:model-value="onChauffeurChange"
            />
          </div>
          <div>
            <label :class="L.fpFieldLabel">Tracteur *</label>
            <SearchableDropdown
              :model-value="newAff.tracteurId"
              :items="optionsTracteurs"
              placeholder="Sélectionner un tracteur"
              compact
              @update:model-value="onTracteurChange"
            />
          </div>
          <div>
            <label :class="L.fpFieldLabel">Date début *</label>
            <input v-model="newAff.dateDebut" type="date" :class="L.fpFieldInput" />
          </div>
        </div>
        <p v-if="submitError" class="flex items-center gap-1.5 text-xs text-danger mt-3">
          <AlertCircle class="w-3.5 h-3.5" /> {{ submitError }}
        </p>
        <div class="flex gap-3 mt-4 justify-end">
          <button :class="L.btnOutline" @click="showForm = false; resetForm()">Annuler</button>
          <button :class="L.btnPrimary" :disabled="!canSubmit || !!alerteBlockage" @click="submitAff">
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
            Affecter
          </button>
        </div>
      </div>
    </div>

    <!-- Historique -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-2 text-gray-800 font-semibold">
        <History class="w-5 h-5 text-gray-400" />
        Historique des affectations
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50">
              <th :class="L.th">Chauffeur</th>
              <th :class="L.th">Tracteur</th>
              <th :class="L.th">Début</th>
              <th :class="L.th">Fin</th>
              <th :class="L.th">Durée</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!historique.length">
              <td colspan="5" class="text-center py-6 text-gray-400 text-sm">Aucun historique.</td>
            </tr>
            <tr v-for="a in historique" :key="a.id" :class="L.rowHover">
              <td :class="L.td"><span class="text-gray-700">{{ a.chauffeurNom }}</span></td>
              <td :class="L.td"><span class="font-mono text-sm text-gray-700">{{ a.tracteurPlaque }}</span></td>
              <td :class="L.td"><span class="text-gray-600 text-sm">{{ formatDate(a.dateDebut) }}</span></td>
              <td :class="L.td"><span class="text-gray-600 text-sm">{{ formatDate(a.dateFin) }}</span></td>
              <td :class="L.td"><span class="text-gray-600 text-sm">{{ duree(a.dateDebut, a.dateFin) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Modal terminer -->
  <Teleport to="body">
    <div v-if="showTerminer" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <h3 class="font-semibold text-gray-800 mb-2">Terminer l'affectation</h3>
        <p class="text-sm text-gray-600 mb-4">Chauffeur : <strong>{{ terminerAff?.chauffeurNom }}</strong></p>
        <div class="mb-4">
          <label :class="L.fpFieldLabel">Date de fin *</label>
          <input v-model="dateFin" type="date" :class="L.fpFieldInput" />
        </div>
        <div class="flex gap-3 justify-end">
          <button :class="L.btnOutline" @click="showTerminer = false">Annuler</button>
          <button :class="L.btnPrimary" :disabled="!dateFin" @click="confirmTerminer">Confirmer</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { UserCheck, Plus, History, AlertCircle, Loader2 } from 'lucide-vue-next'
import SearchableDropdown from '../../components/ui/SearchableDropdown.vue'
import type { DropdownItem } from '../../components/ui/SearchableDropdown.vue'
import { useAffectationsChauffeursStore } from '../../stores/affectationsChauffeurs'
import { useVehiculesStore } from '../../stores/vehicules'
import { useEmployeeStore } from '../../stores/employees'
import { useConduceteursProfilesStore } from '../../stores/conducteursProfiles'
import { useDocumentsVehiculesStore } from '../../stores/documentsVehicules'
import type { AffectationChauffeur } from '../../types'
import * as L from '../../lib/listClasses'

const affStore   = useAffectationsChauffeursStore()
/* Comme pour AttelageView : `stores/vehicules.ts` est la source lue par
   les 16 autres écrans (Véhicules, Voyages, Maintenance, Carte…) - c'est
   elle qu'il faut mettre à jour ici. */
const vehStore   = useVehiculesStore()
const empStore   = useEmployeeStore()
const profStore  = useConduceteursProfilesStore()
const docsStore  = useDocumentsVehiculesStore()

const showForm     = ref(false)
const showTerminer = ref(false)
const loading       = ref(false)
const submitError   = ref('')
const terminerAff  = ref<AffectationChauffeur | null>(null)
const dateFin      = ref('')
const alerteBlockage = ref('')

const newAff = reactive({ chauffeurId: '', chauffeurNom: '', tracteurId: '', tracteurPlaque: '', dateDebut: '' })

const actives    = computed(() => affStore.affectations.filter(a => !a.dateFin))
const historique = computed(() => affStore.affectations.filter(a => !!a.dateFin))

const kpis = computed(() => [
  { label: 'Affectations actives', value: actives.value.length,                                              color: 'text-primary'  },
  { label: 'Tracteurs libres',     value: tracteursLibres.value.length,                                       color: 'text-success'  },
  { label: 'Total historique',     value: historique.value.length,                                            color: 'text-gray-800' },
  { label: 'Alertes permis',       value: actives.value.filter(a => getAlertePermis(a.chauffeurId)).length,   color: 'text-danger'   },
])

const conducteursDisponibles = computed(() => {
  const affectesIds = new Set(actives.value.map(a => a.chauffeurId))
  return (empStore.employees ?? []).filter((e: any) => e.fonction === 'Chauffeur' && e.status === 'actif' && !affectesIds.has(e.id))
})

/* Un tracteur déjà affecté à un chauffeur (`chauffeurId` sur sa fiche) ou
   déjà couvert par une affectation active dans ce registre n'est plus
   proposé - les deux sources doivent rester cohérentes. */
const tracteursLibres = computed(() => {
  const affectesIds = new Set(actives.value.map(a => a.tracteurId))
  return vehStore.getTracteurLibre().filter(t => !affectesIds.has(t.id))
})

/* La plaque identifie le camion, la marque et le modèle le confirment :
   le sous-titre évite d'allonger le libellé et reste cherchable. */
const optionsTracteurs = computed<DropdownItem[]>(() =>
  tracteursLibres.value.map(t => ({
    id: t.id,
    label: t.plaque,
    sublabel: [t.marque, t.modele].filter(Boolean).join(' '),
  })))

const optionsChauffeurs = computed<DropdownItem[]>(() =>
  conducteursDisponibles.value.map(c => ({
    id: c.id,
    label: `${c.lastName ?? ''} ${c.firstName ?? ''}`.trim(),
    sublabel: c.code,
  })))

function onChauffeurChange(id: string) {
  newAff.chauffeurId = id
  const emp = (empStore.employees ?? []).find((e: any) => e.id === id)
  newAff.chauffeurNom = emp ? `${emp.lastName} ${emp.firstName}` : ''
  checkBlockage()
}

function onTracteurChange(id: string) {
  newAff.tracteurId = id
  const t = vehStore.getById(id)
  newAff.tracteurPlaque = t?.plaque ?? ''
  checkBlockage()
}

function checkBlockage() {
  alerteBlockage.value = ''
  if (newAff.chauffeurId) {
    const profil = profStore.getByEmployeId(newAff.chauffeurId)
    if (profil?.dateExpirationPermis && new Date(profil.dateExpirationPermis) < new Date()) {
      alerteBlockage.value = `Blocage : permis de ${newAff.chauffeurNom} expiré (${formatDate(profil.dateExpirationPermis)}).`
      return
    }
    if (profil?.dateExpirationVisiteMedicale && new Date(profil.dateExpirationVisiteMedicale) < new Date()) {
      alerteBlockage.value = `Blocage : visite médicale de ${newAff.chauffeurNom} expirée.`
      return
    }
  }
  /* US 2.7.1 - le contrôle portait sur la seule assurance. Il porte
     désormais sur toutes les pièces réglementaires bloquantes : barémage,
     visite Madauto, certificat APAVE, vetting et contre-visite. Le motif
     nomme la pièce et son code, pour que l'exploitant sache quoi régulariser. */
  if (newAff.tracteurId) {
    const motif = docsStore.motifBlocage(newAff.tracteurId)
    if (motif) {
      alerteBlockage.value = `Blocage : ${newAff.tracteurPlaque} en indisponibilité réglementaire. ${motif}`
    }
  }
}

const canSubmit = computed(() => !!newAff.chauffeurId && !!newAff.tracteurId && !!newAff.dateDebut)

function submitAff() {
  if (!canSubmit.value || alerteBlockage.value) return
  loading.value = true
  submitError.value = ''
  try {
    affStore.affecter(newAff.chauffeurId, newAff.chauffeurNom, newAff.tracteurId, newAff.tracteurPlaque, newAff.dateDebut)
    vehStore.affecter(newAff.tracteurId, newAff.chauffeurId, newAff.chauffeurNom)
    resetForm()
    showForm.value = false
  } catch (err: any) {
    submitError.value = err?.message ?? "Une erreur est survenue, l'affectation n'a pas été enregistrée."
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(newAff, { chauffeurId: '', chauffeurNom: '', tracteurId: '', tracteurPlaque: '', dateDebut: '' })
  alerteBlockage.value = ''
  submitError.value = ''
}

function confirmTerminer() {
  if (!terminerAff.value || !dateFin.value) return
  try {
    affStore.terminerAffectation(terminerAff.value.id, dateFin.value)
    vehStore.desaffecter(terminerAff.value.tracteurId)
    showTerminer.value = false
    dateFin.value = ''
    terminerAff.value = null
  } catch (err: any) {
    submitError.value = err?.message ?? "La fin d'affectation a échoué."
  }
}

function getAlertePermis(chauffeurId: string) {
  const profil = profStore.getByEmployeId(chauffeurId)
  return profil?.dateExpirationPermis && new Date(profil.dateExpirationPermis) < new Date()
}

function formatDate(d?: string) {
  return d ? new Date(d).toLocaleDateString('fr-FR') : '-'
}

function duree(debut: string, fin?: string) {
  if (!fin) return '-'
  const d = Math.ceil((new Date(fin).getTime() - new Date(debut).getTime()) / 86400000)
  return `${d} j`
}
</script>