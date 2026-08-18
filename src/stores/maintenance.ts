import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  MAX_PANNES_SIMULTANEES, COMPETENCE_PAR_SOUS_SYSTEME, PRIORITE_PAR_GRAVITE,
} from '../types/maintenance'
import type {
  OrdreTravail, StatutOT, Indisponibilite, CodeIndispo, PanneDiagnostiquee, CompetenceAtelier,
  DemandeAchat, PieceConsommee, PlanEntretien, OperationEntretien, EcheanceEntretien,
  InterventionMobile, SousSysteme, ParametresAtelier,
} from '../types/maintenance'
import { familleDuCode } from '../types/maintenance'
import { useConfigurationStore } from './configuration'

/**
 * Maintenance & Interventions - module 3.
 *
 * Les nomenclatures viennent des documents de GTD (ISO 14224, CRM 2025).
 *
 * Trois valeurs bloquaient autant d'indicateurs et restaient à obtenir de
 * GTD : la capacité de l'atelier, le tarif horaire de la main-d'œuvre
 * interne et le coût d'immobilisation journalier. Elles ne sont toujours
 * pas inventées, mais elles ne sont plus hors d'atteinte : l'exploitation
 * les saisit depuis Maintenance → Paramétrage → Atelier, et les indicateurs
 * correspondants apparaissent dès la saisie. Tant qu'elles valent null,
 * les calculs retournent null et l'écran affiche la raison.
 */
