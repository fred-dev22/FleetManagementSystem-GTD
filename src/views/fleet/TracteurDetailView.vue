<template>
  <div class="tracteur-detail">
    <!-- Not found -->
    <div v-if="!tracteur" class="not-found">
      <div class="not-found-card">
        <span class="not-found-icon">🚛</span>
        <h2>Tracteur introuvable</h2>
        <p>Le tracteur demandé n'existe pas ou a été supprimé.</p>
        <RouterLink to="/fleet" class="btn btn-primary">Retour à la flotte</RouterLink>
      </div>
    </div>

    <template v-else>
      <!-- ── HEADER ─────────────────────────────────────────── -->
      <div class="detail-header">
        <div class="header-left">
          <RouterLink to="/fleet" class="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Flotte
          </RouterLink>
          <div class="vehicle-identity">
            <div class="plaque-display">{{ tracteur.plaque }}</div>
            <div class="vehicle-title">
              <h1>{{ tracteur.marque }} {{ tracteur.modele }}</h1>
              <span class="vin-badge">VIN: {{ tracteur.vin }}</span>
            </div>
          </div>
          <div class="status-pills">
            <span class="pill pill-admin" :class="statutAdminClass">
              {{ statutAdminLabel }}
            </span>
            <span v-if="tracteur.statutOp" class="pill pill-op" :class="statutOpClass">
              <span class="pill-dot"></span>
              {{ statutOpLabel }}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Modifier
          </button>
          <button class="btn btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            Changer plaque
          </button>
          <button class="btn btn-danger" @click="handleArchiver">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
            Archiver
          </button>
        </div>
      </div>

      <!-- ── 2-COLUMN GRID ─────────────────────────────────── -->
      <div class="sections-grid">

        <!-- Section 1: Informations véhicule -->
        <section class="card section-info">
          <h2 class="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Informations véhicule
          </h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">VIN</span>
              <span class="info-value mono">{{ tracteur.vin }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Plaque</span>
              <span class="info-value plaque-inline">{{ tracteur.plaque }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Marque</span>
              <span class="info-value">{{ tracteur.marque }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Modèle</span>
              <span class="info-value">{{ tracteur.modele }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Mise en circulation</span>
              <span class="info-value">{{ formatDate(tracteur.dateMiseEnCirculation) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Kilométrage</span>
              <span class="info-value">{{ formatKm(tracteur.kilometrage) }}</span>
            </div>
          </div>
        </section>

        <!-- Section 2: État actuel -->
        <section class="card section-etat">
          <h2 class="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            État actuel
          </h2>

          <!-- Carburant -->
          <div class="etat-block">
            <div class="etat-label-row">
              <span class="etat-label">Carburant</span>
              <span class="carburant-pct" :class="carburantClass">{{ tracteur.niveauCarburant ?? 0 }} %</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" :class="carburantClass" :style="{ width: (tracteur.niveauCarburant ?? 0) + '%' }"></div>
            </div>
          </div>

          <!-- Chauffeur -->
          <div class="etat-block">
            <span class="etat-label">Chauffeur affecté</span>
            <div v-if="tracteur.chauffeurId" class="etat-value-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <RouterLink :to="`/hr/employees/${tracteur.chauffeurId}`" class="driver-link">
                {{ tracteur.chauffeurNom }}
              </RouterLink>
            </div>
            <span v-else class="badge badge-neutral">Non assigné</span>
          </div>

          <!-- Remorque -->
          <div class="etat-block">
            <span class="etat-label">Remorque attelée</span>
            <div v-if="tracteur.remorqueId" class="etat-value-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="8" width="20" height="8" rx="2"/><path d="M6 16v2M18 16v2"/></svg>
              <span class="remorque-id">{{ tracteur.remorqueId }}</span>
              <span class="remorque-plaque">· {{ tracteur.remorquePlaque }}</span>
            </div>
            <span v-else class="badge badge-neutral">Aucune</span>
          </div>

          <!-- Position GPS -->
          <div class="etat-block">
            <span class="etat-label">Dernière position</span>
            <div v-if="tracteur.position" class="position-block">
              <div class="position-coords">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 14 8 14s8-8.75 8-14a8 8 0 0 0-8-8z"/></svg>
                {{ tracteur.position.lat.toFixed(5) }}, {{ tracteur.position.lng.toFixed(5) }}
              </div>
              <div class="position-time">{{ formatDateTime(tracteur.position.horodatage) }}</div>
            </div>
            <span v-else class="badge badge-neutral">Position inconnue</span>
          </div>
        </section>

        <!-- Section 3: Attelages -->
        <section class="card section-attelages">
          <h2 class="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
            Historique des attelages
          </h2>
          <div v-if="attelages.length === 0" class="empty-state">
            <span>Aucun attelage enregistré</span>
          </div>
          <div v-else class="timeline">
            <div
              v-for="att in attelages"
              :key="att.id"
              class="timeline-item"
              :class="{ 'timeline-active': !att.dateFin }"
            >
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-id">{{ att.id }}</span>
                  <span v-if="!att.dateFin" class="badge badge-active">Actuel</span>
                  <span v-else class="badge badge-closed">Terminé</span>
                </div>
                <div class="timeline-remorque">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="8" width="20" height="8" rx="2"/><path d="M6 16v2M18 16v2"/></svg>
                  {{ att.remorquePlaque }} <span class="dim">{{ att.remorqueId }}</span>
                </div>
                <div class="timeline-dates">
                  <span>{{ formatDate(att.dateDebut) }}</span>
                  <span v-if="att.dateFin"> → {{ formatDate(att.dateFin) }}</span>
                  <span v-else class="dim"> → en cours</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 4: Documents -->
        <section class="card section-documents">
          <h2 class="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Documents
          </h2>
          <div v-if="documents.length === 0" class="empty-state">
            <span>Aucun document enregistré</span>
          </div>
          <div v-else class="doc-table-wrap">
            <table class="doc-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Numéro</th>
                  <th>Émission</th>
                  <th>Expiration</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="doc in documents" :key="doc.id" :class="docRowClass(doc)">
                  <td class="doc-type">{{ doc.typeDocument }}</td>
                  <td class="mono dim">{{ doc.numero }}</td>
                  <td>{{ formatDate(doc.dateEmission) }}</td>
                  <td :class="docExpClass(doc)">{{ formatDate(doc.dateExpiration) }}</td>
                  <td>
                    <span class="badge" :class="docBadgeClass(doc)">{{ docBadgeLabel(doc) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div><!-- end sections-grid -->

      <!-- ── HISTORIQUE PLAQUES ─────────────────────────────── -->
      <section v-if="historiquePlaques.length > 0" class="card section-plaques">
        <h2 class="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          Historique des plaques
        </h2>
        <div class="doc-table-wrap">
          <table class="doc-table">
            <thead>
              <tr>
                <th>Ancienne plaque</th>
                <th>Nouvelle plaque</th>
                <th>Date de changement</th>
                <th>Par</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(h, i) in historiquePlaques" :key="i">
                <td class="plaque-inline old">{{ h.anciennePlaque }}</td>
                <td class="plaque-inline">{{ h.nouvellePlaque }}</td>
                <td>{{ formatDateTime(h.dateChangement) }}</td>
                <td class="dim">{{ h.parUserId }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useTracteurStore } from '@/stores/tracteurs'
import { useAttelagesStore } from '@/stores/attelages'
import { useAffectationsChauffeursStore } from '@/stores/affectationsChauffeurs'
import { useDocumentsVehiculesStore } from '@/stores/documentsVehicules'
import type { DocumentVehicule } from '@/types/index'

// ── Route ────────────────────────────────────────────────────────
const route = useRoute()
const id = computed(() => route.params.id as string)

// ── Stores ───────────────────────────────────────────────────────
const tracteurStore = useTracteurStore()
const attelageStore = useAttelagesStore()
const affectationsStore = useAffectationsChauffeursStore()
const documentsStore = useDocumentsVehiculesStore()

// ── Data ─────────────────────────────────────────────────────────
const tracteur = computed(() => tracteurStore.getTracteurById(id.value))

const attelages = computed(() =>
  attelageStore.historiqueParTracteur(id.value)
)

const documents = computed(() =>
  documentsStore.getDocsByVehicule(id.value, 'tracteur')
)

const historiquePlaques = computed(() =>
  tracteur.value?.historiquePlayque ?? []
)

// ── Status helpers ───────────────────────────────────────────────
const statutAdminLabel = computed(() => {
  const map: Record<string, string> = {
    en_service: 'En service',
    hors_service: 'Hors service',
    archive: 'Archivé',
  }
  return map[tracteur.value?.statutAdmin ?? ''] ?? tracteur.value?.statutAdmin ?? '—'
})

const statutAdminClass = computed(() => {
  const map: Record<string, string> = {
    en_service: 'pill-green',
    hors_service: 'pill-orange',
    archive: 'pill-gray',
  }
  return map[tracteur.value?.statutAdmin ?? ''] ?? 'pill-gray'
})

const statutOpLabel = computed(() => {
  const map: Record<string, string> = {
    en_mouvement: 'En mouvement',
    allume_immobile: 'Allumé / Immobile',
    arrete: 'Arrêté',
    signal_perdu: 'Signal perdu',
  }
  return map[tracteur.value?.statutOp ?? ''] ?? tracteur.value?.statutOp ?? '—'
})

const statutOpClass = computed(() => {
  const map: Record<string, string> = {
    en_mouvement: 'pill-blue',
    allume_immobile: 'pill-yellow',
    arrete: 'pill-gray',
    signal_perdu: 'pill-red',
  }
  return map[tracteur.value?.statutOp ?? ''] ?? 'pill-gray'
})

// ── Carburant ────────────────────────────────────────────────────
const carburantClass = computed(() => {
  const lvl = tracteur.value?.niveauCarburant ?? 0
  if (lvl <= 15) return 'fuel-critical'
  if (lvl <= 30) return 'fuel-low'
  if (lvl <= 60) return 'fuel-medium'
  return 'fuel-ok'
})

// ── Document helpers ─────────────────────────────────────────────
const TODAY = new Date('2026-06-28')

function docStatus(doc: DocumentVehicule): 'expired' | 'soon' | 'ok' {
  const exp = new Date(doc.dateExpiration)
  if (exp < TODAY) return 'expired'
  const diff = (exp.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24)
  if (diff <= 30) return 'soon'
  return 'ok'
}

function docRowClass(doc: DocumentVehicule): string {
  const s = docStatus(doc)
  if (s === 'expired') return 'row-expired'
  if (s === 'soon') return 'row-soon'
  return ''
}

function docExpClass(doc: DocumentVehicule): string {
  const s = docStatus(doc)
  if (s === 'expired') return 'text-red'
  if (s === 'soon') return 'text-orange'
  return ''
}

function docBadgeClass(doc: DocumentVehicule): string {
  const s = docStatus(doc)
  if (s === 'expired') return 'badge-expired'
  if (s === 'soon') return 'badge-soon'
  return 'badge-ok'
}

function docBadgeLabel(doc: DocumentVehicule): string {
  const s = docStatus(doc)
  if (s === 'expired') return 'Expiré'
  if (s === 'soon') return 'Expire bientôt'
  return 'Valide'
}

// ── Actions ──────────────────────────────────────────────────────
function handleArchiver() {
  if (!tracteur.value) return
  if (confirm(`Archiver le tracteur ${tracteur.value.plaque} ?`)) {
    tracteurStore.archiverTracteur(id.value)
  }
}

// ── Format helpers ───────────────────────────────────────────────
function formatDate(d?: string): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(d?: string): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatKm(km?: number): string {
  if (km == null) return '—'
  return km.toLocaleString('fr-FR') + ' km'
}
</script>

<style scoped>
/* ── Variables ─────────────────────────────────────────────────── */
:root {
  --gtd-blue: #1a56db;
  --gtd-blue-light: #e8f0fe;
  --gtd-blue-mid: #3b82f6;
}

/* ── Layout ────────────────────────────────────────────────────── */
.tracteur-detail {
  padding: 24px 32px;
  max-width: 1280px;
  margin: 0 auto;
  font-family: 'Inter', system-ui, sans-serif;
  color: #1e293b;
}

/* ── Not found ─────────────────────────────────────────────────── */
.not-found {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}
.not-found-card {
  text-align: center;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 48px 64px;
}
.not-found-icon { font-size: 48px; display: block; margin-bottom: 16px; }
.not-found-card h2 { margin: 0 0 8px; font-size: 20px; }
.not-found-card p { color: #64748b; margin: 0 0 24px; }

/* ── Header ────────────────────────────────────────────────────── */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.header-left { display: flex; flex-direction: column; gap: 12px; }

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: color 0.15s;
}
.back-link:hover { color: #1a56db; }

.vehicle-identity { display: flex; align-items: center; gap: 20px; }

.plaque-display {
  background: #1e293b;
  color: #fbbf24;
  font-family: 'Courier New', monospace;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 2px;
  padding: 10px 20px;
  border-radius: 8px;
  border: 3px solid #fbbf24;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  white-space: nowrap;
}

.vehicle-title h1 {
  margin: 0 0 4px;
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
}

.vin-badge {
  font-size: 12px;
  color: #94a3b8;
  font-family: 'Courier New', monospace;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-pills { display: flex; gap: 8px; flex-wrap: wrap; }

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}
.pill-dot {
  width: 7px; height: 7px; border-radius: 50%; background: currentColor; opacity: 0.8;
}

.pill-green  { background: #dcfce7; color: #166534; }
.pill-orange { background: #ffedd5; color: #9a3412; }
.pill-gray   { background: #f1f5f9; color: #475569; }
.pill-blue   { background: #dbeafe; color: #1e40af; }
.pill-yellow { background: #fef9c3; color: #854d0e; }
.pill-red    { background: #fee2e2; color: #991b1b; }

.header-actions { display: flex; gap: 10px; align-items: flex-start; flex-wrap: wrap; }

/* ── Buttons ───────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  text-decoration: none;
}
.btn-primary { background: #1a56db; color: #fff; border-color: #1a56db; }
.btn-primary:hover { background: #1e40af; }
.btn-secondary { background: #fff; color: #374151; border-color: #d1d5db; }
.btn-secondary:hover { background: #f9fafb; border-color: #9ca3af; }
.btn-danger { background: #fff; color: #dc2626; border-color: #fca5a5; }
.btn-danger:hover { background: #fef2f2; }

/* ── Grid ──────────────────────────────────────────────────────── */
.sections-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

/* ── Card ──────────────────────────────────────────────────────── */
.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #1a56db;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e8f0fe;
}

/* ── Section 1: Info ───────────────────────────────────────────── */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item { display: flex; flex-direction: column; gap: 4px; }
.info-label { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
.info-value { font-size: 14px; font-weight: 500; color: #1e293b; }
.mono { font-family: 'Courier New', monospace; font-size: 13px; }
.plaque-inline {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  background: #1e293b;
  color: #fbbf24;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
  display: inline-block;
}
.plaque-inline.old { color: #94a3b8; background: #f1f5f9; text-decoration: line-through; }

/* ── Section 2: État ───────────────────────────────────────────── */
.etat-block { margin-bottom: 20px; }
.etat-block:last-child { margin-bottom: 0; }

.etat-label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.etat-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; display: block; margin-bottom: 8px; }
.etat-label-row .etat-label { margin-bottom: 0; }

.carburant-pct { font-size: 18px; font-weight: 700; }
.fuel-ok    .carburant-pct, .fuel-ok    { color: #16a34a; }
.fuel-medium .carburant-pct, .fuel-medium { color: #2563eb; }
.fuel-low   .carburant-pct, .fuel-low   { color: #d97706; }
.fuel-critical .carburant-pct, .fuel-critical { color: #dc2626; }

.progress-track {
  height: 12px;
  background: #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 8px;
  transition: width 0.4s ease;
}
.progress-fill.fuel-ok      { background: linear-gradient(90deg, #22c55e, #16a34a); }
.progress-fill.fuel-medium  { background: linear-gradient(90deg, #60a5fa, #2563eb); }
.progress-fill.fuel-low     { background: linear-gradient(90deg, #fbbf24, #d97706); }
.progress-fill.fuel-critical { background: linear-gradient(90deg, #f87171, #dc2626); }

.etat-value-link { display: flex; align-items: center; gap: 8px; font-size: 14px; }

.driver-link {
  color: #1a56db;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
}
.driver-link:hover { text-decoration: underline; }

.remorque-id { font-weight: 600; font-size: 14px; color: #1e293b; }
.remorque-plaque { font-size: 13px; color: #64748b; }

.position-block { display: flex; flex-direction: column; gap: 4px; }
.position-coords {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}
.position-time { font-size: 12px; color: #94a3b8; margin-left: 20px; }

/* ── Badges ────────────────────────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
  letter-spacing: 0.3px;
}
.badge-neutral  { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
.badge-active   { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }
.badge-closed   { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
.badge-ok       { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
.badge-soon     { background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }
.badge-expired  { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

/* ── Section 3: Attelages timeline ─────────────────────────────── */
.timeline { display: flex; flex-direction: column; gap: 0; position: relative; }
.timeline::before {
  content: '';
  position: absolute;
  left: 9px;
  top: 12px;
  bottom: 12px;
  width: 2px;
  background: #e2e8f0;
}

.timeline-item {
  display: flex;
  gap: 16px;
  padding: 0 0 20px;
  position: relative;
}
.timeline-item:last-child { padding-bottom: 0; }

.timeline-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e2e8f0;
  border: 3px solid #fff;
  box-shadow: 0 0 0 2px #e2e8f0;
  flex-shrink: 0;
  margin-top: 2px;
  z-index: 1;
}
.timeline-active .timeline-dot {
  background: #1a56db;
  box-shadow: 0 0 0 2px #bfdbfe;
}

.timeline-content { flex: 1; }
.timeline-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.timeline-id { font-size: 13px; font-weight: 700; color: #1e293b; }
.timeline-remorque { display: flex; align-items: center; gap: 5px; font-size: 13px; color: #374151; margin-bottom: 4px; }
.dim { color: #94a3b8; }
.timeline-dates { font-size: 12px; color: #64748b; }

/* ── Section 4: Documents table ─────────────────────────────────  */
.doc-table-wrap { overflow-x: auto; }
.doc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.doc-table th {
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 8px 12px;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}
.doc-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.doc-table tr:last-child td { border-bottom: none; }

.row-expired { background: #fff5f5; }
.row-soon    { background: #fffbeb; }
.row-expired:hover { background: #fee2e2; }
.row-soon:hover    { background: #fef3c7; }
.doc-table tbody tr:hover { background: #f8fafc; }
.row-expired:hover, .row-soon:hover { /* override generic hover */ }

.doc-type { font-weight: 600; color: #1e293b; }
.text-red    { color: #dc2626; font-weight: 600; }
.text-orange { color: #d97706; font-weight: 600; }

/* ── Section plaques ─────────────────────────────────────────── */
.section-plaques { margin-top: 0; }

/* ── Empty state ─────────────────────────────────────────────── */
.empty-state {
  text-align: center;
  padding: 32px;
  color: #94a3b8;
  font-size: 13px;
}

/* ── Responsive ──────────────────────────────────────────────── */
@media (max-width: 900px) {
  .sections-grid { grid-template-columns: 1fr; }
  .tracteur-detail { padding: 16px; }
  .vehicle-identity { flex-direction: column; align-items: flex-start; gap: 12px; }
  .detail-header { flex-direction: column; }
  .header-actions { width: 100%; }
}
</style>
