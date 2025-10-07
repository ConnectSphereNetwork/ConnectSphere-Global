"use client"

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { deleteJson, getJson, putJson } from "@/lib/api";


interface FriendRequest {
  _id: string;
  sender: {
    _id: string;
    username: string;
    email: string;
  };
  status: 'pending' | 'accepted' | 'declined';
}

export default function PendingRequestsPage() {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch requests
  const fetchRequests = async () => {
    try {
      const response = await getJson<{ data: FriendRequest[] }>('/api/friends/requests');
      setRequests(response.data);
    } catch (error) {
      console.error("Failed to fetch friend requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // 2. Handler function to accept a request
  const handleAccept = async (requestId: string) => {
    try {
      await putJson(`/api/friends/requests/${requestId}/accept`);
      // Update the UI by removing the accepted request from the list
      setRequests(prevRequests => prevRequests.filter(req => req._id !== requestId));
    } catch (error) {
      console.error("Failed to accept friend request:", error);
      alert("Could not accept the request. Please try again.");
    }
  };



    // Handler function to decline a request
  const handleDecline = async (requestId: string) => {
    try {
      await deleteJson(`/api/friends/requests/${requestId}/decline`);
      // Update the UI by removing the declined request
      setRequests(prevRequests => prevRequests.filter(req => req._id !== requestId));
    } catch (error) {
      console.error("Failed to decline friend request:", error);
      alert("Could not decline the request. Please try again.");
    }
  };

  return (
    <ProtectedRoute>
      <Header />
      <main className="pt-20 container mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Friend Requests</h1>
        {loading ? (
          <p>Loading requests...</p>
        ) : requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request._id} className="flex items-center justify-between p-4 border rounded-lg bg-muted">
                <div>
                  <p className="font-semibold">{request.sender.username}</p>
                  <p className="text-sm text-muted-foreground">{request.sender.email}</p>
                </div>
                <div className="flex gap-2">
                  {/* 3. Wire up the onClick event */}
                  <Button size="sm" onClick={() => handleAccept(request._id)}>
                    Accept
                  </Button>
                   <Button size="sm" variant="outline" onClick={() => handleDecline(request._id)}>
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>You have no pending friend requests.</p>
        )}
      </main>
    </ProtectedRoute>
  );
}