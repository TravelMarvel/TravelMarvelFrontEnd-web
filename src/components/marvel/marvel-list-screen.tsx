"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { deleteBoard, getBoards, type Board } from "@/api/boards";
import { MarvelBoardCard } from "@/components/marvel/marvel-board-card";
import { ApiError } from "@/lib/api-client";
import { showAlert } from "@/lib/app-alert";

export function MarvelListScreen() {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [deletingBoardId, setDeletingBoardId] = useState<number | null>(null);

  const fetchBoards = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await getBoards();
      setBoards(data);
    } catch (error) {
      console.warn("[marvel] getBoards failed:", error);
      setBoards([]);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBoards();
  }, [fetchBoards]);

  const handleDelete = useCallback((board: Board) => {
    const title = board.boardName || `${board.regionName} 마블판`;

    showAlert(
      "마블판 삭제",
      `"${title}" 마블판을 삭제할까요?\n등록한 이미지도 함께 삭제됩니다.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setDeletingBoardId(board.boardId);
              try {
                await deleteBoard(board.boardId);
                setBoards((prev) =>
                  prev.filter((item) => item.boardId !== board.boardId),
                );
              } catch (error) {
                const message =
                  error instanceof ApiError
                    ? "마블판을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요."
                    : "네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.";
                showAlert("삭제 실패", message);
              } finally {
                setDeletingBoardId(null);
              }
            })();
          },
        },
      ],
    );
  }, []);

  return (
    <div className="flex h-full flex-col bg-[#F5F5F7]">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-3">
        <header className="mb-6">
          <h1 className="text-[28px] font-extrabold tracking-[-0.5px] text-[#1A1A1B]">
            내 마블판
          </h1>
          <p className="mt-1.5 text-[14px] font-medium leading-5 text-[#9E9E9E]">
            내가 만든 여행 마블판을 이어서 탐험하세요
          </p>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#F26522]/30 border-t-[#F26522]" />
          </div>
        ) : hasError ? (
          <div>
            <p className="text-[14px] font-medium text-[#9E9E9E]">
              마블판을 불러오지 못했어요
            </p>
            <button
              type="button"
              onClick={() => void fetchBoards()}
              className="mt-3 text-[14px] font-bold text-[#F26522]"
            >
              다시 시도
            </button>
          </div>
        ) : boards.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center px-6">
            <p className="whitespace-pre-line text-center text-[17px] font-semibold leading-[26px] text-[#9E9E9E]">
              {"새 마블판 만들기 버튼을 눌러서 마블판을\n만들어주세요."}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {boards.map((board) => (
              <li key={board.boardId}>
                <MarvelBoardCard
                  board={board}
                  isDeleting={deletingBoardId === board.boardId}
                  onDelete={handleDelete}
                  onPress={(item) => {
                    const params = new URLSearchParams({
                      boardName: item.boardName,
                      regionName: item.regionName,
                      currentPosition: String(item.currentPosition),
                    });
                    router.push(`/marvel/${item.boardId}?${params.toString()}`);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-[#EFEFEF] bg-[#F5F5F7] px-6 pb-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/marvel/create")}
          className="w-full rounded-[18px] bg-[#F26522] py-[18px] text-[17px] font-bold text-white active:opacity-90"
        >
          + 새 마블판 만들기
        </button>
      </div>
    </div>
  );
}
