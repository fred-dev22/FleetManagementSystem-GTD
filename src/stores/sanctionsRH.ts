import { defineStore } from 'pinia'
import { computed } from 'vue'
import type { SanctionRH } from '../types/rh'

type TypeSanctionArg = SanctionRH['sanction']

/**
 * Infractions internes & sanctions RH - registre structuré, distinct
 * des infractions de conduite (ecarts.ts). Complète le dossier
 * conducteur (Flotte → Conducteurs → fiche → onglet RH).
 */
export const useSanctionsRHStore = defineStore('sanctionsRH', () => {

  const sanctions: SanctionRH[] = [
    {
      id: 'SAN-001', employeId: 'emp-011', employeNom: 'Fiona Mungroo',
      date: '2026-06-02', nature: 'absence_injustifiee',
      description: "Absence non justifiée le 2 juin, aucun appel ni certificat médical produit sous 48h.",
      sanction: 'avertissement_ecrit', statut: 'cloturee',
      responsable: 'Nirina Rasoamanana (RH)', dateCloture: '2026-06-10',
    },
    {
      id: 'SAN-002', employeId: 'emp-012', employeNom: 'Hery Rasoanaivo',
      date: '2026-07-18', nature: 'non_respect_consigne_securite',
      description: "Absence de casque et de gants lors d'une manipulation de flexible au dépôt GRT Antananarivo, constatée par le chef de garage.",
      sanction: 'avertissement_oral', statut: 'cloturee',
      responsable: 'Hery Ratsimba (Chef de garage)', dateCloture: '2026-07-19',
    },
    {
      id: 'SAN-003', employeId: 'emp-006', employeNom: 'Jean-Claude Rakotomalala',
      date: '2026-08-14', nature: 'retard_repete',
      description: "Troisième retard de plus de 45 minutes au contrôle de départ en un mois, sans prévenance de la tour de contrôle.",
      statut: 'en_cours', responsable: 'Nirina Rasoamanana (RH)',
    },
    {
      id: 'SAN-004', employeId: 'emp-013', employeNom: 'Jean-Luc Ravelo',
      date: '2026-08-25', nature: 'faute_professionnelle',
      description: "Écart de livraison hors tolérance sur le voyage VOY-2026-0146, note de protêt émise par le client sans signalement immédiat du chauffeur.",
      voyageId: 'VOY-005', voyageRef: 'VOY-2026-0146',
      statut: 'en_cours', responsable: 'Herimanana Rasolofo (Exploitation)',
    },
  ]

  const sanctionsDeLEmploye = (employeId: string) =>
    [...sanctions].filter(s => s.employeId === employeId).sort((a, b) => +new Date(b.date) - +new Date(a.date))

  const sanctionsEnCours = computed(() => sanctions.filter(s => s.statut === 'en_cours'))

  function ajouterSanction(data: Omit<SanctionRH, 'id' | 'statut'>) {
    sanctions.push({ ...data, id: `SAN-${String(sanctions.length + 1).padStart(3, '0')}`, statut: 'en_cours' })
  }

  function cloturerSanction(id: string, sanction?: TypeSanctionArg) {
    const s = sanctions.find(s => s.id === id)
    if (!s) return
    s.statut = 'cloturee'
    s.dateCloture = new Date().toISOString().slice(0, 10)
    if (sanction) s.sanction = sanction
  }

  return { sanctions, sanctionsDeLEmploye, sanctionsEnCours, ajouterSanction, cloturerSanction }
})