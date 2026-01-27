"use client"

import { useState } from "react"
import { format, isPast, isToday, isTomorrow } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Calendar,
  Clock,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowRight,
  Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Task } from "@/lib/types"
import { PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/types"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface TaskCardProps {
  task: Task
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: Task["status"]) => void
  onReminder?: (task: Task) => void
}

function formatDueDate(dateStr: string) {
  const date = new Date(dateStr)
  if (isToday(date)) return "Aujourd'hui"
  if (isTomorrow(date)) return "Demain"
  return format(date, "d MMM yyyy", { locale: fr })
}

export function TaskCard({ task, onToggle, onEdit, onDelete, onStatusChange, onReminder }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const isDone = task.status === "DONE"
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isDone

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priorityConfig = PRIORITY_CONFIG[task.priority]

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-start gap-3 p-4 transition-all hover:shadow-md",
        isDone && "opacity-60",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary",
        isOverdue && "border-red-300 dark:border-red-800"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag handle */}
      <button
        className={cn(
          "mt-1 cursor-grab opacity-0 transition-opacity group-hover:opacity-40 hover:!opacity-100",
          isDragging && "cursor-grabbing"
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Checkbox */}
      <Checkbox
        checked={isDone}
        onCheckedChange={() => onToggle(task.id)}
        className="mt-1"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              "font-medium text-sm leading-tight",
              isDone && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </h3>
        </div>

        {task.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* Priority badge */}
          <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", priorityConfig.color)}>
            <span className={cn("mr-1 h-1.5 w-1.5 rounded-full inline-block", priorityConfig.dot)} />
            {priorityConfig.label}
          </Badge>

          {/* Status badge */}
          {task.status === "IN_PROGRESS" && (
            <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", STATUS_CONFIG.IN_PROGRESS.color)}>
              <Clock className="mr-1 h-3 w-3" />
              En cours
            </Badge>
          )}

          {/* Category badge */}
          {task.category && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0"
              style={{ borderColor: task.category.color, color: task.category.color }}
            >
              {task.category.name}
            </Badge>
          )}

          {/* Due date */}
          {task.dueDate && (
            <span
              className={cn(
                "inline-flex items-center text-[10px] text-muted-foreground",
                isOverdue && "text-red-500 font-medium"
              )}
            >
              <Calendar className="mr-1 h-3 w-3" />
              {formatDueDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={cn("flex items-center gap-1 transition-opacity", isHovered ? "opacity-100" : "opacity-0")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            {onReminder && task.status !== "DONE" && (
              <DropdownMenuItem onClick={() => onReminder(task)}>
                <Bell className="mr-2 h-4 w-4" />
                Rappel
              </DropdownMenuItem>
            )}
            {task.status === "TODO" && (
              <DropdownMenuItem onClick={() => onStatusChange(task.id, "IN_PROGRESS")}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Commencer
              </DropdownMenuItem>
            )}
            {task.status === "IN_PROGRESS" && (
              <DropdownMenuItem onClick={() => onStatusChange(task.id, "DONE")}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Terminer
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={() => onDelete(task.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )
}
