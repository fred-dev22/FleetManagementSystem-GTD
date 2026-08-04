<template>
  <!-- ═══ MODIF 1 : marge de page canonique, carte présentée en carte ═══ -->
  <div class="px-7 py-6 h-[calc(100vh-56px)]">
    <div class="flex h-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">

    <!-- ── Panneau gauche : liste des camions ── -->
    <div class="w-[280px] shrink-0 flex flex-col border-r border-border bg-card overflow-hidden">

      <!-- En-tête panneau -->
      <div class="px-4 pt-4 pb-3 border-b border-border">
        <div class="flex items-center gap-2 mb-2.5">
          <Truck class="w-4 h-4 text-primary shrink-0" />
          <span class="text-[13px] font-semibold text-foreground">Flotte GTD</span>
          <span class="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
            {{ recherche ? `${tracteursFiltres.length}/${tracteurs.length}` : tracteurs.length }}
          </span>
        </div>

        <!-- ═══ Zone de recherche ═══ -->
        <div class="relative mb-2.5">
          <Search class="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            v-model="recherche"
            type="text"
            placeholder="Plaque, chauffeur, marque…"
            class="w-full h-[30px] pl-8 pr-7 rounded-lg border border-border bg-background text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          <button
            v-if="recherche"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer p-0"
            title="Effacer"
            @click="recherche = ''"
          >
            <X class="w-3 h-3" />
          </button>
        </div>

        <!-- Bouton simulation -->
        <button
          @click="toggleSimulation"
          :class="[
            'w-full inline-flex items-center justify-center gap-2 py-1.5 rounded-lg text-[12px] font-semibold transition-colors',
            simRunning
              ? 'bg-danger-bg text-danger hover:bg-danger/10'
              : 'bg-primary/10 text-primary hover:bg-primary/20'
          ]"
        >
          <component :is="simRunning ? PauseCircle : PlayCircle" class="w-3.5 h-3.5" />
          {{ simRunning ? 'Arrêter la simulation' : 'Lancer la simulation' }}
        </button>

        <div v-if="simRunning" class="flex items-center gap-1.5 mt-2">
          <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></span>
          <span class="text-[10px] text-muted-foreground">Simulation en cours · {{ tick }}s</span>
        </div>
      </div>

      <!-- Liste scrollable -->
      <div class="flex-1 overflow-y-auto py-1">
        <button
          v-for="t in tracteursFiltres"
          :key="t.id"
          @click="selectTruck(t.id)"
          :class="[
            'w-full text-left px-3.5 py-2.5 border-b border-border/50 transition-colors flex items-start gap-2.5',
            selectedId === t.id ? 'bg-primary/10' : 'hover:bg-muted/50'
          ]"
        >
          <div
            class="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
            :style="{ background: statusColor(t.statutOp) }"
          ></div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span class="text-[12px] font-bold text-foreground">{{ t.id }}</span>
              <span class="text-[10px] font-mono text-muted-foreground">{{ t.plaque }}</span>
              <!-- ═══ AJOUT 2 : alerte visible sans avoir à cliquer ═══ -->
              <AlertTriangle v-if="alertesDuVehicule(t.id).length" class="w-3 h-3 text-danger shrink-0" />
            </div>
            <div class="text-[11px] text-muted-foreground mt-0.5 truncate">
              {{ t.marque }} {{ t.modele }}
            </div>
            <div class="flex items-center gap-1.5 mt-1">
              <span
                class="text-[10px] font-medium px-1.5 py-px rounded-full"
                :style="{ background: statusColor(t.statutOp) + '22', color: statusColor(t.statutOp) }"
              >{{ statusLabel(t.statutOp) }}</span>
              <span v-if="t.statutOp === 'en_mouvement'" class="text-[10px] text-muted-foreground">
                {{ simPositions[t.id]?.vitesse ?? t.position?.vitesse ?? 0 }} km/h
              </span>
            </div>
            <div v-if="t.chauffeurNom" class="text-[10px] text-muted-foreground mt-0.5 truncate">
              <User class="w-2.5 h-2.5 inline-block mr-0.5 align-[-1px]" />{{ t.chauffeurNom }}
            </div>
          </div>
          <div
            v-if="t.niveauCarburant !== undefined"
            class="shrink-0 flex flex-col items-end gap-0.5"
          >
            <span class="text-[10px] text-muted-foreground">{{ t.niveauCarburant }}%</span>
            <div class="w-8 h-1.5 rounded-full bg-border overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :style="{ width: t.niveauCarburant + '%', background: t.niveauCarburant > 25 ? '#16a34a' : '#dc2626' }"
              ></div>
            </div>
          </div>
        </button>
      </div>

      <!-- Légende -->
      <div class="px-3.5 py-3 border-t border-border grid grid-cols-2 gap-x-3 gap-y-1.5">
        <div v-for="s in STATUTS" :key="s.key" class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full shrink-0" :style="{ background: s.color }"></span>
          <span class="text-[10px] text-muted-foreground">{{ s.label }}</span>
        </div>
      </div>
    </div>

    <!-- ── Carte principale ── -->
    <div class="flex-1 relative overflow-hidden">

      <!-- Info camion sélectionné (overlay) -->
      <Transition name="slide-down">
        <div
          v-if="selectedTruck"
          class="absolute top-3 left-1/2 -translate-x-1/2 z-[500] bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-xl px-5 py-3 flex items-center gap-5 min-w-[420px] max-w-[600px]"
        >
          <div
            class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            :style="{ background: statusColor(selectedTruck.statutOp) + '20' }"
          >
            <Truck class="w-5 h-5" :style="{ color: statusColor(selectedTruck.statutOp) }" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-bold text-foreground text-[14px]">{{ selectedTruck.id }}</span>
              <span class="font-mono text-[12px] text-muted-foreground">{{ selectedTruck.plaque }}</span>
              <span
                class="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
                :style="{ background: statusColor(selectedTruck.statutOp) + '22', color: statusColor(selectedTruck.statutOp) }"
              >{{ statusLabel(selectedTruck.statutOp) }}</span>
            </div>
            <div class="flex items-center gap-4 mt-0.5 text-[11px] text-muted-foreground">
              <span>{{ selectedTruck.marque }} {{ selectedTruck.modele }}</span>
              <span v-if="selectedTruck.chauffeurNom"><User class="w-3 h-3 inline mr-0.5" />{{ selectedTruck.chauffeurNom }}</span>
              <span v-if="selectedTruck.statutOp === 'en_mouvement'">
                <span class="text-green-600 font-medium">{{ simPositions[selectedTruck.id]?.vitesse ?? selectedTruck.position?.vitesse ?? 0 }} km/h</span>
              </span>
            </div>
          </div>
          <button @click="selectedId = null" class="text-muted-foreground hover:text-foreground transition-colors ml-2">
            <X class="w-4 h-4" />
          </button>
        </div>
      </Transition>

      <!-- Conteneur carte Leaflet -->
      <div ref="mapContainer" class="w-full h-full"></div>

      <!-- ═══════════════════════════════════════════════════════════
           AJOUT 3 - Panneau « voyage en cours » au clic sur un véhicule
           ═══════════════════════════════════════════════════════════ -->
      <Transition name="slide-left">
        <div
          v-if="voyageSelectionne"
          class="absolute top-3 left-3 z-[600] w-[300px] max-h-[calc(100%-24px)] overflow-y-auto bg-card border border-border rounded-xl shadow-lg"
        >
          <div class="px-3.5 py-2.5 border-b border-border">
            <div class="flex items-center gap-1.5">
              <Route class="w-3.5 h-3.5 text-primary shrink-0" />
              <span class="font-mono text-[12px] font-semibold text-foreground">{{ voyageSelectionne.reference }}</span>
            </div>
            <p class="text-[11px] text-muted-foreground truncate mt-0.5">
              {{ voyageSelectionne.trajetLibelle ?? 'Trajet ponctuel' }}
            </p>
          </div>

          <div class="px-3.5 py-3 flex flex-col gap-3">
            <dl class="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
              <div><dt class="text-muted-foreground text-[10px]">Client</dt><dd class="text-foreground">{{ voyageSelectionne.clientNom }}</dd></div>
              <div><dt class="text-muted-foreground text-[10px]">Produit</dt><dd class="text-foreground">{{ voyageSelectionne.volumes.produit }}</dd></div>
              <div><dt class="text-muted-foreground text-[10px]">Km référence</dt><dd class="text-foreground">{{ voyageSelectionne.kmReference }} km</dd></div>
              <div><dt class="text-muted-foreground text-[10px]">Citerne</dt><dd class="font-mono text-foreground">{{ voyageSelectionne.citernePlaque ?? '-' }}</dd></div>
            </dl>

            <!-- Points de passage : franchis en vert -->
            <div v-if="voyageSelectionne.etapes.length">
              <p class="text-[11px] font-semibold text-foreground mb-1.5">
                Points de passage
                <span class="font-normal text-muted-foreground">({{ nbFranchis }}/{{ voyageSelectionne.etapes.length }})</span>
              </p>
              <ol class="relative pl-4 border-l-2 border-border flex flex-col gap-2">
                <li v-for="e in voyageSelectionne.etapes" :key="e.id" class="relative">
                  <span
                    class="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-card"
                    :class="e.franchi ? 'bg-green-600' : 'bg-gray-300'"
                  ></span>
                  <p class="text-[11px] font-medium text-foreground leading-tight">{{ e.siteNom }}</p>
                  <p class="text-[10px] text-muted-foreground">
                    {{ LIB_ROLE_ETAPE[e.role] }}<span v-if="e.intervalleMin"> · +{{ e.intervalleMin }} min</span>
                  </p>
                </li>
              </ol>
            </div>

            <button
              class="w-full py-1.5 rounded-lg text-[12px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              @click="router.push({ name: 'fleet-voyage-detail', params: { id: voyageSelectionne.id } })"
            >
              Ouvrir le dossier de voyage
            </button>
          </div>
        </div>
      </Transition>

      <!-- ═══════════════════════════════════════════════════════════
           AJOUT 4 - Bouton flottant d'alertes (esprit WhatsApp)
           ═══════════════════════════════════════════════════════════ -->
      <div class="absolute bottom-5 right-5 z-[700] flex flex-col items-end gap-2">
        <Transition name="fab">
          <div
            v-if="alertesOuvertes"
            class="w-[320px] max-h-[380px] overflow-y-auto bg-card border border-border rounded-xl shadow-xl"
          >
            <div class="flex items-center justify-between px-3.5 py-2.5 border-b border-border sticky top-0 bg-card">
              <span class="text-[12px] font-semibold text-foreground">Alertes en cours</span>
              <span class="text-[11px] text-muted-foreground">{{ alertes.length }}</span>
            </div>

            <div v-if="!alertes.length" class="px-3.5 py-6 text-center text-[11px] text-muted-foreground">
              Aucune alerte active.
            </div>

            <button
              v-for="a in alertes" :key="a.id"
              class="w-full text-left px-3.5 py-2.5 border-b border-border bg-transparent hover:bg-muted/50 cursor-pointer transition-colors"
              @click="a.action()"
            >
              <div class="flex items-start gap-2">
                <component
                  :is="a.icone" class="w-3.5 h-3.5 shrink-0 mt-0.5"
                  :class="a.gravite === 'critique' ? 'text-danger' : 'text-warning'"
                />
                <div class="min-w-0 flex-1">
                  <p class="text-[12px] font-medium text-foreground">{{ a.titre }}</p>
                  <p class="text-[11px] text-muted-foreground leading-snug">{{ a.detail }}</p>
                  <p class="text-[11px] text-primary font-medium mt-0.5">{{ a.aFaire }}</p>
                </div>
              </div>
            </button>
          </div>
        </Transition>

        <button
          class="w-14 h-14 rounded-full border-0 cursor-pointer shadow-lg flex items-center justify-center relative transition-transform hover:scale-105"
          :class="alertes.length ? 'bg-danger' : 'bg-primary'"
          :title="`${alertes.length} alerte(s) en cours`"
          @click="alertesOuvertes = !alertesOuvertes"
        >
          <X v-if="alertesOuvertes" class="w-6 h-6 text-white" />
          <Bell v-else class="w-6 h-6 text-white" />
          <span
            v-if="alertes.length && !alertesOuvertes"
            class="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full bg-white text-danger text-[11px] font-bold flex items-center justify-center border-2 border-danger"
          >{{ alertes.length }}</span>
        </button>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Truck, User, PlayCircle, PauseCircle, X, Search,
  // ═══ AJOUT : icônes des greffes ═══
  Bell, AlertTriangle, Octagon, Fuel, Route,
} from 'lucide-vue-next'
// ═══ MODIF 2 : le store « tracteurs » a été supprimé - on lit « vehicules » ═══
import { useVehiculesStore } from '../../stores/vehicules'
import type { Vehicule } from '../../types'
// ═══ AJOUT : stores nécessaires aux greffes ═══
import { useVoyagesStore } from '../../stores/voyages'
import { useEcartsStore, LIB_TYPE_ECART } from '../../stores/ecarts'
import { useCarburantStore } from '../../stores/carburant'
import { LIB_ROLE_ETAPE } from '../../types/fms'
import { fmtDuree } from '../../lib/fmsUtils'

