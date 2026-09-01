<template>
  <div class="px-7 py-6 max-md:p-4">

    <!-- En-tête -->
    <div class="flex items-start justify-between gap-4 mb-5 flex-wrap">
      <div>
        <h1 class="text-xl font-bold text-foreground">Soldes de mon équipe</h1>
        <p class="text-[13px] text-muted-foreground mt-0.5">{{ entityName }} — {{ teamRows.length }} membre(s)</p>
      </div>
    </div>

    <!-- Alerte soldes critiques -->
    <div v-if="criticalCount > 0" class="flex items-start gap-2.5 mb-4 px-4 py-3 rounded-md border-l-4 border-warning bg-warning-bg text-[13px] text-foreground leading-relaxed">
      <AlertTriangle class="w-4 h-4 text-warning shrink-0 mt-px" />
      <span>{{ criticalCount }} membre(s) ont un solde de congé annuel critique (&lt; 20&nbsp;% restant). Pensez à planifier leurs congés dès maintenant.</span>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-4 gap-2.5 mb-4 max-md:grid-cols-2">
      <div :class="kpiCard">
        <div :class="kpiIcon" class="bg-success-bg"><Users class="w-[18px] h-[18px] text-success" /></div>
        <div><div :class="kpiVal">{{ teamRows.length }}</div><div :class="kpiLbl">Membres</div></div>
      </div>
      <div :class="kpiCard">
        <div :class="kpiIcon" class="bg-primary/10"><Sun class="w-[18px] h-[18px] text-primary" /></div>
        <div><div :class="kpiVal">{{ avgAnnualBalance }}j</div><div :class="kpiLbl">Solde annuel moyen</div></div>
      </div>
      <div :class="kpiCard">
        <div :class="kpiIcon" class="bg-danger-bg"><AlertTriangle class="w-[18px] h-[18px] text-danger" /></div>
        <div><div :class="kpiVal">{{ criticalCount }}</div><div :class="kpiLbl">Soldes critiques</div></div>
      </div>
      <div :class="kpiCard">
        <div :class="kpiIcon" class="bg-warning-bg"><CalendarOff class="w-[18px] h-[18px] text-warning" /></div>
        <div><div :class="kpiVal">{{ absentToday }}</div><div :class="kpiLbl">Absents aujourd'hui</div></div>
      </div>
    </div>

    <!-- Note mise à jour mensuelle -->
    <div class="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-3">
      <Clock class="w-3 h-3" />
      Les soldes sont mis à jour automatiquement le 1er de chaque mois
    </div>

    <!-- Tableau -->
    <div class="bg-card border border-border rounded-[10px] overflow-hidden">
      <table class="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th :class="th">Employé</th>
            <th v-for="col in TYPE_COLS" :key="col.key" :class="[th, 'text-center']" style="min-width:120px">{{ col.label }}</th>
            <th :class="[th, 'text-center']" style="width:90px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in teamRows" :key="row.employeeId" class="hover:bg-background">
            <td :class="td">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" :style="{ background: row.avatarBg, color: row.avatarText }">{{ row.initials }}</div>
                <div>
                  <div class="text-[13px] font-medium text-foreground">{{ row.employeeName }}</div>
                  <div class="text-[11px] text-muted-foreground">{{ row.jobTitle }}</div>
                </div>
              </div>
            </td>
            <td v-for="col in TYPE_COLS" :key="col.key" :class="[td, 'text-center']">
              <template v-if="bal(row, col.type)">
                <div class="text-sm font-semibold text-foreground mb-1">{{ bal(row, col.type)!.remaining }}j</div>
                <div class="h-1 bg-border rounded-sm overflow-hidden mb-[3px] mx-auto w-20">
                  <div class="h-full rounded-sm" :style="barStyle(bal(row, col.type)!)"></div>
                </div>
                <div class="text-[10px] text-muted-foreground">{{ bal(row, col.type)!.used }}j / {{ bal(row, col.type)!.total }}j</div>
              </template>
              <span v-else class="text-muted-foreground">—</span>
            </td>
            <td :class="[td, 'text-center']">
              <router-link :to="{ name: 'employee-to-validate' }" class="text-[11px] font-medium text-info no-underline hover:underline inline-flex items-center gap-0.5 whitespace-nowrap">
                Voir <ArrowRight class="w-3 h-3" />
              </router-link>
            </td>
          </tr>
          <tr v-if="teamRows.length === 0">
            <td :colspan="TYPE_COLS.length + 2" class="text-center py-10 text-muted-foreground text-[13px]">
              <Users class="w-8 h-8 mx-auto mb-2 opacity-40" />
              Aucun membre dans votre équipe
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Users, Sun, AlertTriangle, CalendarOff, Clock, ArrowRight } from 'lucide-vue-next'
import { useAuthStore }     from '../../stores/auth'
import { useAbsenceStore }  from '../../stores/absences'
import { useEmployeeStore } from '../../stores/employees'

