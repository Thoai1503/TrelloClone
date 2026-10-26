import { Suspense } from "react";

import { BoardDetailSkeleton } from "@/app/components/organisms";
import BoardDetailPageContent from "@/app/features/boards/BoardDetailPageContent";

type BoardPageProps = {
  params: Promise<{ boardId: string }>;
};

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params;

  return (
    <Suspense fallback={<BoardDetailSkeleton />}>
      <BoardDetailPageContent boardId={boardId} />
    </Suspense>
  );
}
