import type { BoardSummary } from "./board";

export type WorkspaceSummary = {
  encryptedId: string;
  name: string;
  description: string | null;
  backgroundColor: string;
  memberCount: number;
  boardCount: number;
  canManageBoards: boolean;
  role: "OWNER" | "ADMIN" | "MEMBER";
  boards: BoardSummary[];
};
