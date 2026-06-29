<template>
  <div class="affectation-view">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">Affectations Chauffeurs</h1>
      <p class="page-subtitle">Gestion des affectations chauffeur–tracteur</p>
    </div>

    <!-- Affectations actives -->
    <div class="card mb-6">
      <div class="card-header">
        <h2 class="card-title">
          <span class="badge-active">{{ affectationsActives.length }}</span>
          Affectations actives
        </h2>
      </div>
      <div class="card-body p-0">
        <div v-if="affectationsActives.length === 0" class="empty-state">
          Aucune affectation active pour le moment.
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Chauffeur</th>
              <th>Tracteur</th>
              <th>Depuis</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="aff in affectationsActives" :key="aff.id">
              <td>
                <div class="driver-cell">
                  <div class="avatar" :style="getAvatarStyle(aff.chauffeurId)">
                    {{ getInitiales(aff.chauffeurNom) }}
                  </div>
                  <div>
                    <div class="driver-name">{{ aff.chauffeurNom }}</div>
                    <div class="driver-meta">{{ getChauffeurFonction(aff.chauffeurId) }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="plaque-badge">{{ aff.tracteurPlaque }}</span>
                <div class="vehicle-meta">{{ getTracteurInfo(aff.tracteurId) }}</div>
              </td>
              <td>
                <span class="date-text">{{ formatDate(aff.dateDebut) }}</span>
                <span class="duration-text">{{ getDuration(aff.dateDebut) }}</span>
              </td>
              <td>
                <button
                  class="btn btn-danger-outline btn-sm"
                  @click="openTerminerDialog(aff)"
                >
                  Terminer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Nouvelle affectation -->
    <div class="card mb-6">
      <div class="card-header">
        <h2 class="card-title">Nouvelle affectation</h2>
      </div>
      <div class="card-body">
        <!-- Error -->
        <div v-if="formError" class="alert alert-error mb-4">
          <svg class="alert-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          <span>{{ formError }}</span>
          <button class="alert-close" @click="formError = ''">×</button>
        </div>

        <form class="affectation-form" @submit.prevent="handleAffecter">
          <div class="form-row">
            <!-- Chauffeur -->
            <div class="form-group">
              <label class="form-label" for="select-chauffeur">
                Chauffeur <span class="required">*</span>
              </label>
              <select
                id="select-chauffeur"
                v-model="form.chauffeurId"
                class="form-select"
                required
              >
                <option value="">— Sélectionner un chauffeur —</option>
                <option
                  v-for="c in chauffeursDisponibles"
                  :key="c.id"
                  :value="c.id"
                >
                  {{ c.name }}
                </option>
              </select>
              <p v-if="chauffeursDisponibles.length === 0" class="field-hint">
                Aucun chauffeur disponible (tous affectés ou sans documents valides).
              </p>

              <!-- Document expiry warnings -->
              <div v-if="form.chauffeurId && documentWarnings.length > 0" class="doc-warnings">
                <div
                  v-for="warn in documentWarnings"
                  :key="warn"
                  class="doc-warning-item"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" class="warn-icon">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                  {{ warn }}
                </div>
              </div>
            </div>

            <!-- Tracteur -->
            <div class="form-group">
              <label class="form-label" for="select-tracteur">
                Tracteur <span class="required">*</span>
              </label>
              <select
                id="select-tracteur"
                v-model="form.tracteurId"
                class="form-select"
                required
              >
                <option value="">— Sélectionner un tracteur —</option>
                <option
                  v-for="t in tracteursDisponibles"
                  :key="t.id"
                  :value="t.id"
                >
                  {{ t.plaque }} — {{ t.marque }} {{ t.modele }}
                </option>
              </select>
              <p v-if="tracteursDisponibles.length === 0" class="field-hint">
                Aucun tracteur disponible (tous affectés ou hors service).
              </p>
            </div>

            <!-- Date début -->
            <div class="form-group">
              <label class="form-label" for="date-debut">
                Date de début <span class="required">*</span>
              </label>
              <input
                id="date-debut"
                v-model="form.dateDebut"
                type="date"
                class="form-input"
                required
              />
            </div>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="!form.chauffeurId || !form.tracteurId || !form.dateDebut || isSubmitting"
            >
              <svg v-if="isSubmitting" class="spinner" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Affecter
            </button>
            <button type="button" class="btn btn-secondary" @click="resetForm">
              Réinitialiser
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Historique -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Historique des affectations</h2>
        <button class="btn-toggle" @click="showHistorique = !showHistorique">
          {{ showHistorique ? 'Masquer' : 'Afficher' }}
        </button>
      </div>
      <div v-if="showHistorique" class="card-body p-0">
        <div v-if="affectationsHistorique.length === 0" class="empty-state">
          Aucune affectation terminée.
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Chauffeur</th>
              <th>Tracteur</th>
              <th>Date début</th>
              <th>Date fin</th>
              <th>Durée</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="aff in affectationsHistorique" :key="aff.id">
              <td><span class="id-badge">{{ aff.id }}</span></td>
              <td>
                <div class="driver-name">{{ aff.chauffeurNom }}</div>
              </td>
              <td>
                <span class="plaque-badge">{{ aff.tracteurPlaque }}</span>
              </td>
              <td>{{ formatDate(aff.dateDebut) }}</td>
              <td>{{ formatDate(aff.dateFin!) }}</td>
              <td>{{ getDurationBetween(aff.dateDebut, aff.dateFin!) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Confirm terminer dialog -->
    <div v-if="terminerTarget" class="modal-overlay" @click.self="terminerTarget = null">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Terminer l'affectation</h3>
          <button class="modal-close" @click="terminerTarget = null">×</button>
        </div>
        <div class="modal-body">
          <p>Voulez-vous terminer l'affectation de :</p>
          <ul class="confirm-list">
            <li><strong>Chauffeur :</strong> {{ terminerTarget.chauffeurNom }}</li>
            <li><strong>Tracteur :</strong> {{ terminerTarget.tracteurPlaque }}</li>
          </ul>
          <div class="form-group mt-4">
            <label class="form-label" for="date-fin">Date de fin</label>
            <input
              id="date-fin"
              v-model="terminerDateFin"
              type="date"
              class="form-input"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="terminerTarget = null">Annuler</button>
          <button class="btn btn-danger" @click="confirmTerminer">Terminer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAffectationsChauffeursStore } from '../../stores/affectationsChauffeurs'
import { useTracteurStore } from '../../stores/tracteurs'
import { useEmployeesStore } from '../../stores/employees'
import type { AffectationChauffeur } from '../../types/index'

const affectationStore = useAffectationsChauffeursStore()
const tracteurStore = useTracteurStore()
const employeesStore = useEmployeesStore()

// ── State ──────────────────────────────────────────────────────────
const showHistorique = ref(false)
const isSubmitting = ref(false)
const formError = ref('')
const terminerTarget = ref<AffectationChauffeur | null>(null)
const terminerDateFin = ref(today())

const form = ref({
  chauffeurId: '',
  tracteurId: '',
  dateDebut: today(),
})

// ── Computed ───────────────────────────────────────────────────────
const affectationsActives = computed(() =>
  affectationStore.affectations.filter((a) => !a.dateFin)
)

const affectationsHistorique = computed(() =>
  affectationStore.affectations
    .filter((a) => !!a.dateFin)
    .sort((a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime())
)

const affectesIds = computed(() => new Set(affectationsActives.value.map((a) => a.chauffeurId)))
const tracteurAffectesIds = computed(() => new Set(affectationsActives.value.map((a) => a.tracteurId)))

const chauffeursDisponibles = computed(() => {
  return employeesStore.employees.filter((e) => {
    if (e.status !== 'actif') return false
    if (e.fonction !== 'Chauffeur') return false
    if (affectesIds.value.has(e.id)) return false
    return true
  })
})

const tracteursDisponibles = computed(() =>
  tracteurStore.tracteurs.filter(
    (t) => t.statutAdmin === 'en_service' && !tracteurAffectesIds.value.has(t.id)
  )
)

const documentWarnings = computed((): string[] => {
  if (!form.value.chauffeurId) return []
  const emp = employeesStore.employees.find((e) => e.id === form.value.chauffeurId)
  if (!emp) return []

  const warnings: string[] = []
  const now = Date.now()
  const SOON = 30 * 24 * 60 * 60 * 1000 // 30 days

  // Check permis expiry if available on employee record
  const permisExpiry = (emp as any).permisExpiry
  if (permisExpiry) {
    const diff = new Date(permisExpiry).getTime() - now
    if (diff < 0) {
      warnings.push('Permis de conduire expiré.')
    } else if (diff < SOON) {
      warnings.push(`Permis de conduire expire le ${formatDate(permisExpiry)}.`)
    }
  }

  const visiteExpiry = (emp as any).visitesMedicaleExpiry
  if (visiteExpiry) {
    const diff = new Date(visiteExpiry).getTime() - now
    if (diff < 0) {
      warnings.push('Visite médicale expirée.')
    } else if (diff < SOON) {
      warnings.push(`Visite médicale expire le ${formatDate(visiteExpiry)}.`)
    }
  }

  return warnings
})

// ── Helpers ────────────────────────────────────────────────────────
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(d: string | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getDuration(from: string): string {
  const diff = Date.now() - new Date(from).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return 'Aujourd\'hui'
  if (days < 30) return `${days} j`
  const months = Math.floor(days / 30)
  return `${months} mois`
}

function getDurationBetween(from: string, to: string): string {
  const diff = new Date(to).getTime() - new Date(from).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 30) return `${days} j`
  return `${Math.floor(days / 30)} mois`
}

function getTracteurInfo(id: string): string {
  const t = tracteurStore.tracteurs.find((x) => x.id === id)
  return t ? `${t.marque} ${t.modele}` : ''
}

function getChauffeurFonction(id: string): string {
  const emp = employeesStore.employees.find((e) => e.id === id)
  return emp?.fonction ?? 'Chauffeur'
}

function getInitiales(nom: string): string {
  return nom
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

const AVATAR_COLORS = [
  { bg: '#dbeafe', text: '#1d4ed8' },
  { bg: '#dcfce7', text: '#166534' },
  { bg: '#fef3c7', text: '#92400e' },
  { bg: '#fce7f3', text: '#9d174d' },
  { bg: '#ede9fe', text: '#5b21b6' },
]

function getAvatarStyle(id: string): Record<string, string> {
  const idx = id.charCodeAt(id.length - 1) % AVATAR_COLORS.length
  const c = AVATAR_COLORS[idx]!
  return { background: c.bg, color: c.text }
}

// ── Actions ────────────────────────────────────────────────────────
function resetForm() {
  form.value = { chauffeurId: '', tracteurId: '', dateDebut: today() }
  formError.value = ''
}

async function handleAffecter() {
  formError.value = ''
  if (!form.value.chauffeurId || !form.value.tracteurId) return

  const chauffeur = employeesStore.employees.find((e) => e.id === form.value.chauffeurId)
  const tracteur = tracteurStore.tracteurs.find((t) => t.id === form.value.tracteurId)
  if (!chauffeur || !tracteur) return

  isSubmitting.value = true
  try {
    affectationStore.affecter(
      chauffeur.id,
      chauffeur.name,
      tracteur.id,
      tracteur.plaque,
      form.value.dateDebut
    )
    resetForm()
  } catch (err: any) {
    formError.value = err.message ?? 'Une erreur est survenue.'
  } finally {
    isSubmitting.value = false
  }
}

function openTerminerDialog(aff: AffectationChauffeur) {
  terminerTarget.value = aff
  terminerDateFin.value = today()
}

function confirmTerminer() {
  if (!terminerTarget.value) return
  try {
    affectationStore.terminerAffectation(terminerTarget.value.id, terminerDateFin.value)
    terminerTarget.value = null
  } catch (err: any) {
    formError.value = err.message ?? 'Erreur lors de la terminaison.'
    terminerTarget.value = null
  }
}
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────── */
.affectation-view {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
  color: #1e293b;
}

.mb-6 { margin-bottom: 24px; }
.mt-4 { margin-top: 16px; }
.p-0 { padding: 0; }
.mb-4 { margin-bottom: 16px; }

/* ── Page header ─────────────────────────────────────────────────── */
.page-header {
  margin-bottom: 28px;
}
.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0C447C;
  margin: 0 0 4px;
}
.page-subtitle {
  color: #64748b;
  margin: 0;
  font-size: 0.9rem;
}

/* ── Card ────────────────────────────────────────────────────────── */
.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
  overflow: hidden;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}
.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0C447C;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-body {
  padding: 20px;
}

/* ── Badge ───────────────────────────────────────────────────────── */
.badge-active {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #0C447C;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 12px;
  padding: 2px 8px;
  min-width: 24px;
}
.id-badge {
  font-size: 0.75rem;
  color: #64748b;
  font-family: monospace;
}
.plaque-badge {
  display: inline-block;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
  letter-spacing: .03em;
}

/* ── Table ───────────────────────────────────────────────────────── */
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th {
  background: #f1f5f9;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .05em;
  padding: 10px 16px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}
.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
  vertical-align: middle;
}
.data-table tbody tr:last-child td {
  border-bottom: none;
}
.data-table tbody tr:hover td {
  background: #f8fafc;
}

.driver-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}
.driver-name {
  font-weight: 500;
  color: #1e293b;
}
.driver-meta {
  font-size: 0.75rem;
  color: #64748b;
}
.vehicle-meta {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 2px;
}
.date-text {
  display: block;
  font-size: 0.875rem;
}
.duration-text {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.9rem;
}

