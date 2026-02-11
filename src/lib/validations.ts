import { z } from "zod"

export const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
})

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
})

export const taskSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(200),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  position: z.number().optional(),
  recurrenceType: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]).optional().nullable(),
  recurrenceInterval: z.number().min(1).max(365).optional().nullable(),
  recurrenceEndDate: z.string().optional().nullable(),
  recurrenceDays: z.array(z.number().min(0).max(6)).optional().nullable(),
  groupId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  notifyOnComplete: z.boolean().optional(),
  notifyEmail: z.string().email("Email invalide").optional().nullable(),
})

export const categorySchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide").optional(),
  icon: z.string().max(50).optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type TaskInput = z.infer<typeof taskSchema>
export type CategoryInput = z.infer<typeof categorySchema>
