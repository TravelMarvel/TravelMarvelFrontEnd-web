import { NextResponse } from "next/server";

/**
 * 카카오 Static Map 프록시 — REST API 키는 서버에서만 사용
 * https://developers.kakao.com/docs/latest/ko/local/dev-guide#static-map
 */
export async function GET(request: Request) {
  const restApiKey = process.env.KAKAO_REST_API_KEY?.trim();
  if (!restApiKey) {
    return NextResponse.json(
      { message: "KAKAO_REST_API_KEY 가 없습니다." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return NextResponse.json(
      { message: "위도/경도가 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const upstreamUrl = new URL("https://dapi.kakao.com/v2/maps/staticmap");
  upstreamUrl.searchParams.set("center", `${lng},${lat}`);
  upstreamUrl.searchParams.set("level", "3");
  upstreamUrl.searchParams.set("size", "600x300");
  upstreamUrl.searchParams.set(
    "markers",
    `color:0xF26522|${lng},${lat}`,
  );

  const upstream = await fetch(upstreamUrl.toString(), {
    headers: {
      Authorization: `KakaoAK ${restApiKey}`,
    },
    next: { revalidate: 3600 },
  });

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    console.warn("[kakao/static-map] failed", upstream.status, detail);
    return NextResponse.json(
      { message: "카카오 지도를 불러오지 못했어요." },
      { status: upstream.status },
    );
  }

  const contentType = upstream.headers.get("content-type") || "image/png";
  const buffer = await upstream.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
