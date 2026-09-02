import { useMissionConfigStore } from '../../../../stores/missionConfig'
import type { ImportConfig } from '../importTypes'

const UNIT_OPTIONS = [
  { value: 'per_day', label: 'Par jour' },
  { value: 'flat', label: 'Forfait' },
  { value: 'real', label: 'Au réel' },
]

export function buildFeeTypeImportConfig(): ImportConfig {
  const store = useMissionConfigStore()

  return {
    title: 'Types de frais',
    intro: "Importez plusieurs types de frais de mission en une fois (ex. Hébergement, Repas, Transport). Les montants par catégorie d'employé se saisissent ensuite directement dans le tableau, colonne par colonne.",
    dependencies: [
      {
        label: "Au moins une catégorie d'employé doit déjà exister",
        ok: () => store.categories.length > 0,
        routeTo: { name: 'hr-config-mission-fees' },
        required: false,
      },
    ],
    columns: [
      { key: 'name', csvHeader: 'Nom', label: 'Nom', required: true, type: 'text', sample: 'Hébergement' },
      { key: 'code', csvHeader: 'Code', label: 'Code', required: true, type: 'text', sample: 'HEB' },
      { key: 'unit', csvHeader: 'Unité', label: 'Unité', required: true, type: 'select', sample: 'Par jour', options: () => UNIT_OPTIONS },
      { key: 'requiresReceipt', csvHeader: 'Justificatif requis', label: 'Justificatif requis', required: false, type: 'boolean', sample: 'oui' },
    ],
    sampleRows: [
      { Nom: 'Hébergement', Code: 'HEB', Unité: 'Par jour', 'Justificatif requis': 'oui' },
      { Nom: 'Repas', Code: 'REP', Unité: 'Par jour', 'Justificatif requis': 'non' },
    ],
    createRow(payload) {
      store.addFeeType({
        name: payload.name as string,
        code: payload.code as string,
        unit: payload.unit as 'per_day' | 'flat' | 'real',
        requiresReceipt: !!payload.requiresReceipt,
        rules: [],
        isActive: true,
      })
      return payload
    },
  }
}