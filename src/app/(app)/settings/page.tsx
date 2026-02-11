"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Select } from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  ArrowLeft,
  User,
  Lock,
  Bell,
  Mail,
  Clock,
  Shield,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  X,
  Loader2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import Link from "next/link"

interface UserProfile {
  id: string
  name: string | null
  email: string
  emailVerified: boolean
  createdAt: string
  _count: { tasks: number; categories: number }
}

interface Preferences {
  id: string
  dailyRecapEnabled: boolean
  recapTimes: string[]
  recapEmail: boolean
  defaultReminderMinutes: number
  browserNotifications: boolean
  emailNotifications: boolean
  timezone: string
  language: string
  savedNotifyEmails: string[]
}

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [loading, setLoading] = useState(true)

  // Profile form
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [profileMsg, setProfileMsg] = useState("")
  const [profileError, setProfileError] = useState("")
  const [profileSaving, setProfileSaving] = useState(false)

  // Password form
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [passwordMsg, setPasswordMsg] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSaving, setPasswordSaving] = useState(false)

  // Preferences
  const [prefSaving, setPrefSaving] = useState(false)
  const [prefMsg, setPrefMsg] = useState("")

  // Resend verification
  const [verificationSending, setVerificationSending] = useState(false)
  const [verificationMsg, setVerificationMsg] = useState("")

  // Delete account
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Recap time editing
  const [newRecapTime, setNewRecapTime] = useState("08:00")

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    fetchData()
  }, [user, router])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [profileRes, prefRes] = await Promise.all([
        fetch("/api/account"),
        fetch("/api/preferences"),
      ])
      if (profileRes.ok) {
        const p = await profileRes.json()
        setProfile(p)
        setName(p.name || "")
        setEmail(p.email)
      }
      if (prefRes.ok) {
        const pref = await prefRes.json()
        setPreferences(pref)
      }
    } catch (err) {
      console.error("Fetch settings error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError("")
    setProfileMsg("")
    setProfileSaving(true)

    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setProfileMsg("Profil mis à jour avec succès")
      if (data.email !== profile?.email) {
        setProfileMsg("Profil mis à jour. Un email de vérification a été envoyé à la nouvelle adresse.")
      }
      fetchData()
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Erreur")
    } finally {
      setProfileSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")
    setPasswordMsg("")

    if (newPassword !== confirmNewPassword) {
      setPasswordError("Les mots de passe ne correspondent pas")
      return
    }
    if (newPassword.length < 6) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 6 caractères")
      return
    }

    setPasswordSaving(true)
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPasswordMsg("Mot de passe modifié avec succès")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Erreur")
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleUpdatePreferences = async (updates: Partial<Preferences>) => {
    setPrefSaving(true)
    setPrefMsg("")
    try {
      const res = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        const updated = await res.json()
        setPreferences(updated)
        setPrefMsg("Préférences sauvegardées")
        setTimeout(() => setPrefMsg(""), 2000)
      }
    } catch (err) {
      console.error("Update preferences error:", err)
    } finally {
      setPrefSaving(false)
    }
  }

  const handleResendVerification = async () => {
    setVerificationSending(true)
    setVerificationMsg("")
    try {
      const res = await fetch("/api/auth/verify-email", { method: "POST" })
      const data = await res.json()
      setVerificationMsg(data.message || data.error)
    } catch {
      setVerificationMsg("Erreur lors de l'envoi")
    } finally {
      setVerificationSending(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const res = await fetch("/api/account", { method: "DELETE" })
      if (res.ok) {
        await logout()
        router.push("/login")
      }
    } catch {
      console.error("Delete account error")
    } finally {
      setDeleting(false)
    }
  }

  const addRecapTime = () => {
    if (!preferences) return
    if (preferences.recapTimes.includes(newRecapTime)) return
    const updated = [...preferences.recapTimes, newRecapTime].sort()
    handleUpdatePreferences({ recapTimes: updated })
  }

  const removeRecapTime = (time: string) => {
    if (!preferences) return
    const updated = preferences.recapTimes.filter((t) => t !== time)
    handleUpdatePreferences({ recapTimes: updated })
  }

  const removeNotifyEmail = (email: string) => {
    if (!preferences) return
    const updated = preferences.savedNotifyEmails.filter((e) => e !== email)
    handleUpdatePreferences({ savedNotifyEmails: updated })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Paramètres</h1>
            <p className="text-sm text-muted-foreground">Gérez votre compte et vos préférences</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Email verification banner */}
        {profile && !profile.emailVerified && (
          <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Votre adresse email n&apos;est pas vérifiée
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Vérifiez votre email pour accéder à toutes les fonctionnalités.
                </p>
                {verificationMsg && (
                  <p className="text-xs mt-1 text-amber-700 dark:text-amber-300">{verificationMsg}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleResendVerification}
                disabled={verificationSending}
                className="border-amber-400 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
              >
                {verificationSending ? "Envoi..." : "Renvoyer l'email"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Profil</CardTitle>
            </div>
            <CardDescription>Vos informations personnelles</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {profileMsg && (
                <div className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-4 w-4" />
                  {profileMsg}
                </div>
              )}
              {profileError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {profileError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-email">Email</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="settings-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {profile?.emailVerified && (
                    <span className="flex items-center gap-1 text-xs text-green-600 whitespace-nowrap">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Vérifié
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                Membre depuis le {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("fr-FR") : "..."}
                {" "} &middot; {profile?._count.tasks || 0} tâches &middot; {profile?._count.categories || 0} catégories
              </div>
              <Button type="submit" disabled={profileSaving}>
                {profileSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <CardTitle>Mot de passe</CardTitle>
            </div>
            <CardDescription>Modifier votre mot de passe</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordMsg && (
                <div className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-4 w-4" />
                  {passwordMsg}
                </div>
              )}
              {passwordError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {passwordError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Au moins 6 caractères"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={passwordSaving}>
                {passwordSaving ? "Modification..." : "Changer le mot de passe"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notifications & Reminders */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications et rappels</CardTitle>
            </div>
            <CardDescription>Configurez comment et quand recevoir des rappels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {prefMsg && (
              <div className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4" />
                {prefMsg}
              </div>
            )}

            {/* Browser notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications navigateur</Label>
                <p className="text-xs text-muted-foreground">
                  Recevez des alertes en temps réel dans votre navigateur
                </p>
              </div>
              <Checkbox
                checked={preferences?.browserNotifications || false}
                onCheckedChange={(checked) =>
                  handleUpdatePreferences({ browserNotifications: !!checked })
                }
              />
            </div>

            <Separator />

            {/* Email notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications par email</Label>
                <p className="text-xs text-muted-foreground">
                  Recevez les rappels de tâches par email
                </p>
              </div>
              <Checkbox
                checked={preferences?.emailNotifications || false}
                onCheckedChange={(checked) =>
                  handleUpdatePreferences({ emailNotifications: !!checked })
                }
              />
            </div>

            <Separator />

            {/* Default reminder time */}
            <div className="space-y-2">
              <Label>Rappel par défaut avant l&apos;échéance</Label>
              <Select
                value={String(preferences?.defaultReminderMinutes || 30)}
                onValueChange={(v) =>
                  handleUpdatePreferences({ defaultReminderMinutes: parseInt(v) })
                }
                className="w-48"
              >
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 heure</option>
                <option value="120">2 heures</option>
                <option value="1440">1 jour</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Daily recap */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Récapitulatif quotidien</CardTitle>
            </div>
            <CardDescription>
              Recevez un résumé de vos tâches restantes par email aux moments choisis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable recap */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Activer le récapitulatif quotidien</Label>
                <p className="text-xs text-muted-foreground">
                  Recevez un email récapitulatif avec vos tâches en cours et en retard
                </p>
              </div>
              <Checkbox
                checked={preferences?.dailyRecapEnabled || false}
                onCheckedChange={(checked) =>
                  handleUpdatePreferences({ dailyRecapEnabled: !!checked })
                }
              />
            </div>

            {preferences?.dailyRecapEnabled && (
              <>
                <Separator />

                {/* Recap times */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Heures de récapitulatif
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Choisissez les moments de la journée pour recevoir votre récapitulatif
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(preferences?.recapTimes || []).map((time) => (
                      <div
                        key={time}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {time}
                        <button
                          onClick={() => removeRecapTime(time)}
                          className="ml-1 rounded-full hover:bg-primary/20 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={newRecapTime}
                      onChange={(e) => setNewRecapTime(e.target.value)}
                      className="w-32"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addRecapTime}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Ajouter
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Send by email */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Envoyer par email</Label>
                    <p className="text-xs text-muted-foreground">
                      Envoi à {profile?.email}
                    </p>
                  </div>
                  <Checkbox
                    checked={preferences?.recapEmail || false}
                    onCheckedChange={(checked) =>
                      handleUpdatePreferences({ recapEmail: !!checked })
                    }
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notification Contacts */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Contacts de notification</CardTitle>
            </div>
            <CardDescription>
              Gérez les adresses email utilisées pour notifier quelqu&apos;un à la complétion d&apos;une tâche
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(!preferences?.savedNotifyEmails || preferences.savedNotifyEmails.length === 0) ? (
              <p className="text-sm text-muted-foreground">
                Aucun contact sauvegardé. Les emails seront ajoutés automatiquement
                lorsque vous notifierez quelqu&apos;un lors de la création d&apos;une tâche.
              </p>
            ) : (
              <div className="space-y-2">
                {preferences.savedNotifyEmails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{email}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNotifyEmail(email)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timezone */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <CardTitle>Fuseau horaire</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Select
              value={preferences?.timezone || "Europe/Paris"}
              onValueChange={(v) => handleUpdatePreferences({ timezone: v })}
              className="w-64"
            >
              <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
              <option value="Europe/London">Europe/London (UTC+0)</option>
              <option value="Europe/Berlin">Europe/Berlin (UTC+1)</option>
              <option value="Europe/Brussels">Europe/Brussels (UTC+1)</option>
              <option value="Europe/Zurich">Europe/Zurich (UTC+1)</option>
              <option value="America/New_York">America/New_York (UTC-5)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
              <option value="America/Montreal">America/Montreal (UTC-5)</option>
              <option value="Africa/Dakar">Africa/Dakar (UTC+0)</option>
              <option value="Africa/Casablanca">Africa/Casablanca (UTC+1)</option>
              <option value="Indian/Reunion">Indian/Reunion (UTC+4)</option>
            </Select>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              <CardTitle className="text-destructive">Zone dangereuse</CardTitle>
            </div>
            <CardDescription>
              Actions irréversibles sur votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer mon compte
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete account dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Supprimer votre compte</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Toutes vos données (tâches, catégories, préférences)
              seront définitivement supprimées.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            <strong>Attention :</strong> vous perdrez {profile?._count.tasks || 0} tâche(s) et{" "}
            {profile?._count.categories || 0} catégorie(s).
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting}>
              {deleting ? "Suppression..." : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
