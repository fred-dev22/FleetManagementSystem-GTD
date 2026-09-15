<template>
  <div class="px-7 py-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Tableau de bord Flotte</h1>
        <p class="text-sm text-muted-foreground mt-1">{{ formattedDate }}</p>
      </div>
      <RouterLink :to="{ name: 'fleet-carte' }"
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium no-underline hover:bg-primary/15 transition-colors">
        <Activity class="w-4 h-4" />
        Temps réel
      </RouterLink>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted-foreground font-medium">Tracteurs actifs</p>
            <p class="text-3xl font-bold text-foreground mt-1">{{ tracteursActifs }}</p>
            <p class="text-xs text-muted-foreground mt-1">sur {{ vehStore.tracteurs.length }} au total</p>
          </div>
          <div class="p-2.5 rounded-lg bg-primary/10">
            <Truck class="w-5 h-5 text-primary" />
          </div>
        </div>
        <div class="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div class="h-full rounded-full bg-primary transition-all" :style="{ width: pct(tracteursActifs, vehStore.tracteurs.length) + '%' }" />
        </div>
      </div>

      <div class="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted-foreground font-medium">Remorques actives</p>
            <p class="text-3xl font-bold text-foreground mt-1">{{ remorquesActives }}</p>
            <p class="text-xs text-muted-foreground mt-1">sur {{ vehStore.remorques.length }} au total</p>
          </div>
          <div class="p-2.5 rounded-lg bg-blue-500/10">
            <Truck class="w-5 h-5 text-blue-500" />
          </div>
        </div>
        <div class="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div class="h-full rounded-full bg-blue-500 transition-all" :style="{ width: pct(remorquesActives, vehStore.remorques.length) + '%' }" />
        </div>
      </div>

      <div class="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted-foreground font-medium">Chauffeurs disponibles</p>
            <p class="text-3xl font-bold text-foreground mt-1">{{ chauffeursDisponibles.length }}</p>
            <p class="text-xs text-muted-foreground mt-1">sur {{ empStore.chauffeurs.length }} au total</p>
          </div>
          <div class="p-2.5 rounded-lg bg-emerald-500/10">
            <Users class="w-5 h-5 text-emerald-500" />
          </div>
        </div>
        <div class="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div class="h-full rounded-full bg-emerald-500 transition-all" :style="{ width: pct(chauffeursDisponibles.length, empStore.chauffeurs.length) + '%' }" />
        </div>
      </div>

      <div class="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted-foreground font-medium">Alertes documents</p>
            <p class="text-3xl font-bold text-destructive mt-1">{{ docsStore.countAlertes }}</p>
            <p class="text-xs text-muted-foreground mt-1">nécessitent attention</p>
          </div>
          <div class="p-2.5 rounded-lg bg-destructive/10">
            <FileWarning class="w-5 h-5 text-destructive" />
          </div>
        </div>
        <div class="mt-3 flex items-center gap-1.5">
          <span class="inline-flex items-center gap-1 text-xs font-medium text-destructive">
            <AlertTriangle class="w-3 h-3" />
            {{ docsStore.documentsExpires.length }} critiques
          </span>
          <span class="text-muted-foreground text-xs">·</span>
          <span class="text-xs text-muted-foreground">{{ docsStore.documentsExpiresSous30Jours.length }} avertissements</span>
        </div>
      </div>
    </div>

    <!-- Operational Status -->
    <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div class="flex items-center gap-2 mb-4">
        <Activity class="w-4 h-4 text-primary" />
        <h2 class="font-semibold text-foreground">Statut opérationnel</h2>
      </div>
      <div class="flex flex-wrap gap-3">
        <div v-for="s in repartitionOp" :key="s.key"
          class="flex items-center gap-2 px-4 py-2.5 rounded-full border font-medium text-sm cursor-default select-none transition-colors"
          :class="s.classes">
          <Circle class="w-2.5 h-2.5 fill-current" />
          <span>{{ s.label }}</span>
          <span class="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold" :class="s.badgeClasses">{{ s.count }}</span>
        </div>
      </div>
    </div>

    <!-- Bottom Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <!-- Dernières alertes -->
      <div class="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <AlertTriangle class="w-4 h-4 text-destructive" />
            <h2 class="font-semibold text-foreground">Dernières alertes</h2>
          </div>
          <span class="text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted">{{ alertesTriees.length }} alertes</span>
        </div>
        <div class="space-y-3 max-h-[360px] overflow-y-auto">
          <div v-for="d in alertesTriees" :key="d.id"
            class="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
            <div class="mt-0.5 w-2 h-2 rounded-full flex-shrink-0" :class="estExpire(d) ? 'bg-destructive' : 'bg-amber-500'" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-medium text-foreground truncate">{{ plaqueDe(d.entityId) }}</p>
                <span class="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                  :class="estExpire(d) ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600'">
                  {{ estExpire(d) ? 'Critique' : 'Avertissement' }}
                </span>
              </div>
              <p class="text-xs text-muted-foreground mt-0.5">{{ d.type }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">Expire: <span class="font-medium">{{ fmtDate(d.dateExpiration) }}</span></p>
            </div>
          </div>
          <div v-if="!alertesTriees.length" class="text-center text-muted-foreground text-sm py-8">Aucune alerte en cours.</div>
        </div>
      </div>

      <!-- Véhicules récents -->
      <div class="lg:col-span-3 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <MapPin class="w-4 h-4 text-primary" />
            <h2 class="font-semibold text-foreground">Véhicules récents</h2>
          </div>
          <RouterLink :to="{ name: 'fleet-vehicules' }" class="text-xs text-primary hover:underline font-medium">Voir tout</RouterLink>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-3 pr-4">ID</th>
                <th class="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-3 pr-4">Plaque</th>
                <th class="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-3 pr-4">Chauffeur</th>
                <th class="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-3 pr-4">Statut</th>
                <th class="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-3">Dernière position</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="v in vehiculesRecents" :key="v.id" class="hover:bg-muted/40 transition-colors">
                <td class="py-3 pr-4">
                  <span class="font-mono text-xs font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{{ v.id }}</span>
                </td>
                <td class="py-3 pr-4"><span class="font-semibold text-foreground">{{ v.plaque }}</span></td>
                <td class="py-3 pr-4">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {{ (chauffeurDe(v.id) ?? '-').charAt(0) }}
                    </div>
                    <span class="text-foreground truncate max-w-[100px]">{{ chauffeurDe(v.id) ?? 'Non affecté' }}</span>
                  </div>
                </td>
                <td class="py-3 pr-4">
                  <span class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" :class="opClasses(v.statutOp)">
                    <span class="w-1.5 h-1.5 rounded-full bg-current" />
                    {{ LIB_STATUT_OP[v.statutOp ?? 'arrete'] }}
                  </span>
                </td>
                <td class="py-3">
                  <div class="flex items-center gap-1 text-muted-foreground">
                    <MapPin class="w-3 h-3 flex-shrink-0" />
                    <span class="text-xs truncate max-w-[120px]">{{ v.position ? 'Position GPS active' : '-' }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Véhicules immobilisés - manquait entièrement côté GTD -->
    <div v-if="vehiculesImmobilises.length" class="rounded-xl border border-destructive/25 bg-card overflow-hidden">
      <div class="flex items-center gap-2 px-5 py-3 bg-destructive/10 border-b border-destructive/15">
        <AlertTriangle class="w-4 h-4 text-destructive shrink-0" />
        <span class="text-sm font-semibold text-destructive">{{ vehiculesImmobilises.length }} véhicule(s) immobilisé(s)</span>
      </div>
      <div class="divide-y divide-border">
        <RouterLink v-for="v in vehiculesImmobilises" :key="v.id" :to="{ name: 'fleet-vehicules' }"
          class="flex items-center gap-3 px-5 py-3 no-underline text-foreground hover:bg-muted/40 transition-colors">
          <div class="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0"><Truck class="w-4 h-4 text-muted-foreground" /></div>
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium truncate">{{ v.plaque }} · {{ v.marque }} {{ v.modele }}</div>
            <div class="text-xs text-muted-foreground">{{ motifImmobilisation(v.id) }}</div>
          </div>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-destructive/10 text-destructive shrink-0">
            {{ LIB_STATUT_ADMIN[v.statutAdmin] ?? v.statutAdmin }}
          </span>
        </RouterLink>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Attelages et conducteurs - manquait entièrement côté GTD -->
      <div class="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div class="flex items-center gap-2 mb-4">
          <Link2 class="w-4 h-4 text-primary" />
          <h2 class="font-semibold text-foreground">Attelages et conducteurs</h2>
        </div>
        <div class="flex flex-col gap-2 max-h-[340px] overflow-y-auto">
          <div v-for="t in vehStore.tracteurs" :key="t.id" class="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
            <span class="font-mono text-xs font-semibold text-primary w-[85px] shrink-0">{{ t.plaque }}</span>
            <span class="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0" :class="opClasses(t.statutOp)">
              {{ LIB_STATUT_OP[t.statutOp ?? 'arrete'] }}
            </span>
            <ArrowRight class="w-3 h-3 text-muted-foreground shrink-0" />
            <span class="text-xs flex-1 min-w-0 truncate">
              <template v-if="remorqueDe(t.id)">{{ remorqueDe(t.id) }}</template>
              <span v-else class="italic text-muted-foreground">Non attelé</span>
            </span>
            <div v-if="chauffeurDe(t.id)" class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
              {{ chauffeurDe(t.id)!.charAt(0) }}
            </div>
            <span class="text-xs text-muted-foreground w-[140px] shrink-0 truncate">{{ chauffeurDe(t.id) ?? 'Non affecté' }}</span>
          </div>
        </div>
      </div>

      <!-- Répartition du parc - manquait entièrement côté GTD -->
      <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div class="flex items-center gap-2 mb-4">
          <ChartColumn class="w-4 h-4 text-primary" />
          <h2 class="font-semibold text-foreground">Répartition du parc</h2>
        </div>
        <div class="flex flex-col gap-2.5">
          <div v-for="s in repartitionParc" :key="s.statut" class="flex items-center gap-2.5">
            <span class="w-2 h-2 rounded-full shrink-0" :class="s.couleur"></span>
            <span class="text-sm flex-1">{{ LIB_STATUT_ADMIN[s.statut] ?? s.statut }}</span>
            <span class="text-sm font-semibold tabular-nums">{{ s.nb }}</span>
          </div>
        </div>
        <p class="text-xs text-muted-foreground mt-3.5 pt-3 border-t border-border leading-relaxed">
          Le statut ne se saisit pas à la main : il se déduit des faits enregistrés
          (attelage, affectation, ordre de réparation).
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Tableau de bord Flotte - entièrement recâblé sur les vrais stores :
 * jusqu'ici, chaque chiffre (KPI, alertes, véhicules récents, statut
 * opérationnel) était une donnée figée dans le composant, sans lien
 * avec le reste de l'application - créer un voyage, ajouter un
 * document ou clôturer une intervention ne changeait jamais rien ici.
 * Trois blocs ont aussi été ajoutés (véhicules immobilisés, attelages
 * et conducteurs, répartition du parc) - retour du 15/09.
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Truck, AlertTriangle, Users, FileWarning, MapPin, Activity, Circle, Link2, ArrowRight, ChartColumn } from 'lucide-vue-next'
import { useVehiculesStore } from '../../stores/vehicules'
import { useEmployeeStore } from '../../stores/employees'
import { useDocumentsVehiculesStore } from '../../stores/documentsVehicules'
import { useAttelagesStore } from '../../stores/attelages'
import { useAffectationsChauffeursStore } from '../../stores/affectationsChauffeurs'
import { useMaintenanceStore } from '../../stores/maintenance'
import { LIB_FAMILLE_INDISPO } from '../../types/maintenance'
import type { StatutOperationnelVehicule, StatutAdminVehicule, DocumentVehicule } from '../../types'
import { fmtDate } from '../../lib/fmsUtils'

