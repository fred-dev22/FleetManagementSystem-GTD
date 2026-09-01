<template>
  <div class="form-page">
    <div class="form-card">
      <!-- Header -->
      <div class="form-card__header">
        <h1 class="form-card__title">
          {{ isEdit ? 'Modifier le tracteur' : 'Nouveau tracteur' }}
        </h1>
        <p class="form-card__subtitle" v-if="isEdit && tracteur">
          {{ tracteur.plaque }} - {{ tracteur.marque }} {{ tracteur.modele }}
        </p>
      </div>

      <!-- Form -->
      <form class="form-card__body" @submit.prevent="handleSubmit" novalidate>

        <!-- VIN -->
        <div class="field" :class="{ 'field--error': errors.vin }">
          <label class="field__label" for="vin">VIN <span class="required">*</span></label>
          <input
            id="vin"
            v-model.trim="form.vin"
            type="text"
            class="field__input"
            placeholder="ex. YV2RT40A4SB123456"
            maxlength="17"
            @blur="validateVin"
          />
          <p v-if="errors.vin" class="field__error">{{ errors.vin }}</p>
        </div>

        <!-- Plaque -->
        <div class="field" :class="{ 'field--error': errors.plaque }">
          <label class="field__label" for="plaque">Plaque <span class="required">*</span></label>
          <input
            id="plaque"
            v-model.trim="form.plaque"
            type="text"
            class="field__input"
            placeholder="ex. 1234 TAN A"
            @blur="validateField('plaque')"
          />
          <p v-if="errors.plaque" class="field__error">{{ errors.plaque }}</p>
        </div>

        <!-- Marque -->
        <div class="field" :class="{ 'field--error': errors.marque }">
          <label class="field__label" for="marque">Marque <span class="required">*</span></label>
          <SearchableDropdown
            v-model="form.marque"
            :items="optionsMarques"
            placeholder="Sélectionner une marque"
            @update:model-value="validateField('marque')"
          />
          <p v-if="errors.marque" class="field__error">{{ errors.marque }}</p>
        </div>

        <!-- Modèle -->
        <div class="field" :class="{ 'field--error': errors.modele }">
          <label class="field__label" for="modele">Modèle <span class="required">*</span></label>
          <input
            id="modele"
            v-model.trim="form.modele"
            type="text"
            class="field__input"
            placeholder="ex. FH 460"
            @blur="validateField('modele')"
          />
          <p v-if="errors.modele" class="field__error">{{ errors.modele }}</p>
        </div>

        <!-- Date de mise en circulation -->
        <div class="field" :class="{ 'field--error': errors.dateMiseEnCirculation }">
          <label class="field__label" for="dateMEC">
            Date de mise en circulation <span class="required">*</span>
          </label>
          <input
            id="dateMEC"
            v-model="form.dateMiseEnCirculation"
            type="date"
            class="field__input"
            :max="todayISO"
            @blur="validateField('dateMiseEnCirculation')"
          />
          <p v-if="errors.dateMiseEnCirculation" class="field__error">
            {{ errors.dateMiseEnCirculation }}
          </p>
        </div>

        <!-- Statut administratif (EDIT only) -->
        <div v-if="isEdit" class="field" :class="{ 'field--error': errors.statutAdmin }">
          <label class="field__label" for="statutAdmin">Statut administratif</label>
          <SearchableDropdown
            v-model="form.statutAdmin"
            :items="optform_statutAdmin"
            placeholder="Sélectionner…"
          />
          <p v-if="errors.statutAdmin" class="field__error">{{ errors.statutAdmin }}</p>
        </div>

        <!-- Notes -->
        <div class="field">
          <label class="field__label" for="notes">Notes <span class="optional">(optionnel)</span></label>
          <textarea
            id="notes"
            v-model="form.notes"
            class="field__textarea"
            rows="4"
            placeholder="Observations, remarques..."
          ></textarea>
        </div>

        <!-- Global error -->
        <div v-if="submitError" class="alert alert--error">
          {{ submitError }}
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn btn--ghost" @click="goBack">Annuler</button>
          <button type="submit" class="btn btn--primary" :disabled="submitting">
            <span v-if="submitting">Enregistrement…</span>
            <span v-else>Enregistrer</span>
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import SearchableDropdown from '../../components/ui/SearchableDropdown.vue'
import type { DropdownItem } from '../../components/ui/SearchableDropdown.vue'
import { useRoute, useRouter } from 'vue-router'
import { useTracteurStore } from '../../stores/tracteurs'
import type { StatutAdminVehicule } from '../../types/index'

