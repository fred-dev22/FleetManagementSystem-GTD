import type { DropdownItem } from '../components/ui/SearchableDropdown.vue'

/**
 * Conversion des données du projet vers les options de SearchableDropdown.
 *
 * Sans ces fonctions, chaque écran remplacerait son `<select>` par un
 * `computed` de dix lignes recopié à l'identique. La conversion est faite
 * une fois ici, et l'écran ne garde que ce qui lui est propre.
 */

/**
 * Convertit un dictionnaire de libellés - les constantes `LIB_*` du projet -
 * en options. La clé du dictionnaire devient l'identifiant, ce qui préserve
 * exactement la valeur que le `<select>` transmettait.
 */
export function optionsDeLibelles<K extends string>(
  libelles: Record<K, string>,
  sousLibelles?: Partial<Record<K, string>>,
): DropdownItem[] {
  return (Object.entries(libelles) as [K, string][]).map(([cle, libelle]) => ({
    id: cle,
    label: libelle,
    sublabel: sousLibelles?.[cle],
  }))
}

/** Convertit une liste de chaînes en options : marques, produits, sites. */
export function optionsDeChaines(valeurs: readonly string[]): DropdownItem[] {
  return valeurs.map(v => ({ id: v, label: v }))
}

/**
 * Convertit une liste d'entités en options.
 *
 * Le sous-libellé est recherchable au même titre que le libellé : taper une
 * marque retrouve le véhicule, taper un site retrouve le trajet. C'est ce qui
 * distingue ce composant d'une liste déroulante native, où seule la frappe
 * sur le premier caractère du libellé fonctionne.
 */
export function optionsDEntites<T>(
  items: readonly T[],
  extraire: (item: T) => {
    id: string
    label: string
    sublabel?: string
    /** Visible mais non sélectionnable, avec sa raison affichée */
    indisponible?: boolean
    raison?: string
  },
): DropdownItem[] {
  return items.map(item => {
    const e = extraire(item)
    return {
      id: e.id,
      label: e.label,
      sublabel: e.sublabel,
      itemDisabled: e.indisponible,
      disabledReason: e.raison,
    }
  })
}
