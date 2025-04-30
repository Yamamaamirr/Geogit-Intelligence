"use client"

import { useState } from "react"
import { Eye, EyeOff, FileText, ImageIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Sample dataset data
const datasets = [
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
  {
    id: "d4",
    name: "Land Use Zones",
    type: "vector",
    format: "GeoJSON",
    crs: "EPSG:4326",
    status: "modified",
    visible: false,
    versions: ["v2.1", "v2.0", "v1.0"],
  },
  {
    id: "d5",
    name: "Elevation Model",
    type: "raster",
    format: "GeoTIFF",
    crs: "EPSG:3857",
    status: "unchanged",
    visible: false,
    versions: ["v1.0"],
  },
]

export function DatasetInspector() {
  const [expandedDataset, setExpandedDataset] = useState<string | null>(null)

  const toggleDatasetExpand = (id: string) => {
    setExpandedDataset(expandedDataset === id ? null : id)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium">Datasets</h3>
          <Button variant="outline" size="sm" className="h-7 text-xs">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Add Dataset
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {datasets.map((dataset) => (
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
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
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
                      <span>{dataset.versions.length}</span>
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
                      {dataset.versions.slice(0, 2).map((version, index) => (
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
    </div>
  )
}
