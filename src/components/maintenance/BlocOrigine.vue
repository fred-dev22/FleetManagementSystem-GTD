<template>
  <div v-if="param.justification"
    class="mt-3 rounded-lg bg-warning-bg/40 border border-warning/20 px-3 py-2.5">
    <p class="text-[11px] text-warning leading-relaxed">
      <strong>D’où vient cette valeur.</strong> {{ param.justification }}
    </p>
  </div>

  <div v-else-if="modifie" class="mt-3 flex items-center justify-between gap-2">
    <button
      class="text-[11px] font-medium text-muted-foreground bg-transparent border-0 cursor-pointer p-0 inline-flex items-center gap-1 hover:text-primary shrink-0"
      title="Revenir à la valeur de départ"
      @click="store.restaurerSimulation(groupe)"
    >
      <RotateCcw class="w-3 h-3" /> Valeur de départ
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * Justification d'une valeur de simulation, et retour en arrière.
 *
 * Tant que la valeur est simulée, son origine est expliquée : le client
 * peut juger l'hypothèse plutôt que de découvrir un chiffre inexpliqué
 * dans un indicateur. Une fois qu'il a saisi la sienne, la justification
 * disparaît et un retour aux valeurs de départ reste possible, pour ne
 * pas enfermer une saisie faite par erreur.
 */
import { computed } from 'vue'
import { RotateCcw } from 'lucide-vue-next'
import { useMaintenanceStore } from '../../stores/maintenance'

const props = defineProps<{
  groupe: 'capacite' | 'mainOeuvre' | 'immobilisation'
}>()

const store = useMaintenanceStore()
const param = computed(() => store.parametresAtelier[props.groupe])
const modifie = computed(() => param.value.origine === 'client')
</script>
