import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { taskSchema } from "@/lib/validations"
import { addDays, addWeeks, addMonths, addYears } from "date-fns"
import { sendTaskCompletionNotification } from "@/lib/mail"

function calculateNextDueDate(
  currentDueDate: Date,
  pattern: string,
  interval: number
): Date {
  switch (pattern) {
    case "DAILY":
      return addDays(currentDueDate, interval)
    case "WEEKLY":
      return addWeeks(currentDueDate, interval)
    case "MONTHLY":
      return addMonths(currentDueDate, interval)
    case "YEARLY":
      return addYears(currentDueDate, interval)
    default:
      return addDays(currentDueDate, interval)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const task = await prisma.task.findFirst({
      where: { id, userId: user.id },
      include: { category: true, group: true, assignee: true },
    })

    if (!task) {
      return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()
    const data = taskSchema.partial().parse(body)

    const existingTask = await prisma.task.findFirst({
      where: { id, userId: user.id },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null
    if (data.position !== undefined) updateData.position = data.position

    // Recurrence fields
    if (data.recurrenceType !== undefined) updateData.recurrenceType = data.recurrenceType
    if (data.recurrenceInterval !== undefined) updateData.recurrenceInterval = data.recurrenceInterval
    if (data.recurrenceEndDate !== undefined) updateData.recurrenceEndDate = data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null
    if (data.recurrenceDays !== undefined) updateData.recurrenceDays = data.recurrenceDays || []

    // Group & Assignment fields
    if (data.groupId !== undefined) updateData.groupId = data.groupId || null
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId || null

    // Notification fields
    if (data.notifyOnComplete !== undefined) updateData.notifyOnComplete = data.notifyOnComplete
    if (data.notifyEmail !== undefined) updateData.notifyEmail = data.notifyEmail || null

    // Auto-save notify email to user preferences if new
    if (data.notifyEmail && data.notifyOnComplete) {
      const prefs = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      })
      const savedEmails = prefs?.savedNotifyEmails || []

      if (!savedEmails.includes(data.notifyEmail)) {
        await prisma.userPreferences.upsert({
          where: { userId: user.id },
          update: { savedNotifyEmails: [...savedEmails, data.notifyEmail] },
          create: { userId: user.id, savedNotifyEmails: [data.notifyEmail] },
        })
      }
    }

    // Handle status change
    if (data.status !== undefined) {
      updateData.status = data.status

      // If completing a recurring task, generate the next occurrence
      if (
        data.status === "DONE" &&
        existingTask.status !== "DONE" &&
        existingTask.recurrenceType &&
        existingTask.dueDate
      ) {
        updateData.completedAt = new Date()

        // Calculate next due date
        const nextDueDate = calculateNextDueDate(
          existingTask.dueDate,
          existingTask.recurrenceType,
          existingTask.recurrenceInterval || 1
        )

        // Check if we should create next occurrence (not past end date)
        const shouldCreate =
          !existingTask.recurrenceEndDate ||
          nextDueDate <= existingTask.recurrenceEndDate

        if (shouldCreate) {
          // Get max position for new task
          const maxPosition = await prisma.task.aggregate({
            where: { userId: user.id },
            _max: { position: true },
          })

          // Create the next occurrence
          await prisma.task.create({
            data: {
              title: existingTask.title,
              description: existingTask.description,
              priority: existingTask.priority,
              status: "TODO",
              dueDate: nextDueDate,
              categoryId: existingTask.categoryId,
              userId: user.id,
              recurrenceType: existingTask.recurrenceType,
              recurrenceInterval: existingTask.recurrenceInterval,
              recurrenceEndDate: existingTask.recurrenceEndDate,
              parentTaskId: existingTask.parentTaskId || existingTask.id,
              position: (maxPosition._max.position ?? -1) + 1,
            },
          })
        }
      } else if (data.status === "DONE") {
        updateData.completedAt = new Date()
      } else {
        updateData.completedAt = null
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: { category: true, group: true, assignee: true },
    })

    // Send completion notification email if applicable
    if (
      data.status === "DONE" &&
      existingTask.status !== "DONE" &&
      existingTask.notifyOnComplete &&
      existingTask.notifyEmail
    ) {
      try {
        await sendTaskCompletionNotification(
          existingTask.notifyEmail,
          existingTask.title,
          user.name || user.email,
          new Date()
        )
      } catch (emailError) {
        // Log error but don't fail the task update
        console.error("Failed to send completion notification:", emailError)
      }
    }

    return NextResponse.json(task)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 })
    }
    console.error("Update task error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const existingTask = await prisma.task.findFirst({
      where: { id, userId: user.id },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 })
    }

    await prisma.task.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