const router         = useRouter()
const vehiculesStore = useVehiculesStore()
const voyagesStore   = useVoyagesStore()
const ecartsStore    = useEcartsStore()
const carburantStore = useCarburantStore()
const mapContainer  = ref<HTMLDivElement | null>(null)
let   L: any        = null
let   mapInstance: any = null
const markers: Record<string, any> = {}

// ── Statuts ────────────────────────────────────────────────────────
const STATUTS = [
  { key: 'en_mouvement',    label: 'En mouvement',    color: '#16a34a' },
  { key: 'arrete',          label: 'Arrêté',          color: '#2563eb' },
  { key: 'allume_immobile', label: 'Allumé / Immobile', color: '#ca8a04' },
  { key: 'signal_perdu',    label: 'Signal perdu',    color: '#dc2626' },
]
function statusColor(s?: string) {
  return STATUTS.find(x => x.key === s)?.color ?? '#6b7280'
}
function statusLabel(s?: string) {
  return STATUTS.find(x => x.key === s)?.label ?? s ?? '-'
}

// ── Données tracteurs ──────────────────────────────────────────────
const tracteurs = computed(() =>
  vehiculesStore.vehicules.filter(
    t => t.typeVehicule === 'tracteur' && t.statutAdmin !== 'archive' && t.position,
  )
)

