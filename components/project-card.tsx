"use client"

import type React from "react"

import { useState } from "react"
import { GitCommit, Clock, ChevronRight, MoreHorizontal, Star, StarOff, ExternalLink, GitBranch } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProjectCardProps {
  project: {
    name: string
    description: string
    thumbnail: string
    lastCommit: string
    badges: string[]
    lastModified: string
    contributors?: { name: string; avatar: string }[]
    status?: string
    progress?: number
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "paused":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "archived":
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
      default:
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
    }
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorite(!isFavorite)
  }

  const handleMoreClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Handle more options click
  }

  return (
    <TooltipProvider>
      <Card
        className="overflow-hidden bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 backdrop-blur-sm border-zinc-800/50 shadow-lg transition-all duration-300 group-hover:border-zinc-700 group-hover:shadow-xl group-hover:shadow-zinc-900/20 h-full flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative h-48 w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 z-10"></div>
          <img
            src={project.thumbnail || "/placeholder.svg"}
            alt={project.name}
            className={`h-full w-full object-cover transition-transform duration-700 ${isHovered ? "scale-110" : "scale-100"}`}
          />

          {/* Favorite and more options buttons */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60"
                  onClick={handleFavoriteClick}
                >
                  {isFavorite ? (
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  ) : (
                    <StarOff className="h-3.5 w-3.5 text-zinc-400" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                {isFavorite ? "Remove from favorites" : "Add to favorites"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60"
                  onClick={handleMoreClick}
                >
                  <MoreHorizontal className="h-3.5 w-3.5 text-zinc-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                More options
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Status badge */}
          {project.status && (
            <div className="absolute top-3 left-3 z-20">
              <Badge variant="outline" className={`text-[10px] ${getStatusColor(project.status)}`}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </Badge>
            </div>
          )}

          {/* Project name on image */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
            <h3 className="text-lg font-semibold text-white">{project.name}</h3>
            <p className="text-sm text-zinc-300 line-clamp-1">{project.description}</p>
          </div>

          {/* View project overlay on hover */}
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30 transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            <Button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-white/20">
              View Project <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <CardContent className="p-4 flex-1">
          <div className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
            <GitCommit className="h-4 w-4 text-zinc-500" />
            <span className="line-clamp-1">{project.lastCommit}</span>
          </div>

          {/* Repository visualization */}
          <div className="mt-3 border border-zinc-800/70 rounded-md p-2 bg-zinc-900/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs text-zinc-300">Repository</span>
              </div>
              <span className="text-[10px] text-zinc-500">3 branches</span>
            </div>

            {/* Branch visualization */}
            <div className="relative pl-3 mt-2">
              <div className="absolute left-1.5 top-0 h-full w-0.5 bg-zinc-800"></div>

              <div className="flex items-center mb-1.5">
                <div className="absolute -left-1 w-3 h-0.5 bg-zinc-800"></div>
                <div className="h-2 w-2 rounded-full bg-blue-500 absolute -left-2.5"></div>
                <span className="text-[10px] text-zinc-400 ml-1">main</span>
                <Badge className="ml-1.5 h-4 px-1 text-[9px] bg-blue-500/10 text-blue-400">HEAD</Badge>
              </div>

              <div className="flex items-center mb-1.5 opacity-70">
                <div className="absolute -left-1 w-3 h-0.5 bg-zinc-800"></div>
                <div className="h-2 w-2 rounded-full bg-green-500 absolute -left-2.5"></div>
                <span className="text-[10px] text-zinc-400 ml-1">feature/analysis</span>
              </div>

              <div className="flex items-center opacity-70">
                <div className="absolute -left-1 w-3 h-0.5 bg-zinc-800"></div>
                <div className="h-2 w-2 rounded-full bg-purple-500 absolute -left-2.5"></div>
                <span className="text-[10px] text-zinc-400 ml-1">feature/llm-processing</span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 border-t border-zinc-800/50 bg-zinc-900/80">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Clock className="h-3.5 w-3.5" />
              <span>{project.lastModified}</span>
            </div>

            {project.contributors && (
              <div className="flex -space-x-2">
                {project.contributors.slice(0, 3).map((contributor, index) => (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <Avatar className="h-6 w-6 border border-zinc-800">
                        <AvatarImage src={contributor.avatar || "/placeholder.svg"} alt={contributor.name} />
                        <AvatarFallback className="bg-zinc-800 text-[10px] text-zinc-400">
                          {contributor.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {contributor.name}
                    </TooltipContent>
                  </Tooltip>
                ))}
                {project.contributors.length > 3 && (
                  <div className="flex items-center justify-center h-6 w-6 rounded-full border border-zinc-800 bg-zinc-800 text-[10px] text-zinc-400">
                    +{project.contributors.length - 3}
                  </div>
                )}
              </div>
            )}

            <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </div>
        </CardFooter>
      </Card>
    </TooltipProvider>
  )
}
