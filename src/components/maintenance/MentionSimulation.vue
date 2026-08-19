<template>
  <RouterLink v-if="simule" :to="{ name: 'maintenance-parametres' }"
    class="inline-flex items-center gap-1 text-[11px] font-medium text-warning no-underline hover:underline"
    :title="justification">
    <FlaskConical class="w-3 h-3 shrink-0" />
    <span>{{ texte }}</span>
  </RouterLink>
</template>

<script setup lang="ts">
/**
 * Mention « valeur de simulation », affichée près de l'indicateur qu'elle
 * gouverne.
 *
 * Un taux d'occupation calculé sur une capacité simulée s'affiche
 * exactement comme un taux calculé sur la capacité réelle : rien ne les
 * distingue en bout de chaîne. Sans cette mention, un chiffre de départ
 * se transformerait en mesure dès qu'il quitte l'écran de paramétrage,
 * et personne ne saurait plus lequel est lequel.
 *
 * Le lien renvoie à la saisie : signaler un problème sans donner le
 * moyen de le corriger ne sert à rien.
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { FlaskConical } from 'lucide-vue-next'
import { useMaintenanceStore } from '../../stores/maintenance'

const props = withDefaults(defineProps<{
  groupe: 'capacite' | 'mainOeuvre' | 'immobilisation'
  texte?: string
}>(), {
  texte: 'valeur de simulation',
})

const store = useMaintenanceStore()
const simule = computed(() => store.estSimule(props.groupe))
const justification = computed(() =>
  store.parametresAtelier[props.groupe].justification
  ?? 'Valeur de départ, à remplacer par la donnée réelle.')
</script>
