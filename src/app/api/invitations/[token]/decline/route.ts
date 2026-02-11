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
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invitation non trouvee" }, { status: 404 })
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json({ error: "Cette invitation a deja ete traitee" }, { status: 400 })
    }

    // Check if invitation is for this user
    if (invitation.recipientId && invitation.recipientId !== user.id) {
      return NextResponse.json({ error: "Cette invitation n'est pas pour vous" }, { status: 403 })
    }

    if (!invitation.recipientId && invitation.email !== user.email) {
      return NextResponse.json({ error: "Cette invitation n'est pas pour vous" }, { status: 403 })
    }

    await prisma.groupInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "DECLINED",
        recipientId: user.id,
        respondedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }
    console.error("Decline invitation error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
