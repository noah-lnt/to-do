"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, X, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EmailVerificationBanner() {
  const [show, setShow] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetch("/api/account")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.emailVerified) setShow(true)
      })
      .catch(() => {})
  }, [])

  if (!show) return null

  const handleResend = async () => {
    setSending(true)
    setMessage("")
    try {
      const res = await fetch("/api/auth/verify-email", { method: "POST" })
      const data = await res.json()
      setMessage(data.message || data.error || "Email envoyé")
    } catch {
      setMessage("Erreur lors de l'envoi")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="relative rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-4 flex items-center gap-3">
      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          Vérifiez votre adresse email
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {message || "Consultez votre boîte de réception pour confirmer votre compte."}
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleResend}
        disabled={sending}
        className="flex-shrink-0 border-amber-400 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
      >
        <Mail className="mr-1.5 h-3.5 w-3.5" />
        {sending ? "Envoi..." : "Renvoyer"}
      </Button>
      <button
        onClick={() => setShow(false)}
        className="flex-shrink-0 text-amber-500 hover:text-amber-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
