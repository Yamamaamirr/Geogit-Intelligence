"use client"

import { useState } from "react"
import { Layers, Plus, Minus, SplitSquareVertical, Fullscreen, MapIcon } from "lucide-react"
import type mapboxgl from "mapbox-gl"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MapToolbarProps {
  map: mapboxgl.Map
  onCompareClick: () => void
}

export function MapToolbar({ map, onCompareClick }: MapToolbarProps) {
  const [opacity, setOpacity] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [baseMap, setBaseMap] = useState("light")

  // Base map styles
  const baseMapStyles = {
    light: "mapbox://styles/mapbox/light-v11",
    dark: "mapbox://styles/mapbox/dark-v11",
    satellite: "mapbox://styles/mapbox/satellite-streets-v12",
    streets: "mapbox://styles/mapbox/streets-v12",
  }

  const handleZoomIn = () => {
    if (map) {
      map.zoomIn()
    }
  }

  const handleZoomOut = () => {
    if (map) {
      map.zoomOut()
    }
  }

  const handleOpacityChange = (value: number[]) => {
    setOpacity(value[0])

    // Apply opacity to the top layer if available
    if (map && map.isStyleLoaded()) {
      const layers = map.getStyle().layers || []
      const topLayer = layers.find((layer) => layer.type === "fill" || layer.type === "line" || layer.type === "symbol")

      if (topLayer) {
        const opacity = value[0] / 100
        if (topLayer.type === "fill") {
          map.setPaintProperty(topLayer.id, "fill-opacity", opacity)
        } else if (topLayer.type === "line") {
          map.setPaintProperty(topLayer.id, "line-opacity", opacity)
        } else if (topLayer.type === "symbol") {
          map.setPaintProperty(topLayer.id, "icon-opacity", opacity)
          map.setPaintProperty(topLayer.id, "text-opacity", opacity)
        }
      }
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

  const changeBaseMap = (style: string) => {
    setBaseMap(style)
    map.setStyle(baseMapStyles[style as keyof typeof baseMapStyles])
  }

  return (
    <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 transform flex flex-row gap-1 rounded-lg border border-border bg-[#1A1A1E]/90 p-1.5 shadow-lg backdrop-blur-sm">
      <TooltipProvider>
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#2A2A2D]">
                  <Layers className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>Layer Controls</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent side="top" className="w-64 p-3">
            <div className="space-y-3">
              <h3 className="text-xs font-medium">Layer Controls</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Building Footprints</span>
                  <Button variant="outline" size="sm" className="h-6 text-xs">
                    Visible
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Satellite Imagery</span>
                  <Button variant="outline" size="sm" className="h-6 text-xs">
                    Visible
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Road Network</span>
                  <Button variant="outline" size="sm" className="h-6 text-xs">
                    Hidden
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#2A2A2D]">
                  <MapIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>Base Map</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent side="top" className="w-64 p-3">
            <div className="space-y-3">
              <h3 className="text-xs font-medium">Base Map Style</h3>
              <Select value={baseMap} onValueChange={changeBaseMap}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
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
              className="relative h-8 w-8 overflow-hidden hover:bg-[#2A2A2D]"
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
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#2A2A2D]" onClick={handleZoomIn}>
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>Zoom In</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#2A2A2D]" onClick={handleZoomOut}>
              <Minus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>Zoom Out</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#2A2A2D]" onClick={toggleFullscreen}>
              <Fullscreen className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>{isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}</p>
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-1.5 px-1.5">
          <p className="text-xs text-muted-foreground">Opacity</p>
          <Slider value={[opacity]} max={100} step={1} className="w-20" onValueChange={handleOpacityChange} />
        </div>
      </TooltipProvider>
    </div>
  )
}
