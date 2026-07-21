<template>
  <aside class="w-[220px] shrink-0 bg-sidebar border-r border-sidebar-border py-2.5 px-[5px] overflow-y-auto overflow-x-hidden hidden md:block">

    <!-- ══════════ CÔTÉ RH ══════════ -->
    <template v-if="auth.isHRSide">

      <!-- MODULE : Administration / Personnel -->
      <template v-if="navStore.activeModule === 'administration'">
        <SidebarSection label="Tableau de bord">
          <SidebarItem :icon="LayoutDashboard" label="Vue d'ensemble"  :to="{ name: 'hr-dashboard' }" />
          <SidebarItem :icon="CalendarRange"   label="Mon planning"    :to="{ name: 'hr-planning' }" />
        </SidebarSection>

        <SidebarSection label="Congés & Absences">
          <SidebarItem :icon="CalendarOff" label="Demandes" :to="{ name: 'hr-absences' }"      :badge="pendingCount" />
          <SidebarItem :icon="PieChart"    label="Soldes"   :to="{ name: 'hr-leave-balances' }" />
        </SidebarSection>

        <SidebarSection label="Personnel">
          <SidebarItem :icon="Users"    label="Employés"      :to="{ name: 'hr-employees' }" />
          <SidebarItem :icon="Building" label="Départements"  :to="{ name: 'hr-entities' }" :force-active="route.name === 'hr-entity-detail'" />
          <SidebarItem :icon="Network"  label="Organigramme"  :to="{ name: 'hr-org-chart' }" />
        </SidebarSection>

        <SidebarSection label="RH">
          <SidebarItem :icon="Plane"   label="Missions"   :to="{ name: 'hr-missions' }" />
          <SidebarItem :icon="Receipt" label="Frais"      :to="{ name: 'hr-expenses' }" />
        </SidebarSection>

        <SidebarSection label="Configuration">
          <SidebarItem :icon="CalendarDays" label="Calendrier"      :to="{ name: 'hr-config-calendar' }" />
          <SidebarItem :icon="Coins"        label="Frais & Per diem" :to="{ name: 'hr-config-mission-fees' }" />
        </SidebarSection>
      </template>

      <!-- MODULE : Véhicules (Fleet) -->
      <template v-else-if="navStore.activeModule === 'fleet'">
        <SidebarSection label="Tableau de bord">
          <SidebarItem :icon="LayoutDashboard" label="Vue d'ensemble"  :to="{ name: 'fleet-dashboard' }" />
          <SidebarItem :icon="MapPin"          label="Carte temps réel" :to="{ name: 'fleet-carte' }" />
        </SidebarSection>

        <SidebarSection label="Parc véhicules">
          <SidebarItem :icon="Truck"       label="Véhicules"    :to="{ name: 'fleet-vehicules' }" />
          <SidebarItem :icon="UserCheck2"  label="Conducteurs"  :to="{ name: 'fleet-conducteurs' }" />
          <SidebarItem :icon="Link2"       label="Attelages"    :to="{ name: 'fleet-attelages' }" />
          <SidebarItem :icon="UserCheck"   label="Affectations" :to="{ name: 'fleet-affectations' }" />
        </SidebarSection>

        <SidebarSection label="Suivi & Télémétrie">
          <SidebarItem :icon="Route" label="Trajets"    :to="{ name: 'fleet-trajets' }" />
          <SidebarItem :icon="Cpu"   label="Télémétrie" :to="{ name: 'fleet-telemetrie' }" />
        </SidebarSection>

        <SidebarSection label="Sites & Géofences">
          <SidebarItem :icon="MapPinned" label="Sites" :to="{ name: 'fleet-sites' }" />
        </SidebarSection>

        <SidebarSection label="Documents">
          <SidebarItem :icon="FileText" label="Documents" :to="{ name: 'fleet-documents' }" />
        </SidebarSection>
      </template>

    </template>

    <!-- ══════════ CÔTÉ EMPLOYÉ / VALIDATEUR ══════════ -->
    <template v-else>
      <SidebarSection label="Mon espace">
        <SidebarItem :icon="LayoutDashboard" label="Tableau de bord" :to="{ name: 'employee-dashboard' }" />
        <SidebarItem :icon="CalendarRange"   label="Mon planning"    :to="{ name: 'employee-planning' }" />
      </SidebarSection>

      <SidebarSection label="Mes demandes">
        <SidebarItem :icon="CalendarOff" label="Congés & Absences" :to="{ name: 'employee-absences' }" :badge="myPendingCount" />
        <SidebarItem :icon="Plane"       label="Mes missions"      :to="{ name: 'employee-missions' }" />
        <SidebarItem :icon="Receipt"     label="Notes de frais"    :to="{ name: 'employee-expenses' }" />
      </SidebarSection>

      <template v-if="auth.isValidator">
        <SidebarSection label="Mon équipe">
          <SidebarItem :icon="ClipboardCheck" label="À valider" :to="{ name: 'employee-to-validate' }" :badge="pendingCount" :badge-orange="true" />
          <SidebarItem :icon="Users"          label="Membres"   :to="{ name: 'employee-team' }" />
          <SidebarItem :icon="PieChart"       label="Soldes équipe" :to="{ name: 'team-balances' }" />
        </SidebarSection>
      </template>
    </template>

  </aside>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, type Component, type PropType } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  LayoutDashboard, CalendarRange, CalendarOff, PieChart, Users, Building, Plane,
  Receipt, Network, CalendarDays, Coins,
  FileText, ClipboardCheck,
  // Fleet icons
  Truck, Link2, UserCheck, UserCheck2, MapPin, MapPinned, Route, Cpu,
} from 'lucide-vue-next'
import { useAuthStore }       from '../stores/auth'
import { useNavigationStore } from '../stores/navigation'
import { useAbsenceStore }    from '../stores/absences'

