"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Target,
  Zap,
} from "lucide-react"
import type { Stats } from "@/lib/types"

interface StatsCardsProps {
  stats: Stats | null
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) return null

  const cards = [
    {
      title: "Total",
      value: stats.total,
      icon: Target,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "À faire",
      value: stats.todo,
      icon: Circle,
      color: "text-slate-500",
      bg: "bg-slate-50 dark:bg-slate-950",
    },
    {
      title: "En cours",
      value: stats.inProgress,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950",
    },
    {
      title: "Terminées",
      value: stats.done,
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "En retard",
      value: stats.overdue,
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-50 dark:bg-red-950",
    },
    {
      title: "Aujourd'hui",
      value: stats.completedToday,
      icon: Zap,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card) => (
          <Card key={card.title} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${card.bg}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progression globale</span>
            <span className="text-sm text-muted-foreground">{stats.completionRate}%</span>
          </div>
          <Progress value={stats.completionRate} />
        </CardContent>
      </Card>
    </div>
  )
}
