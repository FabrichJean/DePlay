// Rattache les projets sans propriétaire à un utilisateur Clerk.
// Usage : npm run db:claim -- user_xxxxxxxx
import { PrismaClient } from '@prisma/client'

const userId = process.argv[2]
if (!userId || !userId.startsWith('user_')) {
  console.error('Usage: npm run db:claim -- user_xxxxxxxx')
  process.exit(1)
}

const prisma = new PrismaClient()
const { count } = await prisma.project.updateMany({ where: { ownerId: null }, data: { ownerId: userId } })
console.log(`Assigned ${count} project(s) to ${userId}.`)
await prisma.$disconnect()
