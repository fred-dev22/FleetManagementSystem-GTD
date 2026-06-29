<template>
  <div class="trajets-view">
    <div class="page-header">
      <h1>Historique des Trajets</h1>
      <button class="btn-export" @click="exportCSV">
        <span class="icon">⬇</span> Exporter CSV
      </button>
    </div>

    <!-- Filter bar -->
    <div class="filter-bar">
      <div class="filter-group">
        <label>Tracteur</label>
        <select v-model="filterTracteur">
          <option value="">Tous les tracteurs</option>
          <option v-for="t in tracteurOptions" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Du</label>
        <input type="date" v-model="filterDateFrom" />
      </div>
      <div class="filter-group">
        <label>Au</label>
        <input type="date" v-model="filterDateTo" />
      </div>
      <div class="filter-group">
        <label>Site traversé</label>
        <input type="text" v-model="filterSite" placeholder="Rechercher un site..." />
      </div>
      <button class="btn-reset" @click="resetFilters">Réinitialiser</button>
    </div>

    <!-- Results table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Tracteur</th>
            <th>Chauffeur</th>
            <th>Début</th>
            <th>Fin</th>
            <th>Distance</th>
            <th>Sites traversés</th>
            <th>Durée</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="trajet in filteredTrajets"
            :key="trajet.id"
            :class="{ selected: selectedTrajet?.id === trajet.id }"
            @click="selectTrajet(trajet)"
            style="cursor: pointer;"
          >
            <td><strong>{{ trajet.tracteurPlaque }}</strong></td>
            <td>{{ trajet.chauffeurNom }}</td>
            <td>{{ formatDateTime(trajet.dateDebut) }}</td>
            <td>{{ formatDateTime(trajet.dateFin) }}</td>
            <td>{{ trajet.distance }} km</td>
            <td>
              <span
                v-for="site in trajet.sitesTraverses"
                :key="site"
                class="badge-site"
              >{{ site }}</span>
            </td>
            <td>{{ computeDuree(trajet.dateDebut, trajet.dateFin) }}</td>
          </tr>
          <tr v-if="filteredTrajets.length === 0">
            <td colspan="7" class="empty-row">Aucun trajet trouvé pour les filtres sélectionnés.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detail panel -->
    <div v-if="selectedTrajet" class="detail-panel">
      <div class="detail-header">
        <h2>Détail du trajet — {{ selectedTrajet.tracteurPlaque }}</h2>
        <button class="btn-close" @click="selectedTrajet = null">✕ Fermer</button>
      </div>
      <div class="detail-body">
        <div class="map-placeholder">
          <div class="map-inner">
            <span class="map-icon">🗺</span>
            <p>Carte GPS non disponible</p>
            <p class="map-sub">Connecter le service cartographique pour afficher le tracé</p>
          </div>
        </div>
        <div class="waypoints">
          <h3>Points GPS principaux</h3>
          <div class="meta-row">
            <span><strong>Chauffeur :</strong> {{ selectedTrajet.chauffeurNom }}</span>
            <span><strong>Distance :</strong> {{ selectedTrajet.distance }} km</span>
            <span><strong>Durée :</strong> {{ computeDuree(selectedTrajet.dateDebut, selectedTrajet.dateFin) }}</span>
          </div>
          <ol class="waypoint-list">
            <li v-for="(wp, idx) in getWaypoints(selectedTrajet)" :key="idx">
              <span class="wp-time">{{ wp.time }}</span>
              <span class="wp-label">{{ wp.label }}</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Trajet {
  id: string
  tracteurId: string
  tracteurPlaque: string
  chauffeurNom: string
  dateDebut: string
  dateFin: string
  distance: number
  sitesTraverses: string[]
}

