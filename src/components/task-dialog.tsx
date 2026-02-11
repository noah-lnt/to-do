"use client"

import { useState, useEffect } from "react"
import { Repeat, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Task, Category, RecurrencePattern } from "@/lib/types"
import { RECURRENCE_CONFIG } from "@/lib/types"

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  categories: Category[]
  onSave: (data: Partial<Task>) => Promise<void>
  savedNotifyEmails?: string[]
}

export function TaskDialog({ open, onOpenChange, task, categories, onSave, savedNotifyEmails = [] }: TaskDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<Task["priority"]>("MEDIUM")
  const [status, setStatus] = useState<Task["status"]>("TODO")
  const [dueDate, setDueDate] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [loading, setLoading] = useState(false)

  // Recurrence fields
  const [hasRecurrence, setHasRecurrence] = useState(false)
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>("DAILY")
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("")

  // Notification fields
  const [notifyOnComplete, setNotifyOnComplete] = useState(false)
  const [notifyEmail, setNotifyEmail] = useState("")

  const isEditing = !!task

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || "")
      setPriority(task.priority)
      setStatus(task.status)
      setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "")
      setCategoryId(task.categoryId || "")
      setHasRecurrence(!!task.recurrencePattern)
      setRecurrencePattern(task.recurrencePattern || "DAILY")
      setRecurrenceInterval(task.recurrenceInterval || 1)
      setRecurrenceEndDate(task.recurrenceEndDate ? task.recurrenceEndDate.split("T")[0] : "")
      setNotifyOnComplete(task.notifyOnComplete || false)
      setNotifyEmail(task.notifyEmail || "")
    } else {
      setTitle("")
      setDescription("")
      setPriority("MEDIUM")
      setStatus("TODO")
      setDueDate("")
      setCategoryId("")
      setHasRecurrence(false)
      setRecurrencePattern("DAILY")
      setRecurrenceInterval(1)
      setRecurrenceEndDate("")
      setNotifyOnComplete(false)
      setNotifyEmail("")
    }
  }, [task, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        dueDate: dueDate || null,
        categoryId: categoryId || null,
        recurrencePattern: hasRecurrence ? recurrencePattern : null,
        recurrenceInterval: hasRecurrence ? recurrenceInterval : null,
        recurrenceEndDate: hasRecurrence && recurrenceEndDate ? recurrenceEndDate : null,
        notifyOnComplete,
        notifyEmail: notifyOnComplete && notifyEmail.trim() ? notifyEmail.trim() : null,
      })
      onOpenChange(false)
    } catch (err) {
      console.error("Save error:", err)
    } finally {
      setLoading(false)
    }
  }

  const getRecurrenceLabel = () => {
    if (!hasRecurrence) return ""
    const config = RECURRENCE_CONFIG[recurrencePattern]
    if (recurrenceInterval === 1) {
      return config.label
    }
    return `Tous les ${recurrenceInterval} ${config.plural}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier la tâche" : "Nouvelle tâche"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifiez les détails de votre tâche." : "Ajoutez une nouvelle tâche à votre liste."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Qu'avez-vous à faire ?"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails supplémentaires..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priorité</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Task["priority"])}
              >
                <option value="LOW">Basse</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Haute</option>
                <option value="URGENT">Urgente</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as Task["status"])}
              >
                <option value="TODO">À faire</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="DONE">Terminée</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Date d&apos;échéance</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
              >
                <option value="">Aucune</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Recurrence Section */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasRecurrence"
                checked={hasRecurrence}
                onCheckedChange={(checked) => setHasRecurrence(checked as boolean)}
              />
              <Label htmlFor="hasRecurrence" className="flex items-center gap-2 cursor-pointer">
                <Repeat className="h-4 w-4" />
                Tâche récurrente
              </Label>
            </div>

            {hasRecurrence && (
              <div className="space-y-3 pl-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recurrencePattern">Fréquence</Label>
                    <Select
                      value={recurrencePattern}
                      onValueChange={(v) => setRecurrencePattern(v as RecurrencePattern)}
                    >
                      <option value="DAILY">Quotidien</option>
                      <option value="WEEKLY">Hebdomadaire</option>
                      <option value="MONTHLY">Mensuel</option>
                      <option value="YEARLY">Annuel</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recurrenceInterval">Intervalle</Label>
                    <Input
                      id="recurrenceInterval"
                      type="number"
                      min={1}
                      max={365}
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurrenceEndDate">Date de fin (optionnel)</Label>
                  <Input
                    id="recurrenceEndDate"
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    min={dueDate || undefined}
                  />
                </div>

                {hasRecurrence && (
                  <p className="text-xs text-muted-foreground">
                    {getRecurrenceLabel()}
                    {recurrenceEndDate && ` jusqu'au ${new Date(recurrenceEndDate).toLocaleDateString("fr-FR")}`}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Notification Section */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifyOnComplete"
                checked={notifyOnComplete}
                onCheckedChange={(checked) => setNotifyOnComplete(checked as boolean)}
              />
              <Label htmlFor="notifyOnComplete" className="flex items-center gap-2 cursor-pointer">
                <Mail className="h-4 w-4" />
                Notifier quelqu&apos;un à la complétion
              </Label>
            </div>

            {notifyOnComplete && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="notifyEmail">Email du destinataire</Label>
                <Input
                  id="notifyEmail"
                  type="email"
                  list="saved-notify-emails"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder="Sélectionner ou saisir un email"
                />
                <datalist id="saved-notify-emails">
                  {savedNotifyEmails.map((email) => (
                    <option key={email} value={email} />
                  ))}
                </datalist>
                <p className="text-xs text-muted-foreground">
                  Cette personne recevra un email lorsque la tâche sera terminée.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Enregistrement..." : isEditing ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
