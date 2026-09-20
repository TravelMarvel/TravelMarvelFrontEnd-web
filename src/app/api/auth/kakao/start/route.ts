import { NextResponse } from "next/server";

function getRedirectUri() {
  return (
    process.env.KAKAO_REDIRECT_URI ??
    "http://localhost:3000/auth/kakao/callback"
  );
}

export async function GET() {
  const restApiKey = process.env.KAKAO_REST_API_KEY?.trim();

  if (!restApiKey) {
    return NextResponse.json(
      {
        error:
          "KAKAO_REST_API_KEY 가 없습니다. 카카오 개발자 콘솔 > 앱 키 > REST API 키를 .env.local 에 넣어 주세요.",
      },
      { status: 500 },
    );
  }

  const redirectUri = getRedirectUri();
  const url = new URL("https://kauth.kakao.com/oauth/authorize");
  url.searchParams.set("client_id", restApiKey);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  // scope를 넣지 않음 — 콘솔에 없는 동의항목(account_email 등)을 요청하면 KOE205 발생

  return NextResponse.redirect(url.toString());
}
