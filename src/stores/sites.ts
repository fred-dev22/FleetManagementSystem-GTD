import { defineStore } from 'pinia'
import type { Site, TypeSite, TypeAlerteGeozone, EvenementGeozone } from '../types/index'

interface SitesState {
  sites: Site[]
  evenements: EvenementGeozone[]
}

export const useSitesStore = defineStore('sites', {
  state: (): SitesState => ({
    sites: [
      {
        id: 'site-001',
        code: 'GAR-TNR',
        nom: 'Garage Antananarivo',
        type: 'Garage' as TypeSite,
        latitude: -18.9137,
        longitude: 47.5361,
        rayon: 500,
        alerteType: 'entree_sortie' as TypeAlerteGeozone,
        actif: true,
      ville: 'Antananarivo',
        createdAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'site-002',
        code: 'DEP-GRT',
        nom: 'Dépôt Garage Rova Tamatave',
        type: 'Dépôt chargement' as TypeSite,
        latitude: -18.1492,
        longitude: 49.4023,
        rayon: 500,
        alerteType: 'entree_sortie' as TypeAlerteGeozone,
        actif: true,
      ville: 'Tamatave',
        createdAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'site-003',
        code: 'DEP-LPSA',
        nom: 'Dépôt La Pointe Sud Antsirabe',
        type: 'Dépôt déchargement' as TypeSite,
        latitude: -19.8659,
        longitude: 47.0333,
        rayon: 500,
        alerteType: 'entree_sortie' as TypeAlerteGeozone,
        actif: true,
      ville: 'Antsirabe',
        createdAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'site-004',
        code: 'GAR-AND',
        nom: 'Garage Andoharanofotsy',
        type: 'Garage' as TypeSite,
        latitude: -19.0167,
        longitude: 47.5333,
        rayon: 500,
        alerteType: 'entree_sortie' as TypeAlerteGeozone,
        actif: true,
      ville: 'Andoharanofotsy',
        createdAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'site-005',
        code: 'GAR-TMV',
        nom: 'Garage Toamasina',
        type: 'Garage' as TypeSite,
        latitude: -18.1590,
        longitude: 49.3773,
        rayon: 500,
        alerteType: 'entree_sortie' as TypeAlerteGeozone,
        actif: true,
      ville: 'Toamasina',
        createdAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'site-006',
        code: 'ZAR-RN2',
        nom: 'Zone à risque RN2',
        type: 'Zone à risque' as TypeSite,
        latitude: -18.5500,
        longitude: 48.4000,
        rayon: 500,
        alerteType: 'entree_sortie' as TypeAlerteGeozone,
        actif: true,
      ville: 'Route Nationale 2',
        createdAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'site-007',
        code: 'PTC-ANT',
        nom: 'Point contrôle Antsiranana',
        type: 'Point de contrôle' as TypeSite,
        latitude: -12.3484,
        longitude: 49.2966,
        rayon: 500,
        alerteType: 'entree_sortie' as TypeAlerteGeozone,
        actif: true,
      ville: 'Antsiranana',
        createdAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'site-008',
        code: 'DEP-MJG',
        nom: 'Dépôt Majunga',
        type: 'Dépôt chargement' as TypeSite,
        latitude: -15.7167,
        longitude: 46.3167,
        rayon: 500,
        alerteType: 'entree_sortie' as TypeAlerteGeozone,
        actif: true,
      ville: 'Majunga',
        createdAt: '2023-01-01T00:00:00Z',
      },
    ],
    evenements: [
      {
        id: 'evt-001',
        siteId: 'site-001',
        vehiculeId: 'TRC-001',
        type: 'entree',
        horodatage: '2026-06-28T07:15:00Z',
        latitude: -18.9137,
        longitude: 47.5361,
      },
      {
        id: 'evt-002',
        siteId: 'site-002',
        vehiculeId: 'TRC-002',
        type: 'sortie',
        horodatage: '2026-06-28T06:45:00Z',
        latitude: -18.1492,
        longitude: 49.4023,
      },
      {
        id: 'evt-003',
        siteId: 'site-006',
        vehiculeId: 'TRC-003',
        type: 'entree',
        horodatage: '2026-06-28T05:30:00Z',
        latitude: -18.5500,
        longitude: 48.4000,
      },
      {
        id: 'evt-004',
        siteId: 'site-003',
        vehiculeId: 'TRC-004',
        type: 'entree',
        horodatage: '2026-06-27T22:10:00Z',
        latitude: -19.8659,
        longitude: 47.0333,
      },
      {
        id: 'evt-005',
        siteId: 'site-001',
        vehiculeId: 'TRC-005',
        type: 'sortie',
        horodatage: '2026-06-27T20:00:00Z',
        latitude: -18.9137,
        longitude: 47.5361,
      },
      {
        id: 'evt-006',
        siteId: 'site-007',
        vehiculeId: 'TRC-001',
        type: 'entree',
        horodatage: '2026-06-27T18:30:00Z',
        latitude: -12.3484,
        longitude: 49.2966,
      },
      {
        id: 'evt-007',
        siteId: 'site-005',
        vehiculeId: 'TRC-002',
        type: 'entree',
        horodatage: '2026-06-27T16:45:00Z',
        latitude: -18.1590,
        longitude: 49.3773,
      },
      {
        id: 'evt-008',
        siteId: 'site-008',
        vehiculeId: 'TRC-003',
        type: 'sortie',
        horodatage: '2026-06-27T14:20:00Z',
        latitude: -15.7167,
        longitude: 46.3167,
      },
      {
        id: 'evt-009',
        siteId: 'site-004',
        vehiculeId: 'TRC-006',
        type: 'entree',
        horodatage: '2026-06-27T12:00:00Z',
        latitude: -19.0167,
        longitude: 47.5333,
      },
      {
        id: 'evt-010',
        siteId: 'site-006',
        vehiculeId: 'TRC-004',
        type: 'sortie',
        horodatage: '2026-06-27T09:15:00Z',
        latitude: -18.5500,
        longitude: 48.4000,
      },
    ],
  }),

  getters: {
    getSiteById: (state) => (id: string): Site | undefined => {
      return state.sites.find((s) => s.id === id)
    },

    getSiteByCode: (state) => (code: string): Site | undefined => {
      return state.sites.find((s) => s.code === code)
    },

    sitesActifs: (state): Site[] => {
      return state.sites.filter((s) => s.actif === true)
    },

    evenementsRecents: (state): EvenementGeozone[] => {
      return [...state.evenements]
        .sort((a, b) => new Date(b.horodatage).getTime() - new Date(a.horodatage).getTime())
        .slice(0, 20)
    },
  },

  actions: {
    createSite(payload: Omit<Site, 'id'>): Site | null {
      const exists = this.sites.find((s) => s.code === payload.code)
      if (exists) {
        console.warn(`Site avec le code "${payload.code}" existe déjà.`)
        return null
      }
      const newSite: Site = {
        ...payload,
        id: `site-${Date.now()}`,
      }
      this.sites.push(newSite)
      return newSite
    },

    updateSite(id: string, payload: Partial<Omit<Site, 'id'>>): boolean {
      const index = this.sites.findIndex((s) => s.id === id)
      if (index === -1) return false
      this.sites[index] = { ...this.sites[index], ...payload }
      return true
    },

    toggleSite(id: string): boolean {
      const site = this.sites.find((s) => s.id === id)
      if (!site) return false
      site.actif = !site.actif
      return true
    },

    addEvenement(evenement: Omit<EvenementGeozone, 'id'>): EvenementGeozone {
      const newEvenement: EvenementGeozone = {
        ...evenement,
        id: `evt-${Date.now()}`,
      }
      this.evenements.push(newEvenement)
      return newEvenement
    },
  },
})
