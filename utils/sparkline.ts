/**
 * Construit les chemins SVG (ligne et aire) d'un sparkline.
 * Le viewBox attendu est `0 0 width height`.
 */
export function sparklinePaths(points: number[], width = 100, height = 40) {
  if (points.length < 2) return { line: '', area: '' }

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const step = width / (points.length - 1)

  const coords = points.map((point, i) => {
    const x = (i * step).toFixed(2)
    const y = (height - 4 - ((point - min) / range) * (height - 8)).toFixed(2)
    return `${x},${y}`
  })

  const line = `M${coords.join(' L')}`
  return { line, area: `${line} L${width},${height} L0,${height} Z` }
}
