import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/tokens"
import { hashPassword } from "@/lib/auth"
import { z } from "zod"

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = schema.parse(body)

    const tokenRecord = await verifyToken(token, "PASSWORD_RESET")

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Lien invalide ou expiré. Veuillez refaire une demande." },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)

    await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { password: hashedPassword },
    })

    return NextResponse.json({
      message: "Votre mot de passe a été réinitialisé avec succès.",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Données invalides" },
        { status: 400 }
      )
    }
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
