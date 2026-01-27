import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { categorySchema } from "@/lib/validations"

export async function GET() {
  try {
    const user = await requireAuth()

    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      include: {
        _count: { select: { tasks: true } },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(categories)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const data = categorySchema.parse(body)

    const category = await prisma.category.create({
      data: {
        name: data.name,
        color: data.color || "#6366f1",
        icon: data.icon || "folder",
        userId: user.id,
      },
      include: {
        _count: { select: { tasks: true } },
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    console.error("Create category error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
