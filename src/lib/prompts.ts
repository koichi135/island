import type { Character, GameEvent, AffinityChange } from "../types";
import { getAffinityKey } from "../data/characters";

function formatAffinities(
  characters: Character[],
  affinities: Record<string, number>
): string {
  const lines: string[] = [];
  const males = characters.filter((c) => c.gender === "male" && !c.isEliminated);
  const females = characters.filter((c) => c.gender === "female" && !c.isEliminated);

  for (const m of males) {
    for (const f of females) {
      const key = getAffinityKey(m.id, f.id);
      const val = affinities[key] ?? 0;
      lines.push(
        `${m.name} → ${f.name}: ${val}/100 (${affinityDesc(val)})`
      );
    }
  }
  return lines.join("\n");
}

function affinityDesc(val: number): string {
  if (val >= 80) return "深く惹かれている";
  if (val >= 60) return "気になっている";
  if (val >= 40) return "意識している";
  if (val >= 20) return "少し興味あり";
  return "ほぼ無関心";
}

function formatRecentEvents(events: GameEvent[]): string {
  if (events.length === 0) return "まだイベントなし";
  return events
    .slice(-4)
    .map((e) => `[${e.title}] ${e.narrative.slice(0, 100)}...`)
    .join("\n");
}

export function buildEventPrompt(params: {
  day: number;
  timeOfDay: string;
  characters: Character[];
  affinities: Record<string, number>;
  recentEvents: GameEvent[];
  paradisePairs: string[][];
}): string {
  const { day, timeOfDay, characters, affinities, recentEvents, paradisePairs } = params;
  const active = characters.filter((c) => !c.isEliminated && !c.isInParadise);
  const inParadise = characters.filter((c) => c.isInParadise);

  const timeLabel =
    timeOfDay === "morning"
      ? "朝"
      : timeOfDay === "afternoon"
      ? "午後"
      : "夜";

  const paradiseSummary =
    paradisePairs.length > 0
      ? paradisePairs
          .map((pair) => {
            const names = pair.map(
              (id) => characters.find((c) => c.id === id)?.name ?? id
            );
            return `${names.join(" & ")}`;
          })
          .join(", ")
      : "なし";

  return `あなたはリアリティ恋愛バラエティ番組「AI Island インフェルノ」のシナリオライターです。
Single Infernoのような緊迫感とドラマ性を演出してください。

=== 番組設定 ===
舞台: 無人島「インフェルノ」（過酷な環境）とリゾート「パラダイス」（豪華な環境）
日本語で会話します。職業は「パラダイス」に行くまで秘密です。
現在: ${day}日目の${timeLabel}

=== 参加者プロフィール ===
${active
  .map(
    (c) =>
      `【${c.name}（${c.nameJp}）${c.age}歳・${c.gender === "male" ? "男性" : "女性"}】
  性格: ${c.personality}
  仕事のヒント（インフェルノでは): ${c.occupationHint}
  恋愛スタイル: ${c.datingStyle}
  趣味: ${c.interests.join("、")}`
  )
  .join("\n\n")}

=== 現在の好感度（0-100）===
${formatAffinities(characters, affinities)}

=== これまでのパラダイス経験 ===
${paradiseSummary}

=== 直近のイベント ===
${formatRecentEvents(recentEvents)}

=== 指示 ===
${day}日目${timeLabel}にふさわしいドラマチックなイベントを1つ生成してください。

必ず以下のJSONフォーマットのみで回答してください（他のテキストは不要）:
{
  "title": "イベントタイトル（10文字以内）",
  "eventType": "conversation | group_activity | confession | paradise_invite | jealousy | drama",
  "location": "inferno",
  "participants": ["キャラクターIDの配列、2〜4人"],
  "narrative": "イベントの状況説明（100〜200文字）",
  "dialogue": [
    {"characterId": "ID", "text": "セリフ", "emotion": "happy|sad|nervous|flirty|angry|shocked|default"}
  ],
  "innerThoughts": [
    {"characterId": "ID", "thought": "本心（視聴者だけが知る内心）"}
  ],
  "affinityChanges": [
    {"fromId": "男性ID", "toId": "女性ID", "change": 数値(-15〜+25), "reason": "理由"}
  ],
  "paradiseInvite": null
}

eventTypeが "paradise_invite" の場合のみ paradiseInvite を設定:
{
  "inviterId": "誘う人のID",
  "inviteeId": "誘われる人のID",
  "accepted": true/false,
  "inviterMessage": "誘いの言葉",
  "inviteeResponse": "返答"
}

重要:
- participants には必ず実在するキャラクターIDを使用
- 好感度が高いペアは積極的に絡ませる
- 嫉妬、三角関係、予想外の展開を入れてドラマ性を高める
- セリフは自然で感情豊かに
- affinityChanges の fromId/toId は男性→女性 or 女性→男性のペアのみ`;
}

