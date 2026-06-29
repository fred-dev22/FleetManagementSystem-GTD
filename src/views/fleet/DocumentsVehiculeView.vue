<template>
  <ListPageLayout
    title="Documents Véhicules"
    :subtitle="`${totalCount} document(s) enregistré(s)`"
    :columns="columns"
    :items="pageItems"
    :total="totalCount"
    :total-text="`${totalCount} document(s)`"
    search-placeholder="Rechercher par véhicule ou numéro…"
    scope-label="Statut :"
    :scope-options="scopeOptions"
    v-model:scope="filterStatut"
    v-model:search-query="searchQuery"
    v-model:sort-key="sortKey"
    v-model:sort-dir="sortDir"
    v-model:page="page"
    v-model:page-size="pageSize"
    @reset-filters="resetFilters"
    @open-card="(e) => openDetail(e.id)"
  >
    <template #header-actions>
      <button :class="L.btnPrimary" @click="openModal()">
        <Plus class="w-4 h-4" /> Ajouter document
      </button>
    </template>

    <template #above-table>
      <!-- Alertes -->
      <div v-if="store.documentsExpires.length > 0 || store.documentsExpiresSous30Jours.length > 0" class="flex flex-wrap gap-2.5 mb-3.5">
        <div v-if="store.documentsExpires.length > 0" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-danger-bg border border-danger/20 text-danger text-[13px] font-medium">
          <XCircle class="w-4 h-4 shrink-0" />
          {{ store.documentsExpires.length }} document(s) expiré(s)
        </div>
        <div v-if="store.documentsExpiresSous30Jours.length > 0" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning-bg border border-warning/20 text-warning text-[13px] font-medium">
          <AlertTriangle class="w-4 h-4 shrink-0" />
          {{ store.documentsExpiresSous30Jours.length }} document(s) expire(nt) dans 30 jours
        </div>
      </div>
      <!-- KPIs -->
      <div class="grid grid-cols-4 gap-2.5 mb-3.5 max-md:grid-cols-2">
        <div :class="kpiItem"><div :class="kpiIcon" class="bg-primary/10"><FileText class="w-[18px] h-[18px] text-primary" /></div><div><div :class="kpiVal">{{ store.documents.length }}</div><div :class="kpiLbl">Total</div></div></div>
        <div :class="kpiItem"><div :class="kpiIcon" class="bg-success-bg"><CheckCircle2 class="w-[18px] h-[18px] text-success" /></div><div><div :class="kpiVal">{{ store.documents.filter(d => getStatut(d.dateExpiration ?? '') === 'valide').length }}</div><div :class="kpiLbl">Valides</div></div></div>
        <div :class="kpiItem"><div :class="kpiIcon" class="bg-warning-bg"><AlertTriangle class="w-[18px] h-[18px] text-warning" /></div><div><div :class="kpiVal">{{ store.documentsExpiresSous30Jours.length }}</div><div :class="kpiLbl">Expirent bientôt</div></div></div>
        <div :class="kpiItem"><div :class="kpiIcon" class="bg-danger-bg"><XCircle class="w-[18px] h-[18px] text-danger" /></div><div><div :class="kpiVal">{{ store.documentsExpires.length }}</div><div :class="kpiLbl">Expirés</div></div></div>
      </div>
    </template>

    <template #filters>
      <div :class="L.fpField">
        <label :class="L.fpFieldLabel">Type véhicule</label>
        <select v-model="filterVehiculeType" :class="L.fpSelect">
          <option value="">Tous</option>
          <option value="tracteur">Tracteur</option>
          <option value="remorque">Remorque</option>
        </select>
      </div>
      <div :class="L.fpField">
        <label :class="L.fpFieldLabel">Type doc.</label>
        <select v-model="filterDocType" :class="L.fpSelect">
          <option value="">Tous</option>
          <option v-for="dt in docTypes" :key="dt" :value="dt">{{ dt }}</option>
        </select>
      </div>
      <button class="mt-auto py-[7px] bg-transparent border-0 text-xs text-muted-foreground cursor-pointer text-left hover:text-primary" @click="resetFilters">
        Réinitialiser
      </button>
    </template>

    <!-- Cellules -->
    <template #cell-vehiculeType="{ item }">
      <span :class="['text-[11px] font-bold px-2 py-0.5 rounded-full', item.vehiculeType === 'tracteur' ? 'bg-primary/10 text-primary' : 'bg-purple-100 text-purple-700']">
        {{ item.vehiculeType === 'tracteur' ? 'Tracteur' : 'Remorque' }}
      </span>
    </template>
    <template #cell-vehiculeId="{ item }">
      <span class="font-mono font-bold text-[12px] text-foreground">{{ item.vehiculeId }}</span>
    </template>
    <template #cell-typeDocument="{ item }">
      <span class="text-foreground text-[13px]">{{ item.type }}</span>
    </template>
    <template #cell-numero="{ item }">
      <span class="font-mono text-xs text-muted-foreground">—</span>
    </template>
    <template #cell-dateEmission="{ item }">
      <span class="text-muted-foreground text-xs">{{ formatDate(item.dateEmission) }}</span>
    </template>
    <template #cell-dateExpiration="{ item }">
      <span :class="['text-xs font-medium', getStatut(item.dateExpiration ?? '') === 'expire' ? 'text-danger' : getStatut(item.dateExpiration ?? '') === 'expireBientot' ? 'text-warning' : 'text-foreground']">
        {{ item.dateExpiration ? formatDate(item.dateExpiration) : '—' }}
      </span>
    </template>
    <template #cell-statut="{ item }">
      <span :class="['text-[11px] font-medium px-2 py-0.5 rounded-full', statutClass(item.dateExpiration ?? '')]">{{ statutLabel(item.dateExpiration ?? '') }}</span>
    </template>
    <template #cell-actions="{ item }">
      <div class="flex items-center gap-1.5">
        <button class="p-1.5 rounded text-primary hover:bg-primary/10 transition-colors" @click.stop="openModal(item)" title="Modifier"><Pencil class="w-3.5 h-3.5" /></button>
        <button class="p-1.5 rounded text-danger hover:bg-danger-bg transition-colors" @click.stop="confirmDelete(item.id)" title="Supprimer"><Trash2 class="w-3.5 h-3.5" /></button>
      </div>
    </template>

    <!-- Panneau latéral -->
    <template #details-panel="{ item }">
      <div class="flex flex-col gap-3">
        <div>
          <span :class="['text-[11px] font-bold px-2 py-0.5 rounded-full', item.vehiculeType === 'tracteur' ? 'bg-primary/10 text-primary' : 'bg-purple-100 text-purple-700']">
            {{ item.vehiculeType === 'tracteur' ? 'Tracteur' : 'Remorque' }}
          </span>
          <div class="font-mono font-bold text-foreground mt-1.5">{{ item.vehiculeId }}</div>
          <div class="text-[13px] font-medium text-foreground mt-0.5">{{ item.type }}</div>
        </div>
        <span :class="['text-[11px] font-medium px-2 py-0.5 rounded-full self-start', statutClass(item.dateExpiration ?? '')]">{{ statutLabel(item.dateExpiration ?? '') }}</span>
        <div class="grid grid-cols-2 gap-2 text-[12px]">
          <div><div class="text-muted-foreground text-[11px]">N° document</div><span class="font-mono text-xs">—</span></div>
          <div><div class="text-muted-foreground text-[11px]">Émis le</div>{{ formatDate(item.dateEmission) }}</div>
          <div class="col-span-2"><div class="text-muted-foreground text-[11px]">Expire le</div>
            <span :class="['font-medium', getStatut(item.dateExpiration ?? '') === 'expire' ? 'text-danger' : getStatut(item.dateExpiration ?? '') === 'expireBientot' ? 'text-warning' : 'text-foreground']">
              {{ item.dateExpiration ? formatDate(item.dateExpiration) : '—' }}
            </span>
          </div>
        </div>
        <button :class="L.btnOutline" class="w-full justify-center" @click="openModal(item)">Modifier</button>
        <button class="w-full justify-center inline-flex items-center gap-1.5 px-3 py-[7px] rounded-md text-[13px] font-medium border border-danger/30 bg-danger-bg text-danger hover:bg-danger hover:text-white transition-colors cursor-pointer" @click="confirmDelete(item.id)">
          Supprimer
        </button>
      </div>
    </template>

    <template #empty>
      <FileText class="w-8 h-8" />
      <p class="text-[13px]">Aucun document trouvé</p>
    </template>
  </ListPageLayout>

  <!-- Modal ajout/édition -->
  <Teleport to="body">
    <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-[900]" @click.self="closeModal">
      <div class="bg-card rounded-xl w-full max-w-lg shadow-2xl border border-border overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-border bg-primary">
          <div class="flex items-center gap-2.5">
            <FileText class="w-4 h-4 text-white/70" />
            <span class="text-white font-semibold text-[14px]">{{ editDoc ? 'Modifier le document' : 'Ajouter un document' }}</span>
          </div>
          <button class="text-white/70 hover:text-white" @click="closeModal"><X class="w-5 h-5" /></button>
        </div>
        <div class="px-5 py-4">
          <div v-if="formError" class="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-danger-bg border border-danger/20 text-danger text-[13px] mb-4">
            <AlertTriangle class="w-4 h-4 shrink-0" />{{ formError }}
          </div>
          <div class="grid grid-cols-2 gap-3.5">
            <div class="flex flex-col gap-1.5">
              <label class="text-[12px] font-medium text-muted-foreground">Type de véhicule <span class="text-danger">*</span></label>
              <select v-model="form.vehiculeType" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary">
                <option value="tracteur">Tracteur</option>
                <option value="remorque">Remorque</option>
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[12px] font-medium text-muted-foreground">ID / Plaque <span class="text-danger">*</span></label>
              <input type="text" v-model="form.vehiculeId" placeholder="ex: TRC-001" list="vehicule-ids" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary" />
              <datalist id="vehicule-ids">
                <option v-for="id in vehiculeIds" :key="id" :value="id" />
              </datalist>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[12px] font-medium text-muted-foreground">Type de document <span class="text-danger">*</span></label>
              <select v-model="form.type" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary">
                <option v-for="dt in docTypes" :key="dt" :value="dt">{{ dt }}</option>
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[12px] font-medium text-muted-foreground">N° document</label>
              <input type="text" v-model="form.ref" placeholder="Numéro de référence" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[12px] font-medium text-muted-foreground">Date d'émission <span class="text-danger">*</span></label>
              <input type="date" v-model="form.dateEmission" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[12px] font-medium text-muted-foreground">Date d'expiration <span class="text-danger">*</span></label>
              <input type="date" v-model="form.dateExpiration" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div class="col-span-2 flex flex-col gap-1.5">
              <label class="text-[12px] font-medium text-muted-foreground">Lien fichier</label>
              <input type="url" v-model="form.lienFichier" placeholder="https://…" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2 px-5 py-3 border-t border-border bg-muted/30 rounded-b-xl">
          <button :class="L.btnOutline" @click="closeModal">Annuler</button>
          <button :class="L.btnPrimary" @click="saveDocument">{{ editDoc ? 'Enregistrer' : 'Ajouter' }}</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Confirm suppression -->
  <Teleport to="body">
    <div v-if="deleteTargetId" class="fixed inset-0 bg-black/40 flex items-center justify-center z-[900]" @click.self="deleteTargetId = null">
      <div class="bg-card rounded-xl w-full max-w-sm shadow-2xl border border-border">
        <div class="flex items-center justify-between px-5 py-4 border-b border-border">
          <span class="font-semibold text-foreground">Confirmer la suppression</span>
          <button @click="deleteTargetId = null" class="text-muted-foreground hover:text-foreground"><X class="w-4 h-4" /></button>
        </div>
        <div class="px-5 py-4 text-[13px] text-muted-foreground">Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.</div>
        <div class="flex justify-end gap-2 px-5 py-3 border-t border-border bg-muted/30 rounded-b-xl">
          <button :class="L.btnOutline" @click="deleteTargetId = null">Annuler</button>
          <button class="px-4 py-[7px] rounded-md text-[13px] font-medium cursor-pointer inline-flex items-center gap-1.5 bg-danger text-white transition-colors hover:bg-danger/90" @click="executeDelete">Supprimer</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, FileText, CheckCircle2, AlertTriangle, XCircle, Pencil, Trash2, X } from 'lucide-vue-next'
