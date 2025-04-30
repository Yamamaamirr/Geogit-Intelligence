import { FolderGit2, GitBranch, GitCommit, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-[#1C1C1E] p-4">
      <div className="flex items-center gap-2 px-2 py-3">
        <GitBranch className="h-6 w-6 text-purple-500" />
        <h1 className="text-xl font-bold">GeoGit Intelligence</h1>
      </div>
      <Separator className="my-4" />

      <nav className="space-y-1">
        <Button variant="ghost" className="w-full justify-start">
          <FolderGit2 className="mr-2 h-5 w-5" />
          My Projects
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <GitCommit className="mr-2 h-5 w-5" />
          Recent Activity
        </Button>
      </nav>

      <div className="mt-4 space-y-2">
        <h2 className="px-2 text-sm font-semibold text-muted-foreground">Recent Projects</h2>
        <div className="space-y-1">
          {["Urban Development Analysis", "Forest Coverage Study", "Flood Risk Assessment"].map((project) => (
            <Button key={project} variant="ghost" className="w-full justify-start text-sm font-normal">
              {project}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-auto">
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="mr-2 h-5 w-5" />
          Settings
        </Button>
      </div>
    </div>
  )
}
