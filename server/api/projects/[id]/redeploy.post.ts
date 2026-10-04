// Relance le build d'un projet : crée un nouveau déploiement en attente, que le worker traite
export default defineEventHandler(async (event) => {
  const userId = currentUserId(event)

  const id = getRouterParam(event, 'id')
  const project = id ? await prisma.project.findUnique({ where: { id } }) : null

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }
  assertOwner(project, userId)

  const inProgress = await prisma.deployment.findFirst({ where: { projectId: project.id, status: 'building' } })
  if (inProgress) {
    throw createError({
      statusCode: 409,
      statusMessage: 'A deployment is already in progress',
      data: { errors: { name: 'A deployment is already in progress for this project.' } },
    })
  }

  const deployment = await prisma.deployment.create({
    data: initialDeploymentData(project, {
      source: project.source === 'upload' ? 'upload' : 'git',
      repository: project.repository,
      fileCount: project.fileCount,
      cloneToken: project.source === 'upload' ? null : await githubToken(event, userId),
    }),
  })
  await prisma.project.update({ where: { id: project.id }, data: { status: 'building' } })

  setResponseStatus(event, 201)
  return { id: deployment.id, projectId: project.id }
})
