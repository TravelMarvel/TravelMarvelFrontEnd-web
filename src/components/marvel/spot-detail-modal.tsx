"use client";

import { useEffect, useRef, useState } from "react";

import { getVisitPhoto, uploadVisitPhoto } from "@/api/photos";
import { getSpot, type SpotDetail } from "@/api/spots";
import { ApiError } from "@/lib/api-client";
import { showAlert } from "@/lib/app-alert";

type Props = {
  spotId: number | null;
  visible: boolean;
  onClose: () => void;
  isUnlocked?: boolean;
  visitId?: number | null;
  userPhotoUrl?: string | null;
  onPhotoUploaded?: (imageUrl: string) => void;
};

function getDescription(spot: SpotDetail) {
  const raw = spot.overview?.trim() || spot.description?.trim() || "";
  if (!raw) return null;

  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hasValidCoordinates(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180 &&
    !(latitude === 0 && longitude === 0)
  );
}

/** 카카오맵에서 위치 보기 */
function getMapUrl(spot: SpotDetail) {
  const { latitude, longitude, name } = spot;
  const label = name.trim() || "장소";
  return `https://map.kakao.com/link/map/${encodeURIComponent(label)},${latitude},${longitude}`;
}

function SpotMapPreview({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const src = `/api/kakao/static-map?lat=${latitude}&lng=${longitude}`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="카카오맵 미리보기"
      className="h-full w-full object-cover"
    />
  );
}

