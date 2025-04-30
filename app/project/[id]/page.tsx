import { MapWorkspace } from "@/components/map-workspace"

export default function ProjectPage({ params }: { params: { id: string } }) {
  return <MapWorkspace projectId={params.id} />
}
