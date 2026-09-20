import { NextResponse } from "next/server";

type KakaoTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

function getRedirectUri() {
  return (
    process.env.KAKAO_REDIRECT_URI?.trim() ||
    "http://localhost:3000/auth/kakao/callback"
  );
}

export async function POST(request: Request) {
  const restApiKey = process.env.KAKAO_REST_API_KEY?.trim();
  if (!restApiKey) {
    return NextResponse.json(
      {
        message:
          "KAKAO_REST_API_KEY 가 없습니다. 카카오 콘솔의 REST API 키를 .env.local 에 설정해 주세요.",
      },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    code?: string;
  } | null;
  const code = body?.code?.trim();

  if (!code) {
    return NextResponse.json(
      { message: "인가 코드(code)가 없습니다." },
      { status: 400 },
    );
  }

  const redirectUri = getRedirectUri();
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: restApiKey,
    redirect_uri: redirectUri,
    code,
  });

  const clientSecret = process.env.KAKAO_CLIENT_SECRET?.trim();
  if (clientSecret) {
    params.set("client_secret", clientSecret);
  }

  const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body: params,
  });

  const data = (await tokenRes.json()) as KakaoTokenResponse;

  if (!tokenRes.ok || !data.access_token) {
    console.warn("[kakao/token] failed", {
      status: tokenRes.status,
      redirectUri,
      error: data.error,
      error_description: data.error_description,
    });

    return NextResponse.json(
      {
        message:
          data.error_description ||
          data.error ||
          "카카오 토큰 발급에 실패했어요.",
        kakaoError: data.error,
        redirectUri,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  });
}
