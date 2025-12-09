"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, FileText, ImageIcon, Database, Maximize2, Palette, ChevronDown, BarChart3 } from "lucide-react"
// @ts-ignore - mapbox-gl types
import mapboxgl from "mapbox-gl"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"

interface Dataset {
  id: string
  name: string
  type: string
  format?: string
  crs?: string
  status?: string
  visible: boolean
  versions?: string[]
  bounding_box?: { minx: string; miny: string; maxx: string; maxy: string }
  color?: string
  opacity?: number
  mapbox_url?: string
  layer_name?: string
  // Analysis metadata
  analysis_type?: "lulc" | "uhi"
  label_percentages?: Record<string, number>
  legend?: any[]
  stats?: any[]
  date_range?: string
  year_range?: string
}

interface DatasetInspectorProps {
  datasets?: Dataset[]
  map?: mapboxgl.Map | null
  onUpdateDataset?: (id: string, updates: Partial<Dataset>) => void
  onShowAnalysisMetadata?: (dataset: Dataset) => void
}

const LAYER_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
]

export function DatasetInspector({ datasets = [], map = null, onUpdateDataset, onShowAnalysisMetadata }: DatasetInspectorProps) {
  const [expandedDataset, setExpandedDataset] = useState<string | null>(null)
  const [localDatasets, setLocalDatasets] = useState<Dataset[]>([])

  // Sync with parent datasets prop
  useEffect(() => {
    if (datasets.length > 0) {
      setLocalDatasets(
        datasets.map((d) => ({
          ...d,
          format: d.format || (d.type === "vector" ? "GeoJSON" : "GeoTIFF"),
          crs: d.crs || "EPSG:4326",
          status: d.status || "unchanged",
          versions: d.versions || ["v1.0"],
          color: d.color || "#3b82f6",
          opacity: d.opacity ?? 0.8,
        }))
      )
    }
  }, [datasets])

  const toggleDatasetExpand = (id: string) => {
    setExpandedDataset(expandedDataset === id ? null : id)
  }

  // Toggle visibility of layer on map
  const toggleVisibility = (id: string) => {
    const dataset = localDatasets.find((d) => d.id === id)
    if (!dataset) return

    const newVisibility = !dataset.visible

    // Update local state
    setLocalDatasets((prev) =>
      prev.map((d) => (d.id === id ? { ...d, visible: newVisibility } : d))
    )

    // Notify parent
    onUpdateDataset?.(id, { visible: newVisibility })

    // Update map layers
    if (map && map.loaded()) {
      const visibilityValue = newVisibility ? "visible" : "none"
      const possibleLayerIds = [
        id,
        `${id}-lines`,
        `${id}-points`,
        `source-${id}`,
      ]

      possibleLayerIds.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", visibilityValue)
          console.log(`Set visibility of layer ${layerId} to ${visibilityValue}`)
        }
      })
    }
  }

  // Fit map to layer bounds
  const fitToBounds = (dataset: Dataset) => {
    if (!map) return

    // If we have bounding_box from API response
    if (dataset.bounding_box) {
      const { minx, miny, maxx, maxy } = dataset.bounding_box
      const bounds = new mapboxgl.LngLatBounds(
        [parseFloat(minx), parseFloat(miny)],
        [parseFloat(maxx), parseFloat(maxy)]
      )
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50, duration: 1000, maxZoom: 15 })
        return
      }
    }

    // Note: All vector data now uses GeoServer tiles with bounding_box from API
    console.warn("No bounding_box available for dataset:", dataset.name)
  }

  // Change layer color - requires reloading WMS layer with SLD style
  const changeLayerColor = (id: string, color: string) => {
    const dataset = localDatasets.find((d) => d.id === id)
    if (!dataset) return

    setLocalDatasets((prev) =>
      prev.map((d) => (d.id === id ? { ...d, color } : d))
    )
    onUpdateDataset?.(id, { color })

    if (map && map.loaded() && dataset.mapbox_url) {
      const sourceId = `source-${id}`
      const layerId = id

      // Remove existing layer and source
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId)
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId)
      }

      // Create SLD style for custom color
      const hexColor = color.replace("#", "")
      const sldBody = encodeURIComponent(`<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld">
  <NamedLayer>
    <Name>${dataset.layer_name || id}</Name>
    <UserStyle>
      <FeatureTypeStyle>
        <Rule>
          <PolygonSymbolizer>
            <Fill><CssParameter name="fill">#${hexColor}</CssParameter><CssParameter name="fill-opacity">0.6</CssParameter></Fill>
            <Stroke><CssParameter name="stroke">#${hexColor}</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke>
          </PolygonSymbolizer>
          <LineSymbolizer>
            <Stroke><CssParameter name="stroke">#${hexColor}</CssParameter><CssParameter name="stroke-width">2</CssParameter></Stroke>
          </LineSymbolizer>
          <PointSymbolizer>
            <Graphic><Mark><WellKnownName>circle</WellKnownName><Fill><CssParameter name="fill">#${hexColor}</CssParameter></Fill></Mark><Size>8</Size></Graphic>
          </PointSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`)

      // Modify the mapbox_url to include SLD_BODY
      const baseUrl = dataset.mapbox_url.split("&styles=")[0]
      const newUrl = `${baseUrl}&SLD_BODY=${sldBody}&styles=`

      // Re-add source and layer with new styling
      map.addSource(sourceId, {
        type: "raster",
        tiles: [newUrl],
        tileSize: 256,
      })

      map.addLayer({
        id: layerId,
        type: "raster",
        source: sourceId,
        paint: {
          "raster-opacity": dataset.opacity ?? 0.85,
          "raster-fade-duration": 0,
        },
      })

      console.log(`✅ Layer ${dataset.name} color changed to ${color}`)
    }
  }

  // Change layer opacity - ALL layers are WMS raster tiles from GeoServer
  const changeLayerOpacity = (id: string, opacity: number) => {
    setLocalDatasets((prev) =>
      prev.map((d) => (d.id === id ? { ...d, opacity } : d))
    )
    onUpdateDataset?.(id, { opacity })

    if (map && map.loaded()) {
      // All layers (vector and raster) are served as WMS raster tiles
      // So we always use raster-opacity
      if (map.getLayer(id)) {
        try {
          map.setPaintProperty(id, "raster-opacity", opacity)
          console.log(`✅ Set opacity of layer ${id} to ${opacity}`)
        } catch (e) {
          console.error(`Failed to set opacity for layer ${id}:`, e)
        }
      }
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Database className="h-4 w-4 text-blue-400 mr-2" />
            <h3 className="text-xs font-medium">Project Datasets</h3>
          </div>
          <Badge className="bg-blue-500/20 text-[10px] text-blue-400 px-1.5 h-5">{localDatasets.length}</Badge>
        </div>
      </div>

      {localDatasets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <Database className="h-10 w-10 text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500 mb-1">No datasets available</p>
          <p className="text-xs text-zinc-600 mb-4">Add datasets to your project using the Add Dataset button</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {localDatasets.map((dataset) => (
              <Collapsible
                key={dataset.id}
                open={expandedDataset === dataset.id}
                onOpenChange={() => toggleDatasetExpand(dataset.id)}
              >
                <div className="rounded-md p-2 hover:bg-[#22222A] border border-transparent hover:border-zinc-700/50">
                  <CollapsibleTrigger className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: dataset.color || "#3b82f6" }}
                      />
                      {dataset.type === "vector" ? (
                        <FileText className="h-3.5 w-3.5 text-blue-400" />
                      ) : (
                        <ImageIcon className="h-3.5 w-3.5 text-green-400" />
                      )}
                      <span className="text-xs font-medium truncate max-w-[120px]">{dataset.name}</span>
                      {dataset.status === "new" && (
                        <span className="ml-1 rounded-full bg-green-500/20 px-1.5 py-0.5 text-[9px] text-green-400">
                          new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleVisibility(dataset.id)
                              }}
                            >
                              {dataset.visible ? (
                                <Eye className="h-3.5 w-3.5 text-blue-400" />
                              ) : (
                                <EyeOff className="h-3.5 w-3.5 text-zinc-500" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            {dataset.visible ? "Hide Layer" : "Show Layer"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="mt-2 space-y-2">
                    {/* Layer Controls */}
                    <div className="flex items-center gap-1 p-1 bg-[#1A1A1E] rounded-md">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => fitToBounds(dataset)}
                            >
                              <Maximize2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            Fit to Bounds
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Analysis Stats Button - only for LULC/UHI datasets */}
                      {dataset.analysis_type && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => onShowAnalysisMetadata?.(dataset)}
                              >
                                <BarChart3 className={`h-3.5 w-3.5 ${dataset.analysis_type === 'lulc' ? 'text-green-400' : 'text-orange-400'}`} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {dataset.analysis_type === 'lulc' ? 'View LULC Stats' : 'View UHI Stats'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {/* Color Picker */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Palette className="h-3.5 w-3.5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2 bg-zinc-900 border-zinc-700">
                          <div className="grid grid-cols-4 gap-1">
                            {LAYER_COLORS.map((color) => (
                              <button
                                key={color}
                                className={`w-6 h-6 rounded-md border-2 ${
                                  dataset.color === color ? "border-white" : "border-transparent"
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() => changeLayerColor(dataset.id, color)}
                              />
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>

                      {/* Opacity Slider */}
                      <div className="flex-1 px-2">
                        <Slider
                          value={[dataset.opacity ?? 0.8]}
                          min={0}
                          max={1}
                          step={0.1}
                          className="w-full"
                          onValueChange={([value]) => changeLayerOpacity(dataset.id, value)}
                        />
                      </div>
                    </div>

                    {/* Dataset Info */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-md bg-[#1A1A1E] p-2 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span>{dataset.type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Format:</span>
                        <span>{dataset.format}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">CRS:</span>
                        <span>{dataset.crs}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Opacity:</span>
                        <span>{Math.round((dataset.opacity ?? 0.8) * 100)}%</span>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

