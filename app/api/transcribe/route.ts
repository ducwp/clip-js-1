import { NextResponse } from "next/server";
import { createReadStream } from "fs";
import path from "path";
//import fs from "fs";
import { DeepgramClient } from "@deepgram/sdk";
import { webvtt, srt } from "@deepgram/captions";
import { init } from "@heyputer/puter.js/src/init.cjs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioBlob = formData.get("audio") as Blob;
    const provider = formData.get("provider") as string; // 'deepgram' or 'puter'
    const language = formData.get("language") as string;

    if (!audioBlob) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 },
      );
    }

    const audioBuffer = Buffer.from(await audioBlob.arrayBuffer());
    console.log("Received audio file of size:", audioBuffer.length);
    console.log("Audio file type:", audioBlob.type);

    if (provider === "deepgram") {
      const deepgram = new DeepgramClient({
        apiKey: process.env.DEEPGRAM_API_KEY,
      });

      const response = await deepgram.listen.v1.media.transcribeFile(
        audioBuffer,
        {
          model: "nova-3",
          language: language || "zh",
          smart_format: true,
        },
      );

      //const stream = fs.createWriteStream("output.srt", { flags: "a" });
      const captions = srt(response);
      console.log("Generated captions:", captions);
      //stream.write(captions);

      const text = response.results.channels[0].alternatives[0].transcript;
      console.log("Transcription result:", text);
      return NextResponse.json({ text });
    } else if (provider === "puter") {
      // Note: Puter STT server-side integration
      // As puter.js is primarily client-side, if you have a specific Puter STT endpoint:
      const ALLOWED_AUDIO_EXTENSIONS = new Set([
        "mp3",
        "wav",
        "ogg",
        "m4a",
        "webm",
        "flac",
      ]);
      const rawExt = path
        .extname("uploaded_audio.mp3")
        .replace(".", "")
        .toLowerCase();
      if (!ALLOWED_AUDIO_EXTENSIONS.has(rawExt)) {
        return NextResponse.json(
          { error: "Unsupported audio format" },
          { status: 400 },
        );
      }
      const puter = init(process.env.PUTER_TOKEN);
      const base64Data = Buffer.from(audioBuffer).toString("base64");
      const dataUri = `data:audio/${rawExt};base64,${base64Data}`;

      const result = await puter.ai.speech2txt(dataUri, false);
      // const subtitles = await puter.ai.speech2txt(
      //   dataUri,
      //   {
      //     response_format: "srt",
      //   },
      //   false,
      // );

      // console.log("Subtitles result:", subtitles);

      const text = result.text;

      return NextResponse.json({ text });
    } else {
      return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
