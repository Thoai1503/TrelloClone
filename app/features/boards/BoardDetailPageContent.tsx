"use client";

import { useCallback } from "react";

import { BoardDetailView, BoardDetailSkeleton } from "@/app/components/organisms";
import { useBoardById } from "@/app/hooks/useBoardById";
import type { BoardDetail } from "@/app/types/board";

type BoardDetailPageContentProps = {
  boardId: string;
};

export default function BoardDetailPageContent({
  boardId,
}: BoardDetailPageContentProps) {
  const { data: board, error, isPending, refetch } = useBoardById(boardId);
  const refreshBoard = useCallback(async (): Promise<BoardDetail> => {
    const result = await refetch();
    if (result.error) throw result.error;
    if (!result.data) {
      throw new Error("Không nhận được dữ liệu bảng sau khi tải lại.");
    }
    return result.data;
  }, [refetch]);

  if (!board && isPending) {
    return <BoardDetailSkeleton />;
  }

  if (!board) {
    return (
      <main className="flex min-h-[calc(100vh-68px)] items-center justify-center p-6">
        <section className="max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">
            Không thể tải bảng
          </h1>
          <p className="mt-2 text-sm text-gray-600" role="alert">
            {error?.message ?? "Đã xảy ra lỗi khi tải dữ liệu bảng."}
          </p>
          <button
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            onClick={() => void refetch()}
            type="button"
          >
            Thử tải lại
          </button>
        </section>
      </main>
    );
  }

  return <BoardDetailView board={board} onBoardUpdated={refreshBoard} />;
}
