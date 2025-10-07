"use client"

import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJson } from "@/lib/api";

function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isMatching, setIsMatching] = useState(false);

  const handleFindMatch = async () => {
    setIsMatching(true);
    try {
      const response = await postJson('/api/match/find', {});
      const newChatId = response.data.chat._id;
      // Navigate to the new private chat room
      router.push(`/chat/${newChatId}`);
    } catch (error: any) {
      console.error(error);
      alert(error.message); // Simple alert for errors like "Not enough tokens"
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <ProtectedRoute>
      <Header />
      <main className="pt-16">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center">
          <h1 className="text-4xl font-bold">Your Dashboard</h1>
          {user && (
            <div className="mt-4 text-lg p-4 border rounded-lg">
              <p>Welcome, {user.username}!</p>
              <p>You have {user.tokens} tokens.</p>
            </div>
          )}
          <div className="mt-8">
            <Button size="lg" onClick={handleFindMatch} disabled={isMatching}>
              {isMatching ? "Searching for a partner..." : "Find a New Match (50 Tokens)"}
            </Button>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

export default DashboardPage;