<template>
  <div :class="L.pagePadding">
    <div :class="L.pageHeader">
      <div>
        <h1 :class="L.pageTitle">Carburant</h1>
        <p :class="L.pageSub">
          Méthode plein-à-plein — aucun capteur requis · {{ store.anomalies.length }} recharge(s) en anomalie
        </p>
      </div>
      <button :class="L.btnOutline"><Upload class="w-4 h-4" /> Importer un relevé</button>
    </div>

    <!-- ══ KPI ═══════════════════════════════════════════════ -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5">
      <div v-for="k in kpis" :key="k.label"
        class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" :class="k.bg">
          <component :is="k.icon" class="w-4.5 h-4.5" :class="k.iconColor" />
        </div>
        <div class="min-w-0">
          <p class="text-xl font-bold leading-none truncate">{{ k.value }}</p>
          <p class="text-xs text-gray-500 mt-0.5">{{ k.label }}</p>
        </div>
      </div>
    </div>

    <!-- Rappel méthodologique : deux indicateurs distincts -->
    <div class="flex items-start gap-2.5 bg-info-bg text-info rounded-lg px-3.5 py-2.5 mb-3.5">
      <Info class="w-4 h-4 shrink-0 mt-px" />
      <p class="text-xs leading-relaxed">
        Deux indicateurs distincts : les <strong>litres délivrés</strong> sont une donnée exacte, restituable au jour,
        à la semaine ou au mois ; la <strong>consommation aux 100 km</strong> se calcule entre deux pleins complets —
        seule méthode fiable sans capteur de niveau.
      </p>
    </div>

    <div class="flex gap-1 border-b border-border mb-3.5">
      <button v-for="t in tabs" :key="t.key" @click="tab = t.key"
        class="px-3.5 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors cursor-pointer bg-transparent"
        :class="tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'">
        {{ t.label }}
        <span v-if="t.badge" class="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-danger-bg text-danger">{{ t.badge }}</span>
      </button>
    </div>

    <!-- ══ REGISTRE DES RECHARGES ════════════════════════════ -->
    <div v-if="tab === 'recharges'" class="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-3.5 items-start">
      <div :class="L.tableCard">
        <div :class="L.toolbar">
          <div :class="L.searchBox">
            <Search class="w-3.5 h-3.5 text-muted-foreground" />
            <input v-model="q" :class="L.searchInput" placeholder="Plaque, chauffeur, lieu…" />
          </div>
          <select v-model="filtreStatut" :class="L.fpSelect" class="w-40">
            <option value="">Toutes</option>
            <option value="valide">Conformes</option>
            <option value="anomalie">En anomalie</option>
            <option value="qualifie">Qualifiées</option>
          </select>
        </div>

        <table :class="L.table">
          <thead><tr>
            <th :class="L.th" class="cursor-default">Date</th>
            <th :class="L.th" class="cursor-default">Véhicule</th>
            <th :class="L.th" class="cursor-default">Bons</th>
          <th :class="L.th" class="cursor-default">Litres</th>
            <th :class="L.th" class="cursor-default">Montant</th>
            <th :class="L.th" class="cursor-default">Canal</th>
            <th :class="L.th" class="cursor-default">Contrôles</th>
          </tr></thead>
          <tbody>
            <tr v-for="r in rechargesFiltrees" :key="r.id" :class="L.rowHover" class="cursor-pointer"
              :style="selectedId === r.id ? 'background:rgb(0 114 197 / .08)' : ''"
              @click="selectedId = r.id">
              <td :class="L.td"><span class="text-xs">{{ fmtDateTime(r.date) }}</span></td>
              <td :class="L.td">
                <span class="font-mono text-xs font-medium">{{ r.vehiculePlaque }}</span>
                <div class="text-[11px] text-muted-foreground">{{ r.chauffeurNom ?? '—' }}</div>
              </td>
              <td :class="L.td">
                <span class="text-xs font-medium">{{ fmtL(r.litres) }}</span>
                <div v-if="r.pleinComplet" class="text-[10px] text-primary">plein complet</div>
              </td>
              <td :class="L.td"><span class="text-xs">{{ fmtAr(r.montant) }}</span></td>
              <td :class="L.td"><span class="text-[11px] text-muted-foreground">{{ LIB_CANAL[r.canal] }}</span></td>
              <td :class="L.td">
                <span v-if="r.statut === 'valide'" class="text-[11px] px-2 py-0.5 rounded-full bg-success-bg text-success">Conforme</span>
                <span v-else-if="r.statut === 'qualifie'" class="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Qualifiée</span>
                <span v-else class="text-[11px] px-2 py-0.5 rounded-full bg-danger-bg text-danger">
                  {{ r.controles.filter(c => !c.ok).length }} anomalie(s)
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── Fiche de recharge ── -->
      <div v-if="recharge" :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle"><Fuel class="w-4 h-4 text-primary" /> Fiche de recharge</h2>
          <span class="font-mono text-[11px] text-muted-foreground">{{ recharge.id }}</span>
        </div>

        <dl class="grid grid-cols-2 gap-x-3 gap-y-2 text-xs mb-3">
          <div><dt class="text-muted-foreground text-[11px]">Véhicule</dt><dd class="font-mono">{{ recharge.vehiculePlaque }}</dd></div>
          <div><dt class="text-muted-foreground text-[11px]">Chauffeur</dt><dd>{{ recharge.chauffeurNom ?? '—' }}</dd></div>
          <div><dt class="text-muted-foreground text-[11px]">Litres</dt><dd class="font-medium">{{ fmtL(recharge.litres) }}</dd></div>
          <div><dt class="text-muted-foreground text-[11px]">Montant</dt><dd>{{ fmtAr(recharge.montant) }}</dd></div>
          <div><dt class="text-muted-foreground text-[11px]">Odomètre</dt><dd>{{ recharge.odometre.toLocaleString('fr-FR') }} km</dd></div>
          <div><dt class="text-muted-foreground text-[11px]">Canal</dt><dd>{{ LIB_CANAL[recharge.canal] }}</dd></div>
          <div class="col-span-2"><dt class="text-muted-foreground text-[11px]">Lieu déclaré</dt><dd>{{ recharge.lieu }}</dd></div>
        </dl>

        <!-- Contrôles de vraisemblance -->
        <p class="text-[11px] font-semibold text-foreground mb-1.5">Contrôles de vraisemblance</p>
        <ul class="flex flex-col gap-1.5 mb-3">
          <li v-for="c in recharge.controles" :key="c.code"
            class="flex items-start gap-2 rounded-md px-2 py-1.5"
            :class="c.ok ? 'bg-background' : 'bg-danger-bg'">
            <component :is="c.ok ? CheckCircle2 : XCircle" class="w-3.5 h-3.5 shrink-0 mt-px"
              :class="c.ok ? 'text-success' : 'text-danger'" />
            <div class="min-w-0">
              <p class="text-[11px] font-medium" :class="c.ok ? 'text-foreground' : 'text-danger'">{{ c.libelle }}</p>
              <p class="text-[11px] text-muted-foreground">{{ c.detail }}</p>
            </div>
          </li>
        </ul>

        <!-- Croisement position : la carte qui fait la démonstration -->
        <template v-if="recharge.positionVehicule && recharge.positionVehicule.ecartKm > 2">
          <p class="text-[11px] font-semibold text-danger mb-1.5">
            Position du véhicule au moment déclaré
          </p>
          <FleetMap
            :markers="markersRecharge"
            height="220px"
            :show-legend="false"
          />
          <p class="text-[11px] text-danger mt-1.5 leading-snug">
            Le véhicule se trouvait à {{ recharge.positionVehicule.ecartKm.toFixed(1) }} km du lieu de recharge déclaré
            à l’horodatage indiqué (source télématique). Aucun capteur n’est nécessaire pour établir ce constat :
            les trois données existent déjà, seul le croisement manquait.
          </p>
        </template>

        <!-- Circuit de refacturation -->
        <div v-if="recharge.statut === 'anomalie'" class="mt-3 pt-3 border-t border-border">
          <p class="text-[11px] font-semibold text-foreground mb-1.5">Qualification de l’écart</p>
          <select v-model="qualif" :class="F.fieldSelect" class="mb-2">
            <option value="">Choisir la cause…</option>
            <option v-for="(lib, k) in LIB_QUALIF" :key="k" :value="k">{{ lib }}</option>
          </select>
          <textarea v-model="commentaire" rows="2" :class="F.fieldTextarea" class="mb-2"
            placeholder="Éléments recueillis auprès du chauffeur et de l’exploitation…" />
          <button :class="L.btnPrimary" class="w-full justify-center" :disabled="!qualif" @click="qualifier">
            Enregistrer la qualification
          </button>
          <p class="text-[10px] text-muted-foreground mt-1.5 leading-snug">
            Toute refacturation suppose une qualification préalable et une double validation hiérarchique.
            La grille doit être validée par la direction des ressources humaines.
          </p>
        </div>

        <div v-else-if="recharge.statut === 'qualifie'" class="mt-3 pt-3 border-t border-border text-xs">
          <p class="text-[11px] text-muted-foreground">Cause retenue</p>
          <p class="font-medium">{{ LIB_QUALIF[recharge.qualification!] }}</p>
          <p class="text-[11px] text-muted-foreground mt-1.5">{{ recharge.commentaire }}</p>
        </div>
      </div>

      <div v-else :class="L.card">
        <div :class="L.emptyState">
          <Fuel class="w-7 h-7" />
          <p class="text-xs">Sélectionner une recharge pour afficher sa fiche</p>
        </div>
      </div>
    </div>

    <!-- ══ BONS PAR VÉHICULE ═════════════════════════════════ -->
  <div v-else-if="tab === 'bons'" :class="L.tableCard">
    <table :class="L.table">
      <thead><tr>
        <th :class="L.th" class="cursor-default">Véhicule</th>
        <th :class="L.th" class="cursor-default">Bons délivrés</th>
        <th :class="L.th" class="cursor-default">Litres</th>
        <th :class="L.th" class="cursor-default">Montant</th>
        <th :class="L.th" class="cursor-default">Répartition</th>
      </tr></thead>
      <tbody>
        <tr v-for="b in store.bonsParVehicule" :key="b.vehiculeId" :class="L.rowHover">
          <td :class="L.td"><span class="font-mono text-xs font-medium">{{ b.plaque }}</span></td>
          <td :class="L.td"><span class="text-sm font-bold text-primary">{{ b.bons }}</span></td>
          <td :class="L.td"><span class="text-xs">{{ fmtL(b.litres) }}</span></td>
          <td :class="L.td"><span class="text-xs">{{ fmtAr(b.montant) }}</span></td>
          <td :class="L.td">
            <div class="w-32 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div class="h-full bg-primary rounded-full"
                :style="{ width: (store.totalBons ? (b.bons / store.totalBons) * 100 : 0) + '%' }" />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <p class="px-3.5 py-2.5 text-[11px] text-muted-foreground border-t border-border leading-relaxed">
      Le client délivre des bons d’un litrage fixe. Le nombre de bons consommés par véhicule sur une
      période permet de comparer l’efficacité des véhicules et de repérer une dérive — sans aucun capteur.
    </p>
  </div>

  <!-- ══ CONSOMMATION PLEIN-À-PLEIN ════════════════════════ -->
    <div v-else-if="tab === 'conso'" :class="L.tableCard">
      <table :class="L.table">
        <thead><tr>
          <th :class="L.th" class="cursor-default">Véhicule</th>
          <th :class="L.th" class="cursor-default">Période (plein à plein)</th>
          <th :class="L.th" class="cursor-default">Km</th>
          <th :class="L.th" class="cursor-default">Bons</th>
          <th :class="L.th" class="cursor-default">Litres</th>
          <th :class="L.th" class="cursor-default">L / 100 km</th>
          <th :class="L.th" class="cursor-default">Référence trajet</th>
          <th :class="L.th" class="cursor-default">Écart</th>
        </tr></thead>
        <tbody>
          <tr v-for="(p, i) in store.periodesConso" :key="i" :class="L.rowHover">
            <td :class="L.td">
              <span class="font-mono text-xs font-medium">{{ p.vehiculePlaque }}</span>
              <div class="text-[11px] text-muted-foreground">{{ p.chauffeurNom ?? '—' }}</div>
            </td>
            <td :class="L.td"><span class="text-xs">{{ fmtDate(p.du) }} → {{ fmtDate(p.au) }}</span></td>
            <td :class="L.td"><span class="text-xs">{{ p.km.toLocaleString('fr-FR') }}</span></td>
            <td :class="L.td"><span class="text-xs">{{ p.litres.toLocaleString('fr-FR') }}</span></td>
            <td :class="L.td"><span class="text-xs font-semibold">{{ p.litresPour100km }}</span></td>
            <td :class="L.td">
              <span class="text-xs text-muted-foreground">{{ p.refConso }}</span>
              <span v-if="p.trajetCode" class="text-[11px] text-muted-foreground font-mono"> · {{ p.trajetCode }}</span>
            </td>
            <td :class="L.td">
              <span class="text-xs font-medium"
                :class="Math.abs(p.ecartPct) > 8 ? 'text-danger' : p.ecartPct > 3 ? 'text-warning' : 'text-success'">
                {{ p.ecartPct > 0 ? '+' : '' }}{{ p.ecartPct }} %
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="px-3.5 py-2.5 text-[11px] text-muted-foreground border-t border-border leading-relaxed">
        La référence est contextualisée par trajet et par modèle de véhicule : un porteur chargé sur un axe montagneux
        ne consomme pas comme un porteur à vide en terrain plat. Une norme unique produirait un bruit permanent.
      </p>
    </div>
