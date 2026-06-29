import { defineStore } from 'pinia'
import type { Attelage } from '../types/index'

export const useAttelagesStore = defineStore('attelages', {
  state: () => ({
    attelages: [
      {
        id: 'ATT-001',
        tracteurId: 'TRACT-001',
        tracteurPlaque: 'AB-123-CD',
        remorqueId: 'REM-001',
        remorquePlaque: 'REM-AB-001',
        dateDebut: '2024-01-10',
      },
      {
        id: 'ATT-002',
        tracteurId: 'TRACT-002',
        tracteurPlaque: 'EF-456-GH',
        remorqueId: 'REM-002',
        remorquePlaque: 'REM-EF-002',
        dateDebut: '2024-02-15',
      },
      {
        id: 'ATT-003',
        tracteurId: 'TRACT-003',
        tracteurPlaque: 'IJ-789-KL',
        remorqueId: 'REM-003',
        remorquePlaque: 'REM-IJ-003',
        dateDebut: '2024-03-20',
      },
      {
        id: 'ATT-004',
        tracteurId: 'TRACT-004',
        tracteurPlaque: 'MN-012-OP',
        remorqueId: 'REM-004',
        remorquePlaque: 'REM-MN-004',
        dateDebut: '2024-04-05',
      },
      {
        id: 'ATT-005',
        tracteurId: 'TRACT-001',
        tracteurPlaque: 'AB-123-CD',
        remorqueId: 'REM-005',
        remorquePlaque: 'REM-AB-005',
        dateDebut: '2023-06-01',
        dateFin: '2023-12-31',
      },
      {
        id: 'ATT-006',
        tracteurId: 'TRACT-002',
        tracteurPlaque: 'EF-456-GH',
        remorqueId: 'REM-006',
        remorquePlaque: 'REM-EF-006',
        dateDebut: '2023-08-15',
        dateFin: '2024-01-20',
      },
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
