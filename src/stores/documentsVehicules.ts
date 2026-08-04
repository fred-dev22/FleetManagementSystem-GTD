import { defineStore } from 'pinia'
import type { DocumentVehicule } from '../types/index'

interface DocumentsVehiculesState {
  documents: DocumentVehicule[]
}

const TODAY = '2026-07-08'

export const useDocumentsVehiculesStore = defineStore('documentsVehicules', {
  state: (): DocumentsVehiculesState => ({
    documents: [
      // ── Tracteurs ──────────────────────────────────────────────
      { id: 'doc-001', entityId: 'TRC-001', entityType: 'vehicule', type: 'Carte grise',      dateEmission: '2024-01-15', dateExpiration: '2027-01-14', statut: 'valide',  alerteEnvoyee: false, createdAt: '2024-01-01T00:00:00Z' },
      { id: 'doc-002', entityId: 'TRC-001', entityType: 'vehicule', type: 'Assurance',         dateEmission: '2026-01-01', dateExpiration: '2026-07-10', statut: 'valide',  alerteEnvoyee: false, createdAt: '2024-01-01T00:00:00Z' },
      { id: 'doc-003', entityId: 'TRC-001', entityType: 'vehicule', type: 'Visite technique',  dateEmission: '2026-03-01', dateExpiration: '2026-06-20', statut: 'archive', alerteEnvoyee: true,  createdAt: '2024-01-01T00:00:00Z' },
      { id: 'doc-004', entityId: 'TRC-002', entityType: 'vehicule', type: 'Carte grise',      dateEmission: '2023-06-01', dateExpiration: '2026-05-31', statut: 'archive', alerteEnvoyee: true,  createdAt: '2024-01-01T00:00:00Z' },
      { id: 'doc-005', entityId: 'TRC-002', entityType: 'vehicule', type: 'Assurance',         dateEmission: '2026-02-01', dateExpiration: '2026-07-20', statut: 'valide',  alerteEnvoyee: false, createdAt: '2024-01-01T00:00:00Z' },
      { id: 'doc-006', entityId: 'TRC-003', entityType: 'vehicule', type: 'Vignette',          dateEmission: '2026-01-01', dateExpiration: '2026-12-31', statut: 'valide',  alerteEnvoyee: false, createdAt: '2024-01-01T00:00:00Z' },
      { id: 'doc-007', entityId: 'TRC-003', entityType: 'vehicule', type: 'Visite technique',  dateEmission: '2026-04-10', dateExpiration: '2026-07-05', statut: 'valide',  alerteEnvoyee: false, createdAt: '2024-01-01T00:00:00Z' },
      { id: 'doc-012', entityId: 'TRC-004', entityType: 'vehicule', type: 'Assurance',         dateEmission: '2025-06-01', dateExpiration: '2026-06-10', statut: 'archive', alerteEnvoyee: true,  createdAt: '2024-01-01T00:00:00Z' },
      { id: 'doc-013', entityId: 'TRC-004', entityType: 'vehicule', type: 'Carte grise',      dateEmission: '2025-01-01', dateExpiration: '2028-01-01', statut: 'valide',  alerteEnvoyee: false, createdAt: '2024-01-01T00:00:00Z' },
      { id: 'doc-015', entityId: 'TRC-005', entityType: 'vehicule', type: 'Vignette',          dateEmission: '2026-01-01', dateExpiration: '2026-07-22', statut: 'valide',  alerteEnvoyee: false, createdAt: '2024-01-01T00:00:00Z' },
      // ── Remorques ──────────────────────────────────────────────
      { id: 'doc-008', entityId: 'REM-001', entityType: 'vehicule', type: 'Carte grise',      dateEmission: '2024-03-01', dateExpiration: '2027-02-28', statut: 'valide',  alerteEnvoyee: false, createdAt: '2024-01-01T00:00:00Z' },
      { id: 'doc-009', entityId: 'REM-001', entityType: 'vehicule', type: 'Assurance',         dateEmission: '2026-01-01', dateExpiration: '2026-06-15', statut: 'archive', alerteEnvoyee: true,  createdAt: '2024-01-01T00:00:00Z' },
      { id: 'doc-010', entityId: 'REM-002', entityType: 'vehicule', type: 'Visite technique',  dateEmission: '2025-07-01', dateExpiration: '2026-06-30', statut: 'archive', alerteEnvoyee: false, createdAt: '2024-01-01T00:00:00Z' },
      { id: 'doc-011', entityId: 'REM-002', entityType: 'vehicule', type: 'Vignette',          dateEmission: '2026-01-01', dateExpiration: '2026-12-31', statut: 'valide',  alerteEnvoyee: false, createdAt: '2024-01-01T00:00:00Z' },
      { id: 'doc-014', entityId: 'REM-003', entityType: 'vehicule', type: 'Assurance',         dateEmission: '2026-05-01', dateExpiration: '2026-07-15', statut: 'valide',  alerteEnvoyee: false, createdAt: '2024-01-01T00:00:00Z' },
      // ── Conducteurs ────────────────────────────────────────────
      /* Dossier complet d'un chauffeur de camion-citerne. Les échéances sont
         réparties pour couvrir les trois états de la colonne « Échéance » :
         valide au-delà de 30 jours, à renouveler en deçà, expiré. */
      { id: 'doc-016', entityId: 'CP-001', entityType: 'conducteur', type: 'Permis de conduire CE',           numero: 'PC-2018-44172',   dateEmission: '2018-08-15', dateExpiration: '2026-08-15', statut: 'valide',  alerteEnvoyee: true,  createdAt: '2021-03-15T08:00:00Z' },
      { id: 'doc-017', entityId: 'CP-001', entityType: 'conducteur', type: 'Visite médicale',                 numero: 'VM-2024-0912',    dateEmission: '2024-09-10', dateExpiration: '2025-09-10', statut: 'archive', alerteEnvoyee: true,  createdAt: '2021-03-15T08:00:00Z' },
      { id: 'doc-018', entityId: 'CP-001', entityType: 'conducteur', type: 'Habilitation ADR / TMD',          numero: 'ADR-2022-3318',   dateEmission: '2022-11-05', dateExpiration: '2026-11-05', statut: 'valide',  alerteEnvoyee: false, createdAt: '2021-03-15T08:00:00Z' },
      { id: 'doc-024', entityId: 'CP-001', entityType: 'conducteur', type: 'Carte APTH',                      numero: 'APTH-2023-0771',  dateEmission: '2023-04-18', dateExpiration: '2026-08-24', statut: 'valide',  alerteEnvoyee: false, createdAt: '2023-04-18T08:00:00Z' },
      { id: 'doc-025', entityId: 'CP-001', entityType: 'conducteur', type: 'Carte d’identité nationale',      numero: '501031012345',    dateEmission: '2015-02-11',                               statut: 'valide',  alerteEnvoyee: false, createdAt: '2021-03-15T08:00:00Z' },
      { id: 'doc-026', entityId: 'CP-001', entityType: 'conducteur', type: 'Test psychotechnique',            numero: 'PSY-2025-0142',   dateEmission: '2025-06-02', dateExpiration: '2027-06-02', statut: 'valide',  alerteEnvoyee: false, createdAt: '2025-06-02T08:00:00Z' },
      { id: 'doc-027', entityId: 'CP-001', entityType: 'conducteur', type: 'Attestation conduite défensive',  numero: 'CD-2024-0088',    dateEmission: '2024-05-20', dateExpiration: '2026-05-20', statut: 'archive', alerteEnvoyee: true,  createdAt: '2024-05-20T08:00:00Z' },
      { id: 'doc-028', entityId: 'CP-001', entityType: 'conducteur', type: 'Contrat de travail',              numero: 'CT-2021-0031',    dateEmission: '2021-03-15',                               statut: 'valide',  alerteEnvoyee: false, createdAt: '2021-03-15T08:00:00Z' },
      { id: 'doc-019', entityId: 'CP-002', entityType: 'conducteur', type: 'Permis CE',        dateEmission: '2019-03-22', dateExpiration: '2027-03-22', statut: 'valide',  alerteEnvoyee: false, createdAt: '2022-01-10T08:00:00Z' },
      { id: 'doc-020', entityId: 'CP-002', entityType: 'conducteur', type: 'Visite médicale',  dateEmission: '2025-01-20', dateExpiration: '2026-01-20', statut: 'archive', alerteEnvoyee: false, createdAt: '2022-01-10T08:00:00Z' },
      { id: 'doc-021', entityId: 'CP-003', entityType: 'conducteur', type: 'Permis C',         dateEmission: '2020-07-01', dateExpiration: '2025-06-30', statut: 'archive', alerteEnvoyee: true,  createdAt: '2022-09-01T08:00:00Z' },
      { id: 'doc-022', entityId: 'CP-004', entityType: 'conducteur', type: 'Permis CE',        dateEmission: '2017-12-10', dateExpiration: '2026-12-10', statut: 'valide',  alerteEnvoyee: false, createdAt: '2020-03-01T08:00:00Z' },
      { id: 'doc-023', entityId: 'CP-004', entityType: 'conducteur', type: 'ADR',              dateEmission: '2024-01-15', dateExpiration: '2028-01-15', statut: 'valide',  alerteEnvoyee: false, createdAt: '2020-03-01T08:00:00Z' },
    ],
  }),

  getters: {
    getDocsByEntity:
      (state) =>
      (entityId: string, entityType: 'vehicule' | 'conducteur'): DocumentVehicule[] =>
        state.documents.filter(d => d.entityId === entityId && d.entityType === entityType),

    getDocsByVehicule:
      (state) =>
      (vehiculeId: string): DocumentVehicule[] =>
        state.documents.filter(d => d.entityId === vehiculeId && d.entityType === 'vehicule'),

    getDocsByConducteur:
      (state) =>
      (conducteurId: string): DocumentVehicule[] =>
        state.documents.filter(d => d.entityId === conducteurId && d.entityType === 'conducteur'),

    documentsExpiresSous30Jours: (state): DocumentVehicule[] => {
      const today = new Date(TODAY)
      const in30 = new Date(TODAY)
      in30.setDate(in30.getDate() + 30)
      return state.documents.filter(d => {
        if (!d.dateExpiration) return false
        const exp = new Date(d.dateExpiration)
        return exp >= today && exp <= in30
      })
    },

    documentsExpires: (state): DocumentVehicule[] => {
      const today = new Date(TODAY)
      return state.documents.filter(d => d.dateExpiration && new Date(d.dateExpiration) < today)
    },

    countAlertes(): number {
      return this.documentsExpires.length + this.documentsExpiresSous30Jours.length
    },
  },

  actions: {
    createDocument(payload: Omit<DocumentVehicule, 'id' | 'alerteEnvoyee' | 'createdAt'>): DocumentVehicule {
      const doc: DocumentVehicule = {
        ...payload,
        id: `doc-${String(this.documents.length + 1).padStart(3, '0')}`,
        alerteEnvoyee: false,
        createdAt: new Date().toISOString(),
      }
      this.documents.push(doc)
      return doc
    },

    updateDocument(id: string, payload: Partial<Omit<DocumentVehicule, 'id'>>): boolean {
      const idx = this.documents.findIndex(d => d.id === id)
      if (idx === -1) return false
      this.documents[idx] = { ...this.documents[idx]!, ...payload }
      return true
    },

    deleteDocument(id: string): boolean {
      const idx = this.documents.findIndex(d => d.id === id)
      if (idx === -1) return false
      this.documents.splice(idx, 1)
      return true
    },

    marquerAlerteEnvoyee(id: string): boolean {
      const doc = this.documents.find(d => d.id === id)
      if (!doc) return false
      doc.alerteEnvoyee = true
      return true
    },
  },
})