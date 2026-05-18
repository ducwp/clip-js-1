import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { getFbVideoInfo } from "fb-downloader-scrapper";

async function getXHSVideoUrl(url: string): Promise<string | null> {
  if (url.endsWith(".mp4")) return url;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!res.ok) return null;

    const htmlString = await res.text();
    const $ = cheerio.load(htmlString);
    return $('meta[name="og:video"]').attr("content") || null;
  } catch (err) {
    console.error("XHS video fetch error:", err);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { url, platform } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let videoUrl: string | null | undefined = null;

    if (platform === "xhs") {
      videoUrl = await getXHSVideoUrl(url);
    } else if (platform === "fb") {
      const fbData = await getFbVideoInfo(url);
      videoUrl = fbData.hd || fbData.sd;
    } else {
      return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
    }

    console.log("Extracted video URL:", videoUrl);

    if (!videoUrl) {
      return NextResponse.json({ error: "Failed to extract video URL" }, { status: 400 });
    }

    return NextResponse.json({ videoUrl });
  } catch (error: any) {
    console.error("Video extraction error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
