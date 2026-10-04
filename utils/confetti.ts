// Explosion de confettis sans dépendance : un canevas plein écran, retiré après l'animation.
// Ignorée si l'utilisateur préfère réduire les animations.
export function fireConfetti(options: { duration?: number; pieces?: number } = {}): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

  const duration = options.duration ?? 2800
  const pieces = options.pieces ?? 160
  const colors = ['#3b82f6', '#60a5fa', '#22c78a', '#facc15', '#f472b6', '#ffffff']

  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '2000',
  })
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    canvas.remove()
    return
  }

  // Départ au centre-haut de l'écran, en éventail
  const originX = canvas.width / 2
  const originY = canvas.height * 0.35
  const particles = Array.from({ length: pieces }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3
    const speed = 6 + Math.random() * 9
    return {
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 6 + Math.random() * 6,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
    }
  })

  const start = performance.now()
  const frame = (now: number) => {
    const elapsed = now - start
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const fade = Math.max(0, 1 - elapsed / duration)
    for (const p of particles) {
      p.vy += 0.28 // gravité
      p.vx *= 0.99 // résistance de l'air
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.spin

      ctx.save()
      ctx.globalAlpha = fade
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      ctx.restore()
    }

    if (elapsed < duration) {
      requestAnimationFrame(frame)
    } else {
      canvas.remove()
    }
  }
  requestAnimationFrame(frame)
}
