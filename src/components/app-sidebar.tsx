"use client"

import { useState } from "react"
import {
  CheckSquare,
  Clock,
  Inbox,
  FolderPlus,
  Trash2,
  LogOut,
  Settings,
  CalendarDays,
  Sun,
  ChevronLeft,
  ChevronRight,
  Users,
  LayoutDashboard,
  ListTodo,
  UserPlus,
} from "lucide-react"
import Link from "next/link"
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
import type { Category, User as UserType, Group } from "@/lib/types"

interface AppSidebarProps {
  user: UserType
  categories: Category[]
  groups: Group[]
  collapsed: boolean
  mobileOpen: boolean
  onToggleCollapse: () => void
  onMobileClose: () => void
  onCreateCategory: (data: { name: string; color: string }) => Promise<void>
  onDeleteCategory: (id: string) => Promise<void>
  onLogout: () => void
  currentPath: string
}

const COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#84cc16",
]

const viewItems = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/today", label: "Aujourd'hui", icon: Sun },
  { href: "/calendar", label: "Calendrier", icon: CalendarDays },
]

export function AppSidebar({
  user,
  categories,
  groups,
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onMobileClose,
  onCreateCategory,
  onDeleteCategory,
  onLogout,
  currentPath,
}: AppSidebarProps) {
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

  const isActive = (href: string) => {
    if (href === "/") return currentPath === "/"
    return currentPath.startsWith(href)
  }

  const SidebarItem = ({
    href,
    icon: Icon,
    label,
    active,
    onClick,
  }: {
    href?: string
    icon: React.ElementType
    label: string
    active?: boolean
    onClick?: () => void
  }) => {
    const content = (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer",
          collapsed ? "justify-center" : "",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent"
        )}
        onClick={onClick}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </div>
    )

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {href ? <Link href={href}>{content}</Link> : content}
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
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
          collapsed ? "w-16" : "w-64",
          // Mobile styles
          "fixed inset-y-0 left-0 z-50 lg:relative",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* User info */}
        <div className={cn(
          "flex items-center gap-3 p-4 border-b",
          collapsed && "justify-center px-2"
        )}>
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name || user.email}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
          {!collapsed && <ThemeToggle />}
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
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.href)}
              />
            ))}
          </div>

          <Separator className="my-4" />

          {/* Groups */}
          <div className="space-y-1">
            {!collapsed && (
              <div className="flex items-center justify-between px-3 py-1">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Groupes
                </span>
                <Link href="/groups/new">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <UserPlus className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            )}
            {collapsed ? (
              <SidebarItem
                href="/groups"
                icon={Users}
                label="Groupes"
                active={currentPath.startsWith("/groups")}
              />
            ) : (
              groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent cursor-pointer",
                    currentPath === `/groups/${group.id}`
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70"
                  )}
                >
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="flex-1 truncate">{group.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {group._count?.members || 0}
                  </span>
                </Link>
              ))
            )}
            {!collapsed && groups.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                Aucun groupe
              </p>
            )}
          </div>

          <Separator className="my-4" />

          {/* Categories */}
          <div className="space-y-1">
            {!collapsed && (
              <div className="flex items-center justify-between px-3 py-1">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Categories
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

            {categories.map((category) => (
              <div
                key={category.id}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent cursor-pointer",
                  collapsed && "justify-center"
                )}
              >
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={`/?category=${category.id}`} className="flex items-center justify-center">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      {category.name} ({category._count?.tasks || 0})
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <>
                    <Link href={`/?category=${category.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <span
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="flex-1 truncate">{category.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {category._count?.tasks || 0}
                      </span>
                    </Link>
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
                  </>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Bottom actions */}
        <div className={cn("border-t p-3 space-y-1", collapsed && "px-2")}>
          <SidebarItem
            href="/settings"
            icon={Settings}
            label="Parametres"
            active={currentPath === "/settings"}
          />
          <SidebarItem
            icon={LogOut}
            label="Se deconnecter"
            onClick={onLogout}
          />
        </div>

        {/* Collapse button */}
        <div className="hidden lg:block border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={onToggleCollapse}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Reduire
              </>
            )}
          </Button>
        </div>

        {/* New Category Dialog */}
        <Dialog open={showNewCategory} onOpenChange={setShowNewCategory}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle categorie</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nom de la categorie"
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
                Creer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </aside>
    </TooltipProvider>
  )
}