/* ═══ Zone de recherche du panneau gauche ═══
   Filtre sur la plaque, l'identifiant, le chauffeur, la marque et le modèle.
   Les marqueurs de la carte suivent le filtre : chercher une plaque isole
   le camion correspondant. */
const recherche = ref('')

const tracteursFiltres = computed(() => {
  const q = recherche.value.trim().toLowerCase()
  if (!q) return tracteurs.value
  return tracteurs.value.filter(t =>
    `${t.plaque} ${t.id} ${t.chauffeurNom ?? ''} ${t.marque ?? ''} ${t.modele ?? ''}`
      .toLowerCase()
      .includes(q),
  )
})

/** Identifiants retenus par la recherche - sert à masquer les marqueurs écartés. */
const idsFiltres = computed(() => new Set(tracteursFiltres.value.map(t => t.id)))

// ── Sélection ──────────────────────────────────────────────────────
const selectedId = ref<string | null>(null)
const selectedTruck = computed(() =>
  selectedId.value ? tracteurs.value.find(t => t.id === selectedId.value) ?? null : null
)

function selectTruck(id: string) {
  selectedId.value = selectedId.value === id ? null : id
  const pos = simPositions.value[id] ?? tracteurs.value.find(t => t.id === id)?.position
  if (pos && mapInstance) {
    mapInstance.setView([pos.lat, pos.lng], 11, { animate: true, duration: 0.8 })
    markers[id]?.openPopup()
  }
}

