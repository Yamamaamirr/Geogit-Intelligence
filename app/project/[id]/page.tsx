import { Suspense } from "react"
import Loading from "@/app/loading"
import { MapWorkspace } from "@/components/map-workspace"

interface ProjectPageProps {
  params: { id: string }
  searchParams: { name?: string; description?: string }
}

export default function ProjectPage({ params, searchParams }: ProjectPageProps) {
  // Extract values directly and pass them as props instead of passing the objects
  const projectId = params.id
  const projectName = typeof searchParams.name === "string" ? searchParams.name : ""
  const projectDescription = typeof searchParams.description === "string" ? searchParams.description : ""

  return (
    <Suspense fallback={<Loading />}>
      <MapWorkspace projectId={projectId} projectName={projectName} projectDescription={projectDescription} />
    </Suspense>
  )
}
