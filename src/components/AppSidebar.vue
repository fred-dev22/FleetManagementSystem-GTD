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
    <SidebarItem :icon="LayoutDashboard" label="Vue d'ensemble"   :to="{ name: 'fleet-dashboard' }" />
    <SidebarItem :icon="MapPin"          label="Carte temps réel" :to="{ name: 'fleet-carte' }" />
  </SidebarSection>

  <!-- ── NOUVEAU : l'exploitation ── -->
  <SidebarSection label="Exploitation">
    <SidebarItem :icon="Package"     label="Voyages"    :to="{ name: 'fleet-voyages' }" />
    <!-- <SidebarItem :icon="Route"       label="Trajets"    :to="{ name: 'fleet-trajets' }" /> -->
    <SidebarItem :icon="ShieldAlert" label="Conformité" :to="{ name: 'fleet-ecarts' }" />
    <SidebarItem :icon="Fuel"        label="Carburant"  :to="{ name: 'fleet-carburant' }" />
  </SidebarSection>

  <SidebarSection label="Parc véhicules">
    <SidebarItem :icon="Truck"      label="Véhicules"    :to="{ name: 'fleet-vehicules' }" />
    <SidebarItem :icon="ClipboardList"  label="État de flotte" :to="{ name: 'fleet-etat-flotte' }" />
    <SidebarItem :icon="ClipboardCheck" label="Contrôles"      :to="{ name: 'fleet-controles' }" />
    <SidebarItem :icon="ShieldCheck"    label="Départs"        :to="{ name: 'fleet-autorisations' }" />
    <SidebarItem :icon="ShieldAlert"    label="Assurances"     :to="{ name: 'fleet-assurances' }" />
    <SidebarItem :icon="UserCheck2" label="Conducteurs"  :to="{ name: 'fleet-conducteurs' }" />
    <SidebarItem :icon="Link2"      label="Attelages"    :to="{ name: 'fleet-attelages' }" />
    <SidebarItem :icon="UserCheck"  label="Affectations" :to="{ name: 'fleet-affectations' }" />
  </SidebarSection>

  <SidebarSection label="Suivi & Télémétrie">
    <SidebarItem :icon="Cpu"   label="Télémétrie" :to="{ name: 'fleet-telemetrie' }" />
  </SidebarSection>

  <SidebarSection label="Sites & Géofences">
    <SidebarItem :icon="MapPinned" label="Sites" :to="{ name: 'fleet-sites' }" />
  </SidebarSection>

  <!-- <SidebarSection label="Registres">
    <SidebarItem :icon="ClipboardCheck" label="Registres" :to="{ name: 'fleet-registres' }" />
  </SidebarSection> -->

  <SidebarSection label="Documents">
    <SidebarItem :icon="FileText" label="Documents" :to="{ name: 'fleet-documents' }" />
  </SidebarSection>

  <!-- Toutes les données de référence en un seul endroit -->
  <SidebarSection label="Paramétrage">
    <SidebarItem :icon="Settings" label="Configuration" :to="{ name: 'fleet-configuration' }" />
  </SidebarSection>
</template>

<template v-else-if="navStore.activeModule === 'maintenance'">
  <!-- ═══════════════════════════════════════════════════════
       MODULE MAINTENANCE
       Écrans propres à l'atelier et aux interventions, séparés
       de l'exploitation de la flotte.
       ═══════════════════════════════════════════════════════ -->
  <SidebarSection label="Tableau de bord">
    <SidebarItem :icon="LayoutGrid"     label="Vue d'ensemble"    :to="{ name: 'maintenance-dashboard' }" />
  </SidebarSection>

  <SidebarSection label="Atelier">
    <SidebarItem :icon="Wrench"         label="Interventions"     :to="{ name: 'maintenance-ordres' }" />
    <SidebarItem :icon="CalendarClock"  label="Échéances"         :to="{ name: 'maintenance-echeances' }" />
    <SidebarItem :icon="ClipboardList"  label="Charge atelier"    :to="{ name: 'maintenance-atelier' }" />
    <SidebarItem :icon="Users"          label="Équipe mobile"     :to="{ name: 'maintenance-equipe-mobile' }" />
  </SidebarSection>

  <SidebarSection label="Suivi & Fiabilité">
    <SidebarItem :icon="Gauge"          label="Fiabilité"         :to="{ name: 'maintenance-fiabilite' }" />
    <SidebarItem :icon="CalendarOff"    label="Immobilisations"   :to="{ name: 'maintenance-indisponibilites' }" />
  </SidebarSection>

  <SidebarSection label="Paramétrage">
    <SidebarItem :icon="ClipboardList"  label="Plans d'entretien" :to="{ name: 'maintenance-plans' }" />
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
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  Building, CalendarClock, CalendarDays, CalendarOff, CalendarRange, ClipboardCheck, ClipboardList, Coins, Cpu, FileText, Fuel, Gauge, LayoutDashboard, LayoutGrid, Link2, MapPin, MapPinned, Network, Package, PieChart, Plane, Receipt, Route, Settings, ShieldAlert, ShieldCheck, Truck, UserCheck, UserCheck2, Users, Wrench,
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
    const router = useRouter()

    /**
     * Garde défensive.
     *
     * RouterLink lève une exception si la route nommée n'existe pas, et
     * l'exception interrompt le rendu de TOUT ce qui suit dans la barre —
     * les sections suivantes disparaissent sans message d'erreur visible.
     *
     * On vérifie donc l'existence de la route avant de créer le lien.
     * Une entrée dont la route manque s'affiche grisée et non cliquable,
     * au lieu de faire disparaître la moitié du menu.
     */
    const routeExiste = computed(() => {
      const nom = (props.to as { name?: string }).name
      if (!nom) return true          // chemin littéral : rien à vérifier
      return router.hasRoute(nom)
    })

    return () => {
      const iconEl  = h(props.icon, { class: 'w-4 h-4 shrink-0', 'aria-hidden': 'true' })
      const labelEl = h('span', { class: 'flex-1' }, props.label)
      const badgeEl = props.badge > 0
        ? h('span', { class: props.badgeOrange ? badgeOrangeClass : badgeClass }, String(props.badge))
        : null
      const children = [iconEl, labelEl, badgeEl].filter(Boolean)

      if (!routeExiste.value) {
        return h('div', {
          class: itemClass + ' opacity-40 cursor-not-allowed',
          title: 'Écran non installé',
        }, children)
      }

      return h(RouterLink, {
        to: props.to,
        class: props.forceActive ? [itemClass, itemActiveClass] : itemClass,
        activeClass: itemActiveClass,
      }, () => children)
    }
  },
})
</script>