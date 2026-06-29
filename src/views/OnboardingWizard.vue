<template>
  <div class="min-h-screen flex flex-col transition-opacity duration-[250ms]" :class="{ 'opacity-0': leaving }" :style="bgStyle">

    <!-- ── En-tête minimal ── -->
    <header class="h-[60px] shrink-0 bg-card border-b border-border shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-10 flex items-center justify-between max-[480px]:px-4">
      <div class="flex items-center">
        <svg class="h-[34px] w-auto" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="120" height="32" rx="4" fill="#0B4480"/>
          <text x="10" y="22" font-family="Arial,sans-serif" font-size="16" font-weight="800" fill="#FFFFFF" letter-spacing="1">GTD</text>
          <rect x="58" y="6" width="2" height="20" rx="1" fill="#0072C5"/>
          <text x="65" y="15" font-family="Arial,sans-serif" font-size="7" font-weight="600" fill="#E6201C" letter-spacing="0.5">GROUPE DE</text>
          <text x="65" y="24" font-family="Arial,sans-serif" font-size="7" font-weight="600" fill="#FFFFFF" letter-spacing="0.5">TRANSPORT</text>
        </svg>
        <span class="w-px h-5 mx-3.5 bg-border" aria-hidden="true"></span>
        <span class="text-base font-extrabold tracking-[0.05em] text-foreground">GTD Fleet</span>
      </div>
      <span class="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[11px] font-semibold">Configuration initiale</span>
    </header>

    <!-- ── Zone centrale ── -->
    <div class="flex-1 flex flex-col items-center max-w-[860px] w-full mx-auto px-6 py-10 max-md:px-4 max-md:py-6">

      <!-- Titre principal -->
      <div class="text-center mb-10">
        <h1 class="text-[28px] font-extrabold text-foreground m-0 max-md:text-[22px]">Bienvenue sur Productive247 - FMS</h1>
        <p class="text-[15px] text-muted-foreground mt-2">Configurez votre espace en 3 étapes avant de commencer</p>
      </div>

      <!-- Barre de progression -->
      <div class="flex items-start max-w-[600px] w-full mx-auto mb-10">
        <template v-for="(label, i) in STEP_LABELS" :key="label">
          <div class="flex flex-col items-center shrink-0" :class="{ 'cursor-pointer': stepState(i + 1) === 'done' }" @click="i + 1 < ob.currentStep && ob.goToStep(i + 1)">
            <div class="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base transition-all shrink-0"
              :class="stepCircleClass(i + 1)">
              <Check v-if="i + 1 < ob.currentStep" class="w-[18px] h-[18px]" />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span class="text-xs font-medium mt-2 text-center max-md:hidden" :class="stepState(i + 1) === 'pending' ? 'text-muted-foreground' : 'text-primary'">{{ label }}</span>
          </div>
          <div v-if="i < STEP_LABELS.length - 1" class="flex-1 h-[3px] rounded-sm self-center mb-5 transition-colors max-md:mb-0" :class="i + 1 < ob.currentStep ? 'bg-primary' : 'bg-border'"></div>
        </template>
      </div>

      <!-- Card contenu principale -->
      <div class="max-w-[860px] w-full bg-card rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.10)] border border-border overflow-hidden">
        <Transition name="step" mode="out-in">
          <div :key="ob.currentStep">

            <!-- En-tête de la card -->
            <div class="px-7 py-5 border-b border-border bg-background flex items-center gap-3.5 max-md:px-4">
              <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <component :is="currentMeta.icon" class="w-6 h-6 text-primary" />
              </div>
              <div>
                <div class="text-lg font-bold text-foreground">{{ currentMeta.title }}</div>
                <div class="text-[13px] text-muted-foreground mt-1">{{ currentMeta.sub }}</div>
              </div>
            </div>

            <!-- ══ ÉTAPE 1 : Calendrier ══ -->
            <template v-if="ob.currentStep === 1">
              <div :class="cardBody">
                <WorkingDaysConfig />
                <div v-if="calendarStore.daysPerWeek > 0" class="bg-success-bg border border-success rounded-lg px-4 py-2.5 flex items-center gap-2 text-[13px] text-success">
                  <CircleCheck class="w-4 h-4" />
                  {{ calendarStore.daysPerWeek }} jour{{ calendarStore.daysPerWeek > 1 ? 's' : '' }} configuré{{ calendarStore.daysPerWeek > 1 ? 's' : '' }}
                  · {{ calendarStore.formatMinutes(calendarStore.weeklyMinutes) }} par semaine
                </div>
              </div>
              <div :class="[cardFoot, 'justify-end']">
                <button :class="btnPrimary" :disabled="calendarStore.daysPerWeek === 0" @click="ob.nextStep()">Continuer →</button>
              </div>
            </template>

            <!-- ══ ÉTAPE 2 : Structure ══ -->
            <template v-else-if="ob.currentStep === 2">
              <div :class="cardBody">

                <div :class="infoCard">
                  <Info class="w-4 h-4 text-info shrink-0 mt-px" />
                  La Direction Générale a été créée automatiquement.
                  Ajoutez vos entités (départements, services…).
                </div>

                <!-- Liste hiérarchique des entités -->
                <div class="flex flex-col gap-1">
                  <div
                    v-for="{ entity, depth } in flatEntities"
                    :key="entity.id"
                    class="flex items-center gap-2.5 px-2.5 py-2 bg-background border border-border rounded-lg"
                    :style="{ paddingLeft: `${10 + depth * 24}px` }"
                  >
                    <span class="text-[10px] font-bold px-2 py-[3px] rounded whitespace-nowrap shrink-0 tracking-[0.03em]" :class="entTypeBadge(entity.type)">
                      {{ TYPE_LABELS[entity.type] ?? entity.type }}
                    </span>
                    <span class="flex-1 text-[13px] font-medium text-foreground">{{ entity.name }}</span>
                    <span v-if="entity.responsibleName" class="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0">
                      <User class="w-3 h-3" /> {{ entity.responsibleName }}
                    </span>
                  </div>
                </div>

                <div class="flex gap-2 flex-wrap">
                  <button :class="btnOutline" @click="showEntityModal = true">
                    <Plus class="w-4 h-4" /> Ajouter une entité
                  </button>
                  <button :class="btnOutline" @click="handleImportEntities">
                    <Upload class="w-4 h-4" /> Importer depuis un fichier
                  </button>
                </div>
                <ImportComingSoon
                  :is-visible="showEntityImport"
                  message="L'import en masse des entités depuis un fichier Excel/CSV sera disponible prochainement. Cette fonctionnalité permettra d'initialiser rapidement toute votre structure organisationnelle."
                  @close="showEntityImport = false"
                />

              </div>
              <div :class="[cardFoot, 'justify-between max-[480px]:flex-col max-[480px]:gap-2.5 max-[480px]:items-stretch']">
                <button :class="btnOutline" @click="ob.prevStep()">← Précédent</button>
                <div class="flex items-center max-[480px]:flex-col max-[480px]:gap-2.5">
                  <button class="bg-transparent border-0 cursor-pointer text-xs text-muted-foreground mr-3 py-1 transition-colors hover:text-foreground max-[480px]:mr-0" @click="ob.nextStep()">Passer →</button>
                  <span :title="flatEntities.length < 2 ? 'Créez au moins un département pour continuer' : ''">
                    <button :class="btnPrimary" :disabled="flatEntities.length < 2" @click="ob.nextStep()">Continuer →</button>
                  </span>
                </div>
              </div>
            </template>

            <!-- ══ ÉTAPE 3 : Équipe ══ -->
            <template v-else>
              <div :class="cardBody">

                <div :class="infoCard">
                  <Info class="w-4 h-4 text-info shrink-0 mt-px" />
                  Votre compte a été créé automatiquement.
                  Ajoutez les autres membres de votre équipe.
                </div>

                <!-- Liste compacte (uniquement les employés visibles dans le wizard) -->
                <div class="flex flex-col gap-1">
                  <div v-for="emp in obEmployees" :key="emp.id" class="flex items-center gap-2.5 px-2.5 py-2 bg-background border border-border rounded-lg">
                    <UserAvatar :name="emp.name" size="sm" />
                    <span class="text-[13px] font-medium text-foreground">{{ emp.name }}</span>
                    <span class="flex-1 text-xs text-muted-foreground">{{ emp.entityName }}</span>
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary whitespace-nowrap shrink-0">{{ ROLE_LABELS[emp.role] ?? emp.role }}</span>
                  </div>
                </div>

                <div class="flex gap-2 flex-wrap">
                  <button :class="btnOutline" @click="showEmployeeModal = true">
                    <UserPlus class="w-4 h-4" /> Ajouter un employé
                  </button>
                  <button :class="btnOutline" @click="handleImportEmployees">
                    <Upload class="w-4 h-4" /> Importer depuis un fichier
                  </button>
                </div>
                <ImportComingSoon
                  :is-visible="showEmployeeImport"
                  message="L'import en masse des employés depuis un fichier Excel/CSV sera disponible prochainement. Cette fonctionnalité permettra d'initialiser rapidement tous vos collaborateurs."
                  @close="showEmployeeImport = false"
                />

              </div>
              <div :class="[cardFoot, 'justify-between max-[480px]:flex-col max-[480px]:gap-2.5 max-[480px]:items-stretch']">
                <button :class="btnOutline" @click="ob.prevStep()">← Précédent</button>
                <button :class="btnPrimary" @click="finish(true)">Accéder à l'application →</button>
              </div>
            </template>

          </div>
        </Transition>
      </div>

    </div>

    <!-- ── Pied de page ── -->
    <footer class="h-12 shrink-0 bg-card border-t border-border flex items-center justify-center text-[11px] text-muted-foreground">
      Vous pourrez modifier ces configurations à tout moment dans le menu Configuration
    </footer>

    <!-- ── Modals (composants existants réutilisés) ── -->
    <EntityFormModal v-model="showEntityModal" :visible-entity-ids="visibleEntityIds" :visible-employee-ids="visibleEmployeeIds" />
    <EmployeeFormModal v-model="showEmployeeModal" :visible-entity-ids="visibleEntityIds" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, type Component } from 'vue'
