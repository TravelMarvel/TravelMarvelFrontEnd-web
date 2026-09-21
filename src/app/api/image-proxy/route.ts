import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");

  if (!target) {
    return NextResponse.json({ message: "url 이 필요합니다." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ message: "잘못된 url 입니다." }, { status: 400 });
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return NextResponse.json({ message: "지원하지 않는 프로토콜입니다." }, { status: 400 });
  }

  const upstream = await fetch(parsed.toString(), {
    headers: {
      Accept: "image/*,*/*;q=0.8",
      // 일부 스토리지는 브라우저 UA 없으면 거부함
      "User-Agent":
        "Mozilla/5.0 (compatible; TravelMarvelWeb/1.0; +https://travelmarvel.app)",
    },
    cache: "no-store",
    redirect: "follow",
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { message: "이미지를 가져오지 못했어요." },
      { status: upstream.status },
    );
  }

  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/") && !contentType.includes("octet-stream")) {
    return NextResponse.json(
      { message: "이미지 형식이 아니에요." },
      { status: 415 },
    );
  }

  const buffer = await upstream.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType.startsWith("image/")
        ? contentType
        : "image/jpeg",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
