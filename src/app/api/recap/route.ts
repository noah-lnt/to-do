import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendDailyRecapEmail } from "@/lib/mail"

// This endpoint is designed to be called by a cron job (e.g., every 15 minutes)
// It checks which users have recap enabled and sends them their summary
// Secure with a secret key in production
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

    // Find users with recap enabled at the current time (with 15-minute window)
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const matchTimes: string[] = []

    // Match times within a 15-minute window
    for (let m = 0; m < 15; m++) {
      const checkMinute = currentMinute - m
      const checkHour = checkMinute < 0 ? currentHour - 1 : currentHour
      const normalizedMinute = checkMinute < 0 ? 60 + checkMinute : checkMinute
      if (checkHour >= 0) {
        matchTimes.push(
          `${String(checkHour).padStart(2, "0")}:${String(normalizedMinute).padStart(2, "0")}`
        )
      }
    }

    const preferences = await prisma.userPreferences.findMany({
      where: {
        dailyRecapEnabled: true,
        recapEmail: true,
        recapTimes: { hasSome: matchTimes },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    let sentCount = 0

    for (const pref of preferences) {
      try {
        const tasks = await prisma.task.findMany({
          where: {
            userId: pref.userId,
            status: { not: "DONE" },
          },
          select: {
            title: true,
            priority: true,
            dueDate: true,
            status: true,
          },
          orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        })

        await sendDailyRecapEmail(
          pref.user.email,
          pref.user.name || "",
          tasks.map((t: { title: string; priority: string; dueDate: Date | null; status: string }) => ({
            title: t.title,
            priority: t.priority,
            dueDate: t.dueDate?.toISOString() || null,
            status: t.status,
          }))
        )
        sentCount++
      } catch (mailError) {
        console.error(`Failed to send recap to ${pref.user.email}:`, mailError)
      }
    }

    return NextResponse.json({
      message: `Recap envoyé à ${sentCount} utilisateur(s)`,
      time: currentTime,
      matched: preferences.length,
    })
  } catch (error) {
    console.error("Recap cron error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
