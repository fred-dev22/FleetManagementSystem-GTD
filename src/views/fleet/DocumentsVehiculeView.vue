<template>
  <ListPageLayout
    title="Documents"
    subtitle="Véhicules & conducteurs - suivi réglementaire"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} document(s)`"
    search-placeholder="Rechercher par entité ou type…"
    v-model:search-query="search"
    v-model:page="page"
    v-model:page-size="pageSize"
    @open-card="(e) => openDetail(e)"
  >
    <!-- Alertes -->
    <template #above-table>
      <div class="flex flex-wrap gap-2.5 mb-3.5">
        <div v-if="store.documentsExpires.length" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-danger-bg border border-danger/20 text-danger text-sm font-medium">
          <AlertTriangle class="w-4 h-4" />
          {{ store.documentsExpires.length }} document(s) expiré(s)
        </div>
        <div v-if="store.documentsExpiresSous30Jours.length" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning-bg border border-warning/20 text-warning text-sm font-medium">
          <Clock class="w-4 h-4" />
          {{ store.documentsExpiresSous30Jours.length }} expiration(s) dans 30 jours
        </div>
      </div>

      <!-- KPIs -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div v-for="k in kpis" :key="k.label" class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
          <p class="text-xs text-gray-500 font-medium">{{ k.label }}</p>
          <p class="text-2xl font-bold mt-0.5" :class="k.color ?? 'text-gray-800'">{{ k.value }}</p>
        </div>
      </div>
    </template>

    <!-- Filtres -->
    <template #filters>
      <select v-model="filterEntity" :class="L.fpSelect">
        <option value="">Toutes les entités</option>
        <option value="vehicule">Véhicules</option>
        <option value="conducteur">Conducteurs</option>
      </select>
      <select v-model="filterType" :class="L.fpSelect">
        <option value="">Tous les types</option>
        <option v-for="t in typesDoc" :key="t" :value="t">{{ t }}</option>
      </select>
      <select v-model="filterStatut" :class="L.fpSelect">
        <option value="">Tous les statuts</option>
        <option value="valide">Valide</option>
        <option value="archive">Expiré</option>
        <option value="depose">Déposé</option>
      </select>
    </template>

    <!-- Header actions -->
    <template #header-actions>
      <button :class="L.btnPrimary" @click="openModal()">
        <Plus class="w-4 h-4" />
        Ajouter document
      </button>
    </template>

    <!-- Colonnes -->
    <template #cell-entityId="{ item }">
      <div class="flex items-center gap-2">
        <span :class="item.entityType === 'vehicule' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'"
          class="px-1.5 py-0.5 rounded text-xs font-medium">
          {{ item.entityType === 'vehicule' ? 'VÉH' : 'CND' }}
        </span>
        <span class="font-mono text-sm font-semibold text-gray-800">{{ item.entityId }}</span>
      </div>
    </template>

    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3">
        <div>
          <span class="text-xs font-medium px-2 py-0.5 rounded-full"
            :class="item.entityType === 'vehicule' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'">
            {{ item.entityType === 'vehicule' ? 'Véhicule' : 'Conducteur' }}
          </span>
          <div class="font-medium text-foreground mt-1.5">{{ item.type }}</div>
          <div class="font-mono text-xs text-muted-foreground">{{ item.entityId }}</div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div class="text-muted-foreground text-[11px]">N°</div>
            <span class="font-mono">{{ item.numero ?? '-' }}</span>
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Statut</div>{{ LIB_STATUT[item.statut] ?? item.statut }}
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Émission</div>{{ fmtDate(item.dateEmission) }}
          </div>
          <div>
            <div class="text-muted-foreground text-[11px]">Expiration</div>
            {{ item.dateExpiration ? fmtDate(item.dateExpiration) : '-' }}
          </div>
        </div>

        <!-- Échéance : le seuil de 30 jours vient de la règle documentaire du client -->
        <div v-if="item.dateExpiration" class="rounded-md px-2.5 py-2 text-[11px] leading-snug"
          :class="clsEcheance(item.dateExpiration)">
          {{ libelleEcheance(item.dateExpiration) }}
        </div>

        <button :class="L.btnPrimary" class="w-full justify-center" @click="openDetail(item)">
          Ouvrir la fiche
        </button>
      </div>
    </template>

    <template #cell-type="{ item }">
      <span class="text-gray-700 text-sm">{{ item.type }}</span>
    </template>

    <template #cell-dateExpiration="{ item }">
      <span v-if="item.dateExpiration" :class="statutDateClass(item.dateExpiration)" class="px-2 py-0.5 rounded text-xs font-medium">
        {{ formatDate(item.dateExpiration) }}
      </span>
      <span v-else class="text-gray-300 text-xs">-</span>
    </template>

    <template #cell-statut="{ item }">
      <span :class="statutClass(item.statut)" class="px-2 py-0.5 rounded-full text-xs font-medium">
        {{ statutLabel(item.statut) }}
      </span>
    </template>

    <template #cell-actions="{ item }">
      <div class="flex items-center gap-2">
        <button class="text-xs text-primary hover:underline" @click.stop="openModal(item)">Modifier</button>
        <button class="text-xs text-danger hover:underline" @click.stop="confirmDelete(item)">Supprimer</button>
      </div>
    </template>

    <template #empty>
      <p class="text-gray-500">Aucun document trouvé.</p>
    </template>
  </ListPageLayout>

  <!-- Modal ajout / modification -->
  <Teleport to="body">
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="showModal = false">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="bg-primary px-6 py-4 flex items-center justify-between">
          <h2 class="text-white font-semibold">{{ editingDoc ? 'Modifier' : 'Ajouter' }} un document</h2>
          <button class="text-white/80 hover:text-white" @click="showModal = false"><X class="w-5 h-5" /></button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label :class="L.fpFieldLabel">Entité *</label>
            <div class="flex gap-2 mb-2">
              <button v-for="et in ['vehicule','conducteur']" :key="et"
                @click="form.entityType = et as any"
                :class="form.entityType === et ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-600'"
                class="flex-1 py-1.5 rounded-lg border-2 text-sm font-medium capitalize transition-colors">
                {{ et }}
              </button>
            </div>
            <input v-model="form.entityId" :class="L.fpField" placeholder="ID (ex: TRC-001 ou CP-001)" />
          </div>
          <div>
            <label :class="L.fpFieldLabel">Type de document *</label>
            <input v-model="form.type" list="types-list" :class="L.fpField" placeholder="Carte grise, Assurance…" />
            <datalist id="types-list">
              <option v-for="t in typesDoc" :key="t" :value="t" />
            </datalist>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label :class="L.fpFieldLabel">Date d'émission *</label>
              <input v-model="form.dateEmission" type="date" :class="L.fpField" />
            </div>
            <div>
              <label :class="L.fpFieldLabel">Date d'expiration</label>
              <input v-model="form.dateExpiration" type="date" :class="L.fpField" />
            </div>
          </div>
          <div>
            <label :class="L.fpFieldLabel">Statut</label>
            <select v-model="form.statut" :class="L.fpSelect">
              <option value="depose">Déposé</option>
              <option value="valide">Valide</option>
              <option value="refuse">Refusé</option>
              <option value="archive">Archivé</option>
            </select>
          </div>
        </div>
        <div class="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <button :class="L.btnOutline" @click="showModal = false">Annuler</button>
          <button :class="L.btnPrimary" :disabled="!canSave" @click="saveDoc">
            {{ editingDoc ? 'Enregistrer' : 'Ajouter' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm delete -->
    <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <h3 class="font-semibold text-gray-800 mb-2">Supprimer ce document ?</h3>
        <p class="text-sm text-gray-600 mb-4">{{ deleteTarget.type }} - {{ deleteTarget.entityId }}</p>
        <div class="flex gap-3 justify-end">
          <button :class="L.btnOutline" @click="deleteTarget = null">Annuler</button>
          <button class="px-4 py-2 bg-danger text-white rounded-lg text-sm font-semibold hover:bg-danger/90 transition-colors"
            @click="doDelete">Supprimer</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { Plus, AlertTriangle, Clock, X } from 'lucide-vue-next'
import { ListPageLayout } from '../../components'
import { useDocumentsVehiculesStore } from '../../stores/documentsVehicules'
import type { DocumentVehicule } from '../../types'
import { fmtDate } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'

const store = useDocumentsVehiculesStore()

const search       = ref('')
const filterEntity = ref('')
const filterType   = ref('')
const filterStatut = ref('')
const showModal    = ref(false)
const editingDoc   = ref<DocumentVehicule | null>(null)
const deleteTarget = ref<DocumentVehicule | null>(null)
const page     = ref(1)
const pageSize = ref(15)

const form = reactive<Partial<DocumentVehicule>>({
  entityType: 'vehicule',
  statut: 'valide',
})

const typesDoc = ['Carte grise', 'Assurance', 'Visite technique', 'Vignette', 'Permis C', 'Permis CE', 'Visite médicale', 'ADR', 'Autre']

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return store.documents.filter(d => {
    if (filterEntity.value && d.entityType !== filterEntity.value) return false
    if (filterType.value   && d.type !== filterType.value)         return false
    if (filterStatut.value && d.statut !== filterStatut.value)     return false
    if (q && !`${d.entityId} ${d.type}`.toLowerCase().includes(q)) return false
    return true
  })
})

const kpis = computed(() => {
  const all = store.documents
  const valid = all.filter(d => d.statut === 'valide').length
  return [
    { label: 'Total',              value: all.length,                                      color: 'text-gray-800' },
    { label: 'Valides',            value: valid,                                            color: 'text-success'  },
    { label: 'Expirés',            value: store.documentsExpires.length,                   color: 'text-danger'   },
    { label: 'Expirent < 30 j',   value: store.documentsExpiresSous30Jours.length,        color: 'text-warning'  },
  ]
})

const columns = [
  { key: 'entityId',       label: 'Entité' },
  { key: 'type',           label: 'Type de document' },
  { key: 'dateEmission',   label: 'Émission' },
  { key: 'dateExpiration', label: 'Expiration' },
  { key: 'statut',         label: 'Statut' },
  { key: 'actions',        label: 'Actions' },
]

function openModal(doc?: DocumentVehicule) {
  editingDoc.value = doc ?? null
  if (doc) {
    Object.assign(form, { ...doc })
  } else {
    Object.assign(form, { entityId: '', entityType: 'vehicule', type: '', dateEmission: '', dateExpiration: '', statut: 'valide' })
  }
  showModal.value = true
}

watch([filterEntity, filterType, filterStatut, search, pageSize], () => { page.value = 1 })

const totalCount = computed(() => filtered.value.length)
const pageItems  = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

function openDetail(row: DocumentVehicule) { openModal(row) }

/* Échéance documentaire - le préavis de 30 jours est la règle du cahier
   des charges : « alertes programmées à J-30, escalade si non validés ». */
const PREAVIS_JOURS = 30

const LIB_STATUT: Record<string, string> = {
  depose: 'Déposé', valide: 'Validé', refuse: 'Refusé', archive: 'Archivé',
}

function joursRestants(iso: string): number {
  return Math.ceil((+new Date(iso) - Date.now()) / 86_400_000)
}

function libelleEcheance(iso: string): string {
  const j = joursRestants(iso)
  if (j < 0) return `Expiré depuis ${Math.abs(j)} jour(s) - régularisation requise`
  if (j <= PREAVIS_JOURS) return `Expire dans ${j} jour(s) - à renouveler`
  return `Valide encore ${j} jour(s)`
}

function clsEcheance(iso: string): string {
  const j = joursRestants(iso)
  if (j < 0) return 'bg-danger-bg text-danger'
  if (j <= PREAVIS_JOURS) return 'bg-warning-bg text-warning'
  return 'bg-success-bg text-success'
}

const canSave = computed(() => !!form.entityId && !!form.type && !!form.dateEmission && !!form.entityType)

function saveDoc() {
  if (!canSave.value) return
  const payload = {
    entityId:       form.entityId!,
    entityType:     form.entityType!,
    type:           form.type!,
    dateEmission:   form.dateEmission!,
    dateExpiration: form.dateExpiration || undefined,
    statut:         form.statut ?? 'valide',
  }
  if (editingDoc.value) {
    store.updateDocument(editingDoc.value.id, payload)
  } else {
    store.createDocument(payload)
  }
  showModal.value = false
}

function confirmDelete(doc: DocumentVehicule) { deleteTarget.value = doc }
function doDelete() {
  if (deleteTarget.value) { store.deleteDocument(deleteTarget.value.id) }
  deleteTarget.value = null
}

function formatDate(d?: string) {
  return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
}

function statutDateClass(date: string) {
  const exp = new Date(date)
  const now = new Date()
  const in30 = new Date(); in30.setDate(now.getDate() + 30)
  if (exp < now)   return 'bg-danger-bg text-danger'
  if (exp <= in30) return 'bg-warning-bg text-warning'
  return 'bg-success-bg text-success'
}

const STATUT_MAP: Record<string, { label: string; cls: string }> = {
  valide:  { label: 'Valide',   cls: 'bg-success-bg text-success' },
  depose:  { label: 'Déposé',   cls: 'bg-primary/10 text-primary' },
  refuse:  { label: 'Refusé',   cls: 'bg-danger-bg text-danger'   },
  archive: { label: 'Archivé',  cls: 'bg-gray-100 text-gray-400'  },
}
const statutLabel = (s: string) => STATUT_MAP[s]?.label ?? s
const statutClass = (s: string) => STATUT_MAP[s]?.cls ?? ''
</script>
