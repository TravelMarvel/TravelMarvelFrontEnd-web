const KAKAO_ACCESS_TOKEN_KEY = "kakao_access_token";
const KAKAO_REFRESH_TOKEN_KEY = "kakao_refresh_token";
const APP_ACCESS_TOKEN_KEY = "app_access_token";
const APP_REFRESH_TOKEN_KEY = "app_refresh_token";

export type AppTokens = {
  accessToken: string;
  refreshToken?: string;
};

function canUseStorage() {
  return typeof window !== "undefined";
}

function getItem(key: string) {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(key);
}

function setItem(key: string, value: string) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, value);
}

function removeItem(key: string) {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(key);
}

export async function saveKakaoTokens(token: {
  accessToken: string;
  refreshToken?: string | null;
}) {
  if (!token.accessToken) {
    throw new Error("Kakao access token is missing");
  }

  setItem(KAKAO_ACCESS_TOKEN_KEY, token.accessToken);

  if (token.refreshToken) {
    setItem(KAKAO_REFRESH_TOKEN_KEY, token.refreshToken);
  }
}

export async function getKakaoAccessToken() {
  return getItem(KAKAO_ACCESS_TOKEN_KEY);
}

export async function saveAppTokens(tokens: AppTokens) {
  setItem(APP_ACCESS_TOKEN_KEY, tokens.accessToken);

  if (tokens.refreshToken) {
    setItem(APP_REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
}

export async function getAppAccessToken() {
  return getItem(APP_ACCESS_TOKEN_KEY);
}

export async function getAppRefreshToken() {
  return getItem(APP_REFRESH_TOKEN_KEY);
}

export async function clearKakaoTokens() {
  removeItem(KAKAO_ACCESS_TOKEN_KEY);
  removeItem(KAKAO_REFRESH_TOKEN_KEY);
}

export async function clearAppTokens() {
  removeItem(APP_ACCESS_TOKEN_KEY);
  removeItem(APP_REFRESH_TOKEN_KEY);
}

export async function clearAllTokens() {
  await clearKakaoTokens();
  await clearAppTokens();
}
