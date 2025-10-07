"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { getJson, postJson } from "@/lib/api";

// Define the type for the request data we expect
interface FriendRequest {
  _id: string;
}

export default function Header() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [requestCount, setRequestCount] = useState(0);

  // Fetch the number of pending friend requests when the component loads
  useEffect(() => {
    if (user) {
      const fetchRequestCount = async () => {
        try {
          const response = await getJson<{ data: FriendRequest[] }>('/api/friends/requests');
          setRequestCount(response.data.length);
        } catch (error) {
          console.error("Failed to fetch request count:", error);
        }
      };
      fetchRequestCount();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await postJson('/api/auth/logout', {});
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-background border-b z-10">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/dashboard" className="text-xl font-bold">
          ConnectSphere
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/friends">
                <Button variant="ghost">Friends</Button>
              </Link>
              <Link href="/friends/requests" className="relative">
                <Button variant="ghost">Requests</Button>
                {requestCount > 0 && (
                  <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {requestCount}
                  </span>
                )}
              </Link>
              <span className="text-sm text-muted-foreground">|</span>
              <span>Welcome, {user.username}!</span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <p>Loading user...</p>
          )}
        </div>
      </div>
    </header>
  );
}