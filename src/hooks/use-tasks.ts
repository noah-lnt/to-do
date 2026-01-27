"use client"

import { useState, useEffect, useCallback } from "react"
import type { Task, FilterStatus, FilterPriority, SortBy, SortOrder } from "@/lib/types"

interface UseTasksOptions {
  status?: FilterStatus
  priority?: FilterPriority
  categoryId?: string
  search?: string
  sortBy?: SortBy
  sortOrder?: SortOrder
}

export function useTasks(options: UseTasksOptions = {}) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (options.status && options.status !== "ALL") params.set("status", options.status)
      if (options.priority && options.priority !== "ALL") params.set("priority", options.priority)
      if (options.categoryId) params.set("categoryId", options.categoryId)
      if (options.search) params.set("search", options.search)
      if (options.sortBy) params.set("sortBy", options.sortBy)
      if (options.sortOrder) params.set("sortOrder", options.sortOrder)

      const res = await fetch(`/api/tasks?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch tasks")
      const data = await res.json()
      setTasks(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }, [options.status, options.priority, options.categoryId, options.search, options.sortBy, options.sortOrder])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const createTask = async (data: Partial<Task>) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to create task")
    const task = await res.json()
    setTasks((prev) => [...prev, task])
    return task
  }

  const updateTask = async (id: string, data: Partial<Task>) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to update task")
    const updated = await res.json()
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
    return updated
  }

  const deleteTask = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Failed to delete task")
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const toggleStatus = async (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    const newStatus = task.status === "DONE" ? "TODO" : "DONE"
    return updateTask(id, { status: newStatus })
  }

  const reorderTasks = async (reorderedTasks: { id: string; position: number }[]) => {
    await fetch("/api/tasks/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks: reorderedTasks }),
    })
  }

  return {
    tasks,
    setTasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleStatus,
    reorderTasks,
  }
}
