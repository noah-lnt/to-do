"use client"

import { useCallback, useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { TaskCard } from "@/components/task-card"
import type { Task } from "@/lib/types"
import { ClipboardList } from "lucide-react"

interface TaskListProps {
  tasks: Task[]
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: Task["status"]) => void
  onReorder: (tasks: Task[]) => void
  onReminder?: (task: Task) => void
}

export function TaskList({
  tasks,
  onToggle,
  onEdit,
  onDelete,
  onStatusChange,
  onReorder,
  onReminder,
}: TaskListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = tasks.findIndex((t) => t.id === active.id)
      const newIndex = tasks.findIndex((t) => t.id === over.id)

      const newTasks = [...tasks]
      const [moved] = newTasks.splice(oldIndex, 1)
      newTasks.splice(newIndex, 0, moved)

      onReorder(newTasks)
    },
    [tasks, onReorder]
  )

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ClipboardList className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">Aucune tâche</h3>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Créez votre première tâche pour commencer
        </p>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onReminder={onReminder}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
