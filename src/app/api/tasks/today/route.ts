import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const user = await requireAuth()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get all tasks for today (due today or created today without due date)
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        OR: [
          { dueDate: { gte: today, lt: tomorrow } },
          {
            dueDate: null,
            createdAt: { gte: today, lt: tomorrow },
          },
          // Also include overdue tasks still not done
          {
            dueDate: { lt: today },
            status: { not: "DONE" },
          },
        ],
      },
      include: { category: true },
      orderBy: [
        { status: "asc" },
        { priority: "desc" },
        { position: "asc" },
      ],
    })

    const total = tasks.length
    const done = tasks.filter((t: { status: string }) => t.status === "DONE").length
    const percentage = total > 0 ? Math.round((done / total) * 100) : 0

    return NextResponse.json({
      tasks,
      stats: { total, done, percentage },
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    console.error("Today tasks error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
