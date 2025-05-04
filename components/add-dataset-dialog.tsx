"use client"

import type React from "react"

import { useState, useRef } from "react"
import { FileUp, Upload, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface AddDatasetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddDataset: (dataset: any) => void
  projectId: string
}

export function AddDatasetDialog({ open, onOpenChange, onAddDataset, projectId }: AddDatasetDialogProps) {
  const [datasetForm, setDatasetForm] = useState({
    name: "",
    type: "vector",
    format: "GeoJSON",
    crs: "EPSG:4326",
  })
  const [connectionForm, setConnectionForm] = useState({
    name: "",
    type: "wfs",
    url: "",
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update the validateFileType function to better handle ZIP files for shapefiles
  const validateFileType = (file: File): boolean => {
    const { type, format } = datasetForm
    const extension = file.name.split(".").pop()?.toLowerCase()

    if (type === "vector") {
      if (format === "GeoJSON" && !["geojson", "json"].includes(extension || "")) return false
      if (format === "Shapefile" && extension !== "zip") {
        console.warn(
          "Shapefiles must be uploaded as ZIP archives containing all required files (.shp, .dbf, .shx, etc.)",
        )
        return false
      }
      if (format === "KML" && extension !== "kml") return false
      return true
    } else if (type === "raster") {
      if (format === "GeoTIFF" && !["tif", "tiff"].includes(extension || "")) return false
      return true
    }

    return false
  }

  const handleDatasetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setDatasetForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleConnectionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setConnectionForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleDatasetTypeChange = (value: string) => {
    setDatasetForm((prev) => ({
      ...prev,
      type: value,
      format: value === "vector" ? "GeoJSON" : "GeoTIFF",
    }))
    // Clear selected file when changing type
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleConnectionTypeChange = (value: string) => {
    setConnectionForm((prev) => ({ ...prev, type: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setSelectedFile(file)

      // Auto-set name if not already set
      if (!datasetForm.name) {
        // Remove file extension for name
        const fileName = file.name.replace(/\.[^/.]+$/, "")
        setDatasetForm((prev) => ({
          ...prev,
          name: fileName,
        }))
      }

      // Auto-detect format based on file extension
      const extension = file.name.split(".").pop()?.toLowerCase()
      if (extension) {
        if (["geojson", "json"].includes(extension)) {
          setDatasetForm((prev) => ({ ...prev, format: "GeoJSON" }))
        } else if (["shp", "zip"].includes(extension)) {
          setDatasetForm((prev) => ({ ...prev, format: "Shapefile" }))
        } else if (["kml"].includes(extension)) {
          setDatasetForm((prev) => ({ ...prev, format: "KML" }))
        } else if (["tif", "tiff"].includes(extension)) {
          setDatasetForm((prev) => ({ ...prev, type: "raster", format: "GeoTIFF" }))
        }
      }
    }
  }

  // Fixed function to properly trigger file input click
  const handleBrowseClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Directly trigger click on the file input
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Update the handleUploadSubmit function to properly handle file uploads
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      setUploadError("Please select a file to upload")
      return
    }

    if (!validateFileType(selectedFile)) {
      setUploadError(`Invalid file type for ${datasetForm.type} dataset. Please select a supported file.`)
      return
    }

    if (!datasetForm.name) {
      setUploadError("Please provide a name for the dataset")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadError(null)

    // Create a new FormData instance
    const formData = new FormData()

    // CRITICAL: Append the file with the exact field name 'file' expected by the backend
    formData.append("file", selectedFile)

    // Debug log the file being uploaded
    console.log("Uploading file:", {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type
    })

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + Math.random() * 10
        return newProgress > 90 ? 90 : newProgress
      })
    }, 300)

    try {
      // Send to the appropriate endpoint based on type
      // IMPORTANT: Use relative URL instead of absolute with localhost
      const endpoint = `http://10.7.237.128:5000/api/projects/${projectId}/upload/${datasetForm.type.toLowerCase()}`

      console.log("Sending request to:", endpoint)

      // IMPORTANT: Do not set any headers manually - let the browser handle it
      const response = await fetch(endpoint, {
        method: "POST",
        // Do NOT set Content-Type header - browser will set it correctly with boundary
        body: formData,
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        let errorMessage = "Failed to upload dataset"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (e) {
          // If the error response is not valid JSON
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const responseData = await response.json()
      console.log("Server response:", responseData)

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Wait a moment to show 100% progress
      setTimeout(() => {
        // Create the dataset object based on the type
        const dataset = {
          id: responseData.version_id || `d${Date.now()}`,
          name: datasetForm.name,
          type: datasetForm.type,
          format: datasetForm.format,
          crs: datasetForm.crs,
          status: "new",
          version_number: responseData.version_number || "1",
        }

        // Add type-specific properties
        if (datasetForm.type === "vector") {
          dataset.geometry_data = responseData.geometry_data || { 
            type: "FeatureCollection", 
            features: [] 
          }
          dataset.features_count = responseData.features_count || 0
        } else if (datasetForm.type === "raster") {
          dataset.mapbox_url = responseData.mapbox_url
          dataset.bounding_box = responseData.bounding_box
          dataset.file_path = responseData.file_path
        }

        // Pass the dataset to the parent component
        onAddDataset(dataset)

        // Reset form
        setDatasetForm({
          name: "",
          type: "vector",
          format: "GeoJSON",
          crs: "EPSG:4326",
        })
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        setIsUploading(false)
        setUploadProgress(0)

        // Close dialog
        onOpenChange(false)
      }, 500)
    } catch (error) {
      console.error("API call failed:", error)
      clearInterval(progressInterval)
      setUploadProgress(0)
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload dataset. Please check if the server is running.",
      )
      setIsUploading(false)
    }
  }

  const handleConnectionSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddDataset(connectionForm)
    onOpenChange(false)
  }

  // Update the file input to explicitly handle ZIP files for shapefiles
  const getAcceptAttribute = () => {
    if (datasetForm.type === "vector") {
      if (datasetForm.format === "Shapefile") return ".zip"
      if (datasetForm.format === "GeoJSON") return ".geojson,.json"
      if (datasetForm.format === "KML") return ".kml"
      return ".geojson,.json,.zip,.kml"
    } else {
      return ".tif,.tiff"
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (isUploading) return // Prevent closing while uploading
        onOpenChange(newOpen)
        // Reset state when dialog closes
        if (!newOpen) {
          setUploadError(null)
          setUploadProgress(0)
          setSelectedFile(null)
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px] p-0 bg-zinc-900 border-zinc-800 overflow-hidden">
        <DialogHeader className="border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-800 px-4 py-3">
          <DialogTitle className="text-base font-medium flex items-center">
            <FileUp className="mr-2 h-4 w-4 text-zinc-400" />
            Add New Dataset
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 mt-0.5">
            Upload a new geospatial dataset to your project
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-3">
          {uploadError && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-400 py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs ml-2">{uploadError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleUploadSubmit}>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="dataset-name" className="text-xs">
                  Dataset Name
                </Label>
                <Input
                  id="dataset-name"
                  name="name"
                  value={datasetForm.name}
                  onChange={handleDatasetInputChange}
                  placeholder="Enter dataset name"
                  className="h-8 bg-zinc-800 border-zinc-700 text-sm"
                  required
                  disabled={isUploading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dataset-type" className="text-xs">
                  Dataset Type
                </Label>
                <Select value={datasetForm.type} onValueChange={handleDatasetTypeChange} disabled={isUploading}>
                  <SelectTrigger id="dataset-type" className="h-8 bg-zinc-800 border-zinc-700 text-sm">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vector">Vector</SelectItem>
                    <SelectItem value="raster">Raster</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dataset-format" className="text-xs">
                  Format
                </Label>
                <Select
                  value={datasetForm.format}
                  onValueChange={(value) => setDatasetForm((prev) => ({ ...prev, format: value }))}
                  disabled={isUploading}
                >
                  <SelectTrigger id="dataset-format" className="h-8 bg-zinc-800 border-zinc-700 text-sm">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasetForm.type === "vector" ? (
                      <>
                        <SelectItem value="GeoJSON">GeoJSON</SelectItem>
                        <SelectItem value="Shapefile">Shapefile (ZIP)</SelectItem>
                        <SelectItem value="KML">KML</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="GeoTIFF">GeoTIFF</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Update the file drop area to provide better guidance for shapefile uploads */}
              <div className="space-y-1.5">
                <Label className="text-xs">Upload File</Label>

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept={getAcceptAttribute()}
                  disabled={isUploading}
                />

                {/* File drop area */}
                <div
                  className={`border border-dashed ${selectedFile ? "border-zinc-600" : "border-zinc-700"} rounded-md p-4 flex flex-col items-center justify-center bg-zinc-800/50 transition-colors hover:bg-zinc-800 hover:border-zinc-600 ${isUploading ? "opacity-70 pointer-events-none" : ""}`}
                >
                  {selectedFile ? (
                    <>
                      <FileUp className="h-8 w-8 text-zinc-400 mb-2" />
                      <p className="text-sm text-zinc-300 mb-1">{selectedFile.name}</p>
                      <p className="text-[10px] text-zinc-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>

                      {/* Add guidance for shapefile uploads */}
                      {datasetForm.format === "Shapefile" && selectedFile.name.toLowerCase().endsWith(".zip") && (
                        <p className="text-[10px] text-blue-400 mt-1">
                          ZIP file detected. Make sure it contains .shp, .dbf, and .shx files.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-zinc-500/70 mb-2" />
                      <p className="text-sm text-zinc-300 mb-1.5">Drag and drop a file, or click to browse</p>
                      <p className="text-[10px] text-zinc-500 mb-3">
                        {datasetForm.format === "Shapefile" ? (
                          <span className="text-blue-400">
                            Upload a .ZIP file containing your shapefile (.shp, .dbf, .shx, etc.)
                          </span>
                        ) : (
                          <>
                            Supported formats:{" "}
                            {datasetForm.type === "vector"
                              ? datasetForm.format === "GeoJSON"
                                ? ".geojson, .json"
                                : datasetForm.format === "KML"
                                  ? ".kml"
                                  : ".geojson, .json, .zip (shapefile), .kml"
                              : ".tif, .tiff"}
                          </>
                        )}
                      </p>
                    </>
                  )}

                  {/* Separate button that's not inside the drop area */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-zinc-700 bg-zinc-800/80"
                    onClick={handleBrowseClick}
                    disabled={isUploading}
                  >
                    {selectedFile ? "Change File" : "Select File"}
                  </Button>
                </div>
              </div>

              {isUploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">Upload Progress</Label>
                    <span className="text-xs text-zinc-400">{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-1.5 bg-zinc-800 [&>div]:bg-zinc-400" />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-zinc-700"
                  onClick={() => onOpenChange(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
                  disabled={isUploading || !selectedFile}
                >
                  {isUploading ? (
                    <>
                      <div className="mr-1.5 h-3 w-3 animate-spin rounded-full border-2 border-t-transparent"></div>
                      Uploading...
                    </>
                  ) : (
                    "Upload Dataset"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
