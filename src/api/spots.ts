import { apiClient } from "@/lib/api-client";

export type Spot = {
  spotId: number;
  contentId: string;
  name: string;
  address: string;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
};

export type SpotDetail = Spot & {
  overview?: string | null;
  description?: string | null;
};

export type GetSpotsParams = {
  lDongSignguCd: string;
};

export function getSpots(params: GetSpotsParams) {
  return apiClient.get<Spot[]>("/spots", {
    params: {
      lDongSignguCd: params.lDongSignguCd,
    },
  });
}

export function getSpot(spotId: number) {
  return apiClient.get<SpotDetail>(`/spots/${spotId}`);
}
