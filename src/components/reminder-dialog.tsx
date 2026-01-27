"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Bell } from "lucide-react"
import type { Task } from "@/lib/types"

interface ReminderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
  onSave: (data: { taskId: string; remindAt: string; type: string }) => Promise<void>
}

export function ReminderDialog({ open, onOpenChange, task, onSave }: ReminderDialogProps) {
  const [mode, setMode] = useState<"preset" | "custom">("preset")
  const [preset, setPreset] = useState("30")
  const [customDate, setCustomDate] = useState("")
  const [customTime, setCustomTime] = useState("")
  const [type, setType] = useState("BROWSER")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task) return

    setLoading(true)
    try {
      let remindAt: string

      if (mode === "preset") {
        const minutes = parseInt(preset)
        const baseDate = task.dueDate ? new Date(task.dueDate) : new Date()
        const reminderDate = new Date(baseDate.getTime() - minutes * 60 * 1000)
        // If the computed reminder is in the past, use "from now"
        if (reminderDate < new Date()) {
          remindAt = new Date(Date.now() + minutes * 60 * 1000).toISOString()
        } else {
          remindAt = reminderDate.toISOString()
        }
      } else {
        if (!customDate || !customTime) return
        remindAt = new Date(`${customDate}T${customTime}`).toISOString()
      }

      await onSave({ taskId: task.id, remindAt, type })
      onOpenChange(false)
    } catch (err) {
      console.error("Save reminder error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Ajouter un rappel
          </DialogTitle>
          <DialogDescription>
            {task ? `Rappel pour : "${task.title}"` : "Configurer un rappel pour cette tâche"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mode selection */}
          <div className="space-y-2">
            <Label>Quand rappeler ?</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as "preset" | "custom")}>
              <option value="preset">Délai prédéfini</option>
              <option value="custom">Date et heure personnalisées</option>
            </Select>
          </div>

          {mode === "preset" ? (
            <div className="space-y-2">
              <Label>
                {task?.dueDate
                  ? "Rappeler avant l'échéance"
                  : "Rappeler dans"}
              </Label>
              <Select value={preset} onValueChange={setPreset}>
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 heure</option>
                <option value="120">2 heures</option>
                <option value="1440">1 jour</option>
                <option value="2880">2 jours</option>
                <option value="10080">1 semaine</option>
              </Select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Heure</Label>
                <Input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Notification type */}
          <div className="space-y-2">
            <Label>Type de notification</Label>
            <Select value={type} onValueChange={setType}>
              <option value="BROWSER">Notification navigateur</option>
              <option value="EMAIL">Email</option>
              <option value="BOTH">Les deux</option>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Créer le rappel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
