"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "@/components/auth-provider"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  AlertTriangle,
  Trophy,
  Trash2,
  MoreHorizontal,
  ArrowRight,
  Repeat,
  EyeOff,
  Eye,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PRIORITY_CONFIG, STATUS_CONFIG, RECURRENCE_CONFIG } from "@/lib/types"
import type { Task } from "@/lib/types"

interface TodayStats {
  total: number
  done: number
  percentage: number
}

function CircularProgress({ percentage, size = 160 }: { percentage: number; size?: number }) {
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  const getColor = () => {
    if (percentage >= 100) return "text-green-500"
    if (percentage >= 75) return "text-emerald-500"
    if (percentage >= 50) return "text-blue-500"
    if (percentage >= 25) return "text-amber-500"
    return "text-red-500"
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-700 ease-out", getColor())}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn("text-4xl font-bold tabular-nums", getColor())}>
          {percentage}%
        </span>
        <span className="text-xs text-muted-foreground">accompli</span>
      </div>
    </div>
  )
}

function TodayTaskCard({
  task,
  onToggle,
  onStatusChange,
  onDelete,
}: {
  task: Task
  onToggle: (id: string) => void
  onStatusChange: (id: string, status: Task["status"]) => void
  onDelete: (id: string) => void
}) {
  const isDone = task.status === "DONE"
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isDone
  const priorityConfig = PRIORITY_CONFIG[task.priority]

  return (
    <Card
      className={cn(
        "group flex items-start gap-3 p-4 transition-all hover:shadow-md",
        isDone && "opacity-60",
        isOverdue && "border-red-300 dark:border-red-800"
      )}
    >
      <Checkbox
        checked={isDone}
        onCheckedChange={() => onToggle(task.id)}
        className="mt-1"
      />
      <div className="flex-1 min-w-0">
        <h3
          className={cn(
            "font-medium text-sm leading-tight",
            isDone && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </h3>
        {task.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", priorityConfig.color)}>
            <span className={cn("mr-1 h-1.5 w-1.5 rounded-full inline-block", priorityConfig.dot)} />
            {priorityConfig.label}
          </Badge>
          {task.status === "IN_PROGRESS" && (
            <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", STATUS_CONFIG.IN_PROGRESS.color)}>
              <Clock className="mr-1 h-3 w-3" />
              En cours
            </Badge>
          )}
          {task.category && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0"
              style={{ borderColor: task.category.color, color: task.category.color }}
            >
              {task.category.name}
            </Badge>
          )}
          {isOverdue && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
              <AlertTriangle className="mr-1 h-3 w-3" />
              En retard
            </Badge>
          )}
          {task.recurrenceType && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
              <Repeat className="mr-1 h-3 w-3" />
              {RECURRENCE_CONFIG[task.recurrenceType].label}
            </Badge>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {task.status === "TODO" && (
            <DropdownMenuItem onClick={() => onStatusChange(task.id, "IN_PROGRESS")}>
              <ArrowRight className="mr-2 h-4 w-4" />
              Commencer
            </DropdownMenuItem>
          )}
          {task.status === "IN_PROGRESS" && (
            <DropdownMenuItem onClick={() => onStatusChange(task.id, "DONE")}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Terminer
            </DropdownMenuItem>
          )}
          {task.status === "DONE" && (
            <DropdownMenuItem onClick={() => onStatusChange(task.id, "TODO")}>
              <Circle className="mr-2 h-4 w-4" />
              Rouvrir
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600" onClick={() => onDelete(task.id)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Card>
  )
}

const HIDE_COMPLETED_KEY = "taskflow-today-hide-completed"

export default function TodayPage() {
  const { user } = useAuth()
  const [rawTasks, setRawTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<TodayStats>({ total: 0, done: 0, percentage: 0 })
  const [loading, setLoading] = useState(true)
  const [hideCompleted, setHideCompleted] = useState(false)

  // Load hide completed preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HIDE_COMPLETED_KEY)
      if (stored === "true") setHideCompleted(true)
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Save hide completed preference to localStorage
  const handleHideCompletedChange = (value: boolean) => {
    setHideCompleted(value)
    try {
      localStorage.setItem(HIDE_COMPLETED_KEY, String(value))
    } catch {
      // Ignore localStorage errors
    }
  }

  // Filter tasks based on hideCompleted
  const tasks = useMemo(() => {
    if (hideCompleted) {
      return rawTasks.filter((t) => t.status !== "DONE")
    }
    return rawTasks
  }, [rawTasks, hideCompleted])

  const fetchToday = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks/today")
      if (!res.ok) return
      const data = await res.json()
      setRawTasks(data.tasks)
      setStats(data.stats)
    } catch (err) {
      console.error("Failed to fetch today data:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) fetchToday()
  }, [user, fetchToday])

  const handleToggle = async (id: string) => {
    const task = rawTasks.find((t) => t.id === id)
    if (!task) return
    const newStatus = task.status === "DONE" ? "TODO" : "DONE"
    await handleStatusChange(id, newStatus)
  }

  const handleStatusChange = async (id: string, status: Task["status"]) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) return
      await fetchToday()
    } catch (err) {
      console.error("Failed to update task:", err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" })
      await fetchToday()
    } catch (err) {
      console.error("Failed to delete task:", err)
    }
  }

  const todoTasks = tasks.filter((t) => t.status === "TODO")
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS")
  const doneTasks = tasks.filter((t) => t.status === "DONE")
  const todayStr = format(new Date(), "EEEE d MMMM yyyy", { locale: fr })

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold capitalize">Aujourd&apos;hui</h1>
          <p className="text-sm text-muted-foreground capitalize">{todayStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="hide-completed-today"
            checked={hideCompleted}
            onCheckedChange={handleHideCompletedChange}
          />
          <Label htmlFor="hide-completed-today" className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1.5">
            {hideCompleted ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Masquer terminées</span>
          </Label>
        </div>
      </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Progress ring */}
            <Card>
              <CardContent className="flex flex-col items-center py-8 gap-4">
                <CircularProgress percentage={stats.percentage} />
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>{stats.done} terminée{stats.done !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Circle className="h-4 w-4 text-muted-foreground" />
                    <span>{stats.total - stats.done} restante{(stats.total - stats.done) !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                {stats.percentage === 100 && stats.total > 0 && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                    <Trophy className="h-5 w-5" />
                    Toutes les tâches sont terminées !
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Task sections */}
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <p className="text-lg font-medium">Aucune tâche pour aujourd&apos;hui</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ajoutez des tâches avec une date d&apos;échéance pour les voir ici
                  </p>
                  <Link href="/" className="mt-4">
                    <Button>Aller au tableau de bord</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Overdue / urgent section */}
                {todoTasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date()).length > 0 && (
                  <div className="space-y-3">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                      En retard
                    </h2>
                    {todoTasks
                      .filter((t) => t.dueDate && new Date(t.dueDate) < new Date())
                      .map((task) => (
                        <TodayTaskCard
                          key={task.id}
                          task={task}
                          onToggle={handleToggle}
                          onStatusChange={handleStatusChange}
                          onDelete={handleDelete}
                        />
                      ))}
                  </div>
                )}

                {/* In progress */}
                {inProgressTasks.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                      <Clock className="h-4 w-4" />
                      En cours ({inProgressTasks.length})
                    </h2>
                    {inProgressTasks.map((task) => (
                      <TodayTaskCard
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}

                {/* To do */}
                {todoTasks.filter((t) => !t.dueDate || new Date(t.dueDate) >= new Date()).length > 0 && (
                  <div className="space-y-3">
                    <h2 className="flex items-center gap-2 text-sm font-semibold">
                      <Circle className="h-4 w-4" />
                      À faire ({todoTasks.filter((t) => !t.dueDate || new Date(t.dueDate) >= new Date()).length})
                    </h2>
                    {todoTasks
                      .filter((t) => !t.dueDate || new Date(t.dueDate) >= new Date())
                      .map((task) => (
                        <TodayTaskCard
                          key={task.id}
                          task={task}
                          onToggle={handleToggle}
                          onStatusChange={handleStatusChange}
                          onDelete={handleDelete}
                        />
                      ))}
                  </div>
                )}

                {/* Done */}
                {!hideCompleted && doneTasks.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Terminées ({doneTasks.length})
                    </h2>
                    {doneTasks.map((task) => (
                      <TodayTaskCard
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
    </div>
  )
}
