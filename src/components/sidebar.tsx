"use client"

import { useState } from "react"
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Inbox,
  FolderPlus,
  Trash2,
  LogOut,
  User,
  LayoutDashboard,
  ListTodo,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Category, FilterStatus, User as UserType } from "@/lib/types"

interface SidebarProps {
  user: UserType
  categories: Category[]
  activeFilter: FilterStatus
  activeCategoryId: string | null
  onFilterChange: (filter: FilterStatus) => void
  onCategoryChange: (categoryId: string | null) => void
  onCreateCategory: (data: { name: string; color: string }) => Promise<void>
  onDeleteCategory: (id: string) => Promise<void>
  onLogout: () => void
  collapsed?: boolean
}

const COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#84cc16",
]

const filterItems = [
  { key: "ALL" as FilterStatus, label: "Toutes les tâches", icon: Inbox },
  { key: "TODO" as FilterStatus, label: "À faire", icon: ListTodo },
  { key: "IN_PROGRESS" as FilterStatus, label: "En cours", icon: Clock },
  { key: "DONE" as FilterStatus, label: "Terminées", icon: CheckSquare },
]

export function Sidebar({
  user,
  categories,
  activeFilter,
  activeCategoryId,
  onFilterChange,
  onCategoryChange,
  onCreateCategory,
  onDeleteCategory,
  onLogout,
}: SidebarProps) {
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState("#6366f1")

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    await onCreateCategory({ name: newCategoryName.trim(), color: newCategoryColor })
    setNewCategoryName("")
    setShowNewCategory(false)
  }

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase()

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* User info */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user.name || user.email}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <ThemeToggle />
      </div>

      <ScrollArea className="flex-1 p-3">
        {/* Filters */}
        <div className="space-y-1">
          {filterItems.map((item) => (
            <button
              key={item.key}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent",
                activeFilter === item.key && !activeCategoryId
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70"
              )}
              onClick={() => {
                onFilterChange(item.key)
                onCategoryChange(null)
              }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Categories */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Catégories
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowNewCategory(true)}
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {categories.map((category) => (
            <div
              key={category.id}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent cursor-pointer",
                activeCategoryId === category.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70"
              )}
              onClick={() => {
                onCategoryChange(category.id)
                onFilterChange("ALL")
              }}
            >
              <span
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: category.color }}
              />
              <span className="flex-1 truncate">{category.name}</span>
              <span className="text-xs text-muted-foreground">
                {category._count?.tasks || 0}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteCategory(category.id)
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Logout */}
      <div className="border-t p-3">
        <Button variant="ghost" className="w-full justify-start" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Se déconnecter
        </Button>
      </div>

      {/* New Category Dialog */}
      <Dialog open={showNewCategory} onOpenChange={setShowNewCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle catégorie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nom de la catégorie"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateCategory()
              }}
            />
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className={cn(
                    "h-8 w-8 rounded-full transition-transform",
                    newCategoryColor === color && "ring-2 ring-offset-2 ring-primary scale-110"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewCategoryColor(color)}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCategory(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
