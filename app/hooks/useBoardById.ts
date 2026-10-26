"use client";

import { useQuery } from "@tanstack/react-query";

import { getBoardByToken } from "@/app/actions/boards";

export const boardQueryKey = (boardId: string) => ["board", boardId] as const;

export function useBoardById(boardId: string) {
  return useQuery({
    queryKey: boardQueryKey(boardId),
    queryFn: async () => {
      const board = await getBoardByToken(boardId);
      if (!board) {
        throw new Error("Board không tồn tại hoặc bạn không có quyền truy cập.");
      }
      return board;
    },
  });
}
