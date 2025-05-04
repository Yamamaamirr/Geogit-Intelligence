"use client"
import JSZip from "jszip"
import mapboxgl from "mapbox-gl"
import shp from "shpjs"

interface ShapefileProcessorProps {
  map: mapboxgl.Map | null
  onProcessComplete?: (result: any) => void
  onProcessError?: (error: Error) => void
}

export class ShapefileProcessor {api
  private map: mapboxgl.Map | null
  private onProcessComplete?: (result: any) => void
  private onProcessError?: (error: Error) => void
  private backendUrl = "http://10.7.237.128:5000/voronoi" // Updated endpoint URL

  constructor(
    map: mapboxgl.Map | null,
    onProcessComplete?: (result: any) => void,
    onProcessError?: (error: Error) => void,
  ) {
    this.map = map
    this.onProcessComplete = onProcessComplete
    this.onProcessError = onProcessError
  }

  async processShapefileResponse(responseData: ArrayBuffer) {
    try {
      // Log detailed information about the response
      console.log("📥 Response data type:", Object.prototype.toString.call(responseData))
      console.log("📥 Response data size:", responseData.byteLength, "bytes")

      // First try to parse as direct GeoJSON
      let geojson
      try {
        const textDecoder = new TextDecoder("utf-8")
        const jsonText = textDecoder.decode(responseData)
        console.log("📄 First few characters of response:", jsonText.substring(0, 100))

        try {
          geojson = JSON.parse(jsonText)
          console.log("✅ Successfully parsed response as direct GeoJSON")
        } catch (parseError) {
          console.log("❌ Not valid JSON, checking other formats")

          // Check if it's a text response with error message
          if (jsonText.includes("error") || jsonText.includes("Error") || jsonText.includes("exception")) {
            throw new Error(`Backend returned error: ${jsonText}`)
          }

          throw parseError // Re-throw to try next approach
        }
      } catch (jsonError) {
        console.log("❌ Response is not direct JSON, trying to process as binary data", jsonError)

        // Try to detect file type based on magic numbers/signatures
        const dataView = new DataView(responseData)
        const firstBytes = []
        for (let i = 0; i < Math.min(4, responseData.byteLength); i++) {
          firstBytes.push(dataView.getUint8(i).toString(16).padStart(2, "0"))
        }
        const signature = firstBytes.join("").toUpperCase()
        console.log("📝 File signature:", signature)

        // Check for ZIP signature (PK..)
        if (signature.startsWith("504B")) {
          console.log("📦 Detected ZIP file signature")
          try {
            // Process the ZIP file directly with JSZip without converting to Blob
            const zip = await JSZip.loadAsync(responseData)
            console.log("📦 Successfully loaded ZIP file")
            console.log("📦 ZIP contents:", Object.keys(zip.files))

            // Look for GeoJSON files first
            const geojsonFile = Object.keys(zip.files).find(
              (name) => name.toLowerCase().endsWith(".geojson") || name.toLowerCase().endsWith(".json"),
            )

            if (geojsonFile) {
              console.log("📄 Found GeoJSON file in ZIP:", geojsonFile)
              const content = await zip.files[geojsonFile].async("text")
              geojson = JSON.parse(content)
              console.log("✅ Successfully parsed GeoJSON from ZIP")
            } else {
              // If no GeoJSON, try to process as shapefile using shp.js
              console.log("🗺️ No GeoJSON found, trying to process as shapefile")

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

              await Promise.all(promises)

              // Check if we have the necessary shapefile components
              const hasShp = Object.keys(files).some((name) => name.toLowerCase().endsWith(".shp"))

              if (!hasShp) {
                throw new Error("No .shp file found in the ZIP")
              }

              // Use shp.js to process the files
              geojson = await shp(files)
              console.log("✅ Successfully parsed Shapefile from ZIP")
            }
          } catch (zipError) {
            console.error("❌ Error processing ZIP file:", zipError)
            throw new Error(`Failed to process ZIP file: ${zipError.message}`)
          }
        } else {
          // Not a ZIP file, try other formats or throw error
          console.error("❌ Response is not a ZIP file and not valid JSON")
          throw new Error("Response is not in a recognized format (not JSON, not ZIP)")
        }
      }

      if (!geojson || !geojson.features || geojson.features.length === 0) {
        throw new Error("No valid features found in response")
      }

      console.log("✅ Processed GeoJSON:", geojson)

      // Send the processed GeoJSON to the backend
      try {
        // Get the project ID from the URL or from a prop
        const urlParts = window.location.pathname.split('/')
        const projectIdIndex = urlParts.findIndex(part => part === 'projects') + 1
        const projectId = projectIdIndex > 0 && projectIdIndex < urlParts.length ? urlParts[projectIdIndex] : 'default'
        
        console.log(`📤 Sending processed GeoJSON to backend for project: ${projectId}`)
        
        // Create a FormData object to send to the backend
        const formData = new FormData()
        const geojsonBlob = new Blob([JSON.stringify(geojson)], { type: "application/geo+json" })
        const file = new File([geojsonBlob], `processed_result_${Date.now()}.geojson`, { type: "application/geo+json" })
        formData.append("file", file)
        
        // Send the request to the backend
        const endpoint = `http://10.7.237.128:5000/api/projects/${projectId}/upload/vector`
        console.log(`📤 Sending to endpoint: ${endpoint}`)
        
        const uploadResponse = await fetch(endpoint, {
          method: "POST",
          body: formData,
        })
        
        if (!uploadResponse.ok) {
          console.warn(`⚠️ Backend upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`)
          console.log("⚠️ Continuing with local display only")
        } else {
          const uploadResult = await uploadResponse.json()
          console.log("✅ Backend upload successful:", uploadResult)
          
          // You can update the geojson with any modifications from the backend if needed
          if (uploadResult.geometry_data) {
            geojson = uploadResult.geometry_data
          }
        }
      } catch (uploadError) {
        console.error("❌ Error uploading to backend:", uploadError)
        console.log("⚠️ Continuing with local display only")
      }

      // Continue with adding to the map as before
      if (this.map) {
        const sourceId = `processed-source-${Date.now()}`
        const layerId = `processed-layer-${Date.now()}`

        if (!this.map.getSource(sourceId)) {
          this.map.addSource(sourceId, {
            type: "geojson",
            data: geojson,
          })
        }

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

        if (!this.map.getLayer(layerId)) {
          this.map.addLayer({
            id: layerId,
            type: layerType as any,
            source: sourceId,
            paint: paint,
          })
        }

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
      console.error("❌ Error processing response:", error)
      if (this.onProcessError) {
        this.onProcessError(error instanceof Error ? error : new Error("Unknown error processing response"))
      }
      throw error
    }
  }

  // Check if all features in a GeoJSON have the same geometry type
  checkGeometryConsistency(geojson: any): { consistent: boolean; types: Set<string> } {
    if (!geojson || !geojson.features || geojson.features.length === 0) {
      return { consistent: true, types: new Set() }
    }

    const types = new Set<string>()

    geojson.features.forEach((feature: any) => {
      if (feature.geometry && feature.geometry.type) {
        // Group similar types (e.g., Point and MultiPoint are both "point" types)
        let baseType = feature.geometry.type
        if (baseType.startsWith("Multi")) {
          baseType = baseType.substring(5) // Remove "Multi" prefix
        }
        types.add(baseType)
      }
    })

    return {
      consistent: types.size === 1,
      types,
    }
  }

  async getLayerData(layerId: string): Promise<string | null> {
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
      const data = (source as any)._data
      if (!data) return null

      console.log(`🔍 Retrieved GeoJSON data for layer ${layerId}:`, data)

      // Return the GeoJSON as a JSON string
      return JSON.stringify(data)
    } catch (error) {
      console.error("Error getting layer data:", error)
      return null
    }
  }

