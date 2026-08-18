import { defineStore } from 'pinia'
import type { DocumentVehicule } from '../types/index'
import type { CodeIndispo } from '../types/maintenance'
import { useConfigurationStore } from './configuration'

interface DocumentsVehiculesState {
  documents: DocumentVehicule[]
}

const TODAY = '2026-07-08'

/* ══════════════════════════════════════════════════════════════
   US 2.7.1 - Pièces réglementaires et codes d'indisponibilité
   ══════════════════════════════════════════════════════════════
   « Une pièce expirée bascule le véhicule en indisponibilité
   réglementaire avec le code correspondant - BRM, MDT, APV, VET,
   CTV - et bloque l'affectation à un voyage. »

   Le lien entre le type de pièce et le code manquait : les documents
   étaient suivis, les codes existaient, mais rien ne les reliait. Sans
   ce pont, une pièce expirée déclenchait une alerte sans aucune
   conséquence sur l'exploitation.

   Les libellés sont ceux employés par GTD. Les variantes rencontrées
   dans les données historiques sont ramenées au même code : « Visite
   technique » et « Visite Madauto » désignent le même contrôle.
   ══════════════════════════════════════════════════════════════ */

export interface PieceReglementaire {
  /** Libellé exact du type de document */
  type: string
  /** Code d'indisponibilité déclenché à l'expiration */
  code: CodeIndispo
  /** Une pièce non bloquante alerte sans interdire l'affectation */
  bloquante: boolean
}

export const PIECES_REGLEMENTAIRES: PieceReglementaire[] = [
  { type: 'Barémage',            code: 'BRM', bloquante: true },
  { type: 'Visite Madauto',      code: 'MDT', bloquante: true },
  { type: 'Visite technique',    code: 'MDT', bloquante: true },
  { type: 'Certificat APAVE',    code: 'APV', bloquante: true },
  { type: 'Vetting',             code: 'VET', bloquante: true },
  { type: 'Contre-visite',       code: 'CTV', bloquante: true },
  { type: 'Assurance',           code: 'APV', bloquante: true },
  /* La carte grise et la vignette sont suivies et alertées, mais leur
     expiration n'immobilise pas : elle se régularise sans passer au
     garage, et GTD ne leur a attribué aucun code d'indisponibilité. */
  { type: 'Carte grise',         code: 'APV', bloquante: false },
  { type: 'Vignette',            code: 'APV', bloquante: false },
]

