<template>
  <ListPageLayout
    title="Conducteurs"
    :subtitle="sousTitre"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} conducteur(s)`"
    search-placeholder="Nom, prénom, matricule, n° de permis…"
    scope-label="Statut :"
    :scope-options="scopeOptions"
    v-model:scope="activeScope"
    v-model:search-query="searchQuery"
    v-model:sort-key="sortKey"
    v-model:sort-dir="sortDir"
    v-model:page="page"
    v-model:page-size="pageSize"
    @reset-filters="resetFilters"
    @open-card="(e) => openCard(e.id)"
  >
    <template #above-table>
      <!-- US 2.7.1 - une pièce conducteur expirée refuse l'affectation.
           La règle est appliquée à l'affectation ; elle est rappelée ici
           pour que le nombre de conducteurs disponibles ne surprenne pas. -->
      <div v-if="bloques.length"
        class="flex items-start gap-2.5 bg-danger-bg text-danger rounded-lg px-3.5 py-2.5 mb-3.5">
        <ShieldAlert class="w-4 h-4 shrink-0 mt-px" />
        <p class="text-xs leading-relaxed">
          {{ bloques.length }} conducteur(s) ne peuvent pas être affectés :
          <span v-for="(c, i) in bloques" :key="c.id">
            {{ i ? ' · ' : '' }}{{ c.nom }} {{ c.prenom }} ({{ c.motifBlocage }})
          </span>.
          L’autorisation de départ leur sera refusée tant que la pièce n’est pas régularisée.
        </p>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5">
        <div v-for="k in kpis" :key="k.label"
          class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
          <p class="text-xl font-bold leading-none" :class="k.color">{{ k.value }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ k.label }}</p>
          <p v-if="k.note" class="text-[11px] text-muted-foreground mt-0.5">{{ k.note }}</p>
        </div>
      </div>
    </template>

    <template #filters>
      <div>
        <label :class="L.fpFieldLabel">Alerte réglementaire</label>
        <select v-model="filterAlerte" :class="L.fpSelect">
          <option value="">Aucun filtre</option>
          <option value="bloquant">Pièce expirée, affectation refusée</option>
          <option value="proche">Échéance proche</option>
          <option value="permis">Permis expiré</option>
          <option value="visite">Visite médicale expirée</option>
        </select>
      </div>
      <div>
        <label :class="L.fpFieldLabel">Catégorie de permis</label>
        <select v-model="filterCategorie" :class="L.fpSelect">
          <option value="">Toutes</option>
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <button
        class="mt-auto py-[7px] bg-transparent border-0 text-xs text-muted-foreground cursor-pointer hover:text-primary"
        @click="resetFilters"
      >
        Réinitialiser
      </button>
    </template>

    <!-- ── Colonnes ─────────────────────────────────────────────── -->
    <template #cell-nom="{ item }">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
          :class="item.motifBlocage ? 'bg-danger-bg text-danger' : 'bg-primary/10 text-primary'">
          {{ initiales(item) }}
        </div>
        <div>
          <p class="font-medium text-gray-800">{{ item.nom }} {{ item.prenom }}</p>
          <p class="text-xs text-gray-400">{{ item.matricule }}</p>
        </div>
      </div>
    </template>

    <template #cell-permis="{ item }">
      <span class="text-xs font-mono text-gray-700">{{ item.categoriePermis ?? '-' }}</span>
      <span v-if="item.dateExpirationPermis" class="block mt-0.5">
        <span :class="clsEcheance(item.dateExpirationPermis)" class="px-1.5 py-0.5 rounded text-[11px] font-medium">
          {{ fmtDate(item.dateExpirationPermis) }}
        </span>
      </span>
    </template>

    <template #cell-visite="{ item }">
      <span v-if="item.dateExpirationVisiteMedicale"
        :class="clsEcheance(item.dateExpirationVisiteMedicale)"
        class="px-1.5 py-0.5 rounded text-[11px] font-medium">
        {{ fmtDate(item.dateExpirationVisiteMedicale) }}
      </span>
      <span v-else class="text-gray-300 text-xs">-</span>
    </template>

    <template #cell-score="{ item }">
      <div v-if="item.score != null" class="flex items-center gap-2">
        <div class="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all"
            :style="{ width: item.score + '%' }" :class="barreScore(item.score)" />
        </div>
        <span class="text-xs font-semibold" :class="texteScore(item.score)">{{ item.score }}</span>
      </div>
      <span v-else class="text-gray-300 text-xs">-</span>
    </template>

    <template #cell-statut="{ item }">
      <span v-if="item.motifBlocage" class="px-2 py-0.5 rounded-full text-xs font-medium bg-danger-bg text-danger">
        Non affectable
      </span>
      <span v-else class="px-2 py-0.5 rounded-full text-xs font-medium"
        :class="item.disponible ? 'bg-success-bg text-success' : 'bg-primary/10 text-primary'">
        {{ item.disponible ? 'Disponible' : 'Affecté' }}
      </span>
    </template>

    <!-- ── Aperçu ───────────────────────────────────────────────── -->
    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base shrink-0"
            :class="item.motifBlocage ? 'bg-danger-bg text-danger' : 'bg-primary/10 text-primary'">
            {{ initiales(item) }}
          </div>
          <div>
            <div class="font-semibold text-gray-800">{{ item.nom }} {{ item.prenom }}</div>
            <div class="text-xs text-gray-500">{{ item.matricule }}</div>
          </div>
        </div>

        <div v-if="item.motifBlocage" class="bg-danger-bg text-danger rounded-md px-2.5 py-2 text-[11px] leading-snug">
          Affectation refusée : {{ item.motifBlocage }}. L’autorisation de départ ne peut pas
          être délivrée tant que la pièce n’est pas régularisée.
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div class="text-muted-foreground text-[11px]">Permis</div>
            {{ item.categoriePermis ?? '-' }}
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">N° de permis</div>
            <span class="font-mono text-[11px]">{{ item.numeroPermis ?? '-' }}</span>
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Exp. permis</div>
            <span :class="clsEcheance(item.dateExpirationPermis)" class="px-1.5 py-0.5 rounded">
              {{ fmtDate(item.dateExpirationPermis) }}
            </span>
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Visite médicale</div>
            <span :class="clsEcheance(item.dateExpirationVisiteMedicale)" class="px-1.5 py-0.5 rounded">
              {{ fmtDate(item.dateExpirationVisiteMedicale) }}
            </span>
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Score conduite</div>
            <span :class="texteScore(item.score ?? 0)" class="font-semibold">
              {{ item.score ?? '-' }} / 100
            </span>
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Infractions</div>
            {{ item.nbInfractions }}
          </div>
        </div>

        <div v-if="item.formationsExpirees.length"
          class="bg-warning-bg text-warning rounded-md px-2.5 py-2 text-[11px] leading-snug">
          Formation expirée : {{ item.formationsExpirees.join(', ') }}.
        </div>

        <button :class="L.btnPrimary" class="w-full justify-center" @click="openCard(item.id)">
          Ouvrir la fiche
        </button>
        <button :class="L.btnOutline" class="w-full justify-center" @click="ouvrirDetail(item.id)">
          <ExternalLink class="w-4 h-4" /> Voir la page complète
        </button>
      </div>
    </template>

    <template #empty>
      <User class="w-8 h-8" />
      <p class="text-sm">Aucun conducteur trouvé</p>
    </template>

    <ConducteurCard v-if="selectedId"
      :employe="employeSelectionne"
      :profil="profStore.getByEmployeId(selectedId)"
      @close="selectedId = null" />
  </ListPageLayout>
</template>

<script setup lang="ts">
/**
 * Liste des conducteurs - module 2.
 *
 * L'écran s'aligne sur les conventions des autres listes du parc :
 * indicateurs, filtres, aperçu latéral, fiche en superposition, état vide.
 *
 * Trois défauts corrigés au passage :
 *   · le seuil d'alerte était figé à 30 jours dans le composant, alors
 *     que le préavis documentaire est paramétrable depuis Configuration ;
 *   · l'expiration se calculait sur la date réelle du poste, quand tout
 *     le reste de l'application raisonne sur la date d'exploitation ;
 *   · un aiguillage vers la page de détail était déclaré mais jamais
 *     câblé : la page existait sans qu'aucun écran n'y mène.
 */
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { User, ShieldAlert, ExternalLink } from 'lucide-vue-next'
import { ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import ConducteurCard from '../../components/fleet/ConducteurCard.vue'
import { useEmployeeStore } from '../../stores/employees'
import { useConduceteursProfilesStore } from '../../stores/conducteursProfiles'
import { useConfigurationStore } from '../../stores/configuration'
import { fmtDate } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'

const router      = useRouter()
const empStore    = useEmployeeStore()
const profStore   = useConduceteursProfilesStore()
const configStore = useConfigurationStore()

/* Date d'exploitation. Les données de démonstration sont datées de
   juillet 2026 ; calculer les expirations sur la date réelle du poste
   ferait varier les alertes d'un jour à l'autre sans rien changer au
   fond. Le reste de l'application emploie la même référence. */
const AUJOURDHUI = new Date('2026-07-08')

/** Préavis documentaire, paramétré dans Flotte → Configuration. */
const preavis = computed(() => configStore.parametres.preavisDocumentaireJours)

const selectedId     = ref<string | null>(null)
const searchQuery    = ref('')
const activeScope    = ref('')
const filterAlerte   = ref('')
const filterCategorie = ref('')
const sortKey        = ref('')
const sortDir        = ref<'asc' | 'desc'>('asc')
const page           = ref(1)
const pageSize       = ref(15)

const scopeOptions = [
  { value: '',           label: 'Tous' },
  { value: 'disponible', label: 'Disponibles' },
  { value: 'affecte',    label: 'Affectés' },
]

/* ── Calculs d'échéance ─────────────────────────────────────── */

const joursRestants = (date?: string): number | null =>
  date ? Math.ceil((+new Date(date) - +AUJOURDHUI) / 86_400_000) : null

const estExpire = (date?: string) => {
  const j = joursRestants(date)
  return j != null && j < 0
}

const estProche = (date?: string) => {
  const j = joursRestants(date)
  return j != null && j >= 0 && j <= preavis.value
}

/* ── Lignes ─────────────────────────────────────────────────── */

interface LigneConducteur {
  id: string
  nom: string
  prenom: string
  matricule: string
  disponible: boolean
  numeroPermis?: string
  categoriePermis?: string
  dateExpirationPermis?: string
  dateExpirationVisiteMedicale?: string
  score?: number
  nbInfractions: number
  formationsExpirees: string[]
  /** Renseigné si une pièce expirée interdit l'affectation - US 2.7.1 */
  motifBlocage: string | null
}

const chauffeurs = computed<LigneConducteur[]>(() =>
  (empStore.employees ?? [])
    .filter(e => e.fonction === 'Chauffeur')
    .map(e => {
      const profil = profStore.getByEmployeId(e.id)

      /* UC-02 : un permis ou une visite médicale expirés refusent
         l'affectation. Le motif nomme la pièce, pour que l'exploitant
         sache laquelle régulariser. */
      const motifs: string[] = []
      if (estExpire(profil?.dateExpirationPermis)) motifs.push('permis expiré')
      if (estExpire(profil?.dateExpirationVisiteMedicale)) motifs.push('visite médicale expirée')

      const formationsExpirees = (profil?.formations ?? [])
        .filter(f => estExpire(f.dateExpiration))
        .map(f => f.titre)

      /* L'ancienne version lisait e.nom, e.prenom et e.matricule, qui
         n'existent pas sur Employee : les champs sont lastName, firstName
         et code. Masqué par un cast `as any`, le défaut affichait des
         noms vides et des initiales vides dans toute la liste. */
      return {
        id:        e.id,
        nom:       e.lastName ?? '',
        prenom:    e.firstName ?? '',
        matricule: e.code ?? e.id,
        disponible: profil?.disponible ?? true,
        numeroPermis:                 profil?.numeroPermis,
        categoriePermis:              profil?.categoriePermis,
        dateExpirationPermis:         profil?.dateExpirationPermis,
        dateExpirationVisiteMedicale: profil?.dateExpirationVisiteMedicale,
        score:         profil?.scoreConduite,
        nbInfractions: profil?.infractions?.length ?? 0,
        formationsExpirees,
        motifBlocage: motifs.length ? motifs.join(' et ') : null,
      }
    }))

const bloques = computed(() => chauffeurs.value.filter(c => c.motifBlocage))

const categories = computed(() =>
  [...new Set(chauffeurs.value.map(c => c.categoriePermis).filter(Boolean) as string[])].sort())

const sousTitre = computed(() => {
  const base = `${chauffeurs.value.length} conducteur(s) enregistré(s)`
  return bloques.value.length
    ? `${base} · ${bloques.value.length} non affectable(s)`
    : base
})

const kpis = computed(() => {
  const proches = chauffeurs.value.filter(c =>
    estProche(c.dateExpirationPermis) || estProche(c.dateExpirationVisiteMedicale)).length
  return [
    { label: 'Conducteurs', value: chauffeurs.value.length, color: 'text-gray-800', note: '' },
    { label: 'Disponibles', value: chauffeurs.value.filter(c => c.disponible && !c.motifBlocage).length,
      color: 'text-success', note: 'et affectables' },
    { label: 'Non affectables', value: bloques.value.length,
      color: bloques.value.length ? 'text-danger' : 'text-success', note: 'pièce expirée' },
    { label: 'Échéances proches', value: proches,
      color: proches ? 'text-warning' : 'text-foreground', note: `sous ${preavis.value} jours` },
  ]
})

const columns = computed<ListColumn[]>(() => [
  { key: 'nom',    label: 'Conducteur',         sortable: true, width: 220 },
  { key: 'permis', label: 'Permis (expiration)', width: 170 },
  { key: 'visite', label: 'Visite médicale',     width: 150 },
  { key: 'score',  label: 'Score conduite',      sortable: true, width: 150 },
  { key: 'statut', label: 'Statut',              sortable: true, width: 140 },
])

watch([activeScope, filterAlerte, filterCategorie, searchQuery, pageSize], () => { page.value = 1 })

function resetFilters() {
  activeScope.value    = ''
  filterAlerte.value   = ''
  filterCategorie.value = ''
  searchQuery.value    = ''
  page.value = 1
}

const filtered = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return chauffeurs.value.filter(c => {
    if (activeScope.value === 'disponible' && !c.disponible) return false
    if (activeScope.value === 'affecte'    && c.disponible)  return false

    if (filterAlerte.value === 'bloquant' && !c.motifBlocage) return false
    if (filterAlerte.value === 'permis' && !estExpire(c.dateExpirationPermis)) return false
    if (filterAlerte.value === 'visite' && !estExpire(c.dateExpirationVisiteMedicale)) return false
    if (filterAlerte.value === 'proche'
      && !estProche(c.dateExpirationPermis)
      && !estProche(c.dateExpirationVisiteMedicale)) return false

    if (filterCategorie.value && c.categoriePermis !== filterCategorie.value) return false

    if (q && !`${c.nom} ${c.prenom} ${c.matricule} ${c.numeroPermis ?? ''}`.toLowerCase().includes(q)) {
      return false
    }
    return true
  })
})

const sorted = computed(() => {
  if (!sortKey.value) return filtered.value
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...filtered.value].sort((a, b) => {
    const cle = sortKey.value
    if (cle === 'score')  return ((a.score ?? 0) - (b.score ?? 0)) * dir
    if (cle === 'statut') return (Number(!!a.motifBlocage) - Number(!!b.motifBlocage)) * dir
    return `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`) * dir
  })
})

const totalCount = computed(() => sorted.value.length)

const pageItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return sorted.value.slice(start, start + pageSize.value)
})

/* ── Ouverture ──────────────────────────────────────────────── */

const employeSelectionne = computed(() =>
  selectedId.value ? empStore.employees?.find(e => e.id === selectedId.value) : undefined)

function openCard(id: string) { selectedId.value = id }

/** La page de détail existait sans qu'aucun écran n'y conduise. */
function ouvrirDetail(id: string) {
  router.push({ name: 'fleet-conducteur-detail', params: { id } })
}

/* ── Présentation ───────────────────────────────────────────── */

const initiales = (c: LigneConducteur) => (c.nom[0] ?? '') + (c.prenom[0] ?? '')

/** Vert, orange ou rouge selon le préavis paramétré, plus une valeur figée. */
function clsEcheance(date?: string) {
  if (!date) return 'text-gray-300'
  if (estExpire(date)) return 'bg-danger-bg text-danger'
  if (estProche(date)) return 'bg-warning-bg text-warning'
  return 'bg-success-bg text-success'
}

const barreScore = (s: number) => s >= 80 ? 'bg-success' : s >= 60 ? 'bg-warning' : 'bg-danger'
const texteScore = (s: number) => s >= 80 ? 'text-success' : s >= 60 ? 'text-warning' : 'text-danger'
</script>