import { useRouter } from 'vue-router'
import { Check, CalendarDays, Building, Users, CircleCheck, Info, User, Plus, UserPlus, Upload } from 'lucide-vue-next'
import ImportComingSoon from '../components/ui/ImportComingSoon.vue'
import { useAuthStore }       from '../stores/auth'
import { useCalendarStore }   from '../stores/calendar'
import { useEntityStore }     from '../stores/entities'
import { useEmployeeStore }   from '../stores/employees'
import { useOnboardingStore } from '../stores/onboarding'
import WorkingDaysConfig  from '../components/calendar/WorkingDaysConfig.vue'
import EntityFormModal    from '../components/entities/EntityFormModal.vue'
import EmployeeFormModal  from '../components/employees/EmployeeFormModal.vue'
import UserAvatar         from '../components/ui/UserAvatar.vue'
import type { Entity, Employee } from '../types'

const auth          = useAuthStore()
const calendarStore = useCalendarStore()
const entityStore   = useEntityStore()
const empStore      = useEmployeeStore()
const ob            = useOnboardingStore()
const router        = useRouter()

// ── Classes du design system ─────────────────────────────────
const cardBody = 'px-7 py-6 flex flex-col gap-4 max-md:px-4 max-md:py-5'
const cardFoot = 'px-7 py-4 border-t border-border flex items-center max-md:px-4'
const infoCard = 'bg-info-bg border-l-[3px] border-info rounded-lg px-4 py-3 flex items-start gap-2 text-[13px] text-foreground leading-relaxed'
const btnPrimary = 'inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer border-0 bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap max-[480px]:w-full max-[480px]:justify-center'
const btnOutline = 'inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer bg-card text-foreground border border-border transition-colors hover:bg-background whitespace-nowrap max-[480px]:w-full max-[480px]:justify-center'

