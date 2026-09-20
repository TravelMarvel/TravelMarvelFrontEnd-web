"use client";

import type { Spot } from "@/api/spots";

type Props = {
  spot: Spot;
  selected?: boolean;
  onPress?: (spot: Spot) => void;
};

export function SpotCard({ spot, selected = false, onPress }: Props) {
  return (
    <button
      type="button"
      onClick={() => onPress?.(spot)}
      className={`flex w-full items-center gap-4 rounded-2xl border-[1.5px] p-2 text-left shadow-[0_4px_10px_rgba(26,26,27,0.05)] active:opacity-90 ${
        selected
          ? "border-[#F26522] bg-[#FFF3ED]"
          : "border-[#F0F0F2] bg-white"
      }`}
    >
      {spot.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={spot.imageUrl}
          alt={spot.name}
          className="h-[84px] w-[84px] shrink-0 rounded-xl bg-[#F5F5F7] object-cover"
        />
      ) : (
        <div className="flex h-[84px] w-[84px] shrink-0 items-center justify-center rounded-xl bg-[#FFF3ED] text-[28px]">
          🏞
        </div>
      )}

      <div className="min-w-0 flex-1 gap-1.5 pr-1">
        <p className="line-clamp-2 text-[15px] font-bold leading-5 tracking-[-0.2px] text-[#1A1A1B]">
          {spot.name}
        </p>
        <div className="mt-1.5 flex items-start gap-1">
          <span className="mt-0.5 text-[11px]">📍</span>
          <p className="line-clamp-2 flex-1 text-[12px] font-medium leading-[17px] text-[#9E9E9E]">
            {spot.address}
          </p>
        </div>
      </div>

      <div
        className={`mr-1 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] ${
          selected
            ? "border-[#F26522] bg-[#F26522] text-[12px] font-extrabold text-white"
            : "border-[#D8D8DC] bg-white"
        }`}
      >
        {selected ? "✓" : null}
      </div>
    </button>
  );
}
