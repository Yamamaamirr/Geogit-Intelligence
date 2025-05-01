import Link from "next/link"
import { Search, Clock, GitCommit } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ProjectCard } from "@/components/project-card"
import { Sidebar } from "@/components/sidebar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ProjectFilters } from "@/components/project-filters"
import { CreateProjectDialog } from "@/components/create-project-dialog"

// Sample project data - moved to a separate file so it can be imported elsewhere
import { projects } from "@/lib/project-data"

export default function Home() {
  return (
    <div className="flex h-screen bg-[#080809]">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {/* Hero section with gradient background */}
        <div className="relative bg-gradient-to-b from-[#12121A] via-[#0D0D12] to-[#080809] px-8 py-6">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_30%_20%,_rgba(14,_165,_233,_0.8),_transparent_70%)]"></div>
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_70%_60%,_rgba(2,_132,_199,_0.8),_transparent_70%)]"></div>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1 max-w-md relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500">
                  <Search className="h-4 w-4" />
                </div>
                <Input
                  type="search"
                  placeholder="Search projects by name, description, or tags..."
                  className="w-full pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-300 focus:border-zinc-700 focus:ring-zinc-700 h-10 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-3 ml-4">
                <ProjectFilters />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CreateProjectDialog />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Create a new geospatial project</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="mt-4">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="bg-zinc-900/50 border border-zinc-800 p-0.5 rounded-lg">
                  <TabsTrigger
                    value="all"
                    className="text-xs rounded-md data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                  >
                    All Projects
                  </TabsTrigger>
                  <TabsTrigger
                    value="recent"
                    className="text-xs rounded-md data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                  >
                    Recent
                  </TabsTrigger>
                  <TabsTrigger
                    value="shared"
                    className="text-xs rounded-md data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                  >
                    Shared with me
                  </TabsTrigger>
                  <TabsTrigger
                    value="archived"
                    className="text-xs rounded-md data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                  >
                    Archived
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Project grid */}
        <div className="px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link href={`/project/${project.id}`} key={project.id} className="group">
                <ProjectCard project={project} />
              </Link>
            ))}
          </div>

          {/* Stats section */}
          <div className="mt-16 border-t border-zinc-800/50 pt-8">
            <h2 className="text-lg font-semibold text-zinc-300 mb-6 flex items-center">
              <span className="inline-block border-l-2 border-blue-500 pl-3">Recent Activity</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-5 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <GitCommit className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-300">Latest Commits</h3>
                    <p className="text-xs text-zinc-500">12 commits this week</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                      <span className="text-zinc-400">Updated building footprints</span>
                    </div>
                    <span className="text-zinc-500">2h ago</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                      <span className="text-zinc-400">Added 2023 satellite imagery</span>
                    </div>
                    <span className="text-zinc-500">Yesterday</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                      <span className="text-zinc-400">LLM processed elevation data</span>
                    </div>
                    <span className="text-zinc-500">3d ago</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-5 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-300">Active Projects</h3>
                    <p className="text-xs text-zinc-500">4 projects in progress</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5" style={{ width: "65%" }}></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-zinc-500">
                    <span>65% overall completion</span>
                    <span>4/6 projects</span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">Urban Development</span>
                      <span className="text-xs text-zinc-500">75%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1">
                      <div className="bg-blue-500 h-1 rounded-full" style={{ width: "75%" }}></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">Forest Coverage</span>
                      <span className="text-xs text-zinc-500">45%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1">
                      <div className="bg-blue-500 h-1 rounded-full" style={{ width: "45%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-5 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    <img
                      src="/ak-symbol.png"
                      className="h-8 w-8 rounded-full border-2 border-zinc-900"
                      alt="Alex Kim"
                    />
                    <img
                      src="/javascript-code.png"
                      className="h-8 w-8 rounded-full border-2 border-zinc-900"
                      alt="Jamie Smith"
                    />
                    <img
                      src="/machine-learning-concept.png"
                      className="h-8 w-8 rounded-full border-2 border-zinc-900"
                      alt="Morgan Lee"
                    />
                    <div className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-zinc-900 bg-zinc-800 text-xs text-zinc-400">
                      +2
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-300">Team Activity</h3>
                    <p className="text-xs text-zinc-500">5 active contributors</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span className="text-zinc-400">Alex Kim</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-blue-800/30 bg-blue-900/20 text-blue-400 text-[10px] px-1.5"
                    >
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-zinc-500"></div>
                      <span className="text-zinc-400">Jamie Smith</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-zinc-800/30 bg-zinc-900/20 text-zinc-400 text-[10px] px-1.5"
                    >
                      Offline
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500/50"></div>
                      <span className="text-zinc-400">Morgan Lee</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-blue-800/20 bg-blue-900/10 text-blue-400/70 text-[10px] px-1.5"
                    >
                      Away
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
