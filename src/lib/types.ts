export type RecurrencePattern = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"

export interface Task {
  id: string
  title: string
  description: string | null
  status: "TODO" | "IN_PROGRESS" | "DONE"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate: string | null
  completedAt: string | null
  position: number
  userId: string
  categoryId: string | null
  category: Category | null
  recurrencePattern: RecurrencePattern | null
  recurrenceInterval: number | null
  recurrenceEndDate: string | null
  parentTaskId: string | null
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string
  userId: string
  _count?: { tasks: number }
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
  name: string | null
}

export interface Stats {
  total: number
  todo: number
  inProgress: number
  done: number
  urgent: number
  overdue: number
  completionRate: number
  completedToday: number
}

export type FilterStatus = "ALL" | "TODO" | "IN_PROGRESS" | "DONE"
export type FilterPriority = "ALL" | "LOW" | "MEDIUM" | "HIGH" | "URGENT"
export type SortBy = "position" | "dueDate" | "priority" | "createdAt" | "title"
export type SortOrder = "asc" | "desc"

export const PRIORITY_CONFIG = {
  LOW: { label: "Basse", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", dot: "bg-gray-400" },
  MEDIUM: { label: "Moyenne", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", dot: "bg-blue-400" },
  HIGH: { label: "Haute", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300", dot: "bg-orange-400" },
  URGENT: { label: "Urgente", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", dot: "bg-red-500" },
} as const

export const STATUS_CONFIG = {
  TODO: { label: "À faire", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  IN_PROGRESS: { label: "En cours", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  DONE: { label: "Terminée", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
} as const

export const RECURRENCE_CONFIG = {
  DAILY: { label: "Quotidien", plural: "jours" },
  WEEKLY: { label: "Hebdomadaire", plural: "semaines" },
  MONTHLY: { label: "Mensuel", plural: "mois" },
  YEARLY: { label: "Annuel", plural: "ans" },
} as const
