import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TypeEcartConfig, ParametresExploitation, CategorieEcart } from '../types/fms'

/**
 * Données de référence paramétrables.
 *
 * Séparation à tenir : la page Conformité affiche des FAITS — les écarts relevés.
 * Ce store porte les RÈGLES — les types d'écart, leurs gravités, leurs seuils.
 * Sans cette séparation, l'application affiche des gravités « majeur » ou
 * « critique » que personne ne peut expliquer ni modifier.
 */
export const useConfigurationStore = defineStore('configuration', () => {

  /* ══ Types d'écart ═════════════════════════════════════════ */
  const typesEcart = ref<TypeEcartConfig[]>([
    { id: 'TE-01', code: 'PT-MANQUE',   libelle: 'Point de passage manqué',        categorie: 'itineraire',   gravite: 'majeur',   actif: true,
      description: 'Un site de la séquence n’a pas été atteint.' },
    { id: 'TE-02', code: 'PT-ORDRE',    libelle: 'Point franchi hors séquence',    categorie: 'itineraire',   gravite: 'mineur',   actif: true,
      description: 'Les sites ont été desservis dans un ordre différent de celui prévu.' },
    { id: 'TE-03', code: 'INTERVALLE',  libelle: 'Dépassement d’intervalle',       categorie: 'itineraire',   gravite: 'mineur',   seuilValeur: 30, seuilUnite: 'min', actif: true,
      description: 'Le temps entre deux points dépasse la durée prévue au-delà du seuil.' },
    { id: 'TE-04', code: 'ARRET-NP',    libelle: 'Arrêt non planifié',             categorie: 'arret',        gravite: 'critique', seuilValeur: 20, seuilUnite: 'min', actif: true,
      description: 'Immobilisation hors d’un site déclaré au-delà du seuil. Signal principal de prélèvement.' },
    { id: 'TE-05', code: 'REPOS-LIEU',  libelle: 'Repos hors parking autorisé',    categorie: 'arret',        gravite: 'majeur',   actif: true,
      description: 'Repos pris ailleurs qu’à Ampasimadinika, Sahamamy ou Moramanga 47.' },
    { id: 'TE-06', code: 'TCC',         libelle: 'Conduite continue dépassée',     categorie: 'temps',        gravite: 'critique', seuilValeur: 270, seuilUnite: 'min', actif: true,
      description: 'Plus de 4 h 30 de conduite sans arrêt d’au moins 45 min.' },
    { id: 'TE-07', code: 'TCJ',         libelle: 'Conduite journalière dépassée',  categorie: 'temps',        gravite: 'critique', seuilValeur: 600, seuilUnite: 'min', actif: true,
      description: 'Plus de 10 h de conduite sur la journée.' },
    { id: 'TE-08', code: 'TTJ',         libelle: 'Travail journalier dépassé',     categorie: 'temps',        gravite: 'majeur',   seuilValeur: 720, seuilUnite: 'min', actif: true,
      description: 'Plus de 12 h de travail, conduite et pauses comprises.' },
    { id: 'TE-09', code: 'TRH',         libelle: 'Repos hebdomadaire insuffisant', categorie: 'temps',        gravite: 'majeur',   seuilValeur: 24, seuilUnite: 'h', actif: true },
    { id: 'TE-10', code: 'NUIT',        libelle: 'Conduite de nuit non autorisée', categorie: 'temps',        gravite: 'majeur',   actif: true },
    { id: 'TE-11', code: 'SURVITESSE',  libelle: 'Survitesse',                     categorie: 'comportement', gravite: 'majeur',   seuilValeur: 5, seuilUnite: '% au-dessus', actif: true },
    { id: 'TE-12', code: 'FREINAGE',    libelle: 'Freinage brusque',               categorie: 'comportement', gravite: 'mineur',   actif: true },
    { id: 'TE-13', code: 'ACCEL',       libelle: 'Accélération brusque',           categorie: 'comportement', gravite: 'mineur',   actif: true },
    { id: 'TE-14', code: 'ACCOTEMENT',  libelle: 'Roulage ou arrêt sur accotement',categorie: 'comportement', gravite: 'majeur',   actif: true },
    { id: 'TE-15', code: 'CLANDESTIN',  libelle: 'Passager clandestin',            categorie: 'comportement', gravite: 'critique', actif: true },
    { id: 'TE-16', code: 'KM-ECART',    libelle: 'Écart kilométrique',             categorie: 'itineraire',   gravite: 'mineur',   seuilValeur: 5, seuilUnite: '%', actif: true },
    { id: 'TE-17', code: 'DOC-INCOMP',  libelle: 'Dossier documentaire incomplet', categorie: 'document',     gravite: 'majeur',   actif: true },
  ])

  const parCategorie = computed(() => {
    const acc = {} as Record<CategorieEcart, TypeEcartConfig[]>
    typesEcart.value.forEach(t => {
      if (!acc[t.categorie]) acc[t.categorie] = []
      acc[t.categorie]!.push(t)
    })
    return acc
  })

  const typesActifs = computed(() => typesEcart.value.filter(t => t.actif))
  const getTypeEcart = (id: string) => typesEcart.value.find(t => t.id === id)
  const getParCode = (code: string) => typesEcart.value.find(t => t.code === code)

  function creerTypeEcart(data: Omit<TypeEcartConfig, 'id'>) {
    typesEcart.value.push({ ...data, id: `TE-${String(typesEcart.value.length + 1).padStart(2, '0')}` })
  }

  function majTypeEcart(id: string, data: Partial<TypeEcartConfig>) {
    const t = getTypeEcart(id)
    if (t) Object.assign(t, data)
  }

  function basculerActif(id: string) {
    const t = getTypeEcart(id)
    if (t) t.actif = !t.actif
  }

  /* ══ Paramètres d'exploitation ═════════════════════════════ */
  const parametres = ref<ParametresExploitation>({
    litresParBonDefaut: 500,
    toleranceKmPct: 5,
    seuilArretMin: 20,
    tccMaxMin: 270,
    pauseApresTccMin: 45,
    tcjMaxMin: 600,
    ttjMaxMin: 720,
    trhMinH: 24,
    plafondHebdoH: 56,
    plafondBihebdoH: 90,

    /* Seuils d'alerte - les valeurs reprises ci-dessous sont celles qui
       étaient auparavant figées dans le code. Elles servent de point de
       départ ; l'exploitation les ajuste depuis l'écran Paramètres. */
    preavisEntretienKm: 1_000,
    preavisEntretienJours: 15,
    rayonValidationPassageM: 5_000,
    preavisDocumentaireJours: 30,
  })

  function majParametres(data: Partial<ParametresExploitation>) {
    Object.assign(parametres.value, data)
  }

  /**
   * Bornes de saisie des seuils d'alerte.
   * Un rayon de validation trop court manque des passages réels ; trop long,
   * il valide un site que le camion n'a fait que longer. Un préavis nul
   * revient à supprimer l'alerte. Ces bornes empêchent les deux erreurs.
   */
  const BORNES_SEUILS = {
    preavisEntretienKm:       { min: 100,  max: 10_000, unite: 'km' },
    preavisEntretienJours:    { min: 1,    max: 90,     unite: 'jours' },
    rayonValidationPassageM:  { min: 200,  max: 20_000, unite: 'm' },
    preavisDocumentaireJours: { min: 1,    max: 180,    unite: 'jours' },
  } as const

  /** Un seuil hors bornes est signalé plutôt que refusé en silence. */
  function seuilHorsBornes(cle: keyof typeof BORNES_SEUILS): boolean {
    const v = parametres.value[cle]
    const b = BORNES_SEUILS[cle]
    return v == null || v < b.min || v > b.max
  }

  /* ══ US 2.8.2 — Détection des règles systématiquement ignorées ══
     Le cahier des charges FMS Trucks prévoit un indicateur de « fatigue
     d'alerte » : une règle qui se déclenche souvent sans jamais donner
     lieu à une action doit être revue, plutôt que subie.
     ══════════════════════════════════════════════════════════════ */

  /** Seuil au-delà duquel une règle est jugée ignorée — à confirmer par GTD. */
  const SEUIL_IGNOREE_PCT = 80
  const MIN_DECLENCHEMENTS = 5

  /**
   * Une règle est signalée si elle s'est déclenchée au moins cinq fois
   * et que plus de 80 % de ses alertes sont restées sans suite.
   * @param stats déclenchements et actions par type d'écart
   */
  function reglesIgnorees(stats: { typeEcartId: string; declenchees: number; traitees: number }[]) {
    return stats
      .filter(s => s.declenchees >= MIN_DECLENCHEMENTS)
      .map(s => ({
        ...s,
        type: typesEcart.value.find(t => t.id === s.typeEcartId),
        tauxIgnore: Math.round(((s.declenchees - s.traitees) / s.declenchees) * 100),
      }))
      .filter(s => s.tauxIgnore >= SEUIL_IGNOREE_PCT)
      .sort((a, b) => b.tauxIgnore - a.tauxIgnore)
  }

  return {
    SEUIL_IGNOREE_PCT, MIN_DECLENCHEMENTS, reglesIgnorees,
    typesEcart, typesActifs, parCategorie,
    getTypeEcart, getParCode, creerTypeEcart, majTypeEcart, basculerActif,
    parametres, majParametres, BORNES_SEUILS, seuilHorsBornes,
  }
})
