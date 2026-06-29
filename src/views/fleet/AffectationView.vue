<template>
  <div class="px-7 py-6 max-w-5xl">

    <!-- En-tête -->
    <div :class="L.pageHeader">
      <div>
        <div :class="L.pageTitle">Affectations Chauffeurs</div>
        <div :class="L.pageSub">Gestion des affectations chauffeur–tracteur</div>
      </div>
    </div>

    <!-- Affectations actives -->
    <div class="bg-card border border-border rounded-lg overflow-hidden mb-5">
      <div class="flex items-center gap-2 px-4 py-3 border-b border-border bg-primary/5">
        <UserCheck class="w-4 h-4 text-primary" />
        <span class="text-[13px] font-semibold text-foreground">Affectations actives</span>
        <span class="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{{ affectationsActives.length }}</span>
      </div>
      <div v-if="affectationsActives.length === 0" class="flex flex-col items-center py-10 gap-2 text-muted-foreground">
        <UserCheck class="w-8 h-8" />
        <p class="text-[13px]">Aucune affectation active pour le moment.</p>
      </div>
      <table v-else class="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th :class="L.th">Chauffeur</th>
            <th :class="L.th">Tracteur</th>
            <th :class="L.th">Depuis</th>
            <th :class="L.th">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="aff in affectationsActives" :key="aff.id" :class="L.rowHover">
            <td :class="L.td">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" :style="getAvatarStyle(aff.chauffeurId)">
                  {{ getInitiales(aff.chauffeurNom) }}
                </div>
                <div>
                  <div class="font-medium text-foreground">{{ aff.chauffeurNom }}</div>
                  <div class="text-[11px] text-muted-foreground">{{ getChauffeurFonction(aff.chauffeurId) }}</div>
                </div>
              </div>
            </td>
            <td :class="L.td">
              <span class="text-[11px] font-bold px-[7px] py-0.5 rounded bg-primary/10 text-primary font-mono tracking-[0.04em]">{{ aff.tracteurPlaque }}</span>
              <div class="text-[11px] text-muted-foreground mt-0.5">{{ getTracteurInfo(aff.tracteurId) }}</div>
            </td>
            <td :class="L.td">
              <div class="text-foreground">{{ formatDate(aff.dateDebut) }}</div>
              <div class="text-[11px] text-muted-foreground">{{ getDuration(aff.dateDebut) }}</div>
            </td>
            <td :class="L.td">
              <button
                class="px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer border border-danger/30 bg-danger-bg text-danger transition-colors hover:bg-danger hover:text-white"
                @click="openTerminerDialog(aff)"
              >
                Terminer
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Nouvelle affectation -->
    <div class="bg-card border border-border rounded-lg overflow-hidden mb-5">
      <div class="flex items-center gap-2 px-4 py-3 border-b border-border bg-primary/5">
        <Plus class="w-4 h-4 text-primary" />
        <span class="text-[13px] font-semibold text-foreground">Nouvelle affectation</span>
      </div>
      <div class="px-5 py-4">
        <div v-if="formError" class="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-danger-bg border border-danger/20 text-danger text-[13px] mb-4">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span class="flex-1">{{ formError }}</span>
          <button class="text-danger hover:opacity-70" @click="formError = ''"><X class="w-3.5 h-3.5" /></button>
        </div>
        <form @submit.prevent="handleAffecter">
          <div class="grid grid-cols-3 gap-4 mb-4 max-md:grid-cols-1">
            <div class="flex flex-col gap-1.5">
              <label class="text-[12px] font-medium text-muted-foreground">Chauffeur <span class="text-danger">*</span></label>
              <select v-model="form.chauffeurId" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary" required>
                <option value="">— Sélectionner un chauffeur —</option>
                <option v-for="c in chauffeursDisponibles" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
              <p v-if="chauffeursDisponibles.length === 0" class="text-[11px] text-warning">Aucun chauffeur disponible.</p>
              <div v-if="documentWarnings.length > 0" class="flex flex-col gap-1 mt-1">
                <div v-for="w in documentWarnings" :key="w" class="flex items-center gap-1.5 text-[11px] text-warning bg-warning-bg border border-warning/20 rounded px-2 py-1">
                  <AlertCircle class="w-3 h-3 shrink-0" /> {{ w }}
                </div>
              </div>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[12px] font-medium text-muted-foreground">Tracteur <span class="text-danger">*</span></label>
              <select v-model="form.tracteurId" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary" required>
                <option value="">— Sélectionner un tracteur —</option>
                <option v-for="t in tracteursDisponibles" :key="t.id" :value="t.id">{{ t.plaque }} — {{ t.marque }} {{ t.modele }}</option>
              </select>
              <p v-if="tracteursDisponibles.length === 0" class="text-[11px] text-warning">Aucun tracteur disponible.</p>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[12px] font-medium text-muted-foreground">Date de début <span class="text-danger">*</span></label>
              <input v-model="form.dateDebut" type="date" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary" required />
            </div>
          </div>
          <div class="flex gap-2">
            <button type="submit" :class="L.btnPrimary" :disabled="!form.chauffeurId || !form.tracteurId || !form.dateDebut || isSubmitting">
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" /> Affecter
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
        <span class="text-[13px] font-semibold text-foreground">Historique des affectations</span>
        <button class="ml-auto text-[12px] text-primary hover:underline" @click="showHistorique = !showHistorique">
          {{ showHistorique ? 'Masquer' : 'Afficher' }}
        </button>
      </div>
      <div v-if="showHistorique">
        <div v-if="affectationsHistorique.length === 0" class="flex flex-col items-center py-8 gap-2 text-muted-foreground">
          <p class="text-[13px]">Aucune affectation terminée.</p>
        </div>
        <table v-else class="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th :class="L.th">ID</th>
              <th :class="L.th">Chauffeur</th>
              <th :class="L.th">Tracteur</th>
              <th :class="L.th">Date début</th>
              <th :class="L.th">Date fin</th>
              <th :class="L.th">Durée</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="aff in affectationsHistorique" :key="aff.id" :class="L.rowHover">
              <td :class="L.td"><span class="text-[11px] text-muted-foreground font-mono">{{ aff.id }}</span></td>
              <td :class="L.td" class="font-medium">{{ aff.chauffeurNom }}</td>
              <td :class="L.td"><span class="text-[11px] font-bold px-[7px] py-0.5 rounded bg-primary/10 text-primary font-mono tracking-[0.04em]">{{ aff.tracteurPlaque }}</span></td>
              <td :class="L.td" class="text-muted-foreground">{{ formatDate(aff.dateDebut) }}</td>
              <td :class="L.td" class="text-muted-foreground">{{ formatDate(aff.dateFin!) }}</td>
              <td :class="L.td" class="text-muted-foreground">{{ getDurationBetween(aff.dateDebut, aff.dateFin!) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal terminer -->
    <Teleport to="body">
      <div v-if="terminerTarget" class="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]" @click.self="terminerTarget = null">
        <div class="bg-card rounded-xl w-full max-w-md shadow-2xl border border-border">
          <div class="flex items-center justify-between px-5 py-4 border-b border-border">
            <span class="font-semibold text-foreground">Terminer l'affectation</span>
            <button @click="terminerTarget = null" class="text-muted-foreground hover:text-foreground"><X class="w-4 h-4" /></button>
          </div>
          <div class="px-5 py-4 text-[13px] text-foreground space-y-2">
            <p>Voulez-vous terminer l'affectation de :</p>
            <ul class="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong class="text-foreground">Chauffeur :</strong> {{ terminerTarget.chauffeurNom }}</li>
              <li><strong class="text-foreground">Tracteur :</strong> {{ terminerTarget.tracteurPlaque }}</li>
            </ul>
            <div class="flex flex-col gap-1.5 pt-2">
              <label class="text-[12px] font-medium text-muted-foreground">Date de fin</label>
              <input v-model="terminerDateFin" type="date" class="h-[38px] px-3 border border-border rounded-md bg-background text-[13px] text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div class="flex justify-end gap-2 px-5 py-3 border-t border-border bg-muted/30 rounded-b-xl">
            <button :class="L.btnOutline" @click="terminerTarget = null">Annuler</button>
            <button class="px-4 py-[7px] rounded-md text-[13px] font-medium cursor-pointer inline-flex items-center gap-1.5 bg-danger text-white transition-colors hover:bg-danger/90" @click="confirmTerminer">Terminer</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { UserCheck, Plus, History, AlertCircle, Loader2, X } from 'lucide-vue-next'
import * as L from '../../lib/listClasses'
import { useAffectationsChauffeursStore } from '../../stores/affectationsChauffeurs'
import { useTracteurStore } from '../../stores/tracteurs'
import { useEmployeeStore } from '../../stores/employees'
import type { AffectationChauffeur } from '../../types/index'

const affectationStore = useAffectationsChauffeursStore()
const tracteurStore    = useTracteurStore()
const employeesStore   = useEmployeeStore()

const showHistorique  = ref(false)
const isSubmitting    = ref(false)
const formError       = ref('')
const terminerTarget  = ref<AffectationChauffeur | null>(null)
const terminerDateFin = ref(today())

const form = ref({ chauffeurId: '', tracteurId: '', dateDebut: today() })

const affectationsActives   = computed(() => affectationStore.affectations.filter(a => !a.dateFin))
const affectationsHistorique = computed(() =>
  affectationStore.affectations.filter(a => !!a.dateFin).sort((a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime())
)
const affectesIds        = computed(() => new Set(affectationsActives.value.map(a => a.chauffeurId)))
const tracteurAffectesIds = computed(() => new Set(affectationsActives.value.map(a => a.tracteurId)))

const chauffeursDisponibles = computed(() =>
  employeesStore.employees.filter(e => e.status === 'actif' && e.fonction === 'Chauffeur' && !affectesIds.value.has(e.id))
)
const tracteursDisponibles = computed(() =>
  tracteurStore.tracteurs.filter(t => t.statutAdmin === 'en_service' && !tracteurAffectesIds.value.has(t.id))
)
const documentWarnings = computed((): string[] => {
  if (!form.value.chauffeurId) return []
  const emp = employeesStore.employees.find(e => e.id === form.value.chauffeurId)
  if (!emp) return []
  const warnings: string[] = []
  const now = Date.now(), SOON = 30 * 86400000
  const permisExpiry = (emp as any).permisExpiry
  if (permisExpiry) {
    const diff = new Date(permisExpiry).getTime() - now
    if (diff < 0) warnings.push('Permis de conduire expiré.')
    else if (diff < SOON) warnings.push(`Permis expire le ${formatDate(permisExpiry)}.`)
  }
  return warnings
})

function today()            { return new Date().toISOString().slice(0, 10) }
function formatDate(d?: string) { return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' }
function getDuration(from: string) {
  const days = Math.floor((Date.now() - new Date(from).getTime()) / 86400000)
  if (days < 1) return 'Aujourd\'hui'
  if (days < 30) return `${days} j`
  return `${Math.floor(days / 30)} mois`
}
function getDurationBetween(from: string, to: string) {
  const days = Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86400000)
  return days < 30 ? `${days} j` : `${Math.floor(days / 30)} mois`
}
function getTracteurInfo(id: string) {
  const t = tracteurStore.tracteurs.find(x => x.id === id)
  return t ? `${t.marque} ${t.modele}` : ''
}
function getChauffeurFonction(id: string) {
  return employeesStore.employees.find(e => e.id === id)?.fonction ?? 'Chauffeur'
}
function getInitiales(nom: string) {
  return nom.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}
const AVATAR_COLORS = [
  { bg: '#dbeafe', text: '#1d4ed8' }, { bg: '#dcfce7', text: '#166534' },
  { bg: '#fef3c7', text: '#92400e' }, { bg: '#fce7f3', text: '#9d174d' },
  { bg: '#ede9fe', text: '#5b21b6' },
]
function getAvatarStyle(id: string) {
  const c = AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length]!
  return { background: c.bg, color: c.text }
}

function resetForm() { form.value = { chauffeurId: '', tracteurId: '', dateDebut: today() }; formError.value = '' }

async function handleAffecter() {
  formError.value = ''
  if (!form.value.chauffeurId || !form.value.tracteurId) return
  const chauffeur = employeesStore.employees.find(e => e.id === form.value.chauffeurId)
  const tracteur  = tracteurStore.tracteurs.find(t => t.id === form.value.tracteurId)
  if (!chauffeur || !tracteur) return
  isSubmitting.value = true
  try {
    affectationStore.affecter(chauffeur.id, chauffeur.name, tracteur.id, tracteur.plaque, form.value.dateDebut)
    resetForm()
  } catch (err: any) {
    formError.value = err.message ?? 'Une erreur est survenue.'
  } finally {
    isSubmitting.value = false
  }
}

function openTerminerDialog(aff: AffectationChauffeur) { terminerTarget.value = aff; terminerDateFin.value = today() }
function confirmTerminer() {
  if (!terminerTarget.value) return
  try {
    affectationStore.terminerAffectation(terminerTarget.value.id, terminerDateFin.value)
    terminerTarget.value = null
  } catch (err: any) {
    formError.value = err.message ?? 'Erreur.'
    terminerTarget.value = null
  }
}
</script>
