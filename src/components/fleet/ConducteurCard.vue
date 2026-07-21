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
              <span class="text-sm font-semibold text-foreground">{{ employe?.nom ?? '—' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.label">Prénom</label>
              <span class="text-sm font-semibold text-foreground">{{ employe?.prenom ?? '—' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.label">Matricule</label>
              <span class="text-sm font-mono text-foreground">{{ employe?.matricule ?? employe?.id ?? '—' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.label">Email</label>
              <span class="text-sm text-foreground">{{ employe?.email ?? '—' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.label">Téléphone</label>
              <span class="text-sm text-foreground">{{ employe?.telephone ?? '—' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.label">Département</label>
              <span class="text-sm text-foreground">{{ employe?.departement ?? '—' }}</span>
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
        <FormSection title="Permis & Réglementaire">
          <div v-if="profil" class="grid grid-cols-2 gap-x-6 gap-y-4">
            <div class="flex flex-col gap-1">
              <label :class="cls.label">N° Permis</label>
              <span class="text-sm font-mono text-foreground">{{ profil.numeroPermis ?? '—' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="cls.label">Catégorie</label>
              <span class="text-lg font-bold text-foreground">{{ profil.categoriePermis ?? '—' }}</span>
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
import CardModalShell from '../shared/CardModalShell.vue'
import FormSection    from '../ui/form-field/FormSection.vue'
import type { ConducteurProfil } from '../../types'

defineProps<{
  employe: any
  profil?: ConducteurProfil
}>()
const emit = defineEmits<{ close: [] }>()

const cls = {
  label: 'text-xs font-semibold text-muted-foreground uppercase tracking-wide',
}

function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
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
