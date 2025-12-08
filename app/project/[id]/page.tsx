import { Suspense } from "react"
import Loading from "@/app/loading"
import { MapWorkspace } from "@/components/map-workspace"

interface ProjectPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ name?: string; description?: string }>
}

export default async function ProjectPage({ params, searchParams }: ProjectPageProps) {
  // Await the params and searchParams (required in Next.js 15)
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  
  const projectId = resolvedParams.id
  const projectName = typeof resolvedSearchParams.name === "string" ? resolvedSearchParams.name : ""
  const projectDescription = typeof resolvedSearchParams.description === "string" ? resolvedSearchParams.description : ""

  return (
    <Suspense fallback={<Loading />}>
      <MapWorkspace projectId={projectId} projectName={projectName} projectDescription={projectDescription} />
    </Suspense>
  )
}
