export type WorkspaceItem = {
  encryptedId: string;
  name: string;
  description: string | null;
  memberCount: number;
  boardCount: number;
  role: "ADMIN" | "MEMBER";
};

export type WorkspaceBoard = {
  id: string;
  name: string;
  description: string | null;
  background: string | null;
};

export type WorkspaceDetail = {
  id: string;
  name: string;
  description: string | null;
  boards: WorkspaceBoard[];
};
