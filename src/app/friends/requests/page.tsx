"use client"
import { useMemo, useState, useTransition } from "react"
import useSWR, { mutate } from "swr"
import ProtectedRoute from "@/components/ProtectedRoute"
import Header from "@/components/Header"
// import AuthScene from "@/components/auth-scene"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast" // standardize toast import to shadcn path
import { getJson, putJson, deleteJson } from "@/lib/api"
import AuthScene from "@/components/auth/auth-scene"

type FriendRequest = {
  _id: string
  sender: { _id: string; username: string; email: string }
  status: "pending" | "accepted" | "declined"
}

const fetcher = async (url: string) => {
  return getJson<{ status: string; count: number; data: FriendRequest[] }>(url)
}

export default function PendingRequestsPage() {
  const { toast } = useToast() // use the actual hook instance (provider added in layout)
  const { data, error, isLoading } = useSWR<{ status: string; count: number; data: FriendRequest[] }>(
    "/api/friends/requests",
    fetcher,
    { revalidateOnFocus: false },
  )
  const [query, setQuery] = useState("")
  const [pendingActionId, setPendingActionId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const requests = data?.data ?? []

  const filtered = useMemo(() => {
    if (!query) return requests
    const q = query.toLowerCase()
    return requests.filter(
      (r) => r.sender.username.toLowerCase().includes(q) || r.sender.email.toLowerCase().includes(q),
    )
  }, [requests, query])

  const onAccept = (requestId: string) => {
    setPendingActionId(requestId)
    const key = "/api/friends/requests"
    const current = data
    startTransition(async () => {
      try {
        await mutate(
          key,
          async () => {
            await putJson(`/api/friends/requests/${requestId}/accept`)
            return {
              ...current!,
              count: (current?.count ?? 1) - 1,
              data: (current?.data ?? []).filter((r) => r._id !== requestId),
            }
          },
          { revalidate: false },
        )
        toast({ title: "Request accepted", description: "You are now friends." })
      } catch (e) {
        toast({ title: "Failed to accept", description: "Please try again.", variant: "destructive" })
      } finally {
        setPendingActionId(null)
      }
    })
  }

  const onDecline = (requestId: string) => {
    setPendingActionId(requestId)
    const key = "/api/friends/requests"
    const current = data
    startTransition(async () => {
      try {
        await mutate(
          key,
          async () => {
            await deleteJson(`/api/friends/requests/${requestId}/decline`)
            return {
              ...current!,
              count: (current?.count ?? 1) - 1,
              data: (current?.data ?? []).filter((r) => r._id !== requestId),
            }
          },
          { revalidate: false },
        )
        toast({ title: "Request declined", description: "The request has been removed." })
      } catch (e) {
        toast({ title: "Failed to decline", description: "Please try again.", variant: "destructive" })
      } finally {
        setPendingActionId(null)
      }
    })
  }

  return (
    <ProtectedRoute>
      <AuthScene>
        <Header />
        <main className="pt-24">
          <section className="mx-auto w-full max-w-3xl px-4">
            <Card className="border bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-colors duration-300">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-balance">Friend Requests</CardTitle>
                  <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                    {isLoading ? "…" : `${requests.length} pending`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by username or email"
                    className="transition-all duration-300 focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {error ? (
                  <div className="rounded-lg border p-4 text-sm text-destructive">
                    Could not load requests. Please refresh.
                  </div>
                ) : isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-2">
                          <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                          <div className="h-3 w-56 rounded bg-muted animate-pulse" />
                        </div>
                        <div className="flex gap-2">
                          <div className="h-8 w-20 rounded bg-muted animate-pulse" />
                          <div className="h-8 w-20 rounded bg-muted animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filtered.length > 0 ? (
                  <ul className="space-y-3">
                    {filtered.map((request, idx) => {
                      const acting = pendingActionId === request._id || isPending
                      return (
                        <li
                          key={request._id}
                          className="flex items-center justify-between rounded-lg border p-4 bg-muted/30 animate-in fade-in-50 slide-in-from-bottom-2"
                          style={{ animationDelay: `${idx * 60}ms` }}
                        >
                          <div>
                            <p className="font-medium">{request.sender.username}</p>
                            <p className="text-sm text-muted-foreground">{request.sender.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={acting}
                              onClick={() => onAccept(request._id)}
                              className="transition-transform duration-200 hover:translate-y-[-1px]"
                            >
                              {acting && pendingActionId === request._id ? "Accepting…" : "Accept"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={acting}
                              onClick={() => onDecline(request._id)}
                              className="transition-transform duration-200 hover:translate-y-[-1px]"
                            >
                              {acting && pendingActionId === request._id ? "Declining…" : "Decline"}
                            </Button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <div className="rounded-lg border p-8 text-center">
                    <p className="text-sm text-muted-foreground">You have no pending friend requests.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </main>
      </AuthScene>
    </ProtectedRoute>
  )
}
