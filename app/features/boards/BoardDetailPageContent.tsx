import { connection } from "next/server";
import { notFound } from "next/navigation";

import { getBoardByToken } from "@/app/actions/boards";
import { BoardDetailView } from "@/app/components/organisms";

type BoardDetailPageContentProps = {
  params: Promise<{ boardId: string }>;
};

export default async function BoardDetailPageContent({
  params,
}: BoardDetailPageContentProps) {
  await connection();
  const { boardId } = await params;
  const board = await getBoardByToken(boardId);

  if (!board) {
    notFound();
  }

  return <BoardDetailView board={board} />;
}
