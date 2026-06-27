import { openai } from "@ai-sdk/openai";
import { generateSpeech, generateText, Output, transcribe } from "ai";
import { z } from "zod";

const maxAudioBytes = 8 * 1024 * 1024;

const destinations = [
  "Nha - 24 Nguyen Dinh Chieu",
  "Benh vien Cho Ray",
  "Cho Ben Thanh",
  "Nha Linh - 88 Vo Van Tan",
] as const;

const noDestination = "";

const intentSchema = z.object({
  type: z.enum(["ride", "call", "cancel", "confirm", "reject", "unknown"]),
  destination: z.enum([noDestination, ...destinations]),
  replyText: z.string(),
});

type ParsedIntent = z.infer<typeof intentSchema>;

function normalizeIntent(intent: ParsedIntent): ParsedIntent {
  if (intent.type === "ride" && intent.destination !== noDestination) {
    return intent;
  }

  if (intent.type === "ride") {
    return {
      type: "unknown",
      destination: noDestination,
      replyText:
        'Xin loi, toi chi co the xu ly cac diem den: "Nha, Benh Vien, Cho, Nha Linh".',
    };
  }

  return {
    ...intent,
    destination: noDestination,
  };
}

function errorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

async function textToSpeech(text: string) {
  return generateSpeech({
    model: openai.speech("gpt-4o-mini-tts"),
    text,
    voice: "alloy",
    outputFormat: "mp3",
    language: "vi",
    instructions:
      "Speak Vietnamese clearly, warmly, and slowly for an elderly rider. Keep the tone calm and reassuring.",
  });
}

async function parseIntent(commandText: string, rawContext: unknown) {
  console.log("parseIntent commandText:", commandText);
  const context =
    rawContext && typeof rawContext === "object" ? rawContext : {};

  const { output } = await generateText({
    model: openai("gpt-4o"),
    output: Output.object({
      name: "RiderVoiceIntent",
      description:
        "Vietnamese voice or button intent for the EasyMove elderly rider app.",
      schema: intentSchema,
    }),
    prompt: `
      You parse Vietnamese text commands for EasyMove, a ride app for an elderly rider.

      Allowed destinations array:
      ${JSON.stringify(destinations)}

      The user text can come from speech-to-text or from a clickable button prompt.
      Contrast the user's text with the destinations array. For ride requests, only choose a destination from that exact array.

      Current context:
      - ${JSON.stringify(context)}

      Rules:
      - If the user agrees, says yes, correct, book it, or confirms a pending action, use type "confirm".
      - If the user says no, stop, never mind, or go back, use type "reject".
      - If the user asks to call Linh, daughter, child, relative, or family, use type "call".
      - If the user asks to cancel the ride, use type "cancel".
      - If the user asks to go home, use destination "Nha - 24 Nguyen Dinh Chieu".
      - If the user asks to go to hospital or medical checkup, use destination "Benh vien Cho Ray".
      - If the user asks to go to the market or Ben Thanh, use destination "Cho Ben Thanh".
      - If the user asks to go to Linh's home or child's home, use destination "Nha Linh - 88 Vo Van Tan".
      - For ride requests, use type "ride" and set destination to the exact matching array item.
      - If there is no matching destination and it is not call/cancel/confirm/reject, use type "unknown".
      - For unknown commands, replyText must say politely in Vietnamese that you cannot process anything other than "Nha, Benh Vien, Cho, Nha Linh".
      - replyText must be a short polite Vietnamese sentence that can be read aloud.
      - The output must match the provided structured output schema.
      - For type "ride", destination must be the exact matching array item.
      - For every non-ride type, destination must be an empty string.

      User text: ${commandText}
    `,
  });

  return normalizeIntent(output);
}

function voiceJson({
  transcript,
  intent,
  speech,
  segments,
  language,
  durationInSeconds,
}: {
  transcript: string;
  intent: ParsedIntent;
  speech: Awaited<ReturnType<typeof textToSpeech>>;
  segments?: Array<{ text: string; startSecond: number; endSecond: number }>;
  language?: string;
  durationInSeconds?: number;
}) {
  return Response.json({
    transcript,
    segments,
    language,
    durationInSeconds,
    intent: {
      type: intent.type,
      destination: intent.type === "ride" ? intent.destination : undefined,
    },
    replyText: intent.replyText,
    audio: {
      base64: speech.audio.base64,
      mediaType: speech.audio.mediaType,
      format: speech.audio.format,
    },
  });
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return errorResponse("Missing OPENAI_API_KEY.", 500);
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = await request.json();

      const speakText =
        typeof body.speakText === "string" ? body.speakText.trim() : "";
      if (speakText) {
        const speech = await textToSpeech(speakText);

        return Response.json({
          replyText: speakText,
          audio: {
            base64: speech.audio.base64,
            mediaType: speech.audio.mediaType,
            format: speech.audio.format,
          },
        });
      }

      const commandText = typeof body.text === "string" ? body.text.trim() : "";
      if (!commandText || commandText.length > 500) {
        return errorResponse("Missing or invalid text command.");
      }

      const intent = await parseIntent(commandText, body.context);
      const speech = await textToSpeech(intent.replyText);

      return voiceJson({
        transcript: commandText,
        intent,
        speech,
      });
    }

    const form = await request.formData();
    const audio = form.get("audio");
    const contextValue = form.get("context");

    if (!(audio instanceof File)) {
      return errorResponse("Missing audio file.");
    }
    if (audio.size <= 0 || audio.size > maxAudioBytes) {
      return errorResponse("Audio file is empty or too large.");
    }

    const context =
      typeof contextValue === "string" ? JSON.parse(contextValue) : {};
    const audioBytes = new Uint8Array(await audio.arrayBuffer());

    const transcript = await transcribe({
      model: openai.transcription("gpt-4o-mini-transcribe"),
      audio: audioBytes,
      providerOptions: {
        openai: {
          language: "vi",
          prompt:
            "Vietnamese elderly rider using EasyMove. Likely places: ve nha, di benh vien Cho Ray, cho Ben Thanh, nha Linh, goi Linh, huy chuyen, dung, khong.",
        },
      },
    });

    const intent = await parseIntent(transcript.text, context);
    const speech = await textToSpeech(intent.replyText);

    return voiceJson({
      transcript: transcript.text,
      segments: transcript.segments,
      language: transcript.language,
      durationInSeconds: transcript.durationInSeconds,
      intent,
      speech,
    });
  } catch (error) {
    console.error("Rider voice route failed:", error);
    return errorResponse("Voice processing failed.", 500);
  }
}
