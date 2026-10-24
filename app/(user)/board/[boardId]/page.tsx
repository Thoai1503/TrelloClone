import { Suspense } from "react";

import { BoardDetailSkeleton } from "@/app/components/organisms";
import BoardDetailPageContent from "@/app/features/boards/BoardDetailPageContent";

type BoardPageProps = {
  params: Promise<{ boardId: string }>;
};

export default function BoardPage({ params }: BoardPageProps) {
  return (
    <Suspense fallback={<BoardDetailSkeleton />}>
      <BoardDetailPageContent params={params} />
    </Suspense>
  );
}
