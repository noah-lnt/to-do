"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
} from "date-fns"
import { fr } from "date-fns/locale"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DayStat {
  total: number
  done: number
  inProgress: number
  todo: number
  hasUrgent: boolean
}

interface CalendarData {
  year: number
  month: number
  dailyStats: Record<string, DayStat>
  completedByDay: Record<string, number>
}

function DayCell({
  date,
  currentMonth,
  stat,
  completedCount,
  onClick,
}: {
  date: Date
  currentMonth: Date
  stat?: DayStat
  completedCount?: number
  onClick: (date: Date) => void
}) {
  const inMonth = isSameMonth(date, currentMonth)
  const today = isToday(date)
  const percentage = stat && stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0
  const hasTasks = stat && stat.total > 0

  return (
    <button
      onClick={() => onClick(date)}
      className={cn(
        "relative flex flex-col items-center gap-0.5 p-1.5 md:p-2 rounded-lg transition-colors min-h-[60px] md:min-h-[80px] w-full",
        inMonth ? "hover:bg-accent" : "opacity-30",
        today && "ring-2 ring-primary ring-offset-1 ring-offset-background"
      )}
    >
      <span
        className={cn(
          "text-sm font-medium",
          today && "text-primary font-bold",
          !inMonth && "text-muted-foreground"
        )}
      >
        {format(date, "d")}
      </span>

      {hasTasks && inMonth && (
        <>
          <div className="w-full h-1.5 rounded-full bg-muted mt-0.5">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                percentage === 100 ? "bg-green-500" : percentage > 0 ? "bg-blue-500" : "bg-muted-foreground/20"
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] text-muted-foreground">
              {stat!.done}/{stat!.total}
            </span>
          </div>
          <div className="flex gap-0.5 mt-auto">
            {stat!.hasUrgent && (
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            )}
            {stat!.inProgress > 0 && (
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            )}
            {percentage === 100 && (
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            )}
          </div>
        </>
      )}

      {completedCount && completedCount > 0 && !hasTasks && inMonth && (
        <div className="flex items-center gap-0.5 mt-1">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          <span className="text-[10px] text-green-600 dark:text-green-400">{completedCount}</span>
        </div>
      )}
    </button>
  )
}

export default function CalendarPage() {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTasks, setSelectedTasks] = useState<any[]>([])
  const [selectedLoading, setSelectedLoading] = useState(false)

  const fetchCalendar = useCallback(async () => {
    try {
      setLoading(true)
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth() + 1
      const res = await fetch(`/api/tasks/calendar?year=${year}&month=${month}`)
      if (!res.ok) return
      const data = await res.json()
      setCalendarData(data)
    } catch (err) {
      console.error("Failed to fetch calendar:", err)
    } finally {
      setLoading(false)
    }
  }, [currentMonth])

  useEffect(() => {
    fetchCalendar()
  }, [fetchCalendar])

  const fetchDayTasks = async (date: Date) => {
    try {
      setSelectedLoading(true)
      const dateStr = format(date, "yyyy-MM-dd")
      const res = await fetch(`/api/tasks?dueDate=${dateStr}`)
      if (!res.ok) return
      const data = await res.json()
      setSelectedTasks(data)
    } catch (err) {
      console.error("Failed to fetch day tasks:", err)
    } finally {
      setSelectedLoading(false)
    }
  }

  const handleDayClick = (date: Date) => {
    if (isToday(date)) {
      router.push("/today")
      return
    }
    setSelectedDate(date)
    fetchDayTasks(date)
  }

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { locale: fr })
  const calendarEnd = endOfWeek(monthEnd, { locale: fr })

  const days: Date[] = []
  let day = calendarStart
  while (day <= calendarEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

  const monthStats = calendarData
    ? Object.values(calendarData.dailyStats).reduce(
        (acc, s) => ({
          total: acc.total + s.total,
          done: acc.done + s.done,
          inProgress: acc.inProgress + s.inProgress,
          todo: acc.todo + s.todo,
        }),
        { total: 0, done: 0, inProgress: 0, todo: 0 }
      )
    : { total: 0, done: 0, inProgress: 0, todo: 0 }

  const monthPercentage = monthStats.total > 0
    ? Math.round((monthStats.done / monthStats.total) * 100)
    : 0

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Calendrier</h1>
        <p className="text-sm text-muted-foreground">Vue mensuelle de vos tâches</p>
      </div>

      {/* Month navigation */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <CardTitle className="capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: fr })}
              </CardTitle>
              {!loading && monthStats.total > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {monthStats.done}/{monthStats.total} tâches terminées ({monthPercentage}%)
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 mb-1">
                {weekDays.map((wd) => (
                  <div
                    key={wd}
                    className="text-center text-xs font-medium text-muted-foreground py-2"
                  >
                    {wd}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {days.map((d) => {
                  const dateKey = format(d, "yyyy-MM-dd")
                  return (
                    <DayCell
                      key={dateKey}
                      date={d}
                      currentMonth={currentMonth}
                      stat={calendarData?.dailyStats[dateKey]}
                      completedCount={calendarData?.completedByDay[dateKey]}
                      onClick={handleDayClick}
                    />
                  )
                })}
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  100% terminé
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  En cours
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Urgent
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  &gt; 50%
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Selected day detail */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg capitalize">
                {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
                Fermer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : selectedTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune tâche prévue pour ce jour
              </p>
            ) : (
              <div className="space-y-2">
                {selectedTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      task.status === "DONE" && "opacity-60"
                    )}
                  >
                    {task.status === "DONE" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : task.status === "IN_PROGRESS" ? (
                      <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        task.status === "DONE" && "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </span>
                    {task.priority === "URGENT" && (
                      <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                        Urgent
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
