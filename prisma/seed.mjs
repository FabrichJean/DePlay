// Données de démonstration. Relancer sans risque : chaque projet est upserté par son nom.
// Usage : npm run db:seed
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const demoProjects = [
  {
    name: 'fabrich-profile',
    description: 'Application de gestion de profil et d’identité utilisateur.',
    url: 'fabrich-profil.vercel.app',
    kind: 'none',
    status: 'live',
    repository: 'FabrichJean/fabrich-profile',
    preset: 'next',
    deployments: 24,
    requests: '12.4k',
    errorRate: '0.02%',
    sparkline: '4,5,4,6,5,7,6,8,7,9,8,9',
    minutesAgo: 120,
  },
  {
    name: 'model-scraper',
    description: 'Outils de scraping et téléchargement de contenu multimédia.',
    url: 'free-pornhub-downloader.vercel.app',
    kind: 'none',
    status: 'building',
    repository: 'FabrichJean/model-scraper',
    preset: 'vite',
    deployments: 16,
    requests: '4.8k',
    errorRate: '0.12%',
    sparkline: '3,4,3,5,4,6,5,6,5,7,6,7',
    minutesAgo: 24 * 60,
  },
  {
    name: 'epta',
    description: 'Plateforme de visualisation et d’analyse de données.',
    url: 'epta-eight.vercel.app',
    kind: 'react',
    status: 'live',
    repository: 'FabrichJean/epta-view',
    preset: 'vite',
    deployments: 18,
    requests: '8.6k',
    errorRate: '0.05%',
    sparkline: '5,6,5,7,6,8,6,7,8,7,9,8',
    minutesAgo: 60 * 24 * 168,
  },
  {
    name: 'land',
    description: 'Site Web de présentation et portfolio professionnel.',
    url: 'land-tgn-swart.vercel.app',
    kind: 'none',
    status: 'attention',
    repository: 'FabrichJean/land',
    preset: 'static',
    deployments: 11,
    requests: '3.2k',
    errorRate: '0.48%',
    sparkline: '6,5,7,6,5,6,7,6,8,7,8,7',
    minutesAgo: 60 * 24 * 249,
  },
  {
    name: 'sagebiz-stunning',
    description: 'Plateforme e-commerce moderne et rapide.',
    url: 'sagebiz-stunning.vercel.app',
    kind: 'bolt',
    status: 'live',
    repository: 'FabrichJean/Sagebiz',
    preset: 'next',
    deployments: 27,
    requests: '15.3k',
    errorRate: '0.03%',
    sparkline: '7,8,7,9,8,9,10,9,10,9,11,10',
    minutesAgo: 60 * 24 * 313,
  },
  {
    name: 'rank-member-linear',
    description: 'Outil de gestion des membres et de classement.',
    url: 'rank-member-linear.vercel.app',
    kind: 'bolt',
    status: 'live',
    repository: 'FabrichJean/rank-member-linear',
    preset: 'vite',
    deployments: 8,
    requests: '2.7k',
    errorRate: '0.06%',
    sparkline: '2,3,3,4,3,4,4,5,4,5,5,6',
    minutesAgo: 60 * 24 * 340,
  },
]

for (const { minutesAgo, ...project } of demoProjects) {
  const updatedAt = new Date(Date.now() - minutesAgo * 60 * 1000)
  await prisma.project.upsert({
    where: { name: project.name },
    update: { ...project, updatedAt },
    create: { ...project, updatedAt, branch: 'main', source: 'git' },
  })
}

const demoDeployment = {
  id: 'todo-maaster',
  name: 'todo-maaster',
  description: 'Task management app with real-time features, built with Next.js and Express.',
  type: 'Web Application',
  runtime: 'Node.js',
  environment: 'Production',
  url: 'todo-mail.duckdns.org',
  branch: 'main',
  commit: 'a1b2c3d4',
  status: 'deployed',
  deployedAt: 'Oct 2, 2026 • 21:34',
  duration: '6m 52s',
  steps: JSON.stringify([
    { key: 'build', label: 'Build', duration: '2m 14s', status: 'done' },
    { key: 'test', label: 'Test', duration: '1m 32s', status: 'done' },
    { key: 'deploy', label: 'Deploy', duration: '1m 08s', status: 'done' },
    { key: 'live', label: 'Live', duration: 'Done', status: 'done' },
  ]),
  logs: JSON.stringify([
    { time: '21:32:11', message: 'Cloning repository...', tone: 'default' },
    { time: '21:32:14', message: 'Fetching submodules...', tone: 'default' },
    { time: '21:32:16', message: 'Installing dependencies...', tone: 'default' },
    { time: '21:32:38', message: 'Building application...', tone: 'default' },
    { time: '21:33:05', message: 'Running tests...', tone: 'default' },
    { time: '21:33:21', message: 'Preparing deployment...', tone: 'default' },
    { time: '21:33:42', message: 'Uploading to server (2.4 MB)...', tone: 'muted' },
    { time: '21:33:58', message: 'Restarting PM2 process...', tone: 'default' },
    { time: '21:34:03', message: 'Application is now running at port 3000', tone: 'success' },
    { time: '21:34:03', message: 'Deployment completed successfully! 🎉', tone: 'success' },
  ]),
  info: JSON.stringify({
    name: 'todo-maaster',
    framework: 'Next.js 14',
    runtime: 'Node.js 18',
    port: 3000,
    memory: '512 MB',
    cpu: '0.5 vCPU',
    created: 'Aug 12, 2026',
  }),
  server: JSON.stringify({
    status: 'online',
    ip: '154.51.63.78',
    provider: 'VPS (2 GB)',
    location: 'Madagascar',
    flag: '🇲🇬',
  }),
  metrics: JSON.stringify([
    { key: 'uptime', label: 'Uptime', value: '99.98%', delta: '+0.12%', icon: 'power', points: [99.2, 99.5, 99.3, 99.8, 99.7, 99.9, 99.98, 99.96, 99.99, 99.98] },
    { key: 'response', label: 'Response Time', value: '142 ms', delta: '-18%', icon: 'clock', points: [180, 160, 170, 150, 155, 148, 142, 145, 140, 142] },
    { key: 'traffic', label: 'Traffic', value: '2.4k req/min', delta: '+32%', icon: 'chart', points: [1.2, 1.5, 1.4, 1.8, 2.0, 2.1, 2.2, 2.3, 2.4, 2.4] },
  ]),
}

// Le déploiement de démo appartient au projet « fabrich-profile »
const linkedProject = await prisma.project.findUnique({ where: { name: 'fabrich-profile' } })
const deploymentWithProject = { ...demoDeployment, projectId: linkedProject?.id ?? null }

await prisma.deployment.upsert({
  where: { id: deploymentWithProject.id },
  update: deploymentWithProject,
  create: deploymentWithProject,
})

console.log(`Seeded ${demoProjects.length} demo projects and 1 demo deployment.`)
await prisma.$disconnect()