  async processLayers(layers: Array<{ id: string; name: string }>, prompt: string) {
    try {
      // Create a FormData object to send to the backend
      const formData = new FormData()
      formData.append("prompt", prompt)

      console.log("🔍 FormData - Prompt:", prompt)
      console.log("🔍 FormData - Layers to process:", layers.length)

      // Get the actual layer data for each selected layer and check geometry consistency
      const layerGeometryTypes = new Map<string, Set<string>>()

      for (const layer of layers) {
        const geojsonString = await this.getLayerData(layer.id)
        if (geojsonString) {
          try {
            const geojson = JSON.parse(geojsonString)
            const { consistent, types } = this.checkGeometryConsistency(geojson)

            layerGeometryTypes.set(layer.name, types)

            if (!consistent) {
              console.warn(`⚠️ Layer ${layer.name} has mixed geometry types: ${Array.from(types).join(", ")}`)
            }

            // Create a File object from the GeoJSON string
            const file = new File([geojsonString], `${layer.name}.geojson`, { type: "application/geo+json" })
            formData.append("files", file)
            console.log(
              `🔍 FormData - Added file: ${layer.name}.geojson (${(geojsonString.length / 1024).toFixed(2)} KB) - Types: ${Array.from(types).join(", ")}`,
            )
          } catch (error) {
            console.error(`❌ Error parsing GeoJSON for layer ${layer.name}:`, error)
            throw new Error(`Failed to parse GeoJSON for layer ${layer.name}: ${error.message}`)
          }
        }
      }

      // Check if we have mixed geometry types across layers
      const allTypes = new Set<string>()
      layerGeometryTypes.forEach((types) => {
        types.forEach((type) => allTypes.add(type))
      })

      if (allTypes.size > 1) {
        console.warn(`⚠️ Selected layers have mixed geometry types: ${Array.from(allTypes).join(", ")}`)
        console.warn("⚠️ This might cause issues with the backend processing")
      }

      // Log all entries in the FormData (for debugging)
      console.log("🔍 FormData - All entries:")
      for (const pair of formData.entries()) {
        if (pair[1] instanceof File) {
          const file = pair[1] as File
          console.log(`   ${pair[0]}: File - ${file.name}, ${file.size} bytes, ${file.type}`)
        } else {
          console.log(`   ${pair[0]}: ${pair[1]}`)
        }
      }

      // Send the request to the backend
      console.log(`📤 Sending request to backend at: ${this.backendUrl}`)
      const response = await fetch(this.backendUrl, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = `Server responded with ${response.status}: ${response.statusText}`

        try {
          const errorText = await response.text()
          errorMessage += `. Details: ${errorText}`

          // Check for specific geometry type mismatch error
          if (errorText.includes("Attempt to write non-point") && errorText.includes("to point shapefile")) {
            errorMessage = `Geometry type mismatch: The backend cannot process mixed geometry types. Please select layers with the same geometry type (all points, all lines, or all polygons).`
          }
        } catch (e) {
          // If we can't read the error text, just use the status
        }

        throw new Error(errorMessage)
      }

      // Get the response as an ArrayBuffer
      const responseData = await response.arrayBuffer()
      console.log(`📥 Received response: ${responseData.byteLength} bytes`)

      // Process the response
      const result = await this.processShapefileResponse(responseData)
      return result
    } catch (error) {
      console.error("❌ Error sending layers to backend:", error)
      if (this.onProcessError) {
        this.onProcessError(error instanceof Error ? error : new Error("Unknown error sending layers to backend"))
      }
      throw error
    }
  }
}
