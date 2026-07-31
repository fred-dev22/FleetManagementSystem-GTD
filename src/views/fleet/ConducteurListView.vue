<template>
  <ListPageLayout
    title="Conducteurs"
    :subtitle="`${chauffeurs.length} conducteur(s) enregistré(s)`"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} conducteur(s)`"
    search-placeholder="Rechercher par nom, matricule…"
    scope-label="Statut :"
    :scope-options="scopeOptions"
    v-model:scope="activeScope"
    v-model:search-query="searchQuery"
    v-model:sort-key="sortKey"
    v-model:sort-dir="sortDir"
    v-model:page="page"
    v-model:page-size="pageSize"
    @reset-filters="resetFilters"
    @open-card="(e) => openCard(e.id)"
  >
    <template #above-table>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5">
        <div v-for="k in kpis" :key="k.label" class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
          <p class="text-xs text-gray-500 font-medium">{{ k.label }}</p>
          <p class="text-2xl font-bold mt-0.5" :class="k.color">{{ k.value }}</p>
        </div>
      </div>
    </template>

    <template #filters>
      <div>
        <label :class="L.fpFieldLabel">Alerte</label>
        <select v-model="filterAlerte" :class="L.fpSelect">
          <option value="">Aucun filtre</option>
          <option value="permis">Permis expiré</option>
          <option value="visite">Visite médicale expirée</option>
        </select>
      </div>
      <button class="mt-auto py-[7px] bg-transparent border-0 text-xs text-muted-foreground cursor-pointer hover:text-primary" @click="resetFilters">
        Réinitialiser
      </button>
    </template>

    <!-- Colonnes -->
    <template #cell-nom="{ item }">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
          {{ (item.nom?.[0] ?? '') + (item.prenom?.[0] ?? '') }}
        </div>
        <div>
          <p class="font-medium text-gray-800">{{ item.nom }} {{ item.prenom }}</p>
          <p class="text-xs text-gray-400">{{ item.matricule }}</p>
        </div>
      </div>
    </template>

    <template #cell-permis="{ item }">
      <div class="flex items-center gap-1.5">
        <span class="text-xs font-mono text-gray-700">{{ item.categoriePermis ?? '—' }}</span>
        <span v-if="item.dateExpirationPermis" :class="dateStatutClass(item.dateExpirationPermis)"
          class="px-1.5 py-0.5 rounded text-xs font-medium">
          {{ formatDate(item.dateExpirationPermis) }}
        </span>
      </div>
    </template>

    <template #cell-visite="{ item }">
      <span v-if="item.dateExpirationVisiteMedicale"
        :class="dateStatutClass(item.dateExpirationVisiteMedicale)"
        class="px-1.5 py-0.5 rounded text-xs font-medium">
        {{ formatDate(item.dateExpirationVisiteMedicale) }}
      </span>
      <span v-else class="text-gray-300 text-xs">—</span>
    </template>

    <template #cell-score="{ item }">
      <div v-if="item.score != null" class="flex items-center gap-2">
        <div class="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all"
            :style="{ width: item.score + '%' }"
            :class="item.score >= 80 ? 'bg-success' : item.score >= 60 ? 'bg-warning' : 'bg-danger'" />
        </div>
        <span class="text-xs font-semibold"
          :class="item.score >= 80 ? 'text-success' : item.score >= 60 ? 'text-warning' : 'text-danger'">
          {{ item.score }}
        </span>
      </div>
      <span v-else class="text-gray-300 text-xs">—</span>
    </template>

    <template #cell-statut="{ item }">
      <span :class="item.disponible ? 'bg-success-bg text-success' : 'bg-primary/10 text-primary'"
        class="px-2 py-0.5 rounded-full text-xs font-medium">
        {{ item.disponible ? 'Disponible' : 'Affecté' }}
      </span>
    </template>

    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base shrink-0">
            {{ (item.nom?.[0] ?? '') + (item.prenom?.[0] ?? '') }}
          </div>
          <div>
            <div class="font-semibold text-gray-800">{{ item.nom }} {{ item.prenom }}</div>
            <div class="text-xs text-gray-500">{{ item.matricule }}</div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div class="text-muted-foreground text-[11px]">Permis</div>
            {{ item.categoriePermis ?? '—' }}
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Score conduite</div>
            <span :class="(item.score ?? 0) >= 80 ? 'text-success' : (item.score ?? 0) >= 60 ? 'text-warning' : 'text-danger'" class="font-semibold">
              {{ item.score ?? '—' }} / 100
            </span>
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Exp. permis</div>
            <span :class="dateStatutClass(item.dateExpirationPermis)">{{ formatDate(item.dateExpirationPermis) }}</span>
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Visite méd.</div>
            <span :class="dateStatutClass(item.dateExpirationVisiteMedicale)">{{ formatDate(item.dateExpirationVisiteMedicale) }}</span>
          </div>
        </div>
        <button :class="L.btnPrimary" class="w-full justify-center" @click="openCard(item.id)">Ouvrir la fiche</button>
      </div>
    </template>

    <template #empty>
      <User class="w-8 h-8" />
      <p class="text-sm">Aucun conducteur trouvé</p>
    </template>

    <ConducteurCard v-if="selectedId !== null"
      :employe="empStore.employees?.find((e: any) => e.id === selectedEmpId)"
      :profil="profStore.getByEmployeId(selectedEmpId ?? '')"
      @close="selectedId = null" />
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { User } from 'lucide-vue-next'
import { ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import ConducteurCard from '../../components/fleet/ConducteurCard.vue'
import { useEmployeeStore } from '../../stores/employees'
import { useConduceteursProfilesStore } from '../../stores/conducteursProfiles'
import * as L from '../../lib/listClasses'
import { useRouter } from 'vue-router'


const router = useRouter()
function ouvrirFiche(employeId: string) {
  router.push({ name: 'fleet-conducteur-detail', params: { id: employeId } })
}

const empStore  = useEmployeeStore()
const profStore = useConduceteursProfilesStore()

const selectedId    = ref<string | null>(null)
const selectedEmpId = ref<string | null>(null)
const searchQuery   = ref('')
const activeScope   = ref('')
const filterAlerte  = ref('')
const sortKey       = ref('')
const sortDir       = ref<'asc' | 'desc'>('asc')
const page          = ref(1)
const pageSize      = ref(15)

const scopeOptions = [
  { value: '',           label: 'Tous' },
  { value: 'disponible', label: 'Disponibles' },
  { value: 'affecte',    label: 'Affectés' },
]

// Rows enrichies (employe + profil flatté)
const chauffeurs = computed(() =>
  ((empStore.employees ?? []) as any[])
    .filter(e => e.fonction === 'Chauffeur')
    .map(e => {
      const profil = profStore.getByEmployeId(e.id)
      return {
        id:                          e.id,
        nom:                         e.nom ?? '',
        prenom:                      e.prenom ?? '',
        matricule:                   e.matricule ?? e.id,
        disponible:                  profil?.disponible ?? true,
        categoriePermis:             profil?.categoriePermis,
        dateExpirationPermis:        profil?.dateExpirationPermis,
        dateExpirationVisiteMedicale: profil?.dateExpirationVisiteMedicale,
        score:                       profil?.scoreConduite,
      }
    })
)

const kpis = computed(() => [
  { label: 'Total conducteurs',    value: chauffeurs.value.length,                                                                                                                                       color: 'text-gray-800' },
  { label: 'Disponibles',          value: chauffeurs.value.filter(r => r.disponible).length,                                                                                                              color: 'text-success'  },
  { label: 'Affectés',             value: chauffeurs.value.filter(r => !r.disponible).length,                                                                                                             color: 'text-primary'  },
  { label: 'Alertes régl.',        value: chauffeurs.value.filter(r => estExpire(r.dateExpirationPermis) || estExpire(r.dateExpirationVisiteMedicale)).length,                                            color: 'text-danger'   },
])

const columns = computed<ListColumn[]>(() => [
  { key: 'nom',    label: 'Conducteur',           width: 220 },
  { key: 'permis', label: 'Permis (expiration)',   width: 180 },
  { key: 'visite', label: 'Visite médicale',       width: 160 },
  { key: 'score',  label: 'Score conduite',        width: 140 },
  { key: 'statut', label: 'Statut',                width: 120 },
])

watch([activeScope, filterAlerte, searchQuery, pageSize], () => { page.value = 1 })

function resetFilters() {
  activeScope.value = ''
  filterAlerte.value = ''
  searchQuery.value = ''
  page.value = 1
}

const filtered = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return chauffeurs.value.filter(r => {
    if (activeScope.value === 'disponible' && !r.disponible) return false
    if (activeScope.value === 'affecte'    && r.disponible)  return false
    if (filterAlerte.value === 'permis' && !estExpire(r.dateExpirationPermis))        return false
    if (filterAlerte.value === 'visite' && !estExpire(r.dateExpirationVisiteMedicale)) return false
    if (q && !`${r.nom} ${r.prenom} ${r.matricule}`.toLowerCase().includes(q)) return false
    return true
  })
})

const totalCount = computed(() => filtered.value.length)
const pageItems  = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

function openCard(empId: string) {
  selectedId.value    = empId
  selectedEmpId.value = empId
}

function estExpire(date?: string) {
  return date ? new Date(date) < new Date() : false
}

function formatDate(d?: string) {
  return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
}

function dateStatutClass(date?: string) {
  if (!date) return 'text-gray-300'
  const exp = new Date(date)
  const now = new Date()
  const in30 = new Date(); in30.setDate(now.getDate() + 30)
  if (exp < now)   return 'bg-danger-bg text-danger px-1.5 py-0.5 rounded'
  if (exp <= in30) return 'bg-warning-bg text-warning px-1.5 py-0.5 rounded'
  return 'bg-success-bg text-success px-1.5 py-0.5 rounded'
}
</script>
