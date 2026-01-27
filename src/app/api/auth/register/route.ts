import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, createSession } from "@/lib/auth"
import { registerSchema } from "@/lib/validations"
import { createToken } from "@/lib/tokens"
import { sendVerificationEmail } from "@/lib/mail"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(data.password)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        emailVerified: false,
      },
    })

    // Create default categories
    await prisma.category.createMany({
      data: [
        { name: "Personnel", color: "#6366f1", icon: "user", userId: user.id },
        { name: "Travail", color: "#f59e0b", icon: "briefcase", userId: user.id },
        { name: "Courses", color: "#10b981", icon: "shopping-cart", userId: user.id },
      ],
    })

    // Create default preferences
    await prisma.userPreferences.create({
      data: { userId: user.id },
    })

    // Send verification email
    try {
      const verificationToken = await createToken(user.id, "EMAIL_VERIFICATION", 24)
      await sendVerificationEmail(data.email, verificationToken)
    } catch (mailError) {
      console.error("Failed to send verification email:", mailError)
      // Don't block registration if email fails
    }

    await createSession({ id: user.id, email: user.email, name: user.name })

    return NextResponse.json(
      {
        user: { id: user.id, email: user.email, name: user.name },
        message: "Compte créé ! Un email de vérification a été envoyé.",
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 })
    }
    console.error("Register error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
