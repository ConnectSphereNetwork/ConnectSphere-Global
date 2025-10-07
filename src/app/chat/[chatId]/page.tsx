"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import ProtectedRoute from "@/components/ProtectedRoute"
import Header from "@/components/Header"
// import AuthScene from "@/components/auth-scene"
import { useSocket } from "@/hooks/useSocket"
import { useAuth } from "@/context/AuthContext"
import { getJson, postJson } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import AuthScene from "@/components/auth/auth-scene"

interface Message {
  sender: string
  text: string
}

interface Participant {
  _id: string
  username: string
}

export default function ChatRoomPage() {
  const socket = useSocket()
  const { user } = useAuth()
  const params = useParams()
  const chatId = params.chatId as string

  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [otherUser, setOtherUser] = useState<Participant | null>(null)
  const [requestStatus, setRequestStatus] = useState<"idle" | "sent" | "friends">("idle")
  const [isSending, setIsSending] = useState(false)

  const endRef = useRef<HTMLDivElement | null>(null)
  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }

  useEffect(() => {
    if (chatId && user) {
      const fetchChatDetails = async () => {
        try {
          const res = await getJson<{ data: { chat: { participants: Participant[] } } }>(`/api/chats/${chatId}`)
          const partner = res.data.chat.participants.find((p) => p._id !== user._id) || null
          setOtherUser(partner)
        } catch (error) {
          console.error("[v0] Failed to fetch chat details:", error)
        }
      }
      fetchChatDetails()
    }
  }, [chatId, user])

  useEffect(() => {
    if (!socket || !chatId) return
    socket.emit("joinRoom", chatId)

    const handleReceiveMessage = (message: Message) => {
      setMessages((prev) => [...prev, message])
    }

    socket.on("receiveMessage", handleReceiveMessage)
    return () => {
      socket.off("receiveMessage", handleReceiveMessage)
    }
  }, [socket, chatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newMessage.trim()
    if (trimmed === "" || !user) {
      console.log("[v0] Blocked send: empty message or missing user", {
        hasUser: Boolean(user),
        len: trimmed.length,
      })
      return
    }

    setIsSending(true)
    const messageData: Message = { sender: user.username, text: trimmed }

    // Optimistic update
    setMessages((prev) => [...prev, messageData])
    setNewMessage("")

    try {
      console.log("[v0] Sending message", {
        chatId,
        hasSocket: Boolean(socket),
        sender: user.username,
      })
      // Emit via socket if available
      if (socket) {
        socket.emit("sendMessage", { chatId, messageData })
      }
      // Optional REST fallback if your API route exists
      try {
        await postJson(`/api/chats/${chatId}/messages`, messageData)
      } catch (apiErr) {
        // Soft-fail the REST call if not present
        console.log("[v0] REST fallback failed or not available:", apiErr)
      }
    } catch (err) {
      console.log("[v0] Send error, reverting optimistic update:", (err as Error)?.message)
      // Revert optimistic update on hard failure
      setMessages((prev) => prev.slice(0, -1))
      setNewMessage(trimmed)
    } finally {
      setIsSending(false)
    }
  }

  const handleSendFriendRequest = async () => {
    if (!otherUser) return
    try {
      await postJson("/api/friends/request", { recipientId: otherUser._id })
      setRequestStatus("sent")
    } catch (error: any) {
      alert(error.message)
    }
  }

  const otherUserInitial = otherUser?.username?.[0]?.toUpperCase() ?? "U"

  return (
    <ProtectedRoute>
      <AuthScene className="pt-16">
        <Header />
        <main className="container mx-auto px-6 py-6">
          <section className="mx-auto max-w-3xl">
            <Card className="h-[calc(100dvh-9rem)] flex flex-col backdrop-blur supports-[backdrop-filter]:bg-card/70 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              <CardHeader className="border-b sticky top-0 z-10 bg-card/70 supports-[backdrop-filter]:bg-card/70 backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="/placeholder-user.jpg" alt="" />
                      <AvatarFallback>{otherUserInitial}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-pretty text-xl">
                        {otherUser ? `Chat with ${otherUser.username}` : "Loading Chat..."}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Private room • end-to-end conversation</p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={handleSendFriendRequest}
                    disabled={requestStatus === "sent" || !otherUser}
                    className="transition-colors duration-300"
                  >
                    {requestStatus === "sent" ? "Request Sent" : "Add Friend"}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0 flex-1 min-h-0">
                <ScrollArea className="h-full p-4">
                  <div className="flex flex-col gap-4">
                    {messages.map((msg, index) => {
                      const isSelf = msg.sender === user?.username
                      return (
                        <div
                          key={index}
                          className={`flex ${isSelf ? "justify-end" : "justify-start"} animate-in fade-in-50`}
                        >
                          <div
                            className={[
                              "max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-2 shadow-sm transition-all duration-300",
                              isSelf
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted text-foreground rounded-bl-sm",
                            ].join(" ")}
                          >
                            <p className="text-xs font-medium opacity-80 mb-0.5">{msg.sender}</p>
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={endRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              <div className="p-4 border-t bg-background/60 supports-[backdrop-filter]:bg-background/60 backdrop-blur">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <label htmlFor="message" className="sr-only">
                    Message
                  </label>
                  <Input
                    id="message"
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={isSending || newMessage.trim() === ""}
                    aria-disabled={isSending || newMessage.trim() === ""}
                    className="transition-colors duration-300"
                  >
                    {isSending ? "Sending..." : "Send"}
                  </Button>
                </form>
              </div>
            </Card>
          </section>
        </main>
      </AuthScene>
    </ProtectedRoute>
  )
}
