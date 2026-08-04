<template>
  <CardModalShell
    page-title="Fiche conducteur"
    :page-number="employe?.matricule ?? employe?.id ?? ''"
    banner-label="Flotte · Conducteurs"
    :sidebar-items="[{ no: employe?.id ?? '', label: `${employe?.nom ?? ''} ${employe?.prenom ?? ''}` }]"
    :current-no="employe?.id ?? null"
    :has-prev="false"
    :has-next="false"
    :is-edit-mode="false"
    :show-edit="false"
    @close="emit('close')"
  >
    <template #form>
      <div class="flex-1 overflow-y-auto px-8 py-6 max-w-3xl mx-auto">

        <!-- Identité -->
        <FormSection title="Identité" :recaps="[employe?.matricule ?? '', employe?.departement ?? '']">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4">
            <div class="flex flex-col gap-1">
              <label :class="cls.label">Nom</label>
              <span class="text-sm font-semibold text-foreground">{{ employe?.nom ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.label">Prénom</label>
              <span class="text-sm font-semibold text-foreground">{{ employe?.prenom ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.label">Matricule</label>
              <span class="text-sm font-mono text-foreground">{{ employe?.matricule ?? employe?.id ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.label">Email</label>
              <span class="text-sm text-foreground">{{ employe?.email ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.label">Téléphone</label>
              <span class="text-sm text-foreground">{{ employe?.telephone ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.label">Département</label>
              <span class="text-sm text-foreground">{{ employe?.departement ?? '-' }}</span>
            </div>
          </div>
        </FormSection>

        <!-- Score -->
        <FormSection title="Score de conduite">
          <div v-if="profil" class="flex items-center gap-6">
            <div class="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 36 36" class="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" stroke-width="3" />
                <circle cx="18" cy="18" r="15.9" fill="none"
                  :stroke="profil.scoreConduite >= 80 ? '#22c55e' : profil.scoreConduite >= 60 ? '#f59e0b' : '#ef4444'"
                  stroke-width="3"
                  :stroke-dasharray="`${profil.scoreConduite} ${100 - profil.scoreConduite}`"
                  stroke-linecap="round" />
              </svg>
              <span class="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-800">
                {{ profil.scoreConduite }}
              </span>
            </div>
            <div>
              <p class="text-sm font-semibold" :class="profil.scoreConduite >= 80 ? 'text-success' : profil.scoreConduite >= 60 ? 'text-warning' : 'text-danger'">
                {{ profil.scoreConduite >= 80 ? 'Bon conducteur' : profil.scoreConduite >= 60 ? 'Conducteur moyen' : 'Conducteur à risque' }}
              </p>
              <p class="text-xs text-gray-500 mt-1">{{ profil.infractions?.length ?? 0 }} infraction(s) enregistrée(s)</p>
            </div>
          </div>
          <p v-else class="text-sm text-gray-400">Aucun profil conducteur.</p>
        </FormSection>

        <!-- Permis & Visite médicale -->
        <!-- ═══ Décomposition du score - un score opaque est contesté ═══ -->
        <FormSection
          v-if="score"
          title="Décomposition du score"
          :recaps="[`${score.score}/100`, `${score.voyagesPeriode} voyage(s)`, `${score.kmPeriode.toLocaleString('fr-FR')} km`]"
        >
          <div class="flex flex-col gap-3">
            <div v-for="f in score.familles" :key="f.famille">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: PONDERATIONS[f.famille].couleur }" />
                  <span class="text-xs font-medium text-foreground">{{ f.libelle }}</span>
                  <span class="text-[11px] text-muted-foreground">coef. {{ f.poids }} %</span>
                </div>
                <div class="flex items-center gap-2">
                  <span v-if="f.evenements" class="text-[11px] text-muted-foreground">{{ f.evenements }} évènement(s)</span>
                  <span class="text-xs font-semibold" :class="couleurScore(f.note)">{{ f.note }}</span>
                </div>
              </div>
              <div class="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div class="h-full rounded-full transition-all"
                  :style="{ width: f.note + '%', backgroundColor: PONDERATIONS[f.famille].couleur }" />
              </div>
            </div>
          </div>
          <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Score calculé sur une fenêtre glissante de douze mois, avec atténuation : une infraction
            ancienne pèse moins qu’une infraction récente. Un conducteur qui corrige son comportement
            voit son score remonter.
          </p>
        </FormSection>

        <!-- ═══ Exploitation ═══ -->
        <FormSection
          v-if="score"
          title="Exploitation"
          :recaps="[`${score.tauxConformiteItineraire} % conformité`, `${score.consoMoyenne100km} L/100 km`]"
        >
          <div class="grid grid-cols-4 gap-3 max-sm:grid-cols-2">
            <div>
              <label :class="F.fieldLabel">Conformité d’itinéraire</label>
              <p class="text-lg font-bold text-foreground">{{ score.tauxConformiteItineraire }} %</p>
            </div>
            <div>
              <label :class="F.fieldLabel">Dépassements km</label>
              <p class="text-lg font-bold" :class="score.depassementsKm ? 'text-warning' : 'text-foreground'">
                {{ score.depassementsKm }}
              </p>
            </div>
            <div>
              <label :class="F.fieldLabel">Conso moyenne</label>
              <p class="text-lg font-bold text-foreground">{{ score.consoMoyenne100km }}</p>
            </div>
            <div>
              <label :class="F.fieldLabel">Écart à la référence</label>
              <p class="text-lg font-bold"
                :class="score.ecartConsoPct > 5 ? 'text-danger' : score.ecartConsoPct > 0 ? 'text-warning' : 'text-success'">
                {{ score.ecartConsoPct > 0 ? '+' : '' }}{{ score.ecartConsoPct }} %
              </p>
            </div>
          </div>
        </FormSection>

        <!-- ═══ Aptitude médicale - depuis le registre ═══ -->
        <FormSection
          title="Aptitude médicale"
          :recaps="[aptitude.apte ? 'Apte' : 'Inapte']"
        >
          <div v-if="!aptitude.apte"
            class="flex items-start gap-2.5 bg-danger-bg text-danger rounded-lg px-3.5 py-2.5 mb-3">
            <ShieldAlert class="w-4 h-4 shrink-0 mt-px" />
            <p class="text-xs leading-relaxed">
              <strong>{{ aptitude.motif }}</strong> - l’affectation de ce conducteur à un voyage est bloquée.
            </p>
          </div>

          <table v-if="examens.length" class="w-full border-collapse">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Examen</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Date</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Résultat</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Valable jusqu’au</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in examens" :key="e.id" class="border-b border-border/60">
                <td class="py-2 text-xs">{{ LIB_EXAMEN[e.type] }}</td>
                <td class="py-2 text-xs">{{ fmtDate(e.date) }}</td>
                <td class="py-2">
                  <span v-if="e.aptitude" :class="LIB_APTITUDE[e.aptitude].cls"
                    class="text-[10px] font-medium px-2 py-0.5 rounded-full">{{ LIB_APTITUDE[e.aptitude].label }}</span>
                  <span v-else-if="e.positif === false" class="text-[10px] px-2 py-0.5 rounded-full bg-success-bg text-success">Négatif</span>
                  <span v-else-if="e.positif === true" class="text-[10px] px-2 py-0.5 rounded-full bg-danger-bg text-danger">Positif</span>
                  <span v-else class="text-gray-300">-</span>
                </td>
                <td class="py-2 text-xs"
                  :class="e.valableJusquau && +new Date(e.valableJusquau) < Date.now() ? 'text-danger font-medium' : ''">
                  {{ e.valableJusquau ? fmtDate(e.valableJusquau) : '-' }}
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="text-xs text-muted-foreground py-2">Aucun examen enregistré.</p>
        </FormSection>

        <!-- ═══ Prime ═══ -->
        <FormSection
          v-if="score"
          title="Prime de la période"
          :recaps="[fmtAr(score.primeMontant), palier.libelle]"
          :default-open="false"
        >
          <p class="text-2xl font-bold leading-none mb-1"
            :class="score.primeEligible ? 'text-success' : 'text-muted-foreground'">
            {{ fmtAr(score.primeMontant) }}
          </p>
          <p class="text-[11px] text-muted-foreground mb-3">{{ palier.libelle }}</p>

          <div v-if="!score.primeEligible" class="bg-danger-bg text-danger rounded-md px-2.5 py-2 text-[11px] mb-3">
            Non éligible - {{ score.motifNonEligibilite }}
          </div>

          <p class="text-[11px] font-semibold text-foreground mb-1.5">Grille en vigueur</p>
          <ul class="flex flex-col gap-1">
            <li v-for="g in GRILLE_PRIME.filter(x => x.montant > 0)" :key="g.min"
              class="flex justify-between text-[11px]"
              :class="score.score >= g.min ? 'text-foreground font-medium' : 'text-muted-foreground'">
              <span>{{ g.libelle }} - score ≥ {{ g.min }}</span>
              <span>{{ fmtAr(g.montant) }}</span>
            </li>
          </ul>
          <p class="text-[10px] text-muted-foreground mt-2 leading-snug">
            Calcul automatique, validation hiérarchique par le circuit RH existant.
            Grille à valider par la direction et les ressources humaines.
          </p>
        </FormSection>

        <FormSection title="Permis & Réglementaire">
          <div v-if="profil" class="grid grid-cols-2 gap-x-6 gap-y-4">
            <div class="flex flex-col gap-1">
              <label :class="cls.label">N° Permis</label>
              <span class="text-sm font-mono text-foreground">{{ profil.numeroPermis ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.label">Catégorie</label>
              <span class="text-lg font-bold text-foreground">{{ profil.categoriePermis ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.label">Expiration permis</label>
              <span :class="dateClass(profil.dateExpirationPermis)" class="px-2 py-0.5 rounded text-xs font-medium w-fit">
                {{ fmtDate(profil.dateExpirationPermis) }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.label">Visite médicale</label>
              <span :class="dateClass(profil.dateExpirationVisiteMedicale)" class="px-2 py-0.5 rounded text-xs font-medium w-fit">
                {{ fmtDate(profil.dateExpirationVisiteMedicale) }}
              </span>
            </div>
          </div>
          <p v-else class="text-sm text-gray-400">Aucune donnée.</p>
        </FormSection>

        <!-- Formations -->
        <FormSection title="Formations">
          <div v-if="profil?.formations?.length" class="space-y-2">
            <div v-for="f in profil.formations" :key="f.id"
              class="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div>
                <p class="text-sm font-medium text-gray-800">{{ f.titre }}</p>
                <p class="text-xs text-gray-500">{{ fmtDate(f.date) }}</p>
              </div>
              <span v-if="f.dateExpiration" :class="dateClass(f.dateExpiration)" class="px-2 py-0.5 rounded text-xs font-medium">
                Exp. {{ fmtDate(f.dateExpiration) }}
              </span>
            </div>
          </div>
          <p v-else class="text-sm text-gray-400">Aucune formation.</p>
        </FormSection>

        <!-- Infractions -->
        <FormSection title="Infractions">
          <div v-if="profil?.infractions?.length" class="space-y-3">
            <div v-for="inf in profil.infractions" :key="inf.id"
              class="p-3 rounded-lg border-l-4 bg-gray-50"
              :class="inf.gravite === 'grave' ? 'border-danger' : inf.gravite === 'moyen' ? 'border-warning' : 'border-gray-300'">
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-800">{{ inf.type }}</p>
                  <p class="text-xs text-gray-500 mt-0.5">{{ inf.description }}</p>
                </div>
                <div class="flex flex-col items-end gap-1">
                  <span :class="inf.gravite === 'grave' ? 'bg-danger-bg text-danger' : inf.gravite === 'moyen' ? 'bg-warning-bg text-warning' : 'bg-gray-100 text-gray-500'"
                    class="px-1.5 py-0.5 rounded text-xs font-medium capitalize">{{ inf.gravite }}</span>
                  <span class="text-xs text-gray-400">{{ fmtDate(inf.date) }}</span>
                </div>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-gray-400 text-center py-4">Aucune infraction.</p>
        </FormSection>

      </div>
    </template>
  </CardModalShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ShieldAlert } from 'lucide-vue-next'
import CardModalShell from '../shared/CardModalShell.vue'
import FormSection    from '../ui/form-field/FormSection.vue'
import type { ConducteurProfil } from '../../types'
import { useScoresConducteursStore, PONDERATIONS, GRILLE_PRIME, primePour } from '../../stores/scoresConducteurs'
import { useRegistresStore } from '../../stores/registres'
import { LIB_EXAMEN, LIB_APTITUDE } from '../../types/fms'
import { fmtAr } from '../../lib/fmsUtils'
import * as F from '../../lib/formClasses'

const props = defineProps<{
  employe: any
  profil?: ConducteurProfil
}>()
const emit = defineEmits<{ close: [] }>()

const scoresStore    = useScoresConducteursStore()
const registresStore = useRegistresStore()

/** Identifiant employé, sur lequel s'appuient le score et le registre médical. */
const chauffeurId = computed<string>(() => props.profil?.employeId ?? props.employe?.id ?? '')

const score = computed(() => chauffeurId.value ? scoresStore.getById(chauffeurId.value) : undefined)

const palier = computed(() =>
  score.value ? primePour(score.value.score, score.value.primeEligible) : { montant: 0, libelle: '' })

const aptitude = computed(() => registresStore.aptitudeChauffeur(chauffeurId.value))
const examens  = computed(() => registresStore.examensDuChauffeur(chauffeurId.value))

function couleurScore(n: number) {
  if (n >= 90) return 'text-success'
  if (n >= 80) return 'text-primary'
  if (n >= 70) return 'text-warning'
  return 'text-danger'
}

const cls = {
  label: 'text-xs font-semibold text-muted-foreground uppercase tracking-wide',
}

function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
}

function dateClass(date?: string) {
  if (!date) return 'bg-gray-100 text-gray-400'
  const exp = new Date(date)
  const now = new Date()
  const in30 = new Date(); in30.setDate(now.getDate() + 30)
  if (exp < now)   return 'bg-danger-bg text-danger'
  if (exp <= in30) return 'bg-warning-bg text-warning'
  return 'bg-success-bg text-success'
}
</script>
