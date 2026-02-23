"use client";

import type { Character } from "../types";
import { getAffinityKey, getAffinityEmoji } from "../data/characters";

interface CharacterCardProps {
  character: Character;
  affinities: Record<string, number>;
  allCharacters: Character[];
  isActive?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  revealOccupation?: boolean;
}

export default function CharacterCard({
  character,
  affinities,
  allCharacters,
  isActive = false,
  size = "md",
  onClick,
  revealOccupation = false,
}: CharacterCardProps) {
  const opposite = allCharacters.filter(
    (c) => c.gender !== character.gender && !c.isEliminated
  );

  const topMatches = opposite
    .map((c) => ({
      char: c,
      val: affinities[getAffinityKey(character.id, c.id)] ?? 0,
    }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 3);

  const cardSizes = {
    sm: "w-24 p-2",
    md: "w-32 p-3",
    lg: "w-40 p-4",
  };

  const avatarSizes = {
    sm: "text-3xl",
    md: "text-4xl",
    lg: "text-5xl",
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl border transition-all duration-300 cursor-pointer
        ${cardSizes[size]}
        ${isActive
          ? "border-yellow-400 shadow-lg shadow-yellow-400/30 scale-105"
          : "border-white/20 hover:border-white/40"
        }
        ${character.isInParadise
          ? "bg-gradient-to-b from-sky-900/80 to-blue-950/80"
          : character.isEliminated
          ? "bg-gray-900/50 opacity-50"
          : "bg-white/5 hover:bg-white/10"
        }
      `}
      style={{
        boxShadow: isActive
          ? `0 0 20px ${character.color}40`
          : undefined,
      }}
    >
      {/* Paradise / Eliminated Badge */}
      {character.isInParadise && (
        <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
          ✨
        </span>
      )}
      {character.isEliminated && (
        <span className="absolute -top-2 -right-2 bg-gray-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
          ✖
        </span>
      )}

      {/* Avatar */}
      <div className={`text-center mb-1 ${avatarSizes[size]}`}>
        {character.avatar}
      </div>

      {/* Name */}
      <div className="text-center">
        <p
          className="font-bold text-white text-sm truncate"
          style={{ color: character.color }}
        >
          {character.name}
        </p>
        <p className="text-gray-400 text-xs">{character.nameJp} {character.age}歳</p>
      </div>

      {/* Occupation */}
      {size !== "sm" && (
        <p className="text-center text-xs mt-1 text-gray-400 italic">
          {revealOccupation || character.isInParadise
            ? character.occupation
            : character.occupationHint}
        </p>
      )}

      {/* Top matches */}
      {size === "lg" && (
        <div className="mt-2 space-y-1">
          {topMatches.map(({ char, val }) => (
            <div key={char.id} className="flex items-center justify-between">
              <span className="text-xs text-gray-400 truncate max-w-[70px]">
                {char.name}
              </span>
              <span className="text-xs">
                {getAffinityEmoji(val)} {val}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Status dot */}
      <div className="absolute bottom-2 left-2">
        <div
          className={`w-2 h-2 rounded-full ${
            character.isInParadise
              ? "bg-yellow-400 animate-pulse"
              : character.isEliminated
              ? "bg-gray-600"
              : "bg-green-400 animate-pulse"
          }`}
        />
      </div>
    </div>
  );
}