const route = useRoute()
const router = useRouter()
const store = useTracteurStore()

// ── Mode detection ────────────────────────────────────────────────
const tracteurId = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => !!tracteurId.value)
const tracteur = computed(() =>
  tracteurId.value ? store.getTracteurById(tracteurId.value) : undefined
)

// ── Static data ───────────────────────────────────────────────────
const marques = ['Volvo', 'Mercedes', 'MAN', 'Scania', 'DAF', 'Autre']

const optionsMarques: DropdownItem[] = marques.map(m => ({ id: m, label: m }))
const todayISO = new Date().toISOString().split('T')[0]

// ── Form state ────────────────────────────────────────────────────
interface FormState {
  vin: string
  plaque: string
  marque: string
  modele: string
  dateMiseEnCirculation: string
  statutAdmin: StatutAdminVehicule
  notes: string
}

const form = reactive<FormState>({
  vin: '',
  plaque: '',
  marque: '',
  modele: '',
  dateMiseEnCirculation: '',
  statutAdmin: 'en_service',
  notes: '',
})

const errors = reactive<Partial<Record<keyof FormState, string>>>({})
const submitError = ref('')
const submitting = ref(false)

// ── Populate form in edit mode ────────────────────────────────────
onMounted(() => {
  if (isEdit.value && tracteur.value) {
    const t = tracteur.value
    form.vin = t.vin ?? ''
    form.plaque = t.plaque ?? ''
    form.marque = t.marque ?? ''
    form.modele = t.modele ?? ''
    form.dateMiseEnCirculation = t.dateMiseEnCirculation ?? ''
    form.statutAdmin = (t.statutAdmin ?? 'en_service') as StatutAdminVehicule
    form.notes = (t as any).notes ?? ''
  }
})

// ── Validation ────────────────────────────────────────────────────
function validateVin() {
  errors.vin = ''
  const val = form.vin
  if (!val) {
    errors.vin = 'Le VIN est obligatoire.'
    return false
  }
  // Check uniqueness - skip current tracteur in edit mode
  const duplicate = store.tracteurs.find(
    t => t.vin === val && t.id !== tracteurId.value
  )
  if (duplicate) {
    errors.vin = 'Ce VIN existe déjà.'
    return false
  }
  return true
}

function validateField(field: keyof FormState): boolean {
  errors[field] = ''
  const val = form[field]
  const labels: Partial<Record<keyof FormState, string>> = {
    plaque: 'La plaque',
    marque: 'La marque',
    modele: 'Le modèle',
    dateMiseEnCirculation: 'La date de mise en circulation',
  }
  if (!val || (typeof val === 'string' && !val.trim())) {
    errors[field] = `${labels[field] ?? field} est obligatoire.`
    return false
  }
  return true
}

function validateAll(): boolean {
  const vinOk = validateVin()
  const plaqueOk = validateField('plaque')
  const marqueOk = validateField('marque')
  const modeleOk = validateField('modele')
  const dateOk = validateField('dateMiseEnCirculation')
  return vinOk && plaqueOk && marqueOk && modeleOk && dateOk
}

