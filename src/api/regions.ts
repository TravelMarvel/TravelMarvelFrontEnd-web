import { apiClient } from "@/lib/api-client";

export type Region = {
  regionId: number;
  name: string;
  lDongRegnCd: string;
  lDongSignguCd: string;
};

export function getRegions() {
  return apiClient.get<Region[]>("/regions");
}
