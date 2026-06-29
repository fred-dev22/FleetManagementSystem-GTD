<template>
  <div class="p-6 max-w-2xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <MapPinned class="w-7 h-7 text-blue-700" />
      <div>
        <h1 class="text-2xl font-bold text-slate-800">{{ isEdit ? 'Modifier le site' : 'Nouveau site' }}</h1>
        <p class="text-sm text-slate-500">{{ isEdit ? 'Mise à jour des informations du site' : 'Enregistrer un nouveau site géographique' }}</p>
      </div>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      <!-- Code -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Code <span class="text-red-500">*</span></label>
        <input
          v-model="form.code"
          type="text"
          required
          placeholder="ex: GAR-TNR-01"
          @input="form.code = (form.code as string).toUpperCase()"
          class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
        <p v-if="codeError" class="text-red-500 text-xs mt-1">{{ codeError }}</p>
      </div>

      <!-- Nom complet -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Nom complet <span class="text-red-500">*</span></label>
        <input
          v-model="form.nom"
          type="text"
          required
          placeholder="ex: Garage principal Antananarivo"
          class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Ville & Région -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Ville <span class="text-red-500">*</span></label>
          <input
            v-model="form.ville"
            type="text"
            required
            placeholder="ex: Antananarivo"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Région</label>
          <input
            v-model="form.region"
            type="text"
            placeholder="ex: Lagunes"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <!-- Type -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Type <span class="text-red-500">*</span></label>
        <select
          v-model="form.type"
          required
          class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="" disabled>Sélectionner un type</option>
          <option value="Garage">Garage</option>
          <option value="Dépôt chargement">Dépôt chargement</option>
          <option value="Dépôt déchargement">Dépôt déchargement</option>
          <option value="Zone à risque">Zone à risque</option>
          <option value="Point de contrôle">Point de contrôle</option>
        </select>
      </div>

      <!-- Latitude & Longitude -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
          <input
            v-model.number="form.latitude"
            type="number"
            step="any"
            placeholder="ex: 5.3600"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
          <input
            v-model.number="form.longitude"
            type="number"
            step="any"
            placeholder="ex: -4.0083"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <!-- Rayon géofence -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Rayon géofence (mètres)</label>
        <input
          v-model.number="form.rayon"
          type="number"
          min="50"
          max="50000"
          placeholder="500"
          class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p class="text-xs text-slate-400 mt-1">Par défaut : 500 m</p>
      </div>

      <!-- Type alerte -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Type d'alerte</label>
        <select
          v-model="form.typeAlerte"
          class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="entree">Entrée seulement</option>
          <option value="sortie">Sortie seulement</option>
          <option value="entree_sortie">Entrée & Sortie</option>
        </select>
      </div>

      <!-- Actif -->
      <div class="flex items-center gap-3">
        <input
          id="actif"
          v-model="form.actif"
          type="checkbox"
          class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
        />
        <label for="actif" class="text-sm font-medium text-slate-700">Site actif</label>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
        <router-link
          to="/fleet/sites"
          class="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg transition-colors"
        >
          Annuler
        </router-link>
        <button
          type="submit"
          class="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Save class="w-4 h-4" />
          {{ isEdit ? 'Mettre à jour' : 'Enregistrer' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MapPinned, Save } from 'lucide-vue-next'
import { useSitesStore } from '../../stores/sites'

const router = useRouter()
const route = useRoute()
const siteStore = useSitesStore()

const isEdit = computed(() => !!route.params.id)
const codeError = ref('')

const form = ref({
  code: '',
  nom: '',
  ville: '',
  region: '',
  type: '',
  latitude: null as number | null,
  longitude: null as number | null,
  rayon: 500,
  typeAlerte: 'entree_sortie',
  actif: true,
})

onMounted(() => {
  if (isEdit.value) {
    const site = siteStore.getSiteById(route.params.id as string)
    if (site) {
      form.value = { ...form.value, ...site }
    }
  }
})

function handleSubmit() {
  codeError.value = ''

  // Check code uniqueness
  const existing = siteStore.sites.find(
    (s: any) => s.code === form.value.code && s.id !== route.params.id
  )
  if (existing) {
    codeError.value = 'Ce code est déjà utilisé par un autre site.'
    return
  }

  if (isEdit.value) {
    siteStore.updateSite(route.params.id as string, { ...form.value })
  } else {
    siteStore.addSite({ ...form.value })
  }

  router.push('/fleet/sites')
}
</script>