/* ═══════════════════════════════════════════════════════════════════
   AJOUT 3 - Voyage en cours du véhicule sélectionné
   ═══════════════════════════════════════════════════════════════════ */
const voyagesEnCours = computed(() =>
  voyagesStore.voyages.filter(v => v.statut === 'en_cours' || v.statut === 'litige'),
)

const voyageDe = (vehiculeId: string) =>
  voyagesEnCours.value.find(v => v.vehiculeId === vehiculeId)

const voyageSelectionne = computed(() =>
  selectedId.value ? voyageDe(selectedId.value) : undefined,
)

const nbFranchis = computed(() =>
  voyageSelectionne.value?.etapes.filter(e => e.franchi).length ?? 0,
)

/* ═══════════════════════════════════════════════════════════════════
   AJOUT 4 - Alertes et bouton flottant
   Les alertes ne dépendent PAS du clic : elles restent toujours
   accessibles, et un triangle les signale dans la liste.
   ═══════════════════════════════════════════════════════════════════ */
const alertesOuvertes = ref(false)

interface AlerteCarte {
  id: string
  vehiculeId?: string
  titre: string
  detail: string
  aFaire: string
  gravite: 'critique' | 'majeur'
  icone: unknown
  action: () => void
}

const alertes = computed<AlerteCarte[]>(() => {
  const out: AlerteCarte[] = []

  ecartsStore.aQualifier.forEach(e => {
    const veh = tracteurs.value.find(v => v.plaque === e.vehiculePlaque)
    out.push({
      id: e.id,
      vehiculeId: veh?.id,
      titre: `${LIB_TYPE_ECART[e.type]} - ${e.vehiculePlaque}`,
      detail: `${e.voyageRef} · ${e.lieu ?? ''} · ${fmtDuree(e.dureeMin)}`,
      aFaire: 'Qualifier l\u2019écart →',
      gravite: e.gravite === 'critique' ? 'critique' : 'majeur',
      icone: e.type === 'arret_non_planifie' ? Octagon : AlertTriangle,
      action: () => { void router.push({ name: 'fleet-ecart-detail', params: { id: e.id } }) },
    })
  })

  carburantStore.anomalies.forEach(r => {
    out.push({
      id: r.id,
      vehiculeId: r.vehiculeId,
      titre: `Recharge en anomalie - ${r.vehiculePlaque}`,
      detail: `${r.lieu} · ${r.controles.filter(c => !c.ok).length} contrôle(s) en échec`,
      aFaire: 'Ouvrir le dossier carburant →',
      gravite: 'majeur',
      icone: Fuel,
      action: () => { void router.push({ name: 'fleet-carburant', query: { recharge: r.id } }) },
    })
  })

  return out
})

