import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { taskSchema } from "@/lib/validations"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const categoryId = searchParams.get("categoryId")
    const search = searchParams.get("search")
    const dueDate = searchParams.get("dueDate")
    const sortBy = searchParams.get("sortBy") || "position"
    const sortOrder = searchParams.get("sortOrder") || "asc"

    const where: Record<string, unknown> = { userId: user.id }

    if (status) where.status = status
    if (priority) where.priority = priority
    if (categoryId) where.categoryId = categoryId
    if (dueDate) {
      const dayStart = new Date(dueDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dueDate)
      dayEnd.setHours(23, 59, 59, 999)
      where.dueDate = { gte: dayStart, lte: dayEnd }
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const tasks = await prisma.task.findMany({
      where,
      include: { category: true, group: true, assignee: true },
      orderBy: { [sortBy]: sortOrder },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    console.error("Get tasks error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const data = taskSchema.parse(body)

    // Get the max position for ordering
    const maxPosition = await prisma.task.aggregate({
      where: { userId: user.id },
      _max: { position: true },
    })

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        status: data.status || "TODO",
        priority: data.priority || "MEDIUM",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        categoryId: data.categoryId || null,
        position: (maxPosition._max.position ?? -1) + 1,
        userId: user.id,
        recurrenceType: data.recurrenceType || null,
        recurrenceInterval: data.recurrenceInterval || null,
        recurrenceEndDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null,
        recurrenceDays: data.recurrenceDays || [],
        groupId: data.groupId || null,
        assigneeId: data.assigneeId || null,
        notifyOnComplete: data.notifyOnComplete || false,
        notifyEmail: data.notifyEmail || null,
      },
      include: { category: true, group: true, assignee: true },
    })

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

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 })
    }
    console.error("Create task error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
