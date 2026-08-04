import { defineStore } from 'pinia'

export type ExamenType = 'visite_medicale' | 'permis' | 'formation_apth'
export type AptitudeChauffeur = 'apte' | 'non_apte' | 'a_renouveler'

export interface ExamenRegistre {
  id: string
  chauffeurId: string
  type: ExamenType
  date: string
  dateExpiration?: string
  aptitude?: AptitudeChauffeur
  libelle?: string
}

export const LIB_EXAMEN: Record<ExamenType, string> = {
  visite_medicale: 'Visite médicale',
  permis: 'Permis',
  formation_apth: 'Formation APTH',
}

export const LIB_APTITUDE: Record<AptitudeChauffeur, { label: string; cls: string }> = {
  apte: { label: 'Apte', cls: 'bg-success-bg text-success' },
  non_apte: { label: 'Inapte', cls: 'bg-danger-bg text-danger' },
  a_renouveler: { label: 'À renouveler', cls: 'bg-warning-bg text-warning' },
}

export const useRegistresStore = defineStore('registres', () => {
  const examens = [
    {
      id: 'EX-001', chauffeurId: 'emp-010', type: 'visite_medicale', date: '2026-01-10', dateExpiration: '2026-12-10', aptitude: 'apte',
    },
    {
      id: 'EX-002', chauffeurId: 'emp-010', type: 'permis', date: '2025-11-02', dateExpiration: '2027-11-02', aptitude: 'apte',
    },
    {
      id: 'EX-003', chauffeurId: 'emp-010', type: 'formation_apth', date: '2026-02-15', dateExpiration: '2027-02-15', aptitude: 'apte',
    },
  ] as ExamenRegistre[]

  const aptitudeChauffeur = (chauffeurId: string) => {
    const ex = examens.filter(e => e.chauffeurId === chauffeurId)
    const apte = ex.some(e => e.aptitude === 'apte')
    return {
      apte,
      motif: apte ? 'Aptitude conforme' : 'Aucune aptitude validée dans le registre',
    }
  }

  const examensDuChauffeur = (chauffeurId: string) =>
    examens.filter(e => e.chauffeurId === chauffeurId)

  return { examens, aptitudeChauffeur, examensDuChauffeur }
})