const alertesDuVehicule = (vehiculeId: string) =>
  alertes.value.filter(a => a.vehiculeId === vehiculeId)

// ── Simulation ────────────────────────────────────────────────────
// Routes Madagascar : chaque camion "en_mouvement" suit des waypoints
const ROUTES: Record<string, Array<{ lat: number; lng: number }>> = {
  'TRC-001': [
    { lat: -18.8792, lng: 47.5079 },  // Antananarivo
    { lat: -18.9333, lng: 48.2000 },  // Vers Moramanga
    { lat: -18.5500, lng: 48.4000 },  // Moramanga
    { lat: -18.1492, lng: 49.4023 },  // Toamasina
    { lat: -18.8792, lng: 47.5079 },  // Retour
  ],
  'TRC-004': [
    { lat: -19.8667, lng: 47.0333 },  // Antsirabe
    { lat: -19.3000, lng: 47.2000 },
    { lat: -18.8792, lng: 47.5079 },  // Antananarivo
    { lat: -17.5000, lng: 47.1000 },
    { lat: -15.7167, lng: 46.3167 },  // Majunga
    { lat: -19.8667, lng: 47.0333 },  // Retour
  ],
}

// Fallback pour tous les autres camions en mouvement
const DEFAULT_ROUTE = [
  { lat: -18.8792, lng: 47.5079 },
  { lat: -18.5500, lng: 48.4000 },
  { lat: -18.1492, lng: 49.4023 },
  { lat: -19.0167, lng: 47.5333 },
  { lat: -18.8792, lng: 47.5079 },
]

