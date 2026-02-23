import Anthropic from "@anthropic-ai/sdk";
import { buildEventPrompt, buildParadiseDatePrompt, buildCeremonyPrompt } from "./prompts";
import type {
  GenerateEventRequest,
  GenerateEventResponse,
  GenerateCeremonyRequest,
  GenerateCeremonyResponse,
  Character,
} from "../types";

export function createAnthropicClient(apiKey: string): Anthropic {
  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

async function callClaude(client: Anthropic, prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");
  return content.text;
}

function parseJSON<T>(text: string): T {
  const jsonMatch = text.trim().match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");
  return JSON.parse(jsonMatch[0]) as T;
}

export async function generateEvent(
  client: Anthropic,
  request: GenerateEventRequest
): Promise<{ event: GenerateEventResponse; paradiseEvent: GenerateEventResponse | null }> {
  const { day, timeOfDay, characters, affinities, recentEvents, paradisePairs } =
    request;

  const prompt = buildEventPrompt({
    day,
    timeOfDay,
    characters,
    affinities,
    recentEvents,
    paradisePairs,
  });

  const text = await callClaude(client, prompt);
  const eventData = parseJSON<GenerateEventResponse>(text);

  // If paradise invite accepted, also generate the paradise date
  if (
    eventData.eventType === "paradise_invite" &&
    eventData.paradiseInvite?.accepted
  ) {
    const invite = eventData.paradiseInvite;
    const inviter = characters.find((c: Character) => c.id === invite.inviterId);
    const invitee = characters.find((c: Character) => c.id === invite.inviteeId);

    if (inviter && invitee) {
      const affinityKey = [invite.inviterId, invite.inviteeId].sort().join("|");
      const affinityVal = affinities[affinityKey] ?? 0;

      const paradisePrompt = buildParadiseDatePrompt({
        inviter,
        invitee,
        affinityVal,
        paradisePairs,
      });

      try {
        const paradiseText = await callClaude(client, paradisePrompt);
        const paradiseEvent = parseJSON<GenerateEventResponse>(paradiseText);
        return { event: eventData, paradiseEvent };
      } catch {
        // Paradise date generation failed, return just the invite
      }
    }
  }

  return { event: eventData, paradiseEvent: null };
}

export async function generateCeremony(
  client: Anthropic,
  request: GenerateCeremonyRequest
): Promise<GenerateCeremonyResponse> {
  const { characters, affinities, paradisePairs, events } = request;

  const prompt = buildCeremonyPrompt({
    characters,
    affinities,
    paradisePairs,
    events,
  });

  const text = await callClaude(client, prompt);
  return parseJSON<GenerateCeremonyResponse>(text);
}