export function buildParadiseDatePrompt(params: {
  inviter: Character;
  invitee: Character;
  affinityVal: number;
  paradisePairs: string[][];
}): string {
  const { inviter, invitee, affinityVal } = params;
  return `あなたはリアリティ恋愛バラエティ番組のシナリオライターです。

「パラダイス」デートシーンを生成してください。
パラダイスでは職業を明かすことができ、二人だけの特別な時間を過ごします。

【${inviter.name}】${inviter.age}歳
職業: ${inviter.occupation}
性格: ${inviter.personality}

【${invitee.name}】${invitee.age}歳
職業: ${invitee.occupation}
性格: ${invitee.personality}

現在の好感度: ${affinityVal}/100

以下のJSONフォーマットのみで回答してください:
{
  "title": "パラダイスデート",
  "eventType": "paradise_date",
  "location": "paradise",
  "participants": ["${inviter.id}", "${invitee.id}"],
  "narrative": "パラダイスでの二人の様子（100〜200文字、職業を明かすシーン含む）",
  "dialogue": [
    {"characterId": "ID", "text": "セリフ（職業を明かすシーンを含む）", "emotion": "happy|flirty|nervous|default"}
  ],
  "innerThoughts": [
    {"characterId": "${inviter.id}", "thought": "内心"},
    {"characterId": "${invitee.id}", "thought": "内心"}
  ],
  "affinityChanges": [
    {"fromId": "男性ID", "toId": "女性ID", "change": 数値(10〜25), "reason": "パラダイスで距離が縮まった"}
  ]
}`;
}

export function buildCeremonyPrompt(params: {
  characters: Character[];
  affinities: Record<string, number>;
  paradisePairs: string[][];
  events: GameEvent[];
}): string {
  const { characters, affinities, paradisePairs, events } = params;
  const active = characters.filter((c) => !c.isEliminated);

  return `あなたはリアリティ恋愛バラエティ番組「AI Island インフェルノ」の最終カップリングセレモニーのシナリオライターです。

=== 参加者 ===
${active.map((c) => `${c.name}（${c.gender === "male" ? "男" : "女"}）`).join("、")}

=== 最終好感度 ===
${formatAffinities(characters, affinities)}

=== パラダイス経験 ===
${
  paradisePairs.length > 0
    ? paradisePairs
        .map((pair) =>
          pair.map((id) => characters.find((c) => c.id === id)?.name ?? id).join(" & ")
        )
        .join(", ")
    : "なし"
}

=== 番組ハイライト ===
${events.slice(-6).map((e) => e.title).join("、")}

最終カップリングセレモニーのシーンを生成してください。
高い好感度のペアが結ばれるように設定してください。

以下のJSONフォーマットのみで回答してください:
{
  "narrative": "セレモニーの状況説明（150〜250文字）",
  "dialogue": [
    {"characterId": "ID", "text": "感動的なセリフ", "emotion": "happy|sad|nervous|default"}
  ],
  "couples": [
    {"person1Id": "男性ID", "person2Id": "女性ID"}
  ],
  "uncoupled": ["カップルになれなかったキャラクターIDの配列"]
}

カップルは好感度60以上のペアから選んでください。
カップルになれなかった人は uncoupled に入れてください。`;
}
