"use client";

import { useEffect, useRef } from "react";
import type { GameEvent, Character } from "../types";
import {
  getEventTypeLabel,
  getLocationEmoji,
  getEmotionEmoji,
} from "../lib/gameEngine";

interface EventDisplayProps {
  event: GameEvent | null;
  characters: Character[];
  isLoading: boolean;
}

function DialogueBubble({
  line,
  character,
  index,
}: {
  line: { characterId: string; text: string; emotion?: string };
  character: Character | undefined;
  index: number;
}) {
  const isLeft = index % 2 === 0;

  return (
    <div
      className={`flex items-start gap-3 animate-fade-in ${isLeft ? "" : "flex-row-reverse"}`}
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 text-center">
        <div className="text-2xl">{character?.avatar ?? "❓"}</div>
        <div
          className="text-xs font-bold mt-0.5"
          style={{ color: character?.color ?? "#fff" }}
        >
          {character?.name ?? line.characterId}
        </div>
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 relative ${
          isLeft ? "rounded-tl-none" : "rounded-tr-none"
        }`}
        style={{
          background: character
            ? `${character.color}22`
            : "rgba(255,255,255,0.08)",
          borderLeft: isLeft
            ? `3px solid ${character?.color ?? "#fff"}`
            : undefined,
          borderRight: !isLeft
            ? `3px solid ${character?.color ?? "#fff"}`
            : undefined,
        }}
      >
        {line.emotion && line.emotion !== "default" && (
          <span className="mr-1">{getEmotionEmoji(line.emotion)}</span>
        )}
        <span className="text-white text-sm leading-relaxed">{line.text}</span>
      </div>
    </div>
  );
}

function InnerThoughtBubble({
  thought,
  character,
  index,
}: {
  thought: { characterId: string; thought: string };
  character: Character | undefined;
  index: number;
}) {
  return (
    <div
      className="flex items-start gap-2 animate-fade-in"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="text-lg">{character?.avatar ?? "💭"}</div>
      <div className="flex-1 italic text-gray-400 text-xs bg-white/5 rounded-lg px-3 py-2 border border-white/10">
        <span className="text-gray-500 text-xs mr-1">[{character?.name ?? "?"}の本心]</span>
        {thought.thought}
      </div>
    </div>
  );
}

export default function EventDisplay({
  event,
  characters,
  isLoading,
}: EventDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [event]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white/10 border-t-yellow-400 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">
            🔥
          </div>
        </div>
        <p className="text-gray-400 text-sm animate-pulse">
          次のドラマが始まります...
        </p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <div className="text-6xl">🏝️</div>
        <p className="text-gray-300 text-lg font-display">
          AI Island インフェルノ
        </p>
        <p className="text-gray-500 text-sm">
          「次のイベント」を押してドラマを見よう
        </p>
      </div>
    );
  }

  const participantChars = event.participants.map((id) =>
    characters.find((c) => c.id === id)
  );

  const isParadise = event.location === "paradise";

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-4 py-3 space-y-4">
      {/* Event Header */}
      <div
        className={`rounded-xl p-3 text-center ${
          isParadise
            ? "bg-gradient-to-r from-sky-900/60 to-blue-800/60 border border-sky-500/30"
            : "bg-gradient-to-r from-red-900/60 to-orange-900/60 border border-orange-500/30"
        }`}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-xl">{getLocationEmoji(event.location)}</span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isParadise
                ? "bg-sky-500/20 text-sky-300"
                : "bg-orange-500/20 text-orange-300"
            }`}
          >
            {getEventTypeLabel(event.type)}
          </span>
        </div>
        <h2 className="text-white font-bold text-lg">{event.title}</h2>
        <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
          {participantChars.map((char) => (
            <span
              key={char?.id}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: `${char?.color ?? "#fff"}22`,
                color: char?.color ?? "#fff",
              }}
            >
              {char?.avatar} {char?.name}
            </span>
          ))}
        </div>
      </div>

      {/* Narrative */}
      <div className="text-gray-300 text-sm leading-relaxed bg-white/5 rounded-lg p-3 border border-white/10">
        {event.narrative}
      </div>

      {/* Paradise Invite */}
      {event.paradiseInvite && (
        <div
          className={`rounded-xl p-4 border ${
            event.paradiseInvite.accepted
              ? "bg-yellow-900/30 border-yellow-500/50"
              : "bg-gray-900/50 border-gray-500/30"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">
              {event.paradiseInvite.accepted ? "✨" : "💔"}
            </span>
            <span className="text-white font-bold text-sm">
              パラダイス招待 —{" "}
              {event.paradiseInvite.accepted ? "承諾！" : "断られた..."}
            </span>
          </div>
          <p className="text-gray-300 text-sm italic">
            &ldquo;{event.paradiseInvite.inviterMessage}&rdquo;
          </p>
          <p className="text-gray-400 text-sm mt-1">
            返答: &ldquo;{event.paradiseInvite.inviteeResponse}&rdquo;
          </p>
        </div>
      )}

      {/* Dialogue */}
      {event.dialogue.length > 0 && (
        <div className="space-y-3">
          <p className="text-gray-500 text-xs uppercase tracking-wider">
            💬 会話
          </p>
          {event.dialogue.map((line, i) => (
            <DialogueBubble
              key={i}
              line={line}
              character={characters.find((c) => c.id === line.characterId)}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Inner Thoughts */}
      {event.innerThoughts.length > 0 && (
        <div className="space-y-2">
          <p className="text-gray-500 text-xs uppercase tracking-wider">
            💭 本心（視聴者だけ知っている）
          </p>
          {event.innerThoughts.map((thought, i) => (
            <InnerThoughtBubble
              key={i}
              thought={thought}
              character={characters.find((c) => c.id === thought.characterId)}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Affinity Changes */}
      {event.affinityChanges.length > 0 && (
        <div className="space-y-1">
          <p className="text-gray-500 text-xs uppercase tracking-wider">
            ❤️ 好感度の変化
          </p>
          {event.affinityChanges.map((change, i) => {
            const from = characters.find((c) => c.id === change.fromId);
            const to = characters.find((c) => c.id === change.toId);
            const isPositive = change.change >= 0;
            return (
              <div
                key={i}
                className="flex items-center gap-2 text-xs bg-white/5 rounded-lg px-3 py-1.5"
              >
                <span style={{ color: from?.color }}>{from?.name}</span>
                <span className="text-gray-500">→</span>
                <span style={{ color: to?.color }}>{to?.name}</span>
                <span
                  className={`ml-auto font-bold ${
                    isPositive ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {change.change}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
