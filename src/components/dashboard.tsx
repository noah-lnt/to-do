"use client"

import { useState, useCallback, useEffect } from "react"
import { Plus, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/sidebar"
import { StatsCards } from "@/components/stats-cards"
import { TaskList } from "@/components/task-list"
import { TaskDialog } from "@/components/task-dialog"
import { ReminderDialog } from "@/components/reminder-dialog"
import { EmailVerificationBanner } from "@/components/email-verification-banner"
import { QuickAddTask } from "@/components/quick-add-task"
import { SearchAndFilters } from "@/components/search-and-filters"
import { useAuth } from "@/components/auth-provider"
import { useTasks } from "@/hooks/use-tasks"
import { useCategories } from "@/hooks/use-categories"
import { useStats } from "@/hooks/use-stats"
import { useNotifications } from "@/hooks/use-notifications"
import type { Task, FilterStatus, FilterPriority, SortBy, SortOrder } from "@/lib/types"
import { cn } from "@/lib/utils"

export function Dashboard() {
  const { user, logout } = useAuth()

  // Filters
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL")
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>("ALL")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortBy>("position")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Data hooks
  const {
    tasks,
    setTasks,
    loading: tasksLoading,
    createTask,
    updateTask,
    deleteTask,
    toggleStatus,
    reorderTasks,
    fetchTasks,
  } = useTasks({
    status: statusFilter,
    priority: priorityFilter,
    categoryId: categoryId || undefined,
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder,
  })
  const { categories, createCategory, deleteCategory, fetchCategories } = useCategories()
  const { stats, fetchStats } = useStats()

  // Notifications
  useNotifications(true)

  // Dialog state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false)
  const [reminderTask, setReminderTask] = useState<Task | null>(null)

  // Mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const refreshData = useCallback(async () => {
    await Promise.all([fetchTasks(), fetchStats(), fetchCategories()])
  }, [fetchTasks, fetchStats, fetchCategories])

  const handleCreateTask = async (data: Partial<Task>) => {
    await createTask(data)
    await refreshData()
  }

  const handleUpdateTask = async (data: Partial<Task>) => {
    if (!editingTask) return
    await updateTask(editingTask.id, data)
    await refreshData()
  }

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id)
    await refreshData()
  }

  const handleToggle = async (id: string) => {
    await toggleStatus(id)
    await refreshData()
  }

  const handleStatusChange = async (id: string, status: Task["status"]) => {
    await updateTask(id, { status })
    await refreshData()
  }

  const handleReorder = useCallback(
    async (reorderedTasks: Task[]) => {
      setTasks(reorderedTasks)
      const updates = reorderedTasks.map((t, i) => ({ id: t.id, position: i }))
      await reorderTasks(updates)
    },
    [setTasks, reorderTasks]
  )

  const handleQuickAdd = async (title: string) => {
    await createTask({
      title,
      categoryId: categoryId || undefined,
    } as Partial<Task>)
    await refreshData()
  }

  const handleCreateReminder = async (data: { taskId: string; remindAt: string; type: string }) => {
    await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  }

  const openReminderDialog = (task: Task) => {
    setReminderTask(task)
    setReminderDialogOpen(true)
  }

  const handleCreateCategory = async (data: { name: string; color: string }) => {
    await createCategory(data)
  }

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id)
    if (categoryId === id) setCategoryId(null)
  }

  const handleSortChange = (newSortBy: SortBy, newSortOrder: SortOrder) => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }

  const openEditDialog = (task: Task) => {
    setEditingTask(task)
    setTaskDialogOpen(true)
  }

  const openNewDialog = () => {
    setEditingTask(null)
    setTaskDialogOpen(true)
  }

  if (!user) return null

  const currentCategory = categories.find((c) => c.id === categoryId)
  const pageTitle = categoryId
    ? currentCategory?.name || "Catégorie"
    : statusFilter === "ALL"
    ? "Toutes les tâches"
    : statusFilter === "TODO"
    ? "À faire"
    : statusFilter === "IN_PROGRESS"
    ? "En cours"
    : "Terminées"

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar
          user={user}
          categories={categories}
          activeFilter={statusFilter}
          activeCategoryId={categoryId}
          onFilterChange={(f) => {
            setStatusFilter(f)
            setSidebarOpen(false)
          }}
          onCategoryChange={(id) => {
            setCategoryId(id)
            setSidebarOpen(false)
          }}
          onCreateCategory={handleCreateCategory}
          onDeleteCategory={handleDeleteCategory}
          onLogout={logout}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl p-4 md:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{pageTitle}</h1>
                <p className="text-sm text-muted-foreground">
                  {tasks.length} tâche{tasks.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle tâche
            </Button>
          </div>

          {/* Email verification banner */}
          <EmailVerificationBanner />

          {/* Stats */}
          {statusFilter === "ALL" && !categoryId && <StatsCards stats={stats} />}

          {/* Search and filters */}
          <SearchAndFilters
            search={search}
            onSearchChange={setSearch}
            priority={priorityFilter}
            onPriorityChange={setPriorityFilter}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />

          {/* Quick add */}
          <QuickAddTask onAdd={handleQuickAdd} />

          {/* Task list */}
          {tasksLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              onToggle={handleToggle}
              onEdit={openEditDialog}
              onDelete={handleDeleteTask}
              onStatusChange={handleStatusChange}
              onReorder={handleReorder}
              onReminder={openReminderDialog}
            />
          )}
        </div>
      </main>

      {/* Task dialog */}
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={editingTask}
        categories={categories}
        onSave={editingTask ? handleUpdateTask : handleCreateTask}
      />

      {/* Reminder dialog */}
      <ReminderDialog
        open={reminderDialogOpen}
        onOpenChange={setReminderDialogOpen}
        task={reminderTask}
        onSave={handleCreateReminder}
      />
    </div>
  )
}
