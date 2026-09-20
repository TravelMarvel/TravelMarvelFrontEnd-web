"use client";

import type { Board, BoardStatus } from "@/api/boards";
import { BOARD_MAX_POSITION } from "@/api/boards";

const CARD_COLORS = [
  "#F26522",
  "#1FBDBF",
  "#3B82F6",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#0EA5E9",
] as const;

const STATUS_BADGE_LABEL: Record<BoardStatus, string> = {
  PLAYING: "ONGOING",
  COMPLETED: "DONE",
};

function getCardAccent(boardId: number) {
  return CARD_COLORS[Math.abs(boardId) % CARD_COLORS.length];
}

function getBoardProgress(board: Board) {
  if (board.status === "COMPLETED") return 1;
  const explored = Math.max(board.currentPosition - 1, 0);
  return Math.min(explored / BOARD_MAX_POSITION, 1);
}

type Props = {
  board: Board;
  onPress?: (board: Board) => void;
  onDelete?: (board: Board) => void;
  isDeleting?: boolean;
};

export function MarvelBoardCard({
  board,
  onPress,
  onDelete,
  isDeleting = false,
}: Props) {
  const accent = getCardAccent(board.boardId);
  const progress = getBoardProgress(board);
  const percent = Math.round(progress * 100);
  const current =
    board.status === "COMPLETED"
      ? BOARD_MAX_POSITION
      : Math.max(board.currentPosition - 1, 0);
  const title = board.boardName || `${board.regionName} 마블판`;

  return (
    <div
      className={`relative flex overflow-hidden rounded-[14px] bg-white shadow-[0_3px_8px_rgba(26,26,27,0.05)] ${
        isDeleting ? "opacity-70" : ""
      }`}
    >
      <div className="w-[3px] shrink-0" style={{ backgroundColor: accent }} />
      <div
        className="pointer-events-none absolute -right-4 -top-5 h-[72px] w-[72px] rounded-full"
        style={{ backgroundColor: `${accent}1A` }}
      />

      <div className="relative flex flex-1 flex-col gap-1.5 px-3 pb-2.5 pt-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <h3 className="truncate text-[15px] font-extrabold tracking-[-0.2px] text-[#1A1A1B]">
            {title}
          </h3>
          <span
            className="shrink-0 text-[10px] font-extrabold tracking-[0.3px]"
            style={{ color: accent }}
          >
            {STATUS_BADGE_LABEL[board.status]}
          </span>
        </div>

        <p className="truncate text-[12px] font-medium text-[#9E9E9E]">
          {board.regionName} · 명소 {BOARD_MAX_POSITION}곳
        </p>

        <div className="flex items-end gap-2.5">
          <div className="flex flex-1 flex-col gap-1.5">
            <p className="text-[12px] font-semibold text-[#6B6B70]">
              {current} / {BOARD_MAX_POSITION} 탐험
            </p>
            <div className="h-[5px] overflow-hidden rounded-full bg-[#EFEFF2]">
              <div
                className="h-full rounded-full"
                style={{ width: `${progress * 100}%`, backgroundColor: accent }}
              />
            </div>
          </div>
          <span
            className="min-w-[52px] text-right text-[22px] font-extrabold leading-[26px] tracking-[-0.6px]"
            style={{ color: accent }}
          >
            {percent}%
          </span>
        </div>

        <div className="mt-0.5 flex items-center justify-between">
          {onDelete ? (
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => onDelete(board)}
              className="py-1 pr-1.5 text-[13px] font-semibold text-[#9E9E9E] disabled:opacity-45"
            >
              {isDeleting ? "삭제 중…" : "삭제"}
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            disabled={isDeleting}
            onClick={() => onPress?.(board)}
            className="flex h-[34px] min-w-[88px] items-center justify-center rounded-[10px] px-3 text-[13px] font-extrabold text-white disabled:opacity-45 active:opacity-90"
            style={{ backgroundColor: accent }}
          >
            이어서 →
          </button>
        </div>
      </div>
    </div>
  );
}
