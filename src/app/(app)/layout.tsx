"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/sidebar"
import { Loader2 } from "lucide-react"
import type { Category, FilterStatus } from "@/lib/types"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("ALL")
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) {
      setCollapsed(saved === "true")
    }
  }, [])

  // Save collapsed state
  const handleCollapsedChange = (value: boolean) => {
    setCollapsed(value)
    localStorage.setItem("sidebar-collapsed", String(value))
  }

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories")
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err)
    }
  }, [])

  useEffect(() => {
    if (user) fetchCategories()
  }, [user, fetchCategories])

  const handleCreateCategory = async (data: { name: string; color: string }) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        await fetchCategories()
      }
    } catch (err) {
      console.error("Failed to create category:", err)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      await fetch(`/api/categories/${id}`, { method: "DELETE" })
      await fetchCategories()
      if (activeCategoryId === id) {
        setActiveCategoryId(null)
      }
    } catch (err) {
      console.error("Failed to delete category:", err)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        user={user}
        categories={categories}
        activeFilter={activeFilter}
        activeCategoryId={activeCategoryId}
        onFilterChange={setActiveFilter}
        onCategoryChange={setActiveCategoryId}
        onCreateCategory={handleCreateCategory}
        onDeleteCategory={handleDeleteCategory}
        onLogout={handleLogout}
        collapsed={collapsed}
        onCollapsedChange={handleCollapsedChange}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
