<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <MapPinned class="w-7 h-7 text-blue-700" />
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Sites & Géofences</h1>
          <p class="text-sm text-slate-500">Référentiel des sites géographiques</p>
        </div>
      </div>
      <button
        class="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        @click="openCreate"
      >
        <Plus class="w-4 h-4" />
        Nouveau site
      </button>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
        <div class="bg-blue-100 rounded-lg p-3">
          <MapPinned class="w-6 h-6 text-blue-700" />
        </div>
        <div>
          <p class="text-xs text-slate-500 uppercase tracking-wide">Total sites</p>
          <p class="text-2xl font-bold text-slate-800">{{ siteStore.sites.length }}</p>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
        <div class="bg-green-100 rounded-lg p-3">
          <MapPinned class="w-6 h-6 text-green-600" />
        </div>
        <div>
          <p class="text-xs text-slate-500 uppercase tracking-wide">Actifs</p>
          <p class="text-2xl font-bold text-slate-800">{{ activeSites }}</p>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
        <div class="bg-purple-100 rounded-lg p-3">
          <MapPinned class="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <p class="text-xs text-slate-500 uppercase tracking-wide">Types</p>
          <p class="text-2xl font-bold text-slate-800">{{ uniqueTypes }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3">
      <input
        v-model="search"
        type="text"
        placeholder="Rechercher par code ou nom..."
        class="flex-1 min-w-48 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <select
        v-model="filterType"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Tous les types</option>
        <option v-for="type in typeOptions" :key="type" :value="type">{{ type }}</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="text-left px-4 py-3 font-semibold text-slate-600">Code</th>
              <th class="text-left px-4 py-3 font-semibold text-slate-600">Nom</th>
              <th class="text-left px-4 py-3 font-semibold text-slate-600">Ville</th>
              <th class="text-left px-4 py-3 font-semibold text-slate-600">Type</th>
              <th class="text-left px-4 py-3 font-semibold text-slate-600">Rayon (m)</th>
              <th class="text-left px-4 py-3 font-semibold text-slate-600">Alerte</th>
              <th class="text-left px-4 py-3 font-semibold text-slate-600">Statut</th>
              <th class="text-left px-4 py-3 font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="site in filteredSites"
              :key="site.id"
              class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <td class="px-4 py-3 font-mono font-medium text-slate-800">{{ site.code }}</td>
              <td class="px-4 py-3 text-slate-700">{{ site.nom }}</td>
              <td class="px-4 py-3 text-slate-600">{{ site.ville }}</td>
              <td class="px-4 py-3">
                <span :class="typeBadgeClass(site.type)" class="px-2 py-0.5 rounded-full text-xs font-medium">
                  {{ site.type }}
                </span>
              </td>
              <td class="px-4 py-3 text-slate-600">{{ site.rayon ?? 500 }}</td>
              <td class="px-4 py-3 text-slate-600 capitalize">{{ site.typeAlerte ?? '—' }}</td>
              <td class="px-4 py-3">
                <span
                  :class="site.actif ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'"
                  class="px-2 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ site.actif ? 'Actif' : 'Inactif' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <button
                    class="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    @click="openEdit(site.id)"
                  >
                    Modifier
                  </button>
                  <button
                    @click="deleteSite(site.id)"
                    class="text-red-500 hover:text-red-700 text-xs font-medium"
                  >
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredSites.length === 0">
              <td colspan="8" class="px-4 py-10 text-center text-slate-400 text-sm">
                Aucun site trouvé.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <SiteFormModal v-model="showModal" :edit-id="editId" @saved="editId = undefined" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { MapPinned, Plus } from 'lucide-vue-next'
import { useSiteStore } from '../../stores/sites'
import SiteFormModal from '../../components/fleet/SiteFormModal.vue'

const siteStore = useSiteStore()
const showModal = ref(false)
const editId = ref<string | undefined>(undefined)

function openCreate() { editId.value = undefined; showModal.value = true }
function openEdit(id: string) { editId.value = id; showModal.value = true }

const search = ref('')
const filterType = ref('')

const typeOptions = [
  'Garage',
  'Dépôt chargement',
  'Dépôt déchargement',
  'Zone à risque',
  'Point de contrôle',
]

const activeSites = computed(() => siteStore.sites.filter((s: any) => s.actif).length)
const uniqueTypes = computed(() => new Set(siteStore.sites.map((s: any) => s.type)).size)

const filteredSites = computed(() => {
  return siteStore.sites.filter((s: any) => {
    const matchSearch =
      !search.value ||
      s.code.toLowerCase().includes(search.value.toLowerCase()) ||
      s.nom.toLowerCase().includes(search.value.toLowerCase())
    const matchType = !filterType.value || s.type === filterType.value
    return matchSearch && matchType
  })
})

function typeBadgeClass(type: string): string {
  const map: Record<string, string> = {
    Garage: 'bg-blue-100 text-blue-700',
    'Dépôt chargement': 'bg-green-100 text-green-700',
    'Dépôt déchargement': 'bg-orange-100 text-orange-700',
    'Zone à risque': 'bg-red-100 text-red-700',
    'Point de contrôle': 'bg-purple-100 text-purple-700',
  }
  return map[type] ?? 'bg-slate-100 text-slate-600'
}

function deleteSite(id: string) {
  if (confirm('Supprimer ce site ?')) {
    siteStore.deleteSite(id)
  }
}
</script>
