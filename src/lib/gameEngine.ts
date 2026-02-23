import type {
  GameState,
  GameEvent,
  Character,
  AffinityChange,
  TimeOfDay,
} from "../types";
import {
  INITIAL_CHARACTERS,
  buildInitialAffinities,
  getAffinityKey,
} from "../data/characters";

export function createInitialState(): GameState {
  return {
    phase: "intro",
    day: 1,
    timeOfDay: "morning",
    characters: INITIAL_CHARACTERS.map((c) => ({ ...c })),
    affinities: buildInitialAffinities(),
    events: [],
    currentEvent: null,
    paradisePairs: [],
    isLoading: false,
    autoPlay: false,
    autoPlaySpeed: 8000,
    finalCouples: null,
    eventCount: 0,
  };
}

export function applyAffinityChanges(
  affinities: Record<string, number>,
  changes: AffinityChange[]
): Record<string, number> {
  const updated = { ...affinities };
  for (const change of changes) {
    const key = getAffinityKey(change.fromId, change.toId);
    const current = updated[key] ?? 0;
    updated[key] = Math.max(0, Math.min(100, current + change.change));
  }
  return updated;
}

export function applyParadiseInvite(
  state: GameState,
  event: GameEvent
): GameState {
  const invite = event.paradiseInvite;
  if (!invite || !invite.accepted) return state;

  const newPairs = [...state.paradisePairs, [invite.inviterId, invite.inviteeId]];
  const newChars = state.characters.map((c) => {
    if (c.id === invite.inviterId || c.id === invite.inviteeId) {
      return { ...c, isInParadise: true };
    }
    return c;
  });

  return { ...state, paradisePairs: newPairs, characters: newChars };
}

export function returnFromParadise(state: GameState): GameState {
  const newChars = state.characters.map((c) => ({ ...c, isInParadise: false }));
  return { ...state, characters: newChars };
}

export function advanceTime(state: GameState): GameState {
  const order: TimeOfDay[] = ["morning", "afternoon", "evening"];
  const idx = order.indexOf(state.timeOfDay);

  if (idx < order.length - 1) {
    return { ...state, timeOfDay: order[idx + 1], eventCount: 0 };
  }

  // Advance day
  const nextDay = state.day + 1;
  if (nextDay > 3) {
    return {
      ...state,
      day: nextDay,
      timeOfDay: "morning",
      phase: "ceremony",
      eventCount: 0,
    };
  }

  return {
    ...state,
    day: nextDay,
    timeOfDay: "morning",
    eventCount: 0,
  };
}

// How many events per time slot
export function getEventsPerSlot(timeOfDay: TimeOfDay): number {
  if (timeOfDay === "morning") return 2;
  if (timeOfDay === "afternoon") return 3;
  return 2; // evening
}

export function shouldAdvanceTime(state: GameState): boolean {
  return state.eventCount >= getEventsPerSlot(state.timeOfDay);
}

export function getDayLabel(day: number): string {
  return `DAY ${day}`;
}

export function getTimeLabel(timeOfDay: TimeOfDay): string {
  if (timeOfDay === "morning") return "朝";
  if (timeOfDay === "afternoon") return "午後";
  return "夜";
}

export function getActiveCharacters(characters: Character[]): Character[] {
  return characters.filter((c) => !c.isEliminated);
}

export function getMaleCharacters(characters: Character[]): Character[] {
  return characters.filter(
    (c) => c.gender === "male" && !c.isEliminated
  );
}

export function getFemaleCharacters(characters: Character[]): Character[] {
  return characters.filter(
    (c) => c.gender === "female" && !c.isEliminated
  );
}

export function getTopAffinityPairs(
  characters: Character[],
  affinities: Record<string, number>,
  topN = 3
): { male: string; female: string; val: number }[] {
  const males = getMaleCharacters(characters);
  const females = getFemaleCharacters(characters);
  const pairs: { male: string; female: string; val: number }[] = [];

  for (const m of males) {
    for (const f of females) {
      const key = getAffinityKey(m.id, f.id);
      pairs.push({ male: m.id, female: f.id, val: affinities[key] ?? 0 });
    }
  }

  return pairs.sort((a, b) => b.val - a.val).slice(0, topN);
}

export function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    introduction: "初対面",
    conversation: "会話",
    group_activity: "グループ活動",
    confession: "告白",
    paradise_invite: "パラダイス招待",
    paradise_date: "パラダイスデート",
    jealousy: "嫉妬",
    drama: "ドラマ",
    ceremony: "セレモニー",
  };
  return labels[type] ?? type;
}

export function getLocationEmoji(location: string): string {
  return location === "paradise" ? "✨" : "🔥";
}

export function getEmotionEmoji(emotion?: string): string {
  const map: Record<string, string> = {
    happy: "😊",
    sad: "😢",
    nervous: "😰",
    flirty: "😏",
    angry: "😤",
    shocked: "😱",
    default: "",
  };
  return map[emotion ?? "default"] ?? "";
}
