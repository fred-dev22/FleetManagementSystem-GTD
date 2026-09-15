import { defineStore } from 'pinia'
import { computed } from 'vue'
import type { BonCarburantChauffeur } from '../types/rh'

/**
 * Bons carburant chauffeur - avantage RH, sur le même principe que la
 * prime (Flotte → Conducteurs → fiche → onglet Score & prime).
 *
 * Volontairement séparé de `stores/carburant.ts` : un bon carburant
 * n'est pas une recharge de réservoir et ne doit jamais entrer dans le
 * calcul de consommation plein-à-plein du véhicule (retour client du
 * 02/09/2026).
 */
export const useBonsCarburantStore = defineStore('bonsCarburant', () => {

  const bons: BonCarburantChauffeur[] = [
    {
      id: 'BC-001', employeId: 'emp-010', chauffeurNom: 'Thierry Randriamanga',
      date: '2026-08-01', litres: 50, motif: 'Prime carburant mensuelle - score ≥ 90',
      statut: 'remis', attribuePar: 'Nirina Rasoamanana (RH)',
    },
    {
      id: 'BC-002', employeId: 'emp-011', chauffeurNom: 'Fiona Mungroo',
      date: '2026-08-01', litres: 30, motif: 'Prime carburant mensuelle - score ≥ 80',
      statut: 'remis', attribuePar: 'Nirina Rasoamanana (RH)',
    },
    {
      id: 'BC-003', employeId: 'emp-013', chauffeurNom: 'Jean-Luc Ravelo',
      date: '2026-08-20', litres: 20, motif: 'Trajet longue distance exceptionnel (Toamasina)',
      statut: 'attribue', attribuePar: 'Herimanana Rasolofo (Exploitation)',
    },
  ]

  const bonsDeLEmploye = (employeId: string) =>
    [...bons].filter(b => b.employeId === employeId).sort((a, b) => +new Date(b.date) - +new Date(a.date))

  const litresDuMois = (employeId: string, mois = new Date().toISOString().slice(0, 7)) =>
    bonsDeLEmploye(employeId)
      .filter(b => b.date.startsWith(mois))
      .reduce((s, b) => s + b.litres, 0)

  function ajouterBon(data: Omit<BonCarburantChauffeur, 'id' | 'statut'>) {
    bons.push({ ...data, id: `BC-${String(bons.length + 1).padStart(3, '0')}`, statut: 'attribue' })
  }

  function remettreBon(id: string) {
    const b = bons.find(b => b.id === id)
    if (b) b.statut = 'remis'
  }

  return { bons, bonsDeLEmploye, litresDuMois, ajouterBon, remettreBon }
})