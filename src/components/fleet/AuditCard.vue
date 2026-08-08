<template>
  <CardModalShell
    page-title="Audit de conformité"
    :page-number="item.reference"
    banner-label="Flotte · Contrôles techniques"
    :sidebar-items="sidebarItems"
    :current-no="item.id"
    :has-prev="indexCourant > 0"
    :has-next="indexCourant < listeOrdonnee.length - 1"
    :is-edit-mode="false"
    :show-edit="false"
    :status-label="item.conforme ? 'Conforme' : 'Non conforme'"
    @close="emit('close')"
    @go-prev="naviguer(-1)"
    @go-next="naviguer(1)"
    @select-sidebar="(id: string) => emit('navigate', id)"
  >
    <template #title-badges>
      <span class="px-2.5 py-0.5 rounded-full text-xs font-medium"
        :class="item.conforme ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'">
        {{ item.conforme ? 'Conforme' : 'Non conforme' }}
      </span>
      <span v-if="item.contreVisiteLe" class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-bg text-warning">
        Contre-visite le {{ fmtDate(item.contreVisiteLe) }}
      </span>
    </template>

    <template #form>
      <div class="flex-1 overflow-y-auto px-8 py-6 max-w-3xl mx-auto">

        <FormSection title="Identification" :recaps="[item.tracteurPlaque, item.auditeur]">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Référence</label>
              <span class="text-sm font-mono font-semibold text-foreground">{{ item.reference }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Date</label>
              <span class="text-sm text-foreground">{{ fmtDate(item.date) }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Tracteur</label>
              <span class="text-sm font-mono text-foreground">{{ item.tracteurPlaque }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Citerne</label>
              <span class="text-sm font-mono text-foreground">{{ item.citernePlaque ?? '—' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Auditeur</label>
              <span class="text-sm text-foreground">{{ item.auditeur }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Aptitude à charger</label>
              <span class="text-sm font-medium" :class="item.conforme ? 'text-success' : 'text-danger'">
                {{ item.conforme ? 'Autorisée' : 'Suspendue' }}
              </span>
            </div>
          </div>
          <p v-if="item.commentaire" class="text-sm text-foreground leading-relaxed mt-4">{{ item.commentaire }}</p>
        </FormSection>

        <FormSection
          v-for="(postes, categorie) in parCategorie" :key="categorie"
          :title="String(categorie)"
          :recaps="[`${postes.length} poste(s)`]"
        >
          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Code</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Point de contrôle</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Verdict</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in postes" :key="p.code" class="border-b border-border/60">
                <td class="py-2 text-[11px] font-mono">{{ p.code }}</td>
                <td class="py-2">
                  <span class="text-xs">{{ p.libelle }}</span>
                  <div v-if="p.observation" class="text-[11px] text-muted-foreground">{{ p.observation }}</div>
                </td>
                <td class="py-2">
                  <span class="text-[10px] font-medium px-2 py-0.5 rounded-full" :class="LIB_VERDICT[p.verdict].cls">
                    {{ LIB_VERDICT[p.verdict].label }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </FormSection>

        <FormSection v-if="!item.conforme" title="Suite à donner" :recaps="['contre-visite']">
          <div class="flex items-start gap-2.5 bg-danger-bg text-danger rounded-lg px-3.5 py-2.5">
            <AlertTriangle class="w-4 h-4 shrink-0 mt-px" />
            <p class="text-xs leading-relaxed">
              {{ nonConformes.length }} poste(s) non conforme(s). Une contre-visite est programmée
              <strong v-if="item.contreVisiteLe">le {{ fmtDate(item.contreVisiteLe) }}</strong>.
              Le véhicule ne peut pas être présenté au chargement tant qu’elle n’est pas passée.
            </p>
          </div>
        </FormSection>

      </div>
    </template>
  </CardModalShell>
</template>

<script setup lang="ts">
/** US 2.3.2 — Fiche d'un audit de conformité, préparant le vetting. */
import { computed } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'
import CardModalShell from '../shared/CardModalShell.vue'
import FormSection    from '../ui/form-field/FormSection.vue'
import { useFlotteStore } from '../../stores/flotte'
import { POSTES_AUDIT, LIB_VERDICT } from '../../types/flotte'
import type { AuditConformite, VerdictPoste } from '../../types/flotte'
import { fmtDate } from '../../lib/fmsUtils'
import * as F from '../../lib/formClasses'

const props = defineProps<{ audit: AuditConformite }>()
const emit  = defineEmits<{ close: []; navigate: [id: string] }>()

const store = useFlotteStore()
const item = computed(() => store.audits.find(a => a.id === props.audit.id) ?? props.audit)

interface PosteResolu {
  code: string
  libelle: string
  categorie: string
  verdict: VerdictPoste
  observation?: string
}

/** Les résultats enrichis du libellé et de la catégorie du référentiel. */
const postesResolus = computed<PosteResolu[]>(() =>
  item.value.resultats.map(r => {
    const def = POSTES_AUDIT.find(p => p.code === r.code)
    return {
      code: r.code,
      libelle: def?.libelle ?? r.code,
      categorie: def?.categorie ?? 'Autres',
      verdict: r.verdict,
      observation: r.observation,
    }
  }))

const parCategorie = computed(() => {
  const acc: Record<string, PosteResolu[]> = {}
  postesResolus.value.forEach(p => {
    if (!acc[p.categorie]) acc[p.categorie] = []
    acc[p.categorie]!.push(p)
  })
  return acc
})

const nonConformes = computed(() => postesResolus.value.filter(p => p.verdict === 'non_conforme'))

const listeOrdonnee = computed(() =>
  [...store.audits].sort((a, b) => +new Date(b.date) - +new Date(a.date)))
const indexCourant = computed(() => listeOrdonnee.value.findIndex(a => a.id === item.value.id))
const sidebarItems = computed(() =>
  listeOrdonnee.value.map(a => ({ no: a.id, label: `${a.reference} · ${a.tracteurPlaque}` })))

function naviguer(d: number) {
  const a = listeOrdonnee.value[indexCourant.value + d]
  if (a) emit('navigate', a.id)
}
</script>
