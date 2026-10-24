"use client";

import { useState } from "react";

import { createBoard } from "@/app/actions/boards";
import type { BoardSummary } from "@/app/types/board";
import type { WorkspaceSummary } from "@/app/types/workspace";

import { AddBoardCard, BoardCard } from "../molecules";

type WorkspaceBoardsProps = {
  workspace: WorkspaceSummary;
  canManageBoards?: boolean;
};

export default function WorkspaceBoards({
  workspace,
  canManageBoards = workspace.canManageBoards,
}: WorkspaceBoardsProps) {
  const [boards, setBoards] = useState(workspace.boards);

  async function handleAddBoard(name: string) {
    const board = await createBoard(
      workspace.encryptedId,
      name,
      workspace.backgroundColor,
    );
    if (!board) {
      throw new Error("Workspace or board name is invalid, or access was denied.");
    }
    setBoards((currentBoards) => [...currentBoards, board]);
  }

  return (
    <div>
      <div
        aria-label={`Các bảng trong workspace ${workspace.name}`}
        className="flex items-start gap-3 overflow-x-auto pb-2"
      >
        {boards.map((board: BoardSummary) => (
          <BoardCard board={board} key={board.encryptedId} />
        ))}
        {canManageBoards && (
          <AddBoardCard disabled={false} onAdd={handleAddBoard} />
        )}
      </div>
    </div>
  );
}
