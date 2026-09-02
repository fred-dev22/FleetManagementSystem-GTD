import { defineStore } from 'pinia'
import type { Attelage } from '../types/index'

export const useAttelagesStore = defineStore('attelages', {
  state: () => ({
    attelages: [
      { id: 'ATT-001', tracteurId: 'TRC-001', tracteurPlaque: 'MG-7842-TX', remorqueId: 'REM-001', remorquePlaque: 'MG-1100-TR', dateDebut: '2024-01-10', createdAt: '2024-01-10T08:00:00Z' },
      { id: 'ATT-002', tracteurId: 'TRC-003', tracteurPlaque: 'MG-5671-TX', remorqueId: 'REM-003', remorquePlaque: 'MG-1102-TR', dateDebut: '2024-03-20', createdAt: '2024-03-20T08:00:00Z' },
      { id: 'ATT-003', tracteurId: 'TRC-001', tracteurPlaque: 'MG-7842-TX', remorqueId: 'REM-005', remorquePlaque: 'MG-1104-TR', dateDebut: '2023-06-01', dateFin: '2023-12-31', createdAt: '2023-06-01T08:00:00Z' },
      { id: 'ATT-004', tracteurId: 'TRC-002', tracteurPlaque: 'MG-3356-TX', remorqueId: 'REM-002', remorquePlaque: 'MG-1101-TR', dateDebut: '2023-08-15', dateFin: '2024-01-20', createdAt: '2023-08-15T08:00:00Z' },
      { id: 'ATT-005', tracteurId: 'TRC-006', tracteurPlaque: '6789 TNR', remorqueId: 'REM-004', remorquePlaque: '4567 TNR', dateDebut: '2026-08-01', createdAt: '2026-08-01T08:00:00Z' },
    ] as Attelage[],
  }),

  getters: {
    attelageActifParTracteur:
      (state) =>
      (tracteurId: string): Attelage | undefined => {
        return state.attelages.find(
          (a) => a.tracteurId === tracteurId && !a.dateFin
        )
      },

    attelageActifParRemorque:
      (state) =>
      (remorqueId: string): Attelage | undefined => {
        return state.attelages.find(
          (a) => a.remorqueId === remorqueId && !a.dateFin
        )
      },

    historiqueParTracteur:
      (state) =>
      (tracteurId: string): Attelage[] => {
        return state.attelages
          .filter((a) => a.tracteurId === tracteurId)
          .sort(
            (a, b) =>
              new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime()
          )
      },

    historiqueParRemorque:
      (state) =>
      (remorqueId: string): Attelage[] => {
        return state.attelages.filter((a) => a.remorqueId === remorqueId)
      },
  },

  actions: {
    attacher(
      tracteurId: string,
      tracteurPlaque: string,
      remorqueId: string,
      remorquePlaque: string,
      dateDebut: string
    ): Attelage {
      const attelageActifTracteur = this.attelages.find(
        (a) => a.tracteurId === tracteurId && !a.dateFin
      )
      if (attelageActifTracteur) {
        throw new Error(
          `Le tracteur ${tracteurPlaque} a déjà un attelage actif (${attelageActifTracteur.id})`
        )
      }

      const attelageActifRemorque = this.attelages.find(
        (a) => a.remorqueId === remorqueId && !a.dateFin
      )
      if (attelageActifRemorque) {
        throw new Error(
          `La remorque ${remorquePlaque} a déjà un attelage actif (${attelageActifRemorque.id})`
        )
      }

      const nextNumber = this.attelages.length + 1
      const newId = `ATT-${String(nextNumber).padStart(3, '0')}`

      const nouvelAttelage: Attelage = {
        id: newId,
        tracteurId,
        tracteurPlaque,
        remorqueId,
        remorquePlaque,
        dateDebut,
        createdAt: new Date().toISOString(),
      }

      this.attelages.push(nouvelAttelage)
      return nouvelAttelage
    },

    detacher(attelageId: string, dateFin: string): void {
      const attelage = this.attelages.find((a) => a.id === attelageId)
      if (!attelage) {
        throw new Error(`Attelage ${attelageId} introuvable`)
      }
      if (attelage.dateFin) {
        throw new Error(`Attelage ${attelageId} est déjà terminé`)
      }
      attelage.dateFin = dateFin
    },
  },
})