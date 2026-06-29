<template>
  <div class="tracteur-list-view">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <Truck class="header-icon" :size="28" />
        <h1 class="page-title">Tracteurs</h1>
      </div>
      <button class="btn-primary" @click="openCreate">
        <Plus :size="18" />
        Nouveau tracteur
      </button>
    </div>

    <!-- KPI Chips -->
    <div class="kpi-row">
      <div class="kpi-chip">
        <span class="kpi-value">{{ kpiTotal }}</span>
        <span class="kpi-label">Total</span>
      </div>
      <div class="kpi-chip kpi-green">
        <span class="kpi-value">{{ kpiEnService }}</span>
        <span class="kpi-label">En service</span>
      </div>
      <div class="kpi-chip kpi-orange">
        <span class="kpi-value">{{ kpiHorsService }}</span>
        <span class="kpi-label">Hors service</span>
      </div>
      <div class="kpi-chip kpi-gray">
        <span class="kpi-value">{{ kpiArchives }}</span>
        <span class="kpi-label">Archivés</span>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="filter-group">
        <label class="filter-label">Statut admin</label>
        <select v-model="filterStatut" class="filter-select">
          <option value="">Tous</option>
          <option value="en_service">En service</option>
          <option value="hors_service">Hors service</option>
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
            <th>Marque / Modèle</th>
            <th>Chauffeur affecté</th>
            <th>Remorque attelée</th>
            <th>Statut admin</th>
            <th>Statut op</th>
            <th>Carburant</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredTracteurs.length === 0">
            <td colspan="9" class="empty-state">Aucun tracteur trouvé.</td>
          </tr>
          <tr
            v-for="tracteur in filteredTracteurs"
            :key="tracteur.id"
            class="table-row"
            @click="goToDetail(tracteur.id)"
          >
            <td class="cell-id">{{ tracteur.id }}</td>
            <td class="cell-plaque">{{ tracteur.plaque }}</td>
            <td>
              <span class="marque">{{ tracteur.marque }}</span>
              <span class="modele"> / {{ tracteur.modele }}</span>
            </td>
            <td>{{ tracteur.chauffeurNom ?? '—' }}</td>
            <td>{{ tracteur.remorquePlaque ?? '—' }}</td>
            <td>
              <span :class="['pill', statutAdminClass(tracteur.statutAdmin)]">
                {{ statutAdminLabel(tracteur.statutAdmin) }}
              </span>
            </td>
            <td>
              <span :class="['pill', statutOpClass(tracteur.statutOp)]">
                {{ statutOpLabel(tracteur.statutOp) }}
              </span>
            </td>
            <td class="cell-fuel">
              <div class="fuel-bar-wrap">
                <div
                  class="fuel-bar"
                  :class="fuelBarClass(tracteur.niveauCarburant)"
                  :style="{ width: `${tracteur.niveauCarburant ?? 0}%` }"
                ></div>
              </div>
              <span class="fuel-label">{{ tracteur.niveauCarburant ?? 0 }}%</span>
            </td>
            <td class="cell-actions" @click.stop>
              <button
                class="action-btn edit-btn"
                title="Modifier"
                @click="openEdit(tracteur.id)"
              >
                <Edit :size="16" />
              </button>
              <button
                class="action-btn archive-btn"
                title="Archiver"
                @click="archiver(tracteur.id)"
              >
                <Archive :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <TracteurFormModal
    v-model="showModal"
    :edit-id="editId ?? undefined"
    @saved="editId = null"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Truck, Plus, Search, Edit, Archive } from 'lucide-vue-next'
import { useTracteurStore } from '../../stores/tracteurs'
import TracteurFormModal from '../../components/fleet/TracteurFormModal.vue'

const router = useRouter()
const store = useTracteurStore()

const filterStatut = ref<string>('')
const searchQuery = ref<string>('')
const showModal = ref(false)
const editId = ref<string | null>(null)

function openCreate() {
  editId.value = null
  showModal.value = true
}

function openEdit(id: string) {
  editId.value = id
  showModal.value = true
}

// KPIs
const kpiTotal = computed(() => store.tracteurs.length)
const kpiEnService = computed(() =>
  store.tracteurs.filter((t) => t.statutAdmin === 'en_service').length
)
const kpiHorsService = computed(() =>
  store.tracteurs.filter((t) => t.statutAdmin === 'hors_service').length
)
const kpiArchives = computed(() =>
  store.tracteurs.filter((t) => t.statutAdmin === 'archive').length
)

// Filtered list
const filteredTracteurs = computed(() => {
  let list = store.tracteurs
  if (filterStatut.value) {
    list = list.filter((t) => t.statutAdmin === filterStatut.value)
  }
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (t) =>
        (t.plaque ?? '').toLowerCase().includes(q) ||
        (t.vin ?? '').toLowerCase().includes(q)
    )
  }
  return list
})

// Navigation
function goToDetail(id: number | string) {
  router.push({ name: 'fleet-tracteur-detail', params: { id } })
}

async function archiver(id: number | string) {
  if (confirm('Archiver ce tracteur ?')) {
    await store.archiverTracteur(id)
  }
}

// Statut admin
function statutAdminLabel(statut: string): string {
  const map: Record<string, string> = {
    en_service: 'En service',
    hors_service: 'Hors service',
    archive: 'Archivé',
  }
  return map[statut] ?? statut
}

function statutAdminClass(statut: string): string {
  const map: Record<string, string> = {
    en_service: 'pill-green',
    hors_service: 'pill-orange',
    archive: 'pill-gray',
  }
  return map[statut] ?? 'pill-gray'
}

// Statut op
function statutOpLabel(statut: string): string {
  const map: Record<string, string> = {
    en_mouvement: 'En mouvement',
    allume_immobile: 'Allumé immobile',
    arrete: 'Arrêté',
    signal_perdu: 'Signal perdu',
  }
  return map[statut] ?? statut ?? '—'
}

function statutOpClass(statut: string): string {
  const map: Record<string, string> = {
    en_mouvement: 'pill-blue',
    allume_immobile: 'pill-yellow',
    arrete: 'pill-gray',
    signal_perdu: 'pill-red',
  }
  return map[statut] ?? 'pill-gray'
}

// Carburant
function fuelBarClass(niveau: number | null | undefined): string {
  const n = niveau ?? 0
  if (n < 20) return 'fuel-red'
  if (n < 40) return 'fuel-orange'
  return 'fuel-green'
}
</script>

<style scoped>
/* ── Layout ── */
.tracteur-list-view {
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

.marque {
  font-weight: 600;
  color: #1e293b;
}

.modele {
  color: #64748b;
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

.pill-yellow {
  background: #fef9c3;
  color: #a16207;
}

.pill-red {
  background: #fee2e2;
  color: #dc2626;
}

/* ── Fuel Bar ── */
.cell-fuel {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fuel-bar-wrap {
  width: 64px;
  height: 7px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.fuel-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.fuel-green { background: #16a34a; }
.fuel-orange { background: #ea580c; }
.fuel-red { background: #dc2626; }

.fuel-label {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
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
