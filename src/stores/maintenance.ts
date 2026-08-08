import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  OrdreTravail, StatutOT, Indisponibilite, CodeIndispo,
  DemandeAchat, PieceConsommee, PlanEntretien, EcheanceEntretien,
  InterventionMobile, SousSysteme,
} from '../types/maintenance'
import { familleDuCode } from '../types/maintenance'

/**
 * Maintenance & Interventions — module 3.
 *
 * Les nomenclatures viennent des documents de GTD (ISO 14224, CRM 2025).
 * Deux valeurs manquent et sont signalées comme telles :
 *   · le tarif horaire de la main-d'œuvre interne — le coût affiché ne
 *     couvre donc que les pièces et la sous-traitance ;
 *   · le coût d'immobilisation journalier — les jours perdus sont comptés,
 *     mais pas valorisés.
 */
export const useMaintenanceStore = defineStore('maintenance', () => {

  /* ══ Ordres de travail ═════════════════════════════════════ */
  const ordres = ref<OrdreTravail[]>([
    {
      id: 'OT-2026-0041', reference: 'OT-2026-0041',
      vehiculeId: 'TRC-001', vehiculePlaque: 'MG-7842-TX',
      origine: 'remontee_chauffeur', declarePar: 'Thierry Randriamanga',
      declareLe: '2026-07-28T06:40:00Z',
      symptome: 'Perte de pression d’air constatée à la pause de Moramanga. Le manomètre descend sous 6 bars au ralenti.',
      gravite: 'majeure', typeMaintenance: 'correctif',
      sousSysteme: 'circuit_air', modeDefaillance: 'fuite',
      causeRacine: 'maintenance_insuffisante',
      diagnostiquePar: 'Rakoto Andrianina', diagnostiqueLe: '2026-07-28T08:15:00Z',
      statut: 'attente_piece',
      mecaniciens: ['Rakoto Andrianina'],
      pieces: [
        { id: 'PC-001', reference: 'DESS-HW-400', designation: 'Dessiccateur d’air HOWO NX-400',
          quantite: 1, prixUnitaireAr: 1_850_000, origine: 'achat', demandeAchatId: 'DA-2026-0018' },
      ],
      temps: [{ id: 'TP-001', mecanicienNom: 'Rakoto Andrianina', heures: 2.5, date: '2026-07-28' }],
      kilometrage: 187_910,
    },
    {
      id: 'OT-2026-0040', reference: 'OT-2026-0040',
      vehiculeId: 'TRC-002', vehiculePlaque: 'MG-5671-TX',
      origine: 'alerte_preventive', declarePar: 'Système',
      declareLe: '2026-07-24T05:00:00Z',
      symptome: 'Échéance des 45 000 km atteinte : vidange moteur, filtres à huile, à air et à carburant.',
      gravite: 'mineure', typeMaintenance: 'preventif',
      sousSysteme: 'moteur', modeDefaillance: 'usure_excessive', causeRacine: 'environnement',
      diagnostiquePar: 'Rakoto Andrianina', diagnostiqueLe: '2026-07-24T07:00:00Z',
      statut: 'cloture',
      mecaniciens: ['Rakoto Andrianina', 'Solofo Rabe'],
      pieces: [
        { id: 'PC-010', reference: 'HUI-15W40-20L', designation: 'Huile moteur 15W40, bidon 20 L',
          quantite: 2, prixUnitaireAr: 420_000, origine: 'stock' },
        { id: 'PC-011', reference: 'FIL-HUI-NX', designation: 'Filtre à huile',
          quantite: 1, prixUnitaireAr: 165_000, origine: 'stock' },
        { id: 'PC-012', reference: 'FIL-AIR-NX', designation: 'Filtre à air',
          quantite: 1, prixUnitaireAr: 210_000, origine: 'stock' },
      ],
      temps: [{ id: 'TP-010', mecanicienNom: 'Rakoto Andrianina', heures: 4, date: '2026-07-24' }],
      travauxRealises: 'Vidange complète, remplacement des trois filtres, contrôle des niveaux et de la pression des pneumatiques.',
      clotureLe: '2026-07-24T15:30:00Z', cloturePar: 'Hery Ratsimba',
      coutPiecesAr: 1_215_000, kilometrage: 245_120,
    },
    {
      id: 'OT-2026-0039', reference: 'OT-2026-0039',
      vehiculeId: 'TRC-003', vehiculePlaque: 'MG-4410-TX',
      origine: 'checklist', declarePar: 'Jean-Luc Ravelo',
      declareLe: '2026-07-20T11:20:00Z',
      symptome: 'Frein de stationnement signalé défectueux à la checklist de la pause 3.',
      gravite: 'critique', typeMaintenance: 'correctif',
      sousSysteme: 'freinage', modeDefaillance: 'blocage', causeRacine: 'maintenance_insuffisante',
      diagnostiquePar: 'Solofo Rabe', diagnostiqueLe: '2026-07-20T14:00:00Z',
      statut: 'cloture',
      mecaniciens: ['Solofo Rabe'],
      pieces: [
        { id: 'PC-020', reference: 'CYL-FREIN-R', designation: 'Cylindre de frein arrière droit',
          quantite: 1, prixUnitaireAr: 980_000, origine: 'stock' },
      ],
      temps: [{ id: 'TP-020', mecanicienNom: 'Solofo Rabe', heures: 6, date: '2026-07-21' }],
      travauxRealises: 'Remplacement du cylindre, purge du circuit, essai routier.',
      clotureLe: '2026-07-21T17:00:00Z', cloturePar: 'Hery Ratsimba',
      coutPiecesAr: 980_000, kilometrage: 132_640,
    },
    {
      id: 'OT-2026-0038', reference: 'OT-2026-0038',
      vehiculeId: 'REM-001', vehiculePlaque: 'MG-1100-TR',
      origine: 'constat_garage', declarePar: 'Hery Ratsimba',
      declareLe: '2026-07-15T09:00:00Z',
      symptome: 'Suintement au niveau de la vanne de fond de citerne, constaté au dépotage.',
      gravite: 'critique', typeMaintenance: 'correctif',
      sousSysteme: 'citerne', modeDefaillance: 'fuite', causeRacine: 'fournisseur',
      diagnostiquePar: 'Hery Ratsimba', diagnostiqueLe: '2026-07-15T11:00:00Z',
      statut: 'cloture',
      mecaniciens: [],
      prestataire: 'Ateliers Citernes Tamatave', montantDevisAr: 3_400_000, sousGarantie: false,
      pieces: [],
      temps: [],
      travauxRealises: 'Remplacement du joint de vanne de fond et épreuve d’étanchéité.',
      clotureLe: '2026-07-19T16:00:00Z', cloturePar: 'Hery Ratsimba',
      coutPiecesAr: 3_400_000,
    },
  ])

  const getById = (id: string) => ordres.value.find(o => o.id === id)

  const ouverts = computed(() =>
    ordres.value.filter(o => o.statut !== 'cloture' && o.statut !== 'annule'))

  const enAttentePiece = computed(() =>
    ordres.value.filter(o => o.statut === 'attente_piece'))

  const ordresDuVehicule = (vehiculeId: string) =>
    ordres.value.filter(o => o.vehiculeId === vehiculeId)
      .sort((a, b) => +new Date(b.declareLe) - +new Date(a.declareLe))

  /** Coût des pièces et de la sous-traitance. La main-d'œuvre n'est pas
   *  valorisée : GTD n'a pas communiqué son tarif horaire interne. */
  function coutOT(o: OrdreTravail): number {
    const pieces = o.pieces.reduce((s, p) => s + p.quantite * p.prixUnitaireAr, 0)
    const presta = o.prestataire && !o.sousGarantie ? (o.montantDevisAr ?? 0) : 0
    return pieces + presta
  }

  function heuresOT(o: OrdreTravail): number {
    return o.temps.reduce((s, t) => s + t.heures, 0)
  }

  /* ══ Demandes d'achat — US 3.2.3 ═══════════════════════════ */
  const demandes = ref<DemandeAchat[]>([
    {
      id: 'DA-2026-0018', ordreTravailId: 'OT-2026-0041',
      reference: 'DESS-HW-400', designation: 'Dessiccateur d’air HOWO NX-400',
      quantite: 1, statut: 'commandee',
      fournisseur: 'SINOTRUCK Madagascar', numeroBonCommande: 'BC-2026-0312',
      dateDemande: '2026-07-28T09:00:00Z', dateCommande: '2026-07-28T14:20:00Z',
      montantAr: 1_850_000,
    },
  ])

  const demandesDeLOT = (otId: string) =>
    demandes.value.filter(d => d.ordreTravailId === otId)

  /** Délai réellement constaté entre la commande et la réception. */
  function delaiReception(d: DemandeAchat): number | null {
    if (!d.dateCommande || !d.dateReception) return null
    return Math.round((+new Date(d.dateReception) - +new Date(d.dateCommande)) / 86_400_000)
  }

  /* ══ Indisponibilités — US 3.3.1 ═══════════════════════════ */
  const indisponibilites = ref<Indisponibilite[]>([
    { id: 'IND-001', vehiculeId: 'TRC-001', vehiculePlaque: 'MG-7842-TX',
      code: 'PNN', famille: 'technique', debut: '2026-07-28T06:40:00Z',
      ordreTravailId: 'OT-2026-0041',
      commentaire: 'Immobilisé en attente du dessiccateur.' },
    { id: 'IND-002', vehiculeId: 'TRC-004', vehiculePlaque: 'MG-3356-TX',
      code: 'VET', famille: 'reglementaire', debut: '2026-07-22T08:00:00Z',
      commentaire: 'Vetting expiré, audit de conformité programmé.' },
    { id: 'IND-003', vehiculeId: 'TRC-002', vehiculePlaque: 'MG-5671-TX',
      code: 'MTN', famille: 'technique',
      debut: '2026-07-24T05:00:00Z', fin: '2026-07-24T15:30:00Z', dureeJours: 1,
      ordreTravailId: 'OT-2026-0040' },
    { id: 'IND-004', vehiculeId: 'TRC-003', vehiculePlaque: 'MG-4410-TX',
      code: 'PNN', famille: 'technique',
      debut: '2026-07-20T11:20:00Z', fin: '2026-07-21T17:00:00Z', dureeJours: 2,
      ordreTravailId: 'OT-2026-0039' },
    { id: 'IND-005', vehiculeId: 'REM-001', vehiculePlaque: 'MG-1100-TR',
      code: 'ACC', famille: 'technique',
      debut: '2026-07-15T09:00:00Z', fin: '2026-07-19T16:00:00Z', dureeJours: 5,
      ordreTravailId: 'OT-2026-0038' },
  ])

  const indisposEnCours = computed(() =>
    indisponibilites.value.filter(i => !i.fin))

  const indisposDuVehicule = (vehiculeId: string) =>
    indisponibilites.value.filter(i => i.vehiculeId === vehiculeId)

  /** Durée en jours, calculée si l'immobilisation dure encore. */
  function dureeIndispo(i: Indisponibilite): number {
    const fin = i.fin ? +new Date(i.fin) : Date.now()
    return Math.max(1, Math.round((fin - +new Date(i.debut)) / 86_400_000))
  }

  /** Jours perdus par famille de cause — US 3.3.1. */
  const joursPerdusParFamille = computed(() => {
    const acc: Record<string, number> = {
      technique: 0, reglementaire: 0, administrative: 0, humaine: 0,
    }
    indisponibilites.value.forEach(i => {
      acc[familleDuCode(i.code)] = (acc[familleDuCode(i.code)] ?? 0) + dureeIndispo(i)
    })
    return acc
  })

  /** Ratio jours perdus pour cause humaine contre cause technique. */
  const ratioHumainTechnique = computed(() => {
    const j = joursPerdusParFamille.value
    const tech = j.technique ?? 0
    return tech ? Number(((j.humaine ?? 0) / tech).toFixed(2)) : null
  })

  /* ══ Plans d'entretien — US 3.1.1 ══════════════════════════ */
  const plans = ref<PlanEntretien[]>([
    {
      id: 'PE-001', marque: 'SINOTRUCK', modele: 'HOWO NX-400', actif: true,
      operations: [
        { id: 'OP-01', libelle: 'Vidange moteur et filtre à huile', sousSysteme: 'moteur',        nature: 'remplacer', intervalleKm: 15_000 },
        { id: 'OP-02', libelle: 'Filtre à air',                     sousSysteme: 'moteur',        nature: 'remplacer', intervalleKm: 15_000 },
        { id: 'OP-03', libelle: 'Filtre à carburant',               sousSysteme: 'circuit_carburant', nature: 'remplacer', intervalleKm: 30_000 },
        { id: 'OP-04', libelle: 'Contrôle du circuit de freinage',  sousSysteme: 'freinage',      nature: 'verifier',  intervalleKm: 10_000 },
        { id: 'OP-05', libelle: 'Purge du réservoir d’air',         sousSysteme: 'circuit_air',   nature: 'verifier',  intervalleKm: 5_000 },
        { id: 'OP-06', libelle: 'Graissage sellette et attelage',   sousSysteme: 'chassis_tolerie', nature: 'lubrifier', intervalleKm: 10_000 },
        { id: 'OP-07', libelle: 'Contrôle de la boîte de vitesses', sousSysteme: 'transmission',  nature: 'verifier',  intervalleKm: 45_000 },
        { id: 'OP-08', libelle: 'Liquide de refroidissement',       sousSysteme: 'refroidissement', nature: 'remplacer', intervalleJours: 730 },
      ],
    },
  ])

  const planDuModele = (modele?: string) =>
    plans.value.find(p => p.actif && p.modele === modele)

  /* ══ Échéances préventives — US 3.1.2 ═════════════════════
     Une opération est due au premier des deux seuils atteint :
     kilométrage ou date. Le préavis d'alerte n'a pas été fixé par
     GTD ; on retient 1 000 km ou 15 jours, valeur à confirmer.
     ══════════════════════════════════════════════════════════ */
  const PREAVIS_KM = 1_000
  const PREAVIS_JOURS = 15

  /**
   * Échéances d'un véhicule, calculées depuis son plan d'entretien.
   * @param dernierPassage kilométrage du dernier entretien par opération
   */
  function echeancesDuVehicule(
    vehiculeId: string,
    plaque: string,
    modele: string | undefined,
    kmActuel: number,
    dernierPassage: Record<string, number> = {},
  ): EcheanceEntretien[] {
    const plan = planDuModele(modele)
    if (!plan) return []

    return plan.operations.map(op => {
      const base = dernierPassage[op.id] ?? 0
      const kmProchain = op.intervalleKm ? base + op.intervalleKm : undefined
      const kmRestants = kmProchain != null ? kmProchain - kmActuel : undefined

      let statut: EcheanceEntretien['statut'] = 'a_venir'
      if (kmRestants != null) {
        if (kmRestants < 0) statut = 'depassee'
        else if (kmRestants <= PREAVIS_KM) statut = 'proche'
      }

      return {
        vehiculeId, vehiculePlaque: plaque,
        operationId: op.id, operationLibelle: op.libelle,
        sousSysteme: op.sousSysteme, nature: op.nature,
        kmProchain, kmRestants, statut,
      }
    })
  }

  /* ══ Interventions de l'équipe mobile — US 3.3.2 ═══════════ */
  const interventionsMobiles = ref<InterventionMobile[]>([
    { id: 'IM-001', reference: 'IM-2026-0012', type: 'depannage_mecanique',
      vehiculeId: 'TRC-001', vehiculePlaque: 'MG-7842-TX',
      lieu: 'RN2, PK 296 — Ampasimadinika', lat: -18.52, lng: 49.05,
      declencheLe: '2026-07-28T07:10:00Z', arriveeLe: '2026-07-28T08:35:00Z',
      clotureLe: '2026-07-28T10:20:00Z',
      equipe: ['Naina Rakotobe (mission)', 'Fanja Rasoa (HSE)', 'Rakoto Andrianina (mécanique)'],
      resolu: false, ordreTravailId: 'OT-2026-0041',
      observation: 'Fuite non réparable sur place. Camion remorqué au garage d’Andoharanofotsy.' },
    { id: 'IM-002', reference: 'IM-2026-0011', type: 'controle_alcool_drogue',
      lieu: 'Relais de Moramanga',
      declencheLe: '2026-07-25T05:30:00Z', arriveeLe: '2026-07-25T05:45:00Z',
      clotureLe: '2026-07-25T08:00:00Z',
      equipe: ['Naina Rakotobe (mission)', 'Fanja Rasoa (HSE)'],
      resolu: true, testsRealises: 8, testsPositifs: 0,
      observation: 'Contrôle inopiné sur huit conducteurs. Aucun test positif.' },
  ])

  const mobilesEnCours = computed(() =>
    interventionsMobiles.value.filter(i => !i.clotureLe))

  /* ══ Indicateurs de fiabilité — US 3.5.1 ═══════════════════
     Les formules sont celles de la norme ISO 14224, citée par GTD.
     ══════════════════════════════════════════════════════════ */

  /** MTTR — temps moyen de réparation, de l'ouverture à la clôture.
   *  Le temps d'attente de pièce est isolé, comme le demande l'US 3.2.4. */
  const mttrHeures = computed(() => {
    const clos = ordres.value.filter(o => o.statut === 'cloture' && o.clotureLe)
    if (!clos.length) return null
    const total = clos.reduce((s, o) =>
      s + (+new Date(o.clotureLe!) - +new Date(o.declareLe)) / 3_600_000, 0)
    return Number((total / clos.length).toFixed(1))
  })

  /** MTBF — kilomètres moyens entre deux pannes correctives.
   *  Exprimé en kilomètres, faute d'un relevé d'heures de fonctionnement. */
  const mtbfKm = computed(() => {
    const correctifs = ordres.value
      .filter(o => o.typeMaintenance === 'correctif' && o.kilometrage != null)
    if (correctifs.length < 2) return null
    const parVehicule = new Map<string, number[]>()
    correctifs.forEach(o => {
      const l = parVehicule.get(o.vehiculeId) ?? []
      l.push(o.kilometrage!)
      parVehicule.set(o.vehiculeId, l)
    })
    const ecarts: number[] = []
    parVehicule.forEach(kms => {
      kms.sort((a, b) => a - b)
      for (let i = 1; i < kms.length; i++) ecarts.push(kms[i]! - kms[i - 1]!)
    })
    if (!ecarts.length) return null
    return Math.round(ecarts.reduce((a, b) => a + b, 0) / ecarts.length)
  })

  /** Ratio préventif / correctif — cible ≥ 60 % selon le cahier des charges. */
  const ratioPreventif = computed(() => {
    const total = ordres.value.filter(o => o.statut !== 'annule').length
    if (!total) return null
    const prev = ordres.value.filter(o => o.typeMaintenance === 'preventif').length
    return Math.round((prev / total) * 100)
  })

  /** Répartition des pannes par sous-système. */
  const pannesParSousSysteme = computed(() => {
    const acc = new Map<SousSysteme, number>()
    ordres.value
      .filter(o => o.typeMaintenance === 'correctif' && o.sousSysteme)
      .forEach(o => acc.set(o.sousSysteme!, (acc.get(o.sousSysteme!) ?? 0) + 1))
    return [...acc.entries()]
      .map(([sousSysteme, nb]) => ({ sousSysteme, nb }))
      .sort((a, b) => b.nb - a.nb)
  })

  /** Coût total de maintenance sur la période — pièces et sous-traitance. */
  const coutTotal = computed(() =>
    ordres.value.reduce((s, o) => s + coutOT(o), 0))

  /* ══ Actions ═══════════════════════════════════════════════ */
  function creerOT(data: Omit<OrdreTravail, 'id' | 'reference' | 'statut' | 'pieces' | 'temps' | 'mecaniciens'>) {
    const n = ordres.value.length + 42
    const ref = `OT-2026-${String(n).padStart(4, '0')}`
    ordres.value.unshift({
      ...data, id: ref, reference: ref,
      statut: 'ouvert', pieces: [], temps: [], mecaniciens: [],
    })
    // L'ouverture immobilise le véhicule — US 3.2.1
    indisponibilites.value.unshift({
      id: `IND-${Date.now()}`,
      vehiculeId: data.vehiculeId, vehiculePlaque: data.vehiculePlaque,
      code: data.typeMaintenance === 'preventif' ? 'MTN' : 'PNN',
      famille: 'technique',
      debut: new Date().toISOString(),
      ordreTravailId: ref,
    })
    return ref
  }

  function diagnostiquer(id: string, d: Pick<OrdreTravail, 'sousSysteme' | 'modeDefaillance' | 'causeRacine'>, par: string) {
    const o = getById(id)
    if (!o) return
    Object.assign(o, d, { diagnostiquePar: par, diagnostiqueLe: new Date().toISOString() })
    if (o.statut === 'ouvert') o.statut = 'diagnostique'
  }

  function ajouterPiece(id: string, p: Omit<PieceConsommee, 'id'>) {
    const o = getById(id)
    if (!o) return
    o.pieces.push({ ...p, id: `PC-${Date.now()}` })
    if (p.origine === 'achat') o.statut = 'attente_piece'
  }

  /** Clôture — exige diagnostic complet et travaux décrits (US 3.2.4). */
  function cloturer(id: string, travaux: string, par: string): boolean {
    const o = getById(id)
    if (!o) return false
    if (!o.sousSysteme || !o.modeDefaillance || !o.causeRacine) return false
    if (!travaux.trim()) return false

    o.statut = 'cloture'
    o.travauxRealises = travaux
    o.clotureLe = new Date().toISOString()
    o.cloturePar = par
    o.coutPiecesAr = coutOT(o)

    // La clôture met fin à l'indisponibilité et remet le véhicule en service
    const ind = indisponibilites.value.find(i => i.ordreTravailId === id && !i.fin)
    if (ind) {
      ind.fin = o.clotureLe
      ind.dureeJours = dureeIndispo(ind)
    }
    return true
  }

  return {
    ordres, getById, ouverts, enAttentePiece, ordresDuVehicule, coutOT, heuresOT,
    demandes, demandesDeLOT, delaiReception,
    indisponibilites, indisposEnCours, indisposDuVehicule, dureeIndispo,
    joursPerdusParFamille, ratioHumainTechnique,
    plans, planDuModele, echeancesDuVehicule, PREAVIS_KM, PREAVIS_JOURS,
    interventionsMobiles, mobilesEnCours,
    mttrHeures, mtbfKm, ratioPreventif, pannesParSousSysteme, coutTotal,
    creerOT, diagnostiquer, ajouterPiece, cloturer,
  }
})
