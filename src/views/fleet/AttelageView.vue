<template>
  <div class="attelage-view">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">Gestion des Attelages</h1>
      <p class="page-subtitle">Couplage tracteurs &amp; remorques</p>
    </div>

    <!-- Attelages actifs -->
    <div class="card mb-6">
      <div class="card-header">
        <h2 class="card-title">
          <span class="badge badge-active">{{ attelagesActifs.length }}</span>
          Attelages actifs
        </h2>
      </div>
      <div class="card-body p-0">
        <div v-if="attelagesActifs.length === 0" class="empty-state">
          Aucun attelage actif pour le moment.
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Tracteur</th>
              <th>Plaque tracteur</th>
              <th>Remorque</th>
              <th>Plaque remorque</th>
              <th>Depuis</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="att in attelagesActifs" :key="att.id">
              <td>
                <span class="vehicle-name">{{ getTracteurNom(att.tracteurId) }}</span>
              </td>
              <td>
                <span class="plaque-badge">{{ att.tracteurPlaque }}</span>
              </td>
              <td>
                <span class="vehicle-name">{{ getRemorqueNom(att.remorqueId) }}</span>
              </td>
              <td>
                <span class="plaque-badge plaque-remorque">{{ att.remorquePlaque }}</span>
              </td>
              <td>
                <span class="date-text">{{ formatDate(att.dateDebut) }}</span>
                <span class="duration-text">{{ getDuration(att.dateDebut) }}</span>
              </td>
              <td>
                <button
                  class="btn btn-danger-outline btn-sm"
                  @click="openDetacherDialog(att)"
                >
                  Détacher
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Nouvel attelage -->
    <div class="card mb-6">
      <div class="card-header">
        <h2 class="card-title">Nouvel attelage</h2>
      </div>
      <div class="card-body">
        <!-- Error display -->
        <div v-if="formError" class="alert alert-error mb-4">
          <svg class="alert-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          <span>{{ formError }}</span>
          <button class="alert-close" @click="formError = ''">×</button>
        </div>

        <form class="attelage-form" @submit.prevent="handleAttacher">
          <div class="form-row">
            <!-- Tracteur select -->
            <div class="form-group">
              <label class="form-label" for="select-tracteur">
                Tracteur <span class="required">*</span>
              </label>
              <select
                id="select-tracteur"
                v-model="form.tracteurId"
                class="form-select"
                :class="{ 'select-error': tracteurConflict }"
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
              <p v-if="tracteurConflict" class="field-error">
                Ce tracteur a déjà un attelage actif.
              </p>
              <p v-if="tracteursDisponibles.length === 0" class="field-hint">
                Tous les tracteurs en service sont déjà attelés.
              </p>
            </div>

            <!-- Remorque select -->
            <div class="form-group">
              <label class="form-label" for="select-remorque">
                Remorque <span class="required">*</span>
              </label>
              <select
                id="select-remorque"
                v-model="form.remorqueId"
                class="form-select"
                :class="{ 'select-error': remorqueConflict }"
                required
              >
                <option value="">— Sélectionner une remorque —</option>
                <option
                  v-for="r in remorquesDisponibles"
                  :key="r.id"
                  :value="r.id"
                >
                  {{ r.plaque }} — {{ r.type }}
                </option>
              </select>
              <p v-if="remorqueConflict" class="field-error">
                Cette remorque a déjà un attelage actif.
              </p>
              <p v-if="remorquesDisponibles.length === 0" class="field-hint">
                Toutes les remorques actives sont déjà attelées.
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
              :disabled="!form.tracteurId || !form.remorqueId || !form.dateDebut || isSubmitting"
            >
              <svg v-if="isSubmitting" class="spinner" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Attacher
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
        <h2 class="card-title">Historique des attelages</h2>
        <button class="btn-toggle" @click="showHistorique = !showHistorique">
          {{ showHistorique ? 'Masquer' : 'Afficher' }}
        </button>
      </div>
      <div v-if="showHistorique" class="card-body p-0">
        <div v-if="attelagesHistorique.length === 0" class="empty-state">
          Aucun attelage terminé.
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tracteur</th>
              <th>Remorque</th>
              <th>Date début</th>
              <th>Date fin</th>
              <th>Durée</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="att in attelagesHistorique" :key="att.id">
              <td><span class="id-badge">{{ att.id }}</span></td>
              <td>
                <div>{{ getTracteurNom(att.tracteurId) }}</div>
                <span class="plaque-badge plaque-sm">{{ att.tracteurPlaque }}</span>
              </td>
              <td>
                <div>{{ getRemorqueNom(att.remorqueId) }}</div>
                <span class="plaque-badge plaque-remorque plaque-sm">{{ att.remorquePlaque }}</span>
              </td>
              <td>{{ formatDate(att.dateDebut) }}</td>
              <td>{{ formatDate(att.dateFin!) }}</td>
              <td>{{ getDurationBetween(att.dateDebut, att.dateFin!) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Confirm detach dialog -->
    <div v-if="detachTarget" class="modal-overlay" @click.self="detachTarget = null">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Confirmer le détachement</h3>
          <button class="modal-close" @click="detachTarget = null">×</button>
        </div>
        <div class="modal-body">
          <p>Voulez-vous détacher :</p>
          <ul class="confirm-list">
            <li><strong>Tracteur :</strong> {{ detachTarget.tracteurPlaque }}</li>
            <li><strong>Remorque :</strong> {{ detachTarget.remorquePlaque }}</li>
          </ul>
          <div class="form-group mt-4">
            <label class="form-label" for="date-fin">Date de fin</label>
            <input
              id="date-fin"
              v-model="detachDateFin"
              type="date"
              class="form-input"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="detachTarget = null">Annuler</button>
          <button class="btn btn-danger" @click="confirmDetacher">Détacher</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAttelagesStore } from '../../stores/attelages'
import { useTracteurStore } from '../../stores/tracteurs'
import { useRemorquesStore } from '../../stores/remorques'
import type { Attelage } from '../../types/index'

const attelageStore = useAttelagesStore()
const tracteurStore = useTracteurStore()
const remorqueStore = useRemorquesStore()

// ── State ──────────────────────────────────────────────────────────
const showHistorique = ref(false)
const isSubmitting = ref(false)
const formError = ref('')
const detachTarget = ref<Attelage | null>(null)
const detachDateFin = ref(today())

const form = ref({
  tracteurId: '',
  remorqueId: '',
  dateDebut: today(),
})

// ── Computed ───────────────────────────────────────────────────────
const attelagesActifs = computed(() =>
  attelageStore.attelages.filter((a) => !a.dateFin)
)

const attelagesHistorique = computed(() =>
  attelageStore.attelages
    .filter((a) => !!a.dateFin)
    .sort((a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime())
)

const attelesIds = computed(() => new Set(attelagesActifs.value.map((a) => a.tracteurId)))
const remorquesAttelesIds = computed(() => new Set(attelagesActifs.value.map((a) => a.remorqueId)))

const tracteursDisponibles = computed(() =>
  tracteurStore.tracteurs.filter(
    (t) => t.statutAdmin === 'en_service' && !attelesIds.value.has(t.id)
  )
)

const remorquesDisponibles = computed(() =>
  remorqueStore.remorques.filter(
    (r) => r.statutAdmin === 'en_service' && !remorquesAttelesIds.value.has(r.id)
  )
)

const tracteurConflict = computed(() =>
  form.value.tracteurId ? attelesIds.value.has(form.value.tracteurId) : false
)

const remorqueConflict = computed(() =>
  form.value.remorqueId ? remorquesAttelesIds.value.has(form.value.remorqueId) : false
)

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
  const months = Math.floor(days / 30)
  return `${months} mois`
}

function getTracteurNom(id: string): string {
  const t = tracteurStore.tracteurs.find((x) => x.id === id)
  return t ? `${t.marque} ${t.modele}` : id
}

function getRemorqueNom(id: string): string {
  const r = remorqueStore.remorques.find((x) => x.id === id)
  return r ? `${r.type} ${r.capacite ?? ''}`.trim() : id
}

// ── Actions ────────────────────────────────────────────────────────
function resetForm() {
  form.value = { tracteurId: '', remorqueId: '', dateDebut: today() }
  formError.value = ''
}

async function handleAttacher() {
  formError.value = ''
  if (!form.value.tracteurId || !form.value.remorqueId) return

  const tracteur = tracteurStore.tracteurs.find((t) => t.id === form.value.tracteurId)
  const remorque = remorqueStore.remorques.find((r) => r.id === form.value.remorqueId)
  if (!tracteur || !remorque) return

  isSubmitting.value = true
  try {
    attelageStore.attacher(
      tracteur.id,
      tracteur.plaque,
      remorque.id,
      remorque.plaque,
      form.value.dateDebut
    )
    resetForm()
  } catch (err: any) {
    formError.value = err.message ?? 'Une erreur est survenue.'
  } finally {
    isSubmitting.value = false
  }
}

function openDetacherDialog(att: Attelage) {
  detachTarget.value = att
  detachDateFin.value = today()
}

function confirmDetacher() {
  if (!detachTarget.value) return
  try {
    attelageStore.detacher(detachTarget.value.id, detachDateFin.value)
    detachTarget.value = null
  } catch (err: any) {
    formError.value = err.message ?? 'Erreur lors du détachement.'
    detachTarget.value = null
  }
}
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────── */
.attelage-view {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
  color: #1e293b;
}

.mb-6 { margin-bottom: 24px; }
.mt-4 { margin-top: 16px; }
.p-0 { padding: 0; }

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

/* ── Badge / status ──────────────────────────────────────────────── */
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

.vehicle-name {
  font-weight: 500;
  color: #1e293b;
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
.plaque-remorque {
  background: #dcfce7;
  color: #166534;
}
.plaque-sm {
  font-size: 0.7rem;
  padding: 1px 6px;
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
.attelage-form {}
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
.select-error {
  border-color: #dc2626 !important;
}
.field-error {
  font-size: 0.78rem;
  color: #dc2626;
  margin: 0;
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
.mb-4 { margin-bottom: 16px; }

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
