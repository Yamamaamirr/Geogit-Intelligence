"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Sparkles, Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LoadingIndicator } from "@/components/loading-indicator"

interface LlmAssistantProps {
  projectName?: string
}

export function LlmAssistant({ projectName = "" }: LlmAssistantProps) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello! I'm your GeoLLM assistant. How can I help with your ${projectName || "spatial data"} today?`,
    },
  ])
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const endOfMessagesRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is updated before scrolling
    requestAnimationFrame(() => {
      scrollToBottom()
    })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    // Add user message
    setMessages([...messages, { role: "user", content: input }])
    setInput("")

    // Simulate LLM processing
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I've analyzed your request for the ${projectName || "project"}. This operation will create a new dataset with the following properties:\n\n• Source: Satellite Imagery 2023\n• Clip Boundary: Park Boundaries (vector)\n• Output Format: GeoTIFF\n• Resolution: Preserved from source\n\nWould you like me to proceed with this operation?`,
        },
      ])
    }, 5000) // Longer timeout to see the loading indicator in action
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#1A1A1E] to-[#1E1E26] relative">
      <div className="border-b border-border p-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-blue-400" />
          <h3 className="text-xs font-medium">GeoLLM Assistant</h3>
        </div>
      </div>

      {/* Main chat area with fixed height and scrolling */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="space-y-4 p-3">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg p-2.5 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gradient-to-br from-[#2A2A32] to-[#2D2D38] text-white shadow-md"
                  }`}
                >
                  <p className="whitespace-pre-line text-xs leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}

            <div ref={endOfMessagesRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Loading Indicator */}
      <LoadingIndicator isVisible={isProcessing} />

      {messages.length > 1 &&
        messages[messages.length - 2].role === "user" &&
        messages[messages.length - 1].role === "assistant" &&
        !isProcessing && (
          <div className="border-t border-border p-2">
            <div className="flex justify-center gap-2">
              <Button
                size="sm"
                className="h-7 px-3 bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700 border border-zinc-700 shadow-md"
              >
                <Check className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
                Accept
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-3 bg-black border-zinc-800 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300 shadow-md"
              >
                <X className="mr-1.5 h-3.5 w-3.5 text-zinc-500" />
                Reject
              </Button>
            </div>
          </div>
        )}

      <div className="border-t border-border p-2">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask GeoLLM about ${projectName || "your data"}...`}
            className="h-8 bg-[#22222A] text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend()
            }}
            disabled={isProcessing}
          />
          <Button
            size="icon"
            className="h-8 w-8 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
            onClick={handleSend}
            disabled={isProcessing}
          >
            <Send className="h-3.5 w-3.5 text-blue-400" />
          </Button>
        </div>
      </div>
    </div>
  )
}
