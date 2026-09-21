"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  formatPhotoUploadedAt,
  getPhotoSpotName,
  getRegionPhotos,
  type Photo,
} from "@/api/photos";
import { getRegions, type Region } from "@/api/regions";
import { LifeFourCutModal } from "@/components/album/life-four-cut-modal";
import { showAlert } from "@/lib/app-alert";

const ALL_PHOTOS_KEY = "__all__";
const SHARE_PHOTO_COUNT = 4;

function getPhotoKey(photo: Photo) {
  if (photo.photoId != null) return String(photo.photoId);
  return photo.imageUrl;
}

export function AlbumScreen() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [isRegionsLoading, setIsRegionsLoading] = useState(true);
  const [photosByRegion, setPhotosByRegion] = useState<Record<string, Photo[]>>(
    {},
  );
  const [loadingRegionCode, setLoadingRegionCode] = useState<string | null>(
    null,
  );
  const [errorRegionCode, setErrorRegionCode] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [sharePhotos, setSharePhotos] = useState<Photo[]>([]);
  const [fourCutPhotos, setFourCutPhotos] = useState<Photo[] | null>(null);
  const photosByRegionRef = useRef(photosByRegion);
  photosByRegionRef.current = photosByRegion;

  const selectedRegion = useMemo(
    () =>
      selectedRegionId == null
        ? null
        : (regions.find((region) => region.regionId === selectedRegionId) ??
          null),
    [regions, selectedRegionId],
  );
  const selectedCode =
    selectedRegionId == null
      ? ALL_PHOTOS_KEY
      : (selectedRegion?.lDongSignguCd ?? null);
  const photos = selectedCode ? (photosByRegion[selectedCode] ?? []) : [];
  const isPhotosLoading =
    selectedCode != null && loadingRegionCode === selectedCode;
  const hasPhotoError =
    selectedCode != null && errorRegionCode === selectedCode;

  const fetchRegions = useCallback(async () => {
    setIsRegionsLoading(true);
    try {
      const data = await getRegions();
      setRegions(data);
    } catch (error) {
      console.warn("[album] getRegions failed:", error);
      setRegions([]);
    } finally {
      setIsRegionsLoading(false);
    }
  }, []);

  const fetchPhotos = useCallback(async (lDongSignguCd: string | null) => {
    const cacheKey = lDongSignguCd ?? ALL_PHOTOS_KEY;
    if (photosByRegionRef.current[cacheKey]) return;

    setLoadingRegionCode(cacheKey);
    setErrorRegionCode((current) => (current === cacheKey ? null : current));

    try {
      const data = await getRegionPhotos(lDongSignguCd);
      setPhotosByRegion((prev) => ({ ...prev, [cacheKey]: data }));
    } catch (error) {
      console.warn("[album] getRegionPhotos failed:", error);
      setErrorRegionCode(cacheKey);
    } finally {
      setLoadingRegionCode((current) =>
        current === cacheKey ? null : current,
      );
    }
  }, []);

  useEffect(() => {
    void fetchRegions();
  }, [fetchRegions]);

  useEffect(() => {
    if (selectedRegionId == null) {
      void fetchPhotos(null);
      return;
    }
    if (selectedRegion) {
      void fetchPhotos(selectedRegion.lDongSignguCd);
    }
  }, [selectedRegionId, selectedRegion, fetchPhotos]);

  const toggleSharePhoto = (photo: Photo) => {
    setSharePhotos((prev) => {
      const key = getPhotoKey(photo);
      if (prev.some((item) => getPhotoKey(item) === key)) {
        return prev.filter((item) => getPhotoKey(item) !== key);
      }
      if (prev.length >= SHARE_PHOTO_COUNT) {
        showAlert("선택 제한", "인생네컷은 사진 4장만 선택할 수 있어요.");
        return prev;
      }
      return [...prev, photo];
    });
  };

  return (
    <div className="relative flex h-full flex-col overflow-y-auto bg-[#F5F5F7]">
      <div className="bg-white px-6 pb-3 pt-3">
        <h1 className="text-[28px] font-extrabold tracking-[-0.5px] text-[#1A1A1B]">
          내 앨범
        </h1>
        <p className="mt-1.5 text-[14px] font-medium leading-5 text-[#9E9E9E]">
          {isSelecting
            ? "인생네컷으로 공유할 사진 4장을 선택하세요"
            : "여행에서 남긴 사진을 지역별로 모아보세요"}
        </p>

        <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
          {isRegionsLoading ? (
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#F26522]/30 border-t-[#F26522]" />
          ) : (
            <>
              <button
                type="button"
                onClick={() => setSelectedRegionId(null)}
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold ${
                  selectedRegionId == null
                    ? "bg-[#F26522] text-white"
                    : "bg-[#F5F5F7] text-[#6B6B70]"
                }`}
              >
                전체
              </button>
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
            </>
          )}
        </div>
      </div>

      <div className="flex-1 px-6 py-4">
        {isPhotosLoading ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#F26522]/30 border-t-[#F26522]" />
          </div>
        ) : hasPhotoError ? (
          <div>
            <p className="text-[14px] text-[#9E9E9E]">사진을 불러오지 못했어요</p>
            <button
              type="button"
              onClick={() => {
                if (selectedCode) {
                  setPhotosByRegion((prev) => {
                    const next = { ...prev };
                    delete next[selectedCode];
                    return next;
                  });
                }
                void fetchPhotos(selectedRegion?.lDongSignguCd ?? null);
              }}
              className="mt-2 text-[14px] font-bold text-[#F26522]"
            >
              다시 시도
            </button>
          </div>
        ) : photos.length === 0 ? (
          <p className="py-16 text-center text-[15px] font-semibold text-[#9E9E9E]">
            아직 등록된 사진이 없어요
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-1.5">
            {photos.map((photo) => {
              const key = getPhotoKey(photo);
              const selected = sharePhotos.some(
                (item) => getPhotoKey(item) === key,
              );
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => {
                      if (isSelecting) {
                        toggleSharePhoto(photo);
                      } else {
                        setSelectedPhoto(photo);
                      }
                    }}
                    className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#E8E8EC]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.imageUrl}
                      alt={getPhotoSpotName(photo) ?? "여행 사진"}
                      className="h-full w-full object-cover"
                    />
                    {isSelecting ? (
                      <span
                        className={`absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                          selected ? "bg-[#F26522]" : "bg-black/35"
                        }`}
                      >
                        {selected ? "✓" : ""}
                      </span>
                    ) : null}
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-1.5 pb-1.5 pt-6 text-left">
                      <span className="block truncate text-[10px] font-bold text-white">
                        {getPhotoSpotName(photo) ?? "명소"}
                      </span>
                      <span className="block text-[9px] text-white/80">
                        {formatPhotoUploadedAt(photo.uploadedAt) ?? ""}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {isSelecting ? (
        <div className="sticky bottom-0 border-t border-[#E8E8EC] bg-white px-6 py-3">
          <div className="mb-2 flex items-center justify-between text-[13px]">
            <button
              type="button"
              onClick={() => {
                setIsSelecting(false);
                setSharePhotos([]);
              }}
              className="font-semibold text-[#9E9E9E]"
            >
              취소
            </button>
            <span className="font-bold text-[#1A1A1B]">
              {sharePhotos.length} / {SHARE_PHOTO_COUNT}
            </span>
          </div>
          <button
            type="button"
            disabled={sharePhotos.length !== SHARE_PHOTO_COUNT}
            onClick={() => setFourCutPhotos(sharePhotos)}
            className="w-full rounded-2xl bg-[#F26522] py-3.5 text-[15px] font-bold text-white disabled:opacity-45"
          >
            인생네컷 만들기
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (photos.length < SHARE_PHOTO_COUNT) {
              showAlert(
                "사진 부족",
                `인생네컷은 사진 ${SHARE_PHOTO_COUNT}장이 필요해요.`,
              );
              return;
            }
            setIsSelecting(true);
            setSharePhotos([]);
          }}
          className="fixed bottom-24 right-[max(1.5rem,calc(50%-215px+1.5rem))] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#333] shadow-[0_4px_16px_rgba(0,0,0,0.18)]"
          aria-label="공유하기"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>
      )}

      {selectedPhoto ? (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedPhoto.imageUrl}
            alt={getPhotoSpotName(selectedPhoto) ?? "사진"}
            className="max-h-full max-w-full object-contain"
          />
        </button>
      ) : null}

      {fourCutPhotos ? (
        <LifeFourCutModal
          photos={fourCutPhotos}
          onClose={() => {
            setFourCutPhotos(null);
            setIsSelecting(false);
            setSharePhotos([]);
          }}
        />
      ) : null}
    </div>
  );
}