export const useMaintenanceStore = defineStore('maintenance', () => {

  /* ══════════════════════════════════════════════════════════
     Paramètres de l'atelier - les trois valeurs attendues de GTD
     ══════════════════════════════════════════════════════════ */
  const parametresAtelier = ref<ParametresAtelier>({
    capacite: {
      site: 'Andoharanofotsy',
      postes: null,
      heuresParJour: null,
      joursOuvresParSemaine: 6,   // du lundi au samedi
    },
    mainOeuvre: {
      tarifUniqueAr: null,
      parCompetence: {},
    },
    immobilisation: {
      moyenJourAr: null,
      tracteurJourAr: null,
      citerneJourAr: null,
    },
  })

  function majParametresAtelier(data: Partial<ParametresAtelier>) {
    Object.assign(parametresAtelier.value, data)
  }

  /** Vrai tant que GTD n'a pas communiqué la capacité de l'atelier. */
  const capaciteRenseignee = computed(() => {
    const c = parametresAtelier.value.capacite
    return !!(c.postes && c.heuresParJour)
  })

  /** Heures ouvrables par jour, tous postes confondus. */
  const capaciteHeuresParJour = computed(() => {
    const c = parametresAtelier.value.capacite
    return c.postes && c.heuresParJour ? c.postes * c.heuresParJour : null
  })

  /** Heures ouvrables sur une semaine complète. */
  const capaciteHeuresParSemaine = computed(() => {
    const c = parametresAtelier.value.capacite
    return capaciteHeuresParJour.value && c.joursOuvresParSemaine
      ? capaciteHeuresParJour.value * c.joursOuvresParSemaine
      : null
  })

  /** Vrai dès qu'un tarif horaire, unique ou par spécialité, est connu. */
  const tarifRenseigne = computed(() => {
    const m = parametresAtelier.value.mainOeuvre
    return m.tarifUniqueAr != null || Object.keys(m.parCompetence).length > 0
  })

  /** Vrai dès qu'un coût d'immobilisation journalier est connu. */
  const coutImmoRenseigne = computed(() => {
    const i = parametresAtelier.value.immobilisation
    return i.moyenJourAr != null || i.tracteurJourAr != null || i.citerneJourAr != null
  })

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
      kilometrage: 187_910, dureeEstimeeH: 6, planifieeLe: '2026-08-04',
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

  /** Coût des pièces réellement consommées. */
  function coutPieces(o: OrdreTravail): number {
    return o.pieces.reduce((s, p) => s + p.quantite * p.prixUnitaireAr, 0)
  }

  /** Coût de la sous-traitance. Une intervention sous garantie n'est pas
   *  supportée par GTD et n'entre donc pas dans le coût - US 3.2.5. */
  function coutSousTraitance(o: OrdreTravail): number {
    return o.prestataire && !o.sousGarantie ? (o.montantDevisAr ?? 0) : 0
  }

  /**
   * Tarif horaire applicable à une intervention, en ariary.
   * Le tarif de la spécialité prime sur le tarif unique ; à défaut des deux,
   * la main-d'œuvre reste non valorisée et la fonction renvoie null.
   */
  function tarifHoraireDe(o: OrdreTravail): number | null {
    const m = parametresAtelier.value.mainOeuvre
    const c = o.sousSysteme ? COMPETENCE_PAR_SOUS_SYSTEME[o.sousSysteme] : null
    return (c ? m.parCompetence[c] : undefined) ?? m.tarifUniqueAr ?? null
  }

  /**
   * Coût de la main-d'œuvre interne : heures réellement passées × tarif.
   * Le temps est enregistré depuis le début ; seul le tarif manquait.
   * Renvoie null tant qu'aucun tarif n'est paramétré - jamais zéro, qui
   * se confondrait avec une intervention sans main-d'œuvre.
   */
  function coutMainOeuvre(o: OrdreTravail): number | null {
    const tarif = tarifHoraireDe(o)
    if (tarif == null) return null
    return Math.round(heuresOT(o) * tarif)
  }

  /**
   * Coût complet d'une intervention : pièces, sous-traitance et main-d'œuvre.
   * Tant que le tarif horaire n'est pas renseigné, seules les deux premières
   * composantes entrent dans le total - l'écran le signale.
   */
  function coutOT(o: OrdreTravail): number {
    return coutPieces(o) + coutSousTraitance(o) + (coutMainOeuvre(o) ?? 0)
  }

  function heuresOT(o: OrdreTravail): number {
    return o.temps.reduce((s, t) => s + t.heures, 0)
  }

  /* ══ Demandes d'achat - US 3.2.3 ═══════════════════════════ */
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

  /* ══ Indisponibilités - US 3.3.1 ═══════════════════════════ */
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

  /** Jours perdus par famille de cause - US 3.3.1. */
  const joursPerdusParFamille = computed(() => {
    const acc: Record<string, number> = {
      technique: 0, reglementaire: 0, administrative: 0, humaine: 0,
    }
    indisponibilites.value.forEach(i => {
      acc[familleDuCode(i.code)] = (acc[familleDuCode(i.code)] ?? 0) + dureeIndispo(i)
    })
    return acc
  })

  /**
   * Coût journalier d'immobilisation applicable à un véhicule.
   * Le coût du type de véhicule prime sur la moyenne ; à défaut des deux,
   * les jours perdus restent des jours et la fonction renvoie null.
   *
   * Le type est déduit de la plaque : les citernes et remorques de GTD
   * portent le suffixe TR, les tracteurs le suffixe TX.
   */
  function coutJournalierDe(i: Indisponibilite): number | null {
    const c = parametresAtelier.value.immobilisation
    const estRemorque = /TR$/i.test(i.vehiculePlaque.trim())
    const specifique = estRemorque ? c.citerneJourAr : c.tracteurJourAr
    return specifique ?? c.moyenJourAr ?? null
  }

  /**
   * Coût réel d'une immobilisation : durée × manque à gagner journalier.
   * C'est l'argument le plus parlant face au client - « ce vetting expiré
   * vous a coûté tant » - mais il suppose une valeur que seul GTD détient.
   */
  function coutIndispo(i: Indisponibilite): number | null {
    const j = coutJournalierDe(i)
    if (j == null) return null
    return dureeIndispo(i) * j
  }

  /** Coût des jours perdus par famille de cause, quand il est calculable. */
  const coutParFamille = computed(() => {
    if (!coutImmoRenseigne.value) return null
    const acc: Record<string, number> = {
      technique: 0, reglementaire: 0, administrative: 0, humaine: 0,
    }
    indisponibilites.value.forEach(i => {
      const f = familleDuCode(i.code)
      acc[f] = (acc[f] ?? 0) + (coutIndispo(i) ?? 0)
    })
    return acc
  })

  /** Coût total des immobilisations sur la période observée. */
  const coutTotalImmobilisations = computed(() => {
    if (!coutImmoRenseigne.value) return null
    return indisponibilites.value.reduce((s, i) => s + (coutIndispo(i) ?? 0), 0)
  })

  /** Ratio jours perdus pour cause humaine contre cause technique. */
  const ratioHumainTechnique = computed(() => {
    const j = joursPerdusParFamille.value
    const tech = j.technique ?? 0
    return tech ? Number(((j.humaine ?? 0) / tech).toFixed(2)) : null
  })

  /* ══ Plans d'entretien - US 3.1.1 ══════════════════════════
     Un seul plan constructeur a été transmis par GTD, celui du
     SINOTRUCK HOWO NX-400. Il est conservé tel quel. Les plans des
     autres modèles du parc ne sont pas inventés : ils se saisissent
     depuis Maintenance → Paramétrage → Plans d'entretien, et l'écran
     signale en permanence les modèles qui en sont dépourvus.
     ══════════════════════════════════════════════════════════ */
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

  const getPlan = (id: string) => plans.value.find(p => p.id === id)

  /* ── CRUD des plans - US 3.1.1 ────────────────────────────────
     « Le plan constructeur fourni sert de référence initiale et reste
     modifiable. » Le responsable maintenance saisit lui-même les plans
     des modèles manquants, sans intervention technique.
     ────────────────────────────────────────────────────────────── */

  let seqPlan = plans.value.length
  let seqOperation = 0

  /** Un modèle ne peut porter qu'un seul plan : le doublon est refusé. */
  function creerPlan(marque: string, modele: string): string | null {
    if (!marque.trim() || !modele.trim()) return null
    if (plans.value.some(p => p.modele.toLowerCase() === modele.trim().toLowerCase())) return null
    const id = `PE-${String(++seqPlan).padStart(3, '0')}`
    plans.value.push({
      id, marque: marque.trim(), modele: modele.trim(), actif: true, operations: [],
    })
    return id
  }

  function majPlan(id: string, data: Partial<Pick<PlanEntretien, 'marque' | 'modele' | 'actif'>>) {
    const p = getPlan(id)
    if (p) Object.assign(p, data)
  }

  function basculerPlanActif(id: string) {
    const p = getPlan(id)
    if (p) p.actif = !p.actif
  }

  /**
   * Un plan n'est supprimable que s'il ne sert à aucun véhicule du parc.
   * Le contrôle appartient à l'appelant, qui seul connaît le parc ;
   * la fonction se contente de refuser un identifiant inconnu.
   */
  function supprimerPlan(id: string): boolean {
    const i = plans.value.findIndex(p => p.id === id)
    if (i < 0) return false
    plans.value.splice(i, 1)
    return true
  }

  /**
   * Duplique un plan vers un nouveau modèle. Deux modèles d'une même
   * marque partagent souvent le même plan constructeur : le recopier
   * évite de ressaisir vingt lignes pour en changer trois.
   */
  function dupliquerPlan(id: string, marque: string, modele: string): string | null {
    const source = getPlan(id)
    if (!source) return null
    const nouveau = creerPlan(marque, modele)
    if (!nouveau) return null
    const cible = getPlan(nouveau)!
    cible.operations = source.operations.map(op => ({
      ...op, id: `OP-${Date.now()}-${++seqOperation}`,
    }))
    return nouveau
  }

  /** Une opération sans intervalle ne déclencherait jamais rien : elle est refusée. */
  function ajouterOperation(planId: string, op: Omit<OperationEntretien, 'id'>): boolean {
    const p = getPlan(planId)
    if (!p) return false
    if (!op.libelle.trim()) return false
    if (!op.intervalleKm && !op.intervalleJours) return false
    p.operations.push({ ...op, libelle: op.libelle.trim(), id: `OP-${Date.now()}-${++seqOperation}` })
    return true
  }

  function majOperation(planId: string, opId: string, data: Partial<OperationEntretien>): boolean {
    const op = getPlan(planId)?.operations.find(o => o.id === opId)
    if (!op) return false
    const fusion = { ...op, ...data }
    if (!fusion.intervalleKm && !fusion.intervalleJours) return false
    Object.assign(op, data)
    return true
  }

  function supprimerOperation(planId: string, opId: string): boolean {
    const p = getPlan(planId)
    if (!p) return false
    const i = p.operations.findIndex(o => o.id === opId)
    if (i < 0) return false
    p.operations.splice(i, 1)
    return true
  }

  /* ══ Échéances préventives - US 3.1.2 ═════════════════════
     Une opération est due au premier des deux seuils atteint :
     kilométrage ou date, selon le plan constructeur.

     Le préavis n'est plus figé dans le code : il vient des paramètres
     d'exploitation, où le chef de garage l'ajuste lui-même selon le
     délai d'approvisionnement des pièces.
     ══════════════════════════════════════════════════════════ */
  const config = useConfigurationStore()

  const PREAVIS_KM    = computed(() => config.parametres.preavisEntretienKm)
  const PREAVIS_JOURS = computed(() => config.parametres.preavisEntretienJours)

  /**
   * Échéances d'un véhicule, calculées depuis son plan d'entretien.
   * @param dernierPassage kilométrage du dernier entretien par opération
   * @param dernierPassageDate date du dernier entretien par opération, pour
   *        les opérations à intervalle calendaire
   */
  function echeancesDuVehicule(
    vehiculeId: string,
    plaque: string,
    modele: string | undefined,
    kmActuel: number,
    dernierPassage: Record<string, number> = {},
    dernierPassageDate: Record<string, string> = {},
  ): EcheanceEntretien[] {
    const plan = planDuModele(modele)
    if (!plan) return []

    const maintenant = Date.now()

    return plan.operations.map(op => {
      /* Volet kilométrique */
      const base = dernierPassage[op.id] ?? 0
      const kmProchain = op.intervalleKm ? base + op.intervalleKm : undefined
      const kmRestants = kmProchain != null ? kmProchain - kmActuel : undefined

      /* Volet calendaire - l'opération OP-08 du plan HOWO n'a pas
         d'intervalle kilométrique, seulement un intervalle en jours */
      let dateProchaine: string | undefined
      let joursRestants: number | undefined
      if (op.intervalleJours) {
        const depart = dernierPassageDate[op.id]
        if (depart) {
          const echeance = new Date(depart)
          echeance.setDate(echeance.getDate() + op.intervalleJours)
          dateProchaine = echeance.toISOString().slice(0, 10)
          joursRestants = Math.ceil((+echeance - maintenant) / 86_400_000)
        }
      }

      /* Le déclenchement se fait au premier des deux seuils atteint :
         le statut le plus urgent des deux volets l'emporte. */
      let statut: EcheanceEntretien['statut'] = 'a_venir'
      const depassee =
        (kmRestants != null && kmRestants < 0) ||
        (joursRestants != null && joursRestants < 0)
      const proche =
        (kmRestants != null && kmRestants <= PREAVIS_KM.value) ||
        (joursRestants != null && joursRestants <= PREAVIS_JOURS.value)

      if (depassee) statut = 'depassee'
      else if (proche) statut = 'proche'

      return {
        vehiculeId, vehiculePlaque: plaque,
        operationId: op.id, operationLibelle: op.libelle,
        sousSysteme: op.sousSysteme, nature: op.nature,
        kmProchain, kmRestants, dateProchaine, joursRestants, statut,
      }
    })
  }

  /* ══ Interventions de l'équipe mobile - US 3.3.2 ═══════════ */
  const interventionsMobiles = ref<InterventionMobile[]>([
    { id: 'IM-001', reference: 'IM-2026-0012', type: 'depannage_mecanique',
      vehiculeId: 'TRC-001', vehiculePlaque: 'MG-7842-TX',
      lieu: 'RN2, PK 296 - Ampasimadinika', lat: -18.52, lng: 49.05,
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

  /* ══ Indicateurs de fiabilité - US 3.5.1 ═══════════════════
     Les formules sont celles de la norme ISO 14224, citée par GTD.
     ══════════════════════════════════════════════════════════ */

  /** MTTR - temps moyen de réparation, de l'ouverture à la clôture.
   *  Le temps d'attente de pièce est isolé, comme le demande l'US 3.2.4. */
  const mttrHeures = computed(() => {
    const clos = ordres.value.filter(o => o.statut === 'cloture' && o.clotureLe)
    if (!clos.length) return null
    const total = clos.reduce((s, o) =>
      s + (+new Date(o.clotureLe!) - +new Date(o.declareLe)) / 3_600_000, 0)
    return Number((total / clos.length).toFixed(1))
  })

  /** MTBF - kilomètres moyens entre deux pannes correctives.
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

  /** Ratio préventif / correctif - cible ≥ 60 % selon le cahier des charges. */
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

  /** Coût total de maintenance sur la période - pièces et sous-traitance. */
  const coutTotal = computed(() =>
    ordres.value.reduce((s, o) => s + coutOT(o), 0))


  /* ══════════════════════════════════════════════════════════
     Indicateurs complémentaires exigés par les user stories
     ══════════════════════════════════════════════════════════ */

  /** US 3.5.1 - MTBF calculé par sous-système, et non plus seulement global. */
  const mtbfParSousSysteme = computed(() => {
    const parSS = new Map<SousSysteme, number[]>()
    ordres.value
      .filter(o => o.typeMaintenance === 'correctif' && o.sousSysteme && o.kilometrage != null)
      .forEach(o => {
        const l = parSS.get(o.sousSysteme!) ?? []
        l.push(o.kilometrage!)
        parSS.set(o.sousSysteme!, l)
      })

    const out: { sousSysteme: SousSysteme; mtbfKm: number | null; nb: number }[] = []
    parSS.forEach((kms, ss) => {
      kms.sort((a, b) => a - b)
      const ecarts: number[] = []
      for (let i = 1; i < kms.length; i++) ecarts.push(kms[i]! - kms[i - 1]!)
      out.push({
        sousSysteme: ss,
        mtbfKm: ecarts.length ? Math.round(ecarts.reduce((a, b) => a + b, 0) / ecarts.length) : null,
        nb: kms.length,
      })
    })
    return out.sort((a, b) => b.nb - a.nb)
  })

  /**
   * US 3.3.1 - Taux de disponibilité de la flotte.
   * Jours disponibles rapportés aux jours théoriques sur la période.
   * @param nbVehicules effectif du parc, détenu par le référentiel véhicules
   * @param joursPeriode durée de la période observée
   */
  function tauxDisponibilite(nbVehicules: number, joursPeriode = 30): number | null {
    if (!nbVehicules) return null
    const joursTheoriques = nbVehicules * joursPeriode
    const joursPerdus = indisponibilites.value.reduce((s, i) => s + dureeIndispo(i), 0)
    return Math.round(((joursTheoriques - joursPerdus) / joursTheoriques) * 100)
  }

  /** US 3.1.3 - Part des entretiens préventifs réalisés dans les délais. */
  const tauxRealisationPreventif = computed(() => {
    const prev = ordres.value.filter(o => o.typeMaintenance === 'preventif')
    if (!prev.length) return null
    const clos = prev.filter(o => o.statut === 'cloture')
    return Math.round((clos.length / prev.length) * 100)
  })

  /**
   * US 3.5.2 - Coût de maintenance rapporté au kilomètre.
   * Agrège pièces, sous-traitance et main-d'œuvre dès que le tarif horaire
   * est paramétré. Sans tarif, le chiffre reste partiel et l'écran le dit.
   */
  function coutParKm(vehiculeId: string, kmParcourus: number): number | null {
    if (!kmParcourus) return null
    const cout = ordresDuVehicule(vehiculeId).reduce((s, o) => s + coutOT(o), 0)
    return Math.round(cout / kmParcourus)
  }

  /**
   * US 3.5.2 - Coût cumulé par véhicule, du plus élevé au plus faible.
   * Le coût d'immobilisation est présenté à part du coût de réparation :
   * l'un se règle au garage, l'autre se perd en exploitation.
   */
  const coutCumuleParVehicule = computed(() => {
    const acc = new Map<string, {
      plaque: string; cout: number; mainOeuvre: number; nb: number
      joursImmo: number; coutImmo: number | null
    }>()
    ordres.value.forEach(o => {
      const e = acc.get(o.vehiculeId)
        ?? { plaque: o.vehiculePlaque, cout: 0, mainOeuvre: 0, nb: 0, joursImmo: 0, coutImmo: null }
      e.cout += coutOT(o)
      e.mainOeuvre += coutMainOeuvre(o) ?? 0
      e.nb += 1
      acc.set(o.vehiculeId, e)
    })
    indisponibilites.value.forEach(i => {
      const e = acc.get(i.vehiculeId)
      if (!e) return
      e.joursImmo += dureeIndispo(i)
      const c = coutIndispo(i)
      if (c != null) e.coutImmo = (e.coutImmo ?? 0) + c
    })
    return [...acc.entries()]
      .map(([vehiculeId, e]) => ({ vehiculeId, ...e }))
      .sort((a, b) => b.cout - a.cout)
  })

  /** Part de la main-d'œuvre interne dans le coût total de maintenance. */
  const coutMainOeuvreTotal = computed(() => {
    if (!tarifRenseigne.value) return null
    return ordres.value.reduce((s, o) => s + (coutMainOeuvre(o) ?? 0), 0)
  })

  /**
   * US 3.1.2 - Pièces nécessaires à une opération d'entretien.
   * Le catalogue de pièces par opération n'a pas été fourni par GTD :
   * on renvoie ce que l'historique des interventions permet de déduire.
   */
  function piecesProbables(operationId: string): string[] {
    const CORRESPONDANCE: Record<string, string[]> = {
      'OP-01': ['Huile moteur 15W40', 'Filtre à huile'],
      'OP-02': ['Filtre à air'],
      'OP-03': ['Filtre à carburant'],
      'OP-08': ['Liquide de refroidissement'],
    }
    return CORRESPONDANCE[operationId] ?? []
  }

  /** US 3.2.4 - Validation hiérarchique avant clôture définitive. */
  function validerCloture(id: string, par: string, role: string) {
    const o = getById(id)
    if (!o || o.statut !== 'attente_validation') return
    o.statut = 'cloture'
    o.cloturePar = `${par} (${role})`
    o.clotureLe = new Date().toISOString()
    const ind = indisponibilites.value.find(i => i.ordreTravailId === id && !i.fin)
    if (ind) {
      ind.fin = o.clotureLe
      ind.dureeJours = dureeIndispo(ind)
    }
  }


  /* ══ US 3.4.1 - Charge de l'atelier ═══════════════════════
     Les mécaniciens sont déduits des ordres de travail : la liste
     nominative de l'atelier n'a pas été communiquée par GTD.
     ══════════════════════════════════════════════════════════ */

  /** Mécaniciens connus, déduits des interventions enregistrées. */
  const mecaniciensConnus = computed(() =>
    [...new Set(ordres.value.flatMap(o => [
      ...o.mecaniciens,
      ...o.temps.map(t => t.mecanicienNom),
    ]))].filter(Boolean).sort())

  /** Compétence requise par une intervention, déduite du sous-système. */
  function competenceDe(o: OrdreTravail): CompetenceAtelier | null {
    return o.sousSysteme ? COMPETENCE_PAR_SOUS_SYSTEME[o.sousSysteme] : null
  }

  /** Priorité d'ordonnancement : 1 = critique, 3 = mineure. */
  function prioriteDe(o: OrdreTravail): number {
    return PRIORITE_PAR_GRAVITE[o.gravite]
  }

  /** Charge par mécanicien : interventions affectées et heures estimées. */
  const chargeParMecanicien = computed(() =>
    mecaniciensConnus.value.map(nom => {
      const affectes = ordres.value.filter(o =>
        o.statut !== 'cloture' && o.statut !== 'annule' && o.mecaniciens.includes(nom))
      return {
        mecanicien: nom,
        interventions: affectes.sort((a, b) => prioriteDe(a) - prioriteDe(b)),
        heuresEstimees: affectes.reduce((s, o) => s + (o.dureeEstimeeH ?? 0), 0),
        heuresPassees: affectes.reduce((s, o) => s + heuresOT(o), 0),
      }
    }))

  /** Interventions non encore affectées à un mécanicien. */
  const nonAffectees = computed(() =>
    ordres.value.filter(o =>
      o.statut !== 'cloture' && o.statut !== 'annule' && !o.mecaniciens.length))

  /** Charge totale à venir, en heures estimées. */
  const chargeTotaleH = computed(() =>
    ouverts.value.reduce((s, o) => s + (o.dureeEstimeeH ?? 0), 0))

  /**
   * US 3.4.1 - Taux d'occupation de l'atelier.
   *
   * Un taux d'occupation rapporte une charge à une capacité. La charge
   * était déjà calculée - somme des heures estimées des interventions
   * ouvertes. La capacité manquait ; elle est désormais paramétrée.
   *
   * @param jours horizon d'observation, en jours ouvrés
   * @returns pourcentage, ou null tant que la capacité n'est pas connue
   */
  function tauxOccupation(jours?: number): number | null {
    if (!capaciteHeuresParJour.value) return null
    const horizon = jours ?? parametresAtelier.value.capacite.joursOuvresParSemaine ?? 6
    const dispo = capaciteHeuresParJour.value * horizon
    return dispo ? Math.round((chargeTotaleH.value / dispo) * 100) : null
  }

  /** Taux d'occupation sur la semaine ouvrée en cours. */
  const tauxOccupationSemaine = computed(() => tauxOccupation())

  /**
   * Jours ouvrés nécessaires pour absorber la charge en attente.
   * Un taux supérieur à 100 % ne dit pas de combien l'atelier est débordé ;
   * ce chiffre-là le dit, et se traduit directement en date de sortie.
   */
  const joursPourAbsorberCharge = computed(() => {
    if (!capaciteHeuresParJour.value) return null
    return Math.ceil(chargeTotaleH.value / capaciteHeuresParJour.value)
  })

  function planifier(id: string, date: string, dureeH: number, mecaniciens: string[]) {
    const o = getById(id)
    if (!o) return
    o.planifieeLe = date
    o.dureeEstimeeH = dureeH
    o.mecaniciens = [...mecaniciens]
  }

  /* ══ Actions ═══════════════════════════════════════════════ */
  function creerOT(data: Omit<OrdreTravail, 'id' | 'reference' | 'statut' | 'pieces' | 'temps' | 'mecaniciens'>) {
    const n = ordres.value.length + 42
    const ref = `OT-2026-${String(n).padStart(4, '0')}`
    ordres.value.unshift({
      ...data, id: ref, reference: ref,
      statut: 'ouvert', pieces: [], temps: [], mecaniciens: [],
    })
    // L'ouverture immobilise le véhicule - US 3.2.1
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

  /** US 3.2.2 - Ajoute une panne au même ordre, dans la limite de quatre. */
  function ajouterPanne(id: string, panne: Omit<PanneDiagnostiquee, 'id'>): boolean {
    const o = getById(id)
    if (!o) return false
    if (!o.pannes) o.pannes = []
    if (o.pannes.length >= MAX_PANNES_SIMULTANEES - 1) return false
    o.pannes.push({ ...panne, id: `PA-${Date.now()}` })
    return true
  }

  function ajouterPiece(id: string, p: Omit<PieceConsommee, 'id'>) {
    const o = getById(id)
    if (!o) return
    o.pieces.push({ ...p, id: `PC-${Date.now()}` })
    if (p.origine === 'achat') o.statut = 'attente_piece'
  }

  /** Clôture - exige diagnostic complet et travaux décrits (US 3.2.4). */
  function cloturer(id: string, travaux: string, par: string): boolean {
    const o = getById(id)
    if (!o) return false
    if (!o.sousSysteme || !o.modeDefaillance || !o.causeRacine) return false
    if (!travaux.trim()) return false

    // La clôture n'est pas immédiate : elle attend la validation hiérarchique
    o.statut = 'attente_validation'
    o.travauxRealises = travaux
    o.coutPiecesAr = coutOT(o)
    o.diagnostiquePar = o.diagnostiquePar ?? par
    return true
  }

  return {
    ordres, getById, ouverts, enAttentePiece, ordresDuVehicule,
    coutOT, coutPieces, coutSousTraitance, coutMainOeuvre, tarifHoraireDe, heuresOT,
    demandes, demandesDeLOT, delaiReception,
    indisponibilites, indisposEnCours, indisposDuVehicule, dureeIndispo,
    joursPerdusParFamille, ratioHumainTechnique,
    coutIndispo, coutJournalierDe, coutParFamille, coutTotalImmobilisations,
    plans, getPlan, planDuModele, echeancesDuVehicule, PREAVIS_KM, PREAVIS_JOURS,
    creerPlan, majPlan, basculerPlanActif, supprimerPlan, dupliquerPlan,
    ajouterOperation, majOperation, supprimerOperation,
    interventionsMobiles, mobilesEnCours,
    mttrHeures, mtbfKm, ratioPreventif, pannesParSousSysteme, coutTotal,
    mecaniciensConnus, competenceDe, prioriteDe, chargeParMecanicien,
    nonAffectees, chargeTotaleH, tauxOccupation, tauxOccupationSemaine,
    joursPourAbsorberCharge, planifier,
    parametresAtelier, majParametresAtelier, capaciteRenseignee,
    capaciteHeuresParJour, capaciteHeuresParSemaine,
    tarifRenseigne, coutImmoRenseigne, coutMainOeuvreTotal,
    mtbfParSousSysteme, tauxDisponibilite, tauxRealisationPreventif,
    coutParKm, coutCumuleParVehicule, piecesProbables, validerCloture,
    creerOT, diagnostiquer, ajouterPiece, ajouterPanne, cloturer,
  }
})
