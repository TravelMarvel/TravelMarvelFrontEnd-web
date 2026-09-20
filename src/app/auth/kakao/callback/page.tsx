"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { exchangeKakaoToken } from "@/api/auth";
import { useAuth } from "@/contexts/auth-context";
import { saveAppTokens, saveKakaoTokens } from "@/lib/auth-storage";

function KakaoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [message, setMessage] = useState("카카오 로그인 처리 중…");
  const startedRef = useRef(false);

  useEffect(() => {
    const error = searchParams.get("error");
    const code = searchParams.get("code");

    if (error) {
      setMessage(
        searchParams.get("error_description") ||
          "카카오 로그인이 취소되었거나 실패했어요.",
      );
      return;
    }

    if (!code) {
      setMessage("인가 코드가 없어요. 다시 로그인해 주세요.");
      return;
    }

    // 인가 코드는 1회용 — React Strict Mode / Fast Refresh 중복 호출 방지
    const lockKey = `kakao_oauth_code:${code}`;
    if (startedRef.current) return;
    if (typeof sessionStorage !== "undefined") {
      if (sessionStorage.getItem(lockKey) === "1") {
        setMessage(
          "이미 처리 중이거나 사용된 로그인 코드예요.\n로그인 화면에서 다시 시도해 주세요.",
        );
        return;
      }
      sessionStorage.setItem(lockKey, "1");
    }
    startedRef.current = true;

    let cancelled = false;

    void (async () => {
      try {
        const tokenRes = await fetch("/api/auth/kakao/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const tokenBody = (await tokenRes.json()) as {
          accessToken?: string;
          refreshToken?: string;
          message?: string;
          kakaoError?: string;
          redirectUri?: string;
        };

        if (!tokenRes.ok || !tokenBody.accessToken) {
          const detail = [
            tokenBody.message || "카카오 토큰 교환 실패",
            tokenBody.kakaoError ? `(${tokenBody.kakaoError})` : "",
            tokenBody.redirectUri
              ? `\nredirect_uri: ${tokenBody.redirectUri}`
              : "",
          ]
            .filter(Boolean)
            .join(" ");
          throw new Error(detail);
        }

        await saveKakaoTokens({
          accessToken: tokenBody.accessToken,
          refreshToken: tokenBody.refreshToken,
        });

        const appTokens = await exchangeKakaoToken(tokenBody.accessToken);
        await saveAppTokens(appTokens);

        if (cancelled) return;
        signIn();
        router.replace("/marvel");
      } catch (err) {
        console.warn("[kakao-callback] failed:", err);
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem(lockKey);
        }
        startedRef.current = false;
        if (!cancelled) {
          setMessage(
            err instanceof Error
              ? err.message
              : "카카오 로그인 처리에 실패했어요.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, signIn, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#F26522]/30 border-t-[#F26522]" />
      <p className="whitespace-pre-line text-[14px] font-medium text-[#6B6B70]">
        {message}
      </p>
      {message !== "카카오 로그인 처리 중…" ? (
        <button
          type="button"
          onClick={() => router.replace("/login")}
          className="mt-2 rounded-xl bg-[#F26522] px-5 py-3 text-[14px] font-bold text-white"
        >
          로그인으로 돌아가기
        </button>
      ) : null}
    </div>
  );
}

export default function KakaoCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-white">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#F26522]/30 border-t-[#F26522]" />
        </div>
      }
    >
      <KakaoCallbackContent />
    </Suspense>
  );
}
