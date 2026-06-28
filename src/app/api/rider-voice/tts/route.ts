import { errorResponse, textToSpeech } from "../helpers";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return errorResponse("Unsupported content type.", 415);
    }

    const body = await request.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text || text.length > 500) {
      return errorResponse("Missing or invalid text.");
    }

    let speech: any = null;
    try {
      speech = await textToSpeech(text);
    } catch (err) {
      console.warn("TTS generation failed in tts/route.ts:", err);
    }

    return Response.json({
      replyText: text,
      audio: speech?.audio?.base64 ? {
        base64: speech.audio.base64,
        mediaType: speech.audio.mediaType,
        format: speech.audio.format,
      } : null,
    });
  } catch (error) {
    console.error("Rider voice TTS route failed:", error);
    return errorResponse("Speech generation failed.", 500);
  }
}
