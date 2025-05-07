"use client"
import type mapboxgl from "mapbox-gl"

interface ShapefileProcessorProps {
  map: mapboxgl.Map | null
  onProcessComplete?: (result: any) => void
  onProcessError?: (error: Error) => void
  projectId?: string
  onAddDataset?: (dataset: any) => void
}

export class ShapefileProcessor {
  private map: mapboxgl.Map | null
  private onProcessComplete?: (result: any) => void
  private onProcessError?: (error: Error) => void
  private backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/voronoi` // Updated endpoint URL
  private projectId: string
  private onAddDataset?: (dataset: any) => void

  constructor(
    map: mapboxgl.Map | null,
    onProcessComplete?: (result: any) => void,
    onProcessError?: (error: Error) => void,
    projectId = "default",
    onAddDataset?: (dataset: any) => void,
  ) {
    this.map = map
    this.onProcessComplete = onProcessComplete
    this.onProcessError = onProcessError
    this.projectId = projectId
    this.onAddDataset = onAddDataset
  }

  async processShapefileResponse(responseData: ArrayBuffer) {
    const dataset = {
      id: responseData.id || `d${Date.now()}`,
      name: responseData.name || "untitled",
      type: responseData.type || "vector",
      format: (responseData.format || "geojson").toLowerCase(),
      crs: responseData.crs || "EPSG:4326",
      status: "new",
      visible: true, // Explicitly set visibility to true for new datasets
      version_number: responseData.version_number || "1",
      geometry_data: responseData.geometry_data || {
        type: "FeatureCollection",
        features: [],
      },
      features_count: responseData.features_count || 0,
    }

    // Add type-specific properties
    if (dataset.type === "vector") {
      dataset.geometry_data = responseData.geometry_data || {
        type: "FeatureCollection",
        features: [],
      }
      dataset.features_count = responseData.features_count || 0
    } else if (dataset.type === "raster") {
      dataset.mapbox_url = responseData.mapbox_url || ""
      dataset.bounding_box = responseData.bounding_box || null
      dataset.file_path = responseData.file_path || ""

      // Log raster dataset details for debugging
      console.log("Processing raster dataset:", {
        id: dataset.id,
        name: dataset.name,
        mapbox_url: dataset.mapbox_url,
      })
    }

    // Call through the class instance
    if (this.onAddDataset) {
      this.onAddDataset(dataset)
    }

    return dataset
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
      console.log(layer)

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

  async processLayers(layers: Array<{ id: string; name: string; type: string; format?: string }>, prompt: string) {
    try {
      const file_inputs = layers.map((layer) => ({
        id: layer.id,
        type: layer.type, // "vector" or "raster"
      }))

      // Construct the JSON payload
      const payload = {
        project_id: this.projectId,
        file_inputs,
        prompt,
      }

      console.log("📤 Payload to send:", payload)

      const response = await fetch(this.backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
      const responseData = await response.json() // ✅ Correct for JSON APIs
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

  async processTextPrompt(prompt: string) {
    try {
      if (!prompt.trim()) {
        throw new Error("Empty prompt provided")
      }

      console.log(`📤 Sending text prompt to backend: "${prompt}"`)

      // Create a FormData object with just the prompt
      const formData = new FormData()
      formData.append("prompt", prompt)
      formData.append("type", "text_only")

      // Send the request to the backend
      const response = await fetch(this.backendUrl, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = `Server responded with ${response.status}: ${response.statusText}`
        try {
          const errorText = await response.text()
          errorMessage += `. Details: ${errorText}`
        } catch (e) {
          // If we can't read the error text, just use the status
        }
        throw new Error(errorMessage)
      }

      // Try to parse the response as JSON first
      try {
        const jsonResponse = await response.json()
        console.log("📥 Received JSON response:", jsonResponse)
        return {
          success: true,
          message: jsonResponse.message || "I've processed your request successfully.",
          details: jsonResponse.details || "",
          data: jsonResponse,
        }
      } catch (jsonError) {
        // If not JSON, try to get as text
        const textResponse = await response.text()
        console.log("📥 Received text response:", textResponse)
        return {
          success: true,
          message: "I've processed your request successfully.",
          details: textResponse.substring(0, 500), // Limit the length
          data: { text: textResponse },
        }
      }
    } catch (error) {
      console.error("❌ Error processing text prompt:", error)
      throw error
    }
  }
}
