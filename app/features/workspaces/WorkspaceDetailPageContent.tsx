import { connection } from "next/server";
import { notFound } from "next/navigation";

import { findWorkspaceByEncryptedId } from "@/app/actions/workspace";
import { WorkspaceBoardView } from "@/app/components/organisms";

type WorkspaceDetailPageContentProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function WorkspaceDetailPageContent({
  params,
}: WorkspaceDetailPageContentProps) {
  await connection();
  const { workspaceId } = await params;
  const workspace = await findWorkspaceByEncryptedId(workspaceId);

  if (!workspace) {
    notFound();
  }

  return <WorkspaceBoardView workspace={workspace} />;
}
