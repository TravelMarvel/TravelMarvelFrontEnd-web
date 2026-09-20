"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  deleteBoard,
  getBoardPosition,
  getBoardTiles,
  rollBoard,
  type BoardStatus,
  type BoardTile,
  type BoardTileType,
} from "@/api/boards";
import {
  BOARD_DICE_SIZE,
  MarvelBoardGrid,
} from "@/components/marvel/marvel-board-grid";
import { SpotDetailModal } from "@/components/marvel/spot-detail-modal";
import { ApiError } from "@/lib/api-client";
import { showAlert } from "@/lib/app-alert";

const LEGEND: { type: BoardTileType; color: string; background: string }[] = [
  { type: "TOUR", color: "#F26522", background: "#FFF3ED" },
  { type: "CARD", color: "#2A9D8F", background: "#E8F6F3" },
  { type: "EVENT", color: "#7B6CF6", background: "#F0EDFF" },
];

const ROLL_DURATION_MS = 1200;
const FACE_TICK_MS = 70;
const RESULT_HOLD_MS = 700;
const DICE_MIN = 1;
const DICE_MAX = 3;

function clampDiceRoll(value: number) {
  if (!Number.isFinite(value)) return DICE_MIN;
  return Math.min(Math.max(Math.round(value), DICE_MIN), DICE_MAX);
}

function randomDiceFace() {
  return Math.floor(Math.random() * (DICE_MAX - DICE_MIN + 1)) + DICE_MIN;
}

function normalizePosition(position: number) {
  if (!Number.isFinite(position) || position <= 0) return 1;
  return position;
}

