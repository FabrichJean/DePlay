// Ajoute https:// devant une URL sans schéma ; laisse telle quelle une URL déjà complète (ex. http://localhost:4100)
export function absoluteUrl(value: string): string {
  return value.includes('://') ? value : `https://${value}`
}
