import { useEntityStore } from '../../../../stores/entities'
import type { ImportConfig } from '../importTypes'
import type { EntityType } from '../../../../types'

const TYPE_OPTIONS = [
  { value: 'direction', label: 'Direction' },
  { value: 'department', label: 'Département' },
  { value: 'service', label: 'Service' },
]

export function buildEntityImportConfig(): ImportConfig {
  const entityStore = useEntityStore()

  return {
    title: 'Départements',
    intro: "Importez plusieurs départements/services en une fois. Une entité créée par import démarre en brouillon, comme une entité créée manuellement (Personnel → Département → Nouveau).",
    dependencies: [],
    columns: [
      { key: 'code', csvHeader: 'Code', label: 'Code', required: true, type: 'text', sample: 'DEXP' },
      { key: 'name', csvHeader: 'Nom', label: 'Nom', required: true, type: 'text', sample: 'Service Exploitation' },
      { key: 'type', csvHeader: 'Type', label: 'Type', required: true, type: 'select', sample: 'Service', options: () => TYPE_OPTIONS },
      {
        key: 'parentId', csvHeader: 'Code entité parente', label: 'Entité parente', required: false, type: 'select', sample: '',
        options: () => entityStore.entities.map(e => ({ value: e.id, label: e.name, code: e.code })),
      },
      { key: 'responsibleName', csvHeader: 'Responsable', label: 'Responsable', required: false, type: 'text', sample: '' },
      { key: 'legalIdentifier', csvHeader: 'Identifiant légal', label: 'Identifiant légal', required: false, type: 'text', sample: '' },
      { key: 'address', csvHeader: 'Adresse', label: 'Adresse', required: false, type: 'text', sample: '' },
      { key: 'phone', csvHeader: 'Téléphone', label: 'Téléphone', required: false, type: 'text', sample: '' },
      { key: 'email', csvHeader: 'Email', label: 'Email', required: false, type: 'text', sample: '' },
      { key: 'headcount', csvHeader: 'Effectif', label: 'Effectif', required: false, type: 'number', sample: '0' },
    ],
    sampleRows: [
      {
        Code: 'DEXP', Nom: 'Service Exploitation Nord', Type: 'Service', 'Code entité parente': 'DOP',
        Responsable: '', 'Identifiant légal': '', Adresse: '', Téléphone: '', Email: '', Effectif: '0',
      },
    ],
    createRow(payload) {
      entityStore.createEntity({
        code: payload.code as string,
        name: payload.name as string,
        type: payload.type as EntityType,
        parentId: (payload.parentId as string) || null,
        responsibleName: (payload.responsibleName as string) || undefined,
        legalIdentifier: (payload.legalIdentifier as string) || undefined,
        address: (payload.address as string) || undefined,
        phone: (payload.phone as string) || undefined,
        email: (payload.email as string) || undefined,
        headcount: Number(payload.headcount) || 0,
        validatorPools: [],
      })
      return payload
    },
  }
}