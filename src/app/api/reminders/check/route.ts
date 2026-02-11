import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Client polls this endpoint to check for due reminders (browser notifications)
export async function GET() {
  try {
    const user = await requireAuth()

    const dueReminders = await prisma.reminder.findMany({
      where: {
        userId: user.id,
        sent: false,
        remindAt: { lte: new Date() },
        type: { in: ["BROWSER", "BOTH"] },
      },
      include: {
        task: { select: { id: true, title: true, dueDate: true, priority: true } },
      },
    })

    // Mark them as sent
    if (dueReminders.length > 0) {
      await prisma.reminder.updateMany({
        where: { id: { in: dueReminders.map((r: { id: string }) => r.id) } },
        data: { sent: true, sentAt: new Date() },
      })
    }

    return NextResponse.json(dueReminders)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
