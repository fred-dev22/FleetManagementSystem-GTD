<template>
  <div class="remorque-list-view">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <Container class="header-icon" :size="28" />
        <h1 class="page-title">Remorques</h1>
      </div>
      <button class="btn-primary" @click="openCreate">
        <Plus :size="18" />
        Nouvelle remorque
      </button>
    </div>

    <!-- KPI Chips -->
    <div class="kpi-row">
      <div class="kpi-chip">
        <span class="kpi-value">{{ kpiTotal }}</span>
        <span class="kpi-label">Total</span>
      </div>
      <div class="kpi-chip kpi-green">
        <span class="kpi-value">{{ kpiActives }}</span>
        <span class="kpi-label">Actives</span>
      </div>
      <div class="kpi-chip kpi-orange">
        <span class="kpi-value">{{ kpiHorsService }}</span>
        <span class="kpi-label">Hors service</span>
      </div>
      <div class="kpi-chip kpi-gray">
        <span class="kpi-value">{{ kpiArchivees }}</span>
        <span class="kpi-label">Archivées</span>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="filter-group">
        <label class="filter-label">Type</label>
        <select v-model="filterType" class="filter-select">
          <option value="">Tous</option>
          <option value="Citerne">Citerne</option>
          <option value="Bâchée">Bâchée</option>
          <option value="Plateau">Plateau</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Statut</label>
        <select v-model="filterStatut" class="filter-select">
          <option value="">Tous</option>
          <option value="en_service">En service</option>
          <option value="hors_service">Hors service</option>
          <option value="archive">Archivée</option>
        </select>
      </div>
      <div class="search-group">
        <Search :size="16" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher par plaque ou VIN…"
          class="search-input"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Plaque</th>
            <th>Type</th>
            <th>Capacité</th>
            <th>Tracteur attelé</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredRemorques.length === 0">
            <td colspan="7" class="empty-state">Aucune remorque trouvée.</td>
          </tr>
          <tr
            v-for="remorque in filteredRemorques"
            :key="remorque.id"
            class="table-row"
            @click="goToDetail(remorque.id)"
          >
            <td class="cell-id">{{ remorque.id }}</td>
            <td class="cell-plaque">{{ remorque.plaque }}</td>
            <td>
              <span :class="['pill', typeClass(remorque.type)]">{{ remorque.type ?? '—' }}</span>
            </td>
            <td class="cell-capacite">
              <span v-if="remorque.capacite">
                {{ remorque.capacite }}
                <span class="unit">{{ remorque.uniteCapacite ?? '' }}</span>
              </span>
              <span v-else>—</span>
            </td>
            <td>{{ remorque.tracteurPlaque ?? '—' }}</td>
            <td>
              <span :class="['pill', statutClass(remorque.statutAdmin)]">
                {{ statutLabel(remorque.statutAdmin) }}
              </span>
            </td>
            <td class="cell-actions" @click.stop>
              <button
                class="action-btn edit-btn"
                title="Modifier"
                @click="openEdit(remorque.id)"
              >
                <Edit :size="16" />
              </button>
              <button
                class="action-btn archive-btn"
                title="Archiver"
                @click="archiver(remorque.id)"
              >
                <Archive :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <RemorqueFormModal v-model="showModal" :edit-id="editId" @saved="editId = undefined" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Container, Plus, Search, Edit, Archive } from 'lucide-vue-next'
import { useRemorquesStore } from '../../stores/remorques'
import RemorqueFormModal from '../../components/fleet/RemorqueFormModal.vue'

const router = useRouter()
const store = useRemorquesStore()
const showModal = ref(false)
const editId = ref<string | undefined>(undefined)

function openCreate() { editId.value = undefined; showModal.value = true }
function openEdit(id: number | string) { editId.value = String(id); showModal.value = true }

const filterType = ref<string>('')
const filterStatut = ref<string>('')
const searchQuery = ref<string>('')


// KPIs
const kpiTotal = computed(() => store.remorques.length)
const kpiActives = computed(() =>
  store.remorques.filter((r) => r.statutAdmin === 'en_service').length
)
const kpiHorsService = computed(() =>
  store.remorques.filter((r) => r.statutAdmin === 'hors_service').length
)
const kpiArchivees = computed(() =>
  store.remorques.filter((r) => r.statutAdmin === 'archive').length
)