</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  Fuel, Upload, Search, Info, CheckCircle2, XCircle, AlertTriangle, Gauge, Coins, Ticket,
} from 'lucide-vue-next'
import FleetMap from '../../components/fleet/FleetMap.vue'
import { useCarburantStore, LIB_CANAL, LIB_QUALIF } from '../../stores/carburant'
import type { QualifEcartCarburant, MapMarker } from '../../types/fms'
import { fmtAr, fmtL, fmtDate, fmtDateTime } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'
import * as F from '../../lib/formClasses'

const route = useRoute()
const store = useCarburantStore()

const tab = ref<'recharges' | 'conso' | 'bons'>('recharges')
const tabs = computed(() => [
  { key: 'recharges' as const, label: 'Registre des recharges', badge: store.anomalies.length },
  { key: 'conso' as const,     label: 'Consommation plein-à-plein', badge: 0 },
  { key: 'bons' as const,      label: 'Bons par véhicule', badge: 0 },
])

const q            = ref('')
const filtreStatut = ref('')
const selectedId   = ref<string | null>(null)
const qualif       = ref<QualifEcartCarburant | ''>('')
const commentaire  = ref('')

onMounted(() => {
  const id = route.query.recharge as string | undefined
  if (id) selectedId.value = id
})

const recharge = computed(() => selectedId.value ? store.getById(selectedId.value) : undefined)

