/* ══════════════════════════════════════════════════════════════
   Infractions internes & sanctions RH

   Jusqu'ici, un manquement disciplinaire (absentéisme, faute
   professionnelle, non-respect d'une consigne au dépôt…) n'était
   tracé que dans un champ texte libre (`Employee.motifStatut`), sans
   historique ni sanction associée. Ce module en fait un registre
   structuré, distinct des infractions de conduite déjà suivies dans
   `ecarts.ts` (celles-ci concernent le trajet ; celles-ci concernent
   le comportement professionnel au sens large).
   ══════════════════════════════════════════════════════════════ */

export type NatureSanction =
  | 'absence_injustifiee' | 'retard_repete' | 'faute_professionnelle'
  | 'non_respect_consigne_securite' | 'insubordination'
  | 'degradation_materiel' | 'vol_fraude' | 'autre'

export const LIB_NATURE_SANCTION: Record<NatureSanction, string> = {
  absence_injustifiee:           'Absence injustifiée',
  retard_repete:                 'Retards répétés',
  faute_professionnelle:         'Faute professionnelle',
  non_respect_consigne_securite: "Non-respect d'une consigne de sécurité",
  insubordination:               'Insubordination',
  degradation_materiel:          'Dégradation de matériel',
  vol_fraude:                    'Vol / fraude',
  autre:                         'Autre',
}

export type TypeSanction =
  | 'avertissement_oral' | 'avertissement_ecrit' | 'mise_a_pied'
  | 'retenue_salaire' | 'licenciement'

export const LIB_TYPE_SANCTION: Record<TypeSanction, string> = {
  avertissement_oral:  'Avertissement oral',
  avertissement_ecrit: 'Avertissement écrit',
  mise_a_pied:         'Mise à pied',
  retenue_salaire:     'Retenue sur salaire',
  licenciement:        'Licenciement',
}

export type StatutSanction = 'en_cours' | 'cloturee'

export const LIB_STATUT_SANCTION: Record<StatutSanction, string> = {
  en_cours: 'En cours',
  cloturee: 'Clôturée',
}

export const CLS_STATUT_SANCTION: Record<StatutSanction, string> = {
  en_cours: 'bg-warning-bg text-warning',
  cloturee: 'bg-success-bg text-success',
}

/**
 * Un fait daté, une sanction éventuelle (pas systématique - un
 * avertissement oral peut rester sans « type » formel), et un statut
 * de traitement. Le lien `voyageId` / `ordreTravailId` est optionnel :
 * une faute constatée en mission peut être rattachée au voyage concerné.
 */
export interface SanctionRH {
  id: string
  employeId: string
  employeNom: string
  date: string
  nature: NatureSanction
  description: string
  sanction?: TypeSanction
  statut: StatutSanction
  responsable: string
  dateCloture?: string
  voyageId?: string
  voyageRef?: string
}