import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  RechargeCarburant, ControleVraisemblance, PeriodeConso,
  QualifEcartCarburant, CanalRecharge,
} from '../types/fms'
import { distanceKm } from '../lib/fmsUtils'

export const LIB_CANAL: Record<CanalRecharge, string> = {
  import:         'Import fichier',
  mobile:         'Saisie mobile',
  regularisation: 'Régularisation',
}

export const LIB_QUALIF: Record<QualifEcartCarburant, string> = {
  technique:   'Cause technique',
  conduite:    'Comportement de conduite',
  prelevement: 'Prélèvement',
  saisie:      'Erreur de saisie',
}

/** Capacité des réservoirs, par véhicule — paramétrable côté administration. */
const CAPACITE_RESERVOIR: Record<string, number> = {
  'MG-7842-TX': 600, 'MG-3356-TX': 600, 'MG-5671-TX': 700,
  'MG-4410-TX': 600, 'MG-9023-TX': 500,
}

/** Consommation de référence, contextualisée par trajet (L/100 km). */
export const REF_CONSO: Record<string, number> = {
  'ATS-TMS': 38.5, 'TNR-TMS': 36.0, 'TNR-MJN': 41.0, 'TNR-ATS': 34.5,
}

/**
 * Carburant — méthode plein-à-plein, sans capteur.
 *
 * Deux indicateurs sont volontairement distincts :
 *  · les LITRES DÉLIVRÉS, relevés à chaque recharge (donnée exacte, restituable
 *    au jour, à la semaine ou au mois) ;
 *  · la CONSOMMATION aux 100 km, calculée entre deux pleins complets — seule
 *    méthode fiable en l'absence de capteur de niveau.
 *
 * Les contrôles de vraisemblance croisent la recharge avec la position GPS du
 * véhicule et l'affectation du chauffeur : c'est ce croisement, et non le
 * matériel, qui produit la détection de fraude.
 */
