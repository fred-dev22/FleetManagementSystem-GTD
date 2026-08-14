<template>
  <!-- ── BARRE 2 : NavBar (blanche) ── -->
  <div class="bg-nav h-12 px-5 border-b border-black/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center shrink-0">
    <div class="flex items-center shrink-0">
      <img src="@/assets/logo-gtd.png" class="h-7 w-auto object-contain bg-white rounded px-1" alt="GTD" />
      <div :class="[navDividerClass, 'hidden md:block']"></div>
      <span class="hidden md:block text-[15px] font-bold text-foreground tracking-[0.05em] whitespace-nowrap">{{ t('nav.company') }}</span>
    </div>

    <!-- Items de navigation -->
    <div class="ml-auto hidden md:flex" v-if="!isMobileMenuOpen">
      <div
        v-for="item in navItems"
        :key="item.key"
        :class="[navItemClass, navStore.activeModule === item.key && navItemActiveClass]"
        @click="handleNav(item.key)"
      >{{ item.label }}</div>
    </div>

    <div class="flex items-center ml-auto md:ml-0">
      <div :class="[navDividerClass, 'hidden md:block']"></div>
      <span class="hidden md:block text-[11px] font-semibold text-primary tracking-[0.04em] whitespace-nowrap">{{ contextLabel }}</span>
    </div>

    <button
      class="w-8 h-8 rounded-md items-center justify-center cursor-pointer text-muted-foreground transition-colors hover:bg-background flex md:hidden ml-2"
      @click="isMobileMenuOpen = !isMobileMenuOpen"
    >
      <X v-if="isMobileMenuOpen" class="w-5 h-5" />
      <Menu v-else class="w-5 h-5" />
    </button>
  </div>

  <!-- Mobile overlay + menu -->
  <div v-if="isMobileMenuOpen" class="fixed inset-0 bg-black/30 z-[140] md:hidden" @click="isMobileMenuOpen = false"></div>
  <div v-if="isMobileMenuOpen" class="fixed top-[92px] inset-x-0 bg-white border-b border-border shadow-lg z-[150] py-2 md:hidden">
    <div v-for="item in navItems" :key="item.key"
      :class="mobileItemClass" @click="handleNav(item.key); isMobileMenuOpen = false">
      {{ item.label }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { X, Menu } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { useNavigationStore } from '../stores/navigation'

const router   = useRouter()
const route    = useRoute()
const auth     = useAuthStore()
const navStore = useNavigationStore()
const { t }    = useI18n()

const navDividerClass = 'w-px h-5 bg-black/10 mx-3.5 shrink-0'
const navItemClass =
  'h-12 px-3.5 flex items-center gap-1 text-sm font-medium text-muted-foreground border-b-[3px] border-transparent cursor-pointer whitespace-nowrap transition-all select-none no-underline hover:text-foreground hover:bg-black/[0.03]'
const navItemActiveClass = 'text-primary !border-primary font-semibold'
const mobileItemClass =
  'flex items-center px-5 py-3 text-sm font-medium text-foreground/80 cursor-pointer border-b border-border last:border-0 no-underline hover:bg-background hover:text-primary'

const navItems = computed(() => [
  { key: 'administration', label: t('nav.admin') },
  { key: 'fleet',          label: t('nav.fleet') },
  { key: 'maintenance',    label: 'Maintenance' },
])

function handleNav(key: string) {
  navStore.setModule(key)
  const defaults: Record<string, string> = {
    fleet:          'fleet-dashboard',
    administration: 'hr-dashboard',
    maintenance:    'maintenance-dashboard',
  }
  if (defaults[key]) router.push({ name: defaults[key] })
}

const contextLabel = computed(() => {
  if (auth.role === 'admin')       return 'ADMINISTRATEUR · GTD'
  if (auth.role === 'rh')          return 'RH · GTD'
  if (auth.role === 'operations')  return 'GESTIONNAIRE OPS · GTD'
  if (auth.role === 'maintenance') return 'MAINTENANCE · GTD'
  if (auth.role === 'chauffeur')   return 'CHAUFFEUR · GTD'
  return 'GTD FLEET'
})

const isMobileMenuOpen = ref(false)

/**
 * Détermine le module actif à partir de l'adresse courante.
 *
 * Cette fonction doit connaître TOUS les préfixes de module. Un préfixe
 * oublié renvoie « administration » et écrase le module que l'utilisateur
 * vient de choisir : l'onglet paraît alors ne pas réagir au premier clic.
 */
function detectModule(path: string): string {
  if (path.startsWith('/maintenance')) return 'maintenance'
  if (path.startsWith('/fleet'))       return 'fleet'
  return 'administration'
}

watch(() => route.path, (p) => {
  navStore.setModule(detectModule(p))
}, { immediate: true })
</script>
