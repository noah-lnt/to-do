"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { Loader2, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCategories } from "@/hooks/use-categories"
import { useGroups } from "@/hooks/use-groups"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const { categories, createCategory, deleteCategory } = useCategories()
  const { groups } = useGroups()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [pathname])

  // Load sidebar collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved) {
      setSidebarCollapsed(JSON.parse(saved))
    }
  }, [])

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem("sidebar-collapsed", JSON.stringify(next))
      return next
    })
  }, [])

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile header with menu button */}
      <div className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Ouvrir le menu</span>
        </Button>
        <span className="font-semibold">TaskFlow</span>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AppSidebar
        user={user}
        categories={categories}
        groups={groups}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onToggleCollapse={handleToggleSidebar}
        onMobileClose={() => setMobileSidebarOpen(false)}
        onCreateCategory={createCategory}
        onDeleteCategory={deleteCategory}
        onLogout={logout}
        currentPath={pathname}
      />

      {/* Main content */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