// ── Submit ────────────────────────────────────────────────────────
async function handleSubmit() {
  submitError.value = ''
  if (!validateAll()) return

  submitting.value = true
  try {
    if (isEdit.value && tracteurId.value) {
      store.updateTracteur(tracteurId.value, {
        vin: form.vin,
        plaque: form.plaque,
        marque: form.marque,
        modele: form.modele,
        dateMiseEnCirculation: form.dateMiseEnCirculation,
        statutAdmin: form.statutAdmin,
        ...(form.notes !== undefined ? { notes: form.notes } : {}),
      } as any)
      router.push({ name: 'tracteur-detail', params: { id: tracteurId.value } })
    } else {
      const created = store.createTracteur({
        vin: form.vin,
        plaque: form.plaque,
        marque: form.marque,
        modele: form.modele,
        dateMiseEnCirculation: form.dateMiseEnCirculation,
        statutOp: 'arrete',
        kilometrage: 0,
        niveauCarburant: 0,
        ...(form.notes ? { notes: form.notes } : {}),
      } as any)
      router.push({ name: 'tracteur-detail', params: { id: created.id } })
    }
  } catch (err: any) {
    submitError.value = err?.message ?? 'Une erreur est survenue.'
  } finally {
    submitting.value = false
  }
}

function goBack() {
  if (isEdit.value && tracteurId.value) {
    router.push({ name: 'tracteur-detail', params: { id: tracteurId.value } })
  } else {
    router.push({ name: 'fleet-dashboard' })
  }
}

const optform_statutAdmin: DropdownItem[] = [
            { id: 'en_service', label: "En service" },
            { id: 'hors_service', label: "Hors service" },
]
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────── */
.form-page {
  min-height: 100vh;
  background: var(--color-bg, #f4f6f9);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 2rem 1rem;
}

.form-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 640px;
  overflow: hidden;
}

/* ── Card header ─────────────────────────────────────────────────── */
.form-card__header {
  background: #1a3a6b;
  padding: 1.5rem 2rem;
}

.form-card__title {
  margin: 0;
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.form-card__subtitle {
  margin: 0.25rem 0 0;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.875rem;
}

/* ── Card body ───────────────────────────────────────────────────── */
.form-card__body {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Fields ──────────────────────────────────────────────────────── */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.required {
  color: #dc2626;
  margin-left: 2px;
}

.optional {
  font-weight: 400;
  color: #9ca3af;
  font-size: 0.8rem;
}

.field__input,
.field__select,
.field__textarea {
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  padding: 0.625rem 0.875rem;
  font-size: 0.9375rem;
  color: #111827;
  background: #ffffff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
}

.field__input:focus,
.field__select:focus,
.field__textarea:focus {
  border-color: #1a3a6b;
  box-shadow: 0 0 0 3px rgba(26, 58, 107, 0.12);
}

.field__select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2.5rem;
  cursor: pointer;
}

.field__textarea {
  resize: vertical;
  min-height: 96px;
}

/* Error state */
.field--error .field__input,
.field--error .field__select,
.field--error .field__textarea {
  border-color: #dc2626;
}

.field--error .field__input:focus,
.field--error .field__select:focus,
.field--error .field__textarea:focus {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
}

.field__error {
  margin: 0;
  font-size: 0.8125rem;
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.field__error::before {
  content: '⚠';
  font-size: 0.75rem;
}

/* ── Alert ───────────────────────────────────────────────────────── */
.alert {
  padding: 0.875rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
}

.alert--error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

/* ── Actions ─────────────────────────────────────────────────────── */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f3f4f6;
  margin-top: 0.5rem;
}

/* ── Buttons ─────────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.375rem;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
  font-family: inherit;
  text-decoration: none;
}

.btn--primary {
  background: #1a3a6b;
  color: #ffffff;
}

.btn--primary:hover:not(:disabled) {
  background: #15305a;
  box-shadow: 0 2px 8px rgba(26, 58, 107, 0.3);
}

.btn--primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn--ghost {
  background: transparent;
  color: #4b5563;
  border: 1.5px solid #d1d5db;
}

.btn--ghost:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .form-card__body {
    padding: 1.25rem;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }
}
</style>
