"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Pencil, Square, Circle, Trash2, MousePointer } from "lucide-react"
// @ts-ignore
import MapboxDraw from "@mapbox/mapbox-gl-draw"
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DrawingToolsProps {
  map: any | null
  onGeometryDrawn?: (geometry: GeoJSON.Feature | null) => void
  drawnGeometry?: GeoJSON.Feature | null
  leftOffset?: number // Offset from left edge to account for sidebar
}

export function DrawingTools({ map, onGeometryDrawn, drawnGeometry, leftOffset = 12 }: DrawingToolsProps) {
  const drawRef = useRef<MapboxDraw | null>(null)
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [hasGeometry, setHasGeometry] = useState(false)

  // Initialize draw control
  useEffect(() => {
    if (!map) return

    // Create draw control with custom styles
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      defaultMode: "simple_select",
      styles: [
        // Polygon fill
        {
          id: "gl-draw-polygon-fill",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
          paint: {
            "fill-color": "#3b82f6",
            "fill-outline-color": "#3b82f6",
            "fill-opacity": 0.2,
          },
        },
        // Polygon stroke
        {
          id: "gl-draw-polygon-stroke-active",
          type: "line",
          filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "#3b82f6",
            "line-dasharray": [0.2, 2],
            "line-width": 2,
          },
        },
        // Line
        {
          id: "gl-draw-line",
          type: "line",
          filter: ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"]],
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "#3b82f6",
            "line-dasharray": [0.2, 2],
            "line-width": 2,
          },
        },
        // Point
        {
          id: "gl-draw-point",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"], ["==", "meta", "feature"]],
          paint: {
            "circle-radius": 6,
            "circle-color": "#3b82f6",
          },
        },
        // Vertex
        {
          id: "gl-draw-polygon-and-line-vertex-active",
          type: "circle",
          filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
          paint: {
            "circle-radius": 5,
            "circle-color": "#fff",
            "circle-stroke-color": "#3b82f6",
            "circle-stroke-width": 2,
          },
        },
        // Midpoint
        {
          id: "gl-draw-polygon-midpoint",
          type: "circle",
          filter: ["all", ["==", "meta", "midpoint"], ["==", "$type", "Point"]],
          paint: {
            "circle-radius": 3,
            "circle-color": "#3b82f6",
          },
        },
      ],
    })

    // Add draw control to map
    map.addControl(draw, "top-left")
    drawRef.current = draw

    // Handle draw events
    const handleDrawCreate = (e: any) => {
      const features = draw.getAll()
      if (features.features.length > 0) {
        const feature = features.features[features.features.length - 1]
        setHasGeometry(true)
        onGeometryDrawn?.(feature as GeoJSON.Feature)
        console.log("✅ Geometry drawn:", feature)
      }
      setActiveTool(null)
    }

    const handleDrawUpdate = (e: any) => {
      const features = draw.getAll()
      if (features.features.length > 0) {
        const feature = features.features[features.features.length - 1]
        onGeometryDrawn?.(feature as GeoJSON.Feature)
      }
    }

    const handleDrawDelete = () => {
      setHasGeometry(false)
      onGeometryDrawn?.(null)
    }

    const handleDrawModeChange = (e: any) => {
      if (e.mode === "simple_select" || e.mode === "direct_select") {
        setActiveTool(null)
      }
    }

    map.on("draw.create", handleDrawCreate)
    map.on("draw.update", handleDrawUpdate)
    map.on("draw.delete", handleDrawDelete)
    map.on("draw.modechange", handleDrawModeChange)

    // Cleanup
    return () => {
      map.off("draw.create", handleDrawCreate)
      map.off("draw.update", handleDrawUpdate)
      map.off("draw.delete", handleDrawDelete)
      map.off("draw.modechange", handleDrawModeChange)
      if (drawRef.current) {
        try {
          map.removeControl(drawRef.current)
        } catch (e) {
          console.warn("Error removing draw control:", e)
        }
      }
    }
  }, [map, onGeometryDrawn])

  // Sync external drawnGeometry prop
  useEffect(() => {
    setHasGeometry(!!drawnGeometry)
  }, [drawnGeometry])

  const selectTool = (tool: string) => {
    if (!drawRef.current) return

    setActiveTool(tool)

    switch (tool) {
      case "polygon":
        drawRef.current.changeMode("draw_polygon")
        break
      case "rectangle":
        drawRef.current.changeMode("draw_polygon")
        break
      case "point":
        drawRef.current.changeMode("draw_point")
        break
      case "line":
        drawRef.current.changeMode("draw_line_string")
        break
      case "select":
        drawRef.current.changeMode("simple_select")
        break
    }
  }

  const clearDrawing = useCallback(() => {
    if (!drawRef.current) return
    drawRef.current.deleteAll()
    setHasGeometry(false)
    setActiveTool(null)
    onGeometryDrawn?.(null)
  }, [onGeometryDrawn])

  return (
    <div 
      className="absolute z-20 flex flex-col gap-0.5 bg-[#1A1A1E]/95 backdrop-blur-sm rounded-lg p-0.5 border border-zinc-700/50 shadow-lg"
      style={{ top: '17px', left: `${leftOffset}px` }}
    >
      <TooltipProvider>
        {/* Select Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${activeTool === "select" ? "bg-blue-500/20 text-blue-400" : ""}`}
              onClick={() => selectTool("select")}
            >
              <MousePointer className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-xs">Select</p>
          </TooltipContent>
        </Tooltip>

        {/* Polygon Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${activeTool === "polygon" ? "bg-blue-500/20 text-blue-400" : ""}`}
              onClick={() => selectTool("polygon")}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-xs">Draw Polygon</p>
          </TooltipContent>
        </Tooltip>

        {/* Rectangle Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${activeTool === "rectangle" ? "bg-blue-500/20 text-blue-400" : ""}`}
              onClick={() => selectTool("rectangle")}
            >
              <Square className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-xs">Draw Rectangle</p>
          </TooltipContent>
        </Tooltip>

        {/* Point Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${activeTool === "point" ? "bg-blue-500/20 text-blue-400" : ""}`}
              onClick={() => selectTool("point")}
            >
              <Circle className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-xs">Draw Point</p>
          </TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className="h-px bg-zinc-700/50 my-0.5" />

        {/* Clear Drawing */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${hasGeometry ? "text-red-400 hover:text-red-300" : "text-zinc-500"}`}
              onClick={clearDrawing}
              disabled={!hasGeometry}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-xs">Clear Drawing</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

