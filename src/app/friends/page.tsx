"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { deleteJson, getJson } from "@/lib/api";

interface Friend {
  _id: string;
  username: string;
  email: string;
}

export default function FriendsListPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await getJson<{ data: Friend[] }>('/api/friends');
        setFriends(response.data);
      } catch (error) {
        console.error("Failed to fetch friends:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  // Logic for the "Chat" button
  const handleChat = async (friendId: string) => {
    try {
      const res = await getJson<{ data: { chat: { _id: string } } }>(`/api/chats/with/${friendId}`);
      const chatId = res.data.chat._id;
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error("Could not find or create chat:", error);
      alert("Could not start chat. Please try again.");
    }
  };

  // Logic for the "Unfriend" button
  const handleUnfriend = async (friendId: string) => {
    if (!confirm("Are you sure you want to unfriend this user?")) return;
    try {
      await deleteJson(`/api/friends/${friendId}`);
      // Update UI instantly by removing the friend from the list
      setFriends(prevFriends => prevFriends.filter(friend => friend._id !== friendId));
    } catch (error) {
      console.error("Failed to unfriend user:", error);
      alert("Could not unfriend user. Please try again.");
    }
  };

  return (
    <ProtectedRoute>
      <Header />
      <main className="pt-20 container mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Your Friends</h1>
        {loading ? (
          <p>Loading friends...</p>
        ) : friends.length > 0 ? (
          <div className="space-y-4">
            {friends.map((friend) => (
              <div key={friend._id} className="flex items-center justify-between p-4 border rounded-lg bg-muted">
                <div>
                  <p className="font-semibold">{friend.username}</p>
                  <p className="text-sm text-muted-foreground">{friend.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleChat(friend._id)}>Chat</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleUnfriend(friend._id)}>Unfriend</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>You haven't added any friends yet.</p>
        )}
      </main>
    </ProtectedRoute>
  );
}