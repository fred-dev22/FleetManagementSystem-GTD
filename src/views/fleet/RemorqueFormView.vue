<template>
  <div class="form-page">
    <div class="form-card">
      <!-- Header -->
      <div class="form-card__header">
        <h1 class="form-card__title">
          {{ isEdit ? 'Modifier la remorque' : 'Nouvelle remorque' }}
        </h1>
        <p class="form-card__subtitle" v-if="isEdit && remorque">
          {{ remorque.plaque }} - {{ remorque.type }}
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
            placeholder="ex. 1FUJA6CK57LY12345"
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
            placeholder="ex. 5678 TAN B"
            @blur="validateField('plaque')"
          />
          <p v-if="errors.plaque" class="field__error">{{ errors.plaque }}</p>
        </div>

        <!-- Type -->
        <div class="field" :class="{ 'field--error': errors.type }">
          <label class="field__label" for="type">Type <span class="required">*</span></label>
          <SearchableDropdown
            v-model="form.type"
            :items="optform_type"
            placeholder="Sélectionner un type"
          />
          <p v-if="errors.type" class="field__error">{{ errors.type }}</p>
        </div>

        <!-- Capacité -->
        <div class="field" :class="{ 'field--error': errors.capacite }">
          <label class="field__label" for="capacite">
            Capacité <span class="required">*</span>
          </label>
          <div class="input-with-unit">
            <input
              id="capacite"
              v-model.number="form.capacite"
              type="number"
              min="0"
              step="0.01"
              class="field__input input-grow"
              placeholder="ex. 30"
              @blur="validateField('capacite')"
            />
            <SearchableDropdown
              v-model="form.uniteCapacite"
              :items="optform_uniteCapacite"
              placeholder="Sélectionner…"
            />
          </div>
          <p v-if="errors.capacite" class="field__error">{{ errors.capacite }}</p>
        </div>

        <!-- Marque -->
        <div class="field">
          <label class="field__label" for="marque">
            Marque <span class="optional">(optionnel)</span>
          </label>
          <input
            id="marque"
            v-model.trim="form.marque"
            type="text"
            class="field__input"
            placeholder="ex. Krone"
          />
        </div>

        <!-- Modèle -->
        <div class="field">
          <label class="field__label" for="modele">
            Modèle <span class="optional">(optionnel)</span>
          </label>
          <input
            id="modele"
            v-model.trim="form.modele"
            type="text"
            class="field__input"
            placeholder="ex. SD 27"
          />
        </div>

        <!-- Date MEC -->
        <div class="field" :class="{ 'field--error': errors.dateMiseEnCirculation }">
          <label class="field__label" for="dateMEC">
            Date de mise en circulation <span class="optional">(optionnel)</span>
          </label>
          <input
            id="dateMEC"
            v-model="form.dateMiseEnCirculation"
            type="date"
            class="field__input"
            :max="todayISO"
          />
          <p v-if="errors.dateMiseEnCirculation" class="field__error">
            {{ errors.dateMiseEnCirculation }}
          </p>
        </div>

        <!-- Statut administratif (EDIT only) -->
        <div v-if="isEdit" class="field">
          <label class="field__label" for="statutAdmin">Statut administratif</label>
          <SearchableDropdown
            v-model="form.statutAdmin"
            :items="optform_statutAdmin"
            placeholder="Sélectionner…"
          />
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
import { useRemorquesStore } from '../../stores/remorques'

const route = useRoute()
const router = useRouter()
const store = useRemorquesStore()

// ── Mode detection ────────────────────────────────────────────────
const remorqueId = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => !!remorqueId.value)
const remorque = computed(() =>
  remorqueId.value ? store.getRemorqueById(remorqueId.value) : undefined
)

// ── Static data ───────────────────────────────────────────────────
const todayISO = new Date().toISOString().split('T')[0]

// ── Form state ────────────────────────────────────────────────────
interface FormState {
  vin: string
  plaque: string
  type: string
  capacite: string
  uniteCapacite: 'T' | 'L'
  marque: string
  modele: string
  dateMiseEnCirculation: string
  statutAdmin: string
}