const rechargesFiltrees = computed(() =>
  [...store.recharges]
    .filter(r => {
      if (filtreStatut.value && r.statut !== filtreStatut.value) return false
      if (q.value) {
        const s = q.value.toLowerCase()
        if (!`${r.vehiculePlaque} ${r.chauffeurNom ?? ''} ${r.lieu}`.toLowerCase().includes(s)) return false
      }
      return true
    })
    .sort((a, b) => +new Date(b.date) - +new Date(a.date)))

const consoMoyenne = computed(() => {
  const p = store.periodesConso
  if (!p.length) return 0
  return Number((p.reduce((s, x) => s + x.litresPour100km, 0) / p.length).toFixed(1))
})

const kpis = computed(() => [
  { label: 'Litres délivrés (période)', value: fmtL(store.litresDelivres()),
    icon: Fuel,  bg: 'bg-primary/10', iconColor: 'text-primary' },
  { label: 'Dépense totale',            value: fmtAr(store.montantTotal()),
    icon: Coins, bg: 'bg-info-bg',    iconColor: 'text-info' },
  { label: 'Conso moyenne (L/100 km)',  value: String(consoMoyenne.value),
    icon: Gauge, bg: 'bg-success-bg',  iconColor: 'text-success' },
  { label: 'Bons délivrés (période)',   value: String(store.totalBons),
    icon: Ticket, bg: 'bg-warning-bg',  iconColor: 'text-warning' },
  { label: 'Recharges en anomalie',     value: String(store.anomalies.length),
    icon: AlertTriangle, bg: 'bg-danger-bg', iconColor: 'text-danger' },
])

/** Deux marqueurs : lieu déclaré vs position réelle du véhicule. */
const markersRecharge = computed<MapMarker[]>(() => {
  const r = recharge.value
  if (!r?.positionVehicule) return []
  return [
    { id: 'declare', lat: r.lat, lng: r.lng, label: 'Lieu de recharge déclaré', color: '#0072C5' },
    { id: 'reel',    lat: r.positionVehicule.lat, lng: r.positionVehicule.lng,
      label: 'Position réelle du véhicule', sublabel: 'Source Camtrack', color: '#dc2626' },
  ]
})

function qualifier() {
  if (!recharge.value || !qualif.value) return
  store.qualifier(recharge.value.id, qualif.value, commentaire.value)
  qualif.value = ''
  commentaire.value = ''
}
</script>
