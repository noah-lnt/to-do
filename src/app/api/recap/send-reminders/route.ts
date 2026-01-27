import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendReminderEmail } from "@/lib/mail"

// Cron endpoint: sends email reminders that are due
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const dueReminders = await prisma.reminder.findMany({
      where: {
        sent: false,
        remindAt: { lte: new Date() },
        type: { in: ["EMAIL", "BOTH"] },
      },
      include: {
        user: { select: { email: true } },
        task: { select: { title: true, dueDate: true } },
      },
    })

    let sentCount = 0

    for (const reminder of dueReminders) {
      try {
        await sendReminderEmail(
          reminder.user.email,
          reminder.task.title,
          reminder.task.dueDate?.toISOString() || null
        )

        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { sent: true, sentAt: new Date() },
        })

        sentCount++
      } catch (mailError) {
        console.error(`Failed to send reminder ${reminder.id}:`, mailError)
      }
    }

    return NextResponse.json({
      message: `${sentCount} rappel(s) envoyé(s)`,
      total: dueReminders.length,
    })
  } catch (error) {
    console.error("Send reminders cron error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
