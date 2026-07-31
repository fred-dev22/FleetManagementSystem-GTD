<template>
  <div class="px-7 py-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Tableau de bord Flotte</h1>
        <p class="text-sm text-muted-foreground mt-1">{{ formattedDate }}</p>
      </div>
      <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium">
        <Activity class="w-4 h-4" />
        Temps réel
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted-foreground font-medium">Tracteurs actifs</p>
            <p class="text-3xl font-bold text-foreground mt-1">{{ kpis.tracteurs }}</p>
            <p class="text-xs text-muted-foreground mt-1">sur {{ kpis.tracteursTotal }} au total</p>
          </div>
          <div class="p-2.5 rounded-lg bg-primary/10">
            <Truck class="w-5 h-5 text-primary" />
          </div>
        </div>
        <div class="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            class="h-full rounded-full bg-primary transition-all"
            :style="{ width: `${(kpis.tracteurs / kpis.tracteursTotal) * 100}%` }"
          />
        </div>
      </div>

      <div class="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted-foreground font-medium">Remorques actives</p>
            <p class="text-3xl font-bold text-foreground mt-1">{{ kpis.remorques }}</p>
            <p class="text-xs text-muted-foreground mt-1">sur {{ kpis.remorquesTotal }} au total</p>
          </div>
          <div class="p-2.5 rounded-lg bg-blue-500/10">
            <Truck class="w-5 h-5 text-blue-500" />
          </div>
        </div>
        <div class="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            class="h-full rounded-full bg-blue-500 transition-all"
            :style="{ width: `${(kpis.remorques / kpis.remorquesTotal) * 100}%` }"
          />
        </div>
      </div>

      <div class="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted-foreground font-medium">Chauffeurs disponibles</p>
            <p class="text-3xl font-bold text-foreground mt-1">{{ kpis.chauffeurs }}</p>
            <p class="text-xs text-muted-foreground mt-1">sur {{ kpis.chauffeursTotal }} au total</p>
          </div>
          <div class="p-2.5 rounded-lg bg-emerald-500/10">
            <Users class="w-5 h-5 text-emerald-500" />
          </div>
        </div>
        <div class="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            class="h-full rounded-full bg-emerald-500 transition-all"
            :style="{ width: `${(kpis.chauffeurs / kpis.chauffeursTotal) * 100}%` }"
          />
        </div>
      </div>

      <div class="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted-foreground font-medium">Alertes documents</p>
            <p class="text-3xl font-bold text-destructive mt-1">{{ kpis.alertes }}</p>
            <p class="text-xs text-muted-foreground mt-1">nécessitent attention</p>
          </div>
          <div class="p-2.5 rounded-lg bg-destructive/10">
            <FileWarning class="w-5 h-5 text-destructive" />
          </div>
        </div>
        <div class="mt-3 flex items-center gap-1.5">
          <span class="inline-flex items-center gap-1 text-xs font-medium text-destructive">
            <AlertTriangle class="w-3 h-3" />
            {{ kpis.alertesCritiques }} critiques
          </span>
          <span class="text-muted-foreground text-xs">·</span>
          <span class="text-xs text-muted-foreground">{{ kpis.alertes - kpis.alertesCritiques }} avertissements</span>
        </div>
      </div>
    </div>

    <!-- Operational Status -->
    <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div class="flex items-center gap-2 mb-4">
        <Activity class="w-4 h-4 text-primary" />
        <h2 class="font-semibold text-foreground">Statut opérationnel</h2>
      </div>
      <div class="flex flex-wrap gap-3">
        <div
          v-for="status in operationalStatus"
          :key="status.label"
          class="flex items-center gap-2 px-4 py-2.5 rounded-full border font-medium text-sm cursor-default select-none transition-colors"
          :class="status.classes"
        >
          <Circle class="w-2.5 h-2.5 fill-current" />
          <span>{{ status.label }}</span>
          <span
            class="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
            :class="status.badgeClasses"
          >{{ status.count }}</span>
        </div>
      </div>
    </div>

    <!-- Bottom Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <!-- Dernières alertes -->
      <div class="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <AlertTriangle class="w-4 h-4 text-destructive" />
            <h2 class="font-semibold text-foreground">Dernières alertes</h2>
          </div>
          <span class="text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted">{{ alerts.length }} alertes</span>
        </div>
        <div class="space-y-3">
          <div
            v-for="alert in alerts"
            :key="alert.id"
            class="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <div
              class="mt-0.5 w-2 h-2 rounded-full flex-shrink-0"
              :class="alert.severity === 'critical' ? 'bg-destructive' : alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-medium text-foreground truncate">{{ alert.vehicle }}</p>
                <span
                  class="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                  :class="
                    alert.severity === 'critical'
                      ? 'bg-destructive/10 text-destructive'
                      : alert.severity === 'warning'
                      ? 'bg-amber-500/10 text-amber-600'
                      : 'bg-blue-500/10 text-blue-600'
                  "
                >
                  {{ alert.severityLabel }}
                </span>
              </div>
              <p class="text-xs text-muted-foreground mt-0.5">{{ alert.document }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">Expire: <span class="font-medium">{{ alert.expiry }}</span></p>
            </div>
          </div>
        </div>
      </div>

      <!-- Véhicules récents -->
      <div class="lg:col-span-3 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <MapPin class="w-4 h-4 text-primary" />
            <h2 class="font-semibold text-foreground">Véhicules récents</h2>
          </div>
          <button class="text-xs text-primary hover:underline font-medium">Voir tout</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-3 pr-4">ID</th>
                <th class="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-3 pr-4">Plaque</th>
                <th class="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-3 pr-4">Chauffeur</th>
                <th class="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-3 pr-4">Statut</th>
                <th class="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-3">Dernière position</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr
                v-for="vehicle in recentVehicles"
                :key="vehicle.id"
                class="hover:bg-muted/40 transition-colors"
              >
                <td class="py-3 pr-4">
                  <span class="font-mono text-xs font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {{ vehicle.id }}
                  </span>
                </td>
                <td class="py-3 pr-4">
                  <span class="font-semibold text-foreground">{{ vehicle.plate }}</span>
                </td>
                <td class="py-3 pr-4">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {{ vehicle.driver.charAt(0) }}
                    </div>
                    <span class="text-foreground truncate max-w-[100px]">{{ vehicle.driver }}</span>
                  </div>
                </td>
                <td class="py-3 pr-4">
                  <span
                    class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                    :class="vehicleStatusClasses(vehicle.status)"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-current" />
                    {{ vehicle.statusLabel }}
                  </span>
                </td>
                <td class="py-3">
                  <div class="flex items-center gap-1 text-muted-foreground">
                    <MapPin class="w-3 h-3 flex-shrink-0" />
                    <span class="text-xs truncate max-w-[120px]">{{ vehicle.lastPosition }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Truck, AlertTriangle, Users, FileWarning, MapPin, Activity, Circle } from 'lucide-vue-next'

// --- Formatted date ---
const formattedDate = computed(() => {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

// --- KPI Mock Data ---
const kpis = {
  tracteurs: 34,
  tracteursTotal: 40,
  remorques: 28,
  remorquesTotal: 35,
  chauffeurs: 19,
  chauffeursTotal: 42,
  alertes: 11,
  alertesCritiques: 4,
}

// --- Operational Status ---
const operationalStatus = [
  {
    label: 'En mouvement',
    count: 21,
    classes: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
    badgeClasses: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  },
  {
    label: 'Allumé / Immobile',
    count: 8,
    classes: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
    badgeClasses: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
  },
  {
    label: 'Arrêté',
    count: 7,
    classes: 'bg-muted border-border text-muted-foreground',
    badgeClasses: 'bg-border text-muted-foreground',
  },
  {
    label: 'Signal perdu',
    count: 3,
    classes: 'bg-destructive/10 border-destructive/30 text-destructive',
    badgeClasses: 'bg-destructive/20 text-destructive',
  },
]

// --- Alerts Mock Data ---
interface Alert {
  id: number
  vehicle: string
  document: string
  expiry: string
  severity: 'critical' | 'warning' | 'info'
  severityLabel: string
}

const alerts: Alert[] = [
  { id: 1, vehicle: 'TGT-7821', document: 'Assurance véhicule', expiry: '30 juin 2026', severity: 'critical', severityLabel: 'Critique' },
  { id: 2, vehicle: 'GTD-4412', document: 'Contrôle technique', expiry: '05 juil. 2026', severity: 'critical', severityLabel: 'Critique' },
  { id: 3, vehicle: 'REM-2201', document: 'Permis de circuler', expiry: '12 juil. 2026', severity: 'critical', severityLabel: 'Critique' },
  { id: 4, vehicle: 'TGT-9903', document: 'Carte grise', expiry: '18 juil. 2026', severity: 'critical', severityLabel: 'Critique' },
  { id: 5, vehicle: 'GTD-1150', document: 'Visite médicale chauffeur', expiry: '25 juil. 2026', severity: 'warning', severityLabel: 'Avertissement' },
  { id: 6, vehicle: 'REM-3340', document: 'Assurance remorque', expiry: '01 août 2026', severity: 'warning', severityLabel: 'Avertissement' },
  { id: 7, vehicle: 'TGT-0087', document: 'Taxe routière', expiry: '10 août 2026', severity: 'info', severityLabel: 'Info' },
]

// --- Recent Vehicles Mock Data ---
interface Vehicle {
  id: string
  plate: string
  driver: string
  status: 'moving' | 'idle' | 'stopped' | 'lost'
  statusLabel: string
  lastPosition: string
}

const recentVehicles: Vehicle[] = [
  { id: 'T-001', plate: '1234 TAN', driver: 'Thierry Randriamanga', status: 'moving',  statusLabel: 'En mouvement', lastPosition: 'Antananarivo, Madagascar' },
  { id: 'T-002', plate: '2345 TNR', driver: 'Fiona Mungroo',        status: 'idle',    statusLabel: 'Immobile',      lastPosition: 'Toamasina, Madagascar' },
  { id: 'T-003', plate: '3456 MJN', driver: 'Nadia Oozeer',         status: 'stopped', statusLabel: 'Arrêté',        lastPosition: 'Mahajanga, Madagascar' },
  { id: 'T-004', plate: '4567 FIA', driver: 'Jean-Luc Rakoto',      status: 'moving',  statusLabel: 'En mouvement', lastPosition: 'Fianarantsoa, Madagascar' },
  { id: 'T-005', plate: '5678 TAN', driver: 'Marc Razafy',          status: 'lost',    statusLabel: 'Signal perdu',  lastPosition: 'Dernière: Toliara, Madagascar' },
  { id: 'T-006', plate: '6789 TNR', driver: 'Hery Andrianaivo',     status: 'moving',  statusLabel: 'En mouvement', lastPosition: 'Tamatave, Madagascar' },
]

function vehicleStatusClasses(status: Vehicle['status']): string {
  switch (status) {
    case 'moving':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
    case 'idle':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
    case 'stopped':
      return 'bg-muted text-muted-foreground'
    case 'lost':
      return 'bg-destructive/10 text-destructive'
    default:
      return 'bg-muted text-muted-foreground'
  }
}
</script>
