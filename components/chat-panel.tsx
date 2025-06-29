"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, Plane, Briefcase } from "lucide-react"
import type { ChatMessage } from "@/types/chat"

interface ChatPanelProps {
  messages: ChatMessage[]
  currentAgent: string
  isLoading: boolean
  onSendMessage: (message: string) => void
}

export function ChatPanel({ messages, currentAgent, isLoading, onSendMessage }: ChatPanelProps) {
  const [userInput, setUserInput] = useState("")

  const handleUserSubmit = () => {
    if (!userInput.trim()) return
    onSendMessage(userInput)
    setUserInput("")
  }

  const getAgentAvatar = (agentName: string) => {
    if (agentName.includes("Baggage")) return <Briefcase className="h-6 w-6 text-chart-5" />
    return <Plane className="h-6 w-6 text-secondary" />
  }

  return (
    <Card className="h-full flex flex-col bg-card border-border shadow-lg">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span className="text-foreground">This is Air Canada. How can I help you?</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-muted rounded-full">{getAgentAvatar(currentAgent)}</div>
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">{currentAgent}</div>
              <div className="text-xs text-primary">Online</div>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        <ScrollArea className="flex-1 mb-4 -mx-4">
          <div className="space-y-4 p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="p-2 bg-muted rounded-full h-8 w-8 flex items-center justify-center">
                    {getAgentAvatar(message.agent || currentAgent)}
                  </div>
                )}
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
                    "bg-card text-foreground border border-border rounded-bl-none"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  {message.role === "assistant" && (
                    <div className="text-xs opacity-70 mt-2 pt-2 border-t border-border/50 flex items-center justify-between">
                      <span>via {message.agent || currentAgent}</span>
                      {message.turnId && (
                        <Badge variant="outline" className="text-xs ml-2 bg-muted/50 text-muted-foreground">
                          Turn {message.turnId.slice(-6)}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card text-foreground border border-border px-4 py-3 rounded-lg shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    <span className="text-sm">Agent is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex space-x-2">
          <Input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask about flights, baggage, or bookings..."
            onKeyPress={(e) => e.key === "Enter" && !isLoading && handleUserSubmit()}
            disabled={isLoading}
            className="flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
          <Button
            onClick={handleUserSubmit}
            disabled={isLoading || !userInput.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
