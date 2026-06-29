import { defineStore } from 'pinia'
import type { AffectationChauffeur } from '../types/index'

export const useAffectationsChauffeursStore = defineStore(
  'affectationsChauffeurs',
  {
    state: () => ({
      affectations: [
        {
          id: 'AFF-001',
          chauffeurId: 'emp-010',
          chauffeurNom: 'Thierry Randriamanga',
          tracteurId: 'TRC-001',
          tracteurPlaque: '1234 TAN',
          dateDebut: '2024-01-10',
          createdAt: '2024-01-10T08:00:00Z',
        },
        {
          id: 'AFF-002',
          chauffeurId: 'emp-011',
          chauffeurNom: 'Fiona Mungroo',
          tracteurId: 'TRC-002',
          tracteurPlaque: '2345 TNR',
          dateDebut: '2024-02-15',
          createdAt: '2024-02-15T08:00:00Z',
        },
        {
          id: 'AFF-003',
          chauffeurId: 'emp-012',
          chauffeurNom: 'Nadia Oozeer',
          tracteurId: 'TRC-003',
          tracteurPlaque: '3456 MJN',
          dateDebut: '2024-03-20',
          createdAt: '2024-03-20T08:00:00Z',
        },
        {
          id: 'AFF-004',
          chauffeurId: 'emp-010',
          chauffeurNom: 'Thierry Randriamanga',
          tracteurId: 'TRC-005',
          tracteurPlaque: '5678 TAN',
          dateDebut: '2023-01-10',
          dateFin: '2023-12-31',
          createdAt: '2023-01-10T08:00:00Z',
        },
      ] as AffectationChauffeur[],
    }),

    getters: {
      affectationActiveParChauffeur:
        (state) =>
        (chauffeurId: string): AffectationChauffeur | undefined => {
          return state.affectations.find(
            (a) => a.chauffeurId === chauffeurId && !a.dateFin
          )
        },

      affectationActiveParTracteur:
        (state) =>
        (tracteurId: string): AffectationChauffeur | undefined => {
          return state.affectations.find(
            (a) => a.tracteurId === tracteurId && !a.dateFin
          )
        },

      historiqueParChauffeur:
        (state) =>
        (chauffeurId: string): AffectationChauffeur[] => {
          return state.affectations
            .filter((a) => a.chauffeurId === chauffeurId)
            .sort(
              (a, b) =>
                new Date(b.dateDebut).getTime() -
                new Date(a.dateDebut).getTime()
            )
        },

      historiqueParTracteur:
        (state) =>
        (tracteurId: string): AffectationChauffeur[] => {
          return state.affectations.filter((a) => a.tracteurId === tracteurId)
        },
    },

    actions: {
      affecter(
        chauffeurId: string,
        chauffeurNom: string,
        tracteurId: string,
        tracteurPlaque: string,
        dateDebut: string
      ): AffectationChauffeur {
        const affectationActiveChauffeur = this.affectations.find(
          (a) => a.chauffeurId === chauffeurId && !a.dateFin
        )
        if (affectationActiveChauffeur) {
          throw new Error(
            `Le chauffeur ${chauffeurNom} a déjà une affectation active (${affectationActiveChauffeur.id})`
          )
        }

        const affectationActiveTracteur = this.affectations.find(
          (a) => a.tracteurId === tracteurId && !a.dateFin
        )
        if (affectationActiveTracteur) {
          throw new Error(
            `Le tracteur ${tracteurPlaque} a déjà une affectation active (${affectationActiveTracteur.id})`
          )
        }

        const nextNumber = this.affectations.length + 1
        const newId = `AFF-${String(nextNumber).padStart(3, '0')}`

        const nouvelleAffectation: AffectationChauffeur = {
          id: newId,
          chauffeurId,
          chauffeurNom,
          tracteurId,
          tracteurPlaque,
          dateDebut,
          createdAt: new Date().toISOString(),
        }

        this.affectations.push(nouvelleAffectation)
        return nouvelleAffectation
      },

      terminerAffectation(affectationId: string, dateFin: string): void {
        const affectation = this.affectations.find(
          (a) => a.id === affectationId
        )
        if (!affectation) {
          throw new Error(`Affectation ${affectationId} introuvable`)
        }
        if (affectation.dateFin) {
          throw new Error(`Affectation ${affectationId} est déjà terminée`)
        }
        affectation.dateFin = dateFin
      },
    },
  }
)