// Dégradé de fond (vert clair → blanc → rouge clair Galana)
const bgStyle = {
  background: 'linear-gradient(135deg, var(--galana-green-light) 0%, #ffffff 50%, var(--galana-red-light) 100%)',
}

function stepCircleClass(step: number): string {
  const state = stepState(step)
  if (state === 'pending') return 'bg-card text-muted-foreground border-2 border-border'
  // done / current : cercle plein vert avec halo
  return 'bg-primary text-white shadow-[0_0_0_4px_var(--color-primary-light)]' + (state === 'current' ? ' ob-pulse' : '')
}

function entTypeBadge(type: string): string {
  const m: Record<string, string> = {
    direction:  'bg-danger text-white',
    department: 'bg-success text-white',
    service:    'bg-card text-success border border-success',
  }
  return m[type] ?? 'bg-neutral-bg text-neutral'
}

// Snapshot des IDs pré-existants (mock data) — pris une seule fois au montage
// Les entités/employés créés PENDANT le wizard ne sont pas dans ces sets → ils apparaissent
let preexistingEntityIds   = new Set<string>()
let preexistingEmployeeIds = new Set<string>()

// Vérification auth manuelle (la route n'a pas requiresAuth pour éviter les boucles)
onMounted(() => {
  if (!auth.isLoggedIn)         { router.replace({ path: '/' }); return }
  if (auth.isEmployeeSide)      { router.replace({ path: '/employee' }); return }

  // S'assurer que le RH connecté existe dans le store
  empStore.ensureDefaultEmployee()

  // Snapshot : tout ce qui est déjà là est « mock » → caché dans le wizard
  preexistingEntityIds   = new Set(entityStore.entities.map(e => e.id))
  preexistingEmployeeIds = new Set(empStore.employees.map(e => e.id))
})