export function SpotDetailModal({
  spotId,
  visible,
  onClose,
  isUnlocked = false,
  visitId = null,
  userPhotoUrl = null,
  onPhotoUploaded,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [spot, setSpot] = useState<SpotDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null);
  const [photoId, setPhotoId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || spotId == null) {
      setSpot(null);
      setErrorMessage(null);
      setIsLoading(false);
      setIsUploadingPhoto(false);
      setLocalPhotoUrl(null);
      setPhotoId(null);
      setPreviewUrl(null);
      return;
    }

    setLocalPhotoUrl((current) => current ?? userPhotoUrl ?? null);
    let cancelled = false;

    const fetchSpot = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setSpot(null);
      try {
        const data = await getSpot(spotId);
        if (!cancelled) setSpot(data);
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(
          error instanceof ApiError
            ? "관광지 정보를 불러오지 못했어요."
            : "네트워크 오류가 발생했어요.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    const fetchPhoto = async () => {
      if (visitId == null || visitId <= 0) return;
      try {
        const photo = await getVisitPhoto(visitId);
        if (!cancelled && photo?.imageUrl) {
          setLocalPhotoUrl(photo.imageUrl);
          if (photo.photoId != null) setPhotoId(photo.photoId);
        }
      } catch (error) {
        console.warn("[spot-detail-modal] getVisitPhoto failed:", error);
      }
    };

    void fetchSpot();
    void fetchPhoto();
    return () => {
      cancelled = true;
    };
  }, [visible, spotId, visitId, userPhotoUrl]);

  const description = spot ? getDescription(spot) : null;
  const hasLocation = spot
    ? hasValidCoordinates(spot.latitude, spot.longitude)
    : false;
  const displayedPhotoUrl = localPhotoUrl ?? userPhotoUrl;

  const handlePickPhoto = () => {
    if (isUploadingPhoto) return;
    if (!isUnlocked) {
      showAlert("방문 후 등록", "이 명소에 도착하면 사진을 등록할 수 있어요.");
      return;
    }
    if (visitId == null || visitId <= 0) {
      showAlert(
        "사진 등록 불가",
        "이 명소의 방문 정보(visitId)를 찾지 못했어요.",
      );
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || visitId == null) return;

    const contentType = file.type.startsWith("image/")
      ? file.type
      : "image/jpeg";
    const preview = URL.createObjectURL(file);
    setLocalPhotoUrl(preview);
    setIsUploadingPhoto(true);

    try {
      let nextPhotoId = photoId;
      const isChange = Boolean(displayedPhotoUrl?.trim());
      if (isChange && (nextPhotoId == null || nextPhotoId <= 0)) {
        const existing = await getVisitPhoto(visitId);
        if (existing?.photoId != null) {
          nextPhotoId = existing.photoId;
          setPhotoId(existing.photoId);
        }
      }

      const photo = await uploadVisitPhoto({
        visitId,
        file,
        contentType,
        photoId: isChange ? nextPhotoId : null,
      });
      const nextUrl = photo.imageUrl?.trim() || preview;
      setLocalPhotoUrl(nextUrl);
      if (photo.photoId != null) setPhotoId(photo.photoId);
      onPhotoUploaded?.(nextUrl);
    } catch (error) {
      console.warn("[spot-detail-modal] upload failed:", error);
      showAlert(
        "업로드 실패",
        error instanceof ApiError
          ? "사진을 올리지 못했어요. 잠시 후 다시 시도해 주세요."
          : "네트워크 오류가 발생했어요.",
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFileChange(e)}
      />

      <div className="flex max-h-[92dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-[#F0F0F2] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="px-1 text-[15px] font-semibold text-[#9E9E9E]"
          >
            닫기
          </button>
          <h2 className="text-[16px] font-bold text-[#1A1A1B]">명소 정보</h2>
          <span className="w-10" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#F26522]/30 border-t-[#F26522]" />
            </div>
          ) : errorMessage ? (
            <p className="py-10 text-center text-[14px] text-[#9E9E9E]">
              {errorMessage}
            </p>
          ) : spot ? (
            <div className="flex flex-col gap-4">
              {spot.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={spot.imageUrl}
                  alt={spot.name}
                  className="aspect-[16/10] w-full rounded-2xl object-cover"
                />
              ) : null}

              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[22px] font-extrabold tracking-[-0.4px] text-[#1A1A1B]">
                    {spot.name}
                  </h3>
                  <p className="mt-1 text-[13px] font-medium text-[#9E9E9E]">
                    📍 {spot.address}
                  </p>
                </div>
                {hasLocation ? (
                  <a
                    href={getMapUrl(spot)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-full bg-[#FFF3ED] px-3 py-1.5 text-[12px] font-bold text-[#F26522]"
                  >
                    지도표시
                  </a>
                ) : null}
              </div>

              {description ? (
                <p className="whitespace-pre-line text-[14px] leading-6 text-[#4A4A4E]">
                  {description}
                </p>
              ) : null}

              {hasLocation ? (
                <div className="h-40 overflow-hidden rounded-2xl bg-[#F5F5F7]">
                  <SpotMapPreview
                    latitude={spot.latitude}
                    longitude={spot.longitude}
                  />
                </div>
              ) : null}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[13px] font-bold text-[#1A1A1B]">내 사진</p>
                  <p className="text-[12px] text-[#9E9E9E]">명소당 1장</p>
                </div>

                {isUploadingPhoto ? (
                  <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#F5F5F7] py-10">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#F26522]/30 border-t-[#F26522]" />
                    <p className="text-[13px] text-[#9E9E9E]">사진 업로드 중…</p>
                  </div>
                ) : !isUnlocked ? (
                  <div className="rounded-2xl bg-[#F5F5F7] px-4 py-8 text-center">
                    <p className="text-[14px] font-bold text-[#1A1A1B]">
                      아직 방문하지 않은 명소예요
                    </p>
                    <p className="mt-1 text-[12px] text-[#9E9E9E]">
                      이 칸에 도착하면 사진을 등록할 수 있어요
                    </p>
                  </div>
                ) : displayedPhotoUrl ? (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewUrl(displayedPhotoUrl)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={displayedPhotoUrl}
                        alt="내 사진"
                        className="aspect-[4/3] w-full rounded-2xl object-cover"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={handlePickPhoto}
                      className="rounded-xl border border-[#E8E8EC] py-3 text-[14px] font-bold text-[#1A1A1B]"
                    >
                      사진 변경
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handlePickPhoto}
                    className="flex w-full flex-col items-center gap-1 rounded-2xl border border-dashed border-[#F26522]/50 bg-[#FFF3ED] py-8"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-[#F26522]">
                      ＋
                    </span>
                    <p className="text-[14px] font-bold text-[#1A1A1B]">
                      사진 등록
                    </p>
                    <p className="text-[12px] text-[#9E9E9E]">
                      이 명소에서 남긴 사진을 추가해 보세요
                    </p>
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {previewUrl ? (
        <button
          type="button"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="미리보기"
            className="max-h-full max-w-full object-contain"
          />
        </button>
      ) : null}
    </div>
  );
}
