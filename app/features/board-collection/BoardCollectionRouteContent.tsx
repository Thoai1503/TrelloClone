import BoardCollectionPageContent from "./BoardCollectionPageContent";

type BoardCollectionRouteContentProps = {
  params: Promise<{ username: string }>;
};

export default async function BoardCollectionRouteContent({
  params,
}: BoardCollectionRouteContentProps) {
  const { username } = await params;

  return <BoardCollectionPageContent username={username} />;
}
