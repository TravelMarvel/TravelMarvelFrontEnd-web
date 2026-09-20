"use client";

import type { BoardTile, BoardTileType } from "@/api/boards";
import { BOARD_TILE_TYPE_LABEL } from "@/api/boards";

const TILE_COLORS: Record<
  BoardTileType,
  { border: string; label: string; background: string }
> = {
  START: {
    border: "#C8C8CC",
    label: "#8E8E93",
    background: "#FAFAFA",
  },
  TOUR: {
    border: "#F26522",
    label: "#F26522",
    background: "#FFF3ED",
  },
  CARD: {
    border: "#2A9D8F",
    label: "#2A9D8F",
    background: "#E8F6F3",
  },
  EVENT: {
    border: "#7B6CF6",
    label: "#7B6CF6",
    background: "#F0EDFF",
  },
  DICE: {
    border: "#2A9D8F",
    label: "#2A9D8F",
    background: "#E8F6F3",
  },
  MAP: {
    border: "#7B6CF6",
    label: "#7B6CF6",
    background: "#F0EDFF",
  },
};

type Props = {
  tile: BoardTile;
  isCurrent?: boolean;
  onPress?: (tile: BoardTile) => void;
};

export function BoardTileCard({ tile, isCurrent = false, onPress }: Props) {
  const colors = TILE_COLORS[tile.tileType] ?? TILE_COLORS.TOUR;
  const isStart = tile.tileType === "START";
  const pressable = typeof onPress === "function" && tile.spotId != null;
  const name = isStart ? "시작" : tile.spotName;
  const imageOpacity = isCurrent ? 1 : tile.isUnlocked ? 0.72 : 0.35;

  const content = (
    <>
      <p
        className="mb-0.5 truncate text-[8px] font-extrabold tracking-[0.3px]"
        style={{ color: colors.label }}
      >
        {BOARD_TILE_TYPE_LABEL[tile.tileType] ?? tile.tileType}
      </p>

      <div
        className={`mb-0.5 flex flex-1 items-center justify-center overflow-hidden rounded-md ${
          isStart ? "bg-[#FFF3ED]" : "bg-[#EEE]"
        }`}
      >
        {isStart ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-base">
            🏁
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tile.imageUrl || "/images/tile-placeholder.png"}
            alt={name}
            className="h-full w-full object-cover"
            style={{ opacity: imageOpacity }}
          />
        )}
      </div>

      <p className="line-clamp-2 text-[10px] font-bold leading-3 tracking-[-0.2px] text-[#1A1A1B]">
        {name}
      </p>

      {isCurrent ? (
        <div className="pointer-events-none absolute right-0.5 top-0.5 z-[2] flex h-[22px] w-[22px] items-center justify-center">
          <span className="absolute h-[22px] w-[22px] rounded-full bg-[#F26522]/20" />
          <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#F26522] bg-white">
            <span className="h-2 w-2 rounded-full bg-[#F26522]" />
          </span>
        </div>
      ) : null}
    </>
  );

  const className = `relative flex h-full flex-col overflow-hidden rounded-[10px] border-[1.5px] px-1 py-1 ${
    isCurrent ? "border-2" : ""
  } ${pressable ? "active:opacity-88" : ""}`;

  if (pressable) {
    return (
      <button
        type="button"
        onClick={() => onPress?.(tile)}
        className={className}
        style={{
          borderColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={className}
      style={{
        borderColor: colors.border,
        backgroundColor: colors.background,
      }}
    >
      {content}
    </div>
  );
}
