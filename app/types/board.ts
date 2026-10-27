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
  attachments: CardAttachmentSummary[];
  activityFeed: CardActivityFeedItem[];
};

export type CardAttachmentSummary = {
  id: string;
  file_name: string;
  mime_type: string | null;
  file_size: string | null;
  created_at: string;
  download_url: string;
};

export type CardMemberSummary = {
  id: number;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export type CardCommentSummary = {
  id: string;
  content: string;
  created_at: string;
  author: {
    id: number;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
};

export type CardActivityFeedItem =
  | ({ kind: "comment" } & CardCommentSummary)
  | {
      kind: "activity";
      id: string;
      action: string;
      created_at: string;
      actor: CardCommentSummary["author"];
      cardTitle: string | null;
      fromListName: string | null;
      toListName: string | null;
      fromStartDate: string | null;
      toStartDate: string | null;
      fromEndDate: string | null;
      toEndDate: string | null;
      memberName: string | null;
    };

export type BoardMemberRole = "ADMIN" | "EDITOR" | "VIEWER";

export type BoardMemberSummary = {
  id: number;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: BoardMemberRole;
  isProtected?: boolean;
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
  canManageAdminMembers: boolean;
  members: BoardMemberSummary[];
  lists: BoardList[];
};
