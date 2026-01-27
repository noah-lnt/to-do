"use client"

import { useEffect, useCallback, useRef } from "react"

interface DueReminder {
  id: string
  task: {
    id: string
    title: string
    dueDate: string | null
    priority: string
  }
}

export function useNotifications(enabled: boolean = true) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return false
    if (Notification.permission === "granted") return true
    if (Notification.permission === "denied") return false
    const result = await Notification.requestPermission()
    return result === "granted"
  }, [])

  const showNotification = useCallback((title: string, body: string) => {
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission !== "granted") return

    new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: `taskflow-reminder-${Date.now()}`,
    })
  }, [])

  const checkReminders = useCallback(async () => {
    try {
      const res = await fetch("/api/reminders/check")
      if (!res.ok) return

      const reminders: DueReminder[] = await res.json()

      for (const reminder of reminders) {
        showNotification(
          `Rappel : ${reminder.task.title}`,
          reminder.task.dueDate
            ? `Échéance : ${new Date(reminder.task.dueDate).toLocaleString("fr-FR")}`
            : "Pensez à effectuer cette tâche !"
        )
      }
    } catch {
      // Silently fail on network errors
    }
  }, [showNotification])

  useEffect(() => {
    if (!enabled) return

    requestPermission()

    // Poll every 30 seconds for due reminders
    checkReminders()
    intervalRef.current = setInterval(checkReminders, 30000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [enabled, requestPermission, checkReminders])

  return { requestPermission, showNotification }
}
