"use client"

import { useState } from "react"
import { Check, X, Grid } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"

export function ProjectFilters() {
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState({
    status: {
      active: false,
      completed: false,
      paused: false,
      archived: false,
    },
    type: {
      vector: false,
      raster: false,
      llm: false,
    },
    sort: "recent",
    progress: [0, 100],
  })

  const handleStatusChange = (status: string) => {
    setFilters({
      ...filters,
      status: {
        ...filters.status,
        [status]: !filters.status[status as keyof typeof filters.status],
      },
    })
  }

  const handleTypeChange = (type: string) => {
    setFilters({
      ...filters,
      type: {
        ...filters.type,
        [type]: !filters.type[type as keyof typeof filters.type],
      },
    })
  }

  const handleSortChange = (sort: string) => {
    setFilters({
      ...filters,
      sort,
    })
  }

  const handleProgressChange = (value: number[]) => {
    setFilters({
      ...filters,
      progress: [value[0], value[1]],
    })
  }

  const handleReset = () => {
    setFilters({
      status: {
        active: false,
        completed: false,
        paused: false,
        archived: false,
      },
      type: {
        vector: false,
        raster: false,
        llm: false,
      },
      sort: "recent",
      progress: [0, 100],
    })
  }

  const handleApply = () => {
    // Apply filters logic here
    setOpen(false)
  }

  const activeFilterCount =
    Object.values(filters.status).filter(Boolean).length +
    Object.values(filters.type).filter(Boolean).length +
    (filters.progress[0] > 0 || filters.progress[1] < 100 ? 1 : 0)

  return (
    <TooltipProvider>
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white hover:border-blue-500/50 hover:bg-zinc-800 transition-all duration-200 relative"
              >
                <Grid className="h-4 w-4 text-blue-400" />
                {activeFilterCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-blue-500 hover:bg-blue-600 transition-colors text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Filters</p>
          </TooltipContent>
        </Tooltip>

        <PopoverContent className="w-64 p-0 bg-zinc-900 border-zinc-800 shadow-xl shadow-black/20">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-gradient-to-r from-zinc-900 to-zinc-800">
            <h3 className="font-medium text-sm flex items-center">
              <Grid className="h-4 w-4 mr-2 text-blue-400" />
              Filter Projects
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
              onClick={handleReset}
            >
              Reset
            </Button>
          </div>

          <div className="p-4 space-y-5">
            {/* Status filter */}
            <div>
              <h4 className="text-xs font-medium text-zinc-300 mb-2">Status</h4>
              <div className="grid grid-cols-2 gap-2">
                {["active", "completed", "paused", "archived"].map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.status[status as keyof typeof filters.status]}
                      onCheckedChange={() => handleStatusChange(status)}
                      className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                    />
                    <Label htmlFor={`status-${status}`} className="text-xs text-zinc-400 capitalize">
                      {status}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="bg-zinc-800" />

            {/* Type filter */}
            <div>
              <h4 className="text-xs font-medium text-zinc-300 mb-2">Type</h4>
              <div className="grid grid-cols-3 gap-2">
                {["vector", "raster", "llm"].map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={filters.type[type as keyof typeof filters.type]}
                      onCheckedChange={() => handleTypeChange(type)}
                      className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                    />
                    <Label htmlFor={`type-${type}`} className="text-xs text-zinc-400 capitalize">
                      {type.toUpperCase()}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="bg-zinc-800" />

            {/* Sort by */}
            <div>
              <h4 className="text-xs font-medium text-zinc-300 mb-2">Sort by</h4>
              <RadioGroup value={filters.sort} onValueChange={handleSortChange} className="grid grid-cols-2 gap-2">
                {[
                  { value: "recent", label: "Most Recent" },
                  { value: "name", label: "Name" },
                  { value: "progress", label: "Progress" },
                  { value: "contributors", label: "Contributors" },
                ].map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={option.value}
                      id={`sort-${option.value}`}
                      className="data-[state=checked]:border-blue-500 data-[state=checked]:text-blue-500"
                    />
                    <Label htmlFor={`sort-${option.value}`} className="text-xs text-zinc-400">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Separator className="bg-zinc-800" />

            {/* Progress range */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-zinc-300">Progress</h4>
                <span className="text-xs text-zinc-500">
                  {filters.progress[0]}% - {filters.progress[1]}%
                </span>
              </div>
              <Slider
                value={[filters.progress[0], filters.progress[1]]}
                min={0}
                max={100}
                step={5}
                onValueChange={handleProgressChange}
                className="my-4"
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-zinc-800 flex justify-end gap-2 bg-gradient-to-r from-zinc-900 to-zinc-800">
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
              onClick={() => setOpen(false)}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
            <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleApply}>
              <Check className="h-3.5 w-3.5 mr-1" />
              Apply Filters
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  )
}
