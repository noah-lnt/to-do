import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { z } from "zod"

const preferencesSchema = z.object({
  dailyRecapEnabled: z.boolean().optional(),
  recapTimes: z.array(z.string().regex(/^\d{2}:\d{2}$/)).optional(),
  recapEmail: z.boolean().optional(),
  defaultReminderMinutes: z.number().min(5).max(10080).optional(),
  browserNotifications: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  savedNotifyEmails: z.array(z.string().email()).optional(),
})

export async function GET() {
  try {
    const user = await requireAuth()

    let preferences = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
    })

    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: { userId: user.id },
      })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    console.error("Get preferences error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const data = preferencesSchema.parse(body)

    const preferences = await prisma.userPreferences.upsert({
      where: { userId: user.id },
      update: data,
      create: {
        userId: user.id,
        ...data,
      },
    })

    return NextResponse.json(preferences)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    console.error("Update preferences error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
