import Link from "next/link"
import { Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProjectCard } from "@/components/project-card"
import { Sidebar } from "@/components/sidebar"

// Sample project data
const projects = [
  {
    id: "1",
    name: "Urban Development Analysis",
    description: "Tracking city growth patterns over 10 years",
    thumbnail: "/urban-grid.png",
    lastCommit: "Updated building footprints",
    badges: ["vector", "raster"],
    lastModified: "2 hours ago",
  },
  {
    id: "2",
    name: "Forest Coverage Study",
    description: "Monitoring deforestation in Amazon rainforest",
    thumbnail: "/placeholder.svg?key=2ypgs",
    lastCommit: "Added 2023 satellite imagery",
    badges: ["raster"],
    lastModified: "Yesterday",
  },
  {
    id: "3",
    name: "Flood Risk Assessment",
    description: "Analyzing flood zones in coastal regions",
    thumbnail: "/coastal-flood-vulnerability.png",
    lastCommit: "LLM processed elevation data",
    badges: ["vector", "raster", "LLM"],
    lastModified: "3 days ago",
  },
  {
    id: "4",
    name: "Transportation Network",
    description: "Public transit routes and infrastructure",
    thumbnail: "/interconnected-transit.png",
    lastCommit: "Updated bus routes",
    badges: ["vector"],
    lastModified: "1 week ago",
  },
  {
    id: "5",
    name: "Agricultural Land Use",
    description: "Crop rotation and land use patterns",
    thumbnail: "/global-agricultural-land.png",
    lastCommit: "LLM classified crop types",
    badges: ["vector", "raster", "LLM"],
    lastModified: "2 weeks ago",
  },
  {
    id: "6",
    name: "Climate Change Impact",
    description: "Temperature and precipitation changes",
    thumbnail: "/global-temperature-trends.png",
    lastCommit: "Added 2023 temperature data",
    badges: ["raster"],
    lastModified: "1 month ago",
  },
]

export default function Home() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Project Explorer</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search projects..." className="w-[250px] bg-background pl-8" />
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Create New Project
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link href={`/project/${project.id}`} key={project.id}>
              <ProjectCard project={project} />
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
