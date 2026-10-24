export type WorkspaceItem = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  boardCount: number;
  role: "ADMIN" | "MEMBER";
};
