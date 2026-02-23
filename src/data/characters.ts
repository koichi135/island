import type { Character } from "../types";

export const INITIAL_CHARACTERS: Character[] = [
  // --- MALES ---
  {
    id: "kenji",
    name: "Kenji",
    nameJp: "健二",
    age: 28,
    occupation: "建築家",
    occupationHint: "何かをデザインする仕事",
    personality:
      "冷静で自信満々だが、内側に深いロマンチストを隠している。計算高く見えるが、本当に好きな人の前では意外と不器用になる。",
    background:
      "都内の有名設計事務所で働くエリート。仕事一筋で恋愛を後回しにしてきたが、最近「このままでいいのか」と感じ始めた。",
    interests: ["建築", "ジャズ", "アート", "ランニング"],
    datingStyle:
      "慎重に相手を観察する。好意を持ったらじっくりアプローチ。軽い関係を好まない。",
    avatar: "🧑‍💼",
    gender: "male",
    color: "#6366f1",
    isInParadise: false,
    isEliminated: false,
  },
  {
    id: "ryu",
    name: "Ryu",
    nameJp: "龍",
    age: 26,
    occupation: "ミュージシャン",
    occupationHint: "クリエイティブな仕事",
    personality:
      "情熱的で感受性が高く、気持ちをストレートに表現する。衝動的で正直すぎるほど正直。好きになったら一直線だが、嫉妬深い面もある。",
    background:
      "インディーズバンドのギタリスト。最近メジャーデビューが決まりかけている。自由奔放に生きてきたが、誰かと深く繋がりたいと思い始めた。",
    interests: ["音楽", "ライブ", "映画", "自転車"],
    datingStyle:
      "一目惚れタイプ。感情を隠せず、好きな人にはすぐ行動に出る。",
    avatar: "🎸",
    gender: "male",
    color: "#f59e0b",
    isInParadise: false,
    isEliminated: false,
  },
  {
    id: "takeshi",
    name: "Takeshi",
    nameJp: "剛",
    age: 31,
    occupation: "外科医",
    occupationHint: "人を助ける専門的な仕事",
    personality:
      "穏やかで知的、言葉は少ないが行動で示す。周囲をよく観察し、誰よりも相手の気持ちを理解しようとする。安定した強さを持つ。",
    background:
      "大学病院の外科医。忙しい仕事の中でも自分の時間を大切にする。真剣な出会いを求めてここに来た。",
    interests: ["料理", "登山", "読書", "ヨガ"],
    datingStyle:
      "焦らず相手のペースに合わせる。信頼関係を築くことを最優先にする。",
    avatar: "🩺",
    gender: "male",
    color: "#10b981",
    isInParadise: false,
    isEliminated: false,
  },
  // --- FEMALES ---
  {
    id: "yuki",
    name: "Yuki",
    nameJp: "雪",
    age: 24,
    occupation: "ファッションデザイナー",
    occupationHint: "見た目やスタイルに関わる仕事",
    personality:
      "明るくエネルギッシュ、負けず嫌い。表面はサバサバしているが、恋愛では意外と繊細でガラスのハートを持つ。競争心が強い。",
    background:
      "新進気鋭のデザイナー。自分ブランドを立ち上げたばかり。仕事も恋愛も全力投球がモットー。",
    interests: ["ファッション", "ショッピング", "ダンス", "SNS"],
    datingStyle:
      "気になった人には積極的。でも本命には逆にツンデレになってしまう。",
    avatar: "👗",
    gender: "female",
    color: "#ec4899",
    isInParadise: false,
    isEliminated: false,
  },
  {
    id: "hana",
    name: "Hana",
    nameJp: "花",
    age: 27,
    occupation: "弁護士",
    occupationHint: "論理的で専門的な仕事",
    personality:
      "クールで知的、ミステリアスな雰囲気を持つ。感情を表に出さないが、内心では誰よりも熱く燃えている。プライドが高く、簡単には心を開かない。",
    background:
      "大手法律事務所のエリート弁護士。仕事では完璧主義者だが、恋愛では自分でもびっくりするくらい不器用になる。",
    interests: ["読書", "ワイン", "アート鑑賞", "ジム"],
    datingStyle:
      "受け身に見えるが実は相手を慎重に選んでいる。一度心を開いたら深く愛する。",
    avatar: "⚖️",
    gender: "female",
    color: "#8b5cf6",
    isInParadise: false,
    isEliminated: false,
  },
  {
    id: "mia",
    name: "Mia",
    nameJp: "美亜",
    age: 25,
    occupation: "シェフ",
    occupationHint: "人を喜ばせることが好きな仕事",
    personality:
      "温かく親しみやすい雰囲気で誰とでも仲良くなれる。一見天然だが実は空気を読むのが上手く、巧みに場を操れる策士な面も持つ。",
    background:
      "フレンチレストランのシェフ。料理で人を幸せにすることが生きがい。外見とは裏腹に芯が強く、好きな人のためなら行動力を発揮する。",
    interests: ["料理", "カフェ巡り", "映画", "ガーデニング"],
    datingStyle:
      "料理でハートをつかむ。相手に安心感を与えるのが得意。競争より共感を大切にする。",
    avatar: "👩‍🍳",
    gender: "female",
    color: "#f97316",
    isInParadise: false,
    isEliminated: false,
  },
];

export const MALES = INITIAL_CHARACTERS.filter((c) => c.gender === "male");
export const FEMALES = INITIAL_CHARACTERS.filter((c) => c.gender === "female");

export function getCharacterById(
  characters: Character[],
  id: string
): Character | undefined {
  return characters.find((c) => c.id === id);
}

export function getAffinityKey(id1: string, id2: string): string {
  return [id1, id2].sort().join("|");
}

export function getAffinity(
  affinities: Record<string, number>,
  id1: string,
  id2: string
): number {
  return affinities[getAffinityKey(id1, id2)] ?? 0;
}

export function buildInitialAffinities(): Record<string, number> {
  const affinities: Record<string, number> = {};
  const males = INITIAL_CHARACTERS.filter((c) => c.gender === "male");
  const females = INITIAL_CHARACTERS.filter((c) => c.gender === "female");

  for (const m of males) {
    for (const f of females) {
      const key = getAffinityKey(m.id, f.id);
      // Start with a small random base affinity (0-20)
      affinities[key] = Math.floor(Math.random() * 20);
    }
  }
  return affinities;
}

export function getAffinityLabel(value: number): string {
  if (value >= 80) return "深く惹かれている";
  if (value >= 60) return "気になっている";
  if (value >= 40) return "興味あり";
  if (value >= 20) return "意識している";
  return "まだ様子見";
}

export function getAffinityEmoji(value: number): string {
  if (value >= 80) return "💕";
  if (value >= 60) return "😍";
  if (value >= 40) return "🙂";
  if (value >= 20) return "👀";
  return "😐";
}