// Filtered list
const filteredRemorques = computed(() => {
  let list = store.remorques
  if (filterType.value) {
    list = list.filter((r) => r.type === filterType.value)
  }
  if (filterStatut.value) {
    list = list.filter((r) => r.statutAdmin === filterStatut.value)
  }
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (r) =>
        (r.plaque ?? '').toLowerCase().includes(q) ||
        (r.vin ?? '').toLowerCase().includes(q)
    )
  }
  return list
})

// Navigation
function goToDetail(id: number | string) {
  router.push({ name: 'fleet-remorque-detail', params: { id } })
}

async function archiver(id: number | string) {
  if (confirm('Archiver cette remorque ?')) {
    await store.archiverRemorque(id)
  }
}

// Statut
function statutLabel(statut: string): string {
  const map: Record<string, string> = {
    en_service: 'En service',
    hors_service: 'Hors service',
    archive: 'Archivée',
  }
  return map[statut] ?? statut
}

function statutClass(statut: string): string {
  const map: Record<string, string> = {
    en_service: 'pill-green',
    hors_service: 'pill-orange',
    archive: 'pill-gray',
  }
  return map[statut] ?? 'pill-gray'
}

// Type
function typeClass(type: string): string {
  const map: Record<string, string> = {
    Citerne: 'pill-blue',
    Bâchée: 'pill-teal',
    Plateau: 'pill-yellow',
    Frigorifique: 'pill-purple',
    Autre: 'pill-gray',
  }
  return map[type] ?? 'pill-gray'
}
</script>

<style scoped>
/* ── Layout ── */
.remorque-list-view {
  padding: 24px 28px;
  min-height: 100vh;
  background: #f4f6f9;
  font-family: 'Inter', sans-serif;
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  color: #1a56db;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #1a56db;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s;
}

.btn-primary:hover {
  background: #1648c0;
}

/* ── KPI Chips ── */
.kpi-row {
  display: flex;
  gap: 14px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.kpi-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px 28px;
  min-width: 110px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.kpi-value {
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

.kpi-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
  text-align: center;
}

.kpi-green .kpi-value { color: #16a34a; }
.kpi-orange .kpi-value { color: #ea580c; }
.kpi-gray .kpi-value { color: #6b7280; }

/* ── Filter Bar ── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  white-space: nowrap;
}

.filter-select {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
  color: #1e293b;
  background: #f8fafc;
  cursor: pointer;
  outline: none;
}

.filter-select:focus {
  border-color: #1a56db;
}

.search-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 200px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 6px 10px;
  background: #f8fafc;
}

.search-icon {
  color: #94a3b8;
  flex-shrink: 0;
}

.search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  color: #1e293b;
  width: 100%;
}

.search-input::placeholder {
  color: #94a3b8;
}

/* ── Table ── */
.table-wrapper {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}

.data-table thead tr {
  background: #1a56db;
}

.data-table th {
  text-align: left;
  padding: 12px 14px;
  color: #fff;
  font-weight: 600;
  font-size: 12.5px;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.table-row {
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.12s;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: #f0f5ff;
}

.data-table td {
  padding: 11px 14px;
  color: #334155;
  vertical-align: middle;
}

.cell-id {
  color: #94a3b8;
  font-size: 12px;
}

.cell-plaque {
  font-weight: 600;
  color: #1e293b;
  letter-spacing: 0.04em;
}

.cell-capacite {
  font-weight: 500;
  color: #1e293b;
}

.unit {
  font-size: 11px;
  color: #64748b;
  margin-left: 2px;
}

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 40px 0;
  font-size: 14px;
}

/* ── Pills ── */
.pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
}

.pill-green {
  background: #dcfce7;
  color: #16a34a;
}

.pill-orange {
  background: #ffedd5;
  color: #ea580c;
}

.pill-gray {
  background: #f1f5f9;
  color: #6b7280;
}

.pill-blue {
  background: #dbeafe;
  color: #1d4ed8;
}

.pill-teal {
  background: #ccfbf1;
  color: #0f766e;
}

.pill-yellow {
  background: #fef9c3;
  color: #a16207;
}

.pill-purple {
  background: #ede9fe;
  color: #7c3aed;
}

/* ── Actions ── */
.cell-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.edit-btn {
  background: #eff6ff;
  color: #1a56db;
}

.edit-btn:hover {
  background: #1a56db;
  color: #fff;
}

.archive-btn {
  background: #f8fafc;
  color: #64748b;
}

.archive-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}
</style>
