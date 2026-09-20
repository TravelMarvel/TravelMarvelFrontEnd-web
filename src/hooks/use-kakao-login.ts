"use client";

import { useState } from "react";

import { useAuth } from "@/contexts/auth-context";
import { showAlert } from "@/lib/app-alert";
import {
  getKakaoErrorMessage,
  isKakaoLoginCancelled,
  signInWithKakao,
} from "@/lib/kakao-auth";

export function useKakaoLogin() {
  const { signIn: _signIn } = useAuth();
  const [isKakaoLoading, setIsKakaoLoading] = useState(false);

  const handleKakaoLogin = async () => {
    if (isKakaoLoading) return;

    setIsKakaoLoading(true);

    try {
      // 리다이렉트되므로 이후 코드는 보통 실행되지 않음
      await signInWithKakao();
    } catch (error) {
      console.warn("[kakao-login] failed:", error);
      setIsKakaoLoading(false);

      if (!isKakaoLoginCancelled(error)) {
        const detail = getKakaoErrorMessage(error);
        showAlert(
          "로그인 실패",
          detail
            ? `카카오 로그인에 실패했습니다.\n${detail}`
            : "카카오 로그인에 실패했습니다. 다시 시도해 주세요.",
        );
      }
    }
  };

  return { handleKakaoLogin, isKakaoLoading };
}
