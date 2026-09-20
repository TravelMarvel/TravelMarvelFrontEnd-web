"use client";

import { AppLogo } from "@/components/login/app-logo";
import { useGoogleLogin } from "@/hooks/use-google-login";
import { useKakaoLogin } from "@/hooks/use-kakao-login";

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
      <path
        fill="#1A1A1B"
        d="M10 2.5C5.858 2.5 2.5 5.149 2.5 8.42c0 2.13 1.41 4.002 3.53 5.08-.145.53-.524 1.922-.6 2.22-.094.37.136.365.286.266.124-.082 1.97-1.34 2.768-1.884.5.07 1.01.107 1.516.107 4.142 0 7.5-2.65 7.5-5.92S14.142 2.5 10 2.5z"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function LoginScreen() {
  const { handleKakaoLogin, isKakaoLoading } = useKakaoLogin();
  const { handleGoogleLogin, isGoogleLoading } = useGoogleLogin();
  const isBusy = isKakaoLoading || isGoogleLoading;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-white px-6 pb-4 pt-12">
      <div
        className="pointer-events-none absolute -left-16 top-24 h-56 w-56 rounded-full opacity-70 blur-3xl"
        style={{ background: "#FFF4B8" }}
      />
      <div
        className="pointer-events-none absolute -right-10 top-40 h-64 w-64 rounded-full opacity-80 blur-3xl"
        style={{ background: "#FFD4B8" }}
      />

      <div className="relative z-10 flex flex-1 flex-col justify-between">
        <header className="flex flex-col items-start gap-3 pt-4">
          <AppLogo />
          <div className="mt-2">
            <h1 className="text-[42px] font-extrabold leading-[46px] tracking-[-1px] text-[#1A1A1B]">
              TRAVEL
            </h1>
            <h1 className="text-[42px] font-extrabold leading-[46px] tracking-[-1px] text-[#F26522]">
              MARBLE
            </h1>
          </div>
          <p className="mt-1 text-[15px] font-medium text-[#9E9E9E]">
            주사위로 떠나는 강원도 여행
          </p>
        </header>

        <div className="flex flex-col gap-3 pb-4">
          <div className="rounded-full bg-[#FFF3ED] px-4 py-2.5">
            <p className="text-[13px] font-semibold text-[#F26522]">
              ● 속초 마블판 · 지금 가장 인기 탐험지
            </p>
          </div>

          <button
            type="button"
            disabled={isBusy}
            onClick={() => void handleKakaoLogin()}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#FEE500] py-[18px] text-[17px] font-bold text-[#1A1A1B] disabled:opacity-70 active:opacity-85"
          >
            {isKakaoLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#1A1A1B]/30 border-t-[#1A1A1B]" />
            ) : (
              <KakaoIcon />
            )}
            {isKakaoLoading ? "로그인 중..." : "카카오로 3초 로그인"}
          </button>

          <button
            type="button"
            disabled={isBusy}
            onClick={() => void handleGoogleLogin()}
            className="flex items-center justify-center gap-2 rounded-2xl border border-[#DADCE0] bg-white py-[18px] text-[17px] font-bold text-[#1A1A1B] disabled:opacity-70 active:opacity-85"
          >
            {isGoogleLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#1A1A1B]/30 border-t-[#1A1A1B]" />
            ) : (
              <GoogleIcon />
            )}
            {isGoogleLoading ? "로그인 중..." : "Google로 로그인"}
          </button>

          <p className="mb-2 mt-1 text-center text-[12px] leading-[18px] text-[#9E9E9E]">
            로그인 시 이용약관 및 개인정보처리방침에 동의합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
