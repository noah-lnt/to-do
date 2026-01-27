import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/tokens"
import { createToken } from "@/lib/tokens"
import { sendVerificationEmail } from "@/lib/mail"
import { requireAuth } from "@/lib/auth"

// GET: verify email with token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 })
    }

    const tokenRecord = await verifyToken(token, "EMAIL_VERIFICATION")

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Lien invalide ou expiré. Demandez un nouveau lien de vérification." },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { emailVerified: true },
    })

    return NextResponse.json({
      message: "Votre adresse email a été vérifiée avec succès !",
    })
  } catch (error) {
    console.error("Verify email error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST: resend verification email
export async function POST() {
  try {
    const user = await requireAuth()

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { emailVerified: true, email: true },
    })

    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    if (dbUser.emailVerified) {
      return NextResponse.json({ message: "Votre email est déjà vérifié." })
    }

    const token = await createToken(user.id, "EMAIL_VERIFICATION", 24)

    try {
      await sendVerificationEmail(dbUser.email, token)
    } catch (mailError) {
      console.error("Failed to send verification email:", mailError)
      return NextResponse.json(
        { error: "Impossible d'envoyer l'email. Réessayez plus tard." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Un nouvel email de vérification a été envoyé.",
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    console.error("Resend verification error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
