"use client";

import { useEffect, useRef, useState } from "react";

import type { BoardTile } from "@/api/boards";
import { BoardTileCard } from "@/components/marvel/board-tile";

/** tileOrder 1 = START(왼쪽 아래)부터 시계방향 12칸 → 4×4 외곽 좌표 */
const ORDER_TO_CELL: Record<number, { row: number; col: number }> = {
  1: { row: 3, col: 0 },
  2: { row: 3, col: 1 },
  3: { row: 3, col: 2 },
  4: { row: 3, col: 3 },
  5: { row: 2, col: 3 },
  6: { row: 1, col: 3 },
  7: { row: 0, col: 3 },
  8: { row: 0, col: 2 },
  9: { row: 0, col: 1 },
  10: { row: 0, col: 0 },
  11: { row: 1, col: 0 },
  12: { row: 2, col: 0 },
};

const CELL_GAP = 5;
const ORDERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const BOARD_DICE_SIZE = 56;

type Props = {
  tiles: BoardTile[];
  currentPosition: number;
  isCompleted?: boolean;
  isRolling?: boolean;
  displayFace?: number;
  diceTravel?: number;
  onBoardWidthChange?: (width: number) => void;
  onTilePress?: (tile: BoardTile) => void;
};

export function MarvelBoardGrid({
  tiles,
  currentPosition,
  isCompleted = false,
  isRolling = false,
  displayFace = 1,
  diceTravel = 0,
  onBoardWidthChange,
  onTilePress,
}: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(0);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    const update = () => {
      const size = Math.floor(el.getBoundingClientRect().width);
      if (size > 0 && size !== boardSize) {
        setBoardSize(size);
        onBoardWidthChange?.(size);
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [boardSize, onBoardWidthChange]);

  const cellSize = boardSize > 0 ? boardSize / 4 : 0;

  return (
    <div
      ref={boardRef}
      className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#F3EDE3]"
      style={{
        backgroundImage: "url(/images/board-background.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {boardSize > 0
        ? ORDERS.map((order) => {
            const { row, col } = ORDER_TO_CELL[order];
            const tile = tiles.find((item) => item.tileOrder === order);

            return (
              <div
                key={order}
                className="absolute overflow-hidden"
                style={{
                  top: row * cellSize,
                  left: col * cellSize,
                  width: cellSize,
                  height: cellSize,
                  padding: CELL_GAP / 2,
                }}
              >
                {tile ? (
                  <BoardTileCard
                    tile={tile}
                    isCurrent={!isCompleted && tile.tileOrder === currentPosition}
                    onPress={onTilePress}
                  />
                ) : null}
              </div>
            );
          })
        : null}

      {boardSize > 0 && isCompleted ? (
        <div
          className="pointer-events-none absolute flex items-center justify-center"
          style={{
            top: cellSize,
            left: cellSize,
            width: cellSize * 2,
            height: cellSize * 2,
          }}
        >
          <span className="rounded-full bg-[#F26522] px-[18px] py-2.5 text-[22px] font-extrabold tracking-wide text-white">
            완료
          </span>
        </div>
      ) : null}

      {isRolling ? (
        <div
          className="pointer-events-none absolute z-20 flex h-14 w-14 items-center justify-center rounded-[14px] border-2 border-white bg-[#F26522] text-[28px] font-extrabold text-white shadow-[0_8px_12px_rgba(242,101,34,0.35)] transition-transform duration-75"
          style={{
            top: "42%",
            marginTop: -BOARD_DICE_SIZE / 2,
            transform: `translateX(${diceTravel}px) rotate(${(diceTravel / Math.max(boardSize, 1)) * 720}deg)`,
          }}
        >
          {displayFace}
        </div>
      ) : null}
    </div>
  );
}
