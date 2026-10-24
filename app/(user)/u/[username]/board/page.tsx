import { Suspense } from "react";

import { WorkspaceHomeSkeleton } from "@/app/components/organisms";
import WorkspaceListRouteContent from "@/app/features/workspaces/WorkspaceListRouteContent";

type WorkspaceListPageProps = {
  params: Promise<{ username: string }>;
};

export default function WorkspaceListPage({ params }: WorkspaceListPageProps) {
  return (
    <Suspense fallback={<WorkspaceHomeSkeleton />}>
      <WorkspaceListRouteContent params={params} />
    </Suspense>
  );
}
