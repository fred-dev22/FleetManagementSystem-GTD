<template>
  <div class="px-7 py-6 max-w-5xl">

    <!-- En-tête -->
    <div :class="L.pageHeader">
      <div>
        <div :class="L.pageTitle">Gestion des Attelages</div>
        <div :class="L.pageSub">Couplage tracteurs & remorques</div>
      </div>
    </div>

    <!-- Attelages actifs -->
    <div class="bg-card border border-border rounded-lg overflow-hidden mb-5">
      <div class="flex items-center gap-2 px-4 py-3 border-b border-border bg-primary/5">
        <Link2 class="w-4 h-4 text-primary" />
        <span class="text-[13px] font-semibold text-foreground">Attelages actifs</span>
        <span class="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{{ attelagesActifs.length }}</span>
      </div>
      <div v-if="attelagesActifs.length === 0" class="flex flex-col items-center py-10 gap-2 text-muted-foreground">
        <Link2 class="w-8 h-8" />
        <p class="text-[13px]">Aucun attelage actif pour le moment.</p>
      </div>
      <table v-else class="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th :class="L.th">Tracteur</th>
            <th :class="L.th">Plaque tracteur</th>
            <th :class="L.th">Remorque</th>
            <th :class="L.th">Plaque remorque</th>
            <th :class="L.th">Depuis</th>
            <th :class="L.th">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="att in attelagesActifs" :key="att.id" :class="L.rowHover">
            <td :class="L.td" class="font-medium text-foreground">{{ getTracteurNom(att.tracteurId) }}</td>
            <td :class="L.td">
              <span class="text-[11px] font-bold px-[7px] py-0.5 rounded bg-primary/10 text-primary font-mono tracking-[0.04em]">{{ att.tracteurPlaque }}</span>
            </td>
            <td :class="L.td" class="font-medium text-foreground">{{ getRemorqueNom(att.remorqueId) }}</td>
            <td :class="L.td">
              <span class="text-[11px] font-bold px-[7px] py-0.5 rounded bg-success-bg text-success font-mono tracking-[0.04em]">{{ att.remorquePlaque }}</span>
            </td>
            <td :class="L.td">
              <div class="text-foreground">{{ formatDate(att.dateDebut) }}</div>
              <div class="text-[11px] text-muted-foreground">{{ getDuration(att.dateDebut) }}</div>
            </td>
            <td :class="L.td">
              <button
                class="px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer border border-danger/30 bg-danger-bg text-danger transition-colors hover:bg-danger hover:text-white"
                @click="openDetacherDialog(att)"
              >
                Détacher
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Nouvel attelage -->
    <div class="bg-card border border-border rounded-lg overflow-hidden mb-5">
      <div class="flex items-center gap-2 px-4 py-3 border-b border-border bg-primary/5">
        <Plus class="w-4 h-4 text-primary" />
        <span class="text-[13px] font-semibold text-foreground">Nouvel attelage</span>
      </div>
      <div class="px-5 py-4">
        <div v-if="formError" class="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-danger-bg border border-danger/20 text-danger text-[13px] mb-4">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span class="flex-1">{{ formError }}</span>
          <button @click="formError = ''"><X class="w-3.5 h-3.5" /></button>
        </div>
        <form @submit.prevent="handleAttacher">
          <div class="grid grid-cols-3 gap-4 mb-4 max-md:grid-cols-1">
            <div class="flex flex-col gap-1.5">
              <label class="text-[12px] font-medium text-muted-foreground">Tracteur <span class="text-danger">*</span></label>
              <select v-model="form.tracteurId" :class="['h-[38px] px-3 border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary', tracteurConflict ? 'border-danger' : 'border-border']" required>
                <option value="">— Sélectionner un tracteur —</option>
                <option v-for="t in tracteursDisponibles" :key="t.id" :value="t.id">{{ t.plaque }} — {{ t.marque }} {{ t.modele }}</option>
              </select>
              <p v-if="tracteurConflict" class="text-[11px] text-danger">Ce tracteur a déjà un attelage actif.</p>
              <p v-if="tracteursDisponibles.length === 0" class="text-[11px] text-warning">Tous les tracteurs sont déjà attelés.</p>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[12px] font-medium text-muted-foreground">Remorque <span class="text-danger">*</span></label>
              <select v-model="form.remorqueId" :class="['h-[38px] px-3 border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary', remorqueConflict ? 'border-danger' : 'border-border']" required>
                <option value="">— Sélectionner une remorque —</option>
                <option v-for="r in remorquesDisponibles" :key="r.id" :value="r.id">{{ r.plaque }} — {{ r.type }}</option>
              </select>
              <p v-if="remorqueConflict" class="text-[11px] text-danger">Cette remorque a déjà un attelage actif.</p>
              <p v-if="remorquesDisponibles.length === 0" class="text-[11px] text-warning">Toutes les remorques sont déjà attelées.</p>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[12px] font-medium text-muted-foreground">Date de début <span class="text-danger">*</span></label>
              <input v-model="form.dateDebut" type="date" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary" required />
            </div>
          </div>
          <div class="flex gap-2">
            <button type="submit" :class="L.btnPrimary" :disabled="!form.tracteurId || !form.remorqueId || !form.dateDebut || isSubmitting">
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" /> Attacher
            </button>
            <button type="button" :class="L.btnOutline" @click="resetForm">Réinitialiser</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Historique -->
    <div class="bg-card border border-border rounded-lg overflow-hidden">
      <div class="flex items-center gap-2 px-4 py-3 border-b border-border bg-primary/5">
        <History class="w-4 h-4 text-primary" />
        <span class="text-[13px] font-semibold text-foreground">Historique des attelages</span>
        <button class="ml-auto text-[12px] text-primary hover:underline" @click="showHistorique = !showHistorique">
          {{ showHistorique ? 'Masquer' : 'Afficher' }}
        </button>
      </div>
      <div v-if="showHistorique">
        <div v-if="attelagesHistorique.length === 0" class="flex flex-col items-center py-8 gap-2 text-muted-foreground">
          <p class="text-[13px]">Aucun attelage terminé.</p>
        </div>
        <table v-else class="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th :class="L.th">ID</th>
              <th :class="L.th">Tracteur</th>
              <th :class="L.th">Remorque</th>
              <th :class="L.th">Date début</th>
              <th :class="L.th">Date fin</th>
              <th :class="L.th">Durée</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="att in attelagesHistorique" :key="att.id" :class="L.rowHover">
              <td :class="L.td"><span class="text-[11px] text-muted-foreground font-mono">{{ att.id }}</span></td>
              <td :class="L.td">
                <div class="font-medium text-foreground">{{ getTracteurNom(att.tracteurId) }}</div>
                <span class="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">{{ att.tracteurPlaque }}</span>
              </td>
              <td :class="L.td">
                <div class="font-medium text-foreground">{{ getRemorqueNom(att.remorqueId) }}</div>
                <span class="text-[10px] font-mono bg-success-bg text-success px-1.5 py-0.5 rounded">{{ att.remorquePlaque }}</span>
              </td>
              <td :class="L.td" class="text-muted-foreground">{{ formatDate(att.dateDebut) }}</td>
              <td :class="L.td" class="text-muted-foreground">{{ formatDate(att.dateFin!) }}</td>
              <td :class="L.td" class="text-muted-foreground">{{ getDurationBetween(att.dateDebut, att.dateFin!) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal détacher -->
    <Teleport to="body">
      <div v-if="detachTarget" class="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]" @click.self="detachTarget = null">
        <div class="bg-card rounded-xl w-full max-w-md shadow-2xl border border-border">
          <div class="flex items-center justify-between px-5 py-4 border-b border-border">
            <span class="font-semibold text-foreground">Confirmer le détachement</span>
            <button @click="detachTarget = null" class="text-muted-foreground hover:text-foreground"><X class="w-4 h-4" /></button>
          </div>
          <div class="px-5 py-4 text-[13px] text-foreground space-y-2">
            <p>Voulez-vous détacher :</p>
            <ul class="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong class="text-foreground">Tracteur :</strong> {{ detachTarget.tracteurPlaque }}</li>
              <li><strong class="text-foreground">Remorque :</strong> {{ detachTarget.remorquePlaque }}</li>
            </ul>
            <div class="flex flex-col gap-1.5 pt-2">
              <label class="text-[12px] font-medium text-muted-foreground">Date de fin</label>
              <input v-model="detachDateFin" type="date" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div class="flex justify-end gap-2 px-5 py-3 border-t border-border bg-muted/30 rounded-b-xl">
            <button :class="L.btnOutline" @click="detachTarget = null">Annuler</button>
            <button class="px-4 py-[7px] rounded-md text-[13px] font-medium cursor-pointer inline-flex items-center gap-1.5 bg-danger text-white transition-colors hover:bg-danger/90" @click="confirmDetacher">Détacher</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Link2, Plus, History, AlertCircle, Loader2, X } from 'lucide-vue-next'
import * as L from '../../lib/listClasses'
import { useAttelagesStore } from '../../stores/attelages'
import { useTracteurStore } from '../../stores/tracteurs'
import { useRemorquesStore } from '../../stores/remorques'
import type { Attelage } from '../../types/index'

const attelageStore  = useAttelagesStore()
const tracteurStore  = useTracteurStore()
const remorqueStore  = useRemorquesStore()

const showHistorique = ref(false)
const isSubmitting   = ref(false)
const formError      = ref('')
const detachTarget   = ref<Attelage | null>(null)
const detachDateFin  = ref(today())
const form           = ref({ tracteurId: '', remorqueId: '', dateDebut: today() })

const attelagesActifs    = computed(() => attelageStore.attelages.filter(a => !a.dateFin))
const attelagesHistorique = computed(() =>
  attelageStore.attelages.filter(a => !!a.dateFin).sort((a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime())
)
const attelesIds         = computed(() => new Set(attelagesActifs.value.map(a => a.tracteurId)))
const remorquesAttelesIds = computed(() => new Set(attelagesActifs.value.map(a => a.remorqueId)))

const tracteursDisponibles = computed(() =>
  tracteurStore.tracteurs.filter(t => t.statutAdmin === 'en_service' && !attelesIds.value.has(t.id))
)
const remorquesDisponibles = computed(() =>
  remorqueStore.remorques.filter(r => r.statutAdmin === 'en_service' && !remorquesAttelesIds.value.has(r.id))
)
const tracteurConflict = computed(() => form.value.tracteurId ? attelesIds.value.has(form.value.tracteurId) : false)
const remorqueConflict = computed(() => form.value.remorqueId ? remorquesAttelesIds.value.has(form.value.remorqueId) : false)

function today() { return new Date().toISOString().slice(0, 10) }
function formatDate(d?: string) { return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' }
function getDuration(from: string) {
  const days = Math.floor((Date.now() - new Date(from).getTime()) / 86400000)
  if (days < 1) return 'Aujourd\'hui'; if (days < 30) return `${days} j`; return `${Math.floor(days / 30)} mois`
}
function getDurationBetween(from: string, to: string) {
  const days = Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86400000)
  return days < 30 ? `${days} j` : `${Math.floor(days / 30)} mois`
}
function getTracteurNom(id: string) { const t = tracteurStore.tracteurs.find(x => x.id === id); return t ? `${t.marque} ${t.modele}` : id }
function getRemorqueNom(id: string) { const r = remorqueStore.remorques.find(x => x.id === id); return r ? `${r.type} ${r.capacite ?? ''}`.trim() : id }

function resetForm() { form.value = { tracteurId: '', remorqueId: '', dateDebut: today() }; formError.value = '' }

async function handleAttacher() {
  formError.value = ''
  if (!form.value.tracteurId || !form.value.remorqueId) return
  const tracteur = tracteurStore.tracteurs.find(t => t.id === form.value.tracteurId)
  const remorque = remorqueStore.remorques.find(r => r.id === form.value.remorqueId)
  if (!tracteur || !remorque) return
  isSubmitting.value = true
  try {
    attelageStore.attacher(tracteur.id, tracteur.plaque, remorque.id, remorque.plaque, form.value.dateDebut)
    resetForm()
  } catch (err: any) {
    formError.value = err.message ?? 'Une erreur est survenue.'
  } finally {
    isSubmitting.value = false
  }
}

function openDetacherDialog(att: Attelage) { detachTarget.value = att; detachDateFin.value = today() }
function confirmDetacher() {
  if (!detachTarget.value) return
  try {
    attelageStore.detacher(detachTarget.value.id, detachDateFin.value)
    detachTarget.value = null
  } catch (err: any) {
    formError.value = err.message ?? 'Erreur.'; detachTarget.value = null
  }
}
</script>
