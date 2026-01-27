import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const user = await requireAuth()

    const [total, todo, inProgress, done, urgent, overdue] = await Promise.all([
      prisma.task.count({ where: { userId: user.id } }),
      prisma.task.count({ where: { userId: user.id, status: "TODO" } }),
      prisma.task.count({ where: { userId: user.id, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { userId: user.id, status: "DONE" } }),
      prisma.task.count({ where: { userId: user.id, priority: "URGENT", status: { not: "DONE" } } }),
      prisma.task.count({
        where: {
          userId: user.id,
          status: { not: "DONE" },
          dueDate: { lt: new Date() },
        },
      }),
    ])

    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0

    // Tasks completed today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const completedToday = await prisma.task.count({
      where: {
        userId: user.id,
        status: "DONE",
        completedAt: { gte: today },
      },
    })

    return NextResponse.json({
      total,
      todo,
      inProgress,
      done,
      urgent,
      overdue,
      completionRate,
      completedToday,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    console.error("Stats error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
