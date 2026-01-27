"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckSquare, ArrowLeft, CheckCircle2 } from "lucide-react"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <p className="text-destructive">
            Lien invalide. Veuillez refaire une demande de réinitialisation.
          </p>
          <Link href="/forgot-password" className="mt-4 inline-block text-sm text-primary hover:underline">
            Demander un nouveau lien
          </Link>
        </CardContent>
      </Card>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la réinitialisation")
      }

      setSuccess(true)
      setTimeout(() => router.push("/login"), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <CheckSquare className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
        <CardDescription>
          {success
            ? "Votre mot de passe a été modifié"
            : "Choisissez un nouveau mot de passe sécurisé"}
        </CardDescription>
      </CardHeader>

      {success ? (
        <CardContent className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm text-muted-foreground">
            Votre mot de passe a été réinitialisé avec succès.
            Vous allez être redirigé vers la page de connexion...
          </p>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="Au moins 6 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirmez votre mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enregistrement..." : "Réinitialiser le mot de passe"}
            </Button>
          </CardFooter>
        </form>
      )}

      <div className="px-6 pb-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Retour à la connexion
        </Link>
      </div>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Suspense
        fallback={
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center text-muted-foreground">
              Chargement...
            </CardContent>
          </Card>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