import { ListPageLayout } from '../../components'
import type { ListColumn } from '../../components/shared/ListPageLayout.vue'
import * as L from '../../lib/listClasses'
import { useDocumentsVehiculesStore } from '../../stores/documentsVehicules'
import type { DocumentVehicule } from '../../types/index'

const store = useDocumentsVehiculesStore()

const kpiItem = 'bg-card border border-border rounded-lg px-3.5 py-3 flex items-center gap-3'
const kpiIcon = 'w-9 h-9 rounded-lg flex items-center justify-center shrink-0'
const kpiVal  = 'text-[22px] font-bold leading-none'
const kpiLbl  = 'text-xs text-muted-foreground mt-0.5'

const TODAY = new Date().toISOString().slice(0, 10)

const filterVehiculeType = ref('')
const filterDocType      = ref('')
const filterStatut       = ref('')
const searchQuery        = ref('')
const sortKey            = ref('')
const sortDir            = ref<'asc' | 'desc'>('asc')
const page               = ref(1)
const pageSize           = ref(15)

const docTypes   = ['Carte grise', 'Assurance', 'Visite technique', 'Vignette', 'Permis de transport', 'Autre']
const vehiculeIds = ['TRC-001', 'TRC-002', 'TRC-003', 'TRC-004', 'TRC-005', 'REM-001', 'REM-002', 'REM-003']

