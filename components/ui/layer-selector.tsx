"use client"

import { useRef, useEffect } from "react"
import { Check, MapPin, Layers, Image } from "lucide-react"

interface LayerSelectorProps {
  datasets: Array<{
    id: string
    name: string
    type: string
    format?: string
    visible: boolean
  }>
  selectedLayers: Array<{ id: string; name: string; type: string; format?: string }>
  onSelectLayer: (layer: { id: string; name: string; type: string; format?: string }) => void
  onClose: () => void
}

export function LayerSelector({ datasets, selectedLayers, onSelectLayer, onClose }: LayerSelectorProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Handle clicking outside to close the selector
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  // Separate vector and raster datasets
  const vectorDatasets = datasets.filter(d => d.type === "vector")
  const rasterDatasets = datasets.filter(d => d.type === "raster")

  const renderDatasetItem = (dataset: typeof datasets[0]) => (
    <div
      key={dataset.id}
      className={`flex items-center justify-between p-2 text-xs rounded-md cursor-pointer ${
        selectedLayers.some((l) => l.id === dataset.id)
          ? "bg-blue-500/20 text-blue-400"
          : "hover:bg-zinc-800 text-zinc-300"
      }`}
      onClick={() => onSelectLayer({ 
        id: dataset.id, 
        name: dataset.name, 
        type: dataset.type,
        format: dataset.format 
      })}
    >
      <div className="flex items-center gap-1.5">
        {dataset.type === "vector" ? (
          <MapPin className="h-3 w-3 text-green-400" />
        ) : (
          <Image className="h-3 w-3 text-orange-400" />
        )}
        <span>{dataset.name}</span>
        <span className="text-[9px] text-zinc-500 ml-1">({dataset.type})</span>
      </div>
      {selectedLayers.some((l) => l.id === dataset.id) && <Check className="h-3 w-3" />}
    </div>
  )

  return (
    <div
      ref={ref}
      className="w-full bg-zinc-900 border border-zinc-800 rounded-t-md shadow-lg max-h-56 overflow-y-auto z-10"
    >
      <div className="p-2 border-b border-zinc-800 sticky top-0 bg-zinc-900">
        <div className="flex items-center gap-1.5">
          <Layers className="h-3 w-3 text-blue-400" />
          <span className="text-xs font-medium">Select layers to process</span>
        </div>
      </div>
      <div className="p-1">
        {datasets.length === 0 ? (
          <div className="p-2 text-xs text-zinc-500 text-center">No datasets available</div>
        ) : (
          <>
            {/* Vector Datasets */}
            {vectorDatasets.length > 0 && (
              <>
                <div className="px-2 py-1 text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" />
                  Vector Layers
                </div>
                {vectorDatasets.map(renderDatasetItem)}
              </>
            )}
            
            {/* Raster Datasets */}
            {rasterDatasets.length > 0 && (
              <>
                <div className="px-2 py-1 text-[10px] text-zinc-500 font-medium flex items-center gap-1 mt-1">
                  <Image className="h-2.5 w-2.5" />
                  Raster Layers
                </div>
                {rasterDatasets.map(renderDatasetItem)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
