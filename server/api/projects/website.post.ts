import type { FrameworkPreset, WebsiteProjectInput } from '../../../types/website'

const PRESETS: FrameworkPreset[] = ['nuxt', 'next', 'vite', 'static']
const NAME_PATTERN = /^[a-z0-9-]{3,40}$/
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024

interface ParsedRequest {
  body: Partial<WebsiteProjectInput>
  fileCount: number
  totalBytes: number
}

// Accepte du JSON (dépôt Git) ou du multipart (fichiers déposés + champ « config »)
async function parseRequest(event: Parameters<typeof readBody>[0]): Promise<ParsedRequest> {
  const contentType = getHeader(event, 'content-type') ?? ''

  if (!contentType.includes('multipart/form-data')) {
    return { body: await readBody<Partial<WebsiteProjectInput>>(event), fileCount: 0, totalBytes: 0 }
  }

  const parts = (await readMultipartFormData(event)) ?? []
  const config = parts.find((part) => part.name === 'config')

  let body: Partial<WebsiteProjectInput> = {}
  try {
    body = config?.data ? JSON.parse(config.data.toString('utf8')) : {}
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid configuration payload' })
  }

  const files = parts.filter((part) => part.name === 'files' && part.filename)
  return {
    body,
    fileCount: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.data.length, 0),
  }
}

export default defineEventHandler(async (event) => {
  requireUser(event)

  const { body, fileCount, totalBytes } = await parseRequest(event)
  const isUpload = body.source === 'upload'

  const errors: Partial<Record<keyof WebsiteProjectInput | 'files', string>> = {}
  if (!body.name || !NAME_PATTERN.test(body.name)) errors.name = 'Use 3–40 lowercase letters, digits or dashes.'
  if (!body.preset || !PRESETS.includes(body.preset)) errors.preset = 'Choose a framework preset.'

  if (isUpload) {
    if (fileCount === 0) errors.files = 'Add at least one file or folder.'
    if (totalBytes > MAX_UPLOAD_BYTES) {
      throw createError({ statusCode: 413, statusMessage: 'Upload exceeds 100 MB', data: { errors: { files: 'Upload exceeds 100 MB.' } } })
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
        fileCount: isUpload ? fileCount : 0,
        status: 'building',
      },
    })

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
