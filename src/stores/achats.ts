import { defineStore } from 'pinia'
import { computed } from 'vue'
import type { Fournisseur, ProduitStock, MouvementStock } from '../types/maintenance'

/**
 * Achats & stock de pièces.
 *
 * Complète `DemandeAchat` (maintenance.ts, une demande par intervention)
 * avec un catalogue partagé : les mêmes pièces reviennent d'un ordre de
 * travail à l'autre, mais jusqu'ici chacune était ressaisie en texte libre.
 * Ici, un produit a un stock réel, un fournisseur principal, et chaque
 * sortie de stock trace l'intervention, le véhicule et le kilométrage
 * qui l'ont consommée - la chaîne complète demandée par le client :
 * Fournisseur ↔ Produit ↔ Stock ↔ Intervention ↔ Kilométrage.
 */
export const useAchatsStore = defineStore('achats', () => {

  const fournisseurs: Fournisseur[] = [
    { id: 'FRS-001', nom: 'SINOTRUCK Pièces Madagascar', contact: 'Rija Andriamampionona', telephone: '034 12 345 67', delaiLivraisonJoursMoyen: 5, actif: true },
    { id: 'FRS-002', nom: 'Filtres & Lubrifiants Océan Indien', contact: 'Nirina Ravalison', telephone: '033 98 765 43', delaiLivraisonJoursMoyen: 3, actif: true },
    { id: 'FRS-003', nom: 'Freinage Pro Antananarivo', contact: 'Tiana Rakotoson', telephone: '032 55 112 20', delaiLivraisonJoursMoyen: 7, actif: true },
    { id: 'FRS-004', nom: 'Électricité Poids Lourds SARL', contact: 'Herimanana Rasolofo', telephone: '034 77 220 10', delaiLivraisonJoursMoyen: 6, actif: true },
    { id: 'FRS-005', nom: 'Ancien fournisseur - citerne', actif: false },
  ]

  const produits: ProduitStock[] = [
    { id: 'PRD-001', reference: 'FIL-HUI-NX', designation: 'Filtre à huile SINOTRUCK NX-400', sousSysteme: 'moteur',       fournisseurPrincipalId: 'FRS-002', prixUnitaireAr: 165_000, stockActuel: 14, seuilAlerte: 6  },
    { id: 'PRD-002', reference: 'FIL-AIR-NX', designation: 'Filtre à air SINOTRUCK NX-400',   sousSysteme: 'moteur',       fournisseurPrincipalId: 'FRS-002', prixUnitaireAr: 210_000, stockActuel: 9,  seuilAlerte: 6  },
    { id: 'PRD-003', reference: 'FIL-GAZ-NX', designation: 'Filtre à gazole SINOTRUCK NX-400', sousSysteme: 'circuit_carburant', fournisseurPrincipalId: 'FRS-002', prixUnitaireAr: 185_000, stockActuel: 4,  seuilAlerte: 6  },
    { id: 'PRD-004', reference: 'CYL-FRN-NX', designation: 'Cylindre de frein avant',          sousSysteme: 'freinage',     fournisseurPrincipalId: 'FRS-003', prixUnitaireAr: 980_000, stockActuel: 2,  seuilAlerte: 2  },
    { id: 'PRD-005', reference: 'PLQ-FRN-NX', designation: 'Jeu de plaquettes de frein avant',  sousSysteme: 'freinage',     fournisseurPrincipalId: 'FRS-003', prixUnitaireAr: 420_000, stockActuel: 8,  seuilAlerte: 4  },
    { id: 'PRD-006', reference: 'BAT-12V-NX', designation: 'Batterie 12V 180Ah',                sousSysteme: 'electricite', fournisseurPrincipalId: 'FRS-004', prixUnitaireAr: 650_000, stockActuel: 3,  seuilAlerte: 3  },
    { id: 'PRD-007', reference: 'COUR-DIS-NX', designation: 'Courroie de distribution',         sousSysteme: 'moteur',       fournisseurPrincipalId: 'FRS-001', prixUnitaireAr: 340_000, stockActuel: 5,  seuilAlerte: 3  },
  ]

  /* Historique des mouvements - entrées (réceptions de commande) et
     sorties (bons de sortie magasin), certaines déjà liées à un OT. */
  const mouvements: MouvementStock[] = [
    { id: 'MVT-001', produitId: 'PRD-001', type: 'entree', quantite: 20, date: '2026-07-01', motif: 'Réception commande initiale',
      fournisseurId: 'FRS-002', numeroBonCommande: 'BC-2026-014', stockApres: 20 },
    { id: 'MVT-002', produitId: 'PRD-001', type: 'sortie', quantite: 1, date: '2026-07-24', motif: 'Vidange complète',
      ordreTravailId: 'OT-2026-0040', vehiculePlaque: '2345 TNR', kilometrage: 245_120, stockApres: 19 },
    { id: 'MVT-003', produitId: 'PRD-002', type: 'sortie', quantite: 1, date: '2026-07-24', motif: 'Vidange complète',
      ordreTravailId: 'OT-2026-0040', vehiculePlaque: '2345 TNR', kilometrage: 245_120, stockApres: 9 },
    { id: 'MVT-004', produitId: 'PRD-004', type: 'sortie', quantite: 1, date: '2026-07-21', motif: 'Cylindre de frein hors service',
      ordreTravailId: 'OT-2026-0039', vehiculePlaque: '3456 MJN', kilometrage: 132_640, stockApres: 2 },
    { id: 'MVT-005', produitId: 'PRD-003', type: 'sortie', quantite: 3, date: '2026-08-10', motif: 'Interventions successives - filtre à gazole',
      stockApres: 4 },
  ]

  const getProduit = (id: string) => produits.find(p => p.id === id)
  const getProduitParReference = (reference: string) => produits.find(p => p.reference === reference)
  const getFournisseur = (id: string) => fournisseurs.find(f => f.id === id)

  const produitsSousSeuil = computed(() => produits.filter(p => p.stockActuel <= p.seuilAlerte))

  const mouvementsDuProduit = (produitId: string) =>
    [...mouvements].filter(m => m.produitId === produitId).sort((a, b) => +new Date(b.date) - +new Date(a.date))

  const valeurStock = computed(() => produits.reduce((s, p) => s + p.stockActuel * p.prixUnitaireAr, 0))

  /**
   * Sortie de stock consommée par une intervention (US 3.2.3, pièce
   * d'origine « stock »). Crée le mouvement et décrémente le produit ;
   * si la référence n'existe pas encore au catalogue, ne bloque pas
   * la pièce sur l'ordre de travail - elle reste seulement hors stock suivi.
   */
  function sortirDuStock(reference: string, quantite: number, ordreTravailId: string, vehiculePlaque?: string, kilometrage?: number, motif = 'Consommée sur intervention') {
    const produit = getProduitParReference(reference)
    if (!produit) return null
    produit.stockActuel = Math.max(0, produit.stockActuel - quantite)
    const m: MouvementStock = {
      id: `MVT-${Date.now()}`, produitId: produit.id, type: 'sortie', quantite, date: new Date().toISOString().slice(0, 10),
      motif, ordreTravailId, vehiculePlaque, kilometrage, stockApres: produit.stockActuel,
    }
    mouvements.push(m)
    return m
  }

  /** Réception d'un bon de commande : incrémente le stock du produit reçu. */
  function receptionnerCommande(produitId: string, quantite: number, fournisseurId: string, numeroBonCommande: string) {
    const produit = getProduit(produitId)
    if (!produit) return null
    produit.stockActuel += quantite
    const m: MouvementStock = {
      id: `MVT-${Date.now()}`, produitId, type: 'entree', quantite, date: new Date().toISOString().slice(0, 10),
      motif: 'Réception commande', fournisseurId, numeroBonCommande, stockApres: produit.stockActuel,
    }
    mouvements.push(m)
    return m
  }

  return {
    fournisseurs, produits, mouvements,
    getProduit, getProduitParReference, getFournisseur,
    produitsSousSeuil, mouvementsDuProduit, valeurStock,
    sortirDuStock, receptionnerCommande,
  }
})