export type MyPageMenuItem = {
  id: string;
  icon: string;
  label: string;
};

export const MOCK_MYPAGE_MENU_ITEMS: MyPageMenuItem[] = [
  { id: "travel-records", icon: "🔭", label: "나의 여행 기록" },
  { id: "marvel-boards", icon: "🎲", label: "내 마블판 관리" },
  { id: "notifications", icon: "🔔", label: "알림 설정" },
  { id: "support", icon: "💬", label: "고객센터 · 문의" },
];
