<template>
  <div class="telemetrie-view">
    <div class="page-header">
      <h1>Télémétrie &amp; Diagnostics</h1>
    </div>

    <div class="sim-banner">
      <span class="sim-icon">ℹ</span>
      Données simulées - Connecter le boîtier embarqué pour données réelles
    </div>

    <!-- Tracteur selector -->
    <div class="selector-row">
      <label>Sélectionner un tracteur</label>
      <select v-model="selectedTracteurId">
        <option value="">-- Choisir un tracteur --</option>
        <option v-for="t in tracteurs" :key="t.id" :value="t.id">
          {{ t.plaque }} - {{ t.marque }} {{ t.modele }}
        </option>
      </select>
    </div>

    <!-- Metric cards -->
    <div v-if="currentData" class="cards-grid">
      <!-- Kilométrage -->
      <div class="metric-card">
        <div class="card-icon km-icon">⊙</div>
        <div class="card-body">
          <div class="card-label">Kilométrage</div>
          <div class="card-value">{{ currentData.kilometrage.toLocaleString('fr-FR') }} km</div>
        </div>
      </div>

      <!-- Carburant -->
      <div class="metric-card">
        <div class="card-icon fuel-icon">⛽</div>
        <div class="card-body">
          <div class="card-label">Niveau carburant</div>
          <div class="card-value">{{ currentData.niveauCarburant }}%</div>
          <div class="progress-bar-bg">
            <div
              class="progress-bar-fill"
              :class="fuelClass(currentData.niveauCarburant)"
              :style="{ width: currentData.niveauCarburant + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <!-- État moteur -->
      <div class="metric-card">
        <div class="card-icon engine-icon">⚙</div>
        <div class="card-body">
          <div class="card-label">État moteur</div>
          <span class="badge" :class="currentData.etatMoteur ? 'badge-on' : 'badge-off'">
            {{ currentData.etatMoteur ? 'EN MARCHE' : 'ARRÊTÉ' }}
          </span>
        </div>
      </div>

      <!-- Code défaut -->
      <div class="metric-card">
        <div class="card-icon defaut-icon">🔧</div>
        <div class="card-body">
          <div class="card-label">Code défaut</div>
          <div v-if="currentData.codeDefaut" class="defaut-alert">
            <span class="badge badge-warn">⚠ {{ currentData.codeDefaut }}</span>
          </div>
          <div v-else class="defaut-ok">
            <span class="badge badge-ok">✓ Aucun défaut</span>
          </div>
        </div>
      </div>

      <!-- Dernière mesure -->
      <div class="metric-card">
        <div class="card-icon ts-icon">🕐</div>
        <div class="card-body">
          <div class="card-label">Dernière mesure</div>
          <div class="card-value card-value-sm">{{ formatDateTime(currentData.derniereMAJ) }}</div>
        </div>
      </div>

      <!-- Signal -->
      <div class="metric-card">
        <div class="card-icon signal-icon">📡</div>
        <div class="card-body">
          <div class="card-label">Signal</div>
          <div v-if="currentData.signalOk">
            <span class="badge badge-ok">✓ Signal OK</span>
          </div>
          <div v-else class="signal-lost">
            <span class="badge badge-error">✗ Signal perdu depuis {{ currentData.signalPerduDepuis }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="selectedTracteurId === ''" class="empty-state">
      Sélectionnez un tracteur pour afficher les données de télémétrie.
    </div>

    <!-- Last 5 readings table -->
    <div v-if="currentHistory.length > 0" class="history-section">
      <h2>Dernières mesures</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Horodatage</th>
              <th>Kilométrage</th>
              <th>Carburant</th>
              <th>Moteur</th>
              <th>Code défaut</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in currentHistory" :key="idx">
              <td>{{ formatDateTime(row.timestamp) }}</td>
              <td>{{ row.kilometrage.toLocaleString('fr-FR') }} km</td>
              <td>
                <div class="inline-fuel">
                  <div class="progress-bar-bg small">
                    <div
                      class="progress-bar-fill"
                      :class="fuelClass(row.niveauCarburant)"
                      :style="{ width: row.niveauCarburant + '%' }"
                    ></div>
                  </div>
                  <span>{{ row.niveauCarburant }}%</span>
                </div>
              </td>
              <td>
                <span class="badge" :class="row.etatMoteur ? 'badge-on' : 'badge-off'">
                  {{ row.etatMoteur ? 'Marche' : 'Arrêt' }}
                </span>
              </td>
              <td>
                <span v-if="row.codeDefaut" class="badge badge-warn">{{ row.codeDefaut }}</span>
                <span v-else class="badge badge-ok">OK</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface TracteurOption {
  id: string
  plaque: string
  marque: string
  modele: string
}

interface TelemetrieRecord {
  timestamp: string
  kilometrage: number
  niveauCarburant: number
  etatMoteur: boolean
  codeDefaut: string | null
}

interface TelemetrieVehicule {
  tracteurId: string
  kilometrage: number
  niveauCarburant: number
  etatMoteur: boolean
  codeDefaut: string | null
  derniereMAJ: string
  signalOk: boolean
  signalPerduDepuis: string
  historique: TelemetrieRecord[]
}

const tracteurs: TracteurOption[] = [
  { id: 'TRC-001', plaque: '1234 TAN A', marque: 'Volvo', modele: 'FH 460' },
  { id: 'TRC-002', plaque: '2345 TNR B', marque: 'Mercedes', modele: 'Actros 1845' },
  { id: 'TRC-003', plaque: '3456 TNR C', marque: 'MAN', modele: 'TGX 18.440' },
  { id: 'TRC-004', plaque: '4567 TNR D', marque: 'Scania', modele: 'R 450' },
  { id: 'TRC-005', plaque: '5678 TNR E', marque: 'Iveco', modele: 'Stralis 460' },
]

const mockTelemetrie: Record<string, TelemetrieVehicule> = {
  'TRC-001': {
    tracteurId: 'TRC-001',
    kilometrage: 312450,
    niveauCarburant: 72,
    etatMoteur: true,
    codeDefaut: null,
    derniereMAJ: '2026-06-29T07:42:00',
    signalOk: true,
    signalPerduDepuis: '',
    historique: [
      { timestamp: '2026-06-29T07:42:00', kilometrage: 312450, niveauCarburant: 72, etatMoteur: true, codeDefaut: null },
      { timestamp: '2026-06-29T06:30:00', kilometrage: 312380, niveauCarburant: 76, etatMoteur: true, codeDefaut: null },
      { timestamp: '2026-06-29T05:15:00', kilometrage: 312290, niveauCarburant: 80, etatMoteur: true, codeDefaut: null },
      { timestamp: '2026-06-28T18:00:00', kilometrage: 312100, niveauCarburant: 85, etatMoteur: false, codeDefaut: null },
      { timestamp: '2026-06-28T12:30:00', kilometrage: 311850, niveauCarburant: 91, etatMoteur: true, codeDefaut: null },
    ],
  },
  'TRC-002': {
    tracteurId: 'TRC-002',
    kilometrage: 198700,
    niveauCarburant: 28,
    etatMoteur: false,
    codeDefaut: 'P0401 - EGR insuffisant',
    derniereMAJ: '2026-06-29T06:00:00',
    signalOk: true,
    signalPerduDepuis: '',
    historique: [
      { timestamp: '2026-06-29T06:00:00', kilometrage: 198700, niveauCarburant: 28, etatMoteur: false, codeDefaut: 'P0401 - EGR insuffisant' },
      { timestamp: '2026-06-28T20:00:00', kilometrage: 198580, niveauCarburant: 35, etatMoteur: true, codeDefaut: 'P0401 - EGR insuffisant' },
      { timestamp: '2026-06-28T14:00:00', kilometrage: 198420, niveauCarburant: 45, etatMoteur: true, codeDefaut: null },
      { timestamp: '2026-06-28T08:00:00', kilometrage: 198200, niveauCarburant: 55, etatMoteur: true, codeDefaut: null },
      { timestamp: '2026-06-27T18:00:00', kilometrage: 197900, niveauCarburant: 65, etatMoteur: false, codeDefaut: null },
    ],
  },
  'TRC-003': {
    tracteurId: 'TRC-003',
    kilometrage: 245100,
    niveauCarburant: 55,
    etatMoteur: false,
    codeDefaut: null,
    derniereMAJ: '2026-06-28T22:10:00',
    signalOk: false,
    signalPerduDepuis: '9h',
    historique: [
      { timestamp: '2026-06-28T22:10:00', kilometrage: 245100, niveauCarburant: 55, etatMoteur: false, codeDefaut: null },
      { timestamp: '2026-06-28T16:00:00', kilometrage: 244900, niveauCarburant: 60, etatMoteur: true, codeDefaut: null },
      { timestamp: '2026-06-28T10:00:00', kilometrage: 244650, niveauCarburant: 68, etatMoteur: true, codeDefaut: null },
      { timestamp: '2026-06-28T04:00:00', kilometrage: 244300, niveauCarburant: 80, etatMoteur: true, codeDefaut: null },
      { timestamp: '2026-06-27T22:00:00', kilometrage: 244000, niveauCarburant: 90, etatMoteur: false, codeDefaut: null },
    ],
  },
  'TRC-004': {
    tracteurId: 'TRC-004',
    kilometrage: 178320,
    niveauCarburant: 15,
    etatMoteur: true,
    codeDefaut: 'U0100 - Perte comm. ECU',
    derniereMAJ: '2026-06-29T07:55:00',
    signalOk: true,
    signalPerduDepuis: '',
    historique: [
      { timestamp: '2026-06-29T07:55:00', kilometrage: 178320, niveauCarburant: 15, etatMoteur: true, codeDefaut: 'U0100 - Perte comm. ECU' },
      { timestamp: '2026-06-29T05:00:00', kilometrage: 178200, niveauCarburant: 22, etatMoteur: true, codeDefaut: 'U0100 - Perte comm. ECU' },
      { timestamp: '2026-06-28T20:00:00', kilometrage: 177950, niveauCarburant: 30, etatMoteur: false, codeDefaut: null },
      { timestamp: '2026-06-28T14:00:00', kilometrage: 177700, niveauCarburant: 40, etatMoteur: true, codeDefaut: null },
      { timestamp: '2026-06-28T08:00:00', kilometrage: 177400, niveauCarburant: 50, etatMoteur: true, codeDefaut: null },
    ],
  },
  'TRC-005': {
    tracteurId: 'TRC-005',
    kilometrage: 99800,
    niveauCarburant: 88,
    etatMoteur: false,
    codeDefaut: null,
    derniereMAJ: '2026-06-29T08:05:00',
    signalOk: true,
    signalPerduDepuis: '',
    historique: [
      { timestamp: '2026-06-29T08:05:00', kilometrage: 99800, niveauCarburant: 88, etatMoteur: false, codeDefaut: null },
      { timestamp: '2026-06-29T06:00:00', kilometrage: 99750, niveauCarburant: 90, etatMoteur: false, codeDefaut: null },
      { timestamp: '2026-06-28T18:00:00', kilometrage: 99600, niveauCarburant: 93, etatMoteur: true, codeDefaut: null },
      { timestamp: '2026-06-28T12:00:00', kilometrage: 99400, niveauCarburant: 96, etatMoteur: true, codeDefaut: null },
      { timestamp: '2026-06-28T06:00:00', kilometrage: 99100, niveauCarburant: 100, etatMoteur: true, codeDefaut: null },
    ],
  },
}

const selectedTracteurId = ref('')

const currentData = computed<TelemetrieVehicule | null>(() => {
  if (!selectedTracteurId.value) return null
  return mockTelemetrie[selectedTracteurId.value] ?? null
})

const currentHistory = computed<TelemetrieRecord[]>(() => {
  return currentData.value?.historique ?? []
})

function formatDateTime(dt: string): string {
  return new Date(dt).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fuelClass(pct: number): string {
  if (pct <= 20) return 'fuel-low'
  if (pct <= 40) return 'fuel-mid'
  return 'fuel-ok'
}
</script>

<style scoped>
.telemetrie-view {
  padding: 24px;
  font-family: inherit;
}

.page-header {
  margin-bottom: 16px;
}

.page-header h1 {
  font-size: 1.6rem;
  font-weight: 700;
  color: #1a1a2e;
}

.sim-banner {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 7px;
  padding: 10px 16px;
  font-size: 0.85rem;
  color: #0369a1;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sim-icon {
  font-weight: 700;
  font-size: 1rem;
}

.selector-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}

.selector-row label {
  font-weight: 600;
  color: #475569;
  font-size: 0.92rem;
  white-space: nowrap;
}

.selector-row select {
  padding: 9px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  font-size: 0.92rem;
  min-width: 280px;
  background: #fff;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.metric-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 18px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.card-icon {
  font-size: 1.6rem;
  width: 40px;
  text-align: center;
  flex-shrink: 0;
}

.card-body {
  flex: 1;
}

.card-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}

.card-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1e293b;
}

.card-value-sm {
  font-size: 1rem;
}

.progress-bar-bg {
  background: #e2e8f0;
  border-radius: 4px;
  height: 8px;
  overflow: hidden;
  margin-top: 8px;
}

.progress-bar-bg.small {
  height: 6px;
  min-width: 80px;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.fuel-ok { background: #22c55e; }
.fuel-mid { background: #f59e0b; }
.fuel-low { background: #ef4444; }

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.badge-on { background: #dcfce7; color: #166534; }
.badge-off { background: #f1f5f9; color: #64748b; }
.badge-ok { background: #dcfce7; color: #166534; }
.badge-warn { background: #fef3c7; color: #92400e; }
.badge-error { background: #fee2e2; color: #991b1b; }

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 60px 20px;
  font-size: 1rem;
}

.history-section h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e3a8a;
  margin-bottom: 12px;
}

.table-container {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

thead th {
  background: #1a1a2e;
  color: #fff;
  padding: 10px 14px;
  text-align: left;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

tbody tr {
  border-bottom: 1px solid #f1f5f9;
}

tbody tr:last-child {
  border-bottom: none;
}

tbody td {
  padding: 10px 14px;
  color: #334155;
}

.inline-fuel {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
