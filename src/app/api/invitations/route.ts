import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const user = await requireAuth()

    // Get pending invitations for this user
    const invitations = await prisma.groupInvitation.findMany({
      where: {
        OR: [
          { recipientId: user.id },
          { email: user.email },
        ],
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: {
        group: {
          select: { id: true, name: true, color: true, description: true },
        },
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(invitations)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }
    console.error("Get invitations error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
