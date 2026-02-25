"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { GameState, GameEvent } from "../types";
import {
  createInitialState,
  applyAffinityChanges,
  applyParadiseInvite,
  advanceTime,
  shouldAdvanceTime,
  getDayLabel,
  getTimeLabel,
  getMaleCharacters,
  getFemaleCharacters,
} from "../lib/gameEngine";
import { getAffinityKey } from "../data/characters";
import { generateEvent, generateCeremony } from "../lib/gameAI";
import CharacterCard from "./CharacterCard";
import EventDisplay from "./EventDisplay";
import EventLog from "./EventLog";
import RelationshipMatrix from "./RelationshipMatrix";


// ─── Intro Screen ─────────────────────────────────────────────────────────────
function IntroScreen({ onStart }: { onStart: () => void }) {
  const [revealed, setRevealed] = useState(0);
  const chars = createInitialState().characters;

  useEffect(() => {
    if (revealed < chars.length) {
      const timer = setTimeout(() => setRevealed((r) => r + 1), 600);
      return () => clearTimeout(timer);
    }
  }, [revealed, chars.length]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* BG stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30 animate-pulse-slow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <div className="text-center mb-12 relative z-10">
        <div className="text-7xl mb-4">🏝️</div>
        <h1 className="text-5xl font-display font-bold text-white mb-2">
          AI Island
        </h1>
        <h2 className="text-3xl font-display text-orange-400 mb-4">
          インフェルノ
        </h2>
        <p className="text-gray-400 text-sm max-w-md">
          AIキャラクターたちが無人島で繰り広げる恋愛ドラマ。
          <br />
          あなたはただ、見守るだけ。
        </p>
      </div>

      {/* Character Cards */}
      <div className="grid grid-cols-3 gap-4 md:grid-cols-6 mb-12 relative z-10">
        {chars.map((char, i) => (
          <div
            key={char.id}
            className="transition-all duration-500"
            style={{
              opacity: i < revealed ? 1 : 0,
              transform: i < revealed ? "translateY(0)" : "translateY(20px)",
            }}
          >
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 transition-colors">
              <div className="text-4xl mb-2">{char.avatar}</div>
              <div
                className="font-bold text-sm"
                style={{ color: char.color }}
              >
                {char.name}
              </div>
              <div className="text-gray-400 text-xs">
                {char.nameJp} {char.age}歳
              </div>
              <div className="text-gray-500 text-xs mt-1 italic">
                {char.occupationHint}
              </div>
              <div className="mt-2 flex flex-wrap gap-1 justify-center">
                {char.interests.slice(0, 2).map((interest) => (
                  <span
                    key={interest}
                    className="text-xs px-1.5 py-0.5 rounded-full bg-white/10 text-gray-400"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Start button */}
      {revealed >= chars.length && (
        <button
          onClick={onStart}
          className="relative z-10 px-12 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold text-xl rounded-full transition-all duration-300 shadow-lg shadow-orange-600/30 hover:shadow-orange-500/50 hover:scale-105 animate-fade-in"
        >
          🔥 番組スタート
        </button>
      )}
    </div>
  );
}

// ─── Results Screen ────────────────────────────────────────────────────────────
function ResultsScreen({
  state,
  onRestart,
}: {
  state: GameState;
  onRestart: () => void;
}) {
  const { characters, finalCouples, events } = state;
  const couples = finalCouples ?? [];
  const allCoupledIds = couples.flatMap((c) => [c.person1Id, c.person2Id]);
  const uncoupled = characters.filter(
    (c) => !c.isEliminated && !allCoupledIds.includes(c.id)
  );

  const lastEvent = events[events.length - 1];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">✨</div>
        <h1 className="text-4xl font-display font-bold text-white mb-2">
          最終結果
        </h1>
        <p className="text-gray-400 text-sm">3日間のドラマが幕を閉じた</p>
      </div>

      {/* Ceremony narrative */}
      {lastEvent && (
        <div className="max-w-2xl w-full bg-white/5 rounded-xl p-4 mb-8 border border-white/10">
          <p className="text-gray-300 text-sm text-center leading-relaxed italic">
            {lastEvent.narrative}
          </p>
        </div>
      )}

      {/* Couples */}
      <div className="max-w-2xl w-full mb-8">
        <h2 className="text-center text-yellow-400 font-bold text-lg mb-4">
          💕 成立したカップル
        </h2>
        {couples.length === 0 ? (
          <p className="text-center text-gray-500">カップルは成立しませんでした</p>
        ) : (
          <div className="space-y-4">
            {couples.map((couple, i) => {
              const p1 = characters.find((c) => c.id === couple.person1Id);
              const p2 = characters.find((c) => c.id === couple.person2Id);
              const affinityKey = getAffinityKey(
                couple.person1Id,
                couple.person2Id
              );
              const affinityVal = state.affinities[affinityKey] ?? 0;
              return (
                <div
                  key={i}
                  className="flex items-center justify-center gap-6 bg-gradient-to-r from-rose-900/30 via-pink-900/30 to-rose-900/30 border border-rose-500/20 rounded-2xl p-6 animate-fade-in"
                  style={{ animationDelay: `${i * 0.3}s` }}
                >
                  <div className="text-center">
                    <div className="text-5xl">{p1?.avatar}</div>
                    <div
                      className="font-bold text-sm mt-1"
                      style={{ color: p1?.color }}
                    >
                      {p1?.name}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl">💕</div>
                    <div className="text-yellow-400 text-xs font-bold">
                      {affinityVal}/100
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl">{p2?.avatar}</div>
                    <div
                      className="font-bold text-sm mt-1"
                      style={{ color: p2?.color }}
                    >
                      {p2?.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Uncoupled */}
      {uncoupled.length > 0 && (
        <div className="max-w-2xl w-full mb-8">
          <h2 className="text-center text-gray-400 font-bold text-sm mb-3">
            💔 カップル不成立
          </h2>
          <div className="flex justify-center gap-4 flex-wrap">
            {uncoupled.map((char) => (
              <div key={char.id} className="text-center opacity-60">
                <div className="text-3xl">{char.avatar}</div>
                <div className="text-xs text-gray-500">{char.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="max-w-2xl w-full bg-white/5 rounded-xl p-4 mb-8 border border-white/10">
        <h3 className="text-center text-gray-400 text-sm mb-3">📊 番組統計</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{events.length}</div>
            <div className="text-gray-500 text-xs">総イベント数</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {state.paradisePairs.length}
            </div>
            <div className="text-gray-500 text-xs">パラダイス訪問</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {couples.length}
            </div>
            <div className="text-gray-500 text-xs">カップル成立</div>
          </div>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="px-10 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-full transition-all duration-300 hover:scale-105"
      >
        🔄 もう一度見る
      </button>
    </div>
  );
}

// ─── Main Game Component ───────────────────────────────────────────────────────
export default function Game() {
  const [state, setState] = useState<GameState>(createInitialState);
  const [viewingEvent, setViewingEvent] = useState<GameEvent | null>(null);
  const [apiError, setApiError] = useState<string>("");
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);

  const currentDisplayEvent = viewingEvent ?? state.currentEvent;

  // ── Generate next event ───────────────────────────────────────────────────
  const generateNextEvent = useCallback(async () => {
    if (state.isLoading) return;
    if (state.phase === "ceremony" || state.phase === "results") return;

    setState((s) => ({ ...s, isLoading: true }));
    setViewingEvent(null);
    setApiError("");

    try {
      const data = await generateEvent({
        day: state.day,
        timeOfDay: state.timeOfDay,
        characters: state.characters,
        affinities: state.affinities,
        recentEvents: state.events.slice(-5),
        paradisePairs: state.paradisePairs,
      });

      const newEventId = `evt_${Date.now()}`;
      const newEvent: GameEvent = {
        id: newEventId,
        type: data.event.eventType,
        day: state.day,
        timeOfDay: state.timeOfDay,
        participants: data.event.participants,
        location: data.event.location,
        title: data.event.title,
        narrative: data.event.narrative,
        dialogue: data.event.dialogue,
        innerThoughts: data.event.innerThoughts ?? [],
        affinityChanges: data.event.affinityChanges ?? [],
        paradiseInvite: data.event.paradiseInvite ?? undefined,
        timestamp: Date.now(),
      };

      setState((prev) => {
        let updated: GameState = {
          ...prev,
          events: [...prev.events, newEvent],
          currentEvent: newEvent,
          isLoading: false,
          eventCount: prev.eventCount + 1,
        };

        // Apply affinity changes
        updated.affinities = applyAffinityChanges(
          updated.affinities,
          newEvent.affinityChanges
        );

        // Handle paradise invite
        if (newEvent.paradiseInvite?.accepted) {
          updated = applyParadiseInvite(updated, newEvent);
        }

        // If paradise date was also generated
        if (data.paradiseEvent) {
          const paradiseEventId = `evt_${Date.now() + 1}`;
          const paradiseGameEvent: GameEvent = {
            id: paradiseEventId,
            type: data.paradiseEvent.eventType,
            day: updated.day,
            timeOfDay: updated.timeOfDay,
            participants: data.paradiseEvent.participants,
            location: "paradise",
            title: data.paradiseEvent.title,
            narrative: data.paradiseEvent.narrative,
            dialogue: data.paradiseEvent.dialogue,
            innerThoughts: data.paradiseEvent.innerThoughts ?? [],
            affinityChanges: data.paradiseEvent.affinityChanges ?? [],
            timestamp: Date.now() + 1,
          };
          updated.events = [...updated.events, paradiseGameEvent];
          updated.currentEvent = paradiseGameEvent;
          updated.affinities = applyAffinityChanges(
            updated.affinities,
            paradiseGameEvent.affinityChanges
          );
          // Return from paradise
          updated.characters = updated.characters.map((c) => ({
            ...c,
            isInParadise: false,
          }));
        }

        // Check if we should advance time
        if (shouldAdvanceTime(updated)) {
          updated = advanceTime(updated);
        }

        return updated;
      });
    } catch (err) {
      console.error("Failed to generate event:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      setApiError(`イベント生成に失敗しました: ${msg}`);
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, [state]);

  // ── Generate ceremony ────────────────────────────────────────────────────
  const generateCeremonyHandler = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true }));
    setApiError("");

    try {
      const data = await generateCeremony({
        characters: state.characters,
        affinities: state.affinities,
        paradisePairs: state.paradisePairs,
        events: state.events,
      });

      const ceremonyEvent: GameEvent = {
        id: `ceremony_${Date.now()}`,
        type: "ceremony",
        day: state.day,
        timeOfDay: "evening",
        participants: state.characters
          .filter((c) => !c.isEliminated)
          .map((c) => c.id),
        location: "ceremony",
        title: "最終カップリング",
        narrative: data.narrative,
        dialogue: data.dialogue,
        innerThoughts: [],
        affinityChanges: [],
        timestamp: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        events: [...prev.events, ceremonyEvent],
        currentEvent: ceremonyEvent,
        isLoading: false,
        phase: "results",
        finalCouples: data.couples,
      }));
    } catch (err) {
      console.error("Failed to generate ceremony:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      setApiError(`セレモニー生成に失敗しました: ${msg}`);
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, [state]);

  // ── Auto-play ─────────────────────────────────────────────────────────────
  const toggleAutoPlay = useCallback(() => {
    setState((s) => ({ ...s, autoPlay: !s.autoPlay }));
  }, []);

  useEffect(() => {
    if (!state.autoPlay) {
      if (autoPlayTimer.current) clearTimeout(autoPlayTimer.current);
      return;
    }

    if (state.phase === "ceremony") {
      autoPlayTimer.current = setTimeout(generateCeremonyHandler, 2000);
    } else if (state.phase === "playing" && !state.isLoading) {
      autoPlayTimer.current = setTimeout(generateNextEvent, state.autoPlaySpeed);
    }

    return () => {
      if (autoPlayTimer.current) clearTimeout(autoPlayTimer.current);
    };
  }, [state.autoPlay, state.phase, state.isLoading, state.autoPlaySpeed, generateNextEvent, generateCeremonyHandler]);

  // ── Start game ──────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    setState((s) => ({ ...s, phase: "playing" }));
  }, []);

  const restartGame = useCallback(() => {
    setState(createInitialState());
    setViewingEvent(null);
  }, []);

  // ── Render phases ─────────────────────────────────────────────────────────
  if (state.phase === "intro") {
    return <IntroScreen onStart={startGame} />;
  }

  if (state.phase === "results") {
    return <ResultsScreen state={state} onRestart={restartGame} />;
  }

  const males = getMaleCharacters(state.characters);
  const females = getFemaleCharacters(state.characters);
  const activeParticipants = currentDisplayEvent?.participants ?? [];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Header ── */}
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-4 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏝️</span>
            <div>
              <div className="text-white font-bold text-sm leading-none">AI Island</div>
              <div className="text-orange-400 text-xs">インフェルノ</div>
            </div>
          </div>

          {/* Day + Time */}
          <div className="flex items-center gap-2 ml-4">
            <span className="bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full">
              {getDayLabel(state.day)}
            </span>
            <span className="bg-orange-500/20 text-orange-300 text-xs px-3 py-1 rounded-full">
              {getTimeLabel(state.timeOfDay)}
            </span>
            {state.phase === "ceremony" && (
              <span className="bg-yellow-500/20 text-yellow-300 text-xs px-3 py-1 rounded-full animate-pulse">
                セレモニー
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Auto-play speed */}
            {state.autoPlay && (
              <select
                value={state.autoPlaySpeed}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    autoPlaySpeed: Number(e.target.value),
                  }))
                }
                className="bg-white/10 text-gray-300 text-xs rounded px-2 py-1 border border-white/10"
              >
                <option value={5000}>速め</option>
                <option value={8000}>普通</option>
                <option value={12000}>ゆっくり</option>
              </select>
            )}

            {/* Auto-play toggle */}
            <button
              onClick={toggleAutoPlay}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                state.autoPlay
                  ? "bg-red-500/80 text-white shadow-red-500/30 shadow-lg"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${state.autoPlay ? "bg-white animate-pulse" : "bg-gray-500"}`} />
              {state.autoPlay ? "AUTO 再生中" : "AUTO OFF"}
            </button>

            {/* Restart */}
            <button
              onClick={restartGame}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2"
            >
              ↺ リスタート
            </button>

          </div>
        </div>
      </header>

      <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-4 flex flex-col gap-4">
        {/* ── Character Row ── */}
        <section className="flex gap-6 justify-center">
          {/* Males */}
          <div className="flex gap-2">
            {males.map((char) => (
              <CharacterCard
                key={char.id}
                character={char}
                affinities={state.affinities}
                allCharacters={state.characters}
                isActive={activeParticipants.includes(char.id)}
                size="sm"
              />
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center">
            <div className="w-px h-full bg-white/10" />
            <span className="text-gray-600 text-xs px-2">VS</span>
            <div className="w-px h-full bg-white/10" />
          </div>

          {/* Females */}
          <div className="flex gap-2">
            {females.map((char) => (
              <CharacterCard
                key={char.id}
                character={char}
                affinities={state.affinities}
                allCharacters={state.characters}
                isActive={activeParticipants.includes(char.id)}
                size="sm"
              />
            ))}
          </div>
        </section>

        {/* ── Main Content ── */}
        <section className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0" style={{ minHeight: "500px" }}>
          {/* Event Display - main */}
          <div className="lg:col-span-2 bg-white/3 rounded-2xl border border-white/10 overflow-hidden flex flex-col" style={{ background: "rgba(255,255,255,0.02)" }}>
            {/* Location banner */}
            {currentDisplayEvent && (
              <div
                className={`px-4 py-2 text-xs font-bold flex items-center gap-2 ${
                  currentDisplayEvent.location === "paradise"
                    ? "bg-gradient-to-r from-sky-900/80 to-blue-900/80 text-sky-300"
                    : currentDisplayEvent.location === "ceremony"
                    ? "bg-gradient-to-r from-yellow-900/80 to-amber-900/80 text-yellow-300"
                    : "bg-gradient-to-r from-red-900/80 to-orange-900/80 text-orange-300"
                }`}
              >
                {currentDisplayEvent.location === "paradise"
                  ? "✨ PARADISE"
                  : currentDisplayEvent.location === "ceremony"
                  ? "👑 CEREMONY"
                  : "🔥 INFERNO"}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <EventDisplay
                event={currentDisplayEvent}
                characters={state.characters}
                isLoading={state.isLoading}
              />
            </div>
          </div>

          {/* Right panel: Event Log + Relationship Matrix */}
          <div className="flex flex-col gap-4" style={{ minHeight: "500px" }}>
            {/* Event Log */}
            <div
              className="flex-1 bg-white/3 rounded-2xl border border-white/10 p-3 overflow-hidden flex flex-col"
              style={{ background: "rgba(255,255,255,0.02)", minHeight: "200px" }}
            >
              <EventLog
                events={state.events}
                characters={state.characters}
                onSelectEvent={setViewingEvent}
                currentEventId={currentDisplayEvent?.id ?? null}
              />
            </div>

            {/* Relationship Matrix */}
            <div
              className="bg-white/3 rounded-2xl border border-white/10 p-3"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <RelationshipMatrix
                characters={state.characters}
                affinities={state.affinities}
              />
            </div>
          </div>
        </section>

        {/* ── Control Bar ── */}
        <section className="flex items-center justify-center gap-3 pb-2">
          {state.phase === "playing" && (
            <button
              onClick={generateNextEvent}
              disabled={state.isLoading || state.autoPlay}
              className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-lg shadow-orange-600/20"
            >
              {state.isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  生成中...
                </span>
              ) : (
                "▶ 次のイベント"
              )}
            </button>
          )}

          {state.phase === "ceremony" && (
            <button
              onClick={generateCeremonyHandler}
              disabled={state.isLoading || state.autoPlay}
              className="px-8 py-3 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white font-bold rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-lg shadow-yellow-600/20 animate-pulse"
            >
              {state.isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  セレモニー進行中...
                </span>
              ) : (
                "✨ カップリングセレモニー"
              )}
            </button>
          )}

          {/* Error display */}
          {apiError && (
            <div className="bg-red-900/40 border border-red-500/30 rounded-lg px-4 py-2">
              <p className="text-red-400 text-xs">{apiError}</p>
            </div>
          )}

          {/* Event count indicator */}
          <div className="text-xs text-gray-600">
            イベント数: {state.events.length} /{" "}
            {state.phase === "ceremony" ? "最終" : "進行中"}
          </div>
        </section>
      </div>
    </div>
  );
}
