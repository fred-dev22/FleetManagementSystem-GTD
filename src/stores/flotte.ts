import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  EquipementEmbarque, TypeEquipement, LigneEtatFlotte, CodeEtatFlotte,
  ChecklistRoute, AuditConformite, AutorisationDepart, ResultatPoint,
  PoliceAssurance, Sinistre, EtatFlotteArchive,
} from '../types/flotte'
import { POINTS_CHECKLIST_ROUTE, groupeDeLEtat } from '../types/flotte'

/**
 * Compléments du module 2 : équipements embarqués, états de flotte,
 * checklists, audits de conformité, autorisations de départ.
 *
 * Toutes les nomenclatures viennent des documents de GTD.
 */
export const useFlotteStore = defineStore('flotte', () => {

  /* ══ US 2.1.6 - Équipements embarqués ══════════════════════ */
  const equipements = ref<EquipementEmbarque[]>([
    { id: 'EQ-001', vehiculeId: 'TRC-001', type: 'obc',          marque: 'Camtrack', numeroSerie: 'CT-88401', dateInstallation: '2023-05-12', plateforme: 'Camtrack Pro', etat: 'operationnel' },
    { id: 'EQ-002', vehiculeId: 'TRC-001', type: 'gps',          marque: 'Camtrack', numeroSerie: 'GP-11720', dateInstallation: '2023-05-12', plateforme: 'Camtrack Pro', etat: 'operationnel' },
    { id: 'EQ-003', vehiculeId: 'TRC-001', type: 'camera_dome',  marque: 'Streamax', numeroSerie: 'SD-4471',  dateInstallation: '2024-11-02', plateforme: 'VSS', etat: 'operationnel' },
    { id: 'EQ-004', vehiculeId: 'TRC-001', type: 'camera_vanne', marque: 'Streamax', numeroSerie: 'SV-4472',  dateInstallation: '2024-11-02', plateforme: 'VSS', etat: 'operationnel' },
    { id: 'EQ-005', vehiculeId: 'TRC-001', type: 'dms',          marque: 'Streamax', numeroSerie: 'DM-2210',  dateInstallation: '2025-03-18', plateforme: 'VSS', etat: 'operationnel',
      tentativeDesactivation: [{ date: '2026-07-24T12:34:00Z', detail: 'Caméra masquée pendant 18 minutes après Moramanga.' }] },

    { id: 'EQ-010', vehiculeId: 'TRC-002', type: 'obc',          marque: 'Mzone',    numeroSerie: 'MZ-30112', dateInstallation: '2022-09-30', plateforme: 'Mzone', etat: 'operationnel' },
    { id: 'EQ-011', vehiculeId: 'TRC-002', type: 'gps',          marque: 'Mzone',    numeroSerie: 'MZ-30113', dateInstallation: '2022-09-30', plateforme: 'Mzone', etat: 'operationnel' },
    { id: 'EQ-012', vehiculeId: 'TRC-002', type: 'camera_dome',  marque: 'Streamax', numeroSerie: 'SD-4488',  dateInstallation: '2024-11-05', plateforme: 'VSS', etat: 'operationnel' },
    { id: 'EQ-013', vehiculeId: 'TRC-002', type: 'camera_vanne', marque: 'Streamax', numeroSerie: 'SV-4489',  dateInstallation: '2024-11-05', plateforme: 'VSS', etat: 'hors_service' },

    { id: 'EQ-020', vehiculeId: 'TRC-003', type: 'obc',          marque: 'Ym@ne',    numeroSerie: 'YM-7701',  dateInstallation: '2023-02-14', plateforme: 'Ym@ne', etat: 'operationnel' },
    { id: 'EQ-021', vehiculeId: 'TRC-003', type: 'gps',          marque: 'Ym@ne',    numeroSerie: 'YM-7702',  dateInstallation: '2023-02-14', plateforme: 'Ym@ne', etat: 'operationnel' },

    { id: 'EQ-030', vehiculeId: 'TRC-004', type: 'obc',          marque: 'Camtrack', numeroSerie: 'CT-88512', dateInstallation: '2021-08-03', plateforme: 'Camtrack Pro', etat: 'operationnel' },
  ])

  const equipementsDuVehicule = (vehiculeId: string) =>
    equipements.value.filter(e => e.vehiculeId === vehiculeId)

  /** Taux d'équipement par type - cible 100 % au cahier des charges. */
  function tauxEquipement(type: TypeEquipement, nbVehicules: number): number {
    if (!nbVehicules) return 0
    const equipes = new Set(
      equipements.value
        .filter(e => e.type === type && e.etat === 'operationnel')
        .map(e => e.vehiculeId),
    ).size
    return Math.round((equipes / nbVehicules) * 100)
  }

  /** Véhicules dont un équipement est hors service ou désinstallé. */
  const vehiculesNonCouverts = computed(() =>
    [...new Set(equipements.value.filter(e => e.etat !== 'operationnel').map(e => e.vehiculeId))])

  const tentativesDesactivation = computed(() =>
    equipements.value
      .filter(e => e.tentativeDesactivation?.length)
      .flatMap(e => (e.tentativeDesactivation ?? []).map(t => ({ ...t, vehiculeId: e.vehiculeId, type: e.type }))))

  /* ══ US 2.2.4 - État de flotte quotidien ═══════════════════ */
  const etatFlotte = ref<LigneEtatFlotte[]>([
    { vehiculeId: 'TRC-001', vehiculePlaque: 'MG-7842-TX', citernePlaque: 'MG-1100-TR',
      chauffeurNom: 'Thierry Randriamanga', etat: 'ATT-ADM',
      codeIndispo: 'PNN', motifIndispo: 'Panne circuit d’air - dessiccateur',
      remiseEnServicePrevue: '2026-08-04', observation: 'En attente de la pièce commandée.' },
    { vehiculeId: 'TRC-002', vehiculePlaque: 'MG-5671-TX', citernePlaque: 'MG-1102-TR',
      chauffeurNom: 'Fiona Mungroo', etat: 'TR-LIV', voyageRef: 'VOY-2026-0151' },
    { vehiculeId: 'TRC-003', vehiculePlaque: 'MG-4410-TX',
      chauffeurNom: 'Jean-Luc Ravelo', etat: 'DEP-PRV', voyageRef: 'VOY-2026-0152' },
    { vehiculeId: 'TRC-004', vehiculePlaque: 'MG-3356-TX',
      chauffeurNom: 'Hery Rasoanaivo', etat: 'ATT-ADM',
      codeIndispo: 'VET', motifIndispo: 'Vetting expiré - audit programmé',
      remiseEnServicePrevue: '2026-08-08' },
    { vehiculeId: 'TRC-005', vehiculePlaque: 'MG-2201-TX',
      etat: 'ATT-CHG', observation: 'Présenté au dépôt GRT, en file de chargement.' },
    { vehiculeId: 'TRC-006', vehiculePlaque: 'MG-9014-TX',
      chauffeurNom: 'Nirina Ratovo', etat: 'RET-VID', voyageRef: 'VOY-2026-0149' },
  ])

  const etatParGroupe = computed(() => {
    const acc: Record<string, number> = { operationnel: 0, transit: 0, attente: 0 }
    etatFlotte.value.forEach(l => {
      const g = groupeDeLEtat(l.etat)
      acc[g] = (acc[g] ?? 0) + 1
    })
    return acc
  })

  const immobilises = computed(() => etatFlotte.value.filter(l => l.codeIndispo))

  const etatDuVehicule = (vehiculeId: string) =>
    etatFlotte.value.find(l => l.vehiculeId === vehiculeId)

  function changerEtat(vehiculeId: string, etat: CodeEtatFlotte) {
    const l = etatDuVehicule(vehiculeId)
    if (l) l.etat = etat
  }

  /* ══ US 2.2.4 - Historique des états produits ══════════════
     L'état d'un jour donné reste consultable : c'est la preuve de
     ce qui a été déclaré au client à cette date.
     ══════════════════════════════════════════════════════════ */
  const etatsArchives = ref<EtatFlotteArchive[]>([
    { id: 'EF-2026-07-31', date: '2026-07-31', produitPar: 'Naina Rakotobe',
      transmisLe: '2026-07-31T07:15:00Z',
      lignes: [
        { vehiculeId: 'TRC-001', vehiculePlaque: 'MG-7842-TX', citernePlaque: 'MG-1100-TR',
          chauffeurNom: 'Thierry Randriamanga', etat: 'ATT-ADM',
          codeIndispo: 'PNN', motifIndispo: 'Panne circuit d’air - dessiccateur',
          remiseEnServicePrevue: '2026-08-04' },
        { vehiculeId: 'TRC-002', vehiculePlaque: 'MG-5671-TX', citernePlaque: 'MG-1102-TR',
          chauffeurNom: 'Fiona Mungroo', etat: 'TR-CHG', voyageRef: 'VOY-2026-0151' },
        { vehiculeId: 'TRC-004', vehiculePlaque: 'MG-3356-TX', etat: 'ATT-ADM',
          codeIndispo: 'VET', motifIndispo: 'Vetting expiré', remiseEnServicePrevue: '2026-08-08' },
      ] },
    { id: 'EF-2026-07-30', date: '2026-07-30', produitPar: 'Naina Rakotobe',
      transmisLe: '2026-07-30T07:05:00Z',
      lignes: [
        { vehiculeId: 'TRC-001', vehiculePlaque: 'MG-7842-TX', citernePlaque: 'MG-1100-TR',
          chauffeurNom: 'Thierry Randriamanga', etat: 'ATT-ADM',
          codeIndispo: 'PNN', motifIndispo: 'Panne circuit d’air' },
        { vehiculeId: 'TRC-002', vehiculePlaque: 'MG-5671-TX', chauffeurNom: 'Fiona Mungroo', etat: 'DEP-REA' },
      ] },
  ])

  /** Fige l'état du jour : il devient une pièce opposable. */
  function archiverEtat(par: string): EtatFlotteArchive {
    const jour = new Date().toISOString().slice(0, 10)
    const existant = etatsArchives.value.find(e => e.date === jour)
    if (existant) {
      existant.lignes = JSON.parse(JSON.stringify(etatFlotte.value))
      existant.produitPar = par
      return existant
    }
    const nouveau: EtatFlotteArchive = {
      id: `EF-${jour}`, date: jour, produitPar: par,
      lignes: JSON.parse(JSON.stringify(etatFlotte.value)),
    }
    etatsArchives.value.unshift(nouveau)
    return nouveau
  }

  const etatDuJour = (date: string) => etatsArchives.value.find(e => e.date === date)

  /* ══ US 2.3.1 - Checklists sur route ═══════════════════════ */
  const checklists = ref<ChecklistRoute[]>([
    {
      id: 'CKL-2026-0148', reference: 'CKL-2026-0148',
      voyageId: 'VOY-001', voyageRef: 'VOY-2026-0148',
      vehiculeId: 'TRC-001', tracteurPlaque: 'MG-7842-TX', citernePlaque: 'MG-1100-TR',
      chauffeurNom: 'Thierry Randriamanga',
      dateDebut: '2026-07-24T05:40:00Z', dateFin: '2026-07-24T18:12:00Z',
      signeParChauffeur: true, synchroniseLe: '2026-07-24T18:30:00Z',
      releves: [
        { pause: 1, horodatage: '2026-07-24T07:12:00Z', lieu: 'Péage Ambatolampy',
          resultats: tousConformes() },
        { pause: 2, horodatage: '2026-07-24T10:48:00Z', lieu: 'Manjakandriana',
          resultats: tousConformes() },
        { pause: 3, horodatage: '2026-07-24T11:05:00Z', lieu: 'Relais Moramanga',
          resultats: { ...tousConformes(), FLX: 'anomalie' },
          commentaire: 'Léger sifflement au flexible de remorque, pression stable. Signalé au garage.' },
        { pause: 4, horodatage: '2026-07-24T16:40:00Z', lieu: 'Station Toamasina Nord',
          resultats: { ...tousConformes(), FLX: 'anomalie' },
          commentaire: 'Sifflement toujours présent.' },
      ],
    },
    {
      id: 'CKL-2026-0151', reference: 'CKL-2026-0151',
      voyageRef: 'VOY-2026-0151',
      vehiculeId: 'TRC-002', tracteurPlaque: 'MG-5671-TX', citernePlaque: 'MG-1102-TR',
      chauffeurNom: 'Fiona Mungroo',
      dateDebut: '2026-07-29T05:20:00Z',
      signeParChauffeur: true,
      releves: [
        { pause: 1, horodatage: '2026-07-29T08:00:00Z', lieu: 'Ampasimadinika PK296',
          resultats: { ...tousConformes(), CAM: 'anomalie' },
          commentaire: 'Caméra vanne hors service, signalée au Control Room.' },
      ],
    },
  ])

  /** Un relevé où tous les points sont conformes. */
  function tousConformes(): Record<string, ResultatPoint> {
    const r: Record<string, ResultatPoint> = {}
    POINTS_CHECKLIST_ROUTE.forEach(p => { r[p.code] = 'conforme' })
    return r
  }

  const checklistsDuVehicule = (vehiculeId: string) =>
    checklists.value.filter(c => c.vehiculeId === vehiculeId)

  /** Anomalies relevées sur une checklist, tous relevés confondus. */
  function anomaliesDe(c: ChecklistRoute): { pause: number; code: string; libelle: string; commentaire?: string }[] {
    const out: { pause: number; code: string; libelle: string; commentaire?: string }[] = []
    c.releves.forEach(r => {
      Object.entries(r.resultats).forEach(([code, res]) => {
        if (res === 'anomalie') {
          const p = POINTS_CHECKLIST_ROUTE.find(x => x.code === code)
          out.push({ pause: r.pause, code, libelle: p?.libelle ?? code, commentaire: r.commentaire })
        }
      })
    })
    return out
  }

  const checklistsAvecAnomalie = computed(() =>
    checklists.value.filter(c => anomaliesDe(c).length > 0))

  /* ══ US 2.3.2 - Audits de conformité ═══════════════════════ */
  const audits = ref<AuditConformite[]>([
    {
      id: 'AUD-2026-0007', reference: 'AUD-2026-0007',
      vehiculeId: 'TRC-004', tracteurPlaque: 'MG-3356-TX', citernePlaque: 'MG-1104-TR',
      date: '2026-07-22', auditeur: 'Hery Ratsimba',
      conforme: false, contreVisiteLe: '2026-08-08',
      rapportArchiveLe: '2026-07-22T16:30:00Z', rapportUrl: '/rapports/AUD-2026-0007.pdf',
      commentaire: 'Vetting expiré. Deux postes non conformes à corriger avant présentation.',
      resultats: [
        { code: '100.10', verdict: 'conforme' },
        { code: '100.20', verdict: 'conforme' },
        { code: '102.10', verdict: 'conforme' },
        { code: '104.10', verdict: 'conforme' },
        { code: '104.20', verdict: 'conforme' },
        { code: '106.10', verdict: 'conforme' },
        { code: '108.10', verdict: 'conforme_observation', observation: 'Plaque-étiquette arrière décolorée, lisible mais à remplacer.' },
        { code: '118.10', verdict: 'non_conforme', observation: 'Pneu arrière gauche sous le témoin d’usure.' },
        { code: '122.50.2', verdict: 'non_conforme', observation: 'Frein de stationnement : efficacité insuffisante au banc.' },
        { code: '142.20', verdict: 'conforme' },
      ],
    },
    {
      id: 'AUD-2026-0006', reference: 'AUD-2026-0006',
      vehiculeId: 'TRC-001', tracteurPlaque: 'MG-7842-TX', citernePlaque: 'MG-1100-TR',
      date: '2026-05-14', auditeur: 'Hery Ratsimba',
      conforme: true,
      rapportArchiveLe: '2026-05-14T17:00:00Z', rapportUrl: '/rapports/AUD-2026-0006.pdf',
      resultats: [
        { code: '100.10', verdict: 'conforme' }, { code: '100.20', verdict: 'conforme' },
        { code: '102.10', verdict: 'conforme' }, { code: '104.10', verdict: 'conforme' },
        { code: '106.10', verdict: 'conforme' }, { code: '118.10', verdict: 'conforme' },
        { code: '122.50.1', verdict: 'conforme' }, { code: '122.50.2', verdict: 'conforme' },
      ],
    },
  ])

  const auditsDuVehicule = (vehiculeId: string) =>
    audits.value.filter(a => a.vehiculeId === vehiculeId)
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))

  const auditsNonConformes = computed(() => audits.value.filter(a => !a.conforme))

  /* ══ US 2.4.1 - Autorisations de départ ════════════════════ */
  const autorisations = ref<AutorisationDepart[]>([
    {
      id: 'AUT-2026-0212', reference: 'AUT-2026-0212',
      voyageRef: 'VOY-2026-0151', vehiculeId: 'TRC-002', vehiculePlaque: 'MG-5671-TX',
      chauffeurNom: 'Fiona Mungroo', demandeeLe: '2026-07-29T05:05:00Z',
      controles: [
        { controle: 'checklist',           conforme: true },
        { controle: 'alcool_drogue',       conforme: true, detail: 'Test négatif à 05h12.' },
        { controle: 'documents_chauffeur', conforme: true },
        { controle: 'documents_vehicule',  conforme: true },
      ],
      accordee: true, decidePar: 'Naina Rakotobe', decideLe: '2026-07-29T05:18:00Z',
      briefingSecuriteFait: true, reposHebdoVerifie: true,
      suiviActiveLe: '2026-07-29T05:20:00Z',
    },
    {
      id: 'AUT-2026-0213', reference: 'AUT-2026-0213',
      voyageRef: 'VOY-2026-0152', vehiculeId: 'TRC-003', vehiculePlaque: 'MG-4410-TX',
      chauffeurNom: 'Jean-Luc Ravelo', demandeeLe: '2026-08-01T05:02:00Z',
      controles: [
        { controle: 'checklist',           conforme: true },
        { controle: 'alcool_drogue',       conforme: true, detail: 'Test négatif à 05h09.' },
        { controle: 'documents_chauffeur', conforme: true },
        { controle: 'documents_vehicule',  conforme: true },
      ],
      accordee: false,
      briefingSecuriteFait: false, reposHebdoVerifie: true,
    },
    {
      id: 'AUT-2026-0211', reference: 'AUT-2026-0211',
      vehiculeId: 'TRC-001', vehiculePlaque: 'MG-7842-TX',
      chauffeurNom: 'Thierry Randriamanga', demandeeLe: '2026-07-28T05:00:00Z',
      controles: [
        { controle: 'checklist',           conforme: false, detail: 'Anomalie flexible relevée au retour précédent.' },
        { controle: 'alcool_drogue',       conforme: true },
        { controle: 'documents_chauffeur', conforme: false, detail: 'Visite médicale expirée le 10/09/2025.' },
        { controle: 'documents_vehicule',  conforme: true },
      ],
      accordee: false, decidePar: 'Naina Rakotobe', decideLe: '2026-07-28T05:22:00Z',
      motifRefus: 'Visite médicale expirée et anomalie technique non levée.',
    },
  ])

  const autorisationsEnAttente = computed(() =>
    autorisations.value.filter(a => !a.decideLe))

  /** Les quatre contrôles doivent tous être conformes. */
  function peutPartir(a: AutorisationDepart): boolean {
    return a.controles.every(c => c.conforme)
  }

  function decider(id: string, accordee: boolean, par: string, motif?: string) {
    const a = autorisations.value.find(x => x.id === id)
    if (!a) return
    a.accordee = accordee
    a.decidePar = par
    a.decideLe = new Date().toISOString()
    if (accordee) a.suiviActiveLe = a.decideLe
    else a.motifRefus = motif
  }


  /* ══ US 2.7.3 - Assurances et sinistres ═══════════════════ */
  const polices = ref<PoliceAssurance[]>([
    { id: 'POL-001', vehiculeId: 'TRC-001', vehiculePlaque: 'MG-7842-TX',
      compagnie: 'ARO Madagascar', numeroPolice: 'ARO-2025-88401',
      couverture: 'Tous risques + responsabilité civile marchandises dangereuses',
      dateDebut: '2025-11-01', dateEcheance: '2026-10-31',
      primeAnnuelleAr: 8_400_000, franchiseAr: 1_500_000, statut: 'active' },
    { id: 'POL-002', vehiculeId: 'TRC-002', vehiculePlaque: 'MG-5671-TX',
      compagnie: 'ARO Madagascar', numeroPolice: 'ARO-2025-88402',
      couverture: 'Tous risques + responsabilité civile marchandises dangereuses',
      dateDebut: '2025-11-01', dateEcheance: '2026-10-31',
      primeAnnuelleAr: 8_400_000, franchiseAr: 1_500_000, statut: 'active' },
    { id: 'POL-003', vehiculeId: 'TRC-004', vehiculePlaque: 'MG-3356-TX',
      compagnie: 'NY HAVANA', numeroPolice: 'NH-2025-3320',
      couverture: 'Tiers étendu + marchandises dangereuses',
      dateDebut: '2024-09-15', dateEcheance: '2025-09-14',
      primeAnnuelleAr: 5_200_000, franchiseAr: 2_000_000, statut: 'expiree' },
    { id: 'POL-004', vehiculeId: 'REM-001', vehiculePlaque: 'MG-1100-TR',
      compagnie: 'ARO Madagascar', numeroPolice: 'ARO-2025-88450',
      couverture: 'Tous risques citerne',
      dateDebut: '2025-11-01', dateEcheance: '2026-10-31',
      primeAnnuelleAr: 4_100_000, franchiseAr: 1_000_000, statut: 'active' },
  ])

  const policeDuVehicule = (vehiculeId: string) =>
    polices.value.find(p => p.vehiculeId === vehiculeId && p.statut === 'active')

  const policesDuVehicule = (vehiculeId: string) =>
    polices.value.filter(p => p.vehiculeId === vehiculeId)

  const policesExpirees = computed(() => polices.value.filter(p => p.statut === 'expiree'))

  const sinistres = ref<Sinistre[]>([
    {
      id: 'SIN-2026-004', reference: 'SIN-2026-004',
      vehiculeId: 'REM-001', vehiculePlaque: 'MG-1100-TR',
      date: '2026-07-15T08:30:00Z', lieu: 'Dépôt GRT Toamasina, aire de dépotage',
      circonstances: 'Suintement au niveau de la vanne de fond constaté au dépotage. Épandage limité, confiné par les bacs de rétention du dépôt.',
      gravite: 'environnemental',
      chauffeurNom: 'Thierry Randriamanga',
      montantDommagesAr: 3_400_000,
      statutIndemnisation: 'expertise',
      policeId: 'POL-004', ordreTravailId: 'OT-2026-0038',
      responsabiliteGtd: true,
      kilometrage: 187_400,
    },
    {
      id: 'SIN-2026-003', reference: 'SIN-2026-003',
      vehiculeId: 'TRC-003', vehiculePlaque: 'MG-4410-TX',
      date: '2026-05-02T14:10:00Z', lieu: 'RN2, PK 155 - Ambatosenegaly',
      circonstances: 'Accrochage latéral avec un véhicule léger lors d’un dépassement. Aucun blessé.',
      gravite: 'materiel_leger',
      chauffeurNom: 'Jean-Luc Ravelo',
      tiersImpliques: 'Véhicule particulier, plaque 4471-TBA - constat amiable établi.',
      montantDommagesAr: 1_250_000,
      statutIndemnisation: 'regle', montantIndemniseAr: 1_250_000,
      policeId: 'POL-001',
      responsabiliteGtd: false,
      kilometrage: 128_900,
    },
    {
      id: 'SIN-2026-002', reference: 'SIN-2026-002',
      vehiculeId: 'TRC-004', vehiculePlaque: 'MG-3356-TX',
      date: '2026-02-18T05:45:00Z', lieu: 'Sortie de base TNR',
      circonstances: 'Sortie de route à basse vitesse sur chaussée glissante. Dommages au pare-chocs et au marchepied.',
      gravite: 'materiel_lourd',
      chauffeurNom: 'Hery Rasoanaivo',
      montantDommagesAr: 4_800_000,
      statutIndemnisation: 'refuse',
      policeId: 'POL-003',
      responsabiliteGtd: true,
      kilometrage: 98_200,
    },
  ])

  const sinistresDuVehicule = (vehiculeId: string) =>
    sinistres.value.filter(s => s.vehiculeId === vehiculeId)
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))

  /** Coût supporté par GTD : dommages moins indemnisation reçue. */
  function resteACharge(s: Sinistre): number {
    return (s.montantDommagesAr ?? 0) - (s.montantIndemniseAr ?? 0)
  }

  const totalDommages = computed(() =>
    sinistres.value.reduce((s, x) => s + (x.montantDommagesAr ?? 0), 0))

  const totalIndemnise = computed(() =>
    sinistres.value.reduce((s, x) => s + (x.montantIndemniseAr ?? 0), 0))

  /**
   * Accidents par million de kilomètres - indicateur du cahier des charges.
   * Le kilométrage total de la flotte doit être fourni par l'appelant :
   * il est détenu par le référentiel véhicules, pas par ce store.
   */
  function accidentsParMillionKm(kmTotalFlotte: number): number | null {
    if (!kmTotalFlotte) return null
    return Number(((sinistres.value.length / kmTotalFlotte) * 1_000_000).toFixed(2))
  }

  return {
    equipements, equipementsDuVehicule, tauxEquipement, vehiculesNonCouverts, tentativesDesactivation,
    etatFlotte, etatParGroupe, immobilises, etatDuVehicule, changerEtat,
    etatsArchives, archiverEtat, etatDuJour,
    checklists, checklistsDuVehicule, anomaliesDe, checklistsAvecAnomalie,
    audits, auditsDuVehicule, auditsNonConformes,
    autorisations, autorisationsEnAttente, peutPartir, decider,
    polices, policeDuVehicule, policesDuVehicule, policesExpirees,
    sinistres, sinistresDuVehicule, resteACharge,
    totalDommages, totalIndemnise, accidentsParMillionKm,
  }
})
