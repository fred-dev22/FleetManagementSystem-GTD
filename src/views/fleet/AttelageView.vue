<template>
  <div class="px-7 py-6 space-y-6">
    <!-- Header -->
    <div :class="L.pageHeader">
      <div>
        <h1 :class="L.pageTitle">Attelages</h1>
        <p :class="L.pageSub">Gestion des attelages tracteur ↔ remorque</p>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div v-for="k in kpis" :key="k.label" class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        <p class="text-xs text-gray-500 font-medium">{{ k.label }}</p>
        <p class="text-2xl font-bold mt-0.5" :class="k.color ?? 'text-gray-800'">{{ k.value }}</p>
      </div>
    </div>

    <!-- Attelages actifs -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-2 text-gray-800 font-semibold">
          <Link2 class="w-5 h-5 text-primary" />
          Attelages actifs
        </div>
        <button :class="L.btnPrimary" @click="showForm = true">
          <Plus class="w-4 h-4" />
          Nouvel attelage
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50">
              <th :class="L.th">Tracteur</th>
              <th :class="L.th">Remorque</th>
              <th :class="L.th">Type remorque</th>
              <th :class="L.th">Début</th>
              <th :class="L.th">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!actifs.length">
              <td colspan="5" class="text-center py-8 text-gray-400 text-sm">Aucun attelage actif.</td>
            </tr>
            <tr v-for="a in actifs" :key="a.id" :class="L.rowHover">
              <td :class="L.td"><span class="font-mono font-semibold text-gray-800">{{ a.tracteurPlaque }}</span></td>
              <td :class="L.td"><span class="font-mono font-semibold text-gray-700">{{ a.remorquePlaque }}</span></td>
              <td :class="L.td">
                <span class="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                  {{ getRemorqueType(a.remorqueId) }}
                </span>
              </td>
              <td :class="L.td"><span class="text-gray-600 text-sm">{{ formatDate(a.dateDebut) }}</span></td>
              <td :class="L.td">
                <button @click="detelerAtt = a; showDeteler = true"
                  class="text-xs text-danger hover:underline">
                  Dételer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Formulaire nouvel attelage -->
    <div v-if="showForm" class="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div class="px-6 py-4 bg-primary rounded-t-2xl">
        <h2 class="text-white font-semibold">Nouvel attelage</h2>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label :class="L.fpFieldLabel">Tracteur *</label>
            <SearchableDropdown
              :model-value="newAtt.tracteurId" :items="optionsTracteurs"
              placeholder="Sélectionner un tracteur" compact
              @update:model-value="onTracteurChange"
            />
          </div>
          <div>
            <label :class="L.fpFieldLabel">Remorque *</label>
            <SearchableDropdown
              :model-value="newAtt.remorqueId" :items="optionsRemorques"
              placeholder="Sélectionner une remorque" compact
              @update:model-value="onRemorqueChange"
            />
          </div>
          <div>
            <label :class="L.fpFieldLabel">Date début *</label>
            <input v-model="newAtt.dateDebut" type="date" :class="L.fpField" />
          </div>
        </div>
        <div class="flex gap-3 mt-4 justify-end">
          <button :class="L.btnOutline" @click="showForm = false; resetForm()">Annuler</button>
          <button :class="L.btnPrimary" :disabled="!canSubmit" @click="submitAtt">
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
            Atteler
          </button>
        </div>
      </div>
    </div>

    <!-- Historique -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-2 text-gray-800 font-semibold">
        <History class="w-5 h-5 text-gray-400" />
        Historique des attelages
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50">
              <th :class="L.th">Tracteur</th>
              <th :class="L.th">Remorque</th>
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
              <td :class="L.td"><span class="font-mono text-sm text-gray-700">{{ a.tracteurPlaque }}</span></td>
              <td :class="L.td"><span class="font-mono text-sm text-gray-700">{{ a.remorquePlaque }}</span></td>
              <td :class="L.td"><span class="text-gray-600 text-sm">{{ formatDate(a.dateDebut) }}</span></td>
              <td :class="L.td"><span class="text-gray-600 text-sm">{{ formatDate(a.dateFin) }}</span></td>
              <td :class="L.td"><span class="text-gray-600 text-sm">{{ duree(a.dateDebut, a.dateFin) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Modal dételer -->
  <Teleport to="body">
    <div v-if="showDeteler" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <h3 class="font-semibold text-gray-800 mb-2">Dételer</h3>
        <p class="text-sm text-gray-600 mb-4">
          <strong>{{ detelerAtt?.tracteurPlaque }}</strong> ↔ <strong>{{ detelerAtt?.remorquePlaque }}</strong>
        </p>
        <div class="mb-4">
          <label :class="L.fpFieldLabel">Date de fin *</label>
          <input v-model="dateFin" type="date" :class="L.fpField" />
        </div>
        <div class="flex gap-3 justify-end">
          <button :class="L.btnOutline" @click="showDeteler = false">Annuler</button>
          <button :class="L.btnPrimary" :disabled="!dateFin" @click="confirmDeteler">Confirmer</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { Link2, Plus, History, Loader2 } from 'lucide-vue-next'
import SearchableDropdown from '../../components/ui/SearchableDropdown.vue'
import type { DropdownItem } from '../../components/ui/SearchableDropdown.vue'
import { useAttelagesStore } from '../../stores/attelages'
import { useVehiculesStore } from '../../stores/vehicules'
import type { Attelage } from '../../types'
import * as L from '../../lib/listClasses'

const attStore = useAttelagesStore()
const vehStore = useVehiculesStore()

const showForm   = ref(false)
const showDeteler = ref(false)
const loading    = ref(false)
const detelerAtt = ref<Attelage | null>(null)
const dateFin    = ref('')

const newAtt = reactive({ tracteurId: '', tracteurPlaque: '', remorqueId: '', remorquePlaque: '', dateDebut: '' })

const actifs    = computed(() => attStore.attelages.filter(a => !a.dateFin))
const historique = computed(() => attStore.attelages.filter(a => !!a.dateFin))

const kpis = computed(() => [
  { label: 'Attelages actifs',  value: actifs.value.length,                    color: 'text-primary'  },
  { label: 'Tracteurs libres',  value: vehStore.getTracteurLibre().length,       color: 'text-success'  },
  { label: 'Remorques libres',  value: vehStore.getRemorqueLibre().length,       color: 'text-gray-800' },
  { label: 'Total historique',  value: historique.value.length,                 color: 'text-gray-500' },
])

const tracteursLibres = computed(() => vehStore.getTracteurLibre())
const remorquesLibres = computed(() => vehStore.getRemorqueLibre())

const optionsTracteurs = computed<DropdownItem[]>(() =>
  tracteursLibres.value.map(t => ({
    id: t.id, label: t.plaque,
    sublabel: [t.marque, t.modele].filter(Boolean).join(' '),
  })))

const optionsRemorques = computed<DropdownItem[]>(() =>
  remorquesLibres.value.map(r => ({
    id: r.id, label: r.plaque,
    sublabel: [r.typeRemorque, r.capacite].filter(Boolean).join(' · '),
  })))


function getRemorqueType(remorqueId: string) {
  return vehStore.getById(remorqueId)?.typeRemorque ?? '-'
}

function onTracteurChange(id: string) {
  newAtt.tracteurId = id
  newAtt.tracteurPlaque = vehStore.getById(id)?.plaque ?? ''
}

function onRemorqueChange(id: string) {
  newAtt.remorqueId = id
  newAtt.remorquePlaque = vehStore.getById(id)?.plaque ?? ''
}

const canSubmit = computed(() => !!newAtt.tracteurId && !!newAtt.remorqueId && !!newAtt.dateDebut)

function submitAtt() {
  if (!canSubmit.value) return
  loading.value = true
  try {
    attStore.attacher(newAtt.tracteurId, newAtt.tracteurPlaque, newAtt.remorqueId, newAtt.remorquePlaque, newAtt.dateDebut)
    vehStore.atteler(newAtt.tracteurId, newAtt.remorqueId)
    resetForm()
    showForm.value = false
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(newAtt, { tracteurId: '', tracteurPlaque: '', remorqueId: '', remorquePlaque: '', dateDebut: '' })
}

function confirmDeteler() {
  if (!detelerAtt.value || !dateFin.value) return
  attStore.detacher(detelerAtt.value.id, dateFin.value)
  vehStore.desatteler(detelerAtt.value.tracteurId, detelerAtt.value.remorqueId)
  showDeteler.value = false
  dateFin.value = ''
  detelerAtt.value = null
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
