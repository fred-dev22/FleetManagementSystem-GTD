<template>
  <div class="relative rounded-lg px-3.5 overflow-hidden border border-border" :style="{ height }">
    <div ref="mapEl" class="w-full h-full z-0" />

    <!-- Légende -->
    <div
      v-if="showLegend && legend.length"
      class="absolute bottom-3 left-3 z-[500] bg-card/95 backdrop-blur border border-border rounded-md px-3 py-2 flex flex-col gap-1.5 shadow-sm"
    >
      <div v-for="l in legend" :key="l.label" class="flex items-center gap-2 text-[11px] text-foreground">
        <span
          class="w-4 h-0.5 rounded-full shrink-0"
          :style="{ backgroundColor: l.color, borderTop: l.dashed ? `2px dashed ${l.color}` : undefined, height: l.dashed ? '0' : '2px' }"
        />
        {{ l.label }}
      </div>
    </div>

    <slot name="overlay" />
  </div>
</template>

<script setup lang="ts">
/**
 * FleetMap - carte Leaflet réutilisable du module Flotte.
 *
 * Conçue comme un COMPOSANT et non comme un écran : la même carte sert la tour
 * de contrôle, la fiche voyage, la fiche d'écart et le sélecteur de trajet.
 * Leaflet est chargé dynamiquement, comme dans `CarteView`.
 *
 * Modes d'usage (par combinaison de props) :
 *  · flotte      → `markers`
 *  · trajet      → `tracePrevu` + `pointsPassage`
 *  · comparaison → `tracePrevu` + `traceReel` (+ `arrets`)
 */
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { LatLng, MapMarker, MapArret, ZoneCarte } from '../../types/fms'

const props = withDefaults(defineProps<{
  markers?: MapMarker[]
  tracePrevu?: LatLng[]
  traceReel?: LatLng[]
  pointsPassage?: ZoneCarte[]
  arrets?: MapArret[]
  /** Largeur du couloir de tolérance, en mètres - dessiné autour du tracé prévu */
  couloirM?: number
  center?: LatLng
  zoom?: number
  height?: string
  autoFit?: boolean
  showLegend?: boolean
  selectedId?: string | null
}>(), {
  markers: () => [],
  tracePrevu: () => [],
  traceReel: () => [],
  pointsPassage: () => [],
  arrets: () => [],
  couloirM: 0,
  center: () => ({ lat: -18.8792, lng: 47.5079 }),   // Antananarivo
  zoom: 6,
  height: '460px',
  autoFit: true,
  showLegend: true,
  selectedId: null,
})

const emit = defineEmits<{ select: [id: string] }>()

const COLORS = {
  prevu:      '#0072C5',
  reel:       '#E6201C',
  couloir:    '#0072C5',
  obligatoire:'#16a34a',
  interdit:   '#dc2626',
  repos:      '#ca8a04',
  arretKo:    '#dc2626',
  arretOk:    '#16a34a',
}

const COULEUR_PP: Record<ZoneCarte['type'], string> = {
  obligatoire: COLORS.obligatoire,
  interdit:    COLORS.interdit,
  repos:       COLORS.repos,
}

const mapEl = ref<HTMLDivElement | null>(null)
let L: any = null
let map: any = null
let layer: any = null          // groupe de toutes les couches métier
const markerRefs: Record<string, any> = {}

/* ── Fabriques d'icônes ──────────────────────────────────────── */
function pinIcon(color: string, texte = '') {
  return L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;border-radius:50%;background:${color};
      border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);display:flex;
      align-items:center;justify-content:center;color:#fff;font:600 10px/1 Inter,sans-serif;">${texte}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

function dotIcon(color: string, size = 14) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};
      border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

