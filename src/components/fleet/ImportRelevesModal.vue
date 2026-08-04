<template>
  <div class="fixed inset-0 z-[1000] flex items-start justify-center bg-black/40 overflow-y-auto py-8"
    @click.self="emit('close')">
    <div class="bg-card rounded-xl shadow-xl w-full max-w-[900px] mx-4 flex flex-col">

      <!-- En-tête -->
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div>
          <h2 class="text-base font-semibold text-foreground">Importer un relevé de carburant</h2>
          <p class="text-[11px] text-muted-foreground">
            Fichier du fournisseur de cartes ou de la station partenaire, au format CSV.
          </p>
        </div>
        <button :class="L.tbIconBtn" @click="emit('close')"><X class="w-4 h-4" /></button>
      </div>

      <div class="px-5 py-4 flex flex-col gap-4">

        <!-- ── Étape 1 : le fichier ── -->
        <div>
          <p class="text-[13px] font-semibold text-foreground mb-2">1. Choisir le fichier</p>
          <label
            class="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg py-7 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <Upload class="w-6 h-6 text-muted-foreground" />
            <span class="text-xs text-muted-foreground">
              {{ nomFichier || 'Cliquer pour sélectionner un fichier CSV' }}
            </span>
            <input type="file" accept=".csv,text/csv" class="hidden" @change="chargerFichier" />
          </label>
          <p v-if="erreur" :class="F.fieldErrorBlock" class="mt-2">
            <AlertCircle class="w-3.5 h-3.5" /> {{ erreur }}
          </p>
        </div>

        <!-- ── Étape 2 : correspondance des colonnes ── -->
        <template v-if="entetes.length">
          <div>
            <p class="text-[13px] font-semibold text-foreground mb-1">2. Faire correspondre les colonnes</p>
            <p class="text-[11px] text-muted-foreground mb-2.5">
              Chaque fournisseur nomme ses colonnes différemment. Indiquez, pour chaque champ attendu,
              la colonne correspondante de votre fichier. Les correspondances évidentes sont pré-remplies.
            </p>

            <div class="grid grid-cols-2 gap-x-5 gap-y-3 max-sm:grid-cols-1">
              <div v-for="ch in CHAMPS" :key="ch.cle" :class="F.field">
                <label :class="F.fieldLabel">
                  {{ ch.libelle }}
                  <span v-if="ch.requis" class="text-danger">*</span>
                  <span v-else :class="F.fieldOptional">- facultatif</span>
                </label>
                <select v-model="mapping[ch.cle]" :class="F.fieldSelect">
                  <option value="">- ignorer -</option>
                  <option v-for="e in entetes" :key="e" :value="e">{{ e }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- ── Étape 3 : aperçu ── -->
          <div>
            <p class="text-[13px] font-semibold text-foreground mb-2">
              3. Vérifier l’aperçu
              <span class="font-normal text-muted-foreground">
                - {{ lignesValides.length }} ligne(s) exploitable(s) sur {{ lignes.length }}
              </span>
            </p>

            <div class="border border-border rounded-lg overflow-hidden">
              <table :class="L.table">
                <thead><tr>
                  <th :class="L.th" class="cursor-default">Date</th>
                  <th :class="L.th" class="cursor-default">Véhicule</th>
                  <th :class="L.th" class="cursor-default">Litres</th>
                  <th :class="L.th" class="cursor-default">Bons</th>
                  <th :class="L.th" class="cursor-default">Montant</th>
                  <th :class="L.th" class="cursor-default">Odomètre</th>
                  <th :class="L.th" class="cursor-default">État</th>
                </tr></thead>
                <tbody>
                  <tr v-for="(l, i) in apercu" :key="i" :class="L.rowHover">
                    <td :class="L.td"><span class="text-xs">{{ l.date || '-' }}</span></td>
                    <td :class="L.td"><span class="font-mono text-xs">{{ l.plaque || '-' }}</span></td>
                    <td :class="L.td"><span class="text-xs">{{ l.litres || '-' }}</span></td>
                    <td :class="L.td"><span class="text-xs">{{ l.bons ?? '-' }}</span></td>
                    <td :class="L.td"><span class="text-xs">{{ l.montant || '-' }}</span></td>
                    <td :class="L.td"><span class="text-xs">{{ l.odometre || '-' }}</span></td>
                    <td :class="L.td">
                      <span v-if="l.valide" class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-success-bg text-success">Exploitable</span>
                      <span v-else class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-danger-bg text-danger">{{ l.motif }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p class="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              À l’import, chaque ligne passe les six contrôles de vraisemblance : capacité du réservoir,
              cohérence de l’index kilométrique, position du véhicule à l’horodatage déclaré, recharges
              rapprochées, chauffeur affecté, plage horaire.
            </p>
          </div>
        </template>
      </div>

      <!-- Pied -->
      <div class="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-border">
        <p v-if="resultat" class="text-xs text-success flex items-center gap-1.5">
          <CheckCircle2 class="w-3.5 h-3.5" /> {{ resultat }}
        </p>
        <span v-else class="text-[11px] text-muted-foreground">
          {{ entetes.length ? 'Vérifiez la correspondance avant d’importer.' : 'Aucun fichier chargé.' }}
        </span>
        <div class="flex items-center gap-2 shrink-0">
          <button :class="L.btnOutline" @click="emit('close')">Fermer</button>
          <button :class="L.btnPrimary" :disabled="!lignesValides.length" @click="importer">
            Importer {{ lignesValides.length || '' }} ligne(s)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Import d'un relevé de carburant, avec correspondance de colonnes.
 *
 * Chaque fournisseur nomme ses colonnes à sa façon : l'écran ne présume donc
 * d'aucun format. Il lit les en-têtes du fichier, propose une correspondance
 * automatique quand le nom est reconnaissable, et laisse l'utilisateur corriger.
 */
import { ref, reactive, computed } from 'vue'
import Papa from 'papaparse'
import { X, Upload, AlertCircle, CheckCircle2 } from 'lucide-vue-next'
import { useCarburantStore } from '../../stores/carburant'
import { useVehiculesStore } from '../../stores/vehicules'
import { useConfigurationStore } from '../../stores/configuration'
import * as L from '../../lib/listClasses'
import * as F from '../../lib/formClasses'

const emit = defineEmits<{ close: []; imported: [n: number] }>()

const store        = useCarburantStore()
const vehicules    = useVehiculesStore()
const configStore  = useConfigurationStore()

/** Champs attendus, avec les libellés courants permettant la reconnaissance. */
const CHAMPS = [
  { cle: 'date',     libelle: 'Date et heure',     requis: true,  alias: ['date', 'datetime', 'horodatage', 'jour'] },
  { cle: 'plaque',   libelle: 'Plaque du véhicule', requis: true,  alias: ['plaque', 'immat', 'vehicule', 'matricule'] },
  { cle: 'litres',   libelle: 'Litres délivrés',    requis: true,  alias: ['litre', 'volume', 'quantite', 'qte'] },
  { cle: 'bons',     libelle: 'Nombre de bons',     requis: false, alias: ['bon', 'coupon', 'ticket'] },
  { cle: 'montant',  libelle: 'Montant',            requis: false, alias: ['montant', 'total', 'prix', 'ariary'] },
  { cle: 'odometre', libelle: 'Index kilométrique', requis: false, alias: ['odometre', 'km', 'kilometrage', 'compteur'] },
  { cle: 'lieu',     libelle: 'Lieu de recharge',   requis: false, alias: ['lieu', 'station', 'site', 'depot'] },
  { cle: 'chauffeur',libelle: 'Chauffeur',          requis: false, alias: ['chauffeur', 'conducteur', 'driver'] },
] as const

type CleChamp = typeof CHAMPS[number]['cle']

const nomFichier = ref('')
const erreur     = ref('')
const resultat   = ref('')
const entetes    = ref<string[]>([])
const lignes     = ref<Record<string, string>[]>([])
const mapping    = reactive<Record<CleChamp, string>>({
  date: '', plaque: '', litres: '', bons: '', montant: '', odometre: '', lieu: '', chauffeur: '',
})

/** Reconnaissance automatique : on cherche un alias dans le nom de colonne. */
function preRemplir() {
  CHAMPS.forEach(ch => {
    const trouve = entetes.value.find(e =>
      ch.alias.some(a => e.toLowerCase().replace(/[^a-z]/g, '').includes(a)))
    mapping[ch.cle] = trouve ?? ''
  })
}

function chargerFichier(ev: Event) {
  erreur.value = ''
  resultat.value = ''
  const f = (ev.target as HTMLInputElement).files?.[0]
  if (!f) return
  nomFichier.value = f.name

  Papa.parse<Record<string, string>>(f, {
    header: true,
    skipEmptyLines: true,
    complete: (res) => {
      if (!res.data.length) { erreur.value = 'Le fichier ne contient aucune ligne exploitable.'; return }
      entetes.value = res.meta.fields ?? []
      lignes.value = res.data
      preRemplir()
    },
    error: () => { erreur.value = 'Le fichier n’a pas pu être lu.' },
  })
}

/* ── Transformation et contrôle ────────────────────────────── */
const nombre = (v?: string) => {
  if (!v) return 0
  const n = Number(String(v).replace(/[^\d.,-]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

interface LigneImport {
  date: string; plaque: string; litres: number; bons?: number
  montant: number; odometre: number; lieu: string; chauffeur: string
  valide: boolean; motif: string
}

const transformees = computed<LigneImport[]>(() =>
  lignes.value.map(l => {
    const plaque = mapping.plaque ? (l[mapping.plaque] ?? '').trim() : ''
    const litres = nombre(mapping.litres ? l[mapping.litres] : '')
    const date   = mapping.date ? (l[mapping.date] ?? '').trim() : ''

    let motif = ''
    if (!date)        motif = 'Date manquante'
    else if (!plaque) motif = 'Plaque manquante'
    else if (!litres) motif = 'Litres manquants'
    else if (!vehicules.vehicules.some(v => v.plaque === plaque)) motif = 'Véhicule inconnu'

    return {
      date, plaque, litres,
      bons: mapping.bons ? nombre(l[mapping.bons]) || undefined : undefined,
      montant: nombre(mapping.montant ? l[mapping.montant] : ''),
      odometre: nombre(mapping.odometre ? l[mapping.odometre] : ''),
      lieu: mapping.lieu ? (l[mapping.lieu] ?? '').trim() : 'Import fichier',
      chauffeur: mapping.chauffeur ? (l[mapping.chauffeur] ?? '').trim() : '',
      valide: !motif,
      motif,
    }
  }))

const lignesValides = computed(() => transformees.value.filter(l => l.valide))
const apercu = computed(() => transformees.value.slice(0, 8))

/* ── Import ────────────────────────────────────────────────── */
function importer() {
  const litresParBon = configStore.parametres.litresParBonDefaut
  let n = 0

  lignesValides.value.forEach(l => {
    const veh = vehicules.vehicules.find(v => v.plaque === l.plaque)
    if (!veh) return
    const bons = l.bons ?? (Math.round(l.litres / litresParBon) || undefined)

    store.create({
      date: new Date(l.date).toISOString(),
      vehiculeId: veh.id,
      vehiculePlaque: veh.plaque,
      chauffeurNom: l.chauffeur || veh.chauffeurNom,
      litres: l.litres,
      prixLitre: l.montant && l.litres ? Math.round(l.montant / l.litres) : 0,
      montant: l.montant,
      odometre: l.odometre,
      pleinComplet: false,
      nombreBons: bons,
      litresParBon,
      lieu: l.lieu || 'Import fichier',
      lat: veh.position?.lat ?? 0,
      lng: veh.position?.lng ?? 0,
      canal: 'import',
    })
    n++
  })

  resultat.value = `${n} recharge(s) importée(s) et soumise(s) aux contrôles de vraisemblance.`
  emit('imported', n)
  lignes.value = []
  entetes.value = []
  nomFichier.value = ''
}
</script>
