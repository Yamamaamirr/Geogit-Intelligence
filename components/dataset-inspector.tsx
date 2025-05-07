"use client"

import { useState } from "react"
import { Eye, EyeOff, FileText, ImageIcon, Database } from "lucide-react"
import type mapboxgl from "mapbox-gl"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"

interface Dataset {
  id: string
  name: string
  type: string
  format?: string
  crs?: string
  status?: string
  visible: boolean
  versions?: string[]
}

interface DatasetInspectorProps {
  datasets?: Dataset[]
  map?: mapboxgl.Map | null
}

export function DatasetInspector({ datasets = [], map = null }: DatasetInspectorProps) {
  const [expandedDataset, setExpandedDataset] = useState<string | null>(null)
  const [datasetList, setDatasetList] = useState<Dataset[]>(
    datasets.length > 0
      ? datasets.map((d) => ({
          ...d,
          format: d.format || (d.type === "vector" ? "GeoJSON" : "GeoTIFF"),
          crs: d.crs || "EPSG:4326",
          status: d.status || "unchanged",
          versions: d.versions || ["v1.0"],
        }))
      : [
          {
            id: "d1",
            name: "Building Footprints",
            type: "vector",
            format: "GeoJSON",
            crs: "EPSG:4326",
            status: "modified",
            visible: true,
            versions: ["v1.2", "v1.1", "v1.0"],
          },
          {
            id: "d2",
            name: "Satellite Imagery 2023",
            type: "raster",
            format: "GeoTIFF",
            crs: "EPSG:3857",
            status: "unchanged",
            visible: true,
            versions: ["v2.0", "v1.0"],
          },
          {
            id: "d3",
            name: "Road Network",
            type: "vector",
            format: "Shapefile",
            crs: "EPSG:4326",
            status: "unchanged",
            visible: true,
            versions: ["v1.0"],
          },
        ],
  )

  const toggleDatasetExpand = (id: string) => {
    setExpandedDataset(expandedDataset === id ? null : id)
  }

  // Enhance the toggleVisibility function to better handle different layer types and naming patterns
  const toggleVisibility = (id: string) => {
    // Update local state first
    setDatasetList(
      datasetList.map((dataset) => (dataset.id === id ? { ...dataset, visible: !dataset.visible } : dataset)),
    )

    // Only attempt to update map if it exists and is loaded
    if (map && map.loaded()) {
      try {
        const currentVisibility = datasetList.find((d) => d.id === id)?.visible
        const newVisibility = currentVisibility ? "none" : "visible"

        // Get the dataset to determine its type
        const dataset = datasetList.find((d) => d.id === id)
        const isRaster = dataset?.type === "raster"

        // List of possible layer IDs to check
        const possibleLayerIds = [
          id, // Direct ID match
          `${id}-lines`, // Vector lines layer
          `${id}-points`, // Vector points layer
          `layer-${id}`, // Alternative layer naming
          `raster-layer-${id}`, // Legacy raster layer naming
        ]

        // Track if we found any layers to update
        let foundLayers = false

        // Try to update each possible layer
        possibleLayerIds.forEach((layerId) => {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, "visibility", newVisibility)
            console.log(`Set visibility of layer ${layerId} to ${newVisibility}`)
            foundLayers = true
          }
        })

        // If no layers were found, log and trigger update
        if (!foundLayers) {
          console.log(`No layers found for dataset ${id}. Possible layer IDs checked:`, possibleLayerIds)

          // If the layer doesn't exist, it might have been removed during a style change
          // We should trigger the parent component to re-add it
          if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent("map-layers-update-needed"))
          }
        }
      } catch (error) {
        console.warn(`Could not toggle visibility for layer ${id}:`, error)
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
          <Badge className="bg-blue-500/20 text-[10px] text-blue-400 px-1.5 h-5">{datasetList.length}</Badge>
        </div>
      </div>

      {datasetList.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <Database className="h-10 w-10 text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500 mb-1">No datasets available</p>
          <p className="text-xs text-zinc-600 mb-4">Add datasets to your project using the Add Dataset button</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {datasetList.map((dataset) => (
              <Collapsible
                key={dataset.id}
                open={expandedDataset === dataset.id}
                onOpenChange={() => toggleDatasetExpand(dataset.id)}
              >
                <div className="rounded-md p-2 hover:bg-[#22222A]">
                  <CollapsibleTrigger className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {dataset.type === "vector" ? (
                        <FileText className="h-3.5 w-3.5 text-blue-400" />
                      ) : (
                        <ImageIcon className="h-3.5 w-3.5 text-green-400" />
                      )}
                      <span className="text-xs font-medium">{dataset.name}</span>
                      {dataset.status === "modified" && (
                        <span className="ml-1.5 rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[9px] text-blue-400">
                          modified
                        </span>
                      )}
                      {dataset.status === "new" && (
                        <span className="ml-1.5 rounded-full bg-green-500/20 px-1.5 py-0.5 text-[9px] text-green-400">
                          new
                        </span>
                      )}
                    </div>
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
                            {dataset.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="text-xs">
                          <p>{dataset.visible ? "Hide Layer" : "Show Layer"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="mt-2 space-y-2">
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
                        <span className="text-muted-foreground">Versions:</span>
                        <span>{dataset.versions?.length || 0}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium">Version History</span>
                        <Button variant="link" size="sm" className="h-6 p-0 text-[10px] text-blue-400">
                          View All
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {dataset.versions?.slice(0, 2).map((version, index) => (
                          <div
                            key={version}
                            className="flex items-center justify-between rounded-md bg-[#22222A] px-2 py-1.5"
                          >
                            <span className="text-[10px]">{version}</span>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[9px]">
                                View
                              </Button>
                              <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[9px]">
                                Compare
                              </Button>
                            </div>
                          </div>
                        ))}
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
