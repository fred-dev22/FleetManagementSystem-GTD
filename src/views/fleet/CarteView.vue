<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <MapPin class="w-7 h-7 text-primary" />
        <div>
          <h1 class="text-2xl font-bold text-foreground">Carte GPS temps réel</h1>
          <p class="text-sm text-muted-foreground">Suivi en temps réel de la flotte GTD — Madagascar</p>
        </div>
      </div>
      <button @click="refresh" class="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
        <RefreshCw :class="['w-4 h-4 transition-transform', refreshing ? 'animate-spin' : '']" />
        Rafraîchir
      </button>
    </div>

    <!-- Leaflet map container -->
    <div ref="mapContainer" class="rounded-xl border border-border overflow-hidden" style="height: 500px; width: 100%;"></div>

    <!-- Table des véhicules depuis le store -->
    <div class="bg-card rounded-xl border border-border overflow-hidden">
      <div class="px-5 py-4 border-b border-border flex items-center gap-2">
        <Truck class="w-5 h-5 text-primary" />
        <h2 class="font-semibold text-foreground">Véhicules actifs</h2>
        <span class="ml-auto text-xs text-muted-foreground">{{ lastRefresh }}</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-muted/50 border-b border-border">
            <tr>
              <th class="text-left px-4 py-3 font-semibold text-muted-foreground">Tracteur</th>
              <th class="text-left px-4 py-3 font-semibold text-muted-foreground">Plaque</th>
              <th class="text-left px-4 py-3 font-semibold text-muted-foreground">Chauffeur</th>
              <th class="text-left px-4 py-3 font-semibold text-muted-foreground">Statut</th>
              <th class="text-left px-4 py-3 font-semibold text-muted-foreground">Position approx.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in tracteurActifs" :key="t.id" class="border-b border-border hover:bg-muted/30 transition-colors">
              <td class="px-4 py-3 font-medium text-foreground">{{ t.id }}</td>
              <td class="px-4 py-3 font-mono text-foreground">{{ t.plaque }}</td>
              <td class="px-4 py-3 text-muted-foreground">{{ t.chauffeurNom ?? '—' }}</td>
              <td class="px-4 py-3">
                <span :class="statutClass(t.statutOp)" class="px-2 py-0.5 rounded-full text-xs font-medium">
                  {{ statutLabel(t.statutOp) }}
                </span>
              </td>
              <td class="px-4 py-3 text-xs text-muted-foreground">{{ positionLabel(t) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { MapPin, RefreshCw, Truck } from 'lucide-vue-next'
import { useTracteurStore } from '../../stores/tracteurs'
import type { Tracteur } from '../../types'

const tracteurStore = useTracteurStore()
const refreshing = ref(false)
const lastRefreshDate = ref(new Date())
const mapContainer = ref<HTMLDivElement | null>(null)
let mapInstance: any = null

const lastRefresh = computed(() =>
  `Mis à jour : ${lastRefreshDate.value.toLocaleTimeString('fr-FR')}`
)

const tracteurActifs = computed(() => tracteurStore.tracteurActifs)

// Positions mock réalistes Madagascar pour les tracteurs sans GPS
const POSITIONS_MG = [
  { lat: -18.8792, lng: 47.5079, label: 'Garage Antananarivo' },
  { lat: -18.9333, lng: 48.2000, label: 'Route vers Moramanga' },
  { lat: -18.1492, lng: 49.4023, label: 'Toamasina (Tamatave)' },
  { lat: -19.8667, lng: 47.0333, label: 'Antsirabe' },
  { lat: -19.0167, lng: 47.5333, label: 'Andoharanofotsy' },
  { lat: -18.5500, lng: 48.4000, label: 'Moramanga' },
  { lat: -15.7167, lng: 46.3167, label: 'Majunga' },
  { lat: -12.3484, lng: 49.2966, label: 'Antsiranana' },
]

function getPosition(t: Tracteur, index: number) {
  if (t.position) return { lat: t.position.lat, lng: t.position.lng, label: `${t.plaque} · GPS live` }
  const pos = POSITIONS_MG[index % POSITIONS_MG.length]!
  return { lat: pos.lat, lng: pos.lng, label: pos.label }
}

function positionLabel(t: Tracteur): string {
  const idx = tracteurActifs.value.findIndex(x => x.id === t.id)
  return getPosition(t, idx).label
}

function statutLabel(statut?: string): string {
  const map: Record<string, string> = {
    en_mouvement: 'En mouvement',
    arrete: 'Arrêté',
    allume_immobile: 'Allumé / Immobile',
    signal_perdu: 'Signal perdu',
  }
  return map[statut ?? ''] ?? statut ?? '—'
}

function statutClass(statut?: string): string {
  const map: Record<string, string> = {
    en_mouvement:    'bg-green-100 text-green-700',
    arrete:          'bg-blue-100 text-blue-700',
    allume_immobile: 'bg-yellow-100 text-yellow-700',
    signal_perdu:    'bg-red-100 text-red-700',
  }
  return map[statut ?? ''] ?? 'bg-gray-100 text-gray-600'
}

const MARKER_COLORS: Record<string, string> = {
  en_mouvement:    '#16a34a',
  arrete:          '#2563eb',
  allume_immobile: '#ca8a04',
  signal_perdu:    '#dc2626',
}

async function initMap() {
  if (!mapContainer.value) return
  const L = (await import('leaflet')).default
  await import('leaflet/dist/leaflet.css')

  // Fix default icon paths
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })

  mapInstance = L.map(mapContainer.value).setView([-18.8792, 47.5079], 7)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(mapInstance)

  addMarkers(L)
}

function addMarkers(L: any) {
  if (!mapInstance) return
  tracteurActifs.value.forEach((t, i) => {
    const pos = getPosition(t, i)
    const color = MARKER_COLORS[t.statutOp ?? ''] ?? '#6b7280'

    const icon = L.divIcon({
      className: '',
      html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.4)"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    })

    const marker = L.marker([pos.lat, pos.lng], { icon }).addTo(mapInstance)
    marker.bindPopup(`
      <div style="min-width:160px;font-family:sans-serif">
        <div style="font-weight:700;font-size:13px;margin-bottom:4px">${t.id} · ${t.plaque}</div>
        <div style="font-size:11px;color:#6b7280">Chauffeur : ${t.chauffeurNom ?? '—'}</div>
        <div style="font-size:11px;color:#6b7280">Statut : ${statutLabel(t.statutOp)}</div>
        <div style="font-size:10px;color:#9ca3af;margin-top:2px">${pos.label}</div>
      </div>
    `)
  })
}

function refresh() {
  refreshing.value = true
  setTimeout(() => {
    lastRefreshDate.value = new Date()
    refreshing.value = false
    if (mapInstance) {
      mapInstance.eachLayer((l: any) => { if (l._icon || l._latlng) mapInstance.removeLayer(l) })
    }
  }, 800)
}

onMounted(() => initMap())
onUnmounted(() => { mapInstance?.remove(); mapInstance = null })
</script>
