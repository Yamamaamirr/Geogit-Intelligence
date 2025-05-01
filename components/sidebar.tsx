"use client"

import { useState } from "react"
import Link from "next/link"
import {
  FolderGit2,
  GitBranch,
  GitCommit,
  Settings,
  Users,
  Star,
  PlusCircle,
  ChevronDown,
  ChevronRight,
  LogOut,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function Sidebar() {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    projects: true,
    teams: false,
  })

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  return (
    <div className="flex h-full w-72 flex-col border-r border-zinc-800/50 bg-gradient-to-b from-[#0F0F13] to-[#0A0A0E]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
            <GitBranch className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
            GeoGit
          </h1>
        </div>
      </div>

      {/* Main navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1 px-2">
          <Link href="/" className="block">
            <Button
              variant="ghost"
              className="w-full justify-start bg-gradient-to-r from-zinc-800/80 to-zinc-800/30 text-white font-medium border-l-2 border-blue-500"
            >
              <FolderGit2 className="mr-3 h-4 w-4 text-blue-400" />
              Projects
            </Button>
          </Link>

          <Link href="/" className="block">
            <Button
              variant="ghost"
              className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800/50 font-medium"
            >
              <GitCommit className="mr-3 h-4 w-4" />
              Activity
            </Button>
          </Link>

          <Link href="/" className="block">
            <Button
              variant="ghost"
              className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800/50 font-medium"
            >
              <Users className="mr-3 h-4 w-4" />
              Team
            </Button>
          </Link>
        </div>

        <div className="mt-6 px-2">
          <Collapsible
            open={openCategories.projects}
            onOpenChange={() => toggleCategory("projects")}
            className="space-y-2"
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between px-2 py-1.5 text-sm font-medium text-zinc-300 cursor-pointer hover:text-white">
                <span>My Projects</span>
                <ChevronDown
                  className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${
                    openCategories.projects ? "transform rotate-180" : ""
                  }`}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pl-2">
              {[
                { name: "Urban Development Analysis", status: "active" },
                { name: "Forest Coverage Study", status: "active" },
                { name: "Flood Risk Assessment", status: "active" },
                { name: "Transportation Network", status: "completed" },
                { name: "Agricultural Land Use", status: "paused" },
              ].map((project) => (
                <Link href="/" key={project.name} className="block">
                  <div className="group flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center">
                      <div
                        className={`w-1.5 h-1.5 rounded-full bg-blue-500 ${project.status === "paused" ? "opacity-50" : project.status === "completed" ? "opacity-80" : ""} mr-2`}
                      ></div>
                      <span className="text-sm text-zinc-400 group-hover:text-white truncate max-w-[160px]">
                        {project.name}
                      </span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 mt-1"
              >
                <PlusCircle className="mr-2 h-3 w-3" />
                Add Project
              </Button>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible
            open={openCategories.teams}
            onOpenChange={() => toggleCategory("teams")}
            className="space-y-2 mt-2"
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between px-2 py-1.5 text-sm font-medium text-zinc-300 cursor-pointer hover:text-white">
                <span>Teams</span>
                <ChevronDown
                  className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${
                    openCategories.teams ? "transform rotate-180" : ""
                  }`}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pl-2">
              {[
                { name: "GIS Analysis Team", members: 5 },
                { name: "Remote Sensing", members: 3 },
                { name: "Data Science", members: 4 },
              ].map((team) => (
                <Link href="/" key={team.name} className="block">
                  <div className="group flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded bg-zinc-800 flex items-center justify-center text-[8px] text-zinc-400 mr-2">
                        {team.members}
                      </div>
                      <span className="text-sm text-zinc-400 group-hover:text-white truncate max-w-[160px]">
                        {team.name}
                      </span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 mt-1"
              >
                <PlusCircle className="mr-2 h-3 w-3" />
                Create Team
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="mt-6 px-2">
          <div className="px-2 py-1.5 text-sm font-medium text-zinc-300">
            <span>Favorites</span>
          </div>
          <div className="mt-1 space-y-1 pl-2">
            {[
              { name: "Urban Development Analysis", type: "Project" },
              { name: "GIS Analysis Team", type: "Team" },
            ].map((item) => (
              <Link href="/" key={item.name} className="block">
                <div className="group flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center">
                    <Star className="h-3.5 w-3.5 text-blue-400 fill-blue-400 mr-2" />
                    <span className="text-sm text-zinc-400 group-hover:text-white truncate max-w-[160px]">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-600 group-hover:text-zinc-500">{item.type}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* User profile */}
      <div className="mt-auto border-t border-zinc-800/50 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-zinc-800">
            <AvatarImage src="/ak-symbol.png" alt="Test User" />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">TU</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Test User</p>
            <div className="flex items-center">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-1.5"></div>
              <p className="text-xs text-zinc-400">MVP Tester</p>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-zinc-800">
                  <Settings className="h-4 w-4 text-zinc-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-zinc-800">
                  <LogOut className="h-4 w-4 text-zinc-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Log out</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
