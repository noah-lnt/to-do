import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { z } from "zod"

const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: groupId, userId: targetUserId } = await params
    const body = await request.json()
    const { role } = updateRoleSchema.parse(body)

    // Check if current user is owner
    const group = await prisma.group.findFirst({
      where: { id: groupId, ownerId: user.id },
    })

    if (!group) {
      return NextResponse.json({ error: "Seul le proprietaire peut modifier les roles" }, { status: 403 })
    }

    // Can't change owner's role
    if (targetUserId === group.ownerId) {
      return NextResponse.json({ error: "Impossible de modifier le role du proprietaire" }, { status: 400 })
    }

    const member = await prisma.groupMember.update({
      where: {
        groupId_userId: {
          groupId,
          userId: targetUserId,
        },
      },
      data: { role },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(member)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }
    console.error("Update member role error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: groupId, userId: targetUserId } = await params

    // Get group and check permissions
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    })

    if (!group) {
      return NextResponse.json({ error: "Groupe non trouve" }, { status: 404 })
    }

    // Owner can't leave/be removed
    if (targetUserId === group.ownerId) {
      return NextResponse.json({ error: "Le proprietaire ne peut pas quitter le groupe" }, { status: 400 })
    }

    // User can remove themselves, or owner/admin can remove others
    const isRemovingSelf = user.id === targetUserId

    if (!isRemovingSelf) {
      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId: user.id,
          role: { in: ["OWNER", "ADMIN"] },
        },
      })

      if (!membership) {
        return NextResponse.json({ error: "Non autorise" }, { status: 403 })
      }
    }

    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId: targetUserId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }
    console.error("Remove member error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
