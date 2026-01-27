import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { z } from "zod"

const reorderSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string(),
      position: z.number(),
    })
  ),
})

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { tasks } = reorderSchema.parse(body)

    await prisma.$transaction(
      tasks.map((task) =>
        prisma.task.updateMany({
          where: { id: task.id, userId: user.id },
          data: { position: task.position },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    console.error("Reorder error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
