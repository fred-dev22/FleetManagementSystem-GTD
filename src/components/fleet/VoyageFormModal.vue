<template>
  <div class="fixed inset-0 z-[1000] flex items-start justify-center bg-black/40 overflow-y-auto py-8" @click.self="emit('close')">
    <div class="bg-card rounded-xl shadow-xl w-full max-w-[1180px] mx-4 flex flex-col">

      <!-- En-tête -->
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div>
          <h2 class="text-base font-semibold text-foreground">Nouveau voyage</h2>
          <p class="text-[11px] text-muted-foreground">
            Un voyage associe un véhicule et un trajet. Le chauffeur est déduit de l’affectation en cours.
          </p>
        </div>
        <button :class="L.tbIconBtn" @click="emit('close')"><X class="w-4 h-4" /></button>
      </div>

      <div class="px-5 py-4 flex flex-col gap-4">

        <!-- ── Informations générales ── -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div :class="F.field">
            <label :class="F.fieldLabel">Véhicule <span class="text-danger">*</span></label>
            <select v-model="form.vehiculeId" :class="F.fieldSelect">
              <option value="">Choisir…</option>
              <option v-for="v in vehiculesDisponibles" :key="v.id" :value="v.id">
                {{ v.plaque }} — {{ v.marque }} {{ v.modele }}
              </option>
            </select>
          </div>

          <!-- Chauffeur : déduit, jamais saisi -->
          <div :class="F.field">
            <label :class="F.fieldLabel">
              Chauffeur <span :class="F.fieldOptional">— déduit de l’affectation</span>
            </label>
            <div
              class="h-[38px] px-2.5 rounded-md border flex items-center text-[13px]"
              :class="chauffeur
                ? 'bg-primary/5 border-primary/20 text-primary font-medium'
                : 'bg-background border-border text-muted-foreground'"
            >
              <UserCheck v-if="chauffeur" class="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <AlertCircle v-else class="w-3.5 h-3.5 mr-1.5 shrink-0" />
              {{ chauffeur ?? 'Aucune affectation sur ce véhicule' }}
            </div>
          </div>

          <div :class="F.field">
            <label :class="F.fieldLabel">Client</label>
            <select v-model="form.clientNom" :class="F.fieldSelect">
              <option v-for="c in CLIENTS" :key="c.nom" :value="c.nom">
                {{ c.nom }} — tolérance {{ c.tolerance }} ‰
              </option>
            </select>
          </div>

          <div :class="F.field">
            <label :class="F.fieldLabel">Date prévue <span class="text-danger">*</span></label>
            <input v-model="form.datePlanifiee" type="datetime-local" :class="F.fieldInput" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div :class="F.field">
            <label :class="F.fieldLabel">N° ordre de transfert</label>
            <input v-model="form.numeroOT" :class="F.fieldInput" placeholder="GRT-2026-…" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Produit</label>
            <select v-model="form.produit" :class="F.fieldSelect">
              <option value="Gazole">Gazole (GO)</option>
              <option value="SP95">Essence (SP95)</option>
              <option value="Jet A1">Jet A1</option>
            </select>
          </div>
          <div :class="F.field" class="md:col-span-2">
            <label :class="F.fieldLabel">Citerne attelée <span :class="F.fieldOptional">— déduite de l’attelage</span></label>
            <div class="h-[38px] px-2.5 rounded-md bg-background border border-border flex items-center text-[13px] text-muted-foreground">
              {{ citerne ?? 'Aucun attelage en cours' }}
            </div>
          </div>
        </div>

        <!-- ── Blocages ── -->
        <div v-if="blocages.length" class="flex flex-col gap-1.5">
          <div
            v-for="b in blocages" :key="b"
            class="flex items-center gap-2 rounded-lg px-3 py-2 bg-danger-bg text-danger"
          >
            <ShieldAlert class="w-4 h-4 shrink-0" />
            <p class="text-xs flex-1">{{ b }}</p>
          </div>
        </div>

        <!-- ── Trajet ── -->
        <div>
          <h3 class="text-[13px] font-semibold text-foreground mb-2">
            Trajet — sélection des sites et de leur ordre
          </h3>
          <SelecteurTrajet v-model="etapes" @trajet-ref="id => (form.trajetId = id)" />
        </div>
      </div>

      <!-- Pied -->
      <div class="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-border">
        <p v-if="erreur" :class="F.fieldErrorBlock">
          <AlertCircle class="w-3.5 h-3.5" /> {{ erreur }}
        </p>
        <span v-else class="text-[11px] text-muted-foreground">
          {{ etapes.length }} site(s) dans la séquence
        </span>
        <div class="flex items-center gap-2 shrink-0">
          <button :class="L.btnOutline" @click="emit('close')">Annuler</button>
          <button :class="L.btnPrimary" @click="enregistrer">Créer le voyage</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Création d'un voyage.
 *
 * Décision de séance : on sélectionne le VÉHICULE et le TRAJET, pas le chauffeur.
 * Le chauffeur vient de l'affectation chauffeur ↔ véhicule, qui a sa propre page
 * et conserve l'historique. Le saisir ici créerait une seconde source de vérité.
 */
