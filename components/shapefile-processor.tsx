"use client"
import da from "date-fns/esm/locale/da/index.js"
import JSZip from "jszip"
import mapboxgl from "mapbox-gl"
import shp from "shpjs"

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
    projectId: string = "default",
    onAddDataset?: (dataset: any) => void
  ) {
    this.map = map
    this.onProcessComplete = onProcessComplete
    this.onProcessError = onProcessError
    this.projectId = projectId
    this.onAddDataset = onAddDataset
  }

  async processShapefileResponse(responseData: ArrayBuffer) {

const dataset = {
  id: responseData.id || `d${Date.now()}`,       // Fixed: Use `id` instead of `version_id`
  name: responseData.name || 'untitled',        // More neutral fallback
  type: responseData.type || "vector",
  format: (responseData.format || 'geojson').toLowerCase(), // Standardize to lowercase
  crs: responseData.crs || 'EPSG:4326',
  status: "new",
  version_number: responseData.version_number || "1", // Keep as string
  geometry_data: responseData.geometry_data || { 
    type: "FeatureCollection", 
    features: [] 
  },
  features_count: responseData.features_count || 0
};

  // Add type-specific properties
  if (dataset.type === "vector") {
    dataset.geometry_data = responseData.geometry_data || { 
      type: "FeatureCollection", 
      features: [] 
    };
    dataset.features_count = responseData.features_count || 0;
  } else if (dataset.type === "raster") {
    dataset.mapbox_url = responseData.mapbox_url || '';
    dataset.bounding_box = responseData.bounding_box || null;
    dataset.file_path = responseData.file_path || '';
  }

  // Call through the class instance
  if (this.onAddDataset) {
    this.onAddDataset(dataset);
  }

    // try {
    //   // Log detailed information about the response
    //   console.log("📥 Response data type:", Object.prototype.toString.call(responseData))
    //   console.log("📥 Response data size:", responseData.byteLength, "bytes")

    //   // First try to parse as direct GeoJSON
    //   let geojson
    //   try {
    //     const textDecoder = new TextDecoder("utf-8")
    //     const jsonText = textDecoder.decode(responseData)
    //     console.log("📄 First few characters of response:", jsonText.substring(0, 100))

    //     try {
    //       geojson = JSON.parse(jsonText)
    //       console.log("✅ Successfully parsed response as direct GeoJSON")
    //     } catch (parseError) {
    //       console.log("❌ Not valid JSON, checking other formats")

    //       // Check if it's a text response with error message
    //       if (jsonText.includes("error") || jsonText.includes("Error") || jsonText.includes("exception")) {
    //         throw new Error(`Backend returned error: ${jsonText}`)
    //       }

    //       throw parseError // Re-throw to try next approach
    //     }
    //   } catch (jsonError) {
    //     console.log("❌ Response is not direct JSON, trying to process as binary data", jsonError)

    //     // Try to detect file type based on magic numbers/signatures
    //     const dataView = new DataView(responseData)
    //     const firstBytes = []
    //     for (let i = 0; i < Math.min(4, responseData.byteLength); i++) {
    //       firstBytes.push(dataView.getUint8(i).toString(16).padStart(2, "0"))
    //     }
    //     const signature = firstBytes.join("").toUpperCase()
    //     console.log("📝 File signature:", signature)

    //     // Check for ZIP signature (PK..)
    //     if (signature.startsWith("504B")) {
    //       console.log("📦 Detected ZIP file signature")
    //       try {
    //         // Process the ZIP file directly with JSZip without converting to Blob
    //         const zip = await JSZip.loadAsync(responseData)
    //         console.log("📦 Successfully loaded ZIP file")
    //         console.log("📦 ZIP contents:", Object.keys(zip.files))

    //         // Look for GeoJSON files first
    //         const geojsonFile = Object.keys(zip.files).find(
    //           (name) => name.toLowerCase().endsWith(".geojson") || name.toLowerCase().endsWith(".json"),
    //         )

    //         if (geojsonFile) {
    //           console.log("📄 Found GeoJSON file in ZIP:", geojsonFile)
    //           const content = await zip.files[geojsonFile].async("text")
    //           geojson = JSON.parse(content)
    //           console.log("✅ Successfully parsed GeoJSON from ZIP")
    //         } else {
    //           // If no GeoJSON, try to process as shapefile using shp.js
    //           console.log("🗺️ No GeoJSON found, trying to process as shapefile")

    //           // Extract all files from the zip
    //           const files: Record<string, ArrayBuffer> = {}
    //           const promises: Promise<void>[] = []

    //           zip.forEach((relativePath, zipEntry) => {
    //             if (!zipEntry.dir) {
    //               const promise = zipEntry.async("arraybuffer").then((content) => {
    //                 files[relativePath] = content
    //               })
    //               promises.push(promise)
    //             }
    //           })

    //           await Promise.all(promises)

    //           // Check if we have the necessary shapefile components
    //           const hasShp = Object.keys(files).some((name) => name.toLowerCase().endsWith(".shp"))

    //           if (!hasShp) {
    //             throw new Error("No .shp file found in the ZIP")
    //           }

    //           // Use shp.js to process the files
    //           geojson = await shp(files)
    //           console.log("✅ Successfully parsed Shapefile from ZIP")
    //         }
    //       } catch (zipError) {
    //         console.error("❌ Error processing ZIP file:", zipError)
    //         throw new Error(`Failed to process ZIP file: ${zipError.message}`)
    //       }
    //     } else {
    //       // Not a ZIP file, try other formats or throw error
    //       console.error("❌ Response is not a ZIP file and not valid JSON")
    //       throw new Error("Response is not in a recognized format (not JSON, not ZIP)")
    //     }
    //   }

    //   if (!geojson || !geojson.features || geojson.features.length === 0) {
    //     throw new Error("No valid features found in response")
    //   }

    //   console.log("✅ Processed GeoJSON:", geojson)

    //   // Send the processed GeoJSON to the backend
    //   try {
    //     // Use the projectId from the class property instead of extracting from URL
    //     console.log(`📤 Sending processed GeoJSON to backend for project: ${this.projectId}`)

    //     // Create a FormData object to send to the backend
    //     const formData = new FormData()
    //     const geojsonBlob = new Blob([JSON.stringify(geojson)], { type: "application/geo+json" })
    //     const file = new File([geojsonBlob], `processed_result_${Date.now()}.geojson`, { type: "application/geo+json" })
    //     formData.append("file", file)

    //     // Send the request to the backend
    //     const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${this.projectId}/upload/vector`
    //     console.log(`📤 Sending to endpoint: ${endpoint}`)

    //     const uploadResponse = await fetch(endpoint, {
    //       method: "POST",
    //       body: formData,
    //     })

    //     if (!uploadResponse.ok) {
    //       console.warn(`⚠️ Backend upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`)
    //       console.log("⚠️ Continuing with local display only")
    //     } else {
    //       const uploadResult = await uploadResponse.json()
    //       console.log("✅ Backend upload successful:", uploadResult)

    //       // You can update the geojson with any modifications from the backend if needed
    //       if (uploadResult.geometry_data) {
    //         geojson = uploadResult.geometry_data
    //       }
    //     }
    //   } catch (uploadError) {
    //     console.error("❌ Error uploading to backend:", uploadError)
    //     console.log("⚠️ Continuing with local display only")
    //   }


      //  const dataset = {
      //     id: uploadResponse.version_id || `d${Date.now()}`,
      //     name: uploadResponse.name,
      //     type: uploadResponse.type,
      //     format: datasetForm.format,
      //     crs: datasetForm.crs,
      //     status: "new",
      //     version_number: responseData.version_number || "1",
      //   }

        // // Add type-specific properties
        // if (datasetForm.type === "vector") {
        //   dataset.geometry_data = responseData.geometry_data || { 
        //     type: "FeatureCollection", 
        //     features: [] 
        //   }
        //   dataset.features_count = responseData.features_count || 0
        // // } else if (datasetForm.type === "raster") {
        // //   dataset.mapbox_url = responseData.mapbox_url
        // //   dataset.bounding_box = responseData.bounding_box
        // //   dataset.file_path = responseData.file_path
        // // }
        // }
      // Continue with adding to the map as before
      // if (this.map) {
      //   const sourceId = `processed-source-${Date.now()}`
      //   const layerId = `processed-layer-${Date.now()}`

      //   if (!this.map.getSource(sourceId)) {
      //     this.map.addSource(sourceId, {
      //       type: "geojson",
      //       data: geojson,
      //     })
      //   }

      //   const geometryType = geojson.features[0].geometry.type
      //   let layerType = "fill"
      //   let paint: any = {
      //     "fill-color": "#3b82f6",
      //     "fill-opacity": 0.6,
      //     "fill-outline-color": "#2563eb",
      //   }

      //   if (geometryType === "Point" || geometryType === "MultiPoint") {
      //     layerType = "circle"
      //     paint = {
      //       "circle-radius": 6,
      //       "circle-color": "#3b82f6",
      //       "circle-stroke-width": 1,
      //       "circle-stroke-color": "#2563eb",
      //     }
      //   } else if (geometryType === "LineString" || geometryType === "MultiLineString") {
      //     layerType = "line"
      //     paint = {
      //       "line-color": "#3b82f6",
      //       "line-width": 2,
      //     }
      //   }

      //   if (!this.map.getLayer(layerId)) {
      //     this.map.addLayer({
      //       id: layerId,
      //       type: layerType as any,
      //       source: sourceId,
      //       paint: paint,
      //     })
      //   }

      //   const bounds = new mapboxgl.LngLatBounds()
      //   let hasBounds = false

      //   geojson.features.forEach((feature: any) => {
      //     if (feature.geometry) {
      //       try {
      //         if (feature.geometry.type === "Point") {
      //           bounds.extend(feature.geometry.coordinates)
      //           hasBounds = true
      //         } else if (feature.geometry.type === "LineString") {
      //           feature.geometry.coordinates.forEach((coord: [number, number]) => {
      //             bounds.extend(coord)
      //             hasBounds = true
      //           })
      //         } else if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
      //           const processCoords = (coords: any[]) => {
      //             coords.forEach((coord: any) => {
      //               if (Array.isArray(coord[0])) {
      //                 processCoords(coord)
      //               } else {
      //                 bounds.extend(coord as [number, number])
      //                 hasBounds = true
      //               }
      //             })
      //           }
      //           processCoords(feature.geometry.coordinates)
      //         }
      //       } catch (error) {
      //         console.warn(`Error processing feature geometry: ${error}`)
      //       }
      //     }
      //   })

      //   if (hasBounds && !bounds.isEmpty()) {
      //     this.map.fitBounds(bounds, {
      //       padding: 50,
      //       duration: 1000,
      //     })
      //   }
      // }

    //   if (this.onProcessComplete) {
    //     this.onProcessComplete({
    //       geojson,
    //     })
    //   }

    //   return {
    //     geojson,
    //   }
    // } catch (error) {
    //   console.error("❌ Error processing response:", error)
    //   if (this.onProcessError) {
    //     this.onProcessError(error instanceof Error ? error : new Error("Unknown error processing response"))
    //   }
    //   throw error
    // }
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
console.log(layer);

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

 const file_inputs = layers.map(layer => ({
      id: layer.id,
      type: layer.type  // "vector" or "raster"
    }));

    // Construct the JSON payload
    const payload = {
      project_id: this.projectId,
      file_inputs,
      prompt
    };

    console.log("📤 Payload to send:", payload);

      const response = await fetch(this.backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

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
const responseData = await response.json(); // ✅ Correct for JSON APIs
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
