import { GitCommit, Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

interface ProjectCardProps {
  project: {
    name: string
    description: string
    thumbnail: string
    lastCommit: string
    badges: string[]
    lastModified: string
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="h-full overflow-hidden transition-all hover:ring-1 hover:ring-blue-500">
      <div className="relative h-40 w-full overflow-hidden">
        <img src={project.thumbnail || "/placeholder.svg"} alt={project.name} className="h-full w-full object-cover" />
      </div>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap gap-2">
          {project.badges.map((badge) => (
            <Badge
              key={badge}
              variant="outline"
              className={`
                ${badge === "vector" ? "border-blue-500 bg-blue-500/10 text-blue-400" : ""}
                ${badge === "raster" ? "border-green-500 bg-green-500/10 text-green-400" : ""}
                ${badge === "LLM" ? "border-purple-500 bg-purple-500/10 text-purple-400" : ""}
              `}
            >
              {badge}
            </Badge>
          ))}
        </div>
        <h3 className="text-lg font-semibold">{project.name}</h3>
        <p className="text-sm text-muted-foreground">{project.description}</p>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <GitCommit className="h-4 w-4" />
          <span>{project.lastCommit}</span>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Updated {project.lastModified}</span>
        </div>
      </CardFooter>
    </Card>
  )
}
