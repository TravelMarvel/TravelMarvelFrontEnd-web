"use client";

import { useEffect, useState } from "react";

import {
  dismissAlert,
  subscribeAlert,
  type AlertButton,
} from "@/lib/app-alert";

export function AppAlertProvider() {
  const [state, setState] = useState<{
    title: string;
    message?: string;
    buttons: AlertButton[];
  } | null>(null);

  useEffect(() => subscribeAlert(setState), []);

  if (!state) return null;

  const handlePress = (button: AlertButton) => {
    dismissAlert();
    button.onPress?.();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-8">
      <div className="w-full max-w-[300px] overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="px-5 pb-3 pt-5 text-center">
          <h2 className="text-[17px] font-bold text-[#1A1A1B]">{state.title}</h2>
          {state.message ? (
            <p className="mt-2 whitespace-pre-line text-[13px] leading-5 text-[#6B6B70]">
              {state.message}
            </p>
          ) : null}
        </div>
        <div className="flex border-t border-[#EFEFEF]">
          {state.buttons.map((button, index) => (
            <button
              key={`${button.text}-${index}`}
              type="button"
              onClick={() => handlePress(button)}
              className={`flex-1 py-3.5 text-[16px] font-semibold ${
                button.style === "destructive"
                  ? "text-[#D32F2F]"
                  : button.style === "cancel"
                    ? "text-[#9E9E9E]"
                    : "text-[#F26522]"
              } ${index > 0 ? "border-l border-[#EFEFEF]" : ""}`}
            >
              {button.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
