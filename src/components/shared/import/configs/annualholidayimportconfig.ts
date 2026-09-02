import { useCalendarStore } from '../../../../stores/calendar'
import type { ImportConfig } from '../importTypes'

export function buildAnnualHolidayImportConfig(): ImportConfig {
  const store = useCalendarStore()

  return {
    title: 'Fériés annuels',
    intro: "Importez plusieurs jours fériés récurrents en une fois (ex. Fête du Travail, Indépendance). Ils se répètent chaque année à la même date.",
    dependencies: [],
    columns: [
      { key: 'name', csvHeader: 'Nom', label: 'Nom', required: true, type: 'text', sample: 'Fête du Travail' },
      { key: 'date', csvHeader: 'Date (MM-JJ)', label: 'Date', required: true, type: 'text', sample: '05-01' },
    ],
    sampleRows: [
      { Nom: 'Fête du Travail', 'Date (MM-JJ)': '05-01' },
      { Nom: "Fête de l'Indépendance", 'Date (MM-JJ)': '06-26' },
    ],
    createRow(payload) {
      store.addHoliday({
        name: payload.name as string,
        date: payload.date as string,
        type: 'annual',
        isRecurring: true,
      })
      return payload
    },
  }
}