// ── Isolation démo ───────────────────────────────────────────────────
// Étape 2 : n'afficher que e1 (Direction Générale) + entités créées PENDANT le wizard
function isVisibleEntity(e: Entity): boolean {
  return e.id === 'e1' || !preexistingEntityIds.has(e.id)
}

// Étape 3 : n'afficher que l'employé RH connecté + employés créés PENDANT le wizard
const obEmployees = computed<Employee[]>(() =>
  empStore.employees.filter(e =>
    e.id === empStore.currentUserEmployee?.id || !preexistingEmployeeIds.has(e.id)
  )
)

const visibleEntityIds   = computed(() => entityStore.entities.filter(isVisibleEntity).map(e => e.id))
const visibleEmployeeIds = computed(() => obEmployees.value.map(e => e.id))

const showEntityModal   = ref(false)
const showEmployeeModal = ref(false)
const leaving           = ref(false)
const showEntityImport   = ref(false)
const showEmployeeImport = ref(false)
function handleImportEntities() { showEntityImport.value = true }
function handleImportEmployees() { showEmployeeImport.value = true }

// ── Steps ────────────────────────────────────────────────────────────
const STEP_LABELS = ['Calendrier', 'Entités', 'Employés'] as const

const STEP_META: Record<number, { icon: Component; title: string; sub: string }> = {
  1: { icon: CalendarDays, title: 'Configurez votre calendrier', sub: 'Définissez les jours et horaires de travail de votre entreprise' },
  2: { icon: Building,     title: 'Créez vos entités',          sub: 'Définissez la structure organisationnelle de votre entreprise' },
  3: { icon: Users,        title: 'Ajoutez vos employés',       sub: 'Créez les comptes de vos collaborateurs' },
}
const currentMeta = computed(() => STEP_META[ob.currentStep]!)

function stepState(step: number): 'done' | 'current' | 'pending' {
  if (step < ob.currentStep)  return 'done'
  if (step === ob.currentStep) return 'current'
  return 'pending'
}

// ── Étape 2 : entités (hiérarchie aplatie depuis buildTree) ──────────
const TYPE_LABELS: Record<string, string> = {
  direction: 'Direction', department: 'Département', service: 'Service',
}

const flatEntities = computed(() => {
  const out: { entity: Entity; depth: number }[] = []
  const walk = (nodes: Entity[], depth: number) => {
    nodes.forEach(n => {
      if (isVisibleEntity(n)) {
        out.push({ entity: n, depth })
        if (n.children) walk(n.children, depth + 1)
      }
    })
  }
  walk(entityStore.buildTree, 0)
  return out
})

// ── Étape 3 : employés ───────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  hr_admin: 'RH Admin', hr_director: 'Dir. RH',
  validator: 'Manager', employee: 'Employé',
}

// ── Fin du wizard ────────────────────────────────────────────────────
function finish(withFade: boolean) {
  if (withFade) {
    leaving.value = true
    setTimeout(() => {
      ob.complete()
      router.push({ path: '/hr' })
    }, 250)
  } else {
    ob.complete()
    router.push({ path: '/hr' })
  }
}
</script>

<style scoped>
/* Animation pulse du cercle d'étape courante + transition entre étapes
   (non exprimables en utilitaires Tailwind) */
.ob-pulse { animation: pulse 2s infinite; }
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 4px var(--color-primary-light); }
  50%      { box-shadow: 0 0 0 10px transparent; }
}

.step-enter-active,
.step-leave-active { transition: all 0.25s ease; }
.step-enter-from { opacity: 0; transform: translateX(16px); }
.step-leave-to   { opacity: 0; transform: translateX(-16px); }
</style>
