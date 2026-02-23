export interface Character {
  id: string;
  name: string;
  nameJp: string;
  age: number;
  occupation: string; // Hidden in Inferno, revealed in Paradise
  occupationHint: string; // Vague description for Inferno
  personality: string;
  background: string;
  interests: string[];
  datingStyle: string;
  avatar: string; // Emoji avatar
  gender: "male" | "female";
  color: string; // Tailwind color class for this character
  isInParadise: boolean;
  isEliminated: boolean;
}

export interface DialogueLine {
  characterId: string;
  text: string;
  emotion?: "happy" | "sad" | "nervous" | "flirty" | "angry" | "shocked" | "default";
}

export interface InnerThought {
  characterId: string;
  thought: string;
}

export interface AffinityChange {
  fromId: string;
  toId: string;
  change: number; // -15 to +25
  reason: string;
}

export interface ParadiseInvite {
  inviterId: string;
  inviteeId: string;
  accepted: boolean;
  inviterMessage: string;
  inviteeResponse: string;
}

export type EventType =
  | "introduction"
  | "conversation"
  | "group_activity"
  | "confession"
  | "paradise_invite"
  | "paradise_date"
  | "jealousy"
  | "drama"
  | "ceremony";

export type TimeOfDay = "morning" | "afternoon" | "evening";

export type GamePhase =
  | "intro"
  | "playing"
  | "ceremony"
  | "results";

export interface GameEvent {
  id: string;
  type: EventType;
  day: number;
  timeOfDay: TimeOfDay;
  participants: string[]; // Character IDs
  location: "inferno" | "paradise" | "ceremony";
  title: string;
  narrative: string;
  dialogue: DialogueLine[];
  innerThoughts: InnerThought[];
  affinityChanges: AffinityChange[];
  paradiseInvite?: ParadiseInvite;
  timestamp: number;
}

export interface FinalCouple {
  person1Id: string;
  person2Id: string;
}

export interface GameState {
  phase: GamePhase;
  day: number; // 1-4 (4 = ceremony day)
  timeOfDay: TimeOfDay;
  characters: Character[];
  // Affinities: key = "id1|id2" (smaller id first), value = 0-100
  affinities: Record<string, number>;
  events: GameEvent[];
  currentEvent: GameEvent | null;
  paradisePairs: string[][]; // [[char1Id, char2Id], ...]
  isLoading: boolean;
  autoPlay: boolean;
  autoPlaySpeed: number; // ms between events
  finalCouples: FinalCouple[] | null;
  eventCount: number; // Total events generated this day
}

export interface GenerateEventRequest {
  day: number;
  timeOfDay: TimeOfDay;
  characters: Character[];
  affinities: Record<string, number>;
  recentEvents: GameEvent[];
  paradisePairs: string[][];
}

export interface GenerateEventResponse {
  title: string;
  narrative: string;
  eventType: EventType;
  location: "inferno" | "paradise";
  participants: string[];
  dialogue: DialogueLine[];
  innerThoughts: InnerThought[];
  affinityChanges: AffinityChange[];
  paradiseInvite?: ParadiseInvite;
}

export interface GenerateCeremonyRequest {
  characters: Character[];
  affinities: Record<string, number>;
  paradisePairs: string[][];
  events: GameEvent[];
}

export interface GenerateCeremonyResponse {
  narrative: string;
  dialogue: DialogueLine[];
  couples: FinalCouple[];
  uncoupled: string[];
}
