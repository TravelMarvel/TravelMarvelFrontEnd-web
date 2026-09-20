import { apiClient, ApiError } from "@/lib/api-client";

export type PhotoPresignedUrlResponse = {
  fileKey: string;
  uploadUrl: string;
};

export type CreatePhotoRequest = {
  visitId: number;
  fileKey: string;
};

export type Photo = {
  photoId: number;
  visitId: number;
  userId: number;
  spotId: number;
  fileKey: string;
  imageUrl: string;
  uploadedAt: string;
  name?: string | null;
  spotName?: string | null;
};

export function getPhotoSpotName(photo: Pick<Photo, "name" | "spotName">) {
  return photo.name?.trim() || photo.spotName?.trim() || null;
}

export function formatPhotoUploadedAt(uploadedAt?: string | null) {
  if (!uploadedAt?.trim()) return null;

  const date = new Date(uploadedAt);
  if (Number.isNaN(date.getTime())) return uploadedAt.trim();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

export function getVisitPhotoPresignedUrl(visitId: number, contentType: string) {
  return apiClient.post<PhotoPresignedUrlResponse>(
    `/photos/visits/${visitId}/presigned-url`,
    { contentType },
  );
}

function normalizePhoto(data: unknown): Photo | null {
  const item = Array.isArray(data) ? data[0] : data;
  if (!item || typeof item !== "object") return null;

  const raw = item as Record<string, unknown>;
  const imageUrl =
    typeof raw.imageUrl === "string" ? raw.imageUrl.trim() : "";
  if (!imageUrl) return null;

  const name =
    typeof raw.name === "string"
      ? raw.name
      : typeof raw.spotName === "string"
        ? raw.spotName
        : null;
  const uploadedAt =
    typeof raw.uploadedAt === "string"
      ? raw.uploadedAt
      : typeof raw.uploadAt === "string"
        ? raw.uploadAt
        : "";

  return {
    ...(item as Photo),
    imageUrl,
    name,
    spotName: name,
    uploadedAt,
  };
}

function normalizePhotoList(data: unknown): Photo[] {
  const items = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? (() => {
          const body = data as Record<string, unknown>;
          if (Array.isArray(body.photos)) return body.photos;
          if (Array.isArray(body.result)) return body.result;
          if (Array.isArray(body.data)) return body.data;
          return [];
        })()
      : [];

  return items
    .map((item) => normalizePhoto(item))
    .filter((photo): photo is Photo => photo != null);
}

export function getRegionPhotos(lDongSignguCd?: string | null) {
  const path = lDongSignguCd
    ? `/photos?lDongSignguCd=${encodeURIComponent(lDongSignguCd)}`
    : "/photos";

  return apiClient.get<unknown>(path).then((data) => normalizePhotoList(data));
}

export async function getVisitPhoto(visitId: number) {
  try {
    const data = await apiClient.get<unknown>(`/photos/visits/${visitId}`);
    return normalizePhoto(data);
  } catch (error) {
    if (!(error instanceof ApiError) || (error.status !== 404 && error.status !== 405)) {
      throw error;
    }
  }

  try {
    const data = await apiClient.get<unknown>("/photos", { params: { visitId } });
    return normalizePhoto(data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export function createPhoto(body: CreatePhotoRequest) {
  return apiClient.post<Photo>("/photos", body);
}

export function updatePhoto(photoId: number, body: CreatePhotoRequest) {
  return apiClient.patch<Photo>(`/photos/${photoId}`, body);
}

export async function uploadToPresignedUrl(
  uploadUrl: string,
  file: Blob,
  contentType: string,
) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`사진 업로드에 실패했어요. (${response.status})`);
  }
}

export async function uploadVisitPhoto(params: {
  visitId: number;
  file: Blob;
  contentType: string;
  photoId?: number | null;
}) {
  const { visitId, file, contentType, photoId } = params;
  const { fileKey, uploadUrl } = await getVisitPhotoPresignedUrl(
    visitId,
    contentType,
  );
  await uploadToPresignedUrl(uploadUrl, file, contentType);

  if (photoId != null && Number.isFinite(photoId) && photoId > 0) {
    return updatePhoto(photoId, { visitId, fileKey });
  }

  return createPhoto({ visitId, fileKey });
}
