import { Env } from "@/constants/env";

export function isKakaoLoginCancelled(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null
        ? JSON.stringify(error)
        : String(error ?? "");
  const haystack = message.toLowerCase();
  return (
    haystack.includes("cancel") ||
    haystack.includes("취소") ||
    haystack.includes("access_denied")
  );
}

export function getKakaoErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    const body = error as { error_description?: string; error?: string };
    return body.error_description || body.error || "";
  }
  return "";
}

/**
 * 카카오 로그인 시작 — 서버 라우트가 REST API 키로 authorize URL로 리다이렉트합니다.
 * (JS SDK 2.x는 Auth.login 이 제거되어 authorize + 인가코드 방식을 사용합니다.)
 */
export function signInWithKakao() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Kakao auth requires a browser"));
  }

  // JS 키만 있어도 start 라우트에서 REST 키 없으면 에러 페이지로 안내
  if (!Env.kakaoJsKey && process.env.NODE_ENV === "development") {
    // 클라이언트에서는 REST 키를 모름 — start로 이동
  }

  window.location.href = "/api/auth/kakao/start";
  return Promise.resolve();
}
