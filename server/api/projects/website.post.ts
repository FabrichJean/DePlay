import type { FrameworkPreset, WebsiteProjectInput } from '../../../types/website'
import type { StoredFile } from '../../utils/project-storage'
import { isReservedName } from '../../../constants/reserved-names'

const PRESETS: FrameworkPreset[] = ['nuxt', 'next', 'vite', 'static']
const NAME_PATTERN = /^[a-z0-9-]{3,40}$/
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024

interface ParsedRequest {
  body: Partial<WebsiteProjectInput>
  files: StoredFile[]
  fileCount: number
  totalBytes: number
}

// Accepte du JSON (dépôt Git) ou du multipart (fichiers déposés + champ « config »)
async function parseRequest(event: Parameters<typeof readBody>[0]): Promise<ParsedRequest> {
  const contentType = getHeader(event, 'content-type') ?? ''

  if (!contentType.includes('multipart/form-data')) {
    return { body: await readBody<Partial<WebsiteProjectInput>>(event), files: [], fileCount: 0, totalBytes: 0 }
  }

  const parts = (await readMultipartFormData(event)) ?? []
  const config = parts.find((part) => part.name === 'config')

  let body: Partial<WebsiteProjectInput> = {}
  try {
    body = config?.data ? JSON.parse(config.data.toString('utf8')) : {}
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid configuration payload' })
  }

  const uploads = parts.filter((part) => part.name === 'files' && part.filename)
  return {
    body,
    files: uploads.map((file) => ({ path: file.filename!, data: file.data })),
    fileCount: uploads.length,
    totalBytes: uploads.reduce((sum, file) => sum + file.data.length, 0),
  }
}

export default defineEventHandler(async (event) => {
  const userId = currentUserId(event)

  const { body, files, fileCount, totalBytes } = await parseRequest(event)
  const isUpload = body.source === 'upload'

  const errors: Partial<Record<keyof WebsiteProjectInput | 'files', string>> = {}
  if (!body.name || !NAME_PATTERN.test(body.name)) errors.name = 'Use 3–40 lowercase letters, digits or dashes.'
  else if (isReservedName(body.name)) errors.name = 'This name is reserved. Choose another one.'
  if (!body.preset || !PRESETS.includes(body.preset)) errors.preset = 'Choose a framework preset.'

  if (isUpload) {
    if (fileCount === 0) errors.files = 'Add at least one file or folder.'
    if (totalBytes > MAX_UPLOAD_BYTES) {
      throw createError({ statusCode: 413, statusMessage: 'Upload exceeds 200 MB', data: { errors: { files: 'Upload exceeds 200 MB.' } } })
    }
  } else {
    if (!body.repository) errors.repository = 'Choose a repository.'
    if (!body.branch?.trim()) errors.branch = 'Branch is required.'
  }

  if (Object.keys(errors).length) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid website project', data: { errors } })
  }

  try {
    const row = await prisma.project.create({
      data: {
        name: body.name!,
        source: isUpload ? 'upload' : 'git',
        repository: body.repository ?? '',
        branch: body.branch?.trim() || 'main',
        preset: body.preset!,
        rootDirectory: body.rootDirectory?.trim() || './',
        installCommand: body.installCommand ?? '',
        buildCommand: body.buildCommand ?? '',
        outputDirectory: body.outputDirectory?.trim() || '.',
        ownerId: userId,
        fileCount: isUpload ? fileCount : 0,
        status: 'building',
      },
    })

    // Fichiers puis premier déploiement, après la ligne projet ; en cas d'échec, tout est annulé
    try {
      if (isUpload) await writeProjectFiles(row.name, files)

      await prisma.deployment.create({
        data: initialDeploymentData(row, {
          source: isUpload ? 'upload' : 'git',
          repository: row.repository,
          fileCount,
        }),
      })
    } catch (error) {
      await prisma.deployment.deleteMany({ where: { projectId: row.id } })
      await prisma.project.delete({ where: { id: row.id } })
      await removeProjectFiles(row.name)
      throw error
    }

    setResponseStatus(event, 201)
    return { id: row.id, name: row.name, fileCount: isUpload ? fileCount : undefined }
  } catch (error) {
    // P2002 : contrainte d'unicité violée, le nom est déjà pris
    if ((error as { code?: string }).code === 'P2002') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Project name already taken',
        data: { errors: { name: 'A project with this name already exists.' } },
      })
    }
    throw error
  }
})
