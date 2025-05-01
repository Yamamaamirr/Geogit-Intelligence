import { MapWorkspace } from "@/components/map-workspace"

export default function NewProjectPage({ searchParams }: { searchParams: { name?: string; description?: string } }) {
  const projectName = searchParams.name || "New Project"
  const projectDescription = searchParams.description || "Your new geospatial project"

  return (
    <MapWorkspace
      projectId="new-project"
      isNewProject={true}
      projectName={projectName}
      projectDescription={projectDescription}
    />
  )
}
