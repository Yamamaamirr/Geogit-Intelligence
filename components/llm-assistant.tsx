"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Sparkles, Check, X, Loader2, FileUp, Layers } from "lucide-react"
import type mapboxgl from "mapbox-gl"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LoadingIndicator } from "@/components/loading-indicator"
import { Badge } from "@/components/ui/badge"
import { ShapefileProcessor } from "@/components/shapefile-processor"
import { LayerSelector } from "@/components/ui/layer-selector"
import { toast } from "@/components/ui/use-toast"

interface LlmAssistantProps {
  projectName?: string
  datasets?: Array<{
    id: string
    name: string
    type: string
    format?: string
    visible: boolean
  }>
  map?: mapboxgl.Map | null
  projectId: string
 onAddDataset: (dataset: any) => void
}

export function LlmAssistant({ projectName = "", datasets = [], map = null,projectId,onAddDataset }: LlmAssistantProps) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello! I'm your GeoLLM assistant. How can I help with your ${projectName || "spatial data"} today? Type @ to select layers for processing.`,
    },
  ])
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showLayerSelector, setShowLayerSelector] = useState(false)
  const [selectedLayers, setSelectedLayers] = useState<Array<{ id: string; name: string }>>([])
  const [cursorPosition, setCursorPosition] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingResult, setProcessingResult] = useState<any>(null)
  const endOfMessagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const shapefileProcessorRef = useRef<ShapefileProcessor | null>(null)

  // Initialize the shapefile processor
  useEffect(() => {
    if (map) {
      shapefileProcessorRef.current = new ShapefileProcessor(
        map,
        (result) => {
          setProcessingResult(result)
          toast({
            title: "Processing complete",
            description: `Successfully processed ${result.geojson.features.length} features`,
          })
        },
        (error) => {
          toast({
            title: "Processing error",
            description: error.message,
            variant: "destructive",
          })
        },
        projectId ,
        onAddDataset,

      )
    }
  }, [map, projectId])

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

  // Monitor input for '@' character to trigger layer selector
  useEffect(() => {
    if (input.includes("@") && !showLayerSelector) {
      setShowLayerSelector(true)
    }
  }, [input, showLayerSelector])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    setCursorPosition(e.target.selectionStart || 0)
  }

  const toggleLayerSelection = (layer: { id: string; name: string }) => {
    setSelectedLayers((prev) => {
      const isSelected = prev.some((l) => l.id === layer.id)
      if (isSelected) {
        return prev.filter((l) => l.id !== layer.id)
      } else {
        return [...prev, layer]
      }
    })
  }

  const removeSelectedLayer = (layerId: string) => {
    setSelectedLayers((prev) => prev.filter((layer) => layer.id !== layerId))
  }

  const handleSend = async () => {
    if (!input.trim() && selectedLayers.length === 0) return

    // Add user message
    const userMessage = input.trim()
      ? input
      : `Process selected layers: ${selectedLayers.map((l) => l.name).join(", ")}`
    setMessages([...messages, { role: "user", content: userMessage }])
    setInput("")
    setShowLayerSelector(false)

    // Set processing state
    setIsProcessing(true)

    try {
      if (shapefileProcessorRef.current) {
        setIsUploading(true)
        setUploadProgress(0)

        // Set up progress updates
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90))
        }, 300)

        // Process the selected layers
        if (shapefileProcessorRef.current && map) {
          try {
            // Send the data to the backend
            const result = await shapefileProcessorRef.current.processLayers(selectedLayers, input.trim())

            clearInterval(progressInterval)
            setUploadProgress(100)

            // Add assistant response
            setTimeout(() => {
              setIsProcessing(false)
              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  content: `I've processed your request with the selected layers: ${selectedLayers
                    .map((l) => l.name)
                    .join(
                      ", ",
                    )}.\n\nA new layer has been created and added to your map. You can now visualize the results.`,
                },
              ])

              // Reset selected layers after processing
              setSelectedLayers([])
              setIsUploading(false)
            }, 1000)
          } catch (error) {
            clearInterval(progressInterval)
            console.error("Error processing layers:", error)
            setIsUploading(false)
            setIsProcessing(false)
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `I'm sorry, there was an error processing your request: ${
                  error instanceof Error ? error.message : "Unknown error"
                }. Please try again.`,
              },
            ])
          }
        } else {
          // If shapefile processor or map is not available
          setIsUploading(false)
          setIsProcessing(false)
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "I'm sorry, the map is not available for processing. Please try again later.",
            },
          ])
        }
      } 
    } catch (error) {
      console.error("Error in handleSend:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, there was an error processing your request. Please try again.",
        },
      ])
    } finally {
      setIsProcessing(false)
    }
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

            {isUploading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg p-2.5 bg-gradient-to-br from-[#2A2A32] to-[#2D2D38] text-white shadow-md">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <FileUp className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
                      <span className="text-xs">Uploading selected layers...</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1">
                      <div
                        className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {uploadProgress < 100 ? "Preparing data..." : "Processing..."}
                    </div>
                  </div>
                </div>
              </div>
            )}

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

      {/* Selected layers display */}
      {selectedLayers.length > 0 && (
        <div className="border-t border-border p-2 bg-zinc-900/50">
          <div className="flex items-center gap-1 mb-1">
            <Layers className="h-3 w-3 text-blue-400" />
            <span className="text-[10px] text-zinc-400">Selected layers:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedLayers.map((layer) => (
              <Badge key={layer.id} className="bg-blue-500/20 text-blue-400 text-[10px] flex items-center gap-1">
                {layer.name}
                <X className="h-3 w-3 cursor-pointer hover:text-white" onClick={() => removeSelectedLayer(layer.id)} />
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-border p-2 relative">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            placeholder={`Ask GeoLLM about ${projectName || "your data"}... (type @ to select layers)`}
            className="h-8 bg-[#22222A] text-xs pr-8"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend()
              if (e.key === "@") setShowLayerSelector(true)
            }}
            disabled={isProcessing || isUploading}
          />
          <Button
            size="icon"
            className="h-8 w-8 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
            onClick={handleSend}
            disabled={isProcessing || isUploading}
          >
            {isUploading || isProcessing ? (
              <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5 text-blue-400" />
            )}
          </Button>
        </div>

        {/* Layer selector dropdown */}
        {showLayerSelector && datasets.length > 0 && (
          <div className="absolute bottom-full left-0 w-full">
            <LayerSelector
              datasets={datasets}
              selectedLayers={selectedLayers}
              onSelectLayer={toggleLayerSelection}
              onClose={() => setShowLayerSelector(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
