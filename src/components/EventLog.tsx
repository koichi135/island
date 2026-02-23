"use client";

import { useEffect, useRef } from "react";
import type { GameEvent, Character } from "../types";
import { getEventTypeLabel, getLocationEmoji } from "../lib/gameEngine";

interface EventLogProps {
  events: GameEvent[];
  characters: Character[];
  onSelectEvent: (event: GameEvent) => void;
  currentEventId: string | null;
}

function EventLogItem({
  event,
  characters,
  isSelected,
  onClick,
}: {
  event: GameEvent;
  characters: Character[];
  isSelected: boolean;
  onClick: () => void;
}) {
  const participants = event.participants
    .map((id) => characters.find((c) => c.id === id))
    .filter(Boolean);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-2.5 rounded-lg border transition-all duration-200 ${
        isSelected
          ? "border-yellow-400/50 bg-yellow-400/10"
          : "border-white/5 hover:border-white/20 hover:bg-white/5"
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="text-sm flex-shrink-0">
          {getLocationEmoji(event.location)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-white text-xs font-bold truncate">
              {event.title}
            </span>
            <span className="text-gray-500 text-xs flex-shrink-0">
              D{event.day}
              {event.timeOfDay === "morning"
                ? "朝"
                : event.timeOfDay === "afternoon"
                ? "午"
                : "夜"}
            </span>
          </div>
          <div className="flex items-center gap-0.5 mb-0.5 flex-wrap">
            {participants.map((char) => (
              <span
                key={char!.id}
                className="text-xs"
                style={{ color: char!.color }}
              >
                {char!.avatar}
              </span>
            ))}
            <span className="text-gray-500 text-xs ml-1">
              {getEventTypeLabel(event.type)}
            </span>
          </div>
          <p className="text-gray-500 text-xs truncate">{event.narrative}</p>
        </div>
      </div>
    </button>
  );
}

export default function EventLog({
  events,
  characters,
  onSelectEvent,
  currentEventId,
}: EventLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [events.length]);

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-1">
        📋 イベント履歴
        <span className="ml-auto bg-white/10 text-gray-400 text-xs px-1.5 py-0.5 rounded-full">
          {events.length}件
        </span>
      </h3>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {events.length === 0 ? (
          <p className="text-gray-600 text-xs text-center py-4">
            まだイベントがありません
          </p>
        ) : (
          events.map((event) => (
            <EventLogItem
              key={event.id}
              event={event}
              characters={characters}
              isSelected={currentEventId === event.id}
              onClick={() => onSelectEvent(event)}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
