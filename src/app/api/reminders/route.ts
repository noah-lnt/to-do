import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { z } from "zod"

const reminderSchema = z.object({
  taskId: z.string(),
  remindAt: z.string(),
  type: z.enum(["BROWSER", "EMAIL", "BOTH"]).optional(),
})

// GET all reminders for user
export async function GET() {
  try {
    const user = await requireAuth()

    const reminders = await prisma.reminder.findMany({
      where: { userId: user.id, sent: false },
      include: {
        task: { select: { title: true, dueDate: true, status: true, priority: true } },
      },
      orderBy: { remindAt: "asc" },
    })

    return NextResponse.json(reminders)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    console.error("Get reminders error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST create a new reminder
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const data = reminderSchema.parse(body)

    // Verify task belongs to user
    const task = await prisma.task.findFirst({
      where: { id: data.taskId, userId: user.id },
    })

    if (!task) {
      return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 })
    }

    const reminder = await prisma.reminder.create({
      data: {
        taskId: data.taskId,
        userId: user.id,
        remindAt: new Date(data.remindAt),
        type: data.type || "BROWSER",
      },
      include: {
        task: { select: { title: true, dueDate: true, status: true, priority: true } },
      },
    })

    return NextResponse.json(reminder, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    console.error("Create reminder error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
