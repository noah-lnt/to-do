"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
  Users,
  Settings,
  UserPlus,
  MoreHorizontal,
  Crown,
  Shield,
  User,
  Trash2,
  Mail,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth-provider"
import { useGroups } from "@/hooks/use-groups"
import { GROUP_ROLE_CONFIG } from "@/lib/types"
import type { Group, GroupMember } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const { inviteMember, removeMember, updateMemberRole, deleteGroup } = useGroups()

  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchGroup = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${id}`)
      if (!res.ok) {
        if (res.status === 404) {
          router.push("/groups")
          return
        }
        throw new Error("Failed to fetch group")
      }
      const data = await res.json()
      setGroup(data)
    } catch (error) {
      console.error("Error fetching group:", error)
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchGroup()
  }, [fetchGroup])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviteLoading(true)
    setInviteError("")

    try {
      await inviteMember(id, inviteEmail.trim())
      setInviteEmail("")
      setShowInviteDialog(false)
      fetchGroup()
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "Erreur lors de l'envoi de l'invitation")
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMember(id, userId)
      fetchGroup()
    } catch (error) {
      console.error("Failed to remove member:", error)
    }
  }

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await updateMemberRole(id, userId, role)
      fetchGroup()
    } catch (error) {
      console.error("Failed to update role:", error)
    }
  }

  const handleDeleteGroup = async () => {
    setDeleteLoading(true)
    try {
      await deleteGroup(id)
      router.push("/groups")
    } catch (error) {
      console.error("Failed to delete group:", error)
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!group) {
    return null
  }

  const currentMember = group.members?.find((m) => m.userId === user?.id)
  const isOwner = group.ownerId === user?.id
  const isAdmin = currentMember?.role === "ADMIN" || isOwner
  const canManageMembers = isOwner || isAdmin

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Crown className="h-4 w-4 text-amber-500" />
      case "ADMIN":
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/groups">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: group.color }}
        >
          <Users className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{group.name}</h1>
          {group.description && (
            <p className="text-sm text-muted-foreground truncate">{group.description}</p>
          )}
        </div>
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer le groupe
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Membres</CardTitle>
              <CardDescription>
                {group.members?.length || 0} membre{(group.members?.length || 0) !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            {canManageMembers && (
              <Button onClick={() => setShowInviteDialog(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Inviter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {group.members?.map((member) => {
              const memberUser = member.user
              const initials = memberUser?.name
                ? memberUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                : memberUser?.email?.[0].toUpperCase() || "?"

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {memberUser?.name || memberUser?.email}
                      {member.userId === user?.id && (
                        <span className="text-muted-foreground ml-1">(vous)</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {memberUser?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(member.role)}
                    <Badge
                      variant="secondary"
                      className={cn("text-xs", GROUP_ROLE_CONFIG[member.role].color)}
                    >
                      {GROUP_ROLE_CONFIG[member.role].label}
                    </Badge>
                  </div>
                  {canManageMembers && member.userId !== group.ownerId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isOwner && (
                          <>
                            {member.role !== "ADMIN" && (
                              <DropdownMenuItem onClick={() => handleUpdateRole(member.userId, "ADMIN")}>
                                <Shield className="mr-2 h-4 w-4" />
                                Promouvoir admin
                              </DropdownMenuItem>
                            )}
                            {member.role === "ADMIN" && (
                              <DropdownMenuItem onClick={() => handleUpdateRole(member.userId, "MEMBER")}>
                                <User className="mr-2 h-4 w-4" />
                                Retirer admin
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(member.userId)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Retirer du groupe
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {canManageMembers && group.invitations && group.invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Invitations en attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {group.invitations.map((invitation: any) => (
                <div
                  key={invitation.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50"
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm">{invitation.email}</span>
                  <Badge variant="outline" className="text-xs">
                    En attente
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inviter un membre</DialogTitle>
            <DialogDescription>
              Envoyez une invitation par email. Si la personne n'a pas de compte, elle pourra en creer un.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite}>
            <div className="space-y-4 py-4">
              <Input
                type="email"
                placeholder="email@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
              {inviteError && (
                <p className="text-sm text-red-500">{inviteError}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowInviteDialog(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={inviteLoading || !inviteEmail.trim()}>
                {inviteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Envoyer l'invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le groupe</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir supprimer ce groupe ? Cette action est irreversible et supprimera toutes les taches associees.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteGroup} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