const form = reactive<FormState>({
  vin: '',
  plaque: '',
  type: '',
  capacite: '',
  uniteCapacite: 'T',
  marque: '',
  modele: '',
  dateMiseEnCirculation: '',
  statutAdmin: 'en_service',
})

const errors = reactive<Partial<Record<keyof FormState, string>>>({})
const submitError = ref('')
const submitting = ref(false)

// ── Populate form in edit mode ────────────────────────────────────
onMounted(() => {
  if (isEdit.value && remorque.value) {
    const r = remorque.value
    form.vin = r.vin ?? ''
    form.plaque = r.plaque ?? ''
    form.type = r.type ?? ''
    form.capacite = String(r.capacite ?? '')
    form.uniteCapacite = (r.uniteCapacite === 'L' ? 'L' : 'T')
    form.marque = r.marque ?? ''
    form.modele = r.modele ?? ''
    form.dateMiseEnCirculation = r.dateMiseEnCirculation ?? ''
    form.statutAdmin = r.statutAdmin ?? 'en_service'
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
  const duplicate = store.remorques.find(
    (r) => r.vin === val && r.id !== remorqueId.value
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
    type: 'Le type',
    capacite: 'La capacité',
  }
  if (typeof val === 'string' && !val.trim()) {
    errors[field] = `${labels[field] ?? field} est obligatoire.`
    return false
  }
  if (field === 'capacite' && Number(val) <= 0) {
    errors[field] = 'La capacité doit être supérieure à 0.'
    return false
  }
  return true
}

function validateAll(): boolean {
  const vinOk = validateVin()
  const plaqueOk = validateField('plaque')
  const typeOk = validateField('type')
  const capaciteOk = validateField('capacite')
  return vinOk && plaqueOk && typeOk && capaciteOk
}

// ── Submit ────────────────────────────────────────────────────────
async function handleSubmit() {
  submitError.value = ''
  if (!validateAll()) return

  submitting.value = true
  try {
    if (isEdit.value && remorqueId.value) {
      store.updateRemorque(remorqueId.value, {
        vin: form.vin,
        plaque: form.plaque,
        type: form.type,
        capacite: form.capacite,
        uniteCapacite: form.uniteCapacite,
        marque: form.marque || undefined,
        modele: form.modele || undefined,
        dateMiseEnCirculation: form.dateMiseEnCirculation || undefined,
        statutAdmin: form.statutAdmin,
      } as any)
      router.push({ name: 'fleet-remorque-detail', params: { id: remorqueId.value } })
    } else {
      const created = store.createRemorque({
        vin: form.vin,
        plaque: form.plaque,
        type: form.type,
        capacite: form.capacite,
        uniteCapacite: form.uniteCapacite,
        marque: form.marque || undefined,
        modele: form.modele || undefined,
        dateMiseEnCirculation: form.dateMiseEnCirculation || undefined,
      } as any)
      router.push({ name: 'fleet-remorque-detail', params: { id: created.id } })
    }
  } catch (err: any) {
    submitError.value = err?.message ?? 'Une erreur est survenue.'
  } finally {
    submitting.value = false
  }
}

function goBack() {
  if (isEdit.value && remorqueId.value) {
    router.push({ name: 'fleet-remorque-detail', params: { id: remorqueId.value } })
  } else {
    router.push({ name: 'fleet-dashboard' })
  }
}

const optform_type: DropdownItem[] = [
            { id: 'Citerne', label: "Citerne" },
            { id: 'Bâchée', label: "Bâchée" },
            { id: 'Frigorifique', label: "Frigorifique" },
            { id: 'Plateau', label: "Plateau" },
            { id: 'Autre', label: "Autre" },
]

const optform_uniteCapacite: DropdownItem[] = [
              { id: 'T', label: "T" },
              { id: 'L', label: "L" },
]

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

/* ── Input with unit selector ────────────────────────────────────── */
.input-with-unit {
  display: flex;
  gap: 0.5rem;
}

.input-grow {
  flex: 1;
}

.unit-select {
  width: 72px;
  flex-shrink: 0;
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
