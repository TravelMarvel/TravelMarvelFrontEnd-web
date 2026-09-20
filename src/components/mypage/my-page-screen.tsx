"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { getMe } from "@/api/users";
import { useAuth } from "@/contexts/auth-context";
import {
  MOCK_MYPAGE_MENU_ITEMS,
  type MyPageMenuItem,
} from "@/data/mock-user-profile";
import { ApiError } from "@/lib/api-client";
import { showAlert } from "@/lib/app-alert";

type ProfileCardData = {
  nickname: string;
  profileImage: string | null;
  exploredSpots: number;
  marbleBoardCount: number;
};

export function MyPageScreen() {
  const router = useRouter();
  const { signOut, withdraw } = useAuth();
  const [profile, setProfile] = useState<ProfileCardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await getMe();
      setProfile({
        nickname: user.nickname,
        profileImage: user.profileImage,
        exploredSpots: user.visitCount,
        marbleBoardCount: user.boardCount,
      });
    } catch (error) {
      console.warn("[mypage] getMe failed:", error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  const handleWithdraw = useCallback(() => {
    if (isWithdrawing) return;

    showAlert(
      "회원 탈퇴",
      "탈퇴하면 마블판과 여행 기록이 모두 삭제되며 되돌릴 수 없어요. 정말 탈퇴할까요?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "탈퇴",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setIsWithdrawing(true);
              try {
                await withdraw();
                router.replace("/login");
              } catch (error) {
                const message =
                  error instanceof ApiError
                    ? "회원 탈퇴에 실패했어요. 잠시 후 다시 시도해 주세요."
                    : "네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.";
                showAlert("탈퇴 실패", message);
              } finally {
                setIsWithdrawing(false);
              }
            })();
          },
        },
      ],
    );
  }, [isWithdrawing, withdraw, router]);

  const handleMenuPress = useCallback(
    (item: MyPageMenuItem) => {
      if (item.id === "marvel-boards") {
        router.push("/marvel");
        return;
      }
      if (item.id === "travel-records") {
        router.push("/album");
        return;
      }
      if (item.id === "notifications" || item.id === "support") {
        showAlert("준비중", "준비중인 기능입니다.");
      }
    },
    [router],
  );

  return (
    <div className="h-full overflow-y-auto bg-[#F5F5F7] px-6 pb-8 pt-3">
      <h1 className="mb-4 text-[28px] font-extrabold tracking-[-0.5px] text-[#1A1A1B]">
        마이페이지
      </h1>

      <div className="mb-4 flex min-h-[220px] flex-col items-center rounded-2xl bg-white px-6 pb-4 pt-6 shadow-[0_4px_12px_rgba(26,26,27,0.06)]">
        {isLoading || !profile ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#F26522]/30 border-t-[#F26522]" />
          </div>
        ) : (
          <>
            {profile.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.profileImage}
                alt={profile.nickname}
                className="mb-4 h-[72px] w-[72px] rounded-full bg-[#F5F5F7] object-cover"
              />
            ) : (
              <div className="mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#F26522] text-[28px] font-bold text-white">
                {profile.nickname.charAt(0)}
              </div>
            )}
            <p className="mb-6 text-[20px] font-extrabold text-[#1A1A1B]">
              {profile.nickname}님
            </p>
            <div className="flex w-full items-center border-t border-[#EFEFEF] pt-4">
              <div className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[24px] font-extrabold text-[#F26522]">
                  {profile.exploredSpots}
                </span>
                <span className="text-[12px] font-medium text-[#9E9E9E]">
                  탐험 명소
                </span>
              </div>
              <div className="h-9 w-px bg-[#EFEFEF]" />
              <div className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[24px] font-extrabold text-[#F26522]">
                  {profile.marbleBoardCount}
                </span>
                <span className="text-[12px] font-medium text-[#9E9E9E]">
                  내 마블판
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_12px_rgba(26,26,27,0.06)]">
        {MOCK_MYPAGE_MENU_ITEMS.map((item, index) => (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => handleMenuPress(item)}
              className="flex w-full items-center gap-4 px-6 py-[18px] text-left active:bg-[#F5F5F7]"
            >
              <span className="w-7 text-center text-[20px]">{item.icon}</span>
              <span className="flex-1 text-[16px] font-semibold text-[#1A1A1B]">
                {item.label}
              </span>
              <span className="text-[22px] font-light text-[#9E9E9E]">›</span>
            </button>
            {index < MOCK_MYPAGE_MENU_ITEMS.length - 1 ? (
              <div className="ml-[76px] h-px bg-[#EFEFEF]" />
            ) : null}
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={isWithdrawing}
        onClick={() => void handleLogout()}
        className="mt-4 w-full rounded-2xl border border-[#D8D8DC] bg-white py-4 text-[16px] font-semibold text-[#9E9E9E] disabled:opacity-60"
      >
        로그아웃
      </button>

      <button
        type="button"
        disabled={isWithdrawing}
        onClick={handleWithdraw}
        className="mt-2 flex w-full items-center justify-center rounded-2xl py-4 text-[15px] font-semibold text-[#D32F2F] disabled:opacity-60"
      >
        {isWithdrawing ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#D32F2F]/30 border-t-[#D32F2F]" />
        ) : (
          "회원 탈퇴"
        )}
      </button>
    </div>
  );
}
