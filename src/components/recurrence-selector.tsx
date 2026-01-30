"use client"

import { useState } from "react"
import { Repeat, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { RECURRENCE_CONFIG, WEEKDAYS, type RecurrenceType } from "@/lib/types"

interface RecurrenceSelectorProps {
  recurrenceType: RecurrenceType | null
  recurrenceInterval: number
  recurrenceDays: number[]
  recurrenceEndDate: string | null
  onChange: (data: {
    recurrenceType: RecurrenceType | null
    recurrenceInterval: number
    recurrenceDays: number[]
    recurrenceEndDate: string | null
  }) => void
}

export function RecurrenceSelector({
  recurrenceType,
  recurrenceInterval,
  recurrenceDays,
  recurrenceEndDate,
  onChange,
}: RecurrenceSelectorProps) {
  const [open, setOpen] = useState(false)

  const handleTypeChange = (value: string) => {
    if (value === "") {
      onChange({
        recurrenceType: null,
        recurrenceInterval: 1,
        recurrenceDays: [],
        recurrenceEndDate: null,
      })
    } else {
      const type = value as RecurrenceType
      onChange({
        recurrenceType: type,
        recurrenceInterval: recurrenceInterval || 1,
        recurrenceDays: type === "WEEKLY" ? (recurrenceDays.length ? recurrenceDays : [1]) : [],
        recurrenceEndDate,
      })
    }
  }

  const handleIntervalChange = (value: string) => {
    const interval = parseInt(value, 10)
    if (interval > 0) {
      onChange({
        recurrenceType,
        recurrenceInterval: interval,
        recurrenceDays,
        recurrenceEndDate,
      })
    }
  }

  const handleDayToggle = (day: number) => {
    const newDays = recurrenceDays.includes(day)
      ? recurrenceDays.filter((d) => d !== day)
      : [...recurrenceDays, day].sort()

    // Ensure at least one day is selected for weekly recurrence
    if (newDays.length === 0) return

    onChange({
      recurrenceType,
      recurrenceInterval,
      recurrenceDays: newDays,
      recurrenceEndDate,
    })
  }

  const handleEndDateChange = (value: string) => {
    onChange({
      recurrenceType,
      recurrenceInterval,
      recurrenceDays,
      recurrenceEndDate: value || null,
    })
  }

  const handleClear = () => {
    onChange({
      recurrenceType: null,
      recurrenceInterval: 1,
      recurrenceDays: [],
      recurrenceEndDate: null,
    })
    setOpen(false)
  }

  const getRecurrenceLabel = (): string | null => {
    if (!recurrenceType) return null

    const config = RECURRENCE_CONFIG[recurrenceType]
    let label: string = config.label

    if (recurrenceInterval > 1) {
      switch (recurrenceType) {
        case "DAILY":
          label = `Tous les ${recurrenceInterval} jours`
          break
        case "WEEKLY":
          label = `Toutes les ${recurrenceInterval} semaines`
          break
        case "MONTHLY":
          label = `Tous les ${recurrenceInterval} mois`
          break
        case "YEARLY":
          label = `Tous les ${recurrenceInterval} ans`
          break
      }
    }

    if (recurrenceType === "WEEKLY" && recurrenceDays.length > 0) {
      const dayLabels = recurrenceDays.map((d) => WEEKDAYS.find((w) => w.value === d)?.label).join(", ")
      label += ` (${dayLabels})`
    }

    return label
  }

  return (
    <div className="space-y-2">
      <Label>Recurrence</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !recurrenceType && "text-muted-foreground"
            )}
          >
            <Repeat className="mr-2 h-4 w-4" />
            {recurrenceType ? getRecurrenceLabel() : "Aucune recurrence"}
            {recurrenceType && (
              <X
                className="ml-auto h-4 w-4 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type de recurrence</Label>
              <Select
                value={recurrenceType || ""}
                onValueChange={handleTypeChange}
              >
                <option value="">Aucune</option>
                {Object.entries(RECURRENCE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </Select>
            </div>

            {recurrenceType && (
              <>
                <div className="space-y-2">
                  <Label>Intervalle</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Tous les</span>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={recurrenceInterval}
                      onChange={(e) => handleIntervalChange(e.target.value)}
                      className="w-20"
                    />
                    <span className="text-sm">
                      {recurrenceType === "DAILY" && (recurrenceInterval > 1 ? "jours" : "jour")}
                      {recurrenceType === "WEEKLY" && (recurrenceInterval > 1 ? "semaines" : "semaine")}
                      {recurrenceType === "MONTHLY" && "mois"}
                      {recurrenceType === "YEARLY" && (recurrenceInterval > 1 ? "ans" : "an")}
                      {recurrenceType === "CUSTOM" && "fois"}
                    </span>
                  </div>
                </div>

                {recurrenceType === "WEEKLY" && (
                  <div className="space-y-2">
                    <Label>Jours de la semaine</Label>
                    <div className="flex flex-wrap gap-1">
                      {WEEKDAYS.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => handleDayToggle(day.value)}
                          className={cn(
                            "h-8 w-10 rounded text-xs font-medium transition-colors",
                            recurrenceDays.includes(day.value)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80"
                          )}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Date de fin (optionnel)</Label>
                  <Input
                    type="date"
                    value={recurrenceEndDate || ""}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