const scopeOptions = [
  { value: '', label: 'Tous' },
  { value: 'valide', label: 'Valides' },
  { value: 'expireBientot', label: 'Expire bientôt' },
  { value: 'expire', label: 'Expirés' },
]

const columns = computed<ListColumn[]>(() => [
  { key: 'vehiculeType',    label: 'Véhicule',      sortable: true, width: 110 },
  { key: 'vehiculeId',      label: 'ID / Plaque',   sortable: true, width: 120 },
  { key: 'typeDocument',    label: 'Type doc.',      sortable: true, width: 160 },
  { key: 'numero',          label: 'N° doc.',        width: 110 },
  { key: 'dateEmission',    label: 'Émission',       sortable: true, width: 110 },
  { key: 'dateExpiration',  label: 'Expiration',     sortable: true, width: 110 },
  { key: 'statut',          label: 'Statut',         sortable: true, width: 130 },
  { key: 'actions',         label: '',               align: 'center', width: 80 },
])

function getStatut(dateExpiration: string): 'expire' | 'expireBientot' | 'valide' {
  const exp = new Date(dateExpiration); const today = new Date(TODAY)
  const in30 = new Date(TODAY); in30.setDate(in30.getDate() + 30)
  if (exp < today) return 'expire'
  if (exp <= in30) return 'expireBientot'
  return 'valide'
}
function statutLabel(d: string) { return ({ expire: 'Expiré', expireBientot: 'Expire bientôt', valide: 'Valide' } as any)[getStatut(d)] }
function statutClass(d: string) { return ({ expire: 'bg-danger-bg text-danger', expireBientot: 'bg-warning-bg text-warning', valide: 'bg-success-bg text-success' } as any)[getStatut(d)] }
function formatDate(d: string)  { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) }

