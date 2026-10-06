// Web services du compte : état du conteneur, mémoire utilisée et dernier déploiement
export default defineEventHandler(async (event) => {
  const userId = currentUserId(event)

  const rows = await prisma.project.findMany({
    where: { ownerId: userId, type: 'webservice' },
    orderBy: { createdAt: 'asc' },
  })
  const containers = await listServiceContainers()
  const byName = new Map((containers ?? []).map((container) => [container.name, container.state]))

  const running = rows
    .map((row) => serviceName(row.id))
    .filter((name) => byName.get(name) === 'running')
  const memory = await serviceMemory(running)

  const services = await Promise.all(rows.map(async (row) => {
    const name = serviceName(row.id)
    const state = containers === null ? 'unknown' : byName.get(name) ?? 'missing'
    const last = await prisma.deployment.findFirst({
      where: { projectId: row.id },
      orderBy: { createdAt: 'desc' },
      select: { status: true, createdAt: true },
    })

    return {
      id: row.id,
      name: row.name,
      url: row.url,
      runtime: row.runtime,
      port: row.port,
      startCommand: row.startCommand,
      state,
      memory: memory.get(name) ?? null,
      memoryLimit: limits.webServiceMemory,
      lastStatus: last?.status ?? null,
      lastAt: last?.createdAt ?? null,
    }
  }))

  return {
    // Faux si Podman n'est pas joignable : la page l'indique au lieu d'afficher des états inventés
    available: containers !== null,
    limits: {
      maxServices: limits.maxWebServicesPerUser,
      memory: limits.webServiceMemory,
      cpus: limits.webServiceCpus,
    },
    services,
  }
})
