// Format plaque malgache : NNNN AAA (4 chiffres + espace + 2-3 lettres)
// Ex : "1234 TNR", "5678 TAN", "9012 MJN"

export function formatPlaque(plaque: string): string {
  return plaque.trim().toUpperCase()
}

export function validatePlaque(plaque: string): boolean {
  return /^\d{4}\s[A-Z]{2,3}$/.test(plaque.trim())
}

export function plaqueError(plaque: string): string | null {
  if (!plaque.trim()) return 'La plaque est obligatoire'
  if (!validatePlaque(plaque)) return 'Format invalide. Utilisez : 4 chiffres + espace + 2-3 lettres (ex: 1234 TNR)'
  return null
}
