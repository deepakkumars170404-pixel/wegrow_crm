import { NextRequest, NextResponse } from "next/server";

// Split text into human-sized speech chunks under 180 characters for Google TTS
function splitIntoChunks(text: string, maxLen = 170): string[] {
  // Normalize whitespace and remove formatting symbols
  const cleaned = text
    .replace(/[\*_~#]/g, "")
    .replace(/₹\s*(\d+)/g, "$1 ரூபாய்")
    .replace(/Rs\.?\s*(\d+)/gi, "$1 ரூபாய்")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= maxLen) return [cleaned];

  const sentences = cleaned.split(/(?<=[.?!,;:])\s+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + " " + sentence).trim().length <= maxLen) {
      currentChunk = (currentChunk + " " + sentence).trim();
    } else {
      if (currentChunk) chunks.push(currentChunk);
      if (sentence.length <= maxLen) {
        currentChunk = sentence;
      } else {
        // Break long sentence by words
        const words = sentence.split(" ");
        currentChunk = "";
        for (const w of words) {
          if ((currentChunk + " " + w).trim().length <= maxLen) {
            currentChunk = (currentChunk + " " + w).trim();
          } else {
            if (currentChunk) chunks.push(currentChunk);
            currentChunk = w;
          }
        }
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks.filter((c) => c.length > 0);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text =
      searchParams.get("text") ||
      "வணக்கம்! வீக்ரோ ஸ்கில் கேம்பஸுக்கு உங்களை அன்போடு வரவேற்கிறோம்.";
    const lang = searchParams.get("lang") || "ta";

    const chunks = splitIntoChunks(text, 170);

    const buffers: Buffer[] = [];

    for (const chunk of chunks) {
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(
        lang
      )}&client=tw-ob&q=${encodeURIComponent(chunk)}`;

      const res = await fetch(ttsUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (res.ok) {
        const ab = await res.arrayBuffer();
        buffers.push(Buffer.from(ab));
      }
    }

    if (buffers.length === 0) {
      return new NextResponse("Failed to fetch audio stream", { status: 502 });
    }

    const mergedAudio = Buffer.concat(buffers);

    return new NextResponse(mergedAudio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error: any) {
    console.error("TTS Stream API error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text =
      body.text ||
      "வணக்கம்! வீக்ரோ ஸ்கில் கேம்பஸுக்கு உங்களை அன்போடு வரவேற்கிறோம்.";
    const lang = body.lang || "ta";

    const chunks = splitIntoChunks(text, 170);
    const buffers: Buffer[] = [];

    for (const chunk of chunks) {
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(
        lang
      )}&client=tw-ob&q=${encodeURIComponent(chunk)}`;

      const res = await fetch(ttsUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (res.ok) {
        const ab = await res.arrayBuffer();
        buffers.push(Buffer.from(ab));
      }
    }

    if (buffers.length === 0) {
      return new NextResponse("Failed to fetch audio stream", { status: 502 });
    }

    const mergedAudio = Buffer.concat(buffers);

    return new NextResponse(mergedAudio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error: any) {
    console.error("TTS POST API error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
