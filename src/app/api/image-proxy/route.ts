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
    headers: { Accept: "image/*,*/*" },
    cache: "force-cache",
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { message: "이미지를 가져오지 못했어요." },
      { status: upstream.status },
    );
  }

  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  const buffer = await upstream.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
