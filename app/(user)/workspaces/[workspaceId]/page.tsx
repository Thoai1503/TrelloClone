import { Suspense } from "react";

import { WorkspaceHomeSkeleton } from "@/app/components/organisms";
import WorkspaceDetailPageContent from "@/app/features/workspaces/WorkspaceDetailPageContent";

type WorkspacePageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default function WorkspacePage({ params }: WorkspacePageProps) {
  return (
    <Suspense fallback={<WorkspaceHomeSkeleton />}>
      <WorkspaceDetailPageContent params={params} />
    </Suspense>
  );
}