function toVisitId(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

type Props = {
  boardId: number;
  boardName?: string;
  regionName?: string;
  fallbackPosition?: number;
};

export function MarvelBoardDetailScreen({
  boardId,
  boardName,
  regionName = "마블",
  fallbackPosition = 1,
}: Props) {
  const router = useRouter();
  const [tiles, setTiles] = useState<BoardTile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [boardStatus, setBoardStatus] = useState<BoardStatus>("PLAYING");
  const [currentPosition, setCurrentPosition] = useState(
    normalizePosition(fallbackPosition),
  );
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [lastLandedName, setLastLandedName] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [displayFace, setDisplayFace] = useState(DICE_MIN);
  const [boardWidth, setBoardWidth] = useState(0);
  const [diceTravel, setDiceTravel] = useState(0);
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [selectedUnlocked, setSelectedUnlocked] = useState(false);
  const [visitIdBySpotId, setVisitIdBySpotId] = useState<Record<number, number>>(
    {},
  );
  const [photoUrlBySpotId, setPhotoUrlBySpotId] = useState<
    Record<number, string>
  >({});
  const [isDeleting, setIsDeleting] = useState(false);

  const rollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const faceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const boardTitle = useMemo(
    () => boardName?.trim() || `${regionName.replace(/\s+/g, "")}마블`,
    [boardName, regionName],
  );
  const isCompleted = boardStatus === "COMPLETED";

  const clearRollTimers = useCallback(() => {
    if (rollTimeoutRef.current) {
      clearTimeout(rollTimeoutRef.current);
      rollTimeoutRef.current = null;
    }
    if (faceIntervalRef.current) {
      clearInterval(faceIntervalRef.current);
      faceIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  useEffect(() => () => clearRollTimers(), [clearRollTimers]);

  const fetchBoard = useCallback(async () => {
    if (!Number.isFinite(boardId) || boardId <= 0) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    try {
      const [tileData, positionData] = await Promise.all([
        getBoardTiles(boardId),
        getBoardPosition(boardId),
      ]);

      const position = normalizePosition(positionData.currentPosition);
      const currentVisitId = toVisitId(positionData.visitId);
      const sorted = [...tileData]
        .sort((a, b) => a.tileOrder - b.tileOrder)
        .map((tile) => {
          const visitId =
            toVisitId(tile.visitId) ??
            (tile.tileOrder === position ? currentVisitId : null);
          return {
            ...tile,
            isUnlocked: tile.isUnlocked || tile.tileOrder === position,
            visitId,
          };
        });
      setTiles(sorted);

      const visitMap: Record<number, number> = {};
      for (const tile of sorted) {
        if (tile.spotId != null && tile.visitId != null) {
          visitMap[tile.spotId] = tile.visitId;
        }
      }
      if (positionData.spotId != null && currentVisitId != null) {
        visitMap[positionData.spotId] = currentVisitId;
      }
      if (Object.keys(visitMap).length > 0) {
        setVisitIdBySpotId((prev) => ({ ...prev, ...visitMap }));
      }

      setBoardStatus(positionData.status);
      setCurrentPosition(position);
      setLastLandedName(positionData.spotName || null);
    } catch (error) {
      console.warn("[marvel-board-detail] fetchBoard failed:", error);
      setTiles([]);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    void fetchBoard();
  }, [fetchBoard]);

  const playRollAnimation = useCallback(
    (
      roll: number,
      afterPosition: number,
      spotName: string | null,
      status: BoardStatus,
    ) => {
      const travel = Math.max(boardWidth - BOARD_DICE_SIZE - 8, 180);
      const resultFace = clampDiceRoll(roll);
      const startedAt = performance.now();

      setIsRolling(true);
      setLastLandedName(null);
      setDisplayFace(randomDiceFace());
      setDiceTravel(0);
      clearRollTimers();

      faceIntervalRef.current = setInterval(() => {
        setDisplayFace(randomDiceFace());
      }, FACE_TICK_MS);

      const tick = (now: number) => {
        const t = Math.min((now - startedAt) / ROLL_DURATION_MS, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setDiceTravel(travel * eased);
        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(tick);
        }
      };
      animFrameRef.current = requestAnimationFrame(tick);

      rollTimeoutRef.current = setTimeout(() => {
        clearRollTimers();
        setDisplayFace(resultFace);
        setLastRoll(resultFace);
        setCurrentPosition(normalizePosition(afterPosition));
        setLastLandedName(spotName);
        setBoardStatus(status);
        setDiceTravel(travel);
        setTiles((prev) =>
          prev.map((tile) =>
            tile.tileOrder === afterPosition
              ? { ...tile, isUnlocked: true }
              : tile,
          ),
        );

        rollTimeoutRef.current = setTimeout(() => {
          setIsRolling(false);
          setDiceTravel(0);
        }, RESULT_HOLD_MS);
      }, ROLL_DURATION_MS);
    },
    [boardWidth, clearRollTimers],
  );

  const handleDicePress = async () => {
    if (tiles.length === 0 || isRolling || isCompleted) return;
    setIsRolling(true);

    try {
      const result = await rollBoard(boardId);
      const visitId = toVisitId(result.visitId);

      if (result.spotId != null && visitId != null) {
        setVisitIdBySpotId((prev) => ({
          ...prev,
          [result.spotId!]: visitId,
        }));
        setTiles((prev) =>
          prev.map((tile) =>
            tile.spotId === result.spotId ? { ...tile, visitId } : tile,
          ),
        );
      }

      playRollAnimation(
        result.diceNumber,
        result.afterPosition,
        result.spotName || null,
        result.status,
      );
    } catch (error) {
      setIsRolling(false);
      const message =
        error instanceof ApiError
          ? "주사위를 굴리지 못했어요. 잠시 후 다시 시도해 주세요."
          : "네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.";
      showAlert("굴리기 실패", message);
    }
  };

  const handleTilePress = useCallback(
    (tile: BoardTile) => {
      if (tile.spotId == null) return;
      const isArrived = tile.isUnlocked || tile.tileOrder === currentPosition;
      const visitId =
        toVisitId(tile.visitId) ?? visitIdBySpotId[tile.spotId] ?? null;
      setSelectedSpotId(tile.spotId);
      setSelectedVisitId(visitId);
      setSelectedUnlocked(isArrived);
    },
    [currentPosition, visitIdBySpotId],
  );

  const handleDelete = useCallback(() => {
    if (!Number.isFinite(boardId) || boardId <= 0 || isDeleting || isRolling)
      return;

    showAlert(
      "마블판 삭제",
      `"${boardTitle}" 마블판을 삭제할까요?\n등록한 이미지도 함께 삭제됩니다.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setIsDeleting(true);
              try {
                await deleteBoard(boardId);
                router.back();
              } catch (error) {
                const message =
                  error instanceof ApiError
                    ? "마블판을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요."
                    : "네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.";
                showAlert("삭제 실패", message);
              } finally {
                setIsDeleting(false);
              }
            })();
          },
        },
      ],
    );
  }, [boardId, boardTitle, isDeleting, isRolling, router]);

  const diceDisabled =
    isLoading || hasError || tiles.length === 0 || isRolling || isCompleted;

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
          스마트 관광 도슨트
        </h1>
        <button
          type="button"
          disabled={isDeleting || isRolling}
          onClick={handleDelete}
          className="px-2 text-[13px] font-semibold text-[#9E9E9E] disabled:opacity-45"
        >
          {isDeleting ? "…" : "삭제"}
        </button>
      </div>

      <div className="flex items-start justify-between gap-2 px-6 pb-4">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[26px] font-extrabold tracking-[-0.6px] text-[#F26522]">
            {boardTitle}
          </h2>
          <p className="mt-1 text-[13px] font-medium text-[#9E9E9E]">
            {isCompleted
              ? "이 마블판을 완주했어요!"
              : isRolling
                ? "주사위가 굴러가는 중..."
                : "하단에서 주사위를 굴리세요!"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {LEGEND.map((item) => (
            <span
              key={item.type}
              className="rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-[0.3px]"
              style={{ color: item.color, backgroundColor: item.background }}
            >
              {item.type}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4">
        {isLoading ? (
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#F26522]/30 border-t-[#F26522]" />
        ) : hasError ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-[14px] font-medium text-[#9E9E9E]">
              마블판을 불러오지 못했어요
            </p>
            <button
              type="button"
              onClick={() => void fetchBoard()}
              className="text-[14px] font-bold text-[#F26522]"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <MarvelBoardGrid
            tiles={tiles}
            currentPosition={currentPosition}
            isCompleted={isCompleted}
            isRolling={isRolling}
            displayFace={displayFace}
            diceTravel={diceTravel}
            onBoardWidthChange={setBoardWidth}
            onTilePress={handleTilePress}
          />
        )}
      </div>

      <button
        type="button"
        disabled={diceDisabled}
        onClick={() => void handleDicePress()}
        className={`mx-6 mb-4 mt-4 flex items-center gap-4 rounded-2xl border border-[#E8E8EC] bg-white p-4 shadow-[0_4px_12px_rgba(26,26,27,0.08)] disabled:opacity-55 ${
          isRolling ? "border-[#F26522]" : ""
        }`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F26522] text-2xl">
          🎲
        </span>
        <span className="flex-1 text-left">
          {isCompleted ? (
            <>
              <span className="block text-[16px] font-bold text-[#1A1A1B]">
                완주 완료!
              </span>
              <span className="block text-[13px] font-medium text-[#9E9E9E]">
                모든 칸을 탐험했어요
              </span>
            </>
          ) : isRolling ? (
            <>
              <span className="block text-[16px] font-bold text-[#1A1A1B]">
                굴리는 중...
              </span>
              <span className="block text-[13px] font-medium text-[#9E9E9E]">
                보드 위를 확인하세요
              </span>
            </>
          ) : lastRoll == null ? (
            <>
              <span className="block text-[16px] font-bold text-[#1A1A1B]">
                주사위를 굴려보세요
              </span>
              <span className="block text-[13px] font-medium text-[#9E9E9E]">
                터치하면 1~3칸 이동합니다
              </span>
            </>
          ) : (
            <>
              <span className="block text-[16px] font-bold text-[#1A1A1B]">
                주사위 눈수:{" "}
                <span className="text-[#F26522]">{lastRoll}</span>
              </span>
              <span className="block text-[13px] font-medium text-[#9E9E9E]">
                {lastLandedName
                  ? `${lastLandedName} ${lastRoll}칸 이동!`
                  : `${lastRoll}칸 이동!`}
              </span>
            </>
          )}
        </span>
      </button>

      <SpotDetailModal
        spotId={selectedSpotId}
        visitId={selectedVisitId}
        isUnlocked={selectedUnlocked}
        userPhotoUrl={
          selectedSpotId != null
            ? (photoUrlBySpotId[selectedSpotId] ?? null)
            : null
        }
        visible={selectedSpotId != null}
        onClose={() => {
          setSelectedSpotId(null);
          setSelectedVisitId(null);
          setSelectedUnlocked(false);
        }}
        onPhotoUploaded={(imageUrl) => {
          if (selectedSpotId == null) return;
          setPhotoUrlBySpotId((prev) => ({
            ...prev,
            [selectedSpotId]: imageUrl,
          }));
          setTiles((prev) =>
            prev.map((tile) =>
              tile.spotId === selectedSpotId ? { ...tile, imageUrl } : tile,
            ),
          );
        }}
      />
    </div>
  );
}
