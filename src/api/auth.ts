import { apiClient } from "@/lib/api-client";

export type ExchangeKakaoTokenResponse = {
  accessToken: string;
  refreshToken?: string;
};

export function exchangeKakaoToken(kakaoAccessToken: string) {
  return apiClient.post<ExchangeKakaoTokenResponse>("/auth/kakao", {
    accessToken: kakaoAccessToken,
  });
}

export function exchangeGoogleToken(googleIdToken: string) {
  return apiClient.post<ExchangeKakaoTokenResponse>("/auth/google", {
    idToken: googleIdToken,
  });
}

export function logout() {
  return apiClient.post<{ message: string }>("/auth/logout");
}

export function withdraw() {
  return apiClient.delete<{ message: string }>("/auth/withdraw");
}
