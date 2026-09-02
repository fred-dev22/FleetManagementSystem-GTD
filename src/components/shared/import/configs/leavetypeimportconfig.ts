import { useLeaveTypesStore } from '../../../../stores/leaveTypes'
import type { ImportConfig } from '../importTypes'

export function buildLeaveTypeImportConfig(): ImportConfig {
  const store = useLeaveTypesStore()

  return {
    title: 'Types de congés',
    intro: "Importez plusieurs types de congés en une fois (ex. Congé annuel, Congé maladie). Les règles de calcul détaillées se complètent ensuite dans le tableau.",
    dependencies: [],
    columns: [
      { key: 'name', csvHeader: 'Nom', label: 'Nom', required: true, type: 'text', sample: 'Congé sans solde' },
      { key: 'code', csvHeader: 'Code', label: 'Code', required: true, type: 'text', sample: 'CSS' },
      { key: 'daysPerYear', csvHeader: 'Jours par an', label: 'Jours/an', required: true, type: 'number', sample: '0' },
      { key: 'noticeDays', csvHeader: 'Préavis (jours)', label: 'Préavis', required: false, type: 'number', sample: '7' },
      { key: 'requiresDocument', csvHeader: 'Justificatif requis', label: 'Justificatif requis', required: false, type: 'boolean', sample: 'non' },
      { key: 'color', csvHeader: 'Couleur', label: 'Couleur', required: false, type: 'text', sample: '#94A3B8' },
    ],
    sampleRows: [
      { Nom: 'Congé sans solde', Code: 'CSS', 'Jours par an': '0', 'Préavis (jours)': '7', 'Justificatif requis': 'non', Couleur: '#94A3B8' },
    ],
    createRow(payload) {
      store.addLeaveType({
        name: payload.name as string,
        code: payload.code as string,
        daysPerYear: Number(payload.daysPerYear) || 0,
        maxCarryOver: 0,
        noticeDays: Number(payload.noticeDays) || 0,
        requiresDocument: !!payload.requiresDocument,
        workflow: 'standard',
        isActive: true,
        isSystem: false,
        color: (payload.color as string) || '#94A3B8',
        icon: 'ti-calendar',
      })
      return payload
    },
  }
}