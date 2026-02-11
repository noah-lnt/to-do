"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Users, Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useGroups, useGroupInvitations } from "@/hooks/use-groups"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function GroupsPage() {
  const router = useRouter()
  const { groups, loading: groupsLoading } = useGroups()
  const { invitations, loading: invitationsLoading, acceptInvitation, declineInvitation } = useGroupInvitations()
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null)

  const handleAccept = async (token: string) => {
    setProcessingInvitation(token)
    try {
      const result = await acceptInvitation(token)
      router.push(`/groups/${result.groupId}`)
    } catch (error) {
      console.error("Failed to accept invitation:", error)
    } finally {
      setProcessingInvitation(null)
    }
  }

  const handleDecline = async (token: string) => {
    setProcessingInvitation(token)
    try {
      await declineInvitation(token)
    } catch (error) {
      console.error("Failed to decline invitation:", error)
    } finally {
      setProcessingInvitation(null)
    }
  }

  const loading = groupsLoading || invitationsLoading

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Groupes</h1>
          <p className="text-sm text-muted-foreground">
            Collaborez avec d'autres personnes
          </p>
        </div>
        <Link href="/groups/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau groupe
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Pending invitations */}
          {invitations.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Invitations en attente ({invitations.length})
              </h2>
              {invitations.map((invitation) => (
                <Card key={invitation.id} className="border-primary/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: invitation.group?.color || "#6366f1" }}
                    >
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{invitation.group?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Invite par {invitation.sender?.name || invitation.sender?.email}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDecline(invitation.token)}
                        disabled={processingInvitation === invitation.token}
                      >
                        Refuser
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAccept(invitation.token)}
                        disabled={processingInvitation === invitation.token}
                      >
                        {processingInvitation === invitation.token && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Accepter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Groups list */}
          {groups.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-lg font-medium">Aucun groupe</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Creez un groupe pour collaborer avec d'autres personnes
                </p>
                <Link href="/groups/new" className="mt-4">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Creer un groupe
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {groups.map((group) => (
                <Link key={group.id} href={`/groups/${group.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: group.color }}
                        >
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{group.name}</CardTitle>
                          {group.description && (
                            <CardDescription className="line-clamp-1">
                              {group.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {group._count?.members || 0} membre{(group._count?.members || 0) !== 1 ? "s" : ""}
                        </span>
                        <span>
                          {group._count?.tasks || 0} tache{(group._count?.tasks || 0) !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
