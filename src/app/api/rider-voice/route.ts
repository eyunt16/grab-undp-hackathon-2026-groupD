import { openai } from "@ai-sdk/openai";
import { transcribe } from "ai";
import {
  errorResponse,
  maxAudioBytes,
  parseIntent,
  type RiderStage,
  riderStageSchema,
  textToSpeech,
  voiceJson,
} from "./helpers";

export async function POST(request: Request) {
  const openaiKey = process.env.OPENAI_API_KEY;

  try {
    const contentType = request.headers.get("content-type") || "";

    let commandText = "";
    let context = {};
    let stage: RiderStage | null = null;

    if (contentType.includes("multipart/form-data")) {
      if (!openaiKey) {
        return errorResponse(
          "Missing OPENAI_API_KEY for audio transcription.",
          500,
        );
      }
      const form = await request.formData();
      const audio = form.get("audio");
      const contextValue = form.get("context");
      const parsedStage = riderStageSchema.safeParse(form.get("stage"));

      if (!parsedStage.success) {
        return errorResponse("Missing or invalid rider stage.");
      }
      stage = parsedStage.data;

      if (!(audio instanceof File)) {
        return errorResponse("Missing audio file.");
      }
      if (audio.size <= 0 || audio.size > maxAudioBytes) {
        return errorResponse("Audio file is empty or too large.");
      }

      context =
        typeof contextValue === "string" ? JSON.parse(contextValue) : {};
      const audioBytes = new Uint8Array(await audio.arrayBuffer());

      const transcript = await transcribe({
        model: openai.transcription("gpt-4o-mini-transcribe"),
        audio: audioBytes,
        providerOptions: {
          openai: {
            language: "vi",
            prompt: "Vietnamese elderly rider using AloXe.",
          },
        },
      });

      commandText = transcript.text;
    } else if (contentType.includes("application/json")) {
      const body = await request.json();
      const parsedStage = riderStageSchema.safeParse(body.stage);

      if (!parsedStage.success) {
        return errorResponse("Missing or invalid rider stage.");
      }
      stage = parsedStage.data;
      commandText = typeof body.text === "string" ? body.text.trim() : "";
      context = body.context || {};
    } else {
      return errorResponse("Unsupported content type.", 415);
    }

    if (!commandText || commandText.length > 500) {
      return errorResponse("Missing or invalid text command.");
    }
    if (!stage) {
      return errorResponse("Missing or invalid rider stage.");
    }

    const intent = await parseIntent(commandText, stage, context);
    let speech: any = null;
    try {
      speech = await textToSpeech(intent.replyText);
    } catch (err) {
      console.warn(
        "TTS generation failed in route.ts, fallback to client-side:",
        err,
      );
    }

    return voiceJson({
      transcript: commandText,
      intent,
      speech,
    });
  } catch (error) {
    console.error("Rider voice route failed:", error);
    return errorResponse("Command processing failed.", 500);
  }
}