const mockTrajets: Trajet[] = [
  {
    id: 'TRJ-001',
    tracteurId: 'TRC-001',
    tracteurPlaque: '1234 TAN A',
    chauffeurNom: 'Rakoto Jean',
    dateDebut: '2026-06-20T06:15:00',
    dateFin: '2026-06-20T14:30:00',
    distance: 312,
    sitesTraverses: ['TNR', 'AMBATONDRAZAKA', 'TOAMASINA'],
  },
  {
    id: 'TRJ-002',
    tracteurId: 'TRC-002',
    tracteurPlaque: '2345 TNR B',
    chauffeurNom: 'Andriantsoa Paul',
    dateDebut: '2026-06-21T05:00:00',
    dateFin: '2026-06-21T17:45:00',
    distance: 487,
    sitesTraverses: ['TNR', 'ANTSIRABE', 'FIANARANTSOA'],
  },
  {
    id: 'TRJ-003',
    tracteurId: 'TRC-003',
    tracteurPlaque: '3456 TNR C',
    chauffeurNom: 'Razafy Michel',
    dateDebut: '2026-06-22T07:30:00',
    dateFin: '2026-06-22T12:10:00',
    distance: 178,
    sitesTraverses: ['TNR', 'MAHITSY', 'MIARINARIVO'],
  },
  {
    id: 'TRJ-004',
    tracteurId: 'TRC-001',
    tracteurPlaque: '1234 TAN A',
    chauffeurNom: 'Rakoto Jean',
    dateDebut: '2026-06-23T04:45:00',
    dateFin: '2026-06-23T16:20:00',
    distance: 524,
    sitesTraverses: ['TOAMASINA', 'BRICKAVILLE', 'MORAMANGA', 'TNR'],
  },
  {
    id: 'TRJ-005',
    tracteurId: 'TRC-004',
    tracteurPlaque: '4567 TNR D',
    chauffeurNom: 'Rasolofo Hery',
    dateDebut: '2026-06-24T06:00:00',
    dateFin: '2026-06-24T19:30:00',
    distance: 601,
    sitesTraverses: ['TNR', 'MIANDRIVAZO', 'MORONDAVA'],
  },
  {
    id: 'TRJ-006',
    tracteurId: 'TRC-005',
    tracteurPlaque: '5678 TNR E',
    chauffeurNom: 'Randria Luc',
    dateDebut: '2026-06-25T08:00:00',
    dateFin: '2026-06-25T11:50:00',
    distance: 142,
    sitesTraverses: ['TNR', 'AMBOHIDRATRIMO', 'IVATO'],
  },
  {
    id: 'TRJ-007',
    tracteurId: 'TRC-002',
    tracteurPlaque: '2345 TNR B',
    chauffeurNom: 'Andriantsoa Paul',
    dateDebut: '2026-06-26T05:30:00',
    dateFin: '2026-06-26T14:00:00',
    distance: 396,
    sitesTraverses: ['FIANARANTSOA', 'IHOSY', 'TOLIARA'],
  },
  {
    id: 'TRJ-008',
    tracteurId: 'TRC-003',
    tracteurPlaque: '3456 TNR C',
    chauffeurNom: 'Razafy Michel',
    dateDebut: '2026-06-27T07:00:00',
    dateFin: '2026-06-27T10:45:00',
    distance: 165,
    sitesTraverses: ['TNR', 'ANJOZOROBE'],
  },
]

const filterTracteur = ref('')
const filterDateFrom = ref('')
const filterDateTo = ref('')
const filterSite = ref('')
const selectedTrajet = ref<Trajet | null>(null)

const tracteurOptions = computed(() => {
  return [...new Set(mockTrajets.map((t) => t.tracteurPlaque))].sort()
})

const filteredTrajets = computed(() => {
  return mockTrajets.filter((t) => {
    if (filterTracteur.value && t.tracteurPlaque !== filterTracteur.value) return false
    if (filterDateFrom.value && t.dateDebut < filterDateFrom.value) return false
    if (filterDateTo.value && t.dateFin > filterDateTo.value + 'T23:59:59') return false
    if (filterSite.value) {
      const q = filterSite.value.toLowerCase()
      if (!t.sitesTraverses.some((s) => s.toLowerCase().includes(q))) return false
    }
    return true
  })
})

