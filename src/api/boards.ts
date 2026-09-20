import { apiClient } from "@/lib/api-client";

export type BoardStatus = "PLAYING" | "COMPLETED";

export type Board = {
  boardId: number;
  userId: number;
  regionId: number;
  regionName: string;
  boardName: string;
  lDongSignguCd: string;
  currentPosition: number;
  status: BoardStatus;
};

export type CreateBoardRequest = {
  boardName: string;
  lDongSignguCd: string;
  spotIds: number[];
};

export type BoardTileType = "START" | "TOUR" | "CARD" | "EVENT";

export type BoardTile = {
  boardTileId: number;
  spotId: number | null;
  spotName: string;
  imageUrl: string | null;
  tileOrder: number;
  tileType: BoardTileType;
  isUnlocked: boolean;
  visitId?: number | null;
};

export type BoardPosition = {
  boardId: number;
  currentPosition: number;
  status: BoardStatus;
  tileId: number;
  tileType: BoardTileType;
  spotId: number | null;
  spotName: string;
  visitId?: number | null;
};

export type BoardRollResponse = {
  boardId: number;
  diceNumber: number;
  beforePosition: number;
  afterPosition: number;
  status: BoardStatus;
  currentTileId: number;
  spotId: number | null;
  spotName: string;
  imageUrl: string | null;
  visitId?: number | null;
};

export const BOARD_MAX_POSITION = 11;

export const BOARD_STATUS_LABEL: Record<BoardStatus, string> = {
  PLAYING: "진행 중",
  COMPLETED: "완주",
};

export const BOARD_TILE_TYPE_LABEL: Record<BoardTileType, string> = {
  START: "START",
  TOUR: "TOUR",
  CARD: "CARD",
  EVENT: "EVENT",
};

export function getBoards() {
  return apiClient.get<Board[]>("/boards");
}

export function createBoard(body: CreateBoardRequest) {
  return apiClient.post<Board>("/boards", body);
}

export function deleteBoard(boardId: number) {
  return apiClient.delete(`/boards/${boardId}`);
}

export function getBoardTiles(boardId: number) {
  return apiClient.get<BoardTile[]>(`/boards/${boardId}/tiles`);
}

export function getBoardPosition(boardId: number) {
  return apiClient.get<BoardPosition>(`/boards/${boardId}/position`);
}

export function rollBoard(boardId: number) {
  return apiClient.post<BoardRollResponse>(`/boards/${boardId}/roll`);
}
