// Journaux d'un projet : dernier build (en base) et, pour un web service, sortie du conteneur en marche
const RUNTIME_LINES = 300

export default defineEventHandler(async (event) => {
  const userId = currentUserId(event)

  const id = getRouterParam(event, 'id')
  const project = id ? await prisma.project.findUnique({ where: { id } }) : null

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }
  assertOwner(project, userId)

  const last = await prisma.deployment.findFirst({
    where: { projectId: project.id },
    orderBy: { createdAt: 'desc' },
  })

  let buildLines: { time: string, message: string, tone: string }[] = []
  if (last) {
    try {
      buildLines = JSON.parse(last.logs)
    } catch {
      buildLines = []
    }
  }

  let runtime: { available: boolean, state: string, lines: string[] } | null = null
  if (project.type === 'webservice') {
    const name = serviceName(project.id)
    const result = await podman(['logs', '--tail', String(RUNTIME_LINES), name])
    const state = await podman(['inspect', '-f', '{{.State.Status}}', name])

    runtime = {
      available: result.code !== -1,
      state: state.code === 0 ? state.stdout.trim() : 'missing',
      // Le conteneur écrit parfois sur stderr : on rassemble les deux flux dans l'ordre d'arrivée approximatif
      lines: `${result.stdout}${result.stderr}`.split('\n').filter((line) => line.length > 0),
    }
  }

  return {
    project: { id: project.id, name: project.name, type: project.type },
    build: last
      ? {
          deploymentId: last.id,
          status: last.status,
          createdAt: last.createdAt,
          lines: buildLines,
        }
      : null,
    runtime,
  }
})
