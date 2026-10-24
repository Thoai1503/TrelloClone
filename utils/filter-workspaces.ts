import type { WorkspaceSummary } from "@/app/types/workspace";

export function filterWorkspaceBoards(
  workspaces: WorkspaceSummary[],
  value: string,
): WorkspaceSummary[] {
  const query = value.trim().toLocaleLowerCase("vi");
  if (!query) return workspaces;

  return workspaces.flatMap((workspace) => {
    const workspaceMatches =
      `${workspace.name} ${workspace.description ?? ""}`
        .toLocaleLowerCase("vi")
        .includes(query);

    if (workspaceMatches) return [workspace];

    const matchingBoards = workspace.boards.filter((board) =>
      `${board.name} ${board.description ?? ""}`
        .toLocaleLowerCase("vi")
        .includes(query),
    );

    return matchingBoards.length > 0
      ? [{ ...workspace, boards: matchingBoards }]
      : [];
  });
}
