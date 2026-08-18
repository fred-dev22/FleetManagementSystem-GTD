<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="emit('close')">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <!-- Header -->
        <div class="bg-primary px-6 py-4 flex items-center justify-between">
          <h2 class="text-white font-semibold text-lg">Nouveau véhicule</h2>
          <button class="text-white/80 hover:text-white" @click="emit('close')"><X class="w-5 h-5" /></button>
        </div>

        <!-- Form -->
        <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Type de véhicule *</label>
            <div class="flex gap-3">
              <button v-for="t in ['tracteur', 'remorque']" :key="t"
                @click="form.typeVehicule = t as any"
                :class="form.typeVehicule === t ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-600'"
                class="flex-1 py-2 rounded-lg border-2 font-medium text-sm capitalize transition-colors">
                {{ t }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Plaque *</label>
              <input v-model="form.plaque" placeholder="MG-0000-TX"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                :class="plaqueEnDouble ? 'border-danger bg-danger-bg/40' : 'border-gray-200'" />
              <p v-if="plaqueEnDouble" class="text-[11px] text-danger mt-1">Plaque déjà attribuée</p>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">VIN</label>
              <input v-model="form.vin" placeholder="VIN 17 caractères"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                :class="vinEnDouble ? 'border-danger bg-danger-bg/40' : 'border-gray-200'" />
              <p v-if="vinEnDouble" class="text-[11px] text-danger mt-1">Châssis déjà enregistré</p>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Marque</label>
              <input v-model="form.marque" placeholder="Volvo, Scania…" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Modèle</label>
              <input v-model="form.modele" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Année</label>
              <input v-model.number="form.annee" type="number" placeholder="2024" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Mise en circulation</label>
              <input v-model="form.dateMiseEnCirculation" type="date" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <!-- Tracteur uniquement -->
          <div v-if="form.typeVehicule === 'tracteur'" class="border-t pt-4">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Tracteur</p>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Type de carburant</label>
              <select v-model="form.typeCarburant" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">-</option>
                <option v-for="c in ['Diesel','GNL','Essence','Électrique','Hybride']" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
          </div>

          <!-- Remorque uniquement -->
          <div v-if="form.typeVehicule === 'remorque'" class="border-t pt-4">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Remorque</p>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Type</label>
                <select v-model="form.typeRemorque" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option v-for="t in ['Citerne','Bâchée','Frigorifique','Plateau','Autre']" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Capacité</label>
                <input v-model="form.capacite" placeholder="28T ou 30000L" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          </div>

          <!-- Site + financier -->
          <div class="border-t pt-4 grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Site</label>
              <input v-model="form.siteAffectation" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Mode acquisition</label>
              <select v-model="form.modeAcquisition" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">-</option>
                <option value="achat">Achat</option>
                <option value="leasing">Leasing</option>
                <option value="location">Location</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Coût (MGA)</label>
              <input v-model.number="form.coutAcquisition" type="number" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-gray-50 border-t">
          <!-- US 2.1.1 - le refus est motivé, jamais silencieux -->
          <div v-if="erreur" class="flex items-start gap-2 mb-3 text-danger">
            <AlertCircle class="w-4 h-4 shrink-0 mt-px" />
            <p class="text-xs leading-relaxed">{{ erreur }}</p>
          </div>
          <div class="flex justify-end gap-3">
            <button class="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors" @click="emit('close')">
              Annuler
            </button>
            <button :disabled="!peutCreer" @click="submit"
              class="px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-40">
              Créer le véhicule
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * US 2.1.1 - Création d'un véhicule.
 *
 * L'unicité de la plaque et du châssis est contrôlée ici comme elle
 * l'était déjà à l'import : les deux chemins appellent les mêmes
 * fonctions du store. Auparavant seul l'import refusait un doublon,
 * ce qui permettait de saisir à la main ce que l'import rejetait.
 *
 * Le doublon est signalé pendant la frappe, pas seulement à la
 * validation : l'utilisateur corrige avant d'avoir rempli le reste.
 */
import { reactive, computed, ref } from 'vue'
import { X, AlertCircle } from 'lucide-vue-next'
import { useVehiculesStore } from '../../stores/vehicules'
import type { Vehicule } from '../../types'

const emit = defineEmits<{ close: [] }>()
const store = useVehiculesStore()

const form = reactive<Partial<Vehicule>>({
  typeVehicule: 'tracteur',
  statutAdmin: 'actif',
})

const erreur = ref('')

const plaqueEnDouble = computed(() =>
  !!form.plaque?.trim() && store.plaqueExiste(form.plaque))

const vinEnDouble = computed(() =>
  !!form.vin?.trim() && store.vinExiste(form.vin))

const peutCreer = computed(() =>
  !!form.plaque?.trim() && !!form.typeVehicule && !plaqueEnDouble.value && !vinEnDouble.value)

function submit() {
  erreur.value = ''
  if (!form.plaque || !form.typeVehicule) return

  const res = store.create(form as Omit<Vehicule, 'id' | 'createdAt'>)
  if ('erreur' in res) {
    erreur.value = res.erreur
    return
  }
  emit('close')
}
</script>
