"use client"
import JSZip from "jszip"
import type mapboxgl from "mapbox-gl"
import shp from "shpjs"

interface ShapefileProcessorProps {
  map: mapboxgl.Map | null
  onProcessComplete?: (result: any) => void
  onProcessError?: (error: Error) => void
}

export class ShapefileProcessor {
  private map: mapboxgl.Map | null
  private onProcessComplete?: (result: any) => void
  private onProcessError?: (error: Error) => void

  constructor(
    map: mapboxgl.Map | null,
    onProcessComplete?: (result: any) => void,
    onProcessError?: (error: Error) => void,
  ) {
    this.map = map
    this.onProcessComplete = onProcessComplete
    this.onProcessError = onProcessError
  }

  // This function processes shapefile data from the backend response
  async processShapefileResponse(responseData: ArrayBuffer) {
    try {
      // Parse the shapefile data from the response
      const zip = await JSZip.loadAsync(responseData)

      // Extract all files from the zip
      const files: Record<string, ArrayBuffer> = {}
      const promises: Promise<void>[] = []

      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          const promise = zipEntry.async("arraybuffer").then((content) => {
            files[relativePath] = content
          })
          promises.push(promise)
        }
      })

      // Wait for all files to be extracted
      await Promise.all(promises)

      // Convert the shapefile to GeoJSON using shpjs
      const geojson = await shp.parseShp(files)

      if (!geojson || !geojson.features || geojson.features.length === 0) {
        throw new Error("No valid features found in shapefile")
      }

      console.log("Processed GeoJSON:", geojson)

      // Add the GeoJSON to the map
      if (this.map) {
        const sourceId = `processed-source-${Date.now()}`
        const layerId = `processed-layer-${Date.now()}`

        // Add source if it doesn't exist
        if (!this.map.getSource(sourceId)) {
          this.map.addSource(sourceId, {
            type: "geojson",
            data: geojson,
          })
        }

        // Determine the geometry type to choose the appropriate layer type
        const geometryType = geojson.features[0].geometry.type
        let layerType = "fill"
        let paint: any = {
          "fill-color": "#3b82f6",
          "fill-opacity": 0.6,
          "fill-outline-color": "#2563eb",
        }

        if (geometryType === "Point" || geometryType === "MultiPoint") {
          layerType = "circle"
          paint = {
            "circle-radius": 6,
            "circle-color": "#3b82f6",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#2563eb",
          }
        } else if (geometryType === "LineString" || geometryType === "MultiLineString") {
          layerType = "line"
          paint = {
            "line-color": "#3b82f6",
            "line-width": 2,
          }
        }

        // Add layer if it doesn't exist
        if (!this.map.getLayer(layerId)) {
          this.map.addLayer({
            id: layerId,
            type: layerType as any,
            source: sourceId,
            paint: paint,
          })
        }

        // Fit the map to the bounds of the new layer
        const bounds = new mapboxgl.LngLatBounds()
        let hasBounds = false

        geojson.features.forEach((feature: any) => {
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

        if (hasBounds && !bounds.isEmpty()) {
          this.map.fitBounds(bounds, {
            padding: 50,
            duration: 1000,
          })
        }
      }

      // Call the completion callback
      if (this.onProcessComplete) {
        this.onProcessComplete({
          sourceId,
          layerId,
          geojson,
        })
      }

      return {
        sourceId,
        layerId,
        geojson,
      }
    } catch (error) {
      console.error("Error processing shapefile:", error)
      if (this.onProcessError) {
        this.onProcessError(error instanceof Error ? error : new Error("Unknown error processing shapefile"))
      }
      throw error
    }
  }

  // This function extracts layer data from the map
  async getLayerData(layerId: string): Promise<ArrayBuffer | null> {
    if (!this.map) return null

    try {
      // Get the source for this layer
      const layer = this.map.getLayer(layerId)
      if (!layer) return null

      const sourceId = layer.source as string
      if (!sourceId) return null

      const source = this.map.getSource(sourceId) as mapboxgl.GeoJSONSource
      if (!source) return null

      // Get the GeoJSON data from the source
      // Note: This is a workaround as Mapbox GL JS doesn't provide a direct way to get source data
      // In a real implementation, you would likely store this data in your application state
      const data = (source as any)._data

      if (!data) return null

      // Convert GeoJSON to shapefile using shpjs
      const shpBuffer = await shp.download(data)

      // Create a ZIP file containing the shapefile
      const zip = new JSZip()

      // Add all files from the shapefile buffer to the ZIP
      for (const fileName in shpBuffer) {
        zip.file(fileName, shpBuffer[fileName])
      }

      // Generate the ZIP file
      const zipBuffer = await zip.generateAsync({ type: "arraybuffer" })

      return zipBuffer
    } catch (error) {
      console.error("Error getting layer data:", error)
      return null
    }
  }

  // This function sends selected layers to the backend for processing
  async processLayers(layers: Array<{ id: string; name: string }>, prompt: string) {
    try {
      // Create a FormData object to send to the backend
      const formData = new FormData()
      formData.append("prompt", prompt)

      // Get the actual layer data for each selected layer
      for (const layer of layers) {
        const layerData = await this.getLayerData(layer.id)
        if (layerData) {
          // Create a File object from the ArrayBuffer
          const file = new File([layerData], `${layer.name}.zip`, { type: "application/zip" })
          formData.append("files", file)
        }
      }

      // Send the request to the backend
      const response = await fetch("/voronoi", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`)
      }

      // Get the response as an ArrayBuffer
      const responseData = await response.arrayBuffer()

      // Process the shapefile response
      const result = await this.processShapefileResponse(responseData)
      return result
    } catch (error) {
      console.error("Error sending layers to backend:", error)
      if (this.onProcessError) {
        this.onProcessError(error instanceof Error ? error : new Error("Unknown error sending layers to backend"))
      }
      throw error
    }
  }
}