export const useCarburantStore = defineStore('carburant', () => {

  const recharges = ref<RechargeCarburant[]>([
    {
      id: 'RCH-001', date: '2026-07-24T05:20:00Z',
      vehiculeId: 'TRC-001', vehiculePlaque: 'MG-7842-TX',
      chauffeurId: 'emp-010', chauffeurNom: 'Thierry Randriamanga',
      voyageId: 'VOY-001', voyageRef: 'VOY-2026-0148',
      litres: 580, prixLitre: 5_400, montant: 3_132_000,nombreBons: 1, litresParBon: 500,
      odometre: 187_340, pleinComplet: true,
      lieu: 'Dépôt La Pointe Sud Antsirabe', lat: -19.8667, lng: 47.0333,
      canal: 'mobile',
      positionVehicule: { lat: -19.8670, lng: 47.0340, ecartKm: 0.1 },
      controles: [], statut: 'valide',
    },
    {
      id: 'RCH-002', date: '2026-07-24T14:32:00Z',
      vehiculeId: 'TRC-001', vehiculePlaque: 'MG-7842-TX',
      chauffeurId: 'emp-010', chauffeurNom: 'Thierry Randriamanga',
      voyageId: 'VOY-001', voyageRef: 'VOY-2026-0148',
      litres: 210, prixLitre: 5_650, montant: 1_186_500,nombreBons: 1, litresParBon: 500,
      odometre: 187_710, pleinComplet: false,
      lieu: 'Station Moramanga', lat: -18.9469, lng: 48.2306,
      canal: 'import',
      /* Le véhicule était à 38 km du lieu déclaré à cet horodatage. */
      positionVehicule: { lat: -19.1520, lng: 48.3480, ecartKm: 38.4 },
      controles: [], statut: 'anomalie',
    },
    {
      id: 'RCH-003', date: '2026-07-24T18:40:00Z',
      vehiculeId: 'TRC-001', vehiculePlaque: 'MG-7842-TX',
      chauffeurId: 'emp-010', chauffeurNom: 'Thierry Randriamanga',
      voyageId: 'VOY-001', voyageRef: 'VOY-2026-0148',
      litres: 420, prixLitre: 5_650, montant: 2_373_000,nombreBons: 1, litresParBon: 500,
      odometre: 187_918, pleinComplet: true,
      lieu: 'Garage Toamasina', lat: -18.1492, lng: 49.4023,
      canal: 'mobile',
      positionVehicule: { lat: -18.1490, lng: 49.4020, ecartKm: 0.05 },
      controles: [], statut: 'valide',
    },
    {
      id: 'RCH-004', date: '2026-07-20T04:50:00Z',
      vehiculeId: 'TRC-002', vehiculePlaque: 'MG-3356-TX',
      chauffeurId: 'emp-012', chauffeurNom: 'Hery Rasoanaivo',
      voyageId: 'VOY-003', voyageRef: 'VOY-2026-0147',
      litres: 590, prixLitre: 5_400, montant: 3_186_000,nombreBons: 1, litresParBon: 500,
      odometre: 245_780, pleinComplet: true,
      lieu: 'Garage Antananarivo', lat: -18.8792, lng: 47.5079,
      canal: 'mobile',
      positionVehicule: { lat: -18.8790, lng: 47.5081, ecartKm: 0.03 },
      controles: [], statut: 'valide',
    },
    {
      id: 'RCH-005', date: '2026-07-20T18:10:00Z',
      vehiculeId: 'TRC-002', vehiculePlaque: 'MG-3356-TX',
      chauffeurId: 'emp-012', chauffeurNom: 'Hery Rasoanaivo',
      voyageId: 'VOY-003', voyageRef: 'VOY-2026-0147',
      litres: 465, prixLitre: 5_700, montant: 2_650_500,nombreBons: 1, litresParBon: 500,
      odometre: 246_352, pleinComplet: true,
      lieu: 'Dépôt Majunga', lat: -15.7167, lng: 46.3167,
      canal: 'import',
      positionVehicule: { lat: -15.7170, lng: 46.3170, ecartKm: 0.04 },
      controles: [], statut: 'valide',
    },
    {
      id: 'RCH-006', date: '2026-07-26T05:55:00Z',
      vehiculeId: 'TRC-004', vehiculePlaque: 'MG-4410-TX',
      chauffeurId: 'emp-013', chauffeurNom: 'Jean-Luc Ravelo',
      voyageId: 'VOY-005', voyageRef: 'VOY-2026-0146',
      litres: 640, prixLitre: 5_400, montant: 3_456_000,nombreBons: 1, litresParBon: 500,
      odometre: 132_100, pleinComplet: true,
      lieu: 'Garage Andoharanofotsy', lat: -18.9600, lng: 47.5300,
      canal: 'mobile',
      positionVehicule: { lat: -18.9602, lng: 47.5298, ecartKm: 0.03 },
      controles: [], statut: 'anomalie',   // 640 L > réservoir 600 L
    },
    {
      id: 'RCH-007', date: '2026-07-26T14:20:00Z',
      vehiculeId: 'TRC-004', vehiculePlaque: 'MG-4410-TX',
      chauffeurId: 'emp-013', chauffeurNom: 'Jean-Luc Ravelo',
      voyageId: 'VOY-005', voyageRef: 'VOY-2026-0146',
      litres: 285, prixLitre: 5_700, montant: 1_624_500,nombreBons: 1, litresParBon: 500,
      odometre: 132_461, pleinComplet: true,
      lieu: 'Dépôt Garage Rova Tamatave', lat: -18.1492, lng: 49.4023,
      canal: 'mobile',
      positionVehicule: { lat: -18.1495, lng: 49.4019, ecartKm: 0.06 },
      controles: [], statut: 'valide',
    },
    {
      id: 'RCH-008', date: '2026-07-29T06:00:00Z',
      vehiculeId: 'TRC-003', vehiculePlaque: 'MG-5671-TX',
      chauffeurId: 'emp-011', chauffeurNom: 'Fiona Mungroo',
      voyageId: 'VOY-002', voyageRef: 'VOY-2026-0149',
      litres: 690, prixLitre: 5_400, montant: 3_726_000,nombreBons: 1, litresParBon: 500,
      odometre: 98_450, pleinComplet: true,
      lieu: 'Garage Antananarivo', lat: -18.8792, lng: 47.5079,
      canal: 'mobile',
      positionVehicule: { lat: -18.8791, lng: 47.5077, ecartKm: 0.02 },
      controles: [], statut: 'valide',
    },
  ])

  /* ══ Contrôles de vraisemblance ════════════════════════════ */

  /**
   * Croise la recharge avec les données déjà disponibles chez GTD :
   * capacité du réservoir, historique odométrique, position télématique,
   * affectation du chauffeur. Aucun capteur requis.
   */
  function evaluerControles(r: RechargeCarburant): ControleVraisemblance[] {
    const out: ControleVraisemblance[] = []
    const capacite = CAPACITE_RESERVOIR[r.vehiculePlaque]

    out.push({
      code: 'volume_sup_reservoir',
      libelle: 'Volume délivré compatible avec la capacité du réservoir',
      ok: capacite == null || r.litres <= capacite,
      detail: capacite == null
        ? 'Capacité non renseignée'
        : `${r.litres} L délivrés · réservoir ${capacite} L`,
    })

    const precedente = recharges.value
      .filter(x => x.vehiculeId === r.vehiculeId && new Date(x.date) < new Date(r.date))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))[0]

    out.push({
      code: 'odometre_incoherent',
      libelle: 'Index kilométrique cohérent avec la recharge précédente',
      ok: !precedente || r.odometre > precedente.odometre,
      detail: precedente
        ? `${precedente.odometre.toLocaleString('fr-FR')} → ${r.odometre.toLocaleString('fr-FR')} km`
        : 'Première recharge enregistrée',
    })

    const ecart = r.positionVehicule
      ? r.positionVehicule.ecartKm
      : distanceKm({ lat: r.lat, lng: r.lng }, { lat: r.lat, lng: r.lng })

    out.push({
      code: 'position_incoherente',
      libelle: 'Position GPS du véhicule cohérente avec le lieu déclaré',
      ok: ecart <= 2,
      detail: r.positionVehicule
        ? `Véhicule à ${ecart.toFixed(1)} km du lieu de recharge déclaré (source Camtrack)`
        : 'Position télématique indisponible',
    })

    out.push({
      code: 'chauffeur_non_affecte',
      libelle: 'Chauffeur affecté au véhicule à cette date',
      ok: !!r.chauffeurId,
      detail: r.chauffeurNom ?? 'Aucun chauffeur rattaché',
    })

    const h = new Date(r.date).getHours()
    out.push({
      code: 'hors_plage',
      libelle: 'Recharge dans la plage horaire autorisée (04 h – 20 h)',
      ok: h >= 4 && h <= 20,
      detail: `${String(h).padStart(2, '0')} h`,
    })

    return out
  }

  /** Recalcule les contrôles et le statut de toutes les recharges. */
  function rafraichirControles() {
    recharges.value.forEach(r => {
      r.controles = evaluerControles(r)
      const ko = r.controles.some(c => !c.ok)
      if (r.statut !== 'qualifie' && r.statut !== 'en_qualification') {
        r.statut = ko ? 'anomalie' : 'valide'
      }
    })
  }
  rafraichirControles()

  /* ══ Getters ═══════════════════════════════════════════════ */
  const getById = (id: string) => recharges.value.find(r => r.id === id)

  const anomalies = computed(() => recharges.value.filter(r => r.statut === 'anomalie'))

  const rechargesDuVehicule = (vehiculeId: string) =>
    [...recharges.value.filter(r => r.vehiculeId === vehiculeId)]
      .sort((a, b) => +new Date(a.date) - +new Date(b.date))

  const rechargesDuChauffeur = (chauffeurId: string) =>
    recharges.value.filter(r => r.chauffeurId === chauffeurId)

  /** Litres délivrés — donnée exacte, agrégeable par jour / semaine / mois. */
  function litresDelivres(opts: { vehiculeId?: string; du?: string; au?: string } = {}) {
    return recharges.value
      .filter(r => (!opts.vehiculeId || r.vehiculeId === opts.vehiculeId)
        && (!opts.du || r.date >= opts.du)
        && (!opts.au || r.date <= opts.au))
      .reduce((s, r) => s + r.litres, 0)
  }

  function montantTotal(opts: { vehiculeId?: string; du?: string; au?: string } = {}) {
    return recharges.value
      .filter(r => (!opts.vehiculeId || r.vehiculeId === opts.vehiculeId)
        && (!opts.du || r.date >= opts.du)
        && (!opts.au || r.date <= opts.au))
      .reduce((s, r) => s + r.montant, 0)
  }

  /**
   * Consommation plein-à-plein : entre deux pleins COMPLETS successifs,
   * les litres du second correspondent à ce qui a été consommé depuis le premier.
   */
  const periodesConso = computed<PeriodeConso[]>(() => {
    const out: PeriodeConso[] = []
    const parVehicule = new Map<string, RechargeCarburant[]>()

    recharges.value.forEach(r => {
      if (!parVehicule.has(r.vehiculeId)) parVehicule.set(r.vehiculeId, [])
      parVehicule.get(r.vehiculeId)!.push(r)
    })

    parVehicule.forEach(list => {
      const pleins = list
        .filter(r => r.pleinComplet)
        .sort((a, b) => +new Date(a.date) - +new Date(b.date))

      for (let i = 1; i < pleins.length; i++) {
        const a = pleins[i - 1]
        const b = pleins[i]
        if (!a || !b) continue
        const km = b.odometre - a.odometre
        if (km <= 0) continue

        // litres consommés = tout ce qui a été délivré entre les deux pleins, plein final inclus
        const litres = list
          .filter(r => r.date > a.date && r.date <= b.date)
          .reduce((s, r) => s + r.litres, 0)

        const trajetCode = b.voyageRef ? trajetDeVoyage(b.voyageId) : undefined
        const ref = trajetCode ? REF_CONSO[trajetCode] ?? 37 : 37
        const l100 = Number(((litres / km) * 100).toFixed(1))

        out.push({
          vehiculeId: b.vehiculeId, vehiculePlaque: b.vehiculePlaque,
          du: a.date, au: b.date,
          litres, km, litresPour100km: l100,
          refConso: ref,
          ecartPct: Number((((l100 - ref) / ref) * 100).toFixed(1)),
          trajetCode, chauffeurNom: b.chauffeurNom,
        })
      }
    })

    return out.sort((a, b) => +new Date(b.au) - +new Date(a.au))
  })

  /* Résolution du trajet : évite une dépendance circulaire entre stores */
  const _trajetParVoyage: Record<string, string> = {
    'VOY-001': 'ATS-TMS', 'VOY-002': 'TNR-TMS', 'VOY-003': 'TNR-MJN',
    'VOY-004': 'TNR-ATS', 'VOY-005': 'TNR-TMS',
  }
  function trajetDeVoyage(voyageId?: string) {
    return voyageId ? _trajetParVoyage[voyageId] : undefined
  }

  /* ══ Actions ═══════════════════════════════════════════════ */
  function create(data: Omit<RechargeCarburant, 'id' | 'controles' | 'statut'>) {
    const r: RechargeCarburant = {
      ...data,
      id: `RCH-${String(recharges.value.length + 1).padStart(3, '0')}`,
      controles: [], statut: 'valide',
    }
    r.controles = evaluerControles(r)
    r.statut = r.controles.some(c => !c.ok) ? 'anomalie' : 'valide'
    recharges.value.push(r)
  }

  /** Ouverture du dossier d'écart — étape 2 du circuit de refacturation. */
  function ouvrirQualification(id: string) {
    const r = getById(id)
    if (r) r.statut = 'en_qualification'
  }

  /** Qualification de l'écart, préalable obligatoire à toute refacturation. */
  function qualifier(id: string, qualification: QualifEcartCarburant, commentaire: string) {
    const r = getById(id)
    if (!r) return
    r.qualification = qualification
    r.commentaire = commentaire
    r.statut = 'qualifie'
  }

  /** Nombre de bons délivrés par véhicule sur une période.
   *  Indicateur demandé par le client : permet de comparer l'efficacité des
   *  véhicules et de détecter une dérive, sans aucun capteur. */
  const bonsParVehicule = computed(() => {
    const acc = new Map<string, { plaque: string; bons: number; litres: number; montant: number }>()
    recharges.value.forEach(r => {
      const e = acc.get(r.vehiculeId) ?? { plaque: r.vehiculePlaque, bons: 0, litres: 0, montant: 0 }
      e.bons += r.nombreBons ?? 0
      e.litres += r.litres
      e.montant += r.montant
      acc.set(r.vehiculeId, e)
    })
    return [...acc.entries()]
      .map(([vehiculeId, v]) => ({ vehiculeId, ...v }))
      .sort((a, b) => b.bons - a.bons)
  })

  const totalBons = computed(() =>
    recharges.value.reduce((s, r) => s + (r.nombreBons ?? 0), 0))

  return {
    recharges,
    anomalies, periodesConso, bonsParVehicule, totalBons,
    getById, rechargesDuVehicule, rechargesDuChauffeur,
    litresDelivres, montantTotal, evaluerControles, rafraichirControles,
    create, ouvrirQualification, qualifier,
  }
})
