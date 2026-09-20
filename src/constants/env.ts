export const Env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  kakaoJsKey: process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "",
  googleWebClientId: process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
} as const;
