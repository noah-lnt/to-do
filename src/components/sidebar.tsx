"use client"

import { useState } from "react"
import {
  CheckSquare,
  Clock,
  Inbox,
  FolderPlus,
  Trash2,
  LogOut,
  ListTodo,
  Settings,
  CalendarDays,
  Sun,
  ChevronLeft,
  ChevronRight,
  Home,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
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
  onCollapsedChange?: (collapsed: boolean) => void
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

const viewItems = [
  { href: "/", label: "Tableau de bord", icon: Home },
  { href: "/today", label: "Aujourd'hui", icon: Sun },
  { href: "/calendar", label: "Calendrier", icon: CalendarDays },
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
  collapsed = false,
  onCollapsedChange,
}: SidebarProps) {
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState("#6366f1")
  const pathname = usePathname()

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    await onCreateCategory({ name: newCategoryName.trim(), color: newCategoryColor })
    setNewCategoryName("")
    setShowNewCategory(false)
  }

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase()

  const SidebarItem = ({
    icon: Icon,
    label,
    active,
    onClick,
    href,
    destructive,
  }: {
    icon: typeof Inbox
    label: string
    active?: boolean
    onClick?: () => void
    href?: string
    destructive?: boolean
  }) => {
    const content = (
      <button
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "text-sidebar-foreground/70",
          destructive && "text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30",
          collapsed && "justify-center px-2"
        )}
        onClick={onClick}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </button>
    )

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {href ? <Link href={href}>{content}</Link> : content}
          </TooltipTrigger>
          <TooltipContent side="right">
            {label}
          </TooltipContent>
        </Tooltip>
      )
    }

    return href ? <Link href={href}>{content}</Link> : content
  }

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "flex h-full flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* User info */}
        <div className={cn("flex items-center gap-3 p-4 border-b", collapsed && "justify-center p-2")}>
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-medium">{user.name || user.email}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
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
            </>
          )}
        </div>

        <ScrollArea className="flex-1 p-3">
          {/* Views */}
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-3 py-1">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Vues
                </span>
              </div>
            )}
            {viewItems.map((item) => (
              <SidebarItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                active={pathname === item.href}
              />
            ))}
          </div>

          <Separator className="my-4" />

          {/* Filters - only show on dashboard */}
          {(pathname === "/" || !collapsed) && (
            <>
              <div className="space-y-1">
                {!collapsed && (
                  <div className="px-3 py-1">
                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                      Filtres
                    </span>
                  </div>
                )}
                {filterItems.map((item) => (
                  <SidebarItem
                    key={item.key}
                    icon={item.icon}
                    label={item.label}
                    active={activeFilter === item.key && !activeCategoryId && pathname === "/"}
                    onClick={() => {
                      onFilterChange(item.key)
                      onCategoryChange(null)
                    }}
                  />
                ))}
              </div>

              <Separator className="my-4" />
            </>
          )}

          {/* Categories */}
          <div className="space-y-1">
            {!collapsed && (
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
            )}

            {collapsed && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-full h-9"
                    onClick={() => setShowNewCategory(true)}
                  >
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Nouvelle catégorie
                </TooltipContent>
              </Tooltip>
            )}

            {categories.map((category) => (
              <div key={category.id}>
                {collapsed ? (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button
                        className={cn(
                          "flex w-full items-center justify-center rounded-lg p-2 transition-colors hover:bg-sidebar-accent",
                          activeCategoryId === category.id
                            ? "bg-sidebar-accent"
                            : ""
                        )}
                        onClick={() => {
                          onCategoryChange(category.id)
                          onFilterChange("ALL")
                        }}
                      >
                        <span
                          className="h-4 w-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {category.name} ({category._count?.tasks || 0})
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <div
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
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Bottom actions */}
        <div className={cn("border-t p-3 space-y-1", collapsed && "p-2")}>
          {collapsed && <ThemeToggle />}
          <SidebarItem
            icon={Settings}
            label="Paramètres"
            href="/settings"
            active={pathname === "/settings"}
          />
          <SidebarItem
            icon={LogOut}
            label="Se déconnecter"
            onClick={onLogout}
            destructive
          />

          {/* Collapse toggle */}
          {onCollapsedChange && (
            <>
              <Separator className="my-2" />
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("w-full", collapsed && "px-2")}
                    onClick={() => onCollapsedChange(!collapsed)}
                  >
                    {collapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Réduire
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    Développer la barre latérale
                  </TooltipContent>
                )}
              </Tooltip>
            </>
          )}
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
    </TooltipProvider>
  )
}
