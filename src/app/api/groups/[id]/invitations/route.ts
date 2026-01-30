import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { sendEmail } from "@/lib/mail"
import { z } from "zod"
import { addDays } from "date-fns"

const inviteSchema = z.object({
  email: z.string().email(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: groupId } = await params
    const body = await request.json()
    const { email } = inviteSchema.parse(body)

    // Check if user is owner or admin
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

    // Get group details
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    })

    if (!group) {
      return NextResponse.json({ error: "Groupe non trouve" }, { status: 404 })
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      const existingMember = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId: existingUser.id,
          },
        },
      })

      if (existingMember) {
        return NextResponse.json({ error: "Cet utilisateur est deja membre du groupe" }, { status: 400 })
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.groupInvitation.findFirst({
      where: {
        groupId,
        email,
        status: "PENDING",
      },
    })

    if (existingInvitation) {
      return NextResponse.json({ error: "Une invitation est deja en attente pour cet email" }, { status: 400 })
    }

    // Create invitation
    const invitation = await prisma.groupInvitation.create({
      data: {
        groupId,
        email,
        senderId: user.id,
        recipientId: existingUser?.id || null,
        expiresAt: addDays(new Date(), 7),
      },
      include: {
        group: { select: { name: true } },
        sender: { select: { name: true, email: true } },
      },
    })

    // Send invitation email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invitations/${invitation.token}`

    try {
      await sendEmail({
        to: email,
        subject: `Invitation a rejoindre le groupe "${group.name}"`,
        html: `
          <h1>Vous avez ete invite a rejoindre un groupe</h1>
          <p>${user.name || user.email} vous invite a rejoindre le groupe <strong>${group.name}</strong>.</p>
          <p><a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px;">Accepter l'invitation</a></p>
          <p>Ce lien expire dans 7 jours.</p>
          ${!existingUser ? '<p>Si vous n\'avez pas encore de compte, vous pourrez en creer un en cliquant sur le lien.</p>' : ''}
        `,
      })
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError)
    }

    return NextResponse.json(invitation, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 })
    }
    console.error("Create invitation error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: groupId } = await params

    // Check if user is member of group
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: user.id,
      },
    })

    if (!membership) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 })
    }

    const invitations = await prisma.groupInvitation.findMany({
      where: { groupId },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        recipient: { select: { id: true, name: true, email: true } },
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
