"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckSquare, CheckCircle2, XCircle, Loader2 } from "lucide-react"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Lien de vérification invalide.")
      return
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await res.json()

        if (res.ok) {
          setStatus("success")
          setMessage(data.message)
        } else {
          setStatus("error")
          setMessage(data.error)
        }
      } catch {
        setStatus("error")
        setMessage("Erreur lors de la vérification. Réessayez plus tard.")
      }
    }

    verify()
  }, [token])

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <CheckSquare className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">Vérification de l&apos;email</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Vérification en cours...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm text-muted-foreground">{message}</p>
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              Accéder à TaskFlow
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-sm text-destructive">{message}</p>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
            >
              Retour à la connexion
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Suspense
        fallback={
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  )
}