// Positions simulées (lat/lng courant + vitesse)
type SimPos = { lat: number; lng: number; vitesse: number; waypointIdx: number; progress: number }
const simPositions = ref<Record<string, SimPos>>({})
const simRunning   = ref(false)
const tick         = ref(0)

let simTimer: ReturnType<typeof setInterval> | null = null

function initSimPositions() {
  tracteurs.value.forEach(t => {
    if (!t.position) return
    const route = ROUTES[t.id] ?? DEFAULT_ROUTE
    simPositions.value[t.id] = {
      lat: t.position.lat,
      lng: t.position.lng,
      vitesse: t.position.vitesse ?? 0,
      waypointIdx: 0,
      progress: 0,
    }
  })
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function advanceTruck(id: string, step = 0.04) {
  const t = tracteurs.value.find(x => x.id === id)
  if (!t || t.statutOp !== 'en_mouvement') return
  const route = ROUTES[id] ?? DEFAULT_ROUTE
  const sim   = simPositions.value[id]
  if (!sim) return

  sim.progress += step
  if (sim.progress >= 1) {
    sim.progress = 0
    sim.waypointIdx = (sim.waypointIdx + 1) % (route.length - 1)
  }
  const from = route[sim.waypointIdx]!
  const to   = route[(sim.waypointIdx + 1) % route.length]!
  sim.lat = lerp(from.lat, to.lat, sim.progress)
  sim.lng = lerp(from.lng, to.lng, sim.progress)

  // Vitesse simulée oscillante
  sim.vitesse = Math.round(40 + Math.sin(sim.progress * Math.PI * 4) * 20)
}

function toggleSimulation() {
  if (simRunning.value) {
    stopSimulation()
  } else {
    startSimulation()
  }
}

function startSimulation() {
  simRunning.value = true
  tick.value = 0
  simTimer = setInterval(() => {
    tick.value++
    tracteurs.value.forEach(t => advanceTruck(t.id))
    updateMarkers()
  }, 1500)
}

function stopSimulation() {
  simRunning.value = false
  if (simTimer) { clearInterval(simTimer); simTimer = null }
}

// ── Leaflet ────────────────────────────────────────────────────────
function truckIcon(t: Vehicule) {
  const color   = statusColor(t.statutOp)
  const isMoving = t.statutOp === 'en_mouvement'
  const pulse   = isMoving ? `<div style="position:absolute;top:-4px;left:-4px;width:30px;height:30px;border-radius:50%;background:${color};opacity:0.2;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></div>` : ''
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:22px;height:22px">
        ${pulse}
        <div style="position:absolute;inset:0;background:${color};border-radius:50%;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center">
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        </div>
      </div>
      <style>@keyframes ping{75%,100%{transform:scale(1.8);opacity:0}}</style>`,
    iconSize:   [22, 22],
    iconAnchor: [11, 11],
    popupAnchor:[0, -14],
  })
}

function popupHtml(t: Vehicule) {
  const pos = simPositions.value[t.id]
  const vitesse = pos?.vitesse ?? t.position?.vitesse ?? 0
  return `
    <div style="min-width:170px;font-family:system-ui,sans-serif;padding:2px">
      <div style="font-weight:700;font-size:13px;color:#0f172a;margin-bottom:6px">${t.id} · <span style="font-family:monospace">${t.plaque}</span></div>
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px">
        <span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;background:${statusColor(t.statutOp)}22;color:${statusColor(t.statutOp)}">${statusLabel(t.statutOp)}</span>
        ${t.statutOp === 'en_mouvement' ? `<span style="font-size:11px;color:#16a34a;font-weight:600">${vitesse} km/h</span>` : ''}
      </div>
      <div style="font-size:11px;color:#475569">${t.marque} ${t.modele}</div>
      ${t.chauffeurNom ? `<div style="font-size:11px;color:#64748b;margin-top:2px">👤 ${t.chauffeurNom}</div>` : ''}
      ${t.niveauCarburant !== undefined ? `<div style="font-size:11px;color:#64748b;margin-top:2px">⛽ Carburant : ${t.niveauCarburant}%</div>` : ''}
    </div>`
}

async function initMap() {
  if (!mapContainer.value) return
  L = (await import('leaflet')).default
  await import('leaflet/dist/leaflet.css')

  delete (L.Icon.Default.prototype as any)._getIconUrl

  mapInstance = L.map(mapContainer.value, { zoomControl: true }).setView([-18.8792, 47.5079], 7)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(mapInstance)

  initSimPositions()
  placeAllMarkers()
}

function placeAllMarkers() {
  if (!mapInstance) return
  tracteurs.value.forEach(t => {
    const pos = simPositions.value[t.id] ?? t.position
    if (!pos) return
    const m = L.marker([pos.lat, pos.lng], { icon: truckIcon(t) })
      .addTo(mapInstance)
      .bindPopup(popupHtml(t))
    m.on('click', () => { selectedId.value = t.id })
    markers[t.id] = m
  })
}

/** Masque sur la carte les camions écartés par la recherche, sans les détruire. */
function appliquerFiltreCarte() {
  if (!mapInstance) return
  tracteurs.value.forEach(t => {
    const m = markers[t.id]
    if (!m) return
    const visible = idsFiltres.value.has(t.id)
    const el = m.getElement?.()
    if (el) {
      el.style.display = visible ? '' : 'none'
    } else if (visible) {
      m.addTo(mapInstance)
    }
  })
}

watch(idsFiltres, () => appliquerFiltreCarte())

function updateMarkers() {
  if (!mapInstance) return
  tracteurs.value.forEach(t => {
    const pos = simPositions.value[t.id]
    if (!pos || !markers[t.id]) return
    markers[t.id].setLatLng([pos.lat, pos.lng])
    markers[t.id].setIcon(truckIcon(t))
    // Le remplacement d'icône recrée l'élément : on réapplique le masquage
    const el = markers[t.id].getElement?.()
    if (el) el.style.display = idsFiltres.value.has(t.id) ? '' : 'none'
    if (markers[t.id].isPopupOpen()) {
      markers[t.id].setPopupContent(popupHtml(t))
    }
    // Centrer sur le sélectionné
    if (selectedId.value === t.id) {
      mapInstance.panTo([pos.lat, pos.lng], { animate: true, duration: 0.5 })
    }
  })
}

// Recalibrer la carte au redimensionnement
watch(mapContainer, () => { mapInstance?.invalidateSize() })

onMounted(() => initMap())
onUnmounted(() => {
  stopSimulation()
  mapInstance?.remove()
  mapInstance = null
})
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active { transition: opacity 0.2s, transform 0.2s; }
.slide-down-enter-from,
.slide-down-leave-to    { opacity: 0; transform: translateX(-50%) translateY(-10px); }

/* ═══ AJOUT : transitions du panneau voyage et du bouton flottant ═══ */
.slide-left-enter-active,
.slide-left-leave-active { transition: opacity .2s, transform .2s; }
.slide-left-enter-from,
.slide-left-leave-to     { opacity: 0; transform: translateX(-12px); }

.fab-enter-active,
.fab-leave-active { transition: opacity .18s ease, transform .18s ease; }
.fab-enter-from,
.fab-leave-to     { opacity: 0; transform: translateY(8px) scale(.97); }
</style>