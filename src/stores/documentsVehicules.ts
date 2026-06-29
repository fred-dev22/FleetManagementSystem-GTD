import { defineStore } from 'pinia'
import type { DocumentVehicule } from '../types/index'

interface DocumentsVehiculesState {
  documents: DocumentVehicule[]
}

const TODAY = '2026-06-28'

export const useDocumentsVehiculesStore = defineStore('documentsVehicules', {
  state: (): DocumentsVehiculesState => ({
    documents: [
      {
        id: 'doc-001',
        vehiculeId: 'TRC-001',
        vehiculeType: 'tracteur',
        type: 'Carte grise',
        dateEmission: '2024-01-15',
        dateExpiration: '2027-01-14',
        alerteEnvoyee: false,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'doc-002',
        vehiculeId: 'TRC-001',
        vehiculeType: 'tracteur',
        type: 'Assurance',
        dateEmission: '2026-01-01',
        dateExpiration: '2026-07-10',
        alerteEnvoyee: false,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'doc-003',
        vehiculeId: 'TRC-001',
        vehiculeType: 'tracteur',
        type: 'Visite technique',
        dateEmission: '2026-03-01',
        dateExpiration: '2026-06-20',
        alerteEnvoyee: true,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'doc-004',
        vehiculeId: 'TRC-002',
        vehiculeType: 'tracteur',
        type: 'Carte grise',
        dateEmission: '2023-06-01',
        dateExpiration: '2026-05-31',
        alerteEnvoyee: true,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'doc-005',
        vehiculeId: 'TRC-002',
        vehiculeType: 'tracteur',
        type: 'Assurance',
        dateEmission: '2026-02-01',
        dateExpiration: '2026-07-20',
        alerteEnvoyee: false,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'doc-006',
        vehiculeId: 'TRC-003',
        vehiculeType: 'tracteur',
        type: 'Vignette',
        dateEmission: '2026-01-01',
        dateExpiration: '2026-12-31',
        alerteEnvoyee: false,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'doc-007',
        vehiculeId: 'TRC-003',
        vehiculeType: 'tracteur',
        type: 'Visite technique',
        dateEmission: '2026-04-10',
        dateExpiration: '2026-07-05',
        alerteEnvoyee: false,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'doc-008',
        vehiculeId: 'REM-001',
        vehiculeType: 'remorque',
        type: 'Carte grise',
        dateEmission: '2024-03-01',
        dateExpiration: '2027-02-28',
        alerteEnvoyee: false,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'doc-009',
        vehiculeId: 'REM-001',
        vehiculeType: 'remorque',
        type: 'Assurance',
        dateEmission: '2026-01-01',
        dateExpiration: '2026-06-15',
        alerteEnvoyee: true,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'doc-010',
        vehiculeId: 'REM-002',
        vehiculeType: 'remorque',
        type: 'Visite technique',
        dateEmission: '2025-07-01',
        dateExpiration: '2026-06-30',
        alerteEnvoyee: false,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'doc-011',
        vehiculeId: 'REM-002',
        vehiculeType: 'remorque',
        type: 'Vignette',
        dateEmission: '2026-01-01',
        dateExpiration: '2026-12-31',
        alerteEnvoyee: false,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'doc-012',
        vehiculeId: 'TRC-004',
        vehiculeType: 'tracteur',
        type: 'Assurance',
        dateEmission: '2025-06-01',
        dateExpiration: '2026-06-10',
        alerteEnvoyee: true,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'doc-013',
        vehiculeId: 'TRC-004',
        vehiculeType: 'tracteur',
        type: 'Carte grise',
        dateEmission: '2025-01-01',
        dateExpiration: '2028-01-01',
        alerteEnvoyee: false,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'doc-014',
        vehiculeId: 'REM-003',
        vehiculeType: 'remorque',
        type: 'Assurance',
        dateEmission: '2026-05-01',
        dateExpiration: '2026-07-15',
        alerteEnvoyee: false,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'doc-015',
        vehiculeId: 'TRC-005',
        vehiculeType: 'tracteur',
        type: 'Vignette',
        dateEmission: '2026-01-01',
        dateExpiration: '2026-07-22',
        alerteEnvoyee: false,
        createdAt: '2024-01-01T00:00:00Z',
      },
    ],
  }),

  getters: {
    getDocsByVehicule:
      (state) =>
      (vehiculeId: string, vehiculeType: string): DocumentVehicule[] => {
        return state.documents.filter(
          (d) => d.vehiculeId === vehiculeId && d.vehiculeType === vehiculeType,
        )
      },

    documentsExpiresSous30Jours: (state): DocumentVehicule[] => {
      const today = new Date(TODAY)
      const in30Days = new Date(TODAY)
      in30Days.setDate(in30Days.getDate() + 30)

      return state.documents.filter((d) => {
        if (!d.dateExpiration) return false
        const exp = new Date(d.dateExpiration)
        return exp >= today && exp <= in30Days
      })
    },

    documentsExpires: (state): DocumentVehicule[] => {
      const today = new Date(TODAY)
      return state.documents.filter((d) => d.dateExpiration && new Date(d.dateExpiration) < today)
    },

    countAlertes(): number {
      return this.documentsExpires.length + this.documentsExpiresSous30Jours.length
    },
  },

  actions: {
    createDocument(payload: Omit<DocumentVehicule, 'id' | 'alerteEnvoyee' | 'createdAt'>): DocumentVehicule {
      const newDoc: DocumentVehicule = {
        ...payload,
        id: `doc-${String(this.documents.length + 1).padStart(3, '0')}`,
        alerteEnvoyee: false,
        createdAt: new Date().toISOString(),
      }
      this.documents.push(newDoc)
      return newDoc
    },

    updateDocument(id: string, payload: Partial<Omit<DocumentVehicule, 'id'>>): boolean {
      const index = this.documents.findIndex((d) => d.id === id)
      if (index === -1) return false
      this.documents[index] = { ...this.documents[index], ...payload }
      return true
    },

    deleteDocument(id: string): boolean {
      const index = this.documents.findIndex((d) => d.id === id)
      if (index === -1) return false
      this.documents.splice(index, 1)
      return true
    },

    marquerAlerteEnvoyee(id: string): boolean {
      const doc = this.documents.find((d) => d.id === id)
      if (!doc) return false
      doc.alerteEnvoyee = true
      return true
    },
  },
})

