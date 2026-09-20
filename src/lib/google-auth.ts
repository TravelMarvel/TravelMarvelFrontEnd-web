"use client";

/**
 * Google Identity Services — idToken(JWT credential)을 받아 `/auth/google`에 교환합니다.
 */
import { exchangeGoogleToken } from "@/api/auth";
import { Env } from "@/constants/env";
import { saveAppTokens } from "@/lib/auth-storage";

type CredentialResponse = {
  credential?: string;
  select_by?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: CredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            ux_mode?: "popup" | "redirect";
          }) => void;
          prompt: (
            momentListener?: (notification: {
              isNotDisplayed: () => boolean;
              isSkippedMoment: () => boolean;
              isDismissedMoment: () => boolean;
              getNotDisplayedReason?: () => string;
              getSkippedReason?: () => string;
            }) => void,
          ) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
          cancel: () => void;
        };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadGoogleScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google auth requires a browser"));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("google-gsi");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Google script failed")),
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google script failed to load"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function isGoogleLoginCancelled(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  const haystack = message.toLowerCase();
  return (
    haystack.includes("cancel") ||
    haystack.includes("닫힘") ||
    haystack.includes("popup_closed") ||
    haystack.includes("access_denied") ||
    haystack.includes("dismissed")
  );
}

export function getGoogleErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

export async function signOutFromGoogle() {
  try {
    await loadGoogleScript();
    window.google?.accounts.id.cancel();
  } catch {
    // ignore
  }
}

export async function signInWithGoogle() {
  if (!Env.googleWebClientId) {
    throw new Error("Google web client ID is missing");
  }

  await loadGoogleScript();

  if (!window.google?.accounts?.id) {
    throw new Error("Google Identity Services를 불러오지 못했어요.");
  }

  const idToken = await new Promise<string>((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    window.google!.accounts.id.initialize({
      client_id: Env.googleWebClientId,
      callback: (response) => {
        if (!response.credential) {
          finish(() =>
            reject(new Error("Google idToken을 받지 못했어요.")),
          );
          return;
        }
        finish(() => resolve(response.credential!));
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      ux_mode: "popup",
    });

    const container = document.createElement("div");
    container.setAttribute("aria-hidden", "true");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    document.body.appendChild(container);

    window.google!.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      width: 280,
      text: "signin_with",
    });

    const clickButton = () => {
      const button = container.querySelector(
        'div[role="button"]',
      ) as HTMLElement | null;
      if (button) {
        button.click();
        return true;
      }
      return false;
    };

    // 버튼 렌더 대기 후 클릭
    let attempts = 0;
    const tryClick = () => {
      if (settled) return;
      if (clickButton()) return;
      attempts += 1;
      if (attempts > 20) {
        finish(() =>
          reject(
            Object.assign(new Error("Google sign-in cancelled"), {
              code: "cancel",
            }),
          ),
        );
        container.remove();
        return;
      }
      window.setTimeout(tryClick, 50);
    };
    tryClick();

    // 사용자가 팝업을 닫는 경우를 대비한 타임아웃
    window.setTimeout(() => {
      if (!settled) {
        finish(() =>
          reject(
            Object.assign(new Error("Google sign-in cancelled"), {
              code: "cancel",
            }),
          ),
        );
      }
      container.remove();
    }, 120000);
  });

  const appTokens = await exchangeGoogleToken(idToken);
  await saveAppTokens(appTokens);
  return appTokens;
}
