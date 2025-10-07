"use client"

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Define a type for our message objects for better type safety
interface Message {
  sender: string;
  text: string;
}

export default function ChatPage() {
  const socket = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Effect to handle incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    socket.on("receiveMessage", handleReceiveMessage);

    // Clean up the event listener on component unmount
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [socket]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !socket || !user) return;

    const messageData: Message = {
      sender: user.username,
      text: newMessage,
    };

    socket.emit("sendMessage", messageData);
    setNewMessage(""); // Clear the input field
  };

  return (
    <ProtectedRoute>
      <Header />
      <main className="pt-16 container mx-auto">
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          {/* Message Display Area */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.sender === user?.username ? "justify-end" : "justify-start"
                }`}
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
        </div>
      </main>
    </ProtectedRoute>
  );
}