<template>
  <!-- Accès direct par URL (/fleet/voyages/:id), notamment depuis la carte.
       On affiche exactement la même fiche que dans la liste : un seul écran
       de détail pour un voyage, quel que soit le chemin emprunté. -->
  <VoyageCard
    v-if="voyage"
    :voyage="voyage"
    @close="retour"
    @navigate="id => router.replace({ name: 'fleet-voyage-detail', params: { id } })"
  />

  <div v-else :class="L.pagePadding">
    <div :class="L.emptyState">
      <Package class="w-8 h-8" />
      <p class="text-sm">Voyage introuvable</p>
      <button :class="L.btnOutline" @click="router.push({ name: 'fleet-voyages' })">
        Retour à la liste des voyages
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Package } from 'lucide-vue-next'
import VoyageCard from '../../components/fleet/VoyageCard.vue'
import { useVoyagesStore } from '../../stores/voyages'
import * as L from '../../lib/listClasses'

const route  = useRoute()
const router = useRouter()
const store  = useVoyagesStore()

const voyage = computed(() => store.getById(String(route.params.id)))

/** Fermer la fiche ramène à la liste, ou à la page précédente si elle existe. */
function retour() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'fleet-voyages' })
}
</script>