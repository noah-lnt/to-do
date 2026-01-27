import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Create demo user
  const hashedPassword = await bcrypt.hash("demo123", 12)

  const user = await prisma.user.upsert({
    where: { email: "demo@taskflow.app" },
    update: {},
    create: {
      email: "demo@taskflow.app",
      name: "Utilisateur Demo",
      password: hashedPassword,
    },
  })

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name_userId: { name: "Personnel", userId: user.id } },
      update: {},
      create: { name: "Personnel", color: "#6366f1", icon: "user", userId: user.id },
    }),
    prisma.category.upsert({
      where: { name_userId: { name: "Travail", userId: user.id } },
      update: {},
      create: { name: "Travail", color: "#f59e0b", icon: "briefcase", userId: user.id },
    }),
    prisma.category.upsert({
      where: { name_userId: { name: "Courses", userId: user.id } },
      update: {},
      create: { name: "Courses", color: "#10b981", icon: "shopping-cart", userId: user.id },
    }),
  ])

  // Create sample tasks
  const tasks = [
    {
      title: "Préparer la présentation trimestrielle",
      description: "Slides pour la réunion d'équipe de vendredi",
      status: "IN_PROGRESS" as const,
      priority: "HIGH" as const,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      categoryId: categories[1].id,
      position: 0,
    },
    {
      title: "Répondre aux emails importants",
      status: "TODO" as const,
      priority: "URGENT" as const,
      dueDate: new Date(),
      categoryId: categories[1].id,
      position: 1,
    },
    {
      title: "Faire les courses de la semaine",
      description: "Fruits, légumes, pain, fromage",
      status: "TODO" as const,
      priority: "MEDIUM" as const,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      categoryId: categories[2].id,
      position: 2,
    },
    {
      title: "Séance de sport",
      description: "Course à pied 30 minutes + étirements",
      status: "TODO" as const,
      priority: "LOW" as const,
      categoryId: categories[0].id,
      position: 3,
    },
    {
      title: "Réviser le code review PR #42",
      status: "IN_PROGRESS" as const,
      priority: "HIGH" as const,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      categoryId: categories[1].id,
      position: 4,
    },
    {
      title: "Lire le chapitre 5 du livre",
      description: "Clean Code de Robert C. Martin",
      status: "DONE" as const,
      priority: "LOW" as const,
      completedAt: new Date(),
      categoryId: categories[0].id,
      position: 5,
    },
    {
      title: "Organiser le bureau",
      status: "DONE" as const,
      priority: "LOW" as const,
      completedAt: new Date(),
      categoryId: categories[0].id,
      position: 6,
    },
  ]

  for (const task of tasks) {
    await prisma.task.create({
      data: {
        ...task,
        userId: user.id,
      },
    })
  }

  console.log("Seed completed successfully!")
  console.log(`Demo account: demo@taskflow.app / demo123`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
