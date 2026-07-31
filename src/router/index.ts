import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore }       from '../stores/auth'
import { useOnboardingStore } from '../stores/onboarding'
import LoginView    from '../views/LoginView.vue'
import DashboardHR  from '../views/DashboardHR.vue'
import DashboardEmployee from '../views/DashboardEmployee.vue'
import CalendarView from '../views/calendar/CalendarView.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'login', component: LoginView },

    // ── Dashboards ──────────────────────────────────────────────
    { path: '/hr',       name: 'hr-dashboard',       component: DashboardHR,       meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/employee', name: 'employee-dashboard',  component: DashboardEmployee, meta: { requiresAuth: true, layout: 'dashboard' } },

    // ── Onboarding ───────────────────────────────────────────────
    { path: '/onboarding', name: 'onboarding', component: () => import('../views/OnboardingWizard.vue') },

    // ── MODULE 1 : Personnel — Congés ────────────────────────────
    { path: '/hr/absences',          name: 'hr-absences',      component: () => import('../views/absences/AbsenceListView.vue'),    meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/hr/absences/balances', name: 'hr-leave-balances', component: () => import('../views/absences/LeaveBalancesView.vue'), meta: { requiresAuth: true, layout: 'dashboard' } },

    // ── MODULE 1 : Personnel — Employés ─────────────────────────
    { path: '/hr/employees',     name: 'hr-employees',      component: () => import('../views/employees/EmployeeListView.vue'),  meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/hr/employees/:id', name: 'hr-employee-detail', component: () => import('../views/employees/EmployeeDetailView.vue'), meta: { requiresAuth: true, layout: 'dashboard' } },

    // ── MODULE 1 : Personnel — Structure ────────────────────────
    { path: '/hr/entities',          name: 'hr-entities',      component: () => import('../views/entities/EntityListView.vue'),   meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/hr/entities/new',      name: 'hr-entity-create',  component: () => import('../views/entities/EntityFormView.vue'),   meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/hr/entities/:id/edit', name: 'hr-entity-edit',    component: () => import('../views/entities/EntityFormView.vue'),   meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/hr/entities/:id',      name: 'hr-entity-detail',  component: () => import('../views/entities/EntityDetailView.vue'), meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/hr/org-chart',         name: 'hr-org-chart',       component: () => import('../views/rh/OrgChartView.vue'),          meta: { requiresAuth: true, layout: 'dashboard' } },

    // ── MODULE 1 : Personnel — RH ────────────────────────────────
    { path: '/hr/missions',           name: 'hr-missions',   component: () => import('../views/missions/MissionListView.vue'),  meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/hr/expenses',           name: 'hr-expenses',   component: () => import('../views/expenses/ExpenseListView.vue'),  meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/hr/contracts', name: 'hr-contracts', component: () => import('../views/placeholders/PlaceholderView.vue'), meta: { requiresAuth: true, title: 'Gestion des Contrats' } },
    { path: '/hr/reports/statistics', name: 'hr-statistics', component: () => import('../views/reports/StatisticsView.vue'),    meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/hr/planning',           name: 'hr-planning',   component: () => import('../views/employee/EmployeePlanningView.vue'), meta: { requiresAuth: true, layout: 'dashboard' } },

    // ── MODULE 1 : Configuration ─────────────────────────────────
    { path: '/hr/config', redirect: '/hr/config/calendar' },
    { path: '/hr/config/calendar',     name: 'hr-config-calendar',     component: CalendarView,                                                        meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/hr/config/leave-types',  name: 'hr-config-leave-types',  redirect: '/hr/config/calendar' },
    { path: '/hr/config/mission-fees', name: 'hr-config-mission-fees', component: () => import('../views/configuration/MissionConfigView.vue'),         meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/hr/config/perdiems',     name: 'hr-config-perdiems',     component: () => import('../views/configuration/PerdiemView.vue'),               meta: { requiresAuth: true, layout: 'dashboard' } },

    // ── MODULE 2 : Véhicules ─────────────────────────────────────
    { path: '/fleet/vehicules', name: 'fleet-vehicules', component: () => import('../views/fleet/VehiculeListView.vue'), meta: { requiresAuth: true, layout: 'dashboard' } },

    // ── MODULE 2 : Conducteurs ────────────────────────────────────
    { path: '/fleet/conducteurs', name: 'fleet-conducteurs', component: () => import('../views/fleet/ConducteurListView.vue'), meta: { requiresAuth: true, layout: 'dashboard' } },

    // ── MODULE 2 : Attelages & Affectations ──────────────────────
    { path: '/fleet/attelages',    name: 'fleet-attelages',    component: () => import('../views/fleet/AttelageView.vue'),     meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/fleet/affectations', name: 'fleet-affectations', component: () => import('../views/fleet/AffectationView.vue'),  meta: { requiresAuth: true, layout: 'dashboard' } },

    // ── MODULE 2 : Sites ─────────────────────────────────────────
    { path: '/fleet/sites', name: 'fleet-sites', component: () => import('../views/fleet/SiteListView.vue'), meta: { requiresAuth: true, layout: 'dashboard' } },

    // ── MODULE 2 : Suivi GPS ─────────────────────────────────────
    { path: '/fleet/carte',      name: 'fleet-carte',      component: () => import('../views/fleet/CarteView.vue'),      meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/fleet/telemetrie', name: 'fleet-telemetrie', component: () => import('../views/fleet/TelemetrieView.vue'), meta: { requiresAuth: true, layout: 'dashboard' } },

    // ── MODULE 2 : Documents ─────────────────────────────────────
    { path: '/fleet/documents', name: 'fleet-documents', component: () => import('../views/fleet/DocumentsVehiculeView.vue'), meta: { requiresAuth: true, layout: 'dashboard' } },

    // ── MODULE 3 : FMS — voyages, conformité, carburant, documents ──
    { path: '/fleet/voyages',        name: 'fleet-voyages',        component: () => import('../views/fleet/VoyageListView.vue'),      meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/fleet/voyages/:id',    name: 'fleet-voyage-detail',  component: () => import('../views/fleet/VoyageDetailView.vue'),    meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/fleet/ecarts',         name: 'fleet-ecarts',         component: () => import('../views/fleet/EcartListView.vue'),       meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/fleet/ecarts/:id',     name: 'fleet-ecart-detail',   component: () => import('../views/fleet/EcartDetailView.vue'),     meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/fleet/configuration', name: 'fleet-configuration', component: () => import('../views/fleet/ConfigurationView.vue'), meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/fleet/carburant',      name: 'fleet-carburant',      component: () => import('../views/fleet/CarburantView.vue'),       meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/fleet/conducteurs/:id',name: 'fleet-conducteur-detail', component: () => import('../views/fleet/ConducteurDetailView.vue'), meta: { requiresAuth: true, layout: 'dashboard' } },
    
    // ── MODULE 2 : Dashboard fleet ────────────────────────────────
    { path: '/fleet', name: 'fleet-dashboard', component: () => import('../views/fleet/FleetDashboardView.vue'), meta: { requiresAuth: true, layout: 'dashboard' } },

    // Redirects anciens URLs tracteurs/remorques
    { path: '/fleet/tracteurs', redirect: '/fleet/vehicules' },
    { path: '/fleet/remorques', redirect: '/fleet/vehicules' },


    // ── Espace Employé ───────────────────────────────────────────
    { path: '/employee/absences',    name: 'employee-absences',    component: () => import('../views/absences/AbsenceRequestView.vue'),       meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/employee/profile',     name: 'employee-profile',     component: () => import('../views/employee/UserProfileView.vue'),          meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/hr/profile',           name: 'hr-profile',           component: () => import('../views/employee/UserProfileView.vue'),          meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/employee/planning',    name: 'employee-planning',    component: () => import('../views/employee/EmployeePlanningView.vue'),     meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/employee/missions',    name: 'employee-missions',    component: () => import('../views/missions/MissionListView.vue'),          meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/employee/expenses',    name: 'employee-expenses',    component: () => import('../views/expenses/ExpenseListView.vue'),          meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/employee/to-validate', name: 'employee-to-validate', component: () => import('../views/employee/ToValidateView.vue'),          meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/employee/team',        name: 'employee-team',        component: () => import('../views/employee/TeamView.vue'),                meta: { requiresAuth: true, layout: 'dashboard' } },
    { path: '/employee/team/balances', name: 'team-balances',      component: () => import('../views/employee/TeamBalancesView.vue'),        meta: { requiresAuth: true, layout: 'dashboard' } },

    // Redirects
    { path: '/hr/calendar', redirect: '/hr/config/calendar' },
    { path: '/rh', redirect: '/hr' },
    { path: '/rh/:pathMatch(.*)*', redirect: (to) => ({ path: '/hr/' + (to.params.pathMatch as string[]).join('/') }) },
    { path: '/employe', redirect: '/employee' },
    { path: '/employe/:pathMatch(.*)*', redirect: (to) => ({ path: '/employee/' + (to.params.pathMatch as string[]).join('/') }) },

    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const auth       = useAuthStore()
  const onboarding = useOnboardingStore()

  if (to.meta.requiresAuth && !auth.isLoggedIn) return { path: '/' }
  if (to.name === 'login' && auth.isLoggedIn) {
    return auth.isHRSide ? { path: '/hr' } : { path: '/employee' }
  }

  if (auth.isLoggedIn) {
    if (to.path.startsWith('/hr') && auth.isEmployeeSide) return { path: '/employee' }
    if (to.path.startsWith('/employee') && auth.isHRSide) return { path: '/hr' }
    if ((auth.isAdmin || auth.isRH) && !onboarding.allStepsComplete && to.path !== '/onboarding') {
      return { path: '/onboarding' }
    }
  }
})

export default router
