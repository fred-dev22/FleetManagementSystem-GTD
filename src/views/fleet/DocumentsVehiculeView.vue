<template>
  <div class="documents-view">
    <div class="page-header">
      <h1>Documents Véhicules</h1>
      <button class="btn-add" @click="openModal()">+ Ajouter document</button>
    </div>

    <!-- Alert banner -->
    <div v-if="store.documentsExpires.length > 0 || store.documentsExpiresSous30Jours.length > 0" class="alert-banner">
      <div v-if="store.documentsExpires.length > 0" class="alert-block alert-red">
        <span class="alert-icon">✕</span>
        <strong>{{ store.documentsExpires.length }} document(s) expiré(s)</strong>
      </div>
      <div v-if="store.documentsExpiresSous30Jours.length > 0" class="alert-block alert-orange">
        <span class="alert-icon">⚠</span>
        <strong>{{ store.documentsExpiresSous30Jours.length }} document(s) expire(nt) dans 30 jours</strong>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <div class="filter-group">
        <label>Type de véhicule</label>
        <select v-model="filterVehiculeType">
          <option value="">Tous</option>
          <option value="tracteur">Tracteur</option>
          <option value="remorque">Remorque</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Type de document</label>
        <select v-model="filterDocType">
          <option value="">Tous</option>
          <option v-for="dt in docTypes" :key="dt" :value="dt">{{ dt }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Statut</label>
        <select v-model="filterStatut">
          <option value="">Tous</option>
          <option value="expire">Expiré</option>
          <option value="expireBientot">Expire bientôt</option>
          <option value="valide">Valide</option>
        </select>
      </div>
      <button class="btn-reset" @click="resetFilters">Réinitialiser</button>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Véhicule</th>
            <th>Plaque / ID</th>
            <th>Type doc</th>
            <th>N° document</th>
            <th>Date émission</th>
            <th>Date expiration</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in filteredDocs" :key="doc.id">
            <td>
              <span class="badge-vehicule" :class="doc.vehiculeType === 'tracteur' ? 'badge-tracteur' : 'badge-remorque'">
                {{ doc.vehiculeType === 'tracteur' ? 'Tracteur' : 'Remorque' }}
              </span>
            </td>
            <td><strong>{{ doc.vehiculeId }}</strong></td>
            <td>{{ doc.typeDocument }}</td>
            <td class="mono">{{ doc.numero }}</td>
            <td>{{ formatDate(doc.dateEmission) }}</td>
            <td>{{ formatDate(doc.dateExpiration) }}</td>
            <td>
              <span class="chip" :class="statutClass(doc.dateExpiration)">
                {{ statutLabel(doc.dateExpiration) }}
              </span>
            </td>
            <td>
              <div class="action-btns">
                <button class="btn-action edit" @click="openModal(doc)" title="Modifier">✎</button>
                <button class="btn-action delete" @click="confirmDelete(doc.id)" title="Supprimer">✕</button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredDocs.length === 0">
            <td colspan="8" class="empty-row">Aucun document trouvé pour les filtres sélectionnés.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <h2>{{ editDoc ? 'Modifier le document' : 'Ajouter un document' }}</h2>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label>Type de véhicule <span class="required">*</span></label>
                <select v-model="form.vehiculeType">
                  <option value="tracteur">Tracteur</option>
                  <option value="remorque">Remorque</option>
                </select>
              </div>
              <div class="form-group">
                <label>ID / Plaque véhicule <span class="required">*</span></label>
                <input
                  type="text"
                  v-model="form.vehiculeId"
                  placeholder="ex: TRC-001 ou REM-002"
                  list="vehicule-ids"
                />
                <datalist id="vehicule-ids">
                  <option v-for="id in vehiculeIds" :key="id" :value="id" />
                </datalist>
              </div>
              <div class="form-group">
                <label>Type de document <span class="required">*</span></label>
                <select v-model="form.typeDocument">
                  <option v-for="dt in docTypes" :key="dt" :value="dt">{{ dt }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>N° document</label>
                <input type="text" v-model="form.numero" placeholder="Numéro de référence" />
              </div>
              <div class="form-group">
                <label>Date d'émission <span class="required">*</span></label>
                <input type="date" v-model="form.dateEmission" />
              </div>
              <div class="form-group">
                <label>Date d'expiration <span class="required">*</span></label>
                <input type="date" v-model="form.dateExpiration" />
              </div>
              <div class="form-group full-width">
                <label>Lien fichier</label>
                <input type="url" v-model="form.lienFichier" placeholder="https://..." />
              </div>
            </div>
            <p v-if="formError" class="form-error">{{ formError }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeModal">Annuler</button>
            <button class="btn-save" @click="saveDocument">
              {{ editDoc ? 'Enregistrer' : 'Ajouter' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Confirm delete -->
    <Teleport to="body">
      <div v-if="deleteTargetId" class="modal-overlay" @click.self="deleteTargetId = null">
        <div class="modal confirm-modal">
          <div class="modal-header">
            <h2>Confirmer la suppression</h2>
            <button class="modal-close" @click="deleteTargetId = null">✕</button>
          </div>
          <div class="modal-body">
            <p>Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.</p>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="deleteTargetId = null">Annuler</button>
            <button class="btn-delete" @click="executeDelete">Supprimer</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDocumentsVehiculesStore } from '../../stores/documentsVehicules'
import type { DocumentVehicule } from '../../types/index'

const store = useDocumentsVehiculesStore()

const TODAY = '2026-06-29'

const filterVehiculeType = ref('')
const filterDocType = ref('')
const filterStatut = ref('')

const docTypes = ['Carte grise', 'Assurance', 'Visite technique', 'Vignette', 'Permis de transport', 'Autre']

const vehiculeIds = ['TRC-001', 'TRC-002', 'TRC-003', 'TRC-004', 'TRC-005', 'REM-001', 'REM-002', 'REM-003']

function getStatut(dateExpiration: string): 'expire' | 'expireBientot' | 'valide' {
  const today = new Date(TODAY)
  const exp = new Date(dateExpiration)
  const in30 = new Date(TODAY)
  in30.setDate(in30.getDate() + 30)
  if (exp < today) return 'expire'
  if (exp <= in30) return 'expireBientot'
  return 'valide'
}

function statutLabel(dateExpiration: string): string {
  const s = getStatut(dateExpiration)
  if (s === 'expire') return 'Expiré'
  if (s === 'expireBientot') return 'Expire bientôt'
  return 'Valide'
}

function statutClass(dateExpiration: string): string {
  const s = getStatut(dateExpiration)
  if (s === 'expire') return 'chip-red'
  if (s === 'expireBientot') return 'chip-orange'
  return 'chip-green'
}

const filteredDocs = computed(() => {
  return store.documents.filter((d) => {
    if (filterVehiculeType.value && d.vehiculeType !== filterVehiculeType.value) return false
    if (filterDocType.value && d.typeDocument !== filterDocType.value) return false
    if (filterStatut.value && getStatut(d.dateExpiration) !== filterStatut.value) return false
    return true
  })
})

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function resetFilters() {
  filterVehiculeType.value = ''
  filterDocType.value = ''
  filterStatut.value = ''
}

// Modal state
const showModal = ref(false)
const editDoc = ref<DocumentVehicule | null>(null)
const formError = ref('')

interface FormData {
  vehiculeId: string
  vehiculeType: 'tracteur' | 'remorque'
  typeDocument: string
  numero: string
  dateEmission: string
  dateExpiration: string
  lienFichier: string
}

const emptyForm = (): FormData => ({
  vehiculeId: '',
  vehiculeType: 'tracteur',
  typeDocument: 'Carte grise',
  numero: '',
  dateEmission: '',
  dateExpiration: '',
  lienFichier: '',
})

const form = ref<FormData>(emptyForm())

function openModal(doc?: DocumentVehicule) {
  editDoc.value = doc ?? null
  formError.value = ''
  if (doc) {
    form.value = {
      vehiculeId: doc.vehiculeId,
      vehiculeType: doc.vehiculeType as 'tracteur' | 'remorque',
      typeDocument: doc.typeDocument,
      numero: doc.numero ?? '',
      dateEmission: doc.dateEmission,
      dateExpiration: doc.dateExpiration,
      lienFichier: '',
    }
  } else {
    form.value = emptyForm()
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editDoc.value = null
  formError.value = ''
}

function saveDocument() {
  formError.value = ''
  if (!form.value.vehiculeId.trim()) {
    formError.value = 'L\'ID du véhicule est requis.'
    return
  }
  if (!form.value.dateEmission || !form.value.dateExpiration) {
    formError.value = 'Les dates d\'émission et d\'expiration sont requises.'
    return
  }
  if (form.value.dateExpiration < form.value.dateEmission) {
    formError.value = 'La date d\'expiration doit être après la date d\'émission.'
    return
  }

  const payload = {
    vehiculeId: form.value.vehiculeId.trim(),
    vehiculeType: form.value.vehiculeType,
    typeDocument: form.value.typeDocument,
    numero: form.value.numero.trim(),
    dateEmission: form.value.dateEmission,
    dateExpiration: form.value.dateExpiration,
  }

  if (editDoc.value) {
    store.updateDocument(editDoc.value.id, payload)
  } else {
    store.createDocument(payload)
  }
  closeModal()
}

// Delete
const deleteTargetId = ref<string | null>(null)

function confirmDelete(id: string) {
  deleteTargetId.value = id
}

function executeDelete() {
  if (deleteTargetId.value) {
    store.deleteDocument(deleteTargetId.value)
    deleteTargetId.value = null
  }
}
</script>

<style scoped>
.documents-view {
  padding: 24px;
  font-family: inherit;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 1.6rem;
  font-weight: 700;
  color: #1a1a2e;
}

.btn-add {
  background: #16213e;
  color: #fff;
  border: none;
  padding: 9px 20px;
  border-radius: 7px;
  font-size: 0.9rem;
  cursor: pointer;
  font-weight: 600;
}

.btn-add:hover {
  background: #0f3460;
}

/* Alert banner */
.alert-banner {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.alert-block {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
}

.alert-red {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
}

.alert-orange {
  background: #fef3c7;
  border: 1px solid #fcd34d;
  color: #92400e;
}

.alert-icon {
  font-weight: 700;
}

/* Filter bar */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  background: #f8f9fc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 16px;
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

.filter-group select {
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

/* Table */
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
  padding: 11px 14px;
  text-align: left;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

tbody tr {
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.12s;
}

tbody tr:hover {
  background: #f8faff;
}

tbody td {
  padding: 11px 14px;
  color: #334155;
  vertical-align: middle;
}

.mono {
  font-family: 'Courier New', monospace;
  font-size: 0.82rem;
  color: #475569;
}

.empty-row {
  text-align: center;
  color: #94a3b8;
  padding: 40px !important;
}

/* Badges */
.badge-vehicule {
  padding: 3px 9px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 700;
}

.badge-tracteur {
  background: #e0f2fe;
  color: #0369a1;
}

.badge-remorque {
  background: #f3e8ff;
  color: #7c3aed;
}

.chip {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.chip-red { background: #fee2e2; color: #991b1b; }
.chip-orange { background: #fef3c7; color: #92400e; }
.chip-green { background: #dcfce7; color: #166534; }

/* Action buttons */
.action-btns {
  display: flex;
  gap: 6px;
}

.btn-action {
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 600;
}

.btn-action.edit {
  background: #e0f2fe;
  color: #0369a1;
}

.btn-action.edit:hover {
  background: #bae6fd;
}

.btn-action.delete {
  background: #fee2e2;
  color: #991b1b;
}

.btn-action.delete:hover {
  background: #fca5a5;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 580px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.confirm-modal {
  max-width: 400px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #1a1a2e;
  color: #fff;
  padding: 16px 20px;
}

.modal-header h2 {
  font-size: 1rem;
  font-weight: 600;
}

.modal-close {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  padding: 4px 10px;
  border-radius: 5px;
  cursor: pointer;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-body {
  padding: 20px;
}

.modal-body p {
  color: #475569;
  font-size: 0.92rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.required {
  color: #ef4444;
}

.form-group input,
.form-group select {
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.9rem;
  background: #fff;
}

.form-group input:focus,
.form-group select:focus {
  outline: 2px solid #3b82f6;
  border-color: #3b82f6;
}

.form-error {
  color: #dc2626;
  font-size: 0.85rem;
  margin-top: 12px;
  padding: 8px 12px;
  background: #fee2e2;
  border-radius: 6px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #e2e8f0;
}

.btn-cancel {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 8px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #475569;
}

.btn-cancel:hover {
  background: #e2e8f0;
}

.btn-save {
  background: #1a1a2e;
  color: #fff;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
}

.btn-save:hover {
  background: #0f3460;
}

.btn-delete {
  background: #dc2626;
  color: #fff;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
}

.btn-delete:hover {
  background: #b91c1c;
}
</style>
