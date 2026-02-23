"use client";

import type { Character } from "../types";
import { getAffinityKey, getAffinityLabel } from "../data/characters";

interface RelationshipMatrixProps {
  characters: Character[];
  affinities: Record<string, number>;
}

function getAffinityColor(value: number): string {
  if (value >= 80) return "rgba(255, 100, 100, 0.8)";
  if (value >= 60) return "rgba(255, 170, 50, 0.7)";
  if (value >= 40) return "rgba(100, 200, 100, 0.6)";
  if (value >= 20) return "rgba(100, 150, 255, 0.5)";
  return "rgba(100, 100, 100, 0.3)";
}

function getAffinityTextColor(value: number): string {
  if (value >= 60) return "#fff";
  if (value >= 30) return "#ddd";
  return "#888";
}

export default function RelationshipMatrix({
  characters,
  affinities,
}: RelationshipMatrixProps) {
  const males = characters.filter(
    (c) => c.gender === "male" && !c.isEliminated
  );
  const females = characters.filter(
    (c) => c.gender === "female" && !c.isEliminated
  );

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-1">
        ❤️ 好感度マトリックス
      </h3>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-1 text-gray-500 text-left w-16"></th>
              {females.map((f) => (
                <th
                  key={f.id}
                  className="p-1 text-center"
                  style={{ color: f.color }}
                >
                  <div className="text-lg">{f.avatar}</div>
                  <div className="text-xs font-bold">{f.name}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {males.map((m) => (
              <tr key={m.id}>
                <td className="p-1">
                  <div style={{ color: m.color }}>
                    <div className="text-lg">{m.avatar}</div>
                    <div className="text-xs font-bold">{m.name}</div>
                  </div>
                </td>
                {females.map((f) => {
                  const key = getAffinityKey(m.id, f.id);
                  const val = affinities[key] ?? 0;
                  return (
                    <td key={f.id} className="p-1">
                      <div
                        className="rounded-lg p-2 text-center transition-all duration-500 group relative cursor-default"
                        style={{
                          background: getAffinityColor(val),
                          color: getAffinityTextColor(val),
                        }}
                      >
                        <div className="font-bold text-sm">{val}</div>
                        {/* Tooltip */}
                        <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black border border-white/20 rounded-lg px-2 py-1 text-xs whitespace-nowrap z-10">
                          {m.name} → {f.name}: {getAffinityLabel(val)}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-1">
          {[
            { range: "80+", color: "rgba(255,100,100,0.8)", label: "深く惹かれ" },
            { range: "60+", color: "rgba(255,170,50,0.7)", label: "気になる" },
            { range: "40+", color: "rgba(100,200,100,0.6)", label: "意識中" },
            { range: "20+", color: "rgba(100,150,255,0.5)", label: "様子見" },
          ].map((item) => (
            <div key={item.range} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded"
                style={{ background: item.color }}
              />
              <span className="text-gray-500 text-xs">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
