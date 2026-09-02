import { useCalendarStore } from '../../../../stores/calendar'
import type { ImportConfig } from '../importTypes'

export function buildPonctualHolidayImportConfig(): ImportConfig {
  const store = useCalendarStore()

  return {
    title: 'Fériés ponctuels',
    intro: "Importez plusieurs jours fériés exceptionnels en une fois (ex. un jour férié décrété pour une année donnée). Contrairement aux fériés annuels, ils ne se répètent pas.",
    dependencies: [],
    columns: [
      { key: 'name', csvHeader: 'Nom', label: 'Nom', required: true, type: 'text', sample: 'Journée de deuil national' },
      { key: 'date', csvHeader: 'Date (AAAA-MM-JJ)', label: 'Date', required: true, type: 'date', sample: '2026-09-15' },
    ],
    sampleRows: [
      { Nom: 'Journée de deuil national', 'Date (AAAA-MM-JJ)': '2026-09-15' },
    ],
    createRow(payload) {
      store.addHoliday({
        name: payload.name as string,
        date: payload.date as string,
        type: 'ponctual',
        isRecurring: false,
      })
      return payload
    },
  }
}