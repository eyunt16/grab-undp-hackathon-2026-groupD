import { errorResponse, textToSpeech } from "../helpers";

export async function POST(request: Request) {
  const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!googleKey) {
    return errorResponse("Missing GOOGLE_GENERATIVE_AI_API_KEY.", 500);
  }

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

    const speech = await textToSpeech(text);

    return Response.json({
      replyText: text,
      audio: {
        base64: speech.audio.base64,
        mediaType: speech.audio.mediaType,
        format: speech.audio.format,
      },
    });
  } catch (error) {
    console.error("Rider voice TTS route failed:", error);
    return errorResponse("Speech generation failed.", 500);
  }
}
