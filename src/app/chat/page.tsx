"use client"

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getJson, postJson } from "@/lib/api";
// import { getJson, postJson } from "@/utils/api";


interface Message {
  sender: string;
  text: string;
}

interface Participant {
  _id: string;
  username: string;
}

export default function ChatRoomPage() {
  const socket = useSocket();
  const { user } = useAuth();
  const params = useParams();
  const chatId = params.chatId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState<Participant | null>(null);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'sent' | 'friends'>('idle');

  useEffect(() => {
    if (chatId && user) {
      const fetchChatDetails = async () => {
        try {
          const res = await getJson<{ data: { chat: { participants: Participant[] } } }>(`/api/chats/${chatId}`);
          const partner = res.data.chat.participants.find(p => p._id !== user._id) || null;
          setOtherUser(partner);
        } catch (error) {
          console.error("Failed to fetch chat details:", error);
        }
      };
      fetchChatDetails();
    }
  }, [chatId, user]);

  useEffect(() => {
    if (!socket || !chatId) return;
    socket.emit("joinRoom", chatId);
    const handleReceiveMessage = (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };
    socket.on("receiveMessage", handleReceiveMessage);
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [socket, chatId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !socket || !user) return;
    const messageData: Message = { sender: user.username, text: newMessage };
    socket.emit("sendMessage", { chatId, messageData });
    setNewMessage("");
  };

  const handleSendFriendRequest = async () => {
    if (!otherUser) return;
    try {
      await postJson('/api/friends/request', { recipientId: otherUser._id });
      setRequestStatus('sent');
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <ProtectedRoute>
      <main className="container mx-auto flex flex-col h-screen">
        <Header />
        <div className="flex-1 flex flex-col min-h-0 bg-red-500 p-8">
  <h1 className="text-white text-4xl">
    TESTING: DOES THIS RED BOX APPEAR?
  </h1>
</div>

        {/* <div className="flex-1 flex flex-col min-h-0">
          {/* Chat Header */}
          <div className="p-4 border-b flex justify-between items-center">
            {otherUser ? (
              <>
                <h2 className="text-xl font-bold">Chat with {otherUser.username}</h2>
                <Button onClick={handleSendFriendRequest} disabled={requestStatus === 'sent'}>
                  {requestStatus === 'sent' ? 'Request Sent' : 'Add Friend'}
                </Button>
              </>
            ) : (
              <h2 className="text-xl font-bold">Loading Chat...</h2>
            )}
          </div>
          
          {/* Message Display Area */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${ msg.sender === user?.username ? "justify-end" : "justify-start" }`}
              >
                <div
                  className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                    msg.sender === user?.username
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="font-bold text-sm">{msg.sender}</p>
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input Form */}
          <div className="p-4 bg-background border-t">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">Send</Button>
            </form>
          </div>
        {/* </div> */} 
      </main>
    </ProtectedRoute>
  );
}