import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildCeremonyPrompt } from "@/src/lib/prompts";
import type {
  GenerateCeremonyRequest,
  GenerateCeremonyResponse,
} from "@/src/types";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const body: GenerateCeremonyRequest = await req.json();
    const { characters, affinities, paradisePairs, events } = body;

    const prompt = buildCeremonyPrompt({
      characters,
      affinities,
      paradisePairs,
      events,
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

    const text = content.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const ceremonyData: GenerateCeremonyResponse = JSON.parse(jsonMatch[0]);
    return NextResponse.json(ceremonyData);
  } catch (error) {
    console.error("Error generating ceremony:", error);
    return NextResponse.json(
      { error: "Failed to generate ceremony" },
      { status: 500 }
    );
  }
}