function formatDateTime(dt: string): string {
  const d = new Date(dt)
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function computeDuree(debut: string, fin: string): string {
  const diff = new Date(fin).getTime() - new Date(debut).getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return `${h}h ${m.toString().padStart(2, '0')}min`
}

function selectTrajet(t: Trajet) {
  selectedTrajet.value = selectedTrajet.value?.id === t.id ? null : t
}

function resetFilters() {
  filterTracteur.value = ''
  filterDateFrom.value = ''
  filterDateTo.value = ''
  filterSite.value = ''
}

function getWaypoints(t: Trajet) {
  const depart = new Date(t.dateDebut)
  const arrive = new Date(t.dateFin)
  const total = arrive.getTime() - depart.getTime()
  const sites = t.sitesTraverses

  return sites.map((site, idx) => {
    const ratio = idx / (sites.length - 1 || 1)
    const ts = new Date(depart.getTime() + ratio * total)
    return {
      time: ts.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      label: site,
    }
  })
}

function exportCSV() {
  const headers = ['ID', 'Tracteur', 'Chauffeur', 'Début', 'Fin', 'Distance (km)', 'Sites traversés', 'Durée']
  const rows = filteredTrajets.value.map((t) => [
    t.id,
    t.tracteurPlaque,
    t.chauffeurNom,
    t.dateDebut,
    t.dateFin,
    t.distance,
    t.sitesTraverses.join(' | '),
    computeDuree(t.dateDebut, t.dateFin),
  ])
  const csv = [headers, ...rows].map((r) => r.join(';')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'trajets_gtd.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.trajets-view {
  padding: 24px;
  font-family: inherit;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 1.6rem;
  font-weight: 700;
  color: #1a1a2e;
}

.btn-export {
  background: #16213e;
  color: #fff;
  border: none;
  padding: 8px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-export:hover {
  background: #0f3460;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  background: #f8f9fc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 160px;
}

.filter-group label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.filter-group select,
.filter-group input {
  padding: 7px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.9rem;
  background: #fff;
}

.btn-reset {
  background: #e2e8f0;
  border: none;
  padding: 7px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.88rem;
  color: #475569;
  align-self: flex-end;
}

.btn-reset:hover {
  background: #cbd5e1;
}

.table-container {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

thead th {
  background: #1a1a2e;
  color: #fff;
  padding: 12px 14px;
  text-align: left;
  font-weight: 600;
  font-size: 0.83rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

tbody tr {
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s;
}

tbody tr:hover {
  background: #f0f4ff;
}

tbody tr.selected {
  background: #dbeafe;
}

tbody td {
  padding: 11px 14px;
  color: #334155;
}

.empty-row {
  text-align: center;
  color: #94a3b8;
  padding: 32px !important;
}

.badge-site {
  display: inline-block;
  background: #e0f2fe;
  color: #0369a1;
  border-radius: 4px;
  padding: 2px 7px;
  font-size: 0.78rem;
  font-weight: 600;
  margin-right: 4px;
  margin-bottom: 2px;
}

/* Detail panel */
.detail-panel {
  margin-top: 24px;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  background: #f8fbff;
  overflow: hidden;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #1e3a8a;
  color: #fff;
  padding: 14px 20px;
}

.detail-header h2 {
  font-size: 1rem;
  font-weight: 600;
}

.btn-close {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  padding: 5px 12px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.88rem;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.detail-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

.map-placeholder {
  background: #e2eaf8;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #bfdbfe;
}

.map-inner {
  text-align: center;
  color: #64748b;
}

.map-icon {
  font-size: 3rem;
}

.map-inner p {
  margin: 8px 0 0;
  font-weight: 600;
  font-size: 0.95rem;
}

.map-sub {
  font-size: 0.8rem !important;
  font-weight: normal !important;
  color: #94a3b8;
}

.waypoints {
  padding: 20px;
}

.waypoints h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e3a8a;
  margin-bottom: 12px;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 0.85rem;
  color: #475569;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.waypoint-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.waypoint-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px dashed #e2e8f0;
  font-size: 0.88rem;
}

.waypoint-list li:last-child {
  border-bottom: none;
}

.wp-time {
  color: #64748b;
  font-size: 0.8rem;
  min-width: 48px;
}

.wp-label {
  font-weight: 600;
  color: #1e3a8a;
}

@media (max-width: 768px) {
  .detail-body {
    grid-template-columns: 1fr;
  }
  .map-placeholder {
    border-right: none;
    border-bottom: 1px solid #bfdbfe;
  }
}
</style>
