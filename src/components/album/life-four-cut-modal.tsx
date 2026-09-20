"use client";

import { useEffect, useMemo, useState } from "react";

import {
  formatPhotoUploadedAt,
  getPhotoSpotName,
  type Photo,
} from "@/api/photos";
import { showAlert } from "@/lib/app-alert";

type Props = {
  photos: Photo[];
  onClose: () => void;
};

const DEFAULT_TITLE = "TRAVEL MARBLE";
const CANVAS_WIDTH = 720;
const PADDING = 28;
const GAP = 16;
const CELL_W = (CANVAS_WIDTH - PADDING * 2 - GAP) / 2;
const CELL_H = CELL_W * (4 / 3);

function getPhotoKey(photo: Photo) {
  if (photo.photoId != null) return String(photo.photoId);
  return photo.imageUrl;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`이미지 로드 실패: ${src}`));
    // 외부 이미지 CORS 회피용 프록시
    img.src = `/api/image-proxy?url=${encodeURIComponent(src)}`;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

async function buildFourCutBlob(photos: Photo[], title: string) {
  const images = await Promise.all(photos.map((photo) => loadImage(photo.imageUrl)));

  const titleHeight = 56;
  const footerHeight = 36;
  const height =
    PADDING + titleHeight + CELL_H * 2 + GAP + footerHeight + PADDING;

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("캔버스를 만들 수 없어요.");

  ctx.fillStyle = "#1A1A1B";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 28px Outfit, Apple SD Gothic Neo, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, CANVAS_WIDTH / 2, PADDING + 34);

  const positions = [
    { x: PADDING, y: PADDING + titleHeight },
    { x: PADDING + CELL_W + GAP, y: PADDING + titleHeight },
    { x: PADDING, y: PADDING + titleHeight + CELL_H + GAP },
    { x: PADDING + CELL_W + GAP, y: PADDING + titleHeight + CELL_H + GAP },
  ];

  images.forEach((img, index) => {
    const pos = positions[index];
    ctx.save();
    const radius = 12;
    ctx.beginPath();
    ctx.moveTo(pos.x + radius, pos.y);
    ctx.arcTo(pos.x + CELL_W, pos.y, pos.x + CELL_W, pos.y + CELL_H, radius);
    ctx.arcTo(pos.x + CELL_W, pos.y + CELL_H, pos.x, pos.y + CELL_H, radius);
    ctx.arcTo(pos.x, pos.y + CELL_H, pos.x, pos.y, radius);
    ctx.arcTo(pos.x, pos.y, pos.x + CELL_W, pos.y, radius);
    ctx.closePath();
    ctx.clip();
    drawCover(ctx, img, pos.x, pos.y, CELL_W, CELL_H);
    ctx.restore();
  });

  ctx.fillStyle = "#9E9E9E";
  ctx.font = "600 16px Outfit, Apple SD Gothic Neo, sans-serif";
  ctx.fillText("Travel Marble", CANVAS_WIDTH / 2, height - PADDING - 8);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) {
    throw new Error(
      "이미지를 만들지 못했어요. 사진 서버 CORS 설정을 확인해 주세요.",
    );
  }
  return blob;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function LifeFourCutModal({ photos, onClose }: Props) {
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [isBusy, setIsBusy] = useState(false);
  const displayTitle = title.trim() || DEFAULT_TITLE;

  const canShareFiles = useMemo(() => {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      return false;
    }
    if (typeof navigator.canShare !== "function") return true;
    try {
      return navigator.canShare({
        files: [new File([""], "test.png", { type: "image/png" })],
      });
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    setTitle(DEFAULT_TITLE);
    setIsBusy(false);
  }, [photos]);

  const handleExport = async (mode: "share" | "download") => {
    if (photos.length !== 4 || isBusy) return;
    setIsBusy(true);

    try {
      const blob = await buildFourCutBlob(photos, displayTitle);
      const file = new File([blob], "travel-marble-fourcut.png", {
        type: "image/png",
      });

      if (mode === "share" && canShareFiles) {
        await navigator.share({
          files: [file],
          title: "인생네컷",
          text: displayTitle,
        });
      } else {
        downloadBlob(blob, "travel-marble-fourcut.png");
        showAlert("저장 완료", "인생네컷 이미지를 다운로드했어요.");
      }
    } catch (error) {
      console.warn("[album] four-cut export failed:", error);
      const message =
        error instanceof Error
          ? error.message
          : "이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요.";
      showAlert("공유 실패", message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="max-h-[90dvh] w-full max-w-[340px] overflow-y-auto rounded-3xl bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-[#1A1A1B]">인생네컷</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] font-semibold text-[#9E9E9E]"
          >
            닫기
          </button>
        </div>

        <label className="mb-1 block text-[12px] font-bold text-[#9E9E9E]">
          제목
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={24}
          className="mb-3 w-full rounded-xl border border-[#E8E8EC] bg-[#F5F5F7] px-3 py-2.5 text-[14px] font-semibold outline-none focus:border-[#F26522]"
        />

        <div className="rounded-2xl bg-[#1A1A1B] p-3">
          <p className="mb-3 text-center text-[15px] font-extrabold tracking-wide text-white">
            {displayTitle}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {photos.map((photo) => (
              <div key={getPhotoKey(photo)} className="overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.imageUrl}
                  alt={getPhotoSpotName(photo) ?? ""}
                  className="aspect-[3/4] w-full object-cover"
                  crossOrigin="anonymous"
                />
                <p className="truncate bg-black/40 px-1.5 py-1 text-[10px] text-white/90">
                  {getPhotoSpotName(photo) ?? "명소"} ·{" "}
                  {formatPhotoUploadedAt(photo.uploadedAt) ?? ""}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-[11px] text-[#9E9E9E]">
            Travel Marble
          </p>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {canShareFiles ? (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void handleExport("share")}
              className="w-full rounded-2xl bg-[#F26522] py-3.5 text-[15px] font-bold text-white disabled:opacity-55"
            >
              {isBusy ? "만드는 중…" : "공유하기"}
            </button>
          ) : null}
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void handleExport("download")}
            className={`w-full rounded-2xl py-3.5 text-[15px] font-bold disabled:opacity-55 ${
              canShareFiles
                ? "border border-[#E8E8EC] bg-white text-[#1A1A1B]"
                : "bg-[#F26522] text-white"
            }`}
          >
            {isBusy ? "만드는 중…" : "이미지 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
