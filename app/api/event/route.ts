import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildEventPrompt, buildParadiseDatePrompt } from "@/src/lib/prompts";
import type { GenerateEventRequest, GenerateEventResponse } from "@/src/types";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const body: GenerateEventRequest = await req.json();
    const { day, timeOfDay, characters, affinities, recentEvents, paradisePairs } = body;

    const prompt = buildEventPrompt({
      day,
      timeOfDay,
      characters,
      affinities,
      recentEvents,
      paradisePairs,
    });

    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    // Extract JSON from the response
    const text = content.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const eventData: GenerateEventResponse = JSON.parse(jsonMatch[0]);

    // If paradise_invite was accepted, also generate the paradise date
    if (
      eventData.eventType === "paradise_invite" &&
      eventData.paradiseInvite?.accepted
    ) {
      const invite = eventData.paradiseInvite;
      const inviter = characters.find((c) => c.id === invite.inviterId);
      const invitee = characters.find((c) => c.id === invite.inviteeId);

      if (inviter && invitee) {
        const affinityKey = [invite.inviterId, invite.inviteeId]
          .sort()
          .join("|");
        const affinityVal = affinities[affinityKey] ?? 0;

        const paradisePrompt = buildParadiseDatePrompt({
          inviter,
          invitee,
          affinityVal,
          paradisePairs,
        });

        const paradiseMessage = await client.messages.create({
          model: "claude-opus-4-5",
          max_tokens: 1024,
          messages: [{ role: "user", content: paradisePrompt }],
        });

        const paradiseContent = paradiseMessage.content[0];
        if (paradiseContent.type === "text") {
          const paradiseText = paradiseContent.text.trim();
          const paradiseJsonMatch = paradiseText.match(/\{[\s\S]*\}/);
          if (paradiseJsonMatch) {
            const paradiseEvent: GenerateEventResponse = JSON.parse(
              paradiseJsonMatch[0]
            );
            return NextResponse.json({
              event: eventData,
              paradiseEvent,
            });
          }
        }
      }
    }

    return NextResponse.json({ event: eventData, paradiseEvent: null });
  } catch (error) {
    console.error("Error generating event:", error);
    return NextResponse.json(
      { error: "Failed to generate event" },
      { status: 500 }
    );
  }
}
