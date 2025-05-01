"use client"

import { useState } from "react"
import { Layers, Plus, Minus, SplitSquareVertical, Fullscreen, MapIcon } from "lucide-react"
import type mapboxgl from "mapbox-gl"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface MapToolbarProps {
  map: mapboxgl.Map
  onCompareClick: () => void
}

export function MapToolbar({ map, onCompareClick }: MapToolbarProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [baseMap, setBaseMap] = useState("custom")
  const [layerVisibility, setLayerVisibility] = useState({
    buildings: true,
    satellite: true,
    roads: false,
    terrain: false,
    labels: true,
  })

  // Base map styles
  const baseMapStyles = {
    custom: "mapbox://styles/myamamabe21igis/cma4e0v7e003401qo4d8ohre2",
    light: "mapbox://styles/mapbox/light-v11",
    dark: "mapbox://styles/mapbox/dark-v11",
    satellite: "mapbox://styles/mapbox/satellite-streets-v12",
    streets: "mapbox://styles/mapbox/streets-v12",
  }

  const handleZoomIn = () => {
    if (map) {
      map.zoomIn({ duration: 300 })
    }
  }

  const handleZoomOut = () => {
    if (map) {
      map.zoomOut({ duration: 300 })
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Update the changeBaseMap function to properly handle the filter property
  const changeBaseMap = (style: string) => {
    if (!map) return

    // Store current sources and layers before changing style
    const customSourcesAndLayers: {
      sources: { [key: string]: any }
      layers: Array<{ id: string; source: string; type: string; paint?: any; layout?: any; filter?: any }>
    } = {
      sources: {},
      layers: [],
    }

    // Get all sources that aren't part of the default style (custom sources)
    const sources = map.getStyle().sources
    Object.keys(sources).forEach((sourceId) => {
      // Skip mapbox sources and composite sources which are part of the base style
      if (!sourceId.startsWith("mapbox") && sourceId !== "composite") {
        customSourcesAndLayers.sources[sourceId] = sources[sourceId]
      }
    })

    // Get all layers that use our custom sources
    map.getStyle().layers.forEach((layer) => {
      if (layer.source && customSourcesAndLayers.sources[layer.source]) {
        // Create a clean layer configuration, only including properties that exist
        const layerConfig: any = {
          id: layer.id,
          source: layer.source,
          type: layer.type,
        }

        // Only include paint if it exists
        if (layer["paint"]) {
          layerConfig.paint = layer["paint"]
        }

        // Only include layout if it exists
        if (layer["layout"]) {
          layerConfig.layout = layer["layout"]
        }

        // Only include filter if it exists AND is an array
        if (layer["filter"] && Array.isArray(layer["filter"])) {
          layerConfig.filter = layer["filter"]
        }

        // Store the clean layer configuration
        customSourcesAndLayers.layers.push(layerConfig)
      }
    })

    // Update state
    setBaseMap(style)

    // Apply the new style
    map.setStyle(baseMapStyles[style as keyof typeof baseMapStyles])

    // After the style is loaded, re-add our custom sources and layers
    map.once("style.load", () => {
      try {
        // Re-add sources
        Object.keys(customSourcesAndLayers.sources).forEach((sourceId) => {
          if (!map.getSource(sourceId)) {
            try {
              map.addSource(sourceId, customSourcesAndLayers.sources[sourceId])
            } catch (error) {
              console.warn(`Error re-adding source ${sourceId}:`, error)
            }
          }
        })

        // Re-add layers
        customSourcesAndLayers.layers.forEach((layer) => {
          if (!map.getLayer(layer.id)) {
            try {
              map.addLayer(layer)
            } catch (error) {
              console.warn(`Error re-adding layer ${layer.id}:`, error)
            }
          }
        })
      } catch (error) {
        console.error("Error restoring custom layers after style change:", error)
      }
    })
  }

  const toggleLayerVisibility = (layerId: string) => {
    // Update state
    setLayerVisibility((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }))

    // Update map if available
    if (map && map.isStyleLoaded()) {
      // Map layer IDs would be different in a real implementation
      // This is a simplified example
      const mapLayerId = {
        buildings: "building",
        satellite: "satellite",
        roads: "road",
        terrain: "terrain",
        labels: "labels",
      }[layerId]

      if (mapLayerId) {
        const visibility = !layerVisibility[layerId] ? "visible" : "none"
        try {
          map.setLayoutProperty(mapLayerId, "visibility", visibility)
        } catch (error) {
          console.log(`Layer ${mapLayerId} might not exist in current style`)
        }
      }
    }
  }

  return (
    <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 transform flex flex-row gap-1 rounded-lg border border-border bg-[#1A1A1E]/90 p-1.5 shadow-lg backdrop-blur-sm pointer-events-auto">
      <TooltipProvider>
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-[#2A2A2D] transition-colors duration-200 relative group"
                >
                  <Layers className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center bg-blue-500 text-[10px] text-white rounded-full">
                    {Object.values(layerVisibility).filter(Boolean).length}
                  </span>
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>Layer Controls</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent
            side="top"
            align="center"
            alignOffset={-40}
            className="w-48 p-0 bg-zinc-900 border-zinc-800 shadow-xl layer-controls-popover mb-2"
          >
            <div className="p-2 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-xs font-medium flex items-center">
                <Layers className="h-3 w-3 mr-1.5 text-blue-400" />
                Layer Controls
              </h3>
              <Badge className="bg-blue-500/20 text-[9px] text-blue-400 px-1 h-4">
                {Object.values(layerVisibility).filter(Boolean).length}
              </Badge>
            </div>

            <div className="p-2 space-y-1 max-h-[200px] overflow-y-auto">
              {[
                { id: "buildings", name: "Building Footprints" },
                { id: "satellite", name: "Satellite Imagery" },
                { id: "roads", name: "Road Network" },
                { id: "terrain", name: "Terrain" },
                { id: "labels", name: "Map Labels" },
              ].map((layer) => (
                <div
                  key={layer.id}
                  className="flex items-center space-x-2 rounded-md p-1 hover:bg-zinc-800/50 transition-colors"
                >
                  <Checkbox
                    id={`layer-${layer.id}`}
                    checked={layerVisibility[layer.id as keyof typeof layerVisibility]}
                    onCheckedChange={() => toggleLayerVisibility(layer.id)}
                    className="h-3.5 w-3.5 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  />
                  <Label htmlFor={`layer-${layer.id}`} className="text-xs cursor-pointer flex-1">
                    {layer.name}
                  </Label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-[#2A2A2D] transition-colors duration-200"
                >
                  <MapIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>Base Map</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent side="top" align="center" alignOffset={-40} className="w-48 p-3 mb-2">
            <div className="space-y-3">
              <h3 className="text-xs font-medium">Base Map Style</h3>
              <Select value={baseMap} onValueChange={changeBaseMap}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom" className="text-xs">
                    Overcast
                  </SelectItem>
                  <SelectItem value="light" className="text-xs">
                    Light
                  </SelectItem>
                  <SelectItem value="dark" className="text-xs">
                    Dark
                  </SelectItem>
                  <SelectItem value="satellite" className="text-xs">
                    Satellite
                  </SelectItem>
                  <SelectItem value="streets" className="text-xs">
                    Streets
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 overflow-hidden hover:bg-[#2A2A2D] transition-colors duration-200"
              onClick={onCompareClick}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute left-0 top-0 h-full w-1/2 bg-blue-500/20"></div>
                <SplitSquareVertical className="relative z-10 h-4 w-4" />
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>Compare Versions</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-[#2A2A2D] transition-colors duration-200"
              onClick={handleZoomIn}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>Zoom In</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-[#2A2A2D] transition-colors duration-200"
              onClick={handleZoomOut}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>Zoom Out</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-[#2A2A2D] transition-colors duration-200"
              onClick={toggleFullscreen}
            >
              <Fullscreen className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>{isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
