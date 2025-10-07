"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"
import { getJson, postJson } from "@/lib/api"

// Define the type for the request data we expect
interface FriendRequest {
  _id: string
}

export default function Header() {
  const { user, setUser } = useAuth()
  const router = useRouter()
  const [requestCount, setRequestCount] = useState(0)

  // Fetch the number of pending friend requests when the component loads
  useEffect(() => {
    if (user) {
      const fetchRequestCount = async () => {
        try {
          const response = await getJson<{ data: FriendRequest[] }>("/api/friends/requests")
          setRequestCount(response.data.length)
        } catch (error) {
          console.error("Failed to fetch request count:", error)
        }
      }
      fetchRequestCount()
    }
  }, [user])

  const handleLogout = async () => {
    try {
      await postJson("/api/auth/logout", {})
      setUser(null)
      router.push("/login")
    } catch (error) {
      console.error("Failed to logout:", error)
    }
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur supports-backdrop-blur border-b z-50 shadow-[0_1px_0_0_var(--border)] animate-in fade-in-50 slide-in-from-top-2 duration-500"
      role="banner"
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link
          href="/dashboard"
          className="text-lg font-semibold leading-none tracking-tight transition-opacity hover:opacity-90"
          aria-label="Go to dashboard home"
        >
          ConnectSphere
        </Link>

        <nav className="flex items-center gap-3" aria-label="Primary">
          {user ? (
            <>
              <Link href="/friends">
                <Button variant="ghost" className="transition-colors hover:bg-accent hover:text-accent-foreground">
                  Friends
                </Button>
              </Link>

              <Link href="/friends/requests" className="relative">
                <Button variant="ghost" className="transition-colors hover:bg-accent hover:text-accent-foreground">
                  Requests
                </Button>
                {requestCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground ring-1 ring-primary/60 animate-pulse"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {requestCount}
                  </span>
                )}
              </Link>

              <span aria-hidden className="mx-1 text-muted-foreground">
                |
              </span>
              <span className="hidden sm:inline text-sm text-muted-foreground">Welcome, {user.username}!</span>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="transition-colors hover:bg-destructive hover:text-destructive-foreground bg-transparent"
              >
                Logout
              </Button>
            </>
          ) : (
            // Polished loading state instead of plain text
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
              <span className="inline-block h-3 w-3 rounded-full border-2 border-muted-foreground/30 border-t-foreground/70 animate-spin" />
              Loading user...
            </span>
          )}
        </nav>
      </div>
    </header>
  )
}
