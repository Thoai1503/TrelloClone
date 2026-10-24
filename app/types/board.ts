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
};

export type BoardDetail = {
  encryptedId: string;
  name: string;
  backgroundColor: string;
  workspaceEncryptedId: string;
  workspaceName: string;
  canManageLists: boolean;
  lists: BoardList[];
};
