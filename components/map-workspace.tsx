"use client"

import { useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  GitPullRequest,
  Layers,
  MessageSquare,
  Settings,
  FileUp,
} from "lucide-react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VersionControl } from "@/components/version-control"
import { LlmAssistant } from "@/components/llm-assistant"
import { DatasetInspector } from "@/components/dataset-inspector"
import { MapToolbar } from "@/components/map-toolbar"
import { ComparisonView } from "@/components/comparison-view"
import { getProjectById } from "@/lib/project-data"
import { AddDatasetDialog } from "@/components/add-dataset-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Set Mapbox access token globally
mapboxgl.accessToken =
  "pk.eyJ1IjoibXlhbWFtYWJlMjFpZ2lzIiwiYSI6ImNtYTJ3a2diNzE2OXoyanNmOGdyZGQ2djAifQ.8nkeh0-v5gJLVQbtgwxNWQ"

interface MapWorkspaceProps {
  projectId: string
  isNewProject?: boolean
  projectName?: string
  projectDescription?: string
}

export function MapWorkspace({ projectId, isNewProject = false, projectName, projectDescription }: MapWorkspaceProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null) // Use ref to persist map instance
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [projectData, setProjectData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDatasetDialog, setShowAddDatasetDialog] = useState(false)

  // Debug log to verify props are received correctly
  useEffect(() => {
    console.log("MapWorkspace received props:", { projectId, projectName, projectDescription })
  }, [projectId, projectName, projectDescription])

  // Fetch project data based on ID - only run once on mount or when projectId changes
  useEffect(() => {
    setIsLoading(true)

    // Ensure projectId is defined before using it
    const safeProjectId = projectId || "unknown"

    if (isNewProject || safeProjectId === "new-project") {
      // Create empty project data for new projects
      setProjectData({
        id: safeProjectId,
        name: projectName || "New Project",
        description: projectDescription || "Your new geospatial project",
        mapData: {
          style: "mapbox://styles/mapbox/light-v11",
          initialCenter: [70, 30], // Pakistan coordinates
          initialZoom: 5.5, // Better zoom level for Pakistan
          datasets: [],
          commits: [],
        },
      })
      setIsLoading(false)
    } else {
      // Fetch existing project data
      try {
        const project = getProjectById(safeProjectId)
        if (project) {
          // If we have project data from the function
          setProjectData({
            ...project,
            name: projectName || project.name,
            description: projectDescription || project.description,
          })
        } else {
          // If no project found, create a default one with the ID and provided name/description
          // Use safe substring to avoid errors with undefined
          const idPreview =
            safeProjectId && typeof safeProjectId === "string"
              ? safeProjectId.substring(0, Math.min(8, safeProjectId.length))
              : "unknown"

          setProjectData({
            id: safeProjectId,
            name: projectName || `Project ${idPreview}`,
            description: projectDescription || "Project details",
            mapData: {
              style: "mapbox://styles/mapbox/light-v11",
              initialCenter: [70, 30], // Pakistan coordinates
              initialZoom: 5.5, // Better zoom level for Pakistan
              datasets: [],
              commits: [],
            },
          })
        }
      } catch (error) {
        console.error("Error fetching project data:", error)
        // Fallback to default project data with safe ID handling
        const idPreview =
          safeProjectId && typeof safeProjectId === "string"
            ? safeProjectId.substring(0, Math.min(8, safeProjectId.length))
            : "unknown"

        setProjectData({
          id: safeProjectId,
          name: projectName || `Project ${idPreview}`,
          description: projectDescription || "Project details",
          mapData: {
            style: "mapbox://styles/mapbox/light-v11",
            initialCenter: [70, 30], // Pakistan coordinates
            initialZoom: 5.5, // Better zoom level for Pakistan
            datasets: [],
            commits: [],
          },
        })
      }
      setIsLoading(false)
    }
  }, [projectId, isNewProject, projectName, projectDescription]) // Only depend on these props

  // Initialize map when component mounts - only run once
  useEffect(() => {
    // Wait for the container and project data to be available
    if (!mapContainerRef.current || !projectData?.mapData || isLoading) return

    // Only create a new map if one doesn't already exist
    if (!mapInstanceRef.current) {
      try {
        console.log("Initializing new map instance")
        // Create a new map instance with project-specific settings
        const newMapInstance = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: "mapbox://styles/myamamabe21igis/cma4e0v7e003401qo4d8ohre2", // Custom style URL
          center: projectData.mapData.initialCenter || [70, 30], // Pakistan coordinates
          zoom: projectData.mapData.initialZoom || 5.5, // Better zoom level for Pakistan
          attributionControl: false,
          preserveDrawingBuffer: true,
        })

        // Store the map instance in the ref
        mapInstanceRef.current = newMapInstance

        // Wait for the map to load
        newMapInstance.on("load", () => {
          console.log("Map loaded successfully for project:", projectData.name)

          // Add sample layers for demonstration purposes
          // In a real app, these would come from your backend or project data
          try {
            // Only add these layers if they don't already exist
            if (!newMapInstance.getSource("sample-source")) {
              newMapInstance.addSource("sample-source", {
                type: "geojson",
                data: {
                  type: "FeatureCollection",
                  features: [],
                },
              })
            }

            // Add sample layers for each dataset in the project
            projectData.mapData.datasets?.forEach((dataset: any) => {
              if (!newMapInstance.getLayer(dataset.id)) {
                newMapInstance.addLayer({
                  id: dataset.id,
                  type: dataset.type === "vector" ? "line" : "raster",
                  source: "sample-source",
                  layout: {
                    visibility: dataset.visible ? "visible" : "none",
                  },
                  paint: {},
                })
              }
            })
          } catch (error) {
            console.warn("Error adding sample layers:", error)
          }

          // Update the state with the map instance
          setMap(newMapInstance)
        })

        // Handle style changes to preserve custom layers
        newMapInstance.on("styledata", () => {
          // This event fires when the map style has been fully loaded
          // Re-add any custom data sources and layers that might have been removed
          updateMapLayers()
        })

        // Handle errors
        newMapInstance.on("error", (e) => {
          console.error("Map error:", e.error || e)
        })
      } catch (error) {
        console.error("Error initializing map:", error)
      }
    }

    // Clean up on unmount
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        } catch (error) {
          console.error("Error removing map:", error)
        }
      }
    }
  }, [isLoading]) // Only depend on isLoading, not projectData

  // Add a function to update map layers that can be called after style changes
  const updateMapLayers = () => {
    if (!mapInstanceRef.current || !projectData?.mapData?.datasets) return

    const currentMap = mapInstanceRef.current

    // Make sure the map is fully loaded
    if (!currentMap.isStyleLoaded()) {
      currentMap.once("style.load", () => updateMapLayers())
      return
    }

    try {
      // Ensure the sample source exists
      if (!currentMap.getSource("sample-source")) {
        currentMap.addSource("sample-source", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        })
      }

      // Update layers for each dataset
      projectData.mapData.datasets?.forEach((dataset: any) => {
        if (!currentMap.getLayer(dataset.id)) {
          try {
            // Create a clean layer configuration with required type
            const layerConfig: any = {
              id: dataset.id,
              source: "sample-source",
              // Always specify a valid type - this is required
              type:
                dataset.type === "vector"
                  ? "line"
                  : dataset.type === "raster"
                    ? "raster"
                    : dataset.type === "circle"
                      ? "circle"
                      : dataset.type === "fill"
                        ? "fill"
                        : "line", // Default to line if unknown
            }

            // Only add layout if needed
            if (dataset.visible !== undefined) {
              layerConfig.layout = {
                visibility: dataset.visible ? "visible" : "none",
              }
            }

            // Add paint properties based on type
            if (dataset.type === "vector" || dataset.type === "line") {
              layerConfig.paint = {
                "line-color": "#3b82f6",
                "line-width": 2,
              }
            } else if (dataset.type === "fill") {
              layerConfig.paint = {
                "fill-color": "#3b82f6",
                "fill-opacity": 0.6,
                "fill-outline-color": "#2563eb",
              }
            } else if (dataset.type === "circle") {
              layerConfig.paint = {
                "circle-color": "#3b82f6",
                "circle-radius": 6,
                "circle-stroke-width": 1,
                "circle-stroke-color": "#2563eb",
              }
            } else if (dataset.type === "raster") {
              layerConfig.paint = {
                "raster-opacity": 0.8,
              }
            }

            // Add the layer with the clean configuration
            currentMap.addLayer(layerConfig)
            console.log(`Successfully added layer: ${dataset.id} of type: ${layerConfig.type}`)
          } catch (error) {
            console.warn(`Error adding layer for dataset ${dataset.id}:`, error)
          }
        }
      })
    } catch (error) {
      console.warn("Error updating map layers:", error)
    }
  }

  // Update map with datasets when projectData changes
  useEffect(() => {
    // Skip if map isn't initialized or no project data
    if (!mapInstanceRef.current || !projectData?.mapData?.datasets) return

    const currentMap = mapInstanceRef.current

    // Make sure the map is fully loaded
    if (!currentMap.isStyleLoaded()) {
      currentMap.once("style.load", () => updateMapLayers())
      return
    }

    updateMapLayers()

    function updateMapLayers() {
      try {
        // Ensure the sample source exists
        if (!currentMap.getSource("sample-source")) {
          currentMap.addSource("sample-source", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [],
            },
          })
        }

        // Update layers for each dataset
        projectData.mapData.datasets?.forEach((dataset: any) => {
          if (!currentMap.getLayer(dataset.id)) {
            try {
              // Always ensure we have a valid layer type
              let layerType: string

              // Determine the appropriate layer type
              if (dataset.type === "fill") {
                layerType = "fill"
              } else if (dataset.type === "line" || dataset.type === "vector") {
                layerType = "line"
              } else if (dataset.type === "circle") {
                layerType = "circle"
              } else if (dataset.type === "raster") {
                layerType = "raster"
              } else {
                // Default to line if we can't determine the type
                layerType = "line"
                console.warn(`Unknown dataset type: ${dataset.type}, defaulting to line`)
              }

              // Create layer configuration with required type
              const layerConfig: any = {
                id: dataset.id,
                source: "sample-source",
                type: layerType, // Always specify a valid type
              }

              // Set the paint properties based on layer type
              if (layerType === "fill") {
                layerConfig.paint = {
                  "fill-color": "#3b82f6",
                  "fill-opacity": 0.6,
                  "fill-outline-color": "#2563eb",
                }
              } else if (layerType === "line") {
                layerConfig.paint = {
                  "line-color": "#3b82f6",
                  "line-width": 2,
                }
              } else if (layerType === "circle") {
                layerConfig.paint = {
                  "circle-color": "#3b82f6",
                  "circle-radius": 6,
                  "circle-stroke-width": 1,
                  "circle-stroke-color": "#2563eb",
                }
              } else if (layerType === "raster") {
                layerConfig.paint = {
                  "raster-opacity": 0.8,
                }
              }

              // Add layout properties if needed
              if (dataset.visible !== undefined) {
                layerConfig.layout = {
                  visibility: dataset.visible ? "visible" : "none",
                }
              }

              // Add the layer with the complete configuration
              console.log(`Adding layer ${dataset.id} with type ${layerType}`)
              currentMap.addLayer(layerConfig)
            } catch (error) {
              console.error(`Error adding layer for dataset ${dataset.id}:`, error)
            }
          }
        })
      } catch (error) {
        console.warn("Error updating map layers:", error)
      }
    }
  }, [projectData?.mapData?.datasets])

  // Add an event listener for the custom event to handle layer updates
  useEffect(() => {
    // Add event listener for custom layer update event
    const handleLayerUpdateNeeded = () => {
      updateMapLayers()
    }

    window.addEventListener("map-layers-update-needed", handleLayerUpdateNeeded)

    // Clean up
    return () => {
      window.removeEventListener("map-layers-update-needed", handleLayerUpdateNeeded)
    }
  }, [])

  const toggleLeftPanel = () => {
    setLeftPanelCollapsed(!leftPanelCollapsed)
  }

  const toggleRightPanel = () => {
    setRightPanelCollapsed(!rightPanelCollapsed)
  }

  const toggleComparisonView = () => {
    setShowComparison(!showComparison)
  }

  const handleAddDataset = (newDataset: any) => {
    // In a real app, you would send this to your backend
    console.log("Adding new dataset:", newDataset)

    // For now, just update the local state
    if (projectData && projectData.mapData) {
      const updatedDatasets = [
        ...(projectData.mapData.datasets || []),
        {
          id: newDataset.id || `d${Date.now()}`,
          name: newDataset.name,
          type: newDataset.type,
          format: newDataset.format,
          crs: newDataset.crs || "EPSG:4326",
          status: "new",
          visible: true,
          versions: [newDataset.version_number || "v1.0"],
        },
      ]

      // Update project data without recreating the map
      setProjectData({
        ...projectData,
        mapData: {
          ...projectData.mapData,
          datasets: updatedDatasets,
        },
      })

      // If we have a map instance, add the dataset to the map
      if (mapInstanceRef.current) {
        const currentMap = mapInstanceRef.current

        // Handle different dataset types
        if (newDataset.type === "vector" && newDataset.geometry_data) {
          // Handle vector data
          try {
            // Create a unique source ID for this dataset
            const sourceId = `source-${newDataset.id || Date.now()}`
            const layerId = `layer-${newDataset.id || Date.now()}`

            // Make sure the map is fully loaded before adding layers
            const addVectorLayerToMap = () => {
              // Add the source if it doesn't exist
              if (!currentMap.getSource(sourceId)) {
                currentMap.addSource(sourceId, {
                  type: "geojson",
                  data: newDataset.geometry_data,
                })
              }

              // Determine the layer type based on the first feature's geometry type
              let layerType = "fill"
              if (
                newDataset.geometry_data &&
                newDataset.geometry_data.features &&
                newDataset.geometry_data.features.length > 0
              ) {
                const firstFeature = newDataset.geometry_data.features[0]
                if (firstFeature && firstFeature.geometry) {
                  if (firstFeature.geometry.type === "Point") {
                    layerType = "circle"
                  } else if (
                    firstFeature.geometry.type === "LineString" ||
                    firstFeature.geometry.type === "MultiLineString"
                  ) {
                    layerType = "line"
                  }
                }
              }

              // Add the layer if it doesn't exist
              if (!currentMap.getLayer(layerId)) {
                try {
                  // Add appropriate layer based on geometry type
                  const layerConfig: any = {
                    id: layerId,
                    source: sourceId,
                    // Always specify a valid type - this is required
                    type: layerType, // This will be "fill", "line", or "circle"
                  }

                  // Set paint properties based on geometry type
                  if (layerType === "fill") {
                    layerConfig.paint = {
                      "fill-color": "#3b82f6",
                      "fill-opacity": 0.6,
                      "fill-outline-color": "#2563eb",
                    }
                  } else if (layerType === "line") {
                    layerConfig.paint = {
                      "line-color": "#3b82f6",
                      "line-width": 2,
                    }
                  } else if (layerType === "circle") {
                    layerConfig.paint = {
                      "circle-color": "#3b82f6",
                      "circle-radius": 6,
                      "circle-stroke-width": 1,
                      "circle-stroke-color": "#2563eb",
                    }
                  }

                  // Add the layer with the clean configuration
                  currentMap.addLayer(layerConfig)
                  console.log(`Successfully added ${layerType} layer: ${layerId}`)
                } catch (error) {
                  console.error(`Error adding ${layerType} layer:`, error)
                }
              }

              // Calculate bounds of the geometry data if it exists
              if (
                newDataset.geometry_data &&
                newDataset.geometry_data.features &&
                newDataset.geometry_data.features.length > 0
              ) {
                const bounds = new mapboxgl.LngLatBounds()
                let hasBounds = false

                newDataset.geometry_data.features.forEach((feature: any) => {
                  if (feature.geometry) {
                    try {
                      if (feature.geometry.type === "Point") {
                        bounds.extend(feature.geometry.coordinates)
                        hasBounds = true
                      } else if (feature.geometry.type === "LineString") {
                        feature.geometry.coordinates.forEach((coord: [number, number]) => {
                          bounds.extend(coord)
                          hasBounds = true
                        })
                      } else if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
                        // For polygons, we need to handle nested coordinate arrays
                        const processCoords = (coords: any[]) => {
                          coords.forEach((coord: any) => {
                            if (Array.isArray(coord[0])) {
                              processCoords(coord)
                            } else {
                              bounds.extend(coord as [number, number])
                              hasBounds = true
                            }
                          })
                        }
                        processCoords(feature.geometry.coordinates)
                      }
                    } catch (error) {
                      console.warn(`Error processing feature geometry: ${error}`)
                    }
                  }
                })

                // If we have valid bounds, fit the map to them with animation
                if (hasBounds && !bounds.isEmpty()) {
                  currentMap.fitBounds(bounds, {
                    padding: 50,
                    duration: 1000,
                    maxZoom: 15,
                  })
                }
              }

              // Show a success notification or feedback
              console.log(
                `Added ${newDataset.features_count || newDataset.geometry_data.features.length} vector features to the map`,
              )
            }

            // Check if the map is loaded and has a style
            if (currentMap.isStyleLoaded()) {
              addVectorLayerToMap()
            } else {
              // Wait for the style to load before adding the layer
              currentMap.once("style.load", addVectorLayerToMap)
            }
          } catch (error) {
            console.error("Error adding vector data to map:", error)
          }
        } else if (newDataset.type === "raster" && newDataset.mapbox_url) {
          // Handle raster data with mapbox_url
          try {
            // Create a unique source ID for this dataset
            const sourceId = `raster-source-${newDataset.id || Date.now()}`
            const layerId = `raster-layer-${newDataset.id || Date.now()}`

            // Make sure the map is fully loaded before adding layers
            const addRasterLayerToMap = () => {
              // Add the raster source if it doesn't exist
              if (!currentMap.getSource(sourceId)) {
                currentMap.addSource(sourceId, {
                  type: "raster",
                  tiles: [newDataset.mapbox_url],
                  tileSize: 256,
                })
              }

              // Add the raster layer if it doesn't exist
              if (!currentMap.getLayer(layerId)) {
                try {
                  currentMap.addLayer({
                    id: layerId,
                    type: "raster",
                    source: sourceId,
                    paint: {
                      "raster-opacity": 0.8,
                      "raster-fade-duration": 300,
                    },
                  })
                } catch (error) {
                  console.error("Error adding raster layer:", error)
                }
              }

              // Use the bounding box from the API response to set the map view
              if (newDataset.bounding_box) {
                const { minx, miny, maxx, maxy } = newDataset.bounding_box

                // Convert string values to numbers
                const bounds = new mapboxgl.LngLatBounds(
                  [Number.parseFloat(minx), Number.parseFloat(miny)],
                  [Number.parseFloat(maxx), Number.parseFloat(maxy)],
                )

                // Check if bounds are valid before fitting
                if (!bounds.isEmpty()) {
                  currentMap.fitBounds(bounds, {
                    padding: 50,
                    duration: 1000,
                    maxZoom: 15,
                  })
                } else {
                  console.warn("Invalid or empty bounding box received for raster dataset")
                }
              }

              // Show a success notification or feedback
              console.log(`Added raster layer to the map: ${newDataset.name}`)
            }

            // Check if the map is loaded and has a style
            if (currentMap.isStyleLoaded()) {
              addRasterLayerToMap()
            } else {
              // Wait for the style to load before adding the layer
              currentMap.once("style.load", addRasterLayerToMap)
            }
          } catch (error) {
            console.error("Error adding raster data to map:", error)
          }
        } else {
          console.warn("Dataset missing required data for visualization")
        }
      }
    }

    setShowAddDatasetDialog(false)
  }

  if (isLoading) {
    return (
      <div className="h-screen bg-[#1A1A1E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-500"></div>
      </div>
    )
  }

  if (!projectData) {
    return (
      <div className="h-screen bg-[#1A1A1E] flex items-center justify-center">
        <div className="text-white">Project not found</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header - Adjust padding and spacing */}
      <header className="relative z-30 flex h-14 items-center justify-between border-b border-border bg-[#1A1A1E] px-4 py-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="mr-1 h-7 w-7 p-0" asChild>
            <Link href="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="sr-only">Back to repositories</span>
            </Link>
          </Button>

          {/* Improved project title and description with better spacing */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-normal text-zinc-200">{projectData.name}</h1>
              <div className="flex items-center gap-1.5 rounded-md bg-[#2A2A2D] px-1.5 py-0.5 text-[10px]">
                <GitBranch className="h-3 w-3 text-zinc-400" />
                <span className="text-zinc-300">main</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 max-w-md line-clamp-1 mt-0.5">{projectData.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Update Add Dataset Button to match create project button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddDatasetDialog(true)}
                  className="h-6 px-2 bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                >
                  <FileUp className="mr-1 h-3 w-3" />
                  <span className="text-xs">Dataset</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Add a new dataset</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
          >
            <GitPullRequest className="mr-1 h-3 w-3" />
            PR
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* Main workspace - Map as full background */}
      <div className="relative flex-1 overflow-hidden">
        {/* Map container - Full size background */}
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <div ref={mapContainerRef} className="h-full w-full" />
        </div>

        {/* Workspace content overlaid on map */}
        <div className="relative z-10 flex h-full pointer-events-none">
          {/* Left sidebar - Version control */}
          <div
            className={`h-full flex-col border-r border-border bg-[#1A1A1E]/95 backdrop-blur-sm transition-all duration-300 pointer-events-auto ${
              leftPanelCollapsed ? "w-0" : "w-72"
            }`}
          >
            {!leftPanelCollapsed && (
              <>
                <div className="flex-1 overflow-hidden">
                  <VersionControl
                    onCompareVersions={toggleComparisonView}
                    commits={projectData.mapData.commits || []}
                  />
                </div>
              </>
            )}
            <div
              onClick={toggleLeftPanel}
              className={`absolute -right-8 top-1/2 z-20 flex h-10 w-8 -translate-y-1/2 transform cursor-pointer items-center justify-center rounded-r-md border border-border border-l-0 bg-[#2A2A2D]/90 shadow-md transition-all hover:bg-[#3A3A3D] pointer-events-auto`}
            >
              <ChevronLeft className={`h-5 w-5 transition-transform ${leftPanelCollapsed ? "-rotate-180" : ""}`} />
            </div>
          </div>

          {/* Right sidebar - LLM Assistant & Metadata */}
          <div
            className={`ml-auto h-full flex-col border-l border-border bg-[#1A1A1E]/95 backdrop-blur-sm transition-all duration-300 pointer-events-auto ${
              rightPanelCollapsed ? "w-0" : "w-80"
            }`}
          >
            {!rightPanelCollapsed && (
              <Tabs defaultValue="assistant" className="h-full">
                <TabsList className="grid w-full grid-cols-2 rounded-none border-b border-border bg-transparent p-0">
                  <TabsTrigger
                    value="assistant"
                    className="rounded-none border-b-2 border-transparent py-2.5 data-[state=active]:border-zinc-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                    <span className="text-xs">Assistant</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="datasets"
                    className="rounded-none border-b-2 border-transparent py-2.5 data-[state=active]:border-zinc-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <Layers className="mr-1.5 h-3.5 w-3.5" />
                    <span className="text-xs">Datasets</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="assistant" className="h-[calc(100%-41px)] p-0 overflow-hidden">
                  <LlmAssistant projectName={projectData.name} />
                </TabsContent>
                <TabsContent value="datasets" className="h-[calc(100%-41px)] p-0">
                  <DatasetInspector datasets={projectData.mapData.datasets || []} map={mapInstanceRef.current} />
                </TabsContent>
              </Tabs>
            )}
            <div
              onClick={toggleRightPanel}
              className={`absolute -left-8 top-1/2 z-20 flex h-10 w-8 -translate-y-1/2 transform cursor-pointer items-center justify-center rounded-l-md border border-border border-r-0 bg-[#2A2A2D]/90 shadow-md transition-all hover:bg-[#3A3A3D] pointer-events-auto`}
            >
              <ChevronRight className={`h-5 w-5 transition-transform ${rightPanelCollapsed ? "rotate-180" : ""}`} />
            </div>
          </div>
        </div>

        {/* Map toolbar */}
        <div className="pointer-events-auto">
          {mapInstanceRef.current && <MapToolbar map={mapInstanceRef.current} onCompareClick={toggleComparisonView} />}
        </div>

        {/* Comparison view */}
        {showComparison && <ComparisonView onClose={toggleComparisonView} projectData={projectData} />}
      </div>

      {/* Add Dataset Dialog */}
      <AddDatasetDialog
        open={showAddDatasetDialog}
        onOpenChange={setShowAddDatasetDialog}
        onAddDataset={handleAddDataset}
        projectId={projectData.id}
      />
    </div>
  )
}
