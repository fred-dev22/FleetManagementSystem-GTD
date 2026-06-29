<template>
  <div v-if="isVisible" class="import-info-card">
    <div class="import-info-content">
      <Info class="info-icon" aria-hidden="true" />
      <p>{{ message }}</p>
    </div>
    <button type="button" class="import-info-close" @click="$emit('close')">
      <X class="w-4 h-4" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Info, X } from 'lucide-vue-next'

defineProps<{ message: string; isVisible: boolean }>()
defineEmits<{ close: [] }>()
</script>

<style scoped>
.import-info-card {
  background: var(--color-info-bg);
  border-left: 3px solid var(--color-info);
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 12px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  color: var(--color-foreground);
}

.import-info-content {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  flex: 1;
}

.import-info-content p {
  margin: 0;
  line-height: 1.5;
}

.info-icon {
  width: 16px;
  height: 16px;
  color: var(--color-info);
  flex-shrink: 0;
  margin-top: 1px;
}

.import-info-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-muted-foreground);
  padding: 2px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.import-info-close:hover {
  color: var(--color-danger);
}
</style>
