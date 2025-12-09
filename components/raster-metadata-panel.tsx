"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { X, BarChart3, Thermometer, Map, ChevronDown, ChevronUp, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface LulcLegendItem {
  class: string
  color: string
}

interface UhiLegendItem {
  label: string
  color: string
  range: string
}

interface UhiStats {
  Year: number
  Mean: number
  Median: number
  Min: number
  Max: number
  Q1: number
  Q3: number
  SUHII: number
}

interface RasterMetadataPanelProps {
  dataset: {
    name: string
    analysis_type?: "lulc" | "uhi"
    label_percentages?: Record<string, number>
    legend?: LulcLegendItem[] | UhiLegendItem[]
    stats?: UhiStats[]
    date_range?: string
    year_range?: string
  }
  onClose: () => void
  leftOffset?: number
}

export function RasterMetadataPanel({ dataset, onClose, leftOffset = 292 }: RasterMetadataPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: leftOffset + 12, y: 0 })
  const panelRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })

  // Set initial position when component mounts or leftOffset changes
  useEffect(() => {
    if (panelRef.current) {
      const panelHeight = panelRef.current.offsetHeight
      // Position with 60px margin from bottom to avoid being hidden
      setPosition({
        x: leftOffset + 12,
        y: window.innerHeight - panelHeight - 60
      })
    }
  }, [leftOffset])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true)
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      }
      e.preventDefault()
    }
  }, [position])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && panelRef.current) {
      const newX = e.clientX - dragStartRef.current.x
      const newY = e.clientY - dragStartRef.current.y
      
      // Constrain to viewport
      const maxX = window.innerWidth - panelRef.current.offsetWidth - 10
      const maxY = window.innerHeight - panelRef.current.offsetHeight - 10
      
      setPosition({
        x: Math.max(10, Math.min(newX, maxX)),
        y: Math.max(60, Math.min(newY, maxY))
      })
    }
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  if (!dataset.analysis_type) return null

  const isLulc = dataset.analysis_type === "lulc"
  const isUhi = dataset.analysis_type === "uhi"

  return (
    <div
      ref={panelRef}
      className="fixed z-40 w-64 bg-[#1A1A1E]/95 backdrop-blur-sm rounded-lg border border-zinc-700/50 shadow-xl overflow-hidden select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header with drag handle */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-zinc-700/50 bg-gradient-to-r from-[#1A1A1E] to-[#22222A]">
        <div className="flex items-center gap-1.5">
          <div className="drag-handle cursor-grab active:cursor-grabbing p-0.5 hover:bg-zinc-700/50 rounded">
            <GripVertical className="h-3 w-3 text-zinc-500" />
          </div>
          {isLulc ? (
            <Map className="h-3 w-3 text-green-400" />
          ) : (
            <Thermometer className="h-3 w-3 text-orange-400" />
          )}
          <span className="text-[11px] font-medium text-zinc-200">
            {isLulc ? "Land Cover" : "Heat Map"}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onClose}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <ScrollArea className="max-h-56">
          <div className="p-2 space-y-2">
            {/* Dataset Info */}
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-500">Dataset:</span>
              <span className="text-zinc-300 truncate max-w-[120px]">{dataset.name}</span>
            </div>
            {(dataset.date_range || dataset.year_range) && (
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-zinc-500">Period:</span>
                <Badge className="bg-blue-500/20 text-blue-400 text-[9px] px-1 py-0 h-4">
                  {dataset.date_range || dataset.year_range}
                </Badge>
              </div>
            )}

            {/* LULC Content */}
            {isLulc && dataset.label_percentages && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <BarChart3 className="h-3 w-3" />
                  <span>Land Cover Distribution</span>
                </div>
                
                {/* Color-coded bars - compact */}
                <div className="space-y-1">
                  {Object.entries(dataset.label_percentages)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 6) // Show top 6 classes
                    .map(([className, percentage]) => {
                      const legendItem = (dataset.legend as LulcLegendItem[])?.find(
                        (l) => l.class === className
                      )
                      const color = legendItem?.color || "#3b82f6"
                      
                      return (
                        <div key={className} className="space-y-0.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1">
                              <div
                                className="w-2 h-2 rounded-sm flex-shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-zinc-300 truncate max-w-[100px]">{className}</span>
                            </div>
                            <span className="text-zinc-400 font-mono text-[9px]">{percentage}%</span>
                          </div>
                          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>

                {/* Compact Legend */}
                <div className="pt-1 border-t border-zinc-700/50">
                  <div className="grid grid-cols-3 gap-0.5">
                    {(dataset.legend as LulcLegendItem[])?.slice(0, 9).map((item) => (
                      <div key={item.class} className="flex items-center gap-0.5">
                        <div
                          className="w-1.5 h-1.5 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-[8px] text-zinc-500 truncate">{item.class}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* UHI Content */}
            {isUhi && dataset.stats && dataset.stats.length > 0 && (
              <div className="space-y-2">
                {/* Compact Stats Table */}
                <div className="text-[10px] text-zinc-400">Temp Stats (°C)</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[9px]">
                    <thead>
                      <tr className="border-b border-zinc-700/50">
                        <th className="text-left py-1 text-zinc-500 font-medium">Year</th>
                        <th className="text-right py-1 text-zinc-500 font-medium">Mean</th>
                        <th className="text-right py-1 text-zinc-500 font-medium">Min</th>
                        <th className="text-right py-1 text-zinc-500 font-medium">Max</th>
                        <th className="text-right py-1 text-zinc-500 font-medium">SUHII</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataset.stats.slice(0, 5).map((stat) => (
                        <tr key={stat.Year} className="border-b border-zinc-800/50">
                          <td className="py-1 text-zinc-300 font-medium">{stat.Year}</td>
                          <td className="py-1 text-right text-zinc-400">{stat.Mean}</td>
                          <td className="py-1 text-right text-blue-400">{stat.Min}</td>
                          <td className="py-1 text-right text-red-400">{stat.Max}</td>
                          <td className="py-1 text-right">
                            <span
                              className={`font-medium ${
                                stat.SUHII > 2 ? "text-red-400" : stat.SUHII > 0 ? "text-orange-400" : "text-green-400"
                              }`}
                            >
                              {stat.SUHII > 0 ? "+" : ""}{stat.SUHII}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Temperature Legend - compact */}
                <div className="pt-1 border-t border-zinc-700/50">
                  <div className="flex h-2 rounded overflow-hidden">
                    {(dataset.legend as UhiLegendItem[])?.map((item, index) => (
                      <div
                        key={index}
                        className="flex-1"
                        style={{ backgroundColor: item.color }}
                        title={`${item.label}: ${item.range}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[8px] text-zinc-500">Cool</span>
                    <span className="text-[8px] text-zinc-500">Hot</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