import { ref, computed, reactive } from 'vue'
import { X, AlertCircle, UserCheck, ShieldAlert } from 'lucide-vue-next'
import SelecteurTrajet from './SelecteurTrajet.vue'
import { useVoyagesStore } from '../../stores/voyages'
import { useVehiculesStore } from '../../stores/vehicules'
import { useAffectationsChauffeursStore } from '../../stores/affectationsChauffeurs'
import { useAttelagesStore } from '../../stores/attelages'
import { useTrajetsStore } from '../../stores/trajets'
import type { EtapeTrajet } from '../../types/fms'
import * as L from '../../lib/listClasses'
import * as F from '../../lib/formClasses'

const emit = defineEmits<{ close: []; created: [id: string] }>()

const voyagesStore = useVoyagesStore()
const vehiculeStore = useVehiculesStore()
const affectationsStore = useAffectationsChauffeursStore()
const attelagesStore = useAttelagesStore()
const trajetsStore = useTrajetsStore()

const CLIENTS = [
  { nom: 'LPSA',        tolerance: 0.5 },
  { nom: 'TOTAL',       tolerance: 1 },
  { nom: 'VIVO',        tolerance: 1 },
  { nom: 'JOVENA',      tolerance: 1 },
  { nom: 'GALANA',      tolerance: 1 },
]

const etapes = ref<EtapeTrajet[]>([])
const erreur = ref('')

const form = reactive({
  vehiculeId: '',
  clientNom: 'LPSA',
  datePlanifiee: new Date(Date.now() + 86_400_000).toISOString().slice(0, 16),
  numeroOT: '',
  produit: 'Gazole',
  trajetId: '',
})

/* Seuls les véhicules tracteurs en état d'être affectés */
const vehiculesDisponibles = computed(() =>
  vehiculeStore.vehicules.filter(v => v.statutAdmin === 'actif' || v.statutAdmin === 'affecte'))

const vehicule = computed(() =>
  form.vehiculeId ? vehiculeStore.vehicules.find(v => v.id === form.vehiculeId) : undefined)

/** Chauffeur déduit — jamais saisi. */
const affectation = computed(() =>
  form.vehiculeId
    ? affectationsStore.affectations.find(a => a.tracteurId === form.vehiculeId && !a.dateFin)
    : undefined)

const chauffeur = computed(() => affectation.value?.chauffeurNom)

const citerne = computed(() => {
  if (!form.vehiculeId) return undefined
  const a = attelagesStore.attelages.find(x => x.tracteurId === form.vehiculeId && !x.dateFin)
  return a?.remorquePlaque
})

/** Contrôles bloquants au départ. */
const blocages = computed(() => {
  const out: string[] = []
  if (form.vehiculeId && !chauffeur.value) {
    out.push('Aucun chauffeur affecté à ce véhicule — affectez-le avant de créer le voyage.')
  }
  if (vehicule.value && vehicule.value.statutAdmin !== 'actif' && vehicule.value.statutAdmin !== 'affecte') {
    out.push(`Statut du véhicule incompatible : ${vehicule.value.statutAdmin}.`)
  }
  return out
})

function enregistrer() {
  erreur.value = ''
  if (!form.vehiculeId) { erreur.value = 'Le véhicule est obligatoire.'; return }
  if (etapes.value.length < 2) { erreur.value = 'La séquence doit comporter au moins deux sites.'; return }
  if (blocages.value.length) { erreur.value = 'Levez les blocages avant de créer le voyage.'; return }

  const seq = trajetsStore.renumeroter(etapes.value)
  const premier = seq[0]
  const dernier = seq[seq.length - 1]
  const tolerance = CLIENTS.find(c => c.nom === form.clientNom)?.tolerance ?? 1

  voyagesStore.create({
    numeroOT: form.numeroOT || undefined,
    statut: 'planifie',
    clientNom: form.clientNom,
    toleranceCoulagePourMille: tolerance,
    trajetId: form.trajetId || undefined,
    trajetLibelle: form.trajetId ? trajetsStore.getById(form.trajetId)?.libelle : undefined,
    etapes: seq,
    origine: premier?.siteNom ?? '',
    destination: dernier?.siteNom ?? '',
    vehiculeId: form.vehiculeId,
    vehiculePlaque: vehicule.value?.plaque,
    citernePlaque: citerne.value,
    chauffeurId: affectation.value?.chauffeurId,
    chauffeurNom: chauffeur.value,
    datePlanifiee: new Date(form.datePlanifiee).toISOString(),
    kmReference: trajetsStore.distanceSimulee(seq),
    volumes: { produit: form.produit, densite: form.produit === 'SP95' ? 0.75 : 0.84 },
    nbEcarts: 0,
    nbArretsNonJustifies: 0,
    litresDelivres: 0,
  })

  emit('created', voyagesStore.voyages[0]?.id ?? '')
  emit('close')
}
</script>