const auth         = useAuthStore()
const absenceStore = useAbsenceStore()
const empStore     = useEmployeeStore()

const TODAY = new Date().toISOString().slice(0, 10)

const entityName  = computed(() => auth.user?.entityName ?? '')
const teamMembers = computed(() => empStore.getByEntityId(auth.user?.entityId ?? ''))

interface BalanceCell { used: number; total: number; remaining: number }
interface TeamRow {
  employeeId:   string
  employeeName: string
  jobTitle:     string
  initials:     string
  avatarBg:     string
  avatarText:   string
  balances:     Record<string, BalanceCell>
}

const teamRows = computed<TeamRow[]>(() =>
  teamMembers.value.map(m => {
    const found = absenceStore.employeeBalances.find(b => b.employeeId === m.id)
    return {
      employeeId:   m.id,
      employeeName: m.name,
      jobTitle:     m.jobTitle,
      initials:     m.initials,
      avatarBg:     m.avatarBg,
      avatarText:   m.avatarText,
      balances:     (found?.balances ?? {}) as Record<string, BalanceCell>,
    }
  })
)

const TYPE_COLS = [
  { key: 'annual',   type: 'Congé annuel',  label: 'Congé annuel'  },
  { key: 'recovery', type: 'Récupération',  label: 'Récupération'  },
  { key: 'sick',     type: 'Congé maladie', label: 'Maladie'       },
  { key: 'remote',   type: 'Télétravail',   label: 'Télétravail'   },
] as const

function bal(row: TeamRow, type: string): BalanceCell | null {
  const b = row.balances[type]
  return (b && b.total > 0) ? b : null
}

const criticalCount = computed(() =>
  teamRows.value.filter(r => {
    const b = r.balances['Congé annuel']
    return b && b.total > 0 && b.remaining / b.total < 0.2
  }).length
)

const avgAnnualBalance = computed(() => {
  const vals = teamRows.value
    .map(r => r.balances['Congé annuel']?.remaining ?? 0)
    .filter(v => v > 0)
  if (!vals.length) return 0
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
})

const absentToday = computed(() =>
  teamMembers.value.filter(m =>
    absenceStore.allLeaves.some(l =>
      l.employeeId === m.id &&
      l.status === 'approved' &&
      l.startDate <= TODAY &&
      l.endDate   >= TODAY
    )
  ).length
)

function barStyle(b: BalanceCell) {
  if (!b || b.total === 0) return {}
  const pct    = (b.used / b.total) * 100
  const remain = b.remaining / b.total
  const color  = remain > 0.5 ? 'var(--color-success)' : remain > 0.2 ? 'var(--color-warning)' : 'var(--color-danger)'
  return { width: `${Math.min(100, pct)}%`, background: color }
}

const kpiCard = 'bg-card border border-border rounded-[10px] p-3.5 flex items-center gap-3'
const kpiIcon = 'w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0'
const kpiVal  = 'text-[22px] font-bold text-foreground leading-none'
const kpiLbl  = 'text-[11px] text-muted-foreground mt-0.5'
const th = 'text-left px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-[0.06em] bg-background border-b border-border'
const td = 'px-3 py-2.5 border-b border-border text-foreground'
</script>