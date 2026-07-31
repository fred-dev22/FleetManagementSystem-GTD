<template>
  <div class="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-3.5 items-start">

    <!-- ══ VOLET GAUCHE — composition de la séquence ══════════ -->
    <div class="flex flex-col gap-3">

      <!-- Trajet de référence -->
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h3 :class="L.cardTitle"><Bookmark class="w-4 h-4 text-primary" /> Trajet de référence</h3>
        </div>
        <select v-model="trajetRef" :class="F.fieldSelect" @change="chargerTrajet">
          <option value="">Composer un trajet ponctuel…</option>
          <option v-for="t in trajetsStore.recurrents" :key="t.id" :value="t.id">
            {{ t.libelle }}
          </option>
        </select>
        <p class="text-[11px] text-muted-foreground mt-1.5 leading-snug">
          Charger un trajet enregistré en copie ses étapes, que vous pouvez ensuite ajuster
          sans modifier le trajet d’origine.
        </p>
      </div>

      <!-- Séquence composée -->
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h3 :class="L.cardTitle"><ListOrdered class="w-4 h-4 text-primary" /> Séquence</h3>
          <span class="text-[11px] text-muted-foreground">{{ etapes.length }} site(s)</span>
        </div>

        <div v-if="!etapes.length" class="text-xs text-muted-foreground py-4 text-center">
          Ajoutez des sites depuis la liste ci-dessous.
        </div>

        <ul v-else class="flex flex-col gap-1.5">
          <li
            v-for="(e, i) in etapes"
            :key="e.id"
            draggable="true"
            class="flex items-start gap-2 rounded-md border px-2 py-1.5 bg-card cursor-grab transition-colors"
            :class="dragIndex === i ? 'border-primary bg-primary/5 opacity-60' : 'border-border hover:bg-background'"
            @dragstart="dragIndex = i"
            @dragover.prevent="survol(i)"
            @dragend="dragIndex = null"
          >
            <GripVertical class="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <span
              class="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 text-white"
              :style="{ backgroundColor: COULEUR_ROLE[e.role] }"
            >{{ i + 1 }}</span>

            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-foreground truncate">{{ e.siteNom }}</p>
              <div class="flex items-center gap-1.5 mt-0.5">
                <select
                  v-model="e.role"
                  class="text-[10px] border border-border rounded px-1 py-0.5 bg-card text-muted-foreground"
                  @change="emettre"
                >
                  <option v-for="(lib, k) in LIB_ROLE_ETAPE" :key="k" :value="k">{{ lib }}</option>
                </select>
                <input
                  v-model.number="e.intervalleMin"
                  type="number" min="0" placeholder="min"
                  class="w-14 text-[10px] border border-border rounded px-1 py-0.5 bg-card"
                  title="Durée prévue depuis l’étape précédente (minutes)"
                  @change="emettre"
                />
                <input
                  v-if="e.role === 'repos'"
                  v-model.number="e.pausePrevueMin"
                  type="number" min="0" placeholder="pause"
                  class="w-14 text-[10px] border border-border rounded px-1 py-0.5 bg-card"
                  title="Pause programmée (minutes)"
                  @change="emettre"
                />
              </div>
            </div>

            <button
              class="shrink-0 text-muted-foreground hover:text-danger bg-transparent border-0 cursor-pointer p-0.5"
              title="Retirer ce site"
              @click="retirer(i)"
            ><X class="w-3.5 h-3.5" /></button>
          </li>
        </ul>

        <div v-if="etapes.length" class="flex items-center justify-between mt-2.5 pt-2.5 border-t border-border text-[11px]">
          <span class="text-muted-foreground">Distance simulée</span>
          <span class="font-semibold text-foreground">{{ distance }} km · {{ fmtDuree(duree) }}</span>
        </div>
      </div>

      <!-- Sites disponibles -->
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h3 :class="L.cardTitle"><MapPin class="w-4 h-4 text-primary" /> Sites disponibles</h3>
        </div>
        <div :class="L.searchBox" class="mb-2">
          <Search class="w-3.5 h-3.5 text-muted-foreground" />
          <input v-model="q" :class="L.searchInput" placeholder="Rechercher un site…" />
        </div>
        <ul class="flex flex-col gap-1 max-h-[240px] overflow-y-auto">
          <li v-for="s in sitesFiltres" :key="s.id">
            <button
              class="w-full text-left flex items-center gap-2 rounded-md px-2 py-1.5 bg-transparent border-0 cursor-pointer hover:bg-background transition-colors"
              @click="ajouter(s)"
            >
              <Plus class="w-3.5 h-3.5 text-primary shrink-0" />
              <span class="flex-1 min-w-0">
                <span class="text-xs text-foreground block truncate">{{ s.nom }}</span>
                <span class="text-[10px] text-muted-foreground">{{ s.code }} · {{ s.ville }}</span>
              </span>
            </button>
          </li>
          <li v-if="!sitesFiltres.length" class="text-xs text-muted-foreground py-2 text-center">
            Aucun site correspondant.
          </li>
        </ul>
      </div>
    </div>

    <!-- ══ VOLET DROIT — simulation cartographique ════════════ -->
    <div :class="L.card">
      <div :class="L.cardHeader">
        <h3 :class="L.cardTitle"><Route class="w-4 h-4 text-primary" /> Itinéraire proposé</h3>
        <span class="text-[11px] text-muted-foreground">Simulation — non enregistrée</span>
      </div>

      <FleetMap
        :trace-prevu="trace"
        :markers="marqueurs"
        height="480px"
        :show-legend="false"
      />

      <p class="text-[11px] text-muted-foreground mt-2 leading-relaxed">
        Le tracé suit exactement l’ordre des sites sélectionnés. Il n’est pas enregistré :
        seule la séquence de sites est conservée, parce que c’est elle que la télématique
        peut vérifier.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Sélecteur interactif de trajet.
 *
 * Décision de séance : à gauche les sites et leur ordre, à droite la carte qui
 * trace la proposition en direct. Le glisser-déposer réordonne la séquence et
 * la carte se met à jour immédiatement. Le tracé n'est jamais persisté.
 */