/* ── Rendu ───────────────────────────────────────────────────── */
function draw() {
  if (!map || !L) return
  if (layer) layer.clearLayers()
  else layer = L.layerGroup().addTo(map)
  Object.keys(markerRefs).forEach(k => delete markerRefs[k])

  const bounds: [number, number][] = []

  // Couloir de tolérance (rendu sous le tracé)
  if (props.couloirM > 0 && props.tracePrevu.length > 1) {
    L.polyline(props.tracePrevu.map(p => [p.lat, p.lng]), {
      color: COLORS.couloir,
      weight: Math.max(10, props.couloirM / 250),
      opacity: 0.14,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(layer)
  }

  // Tracé prévu - bleu pointillé
  if (props.tracePrevu.length > 1) {
    L.polyline(props.tracePrevu.map(p => [p.lat, p.lng]), {
      color: COLORS.prevu, weight: 4, opacity: 0.9, dashArray: '9 7',
    }).addTo(layer)
    props.tracePrevu.forEach(p => bounds.push([p.lat, p.lng]))
  }

  // Tracé réel - rouge plein
  if (props.traceReel.length > 1) {
    L.polyline(props.traceReel.map(p => [p.lat, p.lng]), {
      color: COLORS.reel, weight: 4, opacity: 0.95,
    }).addTo(layer)
    props.traceReel.forEach(p => bounds.push([p.lat, p.lng]))
  }

  // Points de passage
  props.pointsPassage.forEach(pp => {
    const color = COULEUR_PP[pp.type] ?? '#6b7280'
    if (pp.type === 'interdit') {
      L.circle([pp.lat, pp.lng], {
        radius: pp.rayonM, color, fillColor: color, fillOpacity: 0.12, weight: 1.5, dashArray: '4 4',
      }).addTo(layer)
    } else {
      L.circle([pp.lat, pp.lng], {
        radius: pp.rayonM, color, fillColor: color, fillOpacity: 0.08, weight: 1,
      }).addTo(layer)
    }
    L.marker([pp.lat, pp.lng], { icon: dotIcon(color, 12) })
      .bindTooltip(pp.nom, { direction: 'top', offset: [0, -8] })
      .addTo(layer)
    bounds.push([pp.lat, pp.lng])
  })

  // Arrêts relevés
  props.arrets.forEach(a => {
    const color = a.justifie ? COLORS.arretOk : COLORS.arretKo
    L.marker([a.lat, a.lng], { icon: pinIcon(color, String(a.dureeMin)) })
      .bindPopup(
        `<div style="font:600 12px Inter,sans-serif">${a.label}</div>
         <div style="font:400 11px Inter,sans-serif;color:#555">Arrêt de ${a.dureeMin} min - ${a.justifie ? 'justifié' : 'non justifié'}</div>`,
      )
      .addTo(layer)
    bounds.push([a.lat, a.lng])
  })

  // Véhicules / marqueurs libres
  props.markers.forEach(m => {
    const mk = L.marker([m.lat, m.lng], { icon: pinIcon(m.color ?? '#0072C5') })
      .bindTooltip(m.label, { direction: 'top', offset: [0, -10] })
      .addTo(layer)
    if (m.sublabel) {
      mk.bindPopup(
        `<div style="font:600 12px Inter,sans-serif">${m.label}</div>
         <div style="font:400 11px Inter,sans-serif;color:#555">${m.sublabel}</div>`,
      )
    }
    mk.on('click', () => emit('select', m.id))
    markerRefs[m.id] = mk
    bounds.push([m.lat, m.lng])
  })

  if (props.autoFit && bounds.length > 1) {
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 12 })
  } else if (bounds.length === 1) {
    map.setView(bounds[0], 11)
  }
}

const legend = ref<{ label: string; color: string; dashed?: boolean }[]>([])
function buildLegend() {
  const out: { label: string; color: string; dashed?: boolean }[] = []
  if (props.tracePrevu.length > 1) out.push({ label: 'Itinéraire de référence', color: COLORS.prevu, dashed: true })
  if (props.couloirM > 0)          out.push({ label: `Couloir de tolérance (${props.couloirM} m)`, color: COLORS.couloir })
  if (props.traceReel.length > 1)  out.push({ label: 'Trajet réellement suivi', color: COLORS.reel })
  if (props.arrets.length)         out.push({ label: 'Arrêt non justifié', color: COLORS.arretKo })
  legend.value = out
}

/* ── Cycle de vie ────────────────────────────────────────────── */
async function init() {
  if (!mapEl.value) return
  L = (await import('leaflet')).default
  await import('leaflet/dist/leaflet.css')

  map = L.map(mapEl.value, { zoomControl: true, attributionControl: true })
    .setView([props.center.lat, props.center.lng], props.zoom)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(map)

  draw()
  buildLegend()
  nextTick(() => map?.invalidateSize())
}

onMounted(init)

onBeforeUnmount(() => {
  map?.remove()
  map = null
  layer = null
})

watch(
  () => [props.markers, props.tracePrevu, props.traceReel, props.pointsPassage, props.arrets, props.couloirM],
  () => { draw(); buildLegend() },
  { deep: true },
)

watch(() => props.selectedId, id => {
  if (!id || !markerRefs[id] || !map) return
  const ll = markerRefs[id].getLatLng()
  map.setView(ll, 11, { animate: true, duration: 0.6 })
  markerRefs[id].openPopup()
})

defineExpose({ recenter: () => map?.invalidateSize() })
</script>
