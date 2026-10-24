import WorkspacePageContent from "./WorkspacePageContent";

type WorkspaceListRouteContentProps = {
  params: Promise<{ username: string }>;
};

export default async function WorkspaceListRouteContent({
  params,
}: WorkspaceListRouteContentProps) {
  const { username } = await params;

  return <WorkspacePageContent username={username} />;
}
