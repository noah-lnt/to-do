import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const user = await requireAuth()
    const { token } = await params

    const invitation = await prisma.groupInvitation.findUnique({
      where: { token },
      include: { group: true },
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invitation non trouvee" }, { status: 404 })
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json({ error: "Cette invitation a deja ete traitee" }, { status: 400 })
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.groupInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      })
      return NextResponse.json({ error: "Cette invitation a expire" }, { status: 400 })
    }

    // Check if invitation is for this user
    if (invitation.recipientId && invitation.recipientId !== user.id) {
      return NextResponse.json({ error: "Cette invitation n'est pas pour vous" }, { status: 403 })
    }

    if (!invitation.recipientId && invitation.email !== user.email) {
      return NextResponse.json({ error: "Cette invitation n'est pas pour vous" }, { status: 403 })
    }

    // Check if already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: invitation.groupId,
          userId: user.id,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: "Vous etes deja membre de ce groupe" }, { status: 400 })
    }

    // Accept invitation in a transaction
    const result = await prisma.$transaction([
      prisma.groupInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          recipientId: user.id,
          respondedAt: new Date(),
        },
      }),
      prisma.groupMember.create({
        data: {
          groupId: invitation.groupId,
          userId: user.id,
          role: "MEMBER",
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      groupId: invitation.groupId,
      groupName: invitation.group.name,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }
    console.error("Accept invitation error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
