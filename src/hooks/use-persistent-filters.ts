"use client"

import { useState, useEffect, useCallback } from "react"
import type { FilterStatus, FilterPriority, SortBy, SortOrder } from "@/lib/types"

const STORAGE_KEY = "taskflow-filters"

export interface PersistentFilters {
  statusFilter: FilterStatus
  priorityFilter: FilterPriority
  categoryId: string | null
  sortBy: SortBy
  sortOrder: SortOrder
  hideCompleted: boolean
}

const defaultFilters: PersistentFilters = {
  statusFilter: "ALL",
  priorityFilter: "ALL",
  categoryId: null,
  sortBy: "position",
  sortOrder: "asc",
  hideCompleted: false,
}

export function usePersistentFilters() {
  const [filters, setFilters] = useState<PersistentFilters>(defaultFilters)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load filters from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<PersistentFilters>
        setFilters((prev) => ({ ...prev, ...parsed }))
      }
    } catch (error) {
      console.error("Failed to load filters from localStorage:", error)
    }
    setIsLoaded(true)
  }, [])

  // Save filters to localStorage when they change
  useEffect(() => {
    if (!isLoaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
    } catch (error) {
      console.error("Failed to save filters to localStorage:", error)
    }
  }, [filters, isLoaded])

  const setStatusFilter = useCallback((statusFilter: FilterStatus) => {
    setFilters((prev) => ({ ...prev, statusFilter }))
  }, [])

  const setPriorityFilter = useCallback((priorityFilter: FilterPriority) => {
    setFilters((prev) => ({ ...prev, priorityFilter }))
  }, [])

  const setCategoryId = useCallback((categoryId: string | null) => {
    setFilters((prev) => ({ ...prev, categoryId }))
  }, [])

  const setSortBy = useCallback((sortBy: SortBy) => {
    setFilters((prev) => ({ ...prev, sortBy }))
  }, [])

  const setSortOrder = useCallback((sortOrder: SortOrder) => {
    setFilters((prev) => ({ ...prev, sortOrder }))
  }, [])

  const setHideCompleted = useCallback((hideCompleted: boolean) => {
    setFilters((prev) => ({ ...prev, hideCompleted }))
  }, [])

  const setSort = useCallback((sortBy: SortBy, sortOrder: SortOrder) => {
    setFilters((prev) => ({ ...prev, sortBy, sortOrder }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [])

  return {
    ...filters,
    isLoaded,
    setStatusFilter,
    setPriorityFilter,
    setCategoryId,
    setSortBy,
    setSortOrder,
    setHideCompleted,
    setSort,
    resetFilters,
  }
}
