"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createBoard } from "@/api/boards";
import { getRegions, type Region } from "@/api/regions";
import { getSpots, type Spot } from "@/api/spots";
import { SpotCard } from "@/components/marvel/spot-card";
import { ApiError } from "@/lib/api-client";
import { showAlert } from "@/lib/app-alert";

export function CreateMarvelBoardScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [isRegionsLoading, setIsRegionsLoading] = useState(true);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [isSpotsLoading, setIsSpotsLoading] = useState(false);
  const [spotSearch, setSpotSearch] = useState("");
  const [selectedSpotIds, setSelectedSpotIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRegion = useMemo(
    () => regions.find((region) => region.regionId === selectedRegionId) ?? null,
    [regions, selectedRegionId],
  );

  const filteredSpots = useMemo(() => {
    const query = spotSearch.trim().toLowerCase();
    if (!query) return spots;
    return spots.filter(
      (spot) =>
        spot.name.toLowerCase().includes(query) ||
        spot.address.toLowerCase().includes(query),
    );
  }, [spots, spotSearch]);

  const fetchRegions = useCallback(async () => {
    setIsRegionsLoading(true);
    try {
      const data = await getRegions();
      setRegions(data);
      setSelectedRegionId((prev) => prev ?? data[0]?.regionId ?? null);
    } catch (error) {
      console.warn("[create-marvel-board] getRegions failed:", error);
      setRegions([]);
      setSelectedRegionId(null);
    } finally {
      setIsRegionsLoading(false);
    }
  }, []);

  const fetchSpots = useCallback(async (region: Region) => {
    setIsSpotsLoading(true);
    setSpotSearch("");
    setSelectedSpotIds([]);
    try {
      const data = await getSpots({ lDongSignguCd: region.lDongSignguCd });
      setSpots(data);
    } catch (error) {
      console.warn("[create-marvel-board] getSpots failed:", error);
      setSpots([]);
    } finally {
      setIsSpotsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRegions();
  }, [fetchRegions]);

  useEffect(() => {
    if (!selectedRegion) {
      setSpots([]);
      setSelectedSpotIds([]);
      setSpotSearch("");
      return;
    }
    void fetchSpots(selectedRegion);
  }, [selectedRegion, fetchSpots]);

  const toggleSpot = useCallback((spot: Spot) => {
    setSelectedSpotIds((prev) => {
      if (prev.includes(spot.spotId)) {
        return prev.filter((id) => id !== spot.spotId);
      }
      if (prev.length >= 11) {
        showAlert("선택 제한", "관광지는 최대 11곳까지 선택할 수 있어요.");
        return prev;
      }
      return [...prev, spot.spotId];
    });
  }, []);

  const canSubmit = name.trim().length > 0 && !isSubmitting;

  const handleCreate = async () => {
    if (!canSubmit) return;
    if (!selectedRegion) {
      showAlert("지역 선택", "여행 지역을 선택해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createBoard({
        boardName: name.trim(),
        lDongSignguCd: selectedRegion.lDongSignguCd,
        spotIds: selectedSpotIds,
      });
      showAlert("생성 완료", "마블판이 만들어졌어요.", [
        { text: "확인", onPress: () => router.back() },
      ]);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? "마블판을 만들지 못했어요. 잠시 후 다시 시도해 주세요."
          : "네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.";
      showAlert("생성 실패", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <div className="flex items-center px-2 py-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center text-[32px] font-light text-[#1A1A1B]"
        >
          ‹
        </button>
        <h1 className="flex-1 text-center text-[16px] font-bold text-[#1A1A1B]">
          새 마블판
        </h1>
        <span className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-28">
        <div className="flex flex-col items-center pb-6 pt-2 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF3ED] text-2xl">
            🧭
          </div>
          <h2 className="text-[22px] font-extrabold tracking-[-0.4px] text-[#1A1A1B]">
            어떤 여행을 계획 중이신가요?
          </h2>
          <p className="mt-2 text-[14px] leading-5 text-[#9E9E9E]">
            이름과 지역만 정하면 나만의 마블판이 바로 만들어져요
          </p>
        </div>

        <label className="mb-2 block text-[13px] font-bold text-[#1A1A1B]">
          마블판 이름
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예) 속초 주말 여행"
          className="mb-6 w-full rounded-2xl border border-[#E8E8EC] bg-[#F5F5F7] px-4 py-3.5 text-[15px] outline-none focus:border-[#F26522]"
        />

        <div className="mb-2 flex items-center justify-between">
          <p className="text-[13px] font-bold text-[#1A1A1B]">여행 지역</p>
          {selectedRegion ? (
            <p className="text-[12px] font-semibold text-[#F26522]">
              {selectedRegion.name}
            </p>
          ) : null}
        </div>

        {isRegionsLoading ? (
          <div className="flex justify-center py-6">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#F26522]/30 border-t-[#F26522]" />
          </div>
        ) : regions.length === 0 ? (
          <div className="py-4">
            <p className="text-[13px] text-[#9E9E9E]">
              지역 목록을 불러오지 못했어요
            </p>
            <button
              type="button"
              onClick={() => void fetchRegions()}
              className="mt-2 text-[14px] font-bold text-[#F26522]"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
            {regions.map((region) => {
              const selected = region.regionId === selectedRegionId;
              return (
                <button
                  key={region.regionId}
                  type="button"
                  onClick={() => setSelectedRegionId(region.regionId)}
                  className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold ${
                    selected
                      ? "bg-[#F26522] text-white"
                      : "bg-[#F5F5F7] text-[#6B6B70]"
                  }`}
                >
                  {region.name}
                </button>
              );
            })}
          </div>
        )}

        {selectedRegion ? (
          <>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[13px] font-bold text-[#1A1A1B]">관광지 선택</p>
              <p className="text-[12px] font-semibold text-[#9E9E9E]">
                {selectedSpotIds.length} / 11
              </p>
            </div>
            <input
              value={spotSearch}
              onChange={(e) => setSpotSearch(e.target.value)}
              placeholder="명소 이름 · 주소 검색"
              className="mb-3 w-full rounded-2xl border border-[#E8E8EC] bg-[#F5F5F7] px-4 py-3 text-[14px] outline-none focus:border-[#F26522]"
            />
            {isSpotsLoading ? (
              <div className="flex justify-center py-10">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#F26522]/30 border-t-[#F26522]" />
              </div>
            ) : filteredSpots.length === 0 ? (
              <p className="py-8 text-center text-[14px] text-[#9E9E9E]">
                선택할 관광지가 없어요
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {filteredSpots.map((spot) => (
                  <li key={spot.spotId}>
                    <SpotCard
                      spot={spot}
                      selected={selectedSpotIds.includes(spot.spotId)}
                      onPress={toggleSpot}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[430px] bg-white px-6 pb-6 pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => void handleCreate()}
          className="w-full rounded-[18px] bg-[#F26522] py-[18px] text-[17px] font-bold text-white disabled:opacity-45"
        >
          {isSubmitting ? "만드는 중…" : "마블판 만들기"}
        </button>
      </div>
    </div>
  );
}
