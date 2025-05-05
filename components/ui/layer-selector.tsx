"use client"

import { useRef, useEffect } from "react"
import { Check, MapPin, Layers } from "lucide-react"

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

  return (
    <div
      ref={ref}
      className="w-full bg-zinc-900 border border-zinc-800 rounded-t-md shadow-lg max-h-48 overflow-y-auto z-10"
    >
      <div className="p-2 border-b border-zinc-800 sticky top-0 bg-zinc-900">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-blue-400" />
          <span className="text-xs font-medium">Select layers to process</span>
        </div>
      </div>
      <div className="p-1">
        {datasets.map((dataset) => (
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
              {dataset.type === "vector" ? <MapPin className="h-3 w-3" /> : <Layers className="h-3 w-3" />}
              <span>{dataset.name}</span>
            </div>
            {selectedLayers.some((l) => l.id === dataset.id) && <Check className="h-3 w-3" />}
          </div>
        ))}
      </div>
    </div>
  )
}
