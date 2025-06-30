"use client"

import type React from "react"

import { useState } from "react"
import { Send, Bot, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Textarea } from "./ui/textarea"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

export default function AIQuerySection() {
  const [query, setQuery] = useState("")
  const { user } = useAuth()
  const { sendMessage, isConnected, isConnecting, connectionError, reconnect } = useWebSocket(user?.id)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    
    // Send message through WebSocket
    sendMessage(query.trim())
    
    // Clear the input
    setQuery("")
    
    // Navigate to chatbot page to show the conversation
    router.push("/chatbot")
  }

  return (
    <Card className="mb-6 border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-green-800 dark:text-green-200">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <Bot className="h-5 w-5" />
          </div>
          <span>AI Legal Assistant</span>
          <Badge variant="secondary" className="ml-auto">
            <Sparkles className="h-3 w-3 mr-1" />
            Beta
          </Badge>
          {/* Connection Status */}
          <div className="flex items-center gap-1">
            {isConnecting ? (
              <div className="flex items-center gap-1 text-yellow-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600"></div>
                <span className="text-xs">Connecting...</span>
              </div>
            ) : isConnected ? (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            ) : (
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            )}
          </div>
        </CardTitle>      </CardHeader>
      <CardContent>        {/* Connection Error */}
        {connectionError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between gap-2 text-red-500">
              <span className="text-sm">{connectionError}</span>
              {!isConnecting && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reconnect}
                  className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                >
                  Retry
                </Button>
              )}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Ask me any legal question... (e.g., 'How do I file an FIR?', 'What are my rights as a tenant?')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[100px] resize-none border-green-200 dark:border-green-800 focus:border-green-400 dark:focus:border-green-600"
            disabled={isConnecting}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Get instant legal guidance powered by AI. Not a substitute for professional advice.
            </p>
            <Button 
              type="submit" 
              disabled={!query.trim() || isConnecting || !isConnected} 
              className="bg-green-600 hover:bg-green-700"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </>
              ) : !isConnected ? (
                <>
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                  Offline
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Ask AI
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
