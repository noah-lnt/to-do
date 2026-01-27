import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createToken } from "@/lib/tokens"
import { sendPasswordResetEmail } from "@/lib/mail"
import { z } from "zod"

const schema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = schema.parse(body)

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
      })
    }

    const token = await createToken(user.id, "PASSWORD_RESET", 1) // 1 hour

    try {
      await sendPasswordResetEmail(email, token)
    } catch (mailError) {
      console.error("Failed to send password reset email:", mailError)
      // Still return success to avoid leaking info
    }

    return NextResponse.json({
      message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
