import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Client } from '../types/fms'

/**
 * Référentiel clients.
 *
 * Il n'existait pas : le nom du client était un champ libre, et sa
 * tolérance de coulage vivait dans une constante locale de
 * `VoyageFormModal`. Aucun autre écran ne pouvait la lire, et rien
 * n'empêchait deux orthographes du même client de coexister.
 *
 * La tolérance de coulage est une donnée contractuelle. Elle est donc
 * portée par le client, lue au moment du voyage et recopiée dedans :
 * un voyage clôturé garde la tolérance en vigueur ce jour-là, même si
 * le contrat est renégocié ensuite.
 */
export const useClientsStore = defineStore('clients', () => {

  const clients = ref<Client[]>([
    {
      id: 'CLI-001', code: 'LPSA', nom: 'LPSA',
      toleranceCoulagePourMille: 0.5,
      contact: 'Service exploitation', actif: true,
      notes: 'Tolérance contractuelle plus stricte que le reste du marché.',
    },
    {
      id: 'CLI-002', code: 'TOTAL', nom: 'TotalEnergies Madagascar',
      toleranceCoulagePourMille: 1, actif: true,
    },
    {
      id: 'CLI-003', code: 'VIVO', nom: 'Vivo Energy Madagascar',
      toleranceCoulagePourMille: 1, actif: true,
      notes: 'Anciennement saisi « VIVO » et « Vivo Energy » : les deux graphies renvoient ici.',
    },
    {
      id: 'CLI-004', code: 'JOVENA', nom: 'Jovena',
      toleranceCoulagePourMille: 1, actif: true,
    },
    {
      id: 'CLI-005', code: 'GALANA', nom: 'Galana Distribution Pétrolière',
      toleranceCoulagePourMille: 1, actif: true,
    },
  ])

  const actifs = computed(() => clients.value.filter(c => c.actif))

  const getById = (id: string) => clients.value.find(c => c.id === id)

  /**
   * Retrouve un client à partir d'un nom saisi librement par le passé.
   * La comparaison porte sur le code et sur le nom, sans casse ni espaces,
   * et accepte qu'un nom historique soit le préfixe du nom actuel :
   * « Vivo Energy » retrouve « Vivo Energy Madagascar », « VIVO » aussi.
   */
  function retrouverParNom(nom?: string): Client | undefined {
    if (!nom?.trim()) return undefined
    const n = nom.trim().toUpperCase().replace(/\s+/g, ' ')
    return clients.value.find(c => {
      const code = c.code.toUpperCase()
      const complet = c.nom.toUpperCase()
      return code === n || complet === n || complet.startsWith(n) || n.startsWith(code)
    })
  }

  /**
   * Tolérance applicable à un client désigné par son nom.
   * Retourne null quand le client est inconnu, plutôt que la valeur par
   * défaut de 1 ‰ qui masquait l'erreur : l'appelant doit savoir qu'il
   * travaille sans référence contractuelle.
   */
  function toleranceDe(nom?: string): number | null {
    return retrouverParNom(nom)?.toleranceCoulagePourMille ?? null
  }

  /** Noms employés dans les données mais absents du référentiel. */
  function nomsOrphelins(nomsUtilises: string[]): string[] {
    return [...new Set(nomsUtilises.filter(n => n && !retrouverParNom(n)))]
  }

  /* ── Écriture ───────────────────────────────────────────────── */

  const normaliser = (s: string) => s.trim().toUpperCase().replace(/\s+/g, '')

  /** Un code en double rendrait deux clients indiscernables à l'export. */
  function codeExiste(code: string, exclureId?: string): boolean {
    const c = normaliser(code)
    return clients.value.some(x => x.id !== exclureId && normaliser(x.code) === c)
  }

  function creer(data: Omit<Client, 'id'>): { id: string } | { erreur: string } {
    if (!data.code.trim() || !data.nom.trim()) {
      return { erreur: 'Le code et le nom sont obligatoires.' }
    }
    if (codeExiste(data.code)) {
      return { erreur: `Le code ${data.code.trim().toUpperCase()} est déjà utilisé.` }
    }
    const max = clients.value.reduce((m, c) => Math.max(m, Number(c.id.slice(4)) || 0), 0)
    const id = `CLI-${String(max + 1).padStart(3, '0')}`
    clients.value.push({ ...data, code: data.code.trim().toUpperCase(), nom: data.nom.trim(), id })
    return { id }
  }

  function maj(id: string, data: Partial<Client>): { ok: true } | { erreur: string } {
    const c = getById(id)
    if (!c) return { erreur: 'Client introuvable.' }
    if (data.code && codeExiste(data.code, id)) {
      return { erreur: `Le code ${data.code.trim().toUpperCase()} est déjà utilisé.` }
    }
    Object.assign(c, data, data.code ? { code: data.code.trim().toUpperCase() } : {})
    return { ok: true }
  }

  /** Désactiver plutôt que supprimer : les voyages passés y font référence. */
  function basculerActif(id: string) {
    const c = getById(id)
    if (c) c.actif = !c.actif
  }

  return {
    clients, actifs, getById, retrouverParNom, toleranceDe, nomsOrphelins,
    codeExiste, creer, maj, basculerActif,
  }
})
