<template>
  <div class="fixed inset-0 z-[1000] flex items-start justify-center bg-black/40 overflow-y-auto py-8"
    @click.self="emit('close')">
    <div class="bg-card rounded-xl shadow-xl w-full max-w-[980px] mx-4 flex flex-col">

      <div class="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div>
          <h2 class="text-base font-semibold text-foreground">Importer le parc</h2>
          <p class="text-[11px] text-muted-foreground">
            Fichier CSV issu des tableurs actuels. Une ligne passe entièrement ou est rejetée.
          </p>
        </div>
        <button :class="L.tbIconBtn" @click="emit('close')"><X class="w-4 h-4" /></button>
      </div>

      <div class="px-5 py-4 flex flex-col gap-4">

        <!-- Étape 1 - le fichier -->
        <div>
          <p class="text-[13px] font-semibold text-foreground mb-2">1. Choisir le fichier</p>
          <label
            class="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg py-7 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
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

        <template v-if="entetes.length">
          <!-- Étape 2 - correspondance des colonnes -->
          <div>
            <p class="text-[13px] font-semibold text-foreground mb-1">2. Faire correspondre les colonnes</p>
            <p class="text-[11px] text-muted-foreground mb-2.5">
              Chaque fichier a ses propres intitulés. Les correspondances évidentes sont pré-remplies ;
              corrigez celles qui ne le sont pas.
            </p>

            <div class="grid grid-cols-3 gap-x-5 gap-y-3 max-sm:grid-cols-1">
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

          <!-- Étape 3 - contrôles et aperçu -->
          <div>
            <p class="text-[13px] font-semibold text-foreground mb-2">
              3. Vérifier les contrôles
              <span class="font-normal text-muted-foreground">
                - {{ lignesValides.length }} ligne(s) importable(s), {{ lignesRejetees.length }} rejetée(s)
              </span>
            </p>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
              <div v-for="c in bilanControles" :key="c.label"
                class="bg-white rounded-xl border border-gray-100 px-3 py-2.5">
                <p class="text-lg font-bold leading-none" :class="c.nb ? 'text-danger' : 'text-success'">{{ c.nb }}</p>
                <p class="text-[11px] text-gray-500 mt-1">{{ c.label }}</p>
              </div>
            </div>

            <div class="border border-border rounded-lg overflow-hidden max-h-[280px] overflow-y-auto">
              <table :class="L.table">
                <thead><tr>
                  <th :class="L.th" class="cursor-default">Plaque</th>
                  <th :class="L.th" class="cursor-default">Type</th>
                  <th :class="L.th" class="cursor-default">VIN</th>
                  <th :class="L.th" class="cursor-default">Marque / Modèle</th>
                  <th :class="L.th" class="cursor-default">Motif de rejet</th>
                </tr></thead>
                <tbody>
                  <tr v-for="(l, i) in apercu" :key="i" :class="L.rowHover">
                    <td :class="L.td"><span class="font-mono text-xs">{{ l.plaque || '-' }}</span></td>
                    <td :class="L.td"><span class="text-xs">{{ l.typeVehicule || '-' }}</span></td>
                    <td :class="L.td"><span class="font-mono text-[11px]">{{ l.vin || '-' }}</span></td>
                    <td :class="L.td"><span class="text-xs">{{ [l.marque, l.modele].filter(Boolean).join(' ') || '-' }}</span></td>
                    <td :class="L.td">
                      <span v-if="l.valide" class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-success-bg text-success">
                        Importable
                      </span>
                      <span v-else class="text-[11px] text-danger">{{ l.motif }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p class="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              Contrôles appliqués : VIN en double dans le fichier ou déjà présent au parc, plaque
              manquante ou déjà connue, date de mise en circulation invalide, type non reconnu.
            </p>
          </div>
        </template>

        <!-- Rapport d'import -->
        <div v-if="rapport" class="rounded-lg border border-border overflow-hidden">
          <div class="px-3.5 py-2.5 bg-background border-b border-border">
            <p class="text-xs font-semibold text-foreground">Rapport d’import</p>
          </div>
          <div class="px-3.5 py-3">
            <p class="text-xs text-success flex items-center gap-1.5 mb-2">
              <CheckCircle2 class="w-3.5 h-3.5" /> {{ rapport.importees }} véhicule(s) importé(s).
            </p>
            <template v-if="rapport.rejets.length">
              <p class="text-xs text-danger font-medium mb-1">{{ rapport.rejets.length }} ligne(s) rejetée(s) :</p>
              <div v-for="(r, i) in rapport.rejets" :key="i" class="text-[11px] text-muted-foreground">
                Ligne {{ r.ligne }} - {{ r.plaque || 'sans plaque' }} : {{ r.motif }}
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-border">
        <span class="text-[11px] text-muted-foreground">
          {{ entetes.length ? 'Aucune ligne n’est importée partiellement.' : 'Aucun fichier chargé.' }}
        </span>
        <div class="flex items-center gap-2 shrink-0">
          <button :class="L.btnOutline" @click="emit('close')">Fermer</button>
          <button :class="L.btnPrimary" :disabled="!lignesValides.length" @click="importer">
            Importer {{ lignesValides.length || '' }} véhicule(s)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * US 2.9.1 - Import du parc depuis les fichiers actuels.
 *
 * Quatre contrôles avant import, comme le demande la user story :
 * VIN en double, plaque inconnue ou déjà prise, date invalide,
 * type non reconnu. Aucune ligne n'est importée partiellement.
 */
import { ref, reactive, computed } from 'vue'
import Papa from 'papaparse'
import { X, Upload, AlertCircle, CheckCircle2 } from 'lucide-vue-next'
import { useVehiculesStore } from '../../stores/vehicules'
import * as L from '../../lib/listClasses'
import * as F from '../../lib/formClasses'

const emit = defineEmits<{ close: []; imported: [n: number] }>()

const store = useVehiculesStore()

/** Champs attendus, avec les intitulés courants permettant la reconnaissance. */
const CHAMPS = [
  { cle: 'plaque',       libelle: 'Plaque',                  requis: true,  alias: ['plaque', 'immat', 'matricule', 'tracteur', 'srem'] },
  { cle: 'typeVehicule', libelle: 'Type',                    requis: true,  alias: ['type', 'categorie', 'nature'] },
  { cle: 'vin',          libelle: 'N° de châssis (VIN)',     requis: false, alias: ['vin', 'chassis', 'serie'] },
  { cle: 'marque',       libelle: 'Marque',                  requis: false, alias: ['marque', 'constructeur'] },
  { cle: 'modele',       libelle: 'Modèle',                  requis: false, alias: ['modele', 'model'] },
  { cle: 'dpmc',         libelle: 'Mise en circulation',     requis: false, alias: ['dpmc', 'circulation', 'miseenservice', 'annee'] },
  { cle: 'capacite',     libelle: 'Capacité (citerne)',      requis: false, alias: ['capacite', 'volume', 'litrage'] },
  { cle: 'site',         libelle: 'Base de rattachement',    requis: false, alias: ['site', 'base', 'depot', 'agence'] },
  { cle: 'kilometrage',  libelle: 'Kilométrage',             requis: false, alias: ['km', 'kilometrage', 'compteur', 'odometre'] },
] as const

type CleChamp = typeof CHAMPS[number]['cle']

const nomFichier = ref('')
const erreur     = ref('')
const entetes    = ref<string[]>([])
const lignes     = ref<Record<string, string>[]>([])
const mapping    = reactive<Record<CleChamp, string>>({
  plaque: '', typeVehicule: '', vin: '', marque: '', modele: '',
  dpmc: '', capacite: '', site: '', kilometrage: '',
})

interface Rapport {
  importees: number
  rejets: { ligne: number; plaque: string; motif: string }[]
}
const rapport = ref<Rapport | null>(null)

function preRemplir() {
  CHAMPS.forEach(ch => {
    const trouve = entetes.value.find(e =>
      ch.alias.some(a => e.toLowerCase().replace(/[^a-z]/g, '').includes(a)))
    mapping[ch.cle] = trouve ?? ''
  })
}

function chargerFichier(ev: Event) {
  erreur.value = ''
  rapport.value = null
  const f = (ev.target as HTMLInputElement).files?.[0]
  if (!f) return
  nomFichier.value = f.name

  Papa.parse<Record<string, string>>(f, {
    header: true, skipEmptyLines: true,
    complete: (res) => {
      if (!res.data.length) { erreur.value = 'Le fichier ne contient aucune ligne exploitable.'; return }
      entetes.value = res.meta.fields ?? []
      lignes.value = res.data
      preRemplir()
    },
    error: () => { erreur.value = 'Le fichier n’a pas pu être lu.' },
  })
}

/* ── Contrôles avant import ────────────────────────────────── */
const TYPES_RECONNUS: Record<string, string> = {
  tracteur: 'tracteur', trc: 'tracteur', camion: 'tracteur',
  remorque: 'remorque', rem: 'remorque', semi: 'remorque',
  citerne: 'citerne', cit: 'citerne', srem: 'citerne',
}

interface LigneImport {
  ligne: number
  plaque: string
  typeVehicule: string
  vin: string
  marque: string
  modele: string
  dpmc: string
  capacite: string
  site: string
  kilometrage: number
  valide: boolean
  motif: string
}

const transformees = computed<LigneImport[]>(() => {
  const vinsVus = new Set<string>()
  const plaquesVues = new Set<string>()

  return lignes.value.map((l, i) => {
    const val = (c: CleChamp) => (mapping[c] ? (l[mapping[c]] ?? '').trim() : '')

    const plaque = val('plaque')
    const vin    = val('vin').toUpperCase()
    const brut   = val('typeVehicule').toLowerCase().replace(/[^a-z]/g, '')
    const type   = TYPES_RECONNUS[brut] ?? ''
    const dpmc   = val('dpmc')

    let motif = ''
    if (!plaque) motif = 'Plaque manquante'
    else if (plaquesVues.has(plaque)) motif = 'Plaque en double dans le fichier'
    else if (store.plaqueExiste(plaque)) motif = 'Plaque déjà présente au parc'
    else if (!type) motif = `Type non reconnu : « ${val('typeVehicule') || 'vide'} »`
    else if (vin && vinsVus.has(vin)) motif = 'VIN en double dans le fichier'
    else if (vin && store.vinExiste(vin)) motif = 'VIN déjà présent au parc'
    else if (dpmc && Number.isNaN(+new Date(dpmc))) motif = `Date de mise en circulation invalide : « ${dpmc} »`

    if (!motif) {
      plaquesVues.add(plaque)
      if (vin) vinsVus.add(vin)
    }

    return {
      ligne: i + 2, // +2 : la ligne 1 est l'en-tête
      plaque, typeVehicule: type, vin,
      marque: val('marque'), modele: val('modele'), dpmc,
      capacite: val('capacite'), site: val('site'),
      kilometrage: Number(val('kilometrage').replace(/[^\d]/g, '')) || 0,
      valide: !motif, motif,
    }
  })
})

const lignesValides  = computed(() => transformees.value.filter(l => l.valide))
const lignesRejetees = computed(() => transformees.value.filter(l => !l.valide))
const apercu = computed(() => [...lignesRejetees.value, ...lignesValides.value].slice(0, 12))

const bilanControles = computed(() => [
  { label: 'VIN en double',    nb: lignesRejetees.value.filter(l => l.motif.includes('VIN')).length },
  { label: 'Plaque en défaut', nb: lignesRejetees.value.filter(l => l.motif.includes('Plaque')).length },
  { label: 'Date invalide',    nb: lignesRejetees.value.filter(l => l.motif.includes('Date')).length },
  { label: 'Type non reconnu', nb: lignesRejetees.value.filter(l => l.motif.includes('Type')).length },
])

/* ── Import ────────────────────────────────────────────────── */
function importer() {
  let n = 0
  lignesValides.value.forEach(l => {
    const res = store.create({
      plaque: l.plaque,
      typeVehicule: l.typeVehicule as never,
      vin: l.vin || undefined,
      marque: l.marque || undefined,
      modele: l.modele || undefined,
      dateMiseEnCirculation: l.dpmc || undefined,
      capacite: l.capacite || undefined,
      siteAffectation: l.site || undefined,
      kilometrage: l.kilometrage || undefined,
      statutAdmin: 'actif',
    } as never)
    /* create contrôle à nouveau l'unicité : une ligne validée à l'écran
       mais refusée ici ne doit pas être comptée comme importée. */
    if (!('erreur' in res)) n++
  })

  rapport.value = {
    importees: n,
    rejets: lignesRejetees.value.map(l => ({ ligne: l.ligne, plaque: l.plaque, motif: l.motif })),
  }
  emit('imported', n)
  lignes.value = []
  entetes.value = []
  nomFichier.value = ''
}
</script>
