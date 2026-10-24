import { Suspense } from "react";

import { BoardCollectionSkeleton } from "@/app/components/organisms";
import BoardCollectionRouteContent from "@/app/features/board-collection/BoardCollectionRouteContent";

type BoardCollectionRouteProps = {
  params: Promise<{ username: string }>;
};

export default function BoardCollectionRoute({ params }: BoardCollectionRouteProps) {
  return (
    <Suspense fallback={<BoardCollectionSkeleton />}>
      <BoardCollectionRouteContent params={params} />
    </Suspense>
  );
}