const auth         = useAuthStore()
const navStore     = useNavigationStore()
const absenceStore = useAbsenceStore()
const route        = useRoute()

const pendingCount   = computed(() => absenceStore.pendingLeaves.length)
const myPendingCount = computed(() => absenceStore.myPendingLeaves.length)

const itemClass =
  'flex items-center gap-2 py-[7px] pr-4 pl-6 text-[13px] text-sidebar-foreground/75 cursor-pointer transition-colors no-underline select-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
const itemActiveClass =
  'bg-sidebar-accent text-white font-semibold border-l-[3px] border-sidebar-primary pl-[21px]'
const badgeClass =
  'ml-auto bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-px rounded-full'
const badgeOrangeClass =
  'ml-auto bg-orange-500 text-white text-[9px] font-bold px-1.5 py-px rounded-full'

const SidebarSection = defineComponent({
  props: { label: String },
  setup(props, { slots }) {
    return () => h('div', { class: 'mb-1' }, [
      h('div', { class: 'text-[10px] font-bold text-sidebar-foreground/50 uppercase tracking-[0.07em] pt-2 pb-1 pr-4 pl-5' }, props.label),
      slots.default?.(),
    ])
  },
})

const SidebarItem = defineComponent({
  props: {
    icon:        { type: [Object, Function] as PropType<Component>, required: true },
    label:       { type: String,  required: true },
    to:          { type: Object,  required: true },
    badge:       { type: Number,  default: 0 },
    badgeOrange: { type: Boolean, default: false },
    forceActive: { type: Boolean, default: false },
  },
  setup(props) {
    return () => {
      const iconEl  = h(props.icon, { class: 'w-4 h-4 shrink-0', 'aria-hidden': 'true' })
      const labelEl = h('span', { class: 'flex-1' }, props.label)
      const badgeEl = props.badge > 0
        ? h('span', { class: props.badgeOrange ? badgeOrangeClass : badgeClass }, String(props.badge))
        : null
      const children = [iconEl, labelEl, badgeEl].filter(Boolean)
      return h(RouterLink, {
        to: props.to,
        class: props.forceActive ? [itemClass, itemActiveClass] : itemClass,
        activeClass: itemActiveClass,
      }, () => children)
    }
  },
})
</script>