/** Règle applicable à un type de document, ou null s'il n'est pas suivi. */
export function regleDe(type: string): PieceReglementaire | null {
  const t = type.trim().toLowerCase()
  return PIECES_REGLEMENTAIRES.find(p => p.type.toLowerCase() === t) ?? null
}

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

      /* ── Pièces réglementaires nommées par l'US 2.7.1 ──────────
         Barémage, visite Madauto, certificat APAVE, vetting et
         contre-visite étaient absents des données : la règle de blocage
         n'était donc démontrable sur aucun véhicule.

         TRC-004 porte un vetting expiré, ce que l'état de flotte du
         31/07 déclarait déjà au client sous le code VET sans qu'aucune
         pièce ne le justifie dans le système. */
      { id: 'doc-030', entityId: 'TRC-004', entityType: 'vehicule', type: 'Vetting',            numero: 'VET-2025-0412', dateEmission: '2025-06-25', dateExpiration: '2026-06-25', statut: 'archive', alerteEnvoyee: true,  createdAt: '2025-06-25T08:00:00Z' },
      { id: 'doc-031', entityId: 'TRC-004', entityType: 'vehicule', type: 'Barémage',           numero: 'BRM-2024-0188', dateEmission: '2024-09-12', dateExpiration: '2027-09-12', statut: 'valide',  alerteEnvoyee: false, createdAt: '2024-09-12T08:00:00Z' },
      { id: 'doc-032', entityId: 'TRC-001', entityType: 'vehicule', type: 'Vetting',            numero: 'VET-2026-0501', dateEmission: '2026-01-20', dateExpiration: '2027-01-20', statut: 'valide',  alerteEnvoyee: false, createdAt: '2026-01-20T08:00:00Z' },
      { id: 'doc-033', entityId: 'TRC-001', entityType: 'vehicule', type: 'Certificat APAVE',   numero: 'APV-2025-1140', dateEmission: '2025-11-08', dateExpiration: '2026-11-08', statut: 'valide',  alerteEnvoyee: false, createdAt: '2025-11-08T08:00:00Z' },
      { id: 'doc-034', entityId: 'TRC-002', entityType: 'vehicule', type: 'Vetting',            numero: 'VET-2025-0388', dateEmission: '2025-07-15', dateExpiration: '2026-07-15', statut: 'valide',  alerteEnvoyee: true,  createdAt: '2025-07-15T08:00:00Z' },
      { id: 'doc-035', entityId: 'TRC-003', entityType: 'vehicule', type: 'Contre-visite',      numero: 'CTV-2026-0067', dateEmission: '2026-05-30', dateExpiration: '2026-06-30', statut: 'archive', alerteEnvoyee: true,  createdAt: '2026-05-30T08:00:00Z' },
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

    /* Le préavis n'est plus figé à 30 jours : il vient des paramètres
       d'exploitation, où le seuil documentaire est ajustable. Le nom du
       getter est conservé pour ne pas casser ses appelants. */
    documentsExpiresSous30Jours: (state): DocumentVehicule[] => {
      const preavis = useConfigurationStore().parametres.preavisDocumentaireJours
      const today = new Date(TODAY)
      const limite = new Date(TODAY)
      limite.setDate(limite.getDate() + preavis)
      return state.documents.filter(d => {
        if (!d.dateExpiration) return false
        const exp = new Date(d.dateExpiration)
        return exp >= today && exp <= limite
      })
    },

    documentsExpires: (state): DocumentVehicule[] => {
      const today = new Date(TODAY)
      return state.documents.filter(d => d.dateExpiration && new Date(d.dateExpiration) < today)
    },

    countAlertes(): number {
      return this.documentsExpires.length + this.documentsExpiresSous30Jours.length
    },

    /* ══ US 2.7.1 - Conséquence d'une pièce expirée ═══════════ */

    /**
     * Pièces expirées et bloquantes d'une entité, véhicule ou conducteur.
     * Une pièce archivée reste comptée : c'est bien son expiration qui
     * l'a fait archiver, et le véhicule n'est pas en règle pour autant.
     */
    piecesBloquantes: (state) => (entityId: string): DocumentVehicule[] => {
      const today = new Date(TODAY)
      return state.documents.filter(d => {
        if (d.entityId !== entityId) return false
        if (!d.dateExpiration || new Date(d.dateExpiration) >= today) return false
        return regleDe(d.type)?.bloquante ?? false
      })
    },

    /**
     * Codes d'indisponibilité réglementaire actifs sur un véhicule.
     * Le statut du camion n'est jamais saisi à la main : il se déduit de
     * ses pièces. Un véhicule qui porte au moins un code ne peut pas
     * partir en voyage.
     */
    codesReglementaires(): (entityId: string) => { code: CodeIndispo; type: string; expireLe: string }[] {
      return (entityId: string) => this.piecesBloquantes(entityId).map(d => ({
        code: regleDe(d.type)!.code,
        type: d.type,
        expireLe: d.dateExpiration!,
      }))
    },

    /** Motif de refus d'affectation, ou null si l'entité est en règle. */
    motifBlocage(): (entityId: string) => string | null {
      return (entityId: string) => {
        const pieces = this.piecesBloquantes(entityId)
        if (!pieces.length) return null
        const detail = pieces
          .map(d => `${d.type} (${regleDe(d.type)!.code}), expiré le ${d.dateExpiration}`)
          .join(' · ')
        return pieces.length === 1
          ? `Pièce expirée : ${detail}.`
          : `${pieces.length} pièces expirées : ${detail}.`
      }
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