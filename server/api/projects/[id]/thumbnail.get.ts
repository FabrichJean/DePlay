import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'

// Capture d'écran d'un projet : seul son propriétaire peut la voir
export default defineEventHandler(async (event) => {
  const userId = currentUserId(event)

  const id = getRouterParam(event, 'id')
  const project = id ? await prisma.project.findUnique({ where: { id }, select: { id: true, ownerId: true, thumbnailAt: true } }) : null
  if (!project) throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  assertOwner(project, userId)

  const file = join(resolve(process.env.THUMBNAILS_DIR ?? resolve(process.cwd(), 'storage/thumbnails')), `${project.id}.jpg`)
  const info = await stat(file).catch(() => null)
  if (!info?.isFile()) throw createError({ statusCode: 404, statusMessage: 'No thumbnail yet' })

  setResponseHeader(event, 'content-type', 'image/jpeg')
  setResponseHeader(event, 'cache-control', 'private, max-age=300')
  return sendStream(event, createReadStream(file))
})
