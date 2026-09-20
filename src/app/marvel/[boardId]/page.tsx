import { AuthGuard } from "@/components/auth-guard";
import { MarvelBoardDetailScreen } from "@/components/marvel/marvel-board-detail-screen";

type Props = {
  params: Promise<{ boardId: string }>;
  searchParams: Promise<{
    boardName?: string;
    regionName?: string;
    currentPosition?: string;
  }>;
};

export default async function MarvelBoardPage({ params, searchParams }: Props) {
  const { boardId } = await params;
  const query = await searchParams;

  return (
    <AuthGuard>
      <MarvelBoardDetailScreen
        boardId={Number(boardId)}
        boardName={query.boardName}
        regionName={query.regionName}
        fallbackPosition={Number(query.currentPosition ?? "1") || 1}
      />
    </AuthGuard>
  );
}
