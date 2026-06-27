import { google } from "@ai-sdk/google";
import { generateSpeech, generateText, Output } from "ai";
import { z } from "zod";

export const maxAudioBytes = 8 * 1024 * 1024;

export const destinations = [
  "Nha - 24 Nguyen Dinh Chieu",
  "Benh vien Cho Ray",
  "Đại học quốc gia TP.HCM",
  "Nha Linh - 88 Vo Van Tan",
] as const;

export const riderStages = [
  "start_booking",
  "confirm_booking",
  "active_trip",
  "confirm_cancel",
] as const;

export const riderStageSchema = z.enum(riderStages);
export type RiderStage = z.infer<typeof riderStageSchema>;

export const intentSchema = z.object({
  type: z.enum(["ride", "call", "cancel", "confirm", "reject", "unknown"]),
  destination: z
    .enum([...destinations])
    .nullable()
    .default(null),
  replyText: z.string(),
});

export type ParsedIntent = z.infer<typeof intentSchema>;

const allowedIntentsByStage: Record<RiderStage, ParsedIntent["type"][]> = {
  start_booking: ["ride", "call", "unknown"],
  confirm_booking: ["confirm", "reject", "unknown"],
  active_trip: ["cancel", "call", "unknown"],
  confirm_cancel: ["confirm", "reject", "unknown"],
};

const stageRejectionText: Record<RiderStage, string> = {
  start_booking:
    "Toi chi co the dat xe den Nha, Benh vien, Dai hoc, Nha Linh hoac goi Linh. Vui long lam theo huong dan hien tai.",
  confirm_booking:
    "Luc nay toi chi can ban tra loi dung hoac khong de xac nhan yeu cau. Vui long lam theo huong dan hien tai.",
  active_trip:
    "Luc nay toi chi co the huy chuyen xe hoac goi Linh. Vui long lam theo huong dan hien tai.",
  confirm_cancel:
    "Luc nay toi chi can ban xac nhan co huy chuyen xe hay khong. Vui long lam theo huong dan hien tai.",
};

const stageSubPrompts: Record<RiderStage, string> = {
  start_booking: `
    STAGE SUB-PROMPT: start_booking
    The rider is not in a trip and has no pending confirmation.
    Accept only:
    - "ride" when the user asks to go to one exact saved destination.
    - "call" when the user asks to call Linh or family.
    If the user talks off this current stage, reject with type "unknown" and tell the rider in Vietnamese that they should follow the current on-screen guide: choose Nha, Benh vien, Dai hoc, Nha Linh, or call Linh.
  `,
  confirm_booking: `
    STAGE SUB-PROMPT: confirm_booking
    The rider is confirming a pending ride or call shown on screen.
    Accept only:
    - "confirm" when the user says yes, correct, book it, call, or agrees.
    - "reject" when the user says no, stop, never mind, cancel this pending action, or go back.
    If the user talks off this current stage, reject with type "unknown" and tell the rider in Vietnamese that they should follow the current on-screen guide: answer dung/co or khong.
  `,
  active_trip: `
    STAGE SUB-PROMPT: active_trip
    The rider is already in an active trip.
    Accept only:
    - "cancel" when the user asks to cancel the active trip.
    - "call" when the user asks to call Linh or family.
    If the user talks off this current stage, reject with type "unknown" and tell the rider in Vietnamese that they should follow the current on-screen guide: ask to cancel the ride or call Linh.
  `,
  confirm_cancel: `
    STAGE SUB-PROMPT: confirm_cancel
    The rider is confirming cancellation of the active trip shown on screen.
    Accept only:
    - "confirm" when the user says yes, correct, cancel it, or agrees to cancel.
    - "reject" when the user says no, keep the trip, never mind, or go back.
    If the user talks off this current stage, reject with type "unknown" and tell the rider in Vietnamese that they should follow the current on-screen guide: confirm or reject the cancellation.
  `,
};

export function buildRiderVoicePrompt({
  commandText,
  stage,
  context,
}: {
  commandText: string;
  stage: RiderStage;
  context: {
    pendingIntent?: unknown;
    tripStatus?: unknown;
    history?: unknown;
  };
}) {
  const basePrompt = `
    BASE RIDER VOICE INSTRUCTIONS
    You parse Vietnamese text commands for AloXe, a ride app for an elderly rider.

    Current rider stage:
    ${stage}

    Allowed intents in this stage:
    ${JSON.stringify(allowedIntentsByStage[stage])}

    Allowed destinations array:
    ${JSON.stringify(destinations)}

    The user text can come from speech-to-text or from a clickable button prompt.
    Contrast the user's text with the destinations array. For ride requests, only choose a destination from that exact array.

    Current context:
    - Pending Intent: ${JSON.stringify(context.pendingIntent || null)}
    - Trip Status: ${JSON.stringify(context.tripStatus || null)}

    Conversation History:
    ${JSON.stringify(context.history || [])}

    Intent specific rules:
    - If type "confirm": user agrees, says yes, correct, book it, or confirms a pending action.
    - If type "reject": user says no, stop, never mind, or go back.
    - If type "call": user asks to call Linh, daughter, child, relative, or family.
    - If type "cancel": user asks to cancel the ride.
    - If type "ride": use for destinations. Map "go home" to "Nha - 24 Nguyen Dinh Chieu", "hospital" to "Benh vien Cho Ray", "school", "class", "university", "di hoc", or "đi học" to "Đại học quốc gia TP.HCM", and "Linh's home" to "Nha Linh - 88 Vo Van Tan".
    - For "unknown" commands, replyText must politely say in Vietnamese that the app cannot process anything outside the allowed action for the current stage and that the rider should follow the current on-screen guide.
    - replyText must be a short polite Vietnamese sentence that can be read aloud.
    - For type "ride", destination must be the exact matching array item.
    - For every non-ride type, destination must be null.
  `;

  return [basePrompt, stageSubPrompts[stage], `User text: ${commandText}`].join(
    "\n\n",
  );
}

export function enforceStageIntent(
  intent: ParsedIntent,
  stage: RiderStage,
): ParsedIntent {
  if (!allowedIntentsByStage[stage].includes(intent.type)) {
    return {
      type: "unknown",
      destination: null,
      replyText: stageRejectionText[stage],
    };
  }

  if (
    intent.type === "ride" &&
    intent.destination &&
    destinations.includes(intent.destination)
  ) {
    return intent;
  }

  if (intent.type === "ride") {
    return {
      type: "unknown",
      destination: null,
      replyText: stageRejectionText[stage],
    };
  }

  return {
    ...intent,
    destination: null,
  };
}

export function errorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function textToSpeech(text: string) {
  return generateSpeech({
    model: google.speech("gemini-3.1-flash-tts-preview"),
    speed: 1.0,
    text,
    instructions: "Speak Vietnamese clearly.",
  });
}

export async function parseIntent(
  commandText: string,
  stage: RiderStage,
  rawContext: unknown,
) {
  const context =
    rawContext && typeof rawContext === "object"
      ? (rawContext as {
          pendingIntent?: unknown;
          tripStatus?: unknown;
          history?: unknown;
        })
      : {};

  const { output } = await generateText({
    model: google("gemini-3.1-flash-lite"),
    output: Output.object({
      name: "RiderVoiceIntent",
      description:
        "Vietnamese voice or button intent for the AloXe elderly rider app.",
      schema: intentSchema,
    }),
    prompt: buildRiderVoicePrompt({ commandText, stage, context }),
  });

  return enforceStageIntent(output, stage);
}

export function voiceJson({
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