watch([filterVehiculeType, filterDocType, filterStatut, searchQuery, pageSize], () => { page.value = 1 })
function resetFilters() { filterVehiculeType.value = ''; filterDocType.value = ''; filterStatut.value = ''; searchQuery.value = ''; page.value = 1 }

const filtered = computed(() => store.documents.filter(d => {
  if (filterVehiculeType.value && d.vehiculeType !== filterVehiculeType.value) return false
  if (filterDocType.value && d.type !== filterDocType.value) return false
  if (filterStatut.value && getStatut(d.dateExpiration) !== filterStatut.value) return false
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    if (!d.vehiculeId.toLowerCase().includes(q) && !d.type.toLowerCase().includes(q)) return false
  }
  return true
}))

const totalCount = computed(() => filtered.value.length)
const pageItems  = computed(() => { const s = (page.value - 1) * pageSize.value; return filtered.value.slice(s, s + pageSize.value) })

// Modal
const showModal = ref(false)
const editDoc   = ref<DocumentVehicule | null>(null)
const formError = ref('')

interface FormData { vehiculeId: string; vehiculeType: 'tracteur' | 'remorque'; type: string; ref: string; dateEmission: string; dateExpiration: string; lienFichier: string }
const emptyForm = (): FormData => ({ vehiculeId: '', vehiculeType: 'tracteur', type: 'Carte grise', ref: '', dateEmission: '', dateExpiration: '', lienFichier: '' })
const form = ref<FormData>(emptyForm())

function openDetail(_id: string) { /* panneau latéral suffit */ }

function openModal(doc?: DocumentVehicule) {
  editDoc.value = doc ?? null; formError.value = ''
  form.value = doc ? { vehiculeId: doc.vehiculeId, vehiculeType: doc.vehiculeType as 'tracteur' | 'remorque', type: doc.type, ref: '', dateEmission: doc.dateEmission, dateExpiration: doc.dateExpiration ?? '', lienFichier: '' } : emptyForm()
  showModal.value = true
}
function closeModal() { showModal.value = false; editDoc.value = null; formError.value = '' }

function saveDocument() {
  formError.value = ''
  if (!form.value.vehiculeId.trim()) { formError.value = "L'ID du véhicule est requis."; return }
  if (!form.value.dateEmission) { formError.value = "La date d'émission est requise."; return }
  if (form.value.dateExpiration && form.value.dateExpiration < form.value.dateEmission) { formError.value = "La date d'expiration doit être après la date d'émission."; return }
  const payload = { vehiculeId: form.value.vehiculeId.trim(), vehiculeType: form.value.vehiculeType, type: form.value.type, dateEmission: form.value.dateEmission, dateExpiration: form.value.dateExpiration || undefined }
  if (editDoc.value) store.updateDocument(editDoc.value.id, payload)
  else store.createDocument(payload)
  closeModal()
}

const deleteTargetId = ref<string | null>(null)
function confirmDelete(id: string) { deleteTargetId.value = id }
function executeDelete() { if (deleteTargetId.value) { store.deleteDocument(deleteTargetId.value); deleteTargetId.value = null } }
</script>
