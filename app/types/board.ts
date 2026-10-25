export type BoardSummary = {
  encryptedId: string;
  name: string;
  description: string | null;
  backgroundColor: string;
  listCount: number;
  memberCount: number;
};

export type BoardList = {
  id: string;
  name: string;
  cards: BoardTask[];
};

export type BoardTask = {
  id: string;
  title: string;
  is_completed: boolean;
  description: string | null;
  start_date: string | null;
  due_date: string | null;
  members: CardMemberSummary[];
};

export type CardMemberSummary = {
  id: number;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export type BoardMemberRole = "ADMIN" | "EDITOR" | "VIEWER";

export type BoardMemberSummary = {
  id: number;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: BoardMemberRole;
};

export type BoardMemberCandidate = Omit<BoardMemberSummary, "role">;

export type BoardDetail = {
  encryptedId: string;
  name: string;
  backgroundColor: string;
  workspaceEncryptedId: string;
  workspaceName: string;
  canManageLists: boolean;
  canManageMembers: boolean;
  members: BoardMemberSummary[];
  lists: BoardList[];
};
