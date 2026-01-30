"use client"

import { useState, useEffect, useCallback } from "react"
import type { Group, GroupInvitation } from "@/lib/types"

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/groups")
      if (!res.ok) throw new Error("Failed to fetch groups")
      const data = await res.json()
      setGroups(data)
    } catch (error) {
      console.error("Error fetching groups:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const createGroup = useCallback(async (data: { name: string; description?: string; color?: string }) => {
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to create group")
    const group = await res.json()
    setGroups((prev) => [...prev, group])
    return group
  }, [])

  const updateGroup = useCallback(async (id: string, data: Partial<Group>) => {
    const res = await fetch(`/api/groups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to update group")
    const updated = await res.json()
    setGroups((prev) => prev.map((g) => (g.id === id ? updated : g)))
    return updated
  }, [])

  const deleteGroup = useCallback(async (id: string) => {
    const res = await fetch(`/api/groups/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Failed to delete group")
    setGroups((prev) => prev.filter((g) => g.id !== id))
  }, [])

  const inviteMember = useCallback(async (groupId: string, email: string) => {
    const res = await fetch(`/api/groups/${groupId}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "Failed to invite member")
    }
    return res.json()
  }, [])

  const removeMember = useCallback(async (groupId: string, userId: string) => {
    const res = await fetch(`/api/groups/${groupId}/members/${userId}`, {
      method: "DELETE",
    })
    if (!res.ok) throw new Error("Failed to remove member")
  }, [])

  const updateMemberRole = useCallback(async (groupId: string, userId: string, role: string) => {
    const res = await fetch(`/api/groups/${groupId}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    if (!res.ok) throw new Error("Failed to update member role")
    return res.json()
  }, [])

  return {
    groups,
    loading,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    inviteMember,
    removeMember,
    updateMemberRole,
  }
}

export function useGroupInvitations() {
  const [invitations, setInvitations] = useState<GroupInvitation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInvitations = useCallback(async () => {
    try {
      const res = await fetch("/api/invitations")
      if (!res.ok) throw new Error("Failed to fetch invitations")
      const data = await res.json()
      setInvitations(data)
    } catch (error) {
      console.error("Error fetching invitations:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInvitations()
  }, [fetchInvitations])

  const acceptInvitation = useCallback(async (token: string) => {
    const res = await fetch(`/api/invitations/${token}/accept`, {
      method: "POST",
    })
    if (!res.ok) throw new Error("Failed to accept invitation")
    await fetchInvitations()
    return res.json()
  }, [fetchInvitations])

  const declineInvitation = useCallback(async (token: string) => {
    const res = await fetch(`/api/invitations/${token}/decline`, {
      method: "POST",
    })
    if (!res.ok) throw new Error("Failed to decline invitation")
    await fetchInvitations()
  }, [fetchInvitations])

  return {
    invitations,
    loading,
    fetchInvitations,
    acceptInvitation,
    declineInvitation,
  }
}
