<template>
  <ListPageLayout
    title="Employés"
    :subtitle="`${store.employees.length} employé(s) enregistré(s)`"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} employé(s)`"
    search-placeholder="Rechercher un employé..."
    :page-size-options="[15, 25, 50]"
    scope-label="Statut :"
    :scope-options="scopeOptions"
    v-model:scope="activeScope"
    v-model:search-query="searchQuery"
    v-model:sort-key="sortKey"
    v-model:sort-dir="sortDir"
    v-model:page="page"
    v-model:page-size="pageSize"
    @reset-filters="resetFilters"
    @open-card="openCard"
  >
    <template #header-actions>
      <div class="flex gap-2">
        <button :class="L.btnOutline" @click="showImport = true">
          <Upload class="w-4 h-4" /> Importer
        </button>
        <button :class="L.btnPrimary" @click="showCreate = true">
          <UserPlus class="w-4 h-4" /> Nouvel employé
        </button>
      </div>
    </template>

    <!-- KPIs -->
    <template #above-table>
      <div class="grid grid-cols-4 gap-2.5 mb-3.5 max-md:grid-cols-2">
        <!-- Total -->
        <div :class="kpiItem">
          <div :class="kpiIcon" class="bg-[#1a3c6e]/10">
            <Users class="w-[18px] h-[18px] text-[#1a3c6e]" />
          </div>
          <div>
            <div :class="kpiVal">{{ store.employees.length }}</div>
            <div :class="kpiLbl">Total</div>
          </div>
        </div>
        <!-- Actifs -->
        <div :class="kpiItem">
          <div :class="kpiIcon" class="bg-green-50">
            <UserCheck class="w-[18px] h-[18px] text-green-600" />
          </div>
          <div>
            <div :class="kpiVal">{{ activeCount }}</div>
            <div :class="kpiLbl">Actifs</div>
          </div>
        </div>
        <!-- Chauffeurs -->
        <div :class="kpiItem">
          <div :class="kpiIcon" class="bg-blue-50">
            <Truck class="w-[18px] h-[18px] text-blue-600" />
          </div>
          <div>
            <div :class="kpiVal">{{ chauffeurCount }}</div>
            <div :class="kpiLbl">Chauffeurs</div>
          </div>
        </div>
        <!-- Sortis -->
        <div :class="kpiItem">
          <div :class="kpiIcon" class="bg-red-50">
            <UserX class="w-[18px] h-[18px] text-red-500" />
          </div>
          <div>
            <div :class="kpiVal">{{ sortiCount }}</div>
            <div :class="kpiLbl">Sortis</div>
          </div>
        </div>
      </div>

      <ImportComingSoon
        :is-visible="showImport"
        message="L'import en masse des employés depuis un fichier Excel/CSV sera disponible prochainement."
        @close="showImport = false"
      />
    </template>

    <!-- Filtres -->
    <template #filters>
      <div :class="L.fpField">
        <label :class="L.fpFieldLabel">Société</label>
        <select v-model="fSociete" :class="L.fpSelect">
          <option value="">Toutes les sociétés</option>
          <option value="GTD">GTD</option>
          <option value="Logistics Sarl">Logistics Sarl</option>
          <option value="Damdjee Nadir Transporteur">Damdjee Nadir Transporteur</option>
        </select>
      </div>
      <div :class="L.fpField">
        <label :class="L.fpFieldLabel">Fonction</label>
        <select v-model="fFonction" :class="L.fpSelect">
          <option value="">Toutes les fonctions</option>
          <option value="Chauffeur">Chauffeur</option>
          <option value="RH">RH</option>
          <option value="Opérations">Opérations</option>
          <option value="Comptabilité">Comptabilité</option>
          <option value="Direction">Direction</option>
          <option value="Logistique">Logistique</option>
          <option value="Commercial">Commercial</option>
          <option value="Maintenance">Maintenance</option>
        </select>
      </div>
      <button
        class="mt-auto py-[7px] bg-transparent border-0 text-xs text-muted-foreground cursor-pointer text-left hover:text-[#1a3c6e]"
        @click="resetFilters"
      >
        Réinitialiser
      </button>
    </template>

    <!-- Cellule : Employé -->
    <template #cell-employee="{ item }">
      <div class="flex items-center gap-2.5">
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
          :style="{ background: item.avatarBg, color: item.avatarText }"
        >
          {{ item.initials }}
        </div>
        <div class="min-w-0">
          <div class="font-medium text-[13px] truncate flex items-center gap-1.5">
            <button
              class="hover:text-[#1a3c6e] hover:underline transition-colors text-left bg-transparent border-0 p-0 cursor-pointer"
              @click="openCard(item)"
            >{{ item.name }}</button>
            <Truck
              v-if="item.fonction === 'Chauffeur'"
              class="w-3.5 h-3.5 text-blue-500 shrink-0"
              title="Chauffeur"
            />
          </div>
          <div class="text-[11px] text-muted-foreground truncate">{{ item.fonction || item.jobTitle }}</div>
        </div>
      </div>
    </template>

    <!-- Cellule : Matricule -->
    <template #cell-code="{ item }">
      <span class="font-mono text-xs font-semibold text-[#1a3c6e]">{{ item.code }}</span>
    </template>

    <!-- Cellule : CIN -->
    <template #cell-cin="{ item }">
      <span class="font-mono text-xs text-muted-foreground">{{ item.cin || '—' }}</span>
    </template>

    <!-- Cellule : Société -->
    <template #cell-societe="{ item }">
      <span class="text-xs text-muted-foreground truncate">{{ item.societe || '—' }}</span>
    </template>

    <!-- Cellule : Fonction -->
    <template #cell-fonction="{ item }">
      <span
        class="text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
        :class="fonctionBadge(item.fonction)"
      >
        {{ item.fonction || '—' }}
      </span>
    </template>

    <!-- Cellule : Date embauche -->
    <template #cell-hireDate="{ item }">
      <span class="text-muted-foreground text-xs">{{ item.hireDate }}</span>
    </template>

    <!-- Cellule : Statut -->
    <template #cell-status="{ item }">
      <span
        class="text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
        :class="statusPill(item.status)"
      >
        {{ statusLabel(item.status) }}
      </span>
    </template>

    <!-- Aperçu rapide -->
    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3.5">
        <div class="flex items-center gap-2.5">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            :style="{ background: item.avatarBg, color: item.avatarText }"
          >
            {{ item.initials }}
          </div>
          <div class="min-w-0">
            <div class="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
              {{ item.name }}
              <Truck v-if="item.fonction === 'Chauffeur'" class="w-3.5 h-3.5 text-blue-500 shrink-0" />
            </div>
            <div class="text-[11px] text-muted-foreground">{{ item.fonction || item.jobTitle }}</div>
          </div>
        </div>
        <div>
          <span
            class="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            :class="statusPill(item.status)"
          >
            {{ statusLabel(item.status) }}
          </span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-[12px]">
          <div><div class="text-muted-foreground text-[11px]">Matricule</div>{{ item.code }}</div>
          <div><div class="text-muted-foreground text-[11px]">CIN</div>{{ item.cin || '—' }}</div>
          <div><div class="text-muted-foreground text-[11px]">Société</div>{{ item.societe || '—' }}</div>
          <div><div class="text-muted-foreground text-[11px]">Fonction</div>{{ item.fonction || '—' }}</div>
          <div><div class="text-muted-foreground text-[11px]">Embauche</div>{{ item.hireDate }}</div>
        </div>
        <div v-if="item.email" class="text-[12px]">
          <div class="text-muted-foreground text-[11px]">Email</div>{{ item.email }}
        </div>
        <button :class="L.btnPrimary" class="w-full justify-center" @click="openCard(item)">
          Ouvrir la fiche
        </button>
      </div>
    </template>

    <template #empty>
      <Users class="w-8 h-8" />
      <p class="text-[13px]">Aucun employé trouvé.</p>
    </template>

    <EmployeeFormModal v-model="showCreate" />

    <EmployeeCard
      v-if="openCardId !== null"
      :employees="store.employees"
      :employee-id="openCardId"
      @close="openCardId = null"
    />
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { UserPlus, Upload, Users, UserCheck, UserX, Truck } from 'lucide-vue-next'
import ImportComingSoon from '../../components/ui/ImportComingSoon.vue'
import { ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import EmployeeFormModal from '../../components/employees/EmployeeFormModal.vue'
import EmployeeCard from '../../components/employees/EmployeeCard.vue'
import * as L from '../../lib/listClasses'
import { useEmployeeStore } from '../../stores/employees'
import type { Employee } from '../../types'

const store = useEmployeeStore()

// ── KPI style tokens ──────────────────────────────────────────────────────────
const kpiItem = 'bg-card border border-border rounded-lg px-3.5 py-3 flex items-center gap-3'
const kpiIcon = 'w-9 h-9 rounded-lg flex items-center justify-center shrink-0'
const kpiVal  = 'text-[22px] font-bold leading-none'
const kpiLbl  = 'text-xs text-muted-foreground mt-0.5'

// ── Modal flags ───────────────────────────────────────────────────────────────
const showCreate = ref(false)
const showImport = ref(false)
const openCardId = ref<string | null>(null)

function openCard(item: Employee) { openCardId.value = item.id }

// ── KPI computed counts ───────────────────────────────────────────────────────
const activeCount    = computed(() => store.employees.filter((e: any) => e.status === 'actif').length)
const chauffeurCount = computed(() => store.employees.filter((e: any) => e.fonction === 'Chauffeur').length)
const sortiCount     = computed(() => store.employees.filter((e: any) => e.status === 'sorti').length)

// ── Status helpers ────────────────────────────────────────────────────────────
type GTDStatus = 'actif' | 'suspendu' | 'sorti' | 'en_conge'

function statusLabel(s: GTDStatus | string): string {
  const m: Record<string, string> = {
    actif:    'Actif',
    suspendu: 'Suspendu',
    sorti:    'Sorti',
    en_conge: 'En congé',
  }
  return m[s] ?? s
}

function statusPill(s: GTDStatus | string): string {
  const m: Record<string, string> = {
    actif:    'bg-green-100 text-green-700',
    suspendu: 'bg-orange-100 text-orange-700',
    sorti:    'bg-red-100 text-red-600',
    en_conge: 'bg-blue-100 text-blue-700',
  }
  return m[s] ?? 'bg-gray-100 text-gray-600'
}

// ── Fonction badge ────────────────────────────────────────────────────────────
function fonctionBadge(f: string): string {
  const m: Record<string, string> = {
    'Chauffeur':  'bg-blue-100 text-blue-700',
    'RH':         'bg-purple-100 text-purple-700',
    'Direction':  'bg-amber-100 text-amber-700',
    'Opérations': 'bg-teal-100 text-teal-700',
    'Logistique': 'bg-cyan-100 text-cyan-700',
    'Commercial': 'bg-indigo-100 text-indigo-700',
    'Maintenance':'bg-orange-100 text-orange-700',
    'Comptabilité':'bg-pink-100 text-pink-700',
  }
  return m[f] ?? 'bg-gray-100 text-gray-600'
}

// ── Table columns ─────────────────────────────────────────────────────────────
const columns = computed<ListColumn[]>(() => [
  { key: 'code',     label: 'Matricule', sortable: true,  hideable: false, width: 110 },
  { key: 'employee', label: 'Employé',   sortable: true,  width: 240 },
  { key: 'cin',      label: 'CIN',       sortable: false, width: 130 },
  { key: 'societe',  label: 'Société',   sortable: true,  width: 190 },
  { key: 'fonction', label: 'Fonction',  sortable: true,  width: 150 },
  { key: 'hireDate', label: 'Embauche',  sortable: true,  width: 120 },
  { key: 'status',   label: 'Statut',    width: 120 },
])

// ── Scope (tab bar) ───────────────────────────────────────────────────────────
const scopeOptions = [
  { value: '',         label: 'Tous' },
  { value: 'actif',    label: 'Actifs' },
  { value: 'en_conge', label: 'En congé' },
  { value: 'suspendu', label: 'Suspendus' },
  { value: 'sorti',    label: 'Sortis' },
]
const activeScope = ref('')

// ── Filter state ──────────────────────────────────────────────────────────────
const fSociete    = ref('')
const fFonction   = ref('')
const searchQuery = ref('')
const sortKey     = ref('')
const sortDir     = ref<'asc' | 'desc'>('asc')
const page        = ref(1)
const pageSize    = ref(15)

watch([activeScope, fSociete, fFonction, searchQuery, pageSize], () => { page.value = 1 })

function resetFilters() {
  fSociete.value = ''
  fFonction.value = ''
  searchQuery.value = ''
  activeScope.value = ''
  page.value = 1
}

// ── Filtered + sorted rows ────────────────────────────────────────────────────
const filtered = computed(() => {
  let rows = store.employees.filter((e: any) => {
    if (activeScope.value && e.status !== activeScope.value) return false
    if (fSociete.value && e.societe !== fSociete.value) return false
    if (fFonction.value && e.fonction !== fFonction.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (
        !e.name?.toLowerCase().includes(q) &&
        !e.code?.toLowerCase().includes(q) &&
        !e.cin?.toLowerCase().includes(q) &&
        !e.fonction?.toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  if (sortKey.value) {
    const fieldMap: Record<string, string> = {
      code:     'code',
      employee: 'name',
      societe:  'societe',
      fonction: 'fonction',
      hireDate: 'hireDate',
    }
    const f = fieldMap[sortKey.value]
    if (f) {
      rows = [...rows].sort((a: any, b: any) => {
        const cmp = String(a[f] ?? '').localeCompare(String(b[f] ?? ''))
        return sortDir.value === 'asc' ? cmp : -cmp
      })
    }
  }
  return rows
})

const totalCount = computed(() => filtered.value.length)
const pageItems  = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})
</script>
