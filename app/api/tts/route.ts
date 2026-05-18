import { NextResponse } from "next/server";
import { EdgeTTS } from "@andresaya/edge-tts";

export async function POST(req: Request) {
  try {
    const {
      text,
      engine = "edge-tts",
      voice = "vi-VN-HoaiMyNeural",
    } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    console.log("Received TTS request with text:", text);

    const cleanText = text.replace(/[\n\r]+/g, " ").trim();

    const tts = new EdgeTTS();
    const buffers: Uint8Array[] = [];

    for await (const chunk of tts.synthesizeStream(
      cleanText,
      voice || "vi-VN-HoaiMyNeural",
    )) {
      buffers.push(chunk);
      console.log(`Streamed ${chunk.length} bytes`);
    }

    console.log("Streaming completed!");

    if (buffers.length === 0) {
      console.error("No audio data received!");
      return;
    }

    const audioBuffer = Buffer.concat(buffers);

    /* const tts = new Communicate(cleanText, voice);
    const buffers: Uint8Array[] = [];

    for await (const chunk of tts.stream()) {
      if (chunk.type === "audio" && chunk.data) {
        buffers.push(chunk.data);
      }
    } */

    const totalLength = buffers.reduce((acc, val) => acc + val.length, 0);
    const audioData = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of buffers) {
      audioData.set(buf, offset);
      offset += buf.length;
    }

    return new NextResponse(audioData, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="tts.mp3"`,
      },
    });
  } catch (error: any) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export const edge_tts = async (
  res: Response,
  text: string,
  voice: string = "vi-VN-HoaiMyNeural",
) => {
  console.log(">>>> Voice:", voice);

  try {
    const tts = new EdgeTTS();
    const buffers: Uint8Array[] = [];
    for await (const chunk of tts.synthesizeStream(
      text,
      voice || "vi-VN-HoaiMyNeural",
    )) {
      buffers.push(chunk);
      console.log(`Streamed ${chunk.length} bytes`);
    }

    console.log("Streaming completed!");

    if (buffers.length === 0) {
      console.error("No audio data received!");
      return;
    }

    const audioBuffer = Buffer.concat(buffers);

    // Kiểm tra nếu buffer rỗng
    if (audioBuffer.length === 0) {
      console.error("Edge TTS trả về buffer rỗng");
      return null;
    }

    // Thiết lập Header để Client biết đây là file audio
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(audioBuffer);
  } catch (error) {
    console.error("Lỗi Edge TTS:", error);
    return null;
  }
};
