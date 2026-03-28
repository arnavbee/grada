import { NextRequest, NextResponse } from "next/server";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

function sanitizeHeaders(headers: Headers): Headers {
  const nextHeaders = new Headers(headers);
  nextHeaders.delete("content-encoding");
  nextHeaders.delete("content-length");
  nextHeaders.delete("transfer-encoding");
  nextHeaders.delete("connection");
  return nextHeaders;
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const rawUrl = request.nextUrl.searchParams.get("url")?.trim() || "";
  if (!rawUrl) {
    return NextResponse.json({ detail: "Missing sticker asset URL." }, { status: 400 });
  }

  let upstreamUrl: URL;
  try {
    upstreamUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ detail: "Invalid sticker asset URL." }, { status: 400 });
  }

  if (!ALLOWED_PROTOCOLS.has(upstreamUrl.protocol)) {
    return NextResponse.json({ detail: "Unsupported sticker asset URL." }, { status: 400 });
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
    });

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { detail: "Unable to fetch sticker asset." },
        { status: upstreamResponse.status },
      );
    }

    const contentType = upstreamResponse.headers.get("content-type") || "";
    if (contentType && !contentType.toLowerCase().startsWith("image/")) {
      return NextResponse.json({ detail: "Sticker asset must be an image." }, { status: 415 });
    }

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: sanitizeHeaders(upstreamResponse.headers),
    });
  } catch {
    return NextResponse.json({ detail: "Unable to fetch sticker asset." }, { status: 502 });
  }
}
