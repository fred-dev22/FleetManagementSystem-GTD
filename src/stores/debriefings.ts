import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DebriefingVoyage } from '../types/fms'

export const useDebriefingsStore = defineStore('debriefings', () => {
  const debriefings = ref<DebriefingVoyage[]>([
    {
      voyageId: 'VOY-001',
      remontees: 'Retour de tournée signalé avec un arrêt hors site déclaré et une légère divergence sur le plan de route.',
      actions: [
        { id: 'ACT-001', libelle: 'Vérifier la justification de l’arrêt hors site.', priorite: 'normale' },
        { id: 'ACT-002', libelle: 'Conformer le plan de route au point de passage manqué.', priorite: 'elevee' },
      ],
      signatureResponsable: 'M. RAZAFINDRATANDRA',
      signatureChauffeur: 'Thierry Randriamanga',
      dateCloture: '2026-07-24',
      planTrajetRespecte: false,
      arretsRespectes: false,
      reposRespectes: true,
      infractions: [
        { code: 'arret_non_autorise', nombre: 1, niveau: 'moyen' },
        { code: 'non_respect_plan', nombre: 1, niveau: 'leger' },
      ],
    },
  ])

  const getByVoyage = (voyageId: string) =>
    debriefings.value.find(d => d.voyageId === voyageId)

  return { debriefings, getByVoyage }
})
