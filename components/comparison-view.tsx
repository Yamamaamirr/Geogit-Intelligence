"use client"

import { useEffect, useRef, useState } from "react"
import { X, ArrowLeft, ArrowRight, GitCommit, Link, Link2Off, ArrowLeftRight } from "lucide-react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ComparisonViewProps {
  onClose: () => void
  projectData?: any
  mainMap?: mapboxgl.Map | null
}

export function ComparisonView({ onClose, projectData, mainMap }: ComparisonViewProps) {
  const leftMapContainer = useRef<HTMLDivElement>(null)
  const rightMapContainer = useRef<HTMLDivElement>(null)
  const [leftMap, setLeftMap] = useState<mapboxgl.Map | null>(null)
  const [rightMap, setRightMap] = useState<mapboxgl.Map | null>(null)
  const [syncMaps, setSyncMaps] = useState(true)
  const [showDiff, setShowDiff] = useState(false)
  const [splitPosition, setSplitPosition] = useState(50)
  const [mapsInitialized, setMapsInitialized] = useState(false)
  const [sharedMapStyle, setSharedMapStyle] = useState<string>("mapbox://styles/mapbox/light-v11")

  // Sample version data - use project data if available
  const versions =
    projectData?.mapData?.commits?.length > 0
      ? projectData.mapData.commits.map((commit: any) => ({
          id: commit.id,
          name: commit.message || `Commit ${commit.id}`,
          style: projectData?.mapData?.style || "mapbox://styles/mapbox/light-v11",
          date: commit.date || new Date(commit.timestamp).toLocaleDateString(),
          author: commit.author || "Unknown",
          timestamp: commit.timestamp,
          layers: commit.layers || [],
        }))
      : [
          {
            id: "v1",
            name: "Current Version (Apr 2023)",
            style: projectData?.mapData?.style || "mapbox://styles/mapbox/light-v11",
            date: "Apr 30, 2023",
            author: "Alex Kim",
            layers: [],
          },
          {
            id: "v2",
            name: "Previous Version (Jan 2023)",
            style: "mapbox://styles/mapbox/satellite-streets-v12",
            date: "Jan 15, 2023",
            author: "Jamie Smith",
            layers: [],
          },
          {
            id: "v3",
            name: "Initial Version (Oct 2022)",
            style: "mapbox://styles/mapbox/streets-v12",
            date: "Oct 10, 2022",
            author: "Alex Kim",
            layers: [],
          },
        ]

  const [leftVersion, setLeftVersion] = useState(versions.length > 0 ? versions[0].id : "v1")
  const [rightVersion, setRightVersion] = useState(versions.length > 1 ? versions[1].id : "v2")

  // Get style URL based on version ID
  const getStyleForVersion = (versionId: string) => {
    const version = versions.find((v) => v.id === versionId)
    return version?.style || sharedMapStyle
  }

  // Get layers for a specific version
  const getLayersForVersion = (versionId: string) => {
    const version = versions.find((v) => v.id === versionId)
    return version?.layers || []
  }

  const swapVersions = () => {
    const temp = leftVersion
    setLeftVersion(rightVersion)
    setRightVersion(temp)
  }

  // Apply version-specific layers to a map
  const applyVersionLayers = (map: mapboxgl.Map, versionId: string) => {
    if (!map || !map.loaded()) return

    // Get layers for this version
    const versionLayers = getLayersForVersion(versionId)
    
    // If we have the main map reference and it has layers, copy them
    if (mainMap && versionLayers.length === 0) {
      // Get all layers from the main map
      const mainMapLayers = mainMap.getStyle().layers || []
      const mainMapSources = mainMap.getStyle().sources || {}
      
      // Add sources from main map if they don't exist in the comparison map
      Object.keys(mainMapSources).forEach(sourceId => {
        if (!map.getSource(sourceId)) {
          try {
            map.addSource(sourceId, mainMapSources[sourceId])
          } catch (error) {
            console.warn(`Error adding source ${sourceId}:`, error)
          }
        }
      })
      
      // Add layers from main map
      mainMapLayers.forEach(layer => {
        if (!map.getLayer(layer.id)) {
          try {
            map.addLayer(layer)
          } catch (error) {
            console.warn(`Error adding layer ${layer.id}:`, error)
          }
        }
      })
    } else if (versionLayers.length > 0) {
      // Add version-specific layers
      versionLayers.forEach(layer => {
        // Check if the layer already exists
        if (map.getLayer(layer.id)) {
          map.removeLayer(layer.id)
        }
        
        // Check if the source exists, if not add it
        if (layer.source && !map.getSource(layer.source)) {
          try {
            map.addSource(layer.source, layer.sourceData || {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: []
              }
            })
          } catch (error) {
            console.warn(`Error adding source ${layer.source}:`, error)
          }
        }
        
        // Add the layer
        try {
          map.addLayer(layer)
        } catch (error) {
          console.warn(`Error adding layer ${layer.id}:`, error)
        }
      })
    }
  }

  // Initialize maps
  useEffect(() => {
    if (!leftMapContainer.current || !rightMapContainer.current) return

    let newLeftMap: mapboxgl.Map | null = null
    let newRightMap: mapboxgl.Map | null = null

    try {
      // Create left map
      newLeftMap = new mapboxgl.Map({
        container: leftMapContainer.current,
        style: getStyleForVersion(leftVersion),
        center: projectData?.mapData?.initialCenter || [70, 30], // Pakistan coordinates
        zoom: projectData?.mapData?.initialZoom || 5.5, // Better zoom level for Pakistan
        attributionControl: false,
      })

      // Create right map
      newRightMap = new mapboxgl.Map({
        container: rightMapContainer.current,
        style: getStyleForVersion(rightVersion),
        center: projectData?.mapData?.initialCenter || [70, 30], // Pakistan coordinates
        zoom: projectData?.mapData?.initialZoom || 5.5, // Better zoom level for Pakistan
        attributionControl: false,
      })

      // Set up map sync if enabled
      if (syncMaps) {
        let leftMoving = false
        let rightMoving = false

        newLeftMap.on("move", () => {
          if (syncMaps && !rightMoving && newRightMap) {
            leftMoving = true
            newRightMap.setCenter(newLeftMap.getCenter())
            newRightMap.setZoom(newLeftMap.getZoom())
            newRightMap.setBearing(newLeftMap.getBearing())
            newRightMap.setPitch(newLeftMap.getPitch())
            leftMoving = false
          }
        })

        newRightMap.on("move", () => {
          if (syncMaps && !leftMoving && newLeftMap) {
            rightMoving = true
            newLeftMap.setCenter(newRightMap.getCenter())
            newLeftMap.setZoom(newRightMap.getZoom())
            newLeftMap.setBearing(newRightMap.getBearing())
            newLeftMap.setPitch(newRightMap.getPitch())
            rightMoving = false
          }
        })
      }

      // Apply version-specific layers when maps are loaded
      newLeftMap.on("load", () => {
        applyVersionLayers(newLeftMap, leftVersion)
      })

      newRightMap.on("load", () => {
        applyVersionLayers(newRightMap, rightVersion)
      })

      // Add diff visualization if enabled
      if (showDiff) {
        const addDiffLayer = (map: mapboxgl.Map, color: string) => {
          map.on("load", () => {
            // Only add layers if the map is still valid
            if (!map || !map.getCanvas()) return

            // Remove existing layer if it exists
            if (map.getLayer("diff-highlight")) {
              map.removeLayer("diff-highlight")
            }

            // Remove existing source if it exists
            if (map.getSource("diff-highlight")) {
              map.removeSource("diff-highlight")
            }

            // Add new source and layer
            map.addSource("diff-highlight", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature",
                    geometry: {
                      type: "Polygon",
                      coordinates: [
                        [
                          [-74.5, 40],
                          [-74.4, 40],
                          [-74.4, 40.1],
                          [-74.5, 40.1],
                          [-74.5, 40],
                        ],
                      ],
                    },
                  },
                ],
              },
            })

            map.addLayer({
              id: "diff-highlight",
              type: "fill",
              source: "diff-highlight",
              layout: {},
              paint: {
                "fill-color": color,
                "fill-opacity": 0.3,
              },
            })
          })
        }

        addDiffLayer(newLeftMap, "#ff0000")
        addDiffLayer(newRightMap, "#00ff00")
      }

      // Store map instances
      setLeftMap(newLeftMap)
      setRightMap(newRightMap)
      setMapsInitialized(true)
    } catch (error) {
      console.error("Error initializing maps:", error)
    }

    // Clean up on unmount or when dependencies change
    return () => {
      try {
        if (newLeftMap && newLeftMap.getCanvas()) {
          newLeftMap.remove()
        }
      } catch (error) {
        console.error("Error removing left map:", error)
      }

      try {
        if (newRightMap && newRightMap.getCanvas()) {
          newRightMap.remove()
        }
      } catch (error) {
        console.error("Error removing right map:", error)
      }

      setLeftMap(null)
      setRightMap(null)
      setMapsInitialized(false)
    }
  }, [leftVersion, rightVersion, syncMaps, showDiff, projectData, sharedMapStyle])

  // Update split position
  useEffect(() => {
    if (!leftMapContainer.current || !rightMapContainer.current) return

    leftMapContainer.current.style.width = `${splitPosition}%`
    rightMapContainer.current.style.width = `${100 - splitPosition}%`

    // Trigger resize to ensure maps render correctly
    // Only resize if maps are initialized and valid
    setTimeout(() => {
      try {
        if (leftMap && leftMap.getCanvas()) {
          leftMap.resize()
        }
        if (rightMap && rightMap.getCanvas()) {
          rightMap.resize()
        }
      } catch (error) {
        console.error("Error resizing maps:", error)
      }
    }, 0)
  }, [splitPosition, leftMap, rightMap])

  // Clean up maps when component unmounts
  useEffect(() => {
    return () => {
      try {
        if (leftMap && leftMap.getCanvas()) {
          leftMap.remove()
        }
      } catch (error) {
        console.error("Error removing left map on unmount:", error)
      }

      try {
        if (rightMap && rightMap.getCanvas()) {
          rightMap.remove()
        }
      } catch (error) {
        console.error("Error removing right map on unmount:", error)
      }
    }
  }, [])

  // Get version details
  const getVersionDetails = (versionId: string) => {
    return versions.find((v) => v.id === versionId)
  }

  const leftVersionDetails = getVersionDetails(leftVersion)
  const rightVersionDetails = getVersionDetails(rightVersion)

  const updateMapStyles = (newStyle: string) => {
    setSharedMapStyle(newStyle)

    if (leftMap && leftMap.getCanvas()) {
      leftMap.setStyle(newStyle)
    }

    if (rightMap && rightMap.getCanvas()) {
      rightMap.setStyle(newStyle)
    }
  }

  // Update version selections when projectData changes
  useEffect(() => {
    if (projectData?.mapData?.commits?.length > 0) {
      const commits = projectData.mapData.commits
      if (commits.length > 0) {
        setLeftVersion(commits[0].id)
      }
      if (commits.length > 1) {
        setRightVersion(commits[1].id)
      }
    }
  }, [projectData])

  return (
    <div className="absolute inset-0 z-20 h-full w-full bg-[#1A1A1E]">
      {/* Header */}
      <div className="absolute left-0 top-0 z-30 flex h-12 w-full items-center justify-between border-b border-border bg-[#1A1A1E] px-4 pointer-events-auto">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Version Comparison - {projectData?.name || "Project"}</h2>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-black/20 backdrop-blur-sm hover:bg-red-500/20 hover:text-red-400 transition-colors"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              Exit Comparison
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Version labels */}
      <div className="absolute left-0 top-12 z-30 flex h-10 w-full items-center border-b border-border bg-[#1A1A1E]/80 backdrop-blur-sm pointer-events-auto">
        <div className="flex h-full items-center border-r border-border px-4" style={{ width: `${splitPosition}%` }}>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <GitCommit className="h-3.5 w-3.5 text-green-400" />
              <span className="text-xs font-medium">{leftVersionDetails?.name}</span>
            </div>
            {leftVersionDetails?.author && (
              <span className="text-[10px] text-muted-foreground">
                {leftVersionDetails.author} • {leftVersionDetails.date}
              </span>
            )}
          </div>
          <Badge className="ml-auto bg-green-500/20 text-[10px] text-green-400">Left</Badge>
        </div>
        <div className="flex h-full flex-1 items-center px-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <GitCommit className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs font-medium">{rightVersionDetails?.name}</span>
            </div>
            {rightVersionDetails?.author && (
              <span className="text-[10px] text-muted-foreground">
                {rightVersionDetails.author} • {rightVersionDetails.date}
              </span>
            )}
          </div>
          <Badge className="ml-auto bg-blue-500/20 text-[10px] text-blue-400">Right</Badge>
        </div>
      </div>

      {/* Maps container */}
      <div className="absolute inset-0 top-22 pt-22 pointer-events-auto" style={{ top: "5.5rem" }}>
        <div className="flex h-full w-full">
          {/* Left map */}
          <div ref={leftMapContainer} className="h-full" style={{ width: `${splitPosition}%` }} />

          {/* Right map */}
          <div
            ref={rightMapContainer}
            className="h-full border-l-2 border-white/50"
            style={{ width: `${100 - splitPosition}%` }}
          />

          {/* Divider handle */}
          <div
            className="absolute top-0 z-30 h-full w-4 cursor-col-resize pointer-events-auto"
            style={{ left: `${splitPosition}%`, transform: "translateX(-50%)" }}
            onMouseDown={(e) => {
              e.preventDefault()

              const handleMouseMove = (moveEvent: MouseEvent) => {
                const containerWidth = document.body.clientWidth
                const newPosition = (moveEvent.clientX / containerWidth) * 100
                setSplitPosition(Math.max(10, Math.min(90, newPosition)))
              }

              const handleMouseUp = () => {
                document.removeEventListener("mousemove", handleMouseMove)
                document.removeEventListener("mouseup", handleMouseUp)
              }

              document.addEventListener("mousemove", handleMouseMove)
              document.addEventListener("mouseup", handleMouseUp)
            }}
          >
            <div className="absolute left-1/2 top-1/2 h-16 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70"></div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2 transform rounded-lg border border-border bg-[#1A1A1E]/95 p-3 shadow-lg backdrop-blur-sm pointer-events-auto">
        <div className="flex flex-col gap-1 mb-3 w-full">
          <label className="text-xs text-muted-foreground">Map Style</label>
          <Select value={sharedMapStyle} onValueChange={updateMapStyles}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mapbox://styles/mapbox/light-v11" className="text-xs">
                Light
              </SelectItem>
              <SelectItem value="mapbox://styles/mapbox/dark-v11" className="text-xs">
                Dark
              </SelectItem>
              <SelectItem value="mapbox://styles/mapbox/satellite-streets-v12" className="text-xs">
                Satellite
              </SelectItem>
              <SelectItem value="mapbox://styles/mapbox/streets-v12" className="text-xs">
                Streets
              </SelectItem>
              <SelectItem value="mapbox://styles/myamamabe21igis/cma4e0v7e003401qo4d8ohre2" className="text-xs">
                Custom
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Left Version</label>
            <Select
              value={leftVersion}
              onValueChange={(value) => {
                // Prevent both selects from having the same value
                if (value === rightVersion) {
                  // If user selects the same version that's in right, swap them
                  setRightVersion(leftVersion)
                }
                setLeftVersion(value)
              }}
            >
              <SelectTrigger className="h-8 w-48 text-xs">
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((version) => (
                  <SelectItem key={version.id} value={version.id} className="text-xs">
                    {version.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="icon" className="h-8 w-8 self-end" onClick={swapVersions}>
            <ArrowLeftRight className="h-4 w-4" />
          </Button>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Right Version</label>
            <Select
              value={rightVersion}
              onValueChange={(value) => {
                // Prevent both selects from having the same value
                if (value === leftVersion) {
                  // If user selects the same version that's in left, swap them
                  setLeftVersion(rightVersion)
                }
                setRightVersion(value)
              }}
            >
              <SelectTrigger className="h-8 w-48 text-xs">
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((version) => (
                  <SelectItem key={version.id} value={version.id} className="text-xs">
                    {version.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSplitPosition(Math.max(10, splitPosition - 10))}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <Slider
            value={[splitPosition]}
            min={10}
            max={90}
            step={1}
            className="w-48"
            onValueChange={(value) => setSplitPosition(value[0])}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSplitPosition(Math.min(90, splitPosition + 10))}
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch id="sync-maps" checked={syncMaps} onCheckedChange={setSyncMaps} />
            <Label htmlFor="sync-maps" className="text-xs flex items-center">
              {syncMaps ? (
                <>
                  <Link className="mr-1.5 h-3.5 w-3.5" /> Linked Views
                </>
              ) : (
                <>
                  <Link2Off className="mr-1.5 h-3.5 w-3.5" /> Independent Views
                </>
              )}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="show-diff" checked={showDiff} onCheckedChange={setShowDiff} />
            <Label htmlFor="show-diff" className="text-xs">
              Highlight Changes
            </Label>
          </div>
        </div>
      </div>
    </div>
  )
}