import { ref, computed, watch } from 'vue'
import {
  Bookmark, ListOrdered, MapPin, Route, Plus, X, Search, GripVertical,
} from 'lucide-vue-next'
import FleetMap from './FleetMap.vue'
import { useTrajetsStore } from '../../stores/trajets'
import { useSitesStore } from '../../stores/sites'
import { LIB_ROLE_ETAPE } from '../../types/fms'
import type { EtapeTrajet, RoleEtape, LatLng, MapMarker } from '../../types/fms'
import { fmtDuree } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'
import * as F from '../../lib/formClasses'

const props = defineProps<{ modelValue?: EtapeTrajet[] }>()
const emit = defineEmits<{
  'update:modelValue': [etapes: EtapeTrajet[]]
  'trajet-ref': [id: string]
}>()

const trajetsStore = useTrajetsStore()
const sitesStore = useSitesStore()

const COULEUR_ROLE: Record<RoleEtape, string> = {
  depart:     '#0B4480',
  chargement: '#0072C5',
  livraison:  '#16a34a',
  controle:   '#6b7280',
  repos:      '#ca8a04',
  arrivee:    '#0B4480',
}

const etapes = ref<EtapeTrajet[]>([...(props.modelValue ?? [])])
const trajetRef = ref('')
const q = ref('')
const dragIndex = ref<number | null>(null)

watch(() => props.modelValue, v => {
  if (v && JSON.stringify(v) !== JSON.stringify(etapes.value)) etapes.value = [...v]
})

/* ── Sites disponibles ─────────────────────────────────────── */
const sitesFiltres = computed(() => {
  const s = q.value.toLowerCase()
  return sitesStore.sites
    .filter(x => x.actif && x.latitude != null && x.longitude != null)
    .filter(x => !s || `${x.nom} ${x.code} ${x.ville}`.toLowerCase().includes(s))
})

/* ── Simulation ────────────────────────────────────────────── */
const trace = computed<LatLng[]>(() =>
  etapes.value.map(e => ({ lat: e.lat, lng: e.lng })))

const marqueurs = computed<MapMarker[]>(() =>
  etapes.value.map((e, i) => ({
    id: e.id,
    lat: e.lat,
    lng: e.lng,
    label: `${i + 1}. ${e.siteNom}`,
    sublabel: LIB_ROLE_ETAPE[e.role],
    color: COULEUR_ROLE[e.role],
  })))

const distance = computed(() => trajetsStore.distanceSimulee(etapes.value))
const duree = computed(() => trajetsStore.dureeSimulee(etapes.value))

/* ── Actions ───────────────────────────────────────────────── */
function emettre() {
  etapes.value = trajetsStore.renumeroter(etapes.value)
  emit('update:modelValue', etapes.value)
}

function ajouter(site: { id: string; nom: string; latitude?: number; longitude?: number }) {
  if (site.latitude == null || site.longitude == null) return
  const role: RoleEtape = etapes.value.length === 0 ? 'depart' : 'livraison'
  etapes.value.push(trajetsStore.nouvelleEtape(
    { id: site.id, nom: site.nom, latitude: site.latitude, longitude: site.longitude },
    etapes.value.length + 1,
    role,
  ))
  emettre()
}

function retirer(i: number) {
  etapes.value.splice(i, 1)
  emettre()
}

/** Réordonnancement par glisser-déposer : la carte suit immédiatement. */
function survol(i: number) {
  const from = dragIndex.value
  if (from === null || from === i) return
  const item = etapes.value[from]
  if (!item) return
  etapes.value.splice(from, 1)
  etapes.value.splice(i, 0, item)
  dragIndex.value = i
  emettre()
}

function chargerTrajet() {
  if (!trajetRef.value) {
    emit('trajet-ref', '')
    return
  }
  const t = trajetsStore.getById(trajetRef.value)
  if (!t) return
  // COPIE des étapes : modifier ce voyage ne doit pas altérer le trajet de référence
  etapes.value = t.etapes.map(e => ({ ...e, id: `${e.id}-c${Date.now()}` }))
  emit('trajet-ref', t.id)
  emettre()
}
</script>
