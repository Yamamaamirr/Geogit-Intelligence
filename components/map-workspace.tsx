"use client"

import { useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  GitPullRequest,
  Layers,
  MessageSquare,
  Settings,
} from "lucide-react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VersionControl } from "@/components/version-control"
import { LlmAssistant } from "@/components/llm-assistant"
import { DatasetInspector } from "@/components/dataset-inspector"
import { MapToolbar } from "@/components/map-toolbar"
import { ComparisonView } from "@/components/comparison-view"

// Sample project data
const projectData = {
  id: "1",
  name: "Urban Development Analysis",
  description: "Tracking city growth patterns over 10 years",
  currentBranch: "main",
}

// Set Mapbox access token globally
mapboxgl.accessToken =
  "pk.eyJ1IjoibXlhbWFtYWJlMjFpZ2lzIiwiYSI6ImNtYTJ3a2diNzE2OXoyanNmOGdyZGQ2djAifQ.8nkeh0-v5gJLVQbtgwxNWQ"

interface MapWorkspaceProps {
  projectId: string
}

export function MapWorkspace({ projectId }: MapWorkspaceProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)
  const [showComparison, setShowComparison] = useState(false)

  // Initialize map when component mounts
  useEffect(() => {
    let mapInstance: mapboxgl.Map | null = null

    // Wait for the container to be available
    if (!mapContainerRef.current) return

    try {
      // Create a new map instance
      mapInstance = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/light-v11", // Changed to light theme
        center: [-74.5, 40],
        zoom: 9,
        attributionControl: false, // Remove attribution control
        preserveDrawingBuffer: true,
      })

      // Add scale control only (no navigation control)
      mapInstance.addControl(new mapboxgl.ScaleControl(), "bottom-left")

      // Wait for the map to load
      mapInstance.on("load", () => {
        console.log("Map loaded successfully")
        setMap(mapInstance)
      })

      // Handle errors
      mapInstance.on("error", (e) => {
        console.error("Map error:", e)
      })
    } catch (error) {
      console.error("Error initializing map:", error)
    }

    // Clean up on unmount
    return () => {
      try {
        if (mapInstance && mapInstance.getCanvas()) {
          mapInstance.remove()
        }
      } catch (error) {
        console.error("Error removing map:", error)
      }
    }
  }, [projectId])

  const toggleLeftPanel = () => {
    setLeftPanelCollapsed(!leftPanelCollapsed)
  }

  const toggleRightPanel = () => {
    setRightPanelCollapsed(!rightPanelCollapsed)
  }

  const toggleComparisonView = () => {
    setShowComparison(!showComparison)
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="relative z-30 flex h-12 items-center justify-between border-b border-border bg-[#1A1A1E] px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="mr-2 h-8 w-8 p-0" asChild>
            <a href="/">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to repositories</span>
            </a>
          </Button>
          <h1 className="text-base font-semibold">{projectData.name}</h1>
          <div className="flex items-center gap-1.5 rounded-md bg-[#2A2A2D] px-2 py-1 text-xs">
            <GitBranch className="h-3.5 w-3.5 text-blue-400" />
            <span>{projectData.currentBranch}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <GitPullRequest className="mr-1.5 h-3.5 w-3.5" />
            Create PR
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main workspace - Map as full background */}
      <div className="relative flex-1">
        {/* Map container - Full size background */}
        <div className="absolute inset-0 z-0">
          <div ref={mapContainerRef} className="h-full w-full" />
        </div>

        {/* Workspace content overlaid on map */}
        <div className="relative z-10 flex h-full">
          {/* Left sidebar - Version control */}
          <div
            className={`h-full flex-col border-r border-border bg-[#1A1A1E]/95 backdrop-blur-sm transition-all duration-300 ${
              leftPanelCollapsed ? "w-0" : "w-80"
            }`}
          >
            {!leftPanelCollapsed && (
              <>
                <div className="flex-1 overflow-hidden">
                  <VersionControl onCompareVersions={toggleComparisonView} />
                </div>
              </>
            )}
            <div
              onClick={toggleLeftPanel}
              className={`absolute -right-8 top-1/2 z-20 flex h-10 w-8 -translate-y-1/2 transform cursor-pointer items-center justify-center rounded-r-md border border-border border-l-0 bg-[#2A2A2D]/90 shadow-md transition-all hover:bg-[#3A3A3D]`}
            >
              <ChevronLeft className={`h-5 w-5 transition-transform ${leftPanelCollapsed ? "-rotate-180" : ""}`} />
            </div>
          </div>

          {/* Right sidebar - LLM Assistant & Metadata */}
          <div
            className={`ml-auto h-full flex-col border-l border-border bg-[#1A1A1E]/95 backdrop-blur-sm transition-all duration-300 ${
              rightPanelCollapsed ? "w-0" : "w-80"
            }`}
          >
            {!rightPanelCollapsed && (
              <Tabs defaultValue="assistant" className="h-full">
                <TabsList className="grid w-full grid-cols-2 rounded-none border-b border-border bg-transparent p-0">
                  <TabsTrigger
                    value="assistant"
                    className="rounded-none border-b-2 border-transparent py-2.5 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                    <span className="text-xs">Assistant</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="datasets"
                    className="rounded-none border-b-2 border-transparent py-2.5 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <Layers className="mr-1.5 h-3.5 w-3.5" />
                    <span className="text-xs">Datasets</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="assistant" className="h-[calc(100%-41px)] p-0">
                  <LlmAssistant />
                </TabsContent>
                <TabsContent value="datasets" className="h-[calc(100%-41px)] p-0">
                  <DatasetInspector />
                </TabsContent>
              </Tabs>
            )}
            <div
              onClick={toggleRightPanel}
              className={`absolute -left-8 top-1/2 z-20 flex h-10 w-8 -translate-y-1/2 transform cursor-pointer items-center justify-center rounded-l-md border border-border border-r-0 bg-[#2A2A2D]/90 shadow-md transition-all hover:bg-[#3A3A3D]`}
            >
              <ChevronRight className={`h-5 w-5 transition-transform ${rightPanelCollapsed ? "rotate-180" : ""}`} />
            </div>
          </div>
        </div>

        {/* Map toolbar */}
        {map && <MapToolbar map={map} onCompareClick={toggleComparisonView} />}

        {/* Comparison view */}
        {showComparison && <ComparisonView onClose={toggleComparisonView} />}
      </div>
    </div>
  )
}
