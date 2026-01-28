import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString())

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    // Get all tasks that have a due date in this month
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        status: true,
        dueDate: true,
        priority: true,
      },
    })

    // Aggregate by day
    const dailyStats: Record<string, { total: number; done: number; inProgress: number; todo: number; hasUrgent: boolean }> = {}

    for (const task of tasks) {
      if (!task.dueDate) continue
      const day = task.dueDate.toISOString().split("T")[0]
      if (!dailyStats[day]) {
        dailyStats[day] = { total: 0, done: 0, inProgress: 0, todo: 0, hasUrgent: false }
      }
      dailyStats[day].total++
      if (task.status === "DONE") dailyStats[day].done++
      else if (task.status === "IN_PROGRESS") dailyStats[day].inProgress++
      else dailyStats[day].todo++
      if (task.priority === "URGENT") dailyStats[day].hasUrgent = true
    }

    // Also get tasks completed on each day (by completedAt), even if due date differs
    const completedInMonth = await prisma.task.findMany({
      where: {
        userId: user.id,
        status: "DONE",
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        completedAt: true,
      },
    })

    const completedByDay: Record<string, number> = {}
    for (const task of completedInMonth) {
      if (!task.completedAt) continue
      const day = task.completedAt.toISOString().split("T")[0]
      completedByDay[day] = (completedByDay[day] || 0) + 1
    }

    return NextResponse.json({
      year,
      month,
      dailyStats,
      completedByDay,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    console.error("Calendar error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