const vehStore  = useVehiculesStore()
const empStore  = useEmployeeStore()
const docsStore = useDocumentsVehiculesStore()
const attStore  = useAttelagesStore()
const affStore  = useAffectationsChauffeursStore()
const maintStore = useMaintenanceStore()

const formattedDate = computed(() =>
  new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))

function pct(n: number, total: number) { return total > 0 ? Math.round((n / total) * 100) : 0 }

const tracteursActifs  = computed(() => vehStore.tracteurs.filter(v => v.statutAdmin === 'actif' || v.statutAdmin === 'affecte').length)
const remorquesActives = computed(() => vehStore.remorques.filter(v => v.statutAdmin === 'actif' || v.statutAdmin === 'affecte').length)

/* Un chauffeur est « disponible » s'il est actif et sans affectation en
   cours - même règle que l'écran Affectation, pour rester cohérent. */
const chauffeursDisponibles = computed(() => {
  const affectesIds = new Set(affStore.affectations.filter(a => !a.dateFin).map(a => a.chauffeurId))
  return empStore.chauffeurs.filter(c => !affectesIds.has(c.id))
})

const LIB_STATUT_OP: Record<StatutOperationnelVehicule, string> = {
  en_mouvement: 'En mouvement', allume_immobile: 'Allumé / Immobile', arrete: 'Arrêté', signal_perdu: 'Signal perdu',
}
const CLS_STATUT_OP: Record<StatutOperationnelVehicule, { pill: string; badge: string }> = {
  en_mouvement:     { pill: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700', badge: 'bg-emerald-500/20 text-emerald-700' },
  allume_immobile:  { pill: 'bg-amber-500/10 border-amber-500/30 text-amber-700',       badge: 'bg-amber-500/20 text-amber-700'     },
  arrete:           { pill: 'bg-muted border-border text-muted-foreground',            badge: 'bg-border text-muted-foreground'    },
  signal_perdu:     { pill: 'bg-destructive/10 border-destructive/30 text-destructive', badge: 'bg-destructive/20 text-destructive' },
}
function opClasses(s?: StatutOperationnelVehicule) { return CLS_STATUT_OP[s ?? 'arrete'].pill }

const repartitionOp = computed(() => {
  const ordre: StatutOperationnelVehicule[] = ['en_mouvement', 'allume_immobile', 'arrete', 'signal_perdu']
  return ordre.map(key => ({
    key, label: LIB_STATUT_OP[key],
    classes: CLS_STATUT_OP[key].pill, badgeClasses: CLS_STATUT_OP[key].badge,
    count: vehStore.tracteurs.filter(t => (t.statutOp ?? 'arrete') === key).length,
  }))
})

/* ── Dernières alertes (documents) ── */
function estExpire(d: DocumentVehicule) {
  return !!d.dateExpiration && new Date(d.dateExpiration) < new Date()
}
function plaqueDe(entityId: string) {
  return vehStore.getById(entityId)?.plaque ?? entityId
}
const alertesTriees = computed(() =>
  [...docsStore.documentsExpires, ...docsStore.documentsExpiresSous30Jours]
    .sort((a, b) => (estExpire(a) ? 0 : 1) - (estExpire(b) ? 0 : 1))
    .slice(0, 8))

/* ── Véhicules récents ── */
const vehiculesRecents = computed(() => vehStore.tracteurs.slice(0, 6))

function chauffeurDe(tracteurId: string): string | null {
  const af = affStore.affectations.find(a => a.tracteurId === tracteurId && !a.dateFin)
  return af?.chauffeurNom ?? null
}
function remorqueDe(tracteurId: string): string | null {
  const at = attStore.attelages.find(a => a.tracteurId === tracteurId && !a.dateFin)
  return at?.remorquePlaque ?? null
}

/* ── Véhicules immobilisés ── */
const vehiculesImmobilises = computed(() =>
  vehStore.vehicules.filter(v => v.statutAdmin === 'en_reparation' || v.statutAdmin === 'hors_service'))

function motifImmobilisation(vehiculeId: string): string {
  const indispo = maintStore.indisposDuVehicule(vehiculeId).find((i: any) => !i.fin)
  if (!indispo) return 'Immobilisation en cours'
  return indispo.commentaire || LIB_FAMILLE_INDISPO[indispo.famille] || indispo.code
}

const LIB_STATUT_ADMIN: Partial<Record<StatutAdminVehicule, string>> = {
  actif: 'Actif', affecte: 'Affecté', en_reparation: 'En réparation',
  hors_service: 'Hors service', vendu: 'Vendu', archive: 'Archivé', en_service: 'En service',
}

/* ── Répartition du parc ── */
const COULEURS_STATUT: Partial<Record<StatutAdminVehicule, string>> = {
  actif: 'bg-emerald-500', affecte: 'bg-primary', en_reparation: 'bg-amber-500',
  hors_service: 'bg-destructive', vendu: 'bg-muted-foreground',
}
const repartitionParc = computed(() => {
  const ordre: StatutAdminVehicule[] = ['actif', 'affecte', 'en_reparation', 'hors_service', 'vendu']
  return ordre
    .map(statut => ({ statut, nb: vehStore.vehicules.filter(v => v.statutAdmin === statut).length, couleur: COULEURS_STATUT[statut] }))
    .filter(s => s.nb > 0)
})
</script>