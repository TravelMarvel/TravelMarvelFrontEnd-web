import { apiClient } from "@/lib/api-client";

export type UserMeResponse = {
  userId: number;
  nickname: string;
  email: string | null;
  profileImage: string | null;
  provider: string;
  role: string;
  visitCount: number;
  boardCount: number;
};

export function getMe() {
  return apiClient.get<UserMeResponse>("/users/me");
}
