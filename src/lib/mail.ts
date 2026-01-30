import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      }
    : undefined,
})

const FROM = process.env.SMTP_FROM || "TaskFlow <noreply@taskflow.app>"
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000"

// Generic email sender
export async function sendEmail(options: { to: string; subject: string; html: string }) {
  await transporter.sendMail({
    from: FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  })
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Vérifiez votre adresse email - TaskFlow",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="color: #111; font-size: 24px; margin-bottom: 16px;">Bienvenue sur TaskFlow</h1>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Merci de vous être inscrit ! Veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="background-color: #111; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
              Vérifier mon email
            </a>
          </div>
          <p style="color: #999; font-size: 13px;">
            Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez cet email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #bbb; font-size: 12px; text-align: center;">TaskFlow - Gestionnaire de tâches</p>
        </div>
      </body>
      </html>
    `,
  })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Réinitialisation de votre mot de passe - TaskFlow",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="color: #111; font-size: 24px; margin-bottom: 16px;">Réinitialisation du mot de passe</h1>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background-color: #111; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="color: #999; font-size: 13px;">
            Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #bbb; font-size: 12px; text-align: center;">TaskFlow - Gestionnaire de tâches</p>
        </div>
      </body>
      </html>
    `,
  })
}

export async function sendDailyRecapEmail(
  email: string,
  userName: string,
  tasks: { title: string; priority: string; dueDate: string | null; status: string }[]
) {
  const todoTasks = tasks.filter((t) => t.status === "TODO")
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS")
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE"
  )

  const priorityColors: Record<string, string> = {
    URGENT: "#ef4444",
    HIGH: "#f97316",
    MEDIUM: "#3b82f6",
    LOW: "#9ca3af",
  }

  const renderTaskList = (taskList: typeof tasks, title: string) => {
    if (taskList.length === 0) return ""
    return `
      <h3 style="color: #333; font-size: 16px; margin: 20px 0 10px;">${title} (${taskList.length})</h3>
      <ul style="list-style: none; padding: 0; margin: 0;">
        ${taskList
          .map(
            (t) => `
          <li style="padding: 10px 14px; border-left: 3px solid ${priorityColors[t.priority] || "#9ca3af"}; background: #f9fafb; margin-bottom: 6px; border-radius: 0 6px 6px 0;">
            <span style="color: #111; font-weight: 500;">${t.title}</span>
            ${t.dueDate ? `<span style="color: #999; font-size: 12px; margin-left: 8px;">${new Date(t.dueDate).toLocaleDateString("fr-FR")}</span>` : ""}
          </li>
        `
          )
          .join("")}
      </ul>
    `
  }

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Récapitulatif du jour - ${tasks.filter((t) => t.status !== "DONE").length} tâche(s) en cours - TaskFlow`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="color: #111; font-size: 24px; margin-bottom: 8px;">Bonjour ${userName || ""} !</h1>
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Voici votre récapitulatif de tâches pour aujourd'hui.
          </p>

          <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 20px; display: ${overdueTasks.length > 0 ? "block" : "none"};">
            <strong style="color: #dc2626;">&#9888; ${overdueTasks.length} tâche(s) en retard</strong>
          </div>

          <div style="display: flex; gap: 12px; margin-bottom: 24px;">
            <div style="flex: 1; text-align: center; background: #f1f5f9; border-radius: 8px; padding: 12px;">
              <div style="font-size: 28px; font-weight: bold; color: #111;">${todoTasks.length}</div>
              <div style="color: #666; font-size: 13px;">À faire</div>
            </div>
            <div style="flex: 1; text-align: center; background: #eff6ff; border-radius: 8px; padding: 12px;">
              <div style="font-size: 28px; font-weight: bold; color: #111;">${inProgressTasks.length}</div>
              <div style="color: #666; font-size: 13px;">En cours</div>
            </div>
          </div>

          ${renderTaskList(overdueTasks, "&#128308; En retard")}
          ${renderTaskList(inProgressTasks, "&#9899; En cours")}
          ${renderTaskList(todoTasks.slice(0, 10), "&#9898; À faire")}
          ${todoTasks.length > 10 ? `<p style="color: #999; font-size: 13px;">... et ${todoTasks.length - 10} autre(s) tâche(s)</p>` : ""}

          <div style="text-align: center; margin: 32px 0 0;">
            <a href="${APP_URL}" style="background-color: #111; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
              Ouvrir TaskFlow
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #bbb; font-size: 12px; text-align: center;">
            TaskFlow - Gestionnaire de tâches |
            <a href="${APP_URL}/settings" style="color: #999;">Gérer les préférences</a>
          </p>
        </div>
      </body>
      </html>
    `,
  })
}

export async function sendReminderEmail(
  email: string,
  taskTitle: string,
  dueDate: string | null
) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Rappel : ${taskTitle} - TaskFlow`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="color: #111; font-size: 24px; margin-bottom: 16px;">&#128276; Rappel de tâche</h1>
          <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #111; font-size: 18px; margin: 0 0 8px;">${taskTitle}</h2>
            ${dueDate ? `<p style="color: #666; font-size: 14px; margin: 0;">Échéance : ${new Date(dueDate).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>` : ""}
          </div>
          <div style="text-align: center; margin: 24px 0 0;">
            <a href="${APP_URL}" style="background-color: #111; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
              Voir mes tâches
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #bbb; font-size: 12px; text-align: center;">TaskFlow - Gestionnaire de tâches</p>
        </div>
      </body>
      </html>
    `,
  })
}
