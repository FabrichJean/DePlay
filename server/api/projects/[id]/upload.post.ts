// Nouvelle version des fichiers d'un site uploadé (utilisé par la CLI) : remplace les sources
// puis crée un déploiement en attente, que le worker traite comme un redeploy.
export default defineEventHandler(async (event) => {
  const userId = currentUserId(event)

  const id = getRouterParam(event, 'id')
  const project = id ? await prisma.project.findUnique({ where: { id } }) : null
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }
  assertOwner(project, userId)

  if (project.source !== 'upload' || project.type !== 'website') {
    throw createError({ statusCode: 400, statusMessage: 'Only uploaded websites can receive new files' })
  }

  const inProgress = await prisma.deployment.findFirst({ where: { projectId: project.id, status: 'building' } })
  if (inProgress) {
    throw createError({ statusCode: 409, statusMessage: 'A deployment is already in progress' })
  }

  const parts = (await readMultipartFormData(event)) ?? []
  const archive = parts.find((part) => part.name === 'archive' && part.data)
  if (!archive) {
    throw createError({ statusCode: 400, statusMessage: 'Missing archive' })
  }

  const { files, fileCount, totalBytes } = extractArchive(archive.data)
  if (fileCount === 0) {
    throw createError({ statusCode: 400, statusMessage: 'The archive is empty' })
  }

  // Quota : l'ancienne version de ce projet est remplacée, elle ne compte donc pas
  const used = (await storageUsed(userId, project.id)) + project.outputBytes
  if (used + totalBytes > limits.storageQuotaBytes) {
    const message = `Storage limit reached: ${formatMegabytes(used)} used of ${formatMegabytes(limits.storageQuotaBytes)}.`
    throw createError({ statusCode: 413, statusMessage: message })
  }

  await replaceProjectFiles(project.name, files)

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: { fileCount, sourceBytes: totalBytes, status: 'building' },
  })
  const deployment = await prisma.deployment.create({
    data: initialDeploymentData(updated, { source: 'upload', repository: '', fileCount }),
  })

  setResponseStatus(event, 201)
  return { id: deployment.id, projectId: project.id, fileCount }
})