/* ── Form ────────────────────────────────────────────────────────── */
.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
}
.required { color: #dc2626; }
.form-select,
.form-input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #1e293b;
  background: #fff;
  transition: border-color .15s;
  outline: none;
}
.form-select:focus,
.form-input:focus {
  border-color: #0C447C;
  box-shadow: 0 0 0 2px rgba(12,68,124,.15);
}
.field-hint {
  font-size: 0.78rem;
  color: #f59e0b;
  margin: 0;
}
.form-actions {
  display: flex;
  gap: 10px;
}

/* ── Document warnings ───────────────────────────────────────────── */
.doc-warnings {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.doc-warning-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 5px;
  padding: 5px 8px;
}
.warn-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: #d97706;
}

/* ── Buttons ─────────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background .15s, border-color .15s, opacity .15s;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-primary {
  background: #0C447C;
  color: #fff;
  border-color: #0C447C;
}
.btn-primary:hover:not(:disabled) {
  background: #0a3868;
}
.btn-secondary {
  background: #f1f5f9;
  color: #475569;
  border-color: #e2e8f0;
}
.btn-secondary:hover {
  background: #e2e8f0;
}
.btn-danger {
  background: #dc2626;
  color: #fff;
  border-color: #dc2626;
}
.btn-danger:hover {
  background: #b91c1c;
}
.btn-danger-outline {
  background: transparent;
  color: #dc2626;
  border-color: #dc2626;
}
.btn-danger-outline:hover {
  background: #fef2f2;
}
.btn-sm {
  padding: 4px 12px;
  font-size: 0.8rem;
}
.btn-toggle {
  background: none;
  border: none;
  color: #0C447C;
  font-size: 0.85rem;
  cursor: pointer;
  font-weight: 500;
  text-decoration: underline;
}

/* ── Alert ───────────────────────────────────────────────────────── */
.alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 0.875rem;
}
.alert-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}
.alert-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}
.alert-close {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: inherit;
  line-height: 1;
}

/* ── Modal ───────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 60px rgba(0,0,0,.2);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}
.modal-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0C447C;
  margin: 0;
}
.modal-close {
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  color: #64748b;
  line-height: 1;
}
.modal-body {
  padding: 20px;
  font-size: 0.9rem;
  color: #374151;
}
.confirm-list {
  padding-left: 20px;
  margin: 8px 0 0;
  line-height: 1.8;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 0 0 12px 12px;
}

/* ── Spinner ─────────────────────────────────────────────────────── */
.spinner {
  width: 16px;
  height: 16px;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
