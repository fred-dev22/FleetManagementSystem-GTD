<template>
  <div class="min-h-screen bg-[#f5f7fa] pb-10">

    <!-- ── Not found ── -->
    <div v-if="!employee" class="flex flex-col items-center justify-center py-32 gap-4 text-gray-400">
      <UserX class="w-14 h-14" />
      <p class="text-lg font-medium">Employé introuvable</p>
      <button :class="btnOutline" @click="$router.back()">Retour</button>
    </div>

    <template v-else>
      <!-- ═══════════════════════════════════════════════
           HEADER CARD
      ════════════════════════════════════════════════ -->
      <div class="bg-white border-b border-gray-200 shadow-sm">
        <div class="max-w-5xl mx-auto px-6 py-5 flex flex-wrap gap-4 items-center">

          <!-- Avatar -->
          <div
            class="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0 shadow"
            :style="{ background: employee.avatarBg, color: employee.avatarText }"
          >
            {{ employee.initials }}
          </div>

          <!-- Name + badges -->
          <div class="flex-1 min-w-0">
            <h1 class="text-xl font-bold text-[#1a3c6e] truncate">{{ employee.name }}</h1>
            <div class="flex flex-wrap gap-2 mt-1.5">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1a3c6e]/10 text-[#1a3c6e]">
                {{ employee.fonction }}
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                {{ employee.societe }}
              </span>
              <span :class="statutClass(employee.status)" class="px-2.5 py-0.5 rounded-full text-xs font-semibold">
                {{ statutLabel(employee.status) }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 shrink-0">
            <button :class="btnOutline" @click="goEdit">
              <Pencil class="w-4 h-4" /> Modifier
            </button>

            <!-- Changer le statut dropdown -->
            <div class="relative" ref="statusMenuRef">
              <button :class="btnPrimary" @click="statusMenuOpen = !statusMenuOpen">
                Changer le statut <ChevronDown class="w-4 h-4" />
              </button>
              <div
                v-if="statusMenuOpen"
                class="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 text-sm"
              >
                <button
                  v-for="opt in statutOptions"
                  :key="opt.value"
                  class="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                  :class="{ 'opacity-40 cursor-not-allowed': opt.value === employee.status }"
                  :disabled="opt.value === employee.status"
                  @click="requestStatusChange(opt.value)"
                >
                  <span :class="statutClass(opt.value)" class="w-2 h-2 rounded-full inline-block"></span>
                  {{ opt.label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="max-w-5xl mx-auto px-6 flex gap-0 border-t border-gray-100 overflow-x-auto">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors"
            :class="activeTab === tab.key
              ? 'border-[#1a3c6e] text-[#1a3c6e]'
              : 'border-transparent text-gray-500 hover:text-gray-700'"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════
           CONTENT
      ════════════════════════════════════════════════ -->
      <div class="max-w-5xl mx-auto px-6 pt-6">

        <!-- ── TAB 1 : Informations ── -->
        <div v-if="activeTab === 'info'" class="grid grid-cols-1 md:grid-cols-2 gap-5">

          <!-- Identité -->
          <div :class="card">
            <h2 :class="cardTitle"><IdCard class="w-4 h-4" /> Identité</h2>
            <dl class="space-y-2.5">
              <InfoRow label="CIN" :value="employee.cin" />
              <InfoRow label="Nom complet" :value="employee.name" />
              <InfoRow label="Date de naissance" :value="fmtDate(employee.dateNaissance)" />
              <InfoRow label="Email" :value="employee.email" />
              <InfoRow label="Téléphone" :value="employee.telephone ?? '—'" />
            </dl>
          </div>

          <!-- Contrat -->
          <div :class="card">
            <h2 :class="cardTitle"><FileText class="w-4 h-4" /> Contrat</h2>
            <dl class="space-y-2.5">
              <InfoRow label="Société" :value="employee.societe" />
              <InfoRow label="Type de contrat" :value="employee.contractType" />
              <InfoRow label="Date d'embauche" :value="fmtDate(employee.hireDate)" />
              <InfoRow
                v-if="employee.contractType === 'CDD' && employee.dateFinContrat"
                label="Date fin contrat"
                :value="fmtDate(employee.dateFinContrat)"
              />
            </dl>
          </div>

          <!-- Affectation -->
          <div :class="card" class="md:col-span-2">
            <h2 :class="cardTitle"><Briefcase class="w-4 h-4" /> Affectation</h2>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <dl class="space-y-2.5">
                <InfoRow label="Fonction" :value="employee.fonction" />
              </dl>
              <dl class="space-y-2.5">
                <InfoRow label="Département" :value="employee.departement" />
              </dl>
              <dl class="space-y-2.5">
                <InfoRow label="Manager" :value="employee.managerNom ?? '—'" />
              </dl>
            </div>
          </div>
        </div>

        <!-- ── TAB 2 : Documents ── -->
        <div v-else-if="activeTab === 'documents'" class="space-y-5">

          <!-- Documents RH standards -->
          <div :class="card">
            <h2 :class="cardTitle"><FolderOpen class="w-4 h-4" /> Documents administratifs</h2>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th class="pb-2 pr-4 font-medium">Document</th>
                    <th class="pb-2 pr-4 font-medium">Date</th>
                    <th class="pb-2 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr v-for="doc in rhDocuments" :key="doc.label" class="hover:bg-gray-50">
                    <td class="py-2.5 pr-4 font-medium text-gray-700">{{ doc.label }}</td>
                    <td class="py-2.5 pr-4 text-gray-500">{{ doc.date ?? '—' }}</td>
                    <td class="py-2.5">
                      <span :class="docStatutClass(doc.statut)" class="px-2 py-0.5 rounded-full text-xs font-semibold">
                        {{ doc.statut }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Documents chauffeur -->
          <template v-if="isChauffeur">
            <!-- Permis de conduire -->
            <div :class="card">
              <h2 :class="cardTitle"><CreditCard class="w-4 h-4" /> Permis de conduire</h2>
              <div v-if="employee.permis" class="space-y-3">
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <dl>
                    <dt class="text-xs text-gray-400 mb-0.5">Numéro</dt>
                    <dd class="font-mono text-sm text-gray-800">{{ employee.permis.numero }}</dd>
                  </dl>
                  <dl>
                    <dt class="text-xs text-gray-400 mb-0.5">Catégories</dt>
                    <dd class="flex gap-1 flex-wrap">
                      <span
                        v-for="cat in employee.permis.categories"
                        :key="cat"
                        class="px-1.5 py-0.5 rounded bg-[#1a3c6e]/10 text-[#1a3c6e] text-xs font-bold"
                      >{{ cat }}</span>
                    </dd>
                  </dl>
                  <dl>
                    <dt class="text-xs text-gray-400 mb-0.5">Expiration</dt>
                    <dd class="text-sm text-gray-800">{{ fmtDate(employee.permis.dateExpiration) }}</dd>
                  </dl>
                </div>
                <!-- Alert jours restants -->
                <div
                  v-if="permisJoursRestants !== null"
                  :class="permisJoursRestants < 30
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-amber-50 border-amber-200 text-amber-700'"
                  class="flex items-center gap-2 text-sm border rounded-lg px-3 py-2"
                >
                  <AlertTriangle class="w-4 h-4 shrink-0" />
                  <span>
                    <strong>{{ permisJoursRestants }} jour(s)</strong> avant expiration du permis
                    <span v-if="permisJoursRestants < 30" class="font-semibold"> — Renouvellement urgent</span>
                  </span>
                </div>
              </div>
              <p v-else class="text-sm text-gray-400 italic">Aucun permis enregistré.</p>
            </div>

            <!-- Visite médicale -->
            <div :class="card">
              <h2 :class="cardTitle"><Stethoscope class="w-4 h-4" /> Visite médicale</h2>
              <div v-if="employee.visiteMedicale" class="space-y-3">
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <dl>
                    <dt class="text-xs text-gray-400 mb-0.5">Date de visite</dt>
                    <dd class="text-sm text-gray-800">{{ fmtDate(employee.visiteMedicale.dateVisite) }}</dd>
                  </dl>
                  <dl>
                    <dt class="text-xs text-gray-400 mb-0.5">Expiration</dt>
                    <dd class="text-sm text-gray-800">{{ fmtDate(employee.visiteMedicale.dateExpiration) }}</dd>
                  </dl>
                  <dl>
                    <dt class="text-xs text-gray-400 mb-0.5">Aptitude</dt>
                    <dd>
                      <span
                        :class="employee.visiteMedicale.apte
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'"
                        class="px-2 py-0.5 rounded-full text-xs font-semibold"
                      >{{ employee.visiteMedicale.apte ? 'Apte' : 'Inapte' }}</span>
                    </dd>
                  </dl>
                </div>
                <div
                  v-if="visiteJoursRestants !== null && visiteJoursRestants < 60"
                  :class="visiteJoursRestants < 30
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-amber-50 border-amber-200 text-amber-700'"
                  class="flex items-center gap-2 text-sm border rounded-lg px-3 py-2"
                >
                  <AlertTriangle class="w-4 h-4 shrink-0" />
                  <span>
                    <strong>{{ visiteJoursRestants }} jour(s)</strong> avant expiration de la visite médicale
                    <span v-if="visiteJoursRestants < 30" class="font-semibold"> — Planifier rapidement</span>
                  </span>
                </div>
              </div>
              <p v-else class="text-sm text-gray-400 italic">Aucune visite médicale enregistrée.</p>
            </div>
          </template>
        </div>

        <!-- ── TAB 3 : Historique ── -->
        <div v-else-if="activeTab === 'historique'" class="space-y-5">
          <div :class="card">
            <h2 :class="cardTitle"><Clock class="w-4 h-4" /> Historique des modifications</h2>
            <div v-if="historique.length === 0" class="text-sm text-gray-400 italic py-4 text-center">
              Aucune modification enregistrée.
            </div>
            <ol v-else class="relative border-l-2 border-[#1a3c6e]/20 ml-3 space-y-5 mt-2">
              <li
                v-for="(item, idx) in historique"
                :key="idx"
                class="pl-5 relative"
              >
                <span class="absolute -left-[9px] top-1 w-3.5 h-3.5 rounded-full bg-[#1a3c6e] border-2 border-white shadow"></span>
                <p class="text-xs text-gray-400 mb-1">
                  {{ fmtDatetime(item.date) }}
                  <span class="mx-1">·</span>
                  <span class="text-[#1a3c6e] font-medium">{{ item.parUserName }}</span>
                </p>
                <p class="text-sm text-gray-700">
                  Champ <span class="font-semibold text-gray-900">{{ item.champ }}</span> modifié :
                </p>
                <div class="flex flex-wrap gap-2 mt-1 text-xs">
                  <span class="px-2 py-0.5 bg-red-50 text-red-600 rounded line-through">{{ item.ancienneVal || '—' }}</span>
                  <span class="text-gray-400">→</span>
                  <span class="px-2 py-0.5 bg-green-50 text-green-700 rounded font-medium">{{ item.nouvelleVal || '—' }}</span>
                </div>
              </li>
            </ol>
          </div>
        </div>

        <!-- ── TAB 4 : Affectations véhicule (Chauffeur only) ── -->
        <div v-else-if="activeTab === 'affectations'" class="space-y-5">
          <div :class="card">
            <h2 :class="cardTitle"><Truck class="w-4 h-4" /> Affectations tracteur</h2>
            <div v-if="affectationsChauffeur.length === 0" class="text-sm text-gray-400 italic py-4 text-center">
              Aucune affectation enregistrée.
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th class="pb-2 pr-4 font-medium">ID</th>
                    <th class="pb-2 pr-4 font-medium">Tracteur</th>
                    <th class="pb-2 pr-4 font-medium">Début</th>
                    <th class="pb-2 pr-4 font-medium">Fin</th>
                    <th class="pb-2 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr
                    v-for="aff in affectationsChauffeur"
                    :key="aff.id"
                    class="hover:bg-gray-50"
                  >
                    <td class="py-2.5 pr-4 font-mono text-gray-500 text-xs">{{ aff.id }}</td>
                    <td class="py-2.5 pr-4 font-medium text-gray-800">{{ aff.tracteurPlaque }}</td>
                    <td class="py-2.5 pr-4 text-gray-600">{{ fmtDate(aff.dateDebut) }}</td>
                    <td class="py-2.5 pr-4 text-gray-600">{{ aff.dateFin ? fmtDate(aff.dateFin) : '—' }}</td>
                    <td class="py-2.5">
                      <span
                        :class="!aff.dateFin
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'"
                        class="px-2 py-0.5 rounded-full text-xs font-semibold"
                      >
                        {{ !aff.dateFin ? 'Active' : 'Terminée' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </template>

    <!-- ── Modal changement statut ── -->
    <Teleport to="body">
      <div
        v-if="statusChangeTarget"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        @click.self="statusChangeTarget = null"
      >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h3 class="text-base font-bold text-[#1a3c6e] mb-1">Changer le statut</h3>
          <p class="text-sm text-gray-500 mb-4">
            Nouveau statut :
            <span :class="statutClass(statusChangeTarget)" class="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold">
              {{ statutLabel(statusChangeTarget) }}
            </span>
          </p>
          <div
            v-if="statusChangeTarget === 'suspendu' || statusChangeTarget === 'sorti'"
            class="mb-4"
          >
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              Motif <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="statusChangeMotif"
              rows="3"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c6e]/40 resize-none"
              placeholder="Expliquez le motif du changement de statut…"
            />
          </div>
          <p v-if="statusChangeError" class="text-sm text-red-600 mb-3">{{ statusChangeError }}</p>
          <div class="flex justify-end gap-2">
            <button :class="btnOutline" @click="statusChangeTarget = null">Annuler</button>
            <button :class="btnPrimary" @click="confirmStatusChange">Confirmer</button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>

  <EmployeeFormModal
    v-if="employee"
    v-model="showEditModal"
    :edit-id="employee.id"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Pencil, ChevronDown, AlertTriangle, UserX,
  IdCard, FileText, Briefcase, FolderOpen, CreditCard,
  Stethoscope, Clock, Truck,
} from 'lucide-vue-next'
import { useEmployeeStore } from '../../stores/employees'
import { useAffectationsChauffeursStore } from '../../stores/affectationsChauffeurs'
import EmployeeFormModal from '../../components/employees/EmployeeFormModal.vue'
import type { EmployeeStatus } from '../../types/index'

// ── Sub-components ─────────────────────────────────────
const InfoRow = {
  props: ['label', 'value'],
  template: `
    <div class="flex justify-between gap-4 text-sm">
      <dt class="text-gray-400 shrink-0">{{ label }}</dt>
      <dd class="text-gray-800 font-medium text-right">{{ value ?? '—' }}</dd>
    </div>
  `,
}

// ── Stores / Route ──────────────────────────────────────
const route  = useRoute()
const router = useRouter()
const empStore = useEmployeeStore()
const affStore = useAffectationsChauffeursStore()

const employee = computed(() => empStore.getById(route.params.id as string))
const isChauffeur = computed(() => employee.value?.fonction === 'Chauffeur')

// ── Tabs ────────────────────────────────────────────────
const tabs = computed(() => {
  const base = [
    { key: 'info',       label: 'Informations' },
    { key: 'documents',  label: 'Documents' },
    { key: 'historique', label: 'Historique' },
  ]
  if (isChauffeur.value) base.push({ key: 'affectations', label: 'Affectations véhicule' })
  return base
})
const activeTab = ref('info')

// ── Documents RH ────────────────────────────────────────
type DocStatut = 'Valide' | 'Expiré' | 'Manquant'

function mockDoc(label: string): { label: string; date: string | null; statut: DocStatut } {
  // In a real app these come from the employee record; here we use illustrative stubs
  const emp = employee.value
  if (!emp) return { label, date: null, statut: 'Manquant' }
  // Stub: CNAPS and Mutuelle valid for active, missing for others
  if (emp.status === 'actif') return { label, date: emp.hireDate, statut: 'Valide' }
  return { label, date: null, statut: 'Manquant' }
}

const rhDocuments = computed(() => [
  mockDoc('CNAPS'),
  mockDoc('Mutuelle'),
  mockDoc('Contrat signé'),
])

// ── Permis / Visite jours restants ──────────────────────
function daysUntil(dateStr: string): number {
  const now  = new Date()
  const exp  = new Date(dateStr)
  return Math.ceil((exp.getTime() - now.getTime()) / 86_400_000)
}

const permisJoursRestants = computed(() => {
  const d = employee.value?.permis?.dateExpiration
  if (!d) return null
  const n = daysUntil(d)
  return n <= 90 ? n : null   // only show alert when <= 90 days
})

const visiteJoursRestants = computed(() => {
  const d = employee.value?.visiteMedicale?.dateExpiration
  if (!d) return null
  const n = daysUntil(d)
  return n <= 60 ? n : null
})

// ── Historique ──────────────────────────────────────────
const historique = computed(() => employee.value?.historiqueModifs ?? [])

// ── Affectations chauffeur ──────────────────────────────
const affectationsChauffeur = computed(() => {
  if (!employee.value) return []
  return affStore.historiqueParChauffeur(employee.value.id)
})

// ── Status menu ─────────────────────────────────────────
const statusMenuOpen  = ref(false)
const statusMenuRef   = ref<HTMLElement | null>(null)
const statusChangeTarget = ref<EmployeeStatus | null>(null)
const statusChangeMotif  = ref('')
const statusChangeError  = ref('')

const statutOptions: { value: EmployeeStatus; label: string }[] = [
  { value: 'actif',     label: 'Actif' },
  { value: 'en_conge',  label: 'En congé' },
  { value: 'suspendu',  label: 'Suspendu' },
  { value: 'sorti',     label: 'Sorti' },
]

function requestStatusChange(val: EmployeeStatus) {
  statusMenuOpen.value  = false
  statusChangeTarget.value = val
  statusChangeMotif.value  = ''
  statusChangeError.value  = ''
}

function confirmStatusChange() {
  if (!employee.value || !statusChangeTarget.value) return
  const result = empStore.changeStatut(
    employee.value.id,
    statusChangeTarget.value,
    statusChangeMotif.value || undefined,
  )
  if (!result.success) {
    statusChangeError.value = result.error
    return
  }
  statusChangeTarget.value = null
}

// Close dropdown on outside click
function onDocClick(e: MouseEvent) {
  if (statusMenuRef.value && !statusMenuRef.value.contains(e.target as Node)) {
    statusMenuOpen.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', onDocClick))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick))

// ── Edit modal ───────────────────────────────────────────
const showEditModal = ref(false)
function goEdit() { if (employee.value) showEditModal.value = true }

// ── Helpers ─────────────────────────────────────────────
function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDatetime(d: string | null | undefined): string {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d ?? '—'
  return dt.toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function statutLabel(s: EmployeeStatus): string {
  const map: Record<EmployeeStatus, string> = {
    actif:    'Actif',
    en_conge: 'En congé',
    suspendu: 'Suspendu',
    sorti:    'Sorti',
  }
  return map[s] ?? s
}

function statutClass(s: EmployeeStatus): string {
  const map: Record<EmployeeStatus, string> = {
    actif:    'bg-green-100 text-green-700',
    en_conge: 'bg-sky-100 text-sky-700',
    suspendu: 'bg-amber-100 text-amber-700',
    sorti:    'bg-red-100 text-red-700',
  }
  return map[s] ?? 'bg-gray-100 text-gray-600'
}

function docStatutClass(s: DocStatut): string {
  if (s === 'Valide')   return 'bg-green-100 text-green-700'
  if (s === 'Expiré')   return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-500'
}

// ── Styles ──────────────────────────────────────────────
const card     = 'bg-white rounded-xl border border-gray-200 shadow-sm p-5'
const cardTitle = 'flex items-center gap-2 text-sm font-semibold text-[#1a3c6e] mb-4 uppercase tracking-wide'
const btnPrimary = 'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1a3c6e] text-white text-sm font-medium hover:bg-[#15325c] transition-colors'
const btnOutline = 'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors'
</script>
