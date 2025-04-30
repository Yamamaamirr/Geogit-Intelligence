"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Sparkles, Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

// Sample chat history
const initialMessages = [
  {
    role: "assistant",
    content: "Hello! I'm your GeoLLM assistant. How can I help with your spatial data today?",
  },
]

export function LlmAssistant() {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const endOfMessagesRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
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
          content:
            "I've analyzed your request to clip the raster to the park boundary. This operation will create a new dataset with the following properties:\n\n• Source: Satellite Imagery 2023\n• Clip Boundary: Park Boundaries (vector)\n• Output Format: GeoTIFF\n• Resolution: Preserved from source\n\nWould you like me to proceed with this operation?",
        },
      ])
    }, 2000)
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#1A1A1E] to-[#1E1E26]">
      <div className="border-b border-border p-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <h3 className="text-xs font-medium">GeoLLM Assistant</h3>
        </div>
      </div>

      <ScrollArea className="flex-1 p-3" ref={scrollAreaRef}>
        <div className="space-y-4">
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

          {isProcessing && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg bg-gradient-to-br from-[#2A2A32] to-[#2D2D38] p-3 shadow-md">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400"></div>
                  <div
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                  <span className="text-[10px] text-muted-foreground">GeoLLM is processing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>
      </ScrollArea>

      {messages.length > 0 && messages[messages.length - 1].role === "assistant" && !isProcessing && (
        <div className="border-t border-border p-2">
          <div className="flex justify-center gap-2">
            <Button
              size="sm"
              className="h-8 bg-[#1E3A1E] text-xs text-green-400 hover:bg-[#254325] hover:text-green-300"
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Accept Changes
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-[#3A1E1E] bg-[#3A1E1E]/50 text-xs text-red-400 hover:bg-[#3A1E1E] hover:text-red-300"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
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
            placeholder="Ask GeoLLM to process your data..."
            className="h-8 bg-[#22222A] text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend()
            }}
          />
          <Button
            size="icon"
            className="h-8 w-8 bg-purple-600 hover:bg-purple-700"
            onClick={handleSend}
            disabled={isProcessing}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
