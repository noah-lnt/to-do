import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, hashPassword, verifyPassword, createSession } from "@/lib/auth"
import { z } from "zod"

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
})

// GET current user profile
export async function GET() {
  try {
    const user = await requireAuth()

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        _count: { select: { tasks: true, categories: true } },
      },
    })

    return NextResponse.json(dbUser)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PATCH update profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    // Handle password change
    if (body.currentPassword && body.newPassword) {
      const data = changePasswordSchema.parse(body)

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { password: true },
      })

      if (!dbUser) {
        return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
      }

      const isValid = await verifyPassword(data.currentPassword, dbUser.password)
      if (!isValid) {
        return NextResponse.json(
          { error: "Mot de passe actuel incorrect" },
          { status: 400 }
        )
      }

      const hashedPassword = await hashPassword(data.newPassword)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      })

      return NextResponse.json({ message: "Mot de passe modifié avec succès" })
    }

    // Handle profile update
    const data = updateProfileSchema.parse(body)

    if (data.email && data.email !== user.email) {
      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      })
      if (existing) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé" },
          { status: 409 }
        )
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email, emailVerified: false }),
      },
      select: { id: true, name: true, email: true },
    })

    // Refresh session with new data
    await createSession({ id: updated.id, email: updated.email, name: updated.name })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    console.error("Update account error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE account
export async function DELETE() {
  try {
    const user = await requireAuth()

    await prisma.user.delete({ where: { id: user.id } })

    return NextResponse.json({ message: "Compte supprimé" })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
