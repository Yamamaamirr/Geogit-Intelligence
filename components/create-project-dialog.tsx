"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Upload } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    thumbnail: null,
  })
  const router = useRouter()
  const [apiError, setApiError] = useState<string | null>(null)

  const creationMessages = [
    "Initializing repository...",
    "Setting up project structure...",
    "Configuring map environment...",
    "Preparing version control...",
    "Creating workspace...",
    "Almost ready...",
  ]

  useEffect(() => {
    if (!isCreating) return

    // Message rotation
    const messageInterval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % creationMessages.length)
    }, 1500)

    return () => {
      clearInterval(messageInterval)
    }
  }, [isCreating, creationMessages.length])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setIsCreating(true)
    setApiError(null)

    let progressInterval: NodeJS.Timeout | null = null

    try {
      // Start the progress animation
      setProgress(0)

      // Simulate progress during API call
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          // Cap at 90% until we get the response
          return Math.min(90, prev + (prev < 70 ? 2 : 0.5))
        })
      }, 100)

      // Make the API request directly to your endpoint
      const response = await fetch("http://localhost:5000/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
        }),
      })

      // Process the response
      if (!response.ok) {
        if (progressInterval) clearInterval(progressInterval)
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create project")
      }

      const projectData = await response.json()
      console.log("Project created successfully:", projectData)

      // Complete the progress
      if (progressInterval) clearInterval(progressInterval)
      setProgress(100)

      // Wait a moment to show 100% before redirecting
      setTimeout(() => {
        setIsSubmitting(false)
        setIsCreating(false)
        setOpen(false)

        // Redirect to the map page with project details from the API response
        if (projectData && projectData.id) {
          const url = `/project/${projectData.id}?name=${encodeURIComponent(projectData.name)}&description=${encodeURIComponent(projectData.description || "")}`
          console.log("Redirecting to:", url)
          router.push(url)
        } else {
          throw new Error("Invalid project data received from server")
        }
      }, 500)
    } catch (error) {
      console.error("Error creating project:", error)
      if (progressInterval) clearInterval(progressInterval)
      setApiError(error instanceof Error ? error.message : "An unknown error occurred")
      setIsSubmitting(false)
      setIsCreating(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (isCreating) return // Prevent closing while creating
        setOpen(newOpen)
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-900/20">
          <Plus className="mr-2 h-4 w-4" />
          Create New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] p-0 bg-zinc-900 border-zinc-800 overflow-hidden">
        {!isCreating ? (
          <>
            <div className="border-b border-zinc-800 bg-zinc-900/90 px-4 py-3">
              <DialogTitle className="text-base font-medium">Create New Project</DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                Fill in the details to create a new geospatial project
              </DialogDescription>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-4 py-3 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs">
                    Project Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter project name"
                    className="h-8 bg-zinc-800 border-zinc-700 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your project"
                    className="bg-zinc-800 border-zinc-700 min-h-[80px] text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Project Thumbnail</Label>
                  <div className="border border-dashed border-zinc-700 rounded-md p-3 flex flex-col items-center justify-center bg-zinc-800/50">
                    <Upload className="h-6 w-6 text-zinc-500 mb-1" />
                    <p className="text-xs text-zinc-400 mb-1.5">Drag and drop an image, or click to browse</p>
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs border-zinc-700">
                      Select Image
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-zinc-800 bg-zinc-900/90 px-4 py-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="h-8 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-1.5 h-3 w-3 animate-spin rounded-full border-2 border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-6">
            {/* Creation animation */}
            <div className="relative h-20 w-20 mb-6">
              {/* Hexagonal background */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-16 w-16 bg-blue-500/5 rounded-full"></div>
                <svg className="absolute" width="80" height="80" viewBox="0 0 80 80">
                  <polygon
                    points="40,8 68,24 68,56 40,72 12,56 12,24"
                    fill="none"
                    stroke="rgba(59, 130, 246, 0.3)"
                    strokeWidth="1"
                    className="animate-pulse"
                  />
                </svg>
              </div>

              {/* Rotating elements */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-14 w-14">
                  {/* Outer ring */}
                  <svg
                    className="absolute animate-spin"
                    style={{ animationDuration: "8s" }}
                    width="56"
                    height="56"
                    viewBox="0 0 56 56"
                  >
                    <circle cx="28" cy="28" r="24" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" fill="none" />
                    <circle cx="28" cy="4" r="2.5" fill="rgba(59, 130, 246, 0.8)" />
                  </svg>

                  {/* Middle ring */}
                  <svg
                    className="absolute animate-spin"
                    style={{ animationDuration: "6s", animationDirection: "reverse" }}
                    width="56"
                    height="56"
                    viewBox="0 0 56 56"
                  >
                    <circle
                      cx="28"
                      cy="28"
                      r="18"
                      stroke="rgba(59, 130, 246, 0.2)"
                      strokeWidth="1"
                      fill="none"
                      strokeDasharray="4 2"
                    />
                    <circle cx="28" cy="10" r="2" fill="rgba(59, 130, 246, 0.6)" />
                  </svg>

                  {/* Center element */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 animate-pulse shadow-lg shadow-blue-500/30"></div>
                  </div>
                </div>
              </div>

              {/* Pulsing glow */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-blue-500/20 animate-ping"></div>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-2 w-full">
              <div className="text-sm font-medium text-white flex items-center">
                <span className="text-blue-400 mr-2">GeoGit</span> Creating Your Project
              </div>

              <div className="h-5 text-xs text-blue-400 min-w-[220px] text-center">
                {creationMessages[messageIndex]}
              </div>

              {/* Progress bar */}
              <div className="w-full mt-2 bg-blue-500/10 rounded-full overflow-hidden h-1">
                <div
                  className="h-full bg-blue-500/70 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="text-xs text-zinc-500">{Math.round(progress)}% complete</div>
              {apiError && (
                <div className="mt-2 text-xs text-red-400 text-center">
                  Error: {apiError}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 text-xs border-red-800 bg-red-900/20 hover:bg-red-900/30"
                    onClick={() => setIsCreating(false)}
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
