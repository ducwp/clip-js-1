import { NextResponse } from "next/server";

// import { HfInference } from "@huggingface/inference";
// const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function POST(req: Request) {
  try {
    const { text, targetLanguage } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const response = await fetch(
      "https://translation.googleapis.com/language/translate/v2?key=%s".replace(
        "%s",
        process.env.GTRAN_API_KEY!,
      ),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: text,
          target: targetLanguage,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Google translate API error: ${errorData}`);
    }

    const responseData = await response.json();

    console.log("Google Translate API response:", responseData.data);

    const translatedText = responseData.data.translations[0].translatedText;

    // Sometimes DeepSeek-R1 wraps output in <think> tags. We should strip it if it exists.
    const cleanText = translatedText
      ?.replace(/<think>[\s\S]*?<\/think>/g, "")
      .trim();

    return NextResponse.json({ text: cleanText });
  } catch (error: any) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
