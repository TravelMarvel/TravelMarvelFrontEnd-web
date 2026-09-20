"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/contexts/auth-context";
import { showAlert } from "@/lib/app-alert";
import {
  getGoogleErrorMessage,
  isGoogleLoginCancelled,
  signInWithGoogle,
} from "@/lib/google-auth";

export function useGoogleLogin() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (isGoogleLoading) return;

    setIsGoogleLoading(true);

    try {
      await signInWithGoogle();
      signIn();
      router.replace("/marvel");
    } catch (error) {
      console.warn("[google-login] failed:", error);

      if (!isGoogleLoginCancelled(error)) {
        const detail = getGoogleErrorMessage(error);
        showAlert(
          "로그인 실패",
          detail
            ? `구글 로그인에 실패했습니다.\n${detail}`
            : "구글 로그인에 실패했습니다. 다시 시도해 주세요.",
        );
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return { handleGoogleLogin, isGoogleLoading };
}
