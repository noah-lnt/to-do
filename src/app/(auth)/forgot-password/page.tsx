"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckSquare, ArrowLeft, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erreur serveur")
      }

      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <CheckSquare className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Mot de passe oublié</CardTitle>
          <CardDescription>
            {sent
              ? "Consultez votre boîte email"
              : "Entrez votre adresse email pour recevoir un lien de réinitialisation"}
          </CardDescription>
        </CardHeader>

        {sent ? (
          <CardContent className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm text-muted-foreground">
              Si un compte existe avec l&apos;adresse <strong>{email}</strong>, vous recevrez un email
              avec un lien pour réinitialiser votre mot de passe.
            </p>
            <p className="text-xs text-muted-foreground">
              Le lien expire dans 1 heure. Pensez à vérifier votre dossier spam.
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
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
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
    </div>
  )
}
