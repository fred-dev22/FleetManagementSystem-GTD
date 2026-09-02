import { useMissionConfigStore } from '../../../../stores/missionConfig'
import type { ImportConfig } from '../importTypes'

export function buildEmpCategoryImportConfig(): ImportConfig {
  const store = useMissionConfigStore()

  return {
    title: "Catégories d'employés",
    intro: "Importez plusieurs catégories d'employés en une fois (ex. Cadre, Agent de maîtrise, Ouvrier). Les taux de frais par catégorie se saisissent ensuite dans le tableau Types de frais.",
    dependencies: [],
    columns: [
      { key: 'code', csvHeader: 'Code', label: 'Code', required: true, type: 'text', sample: 'CAT-A' },
      { key: 'label', csvHeader: 'Libellé', label: 'Libellé', required: true, type: 'text', sample: 'Cadre' },
      { key: 'description', csvHeader: 'Description', label: 'Description', required: false, type: 'text', sample: '' },
    ],
    sampleRows: [
      { Code: 'CAT-A', Libellé: 'Cadre', Description: 'Cadres et responsables de service' },
      { Code: 'CAT-B', Libellé: 'Agent de maîtrise', Description: '' },
    ],
    createRow(payload) {
      store.addCategory({
        code: payload.code as string,
        label: payload.label as string,
        description: (payload.description as string) || undefined,
      })
      return payload
    },
  }
}