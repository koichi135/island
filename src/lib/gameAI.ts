/**
 * gameAI.ts
 * ルールベース + テンプレートによるゲームAI
 * Claude APIの代わりにオフラインで動作するCPU対戦AIです。
 */

import type {
  Character,
  EventType,
  DialogueLine,
  InnerThought,
  AffinityChange,
  ParadiseInvite,
  GenerateEventRequest,
  GenerateEventResponse,
  GenerateCeremonyRequest,
  GenerateCeremonyResponse,
  FinalCouple,
} from "../types";
import { getAffinityKey } from "../data/characters";

// ─── Utilities ─────────────────────────────────────────────────────────────────

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randN<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length));
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getAff(affinities: Record<string, number>, id1: string, id2: string): number {
  return affinities[getAffinityKey(id1, id2)] ?? 0;
}

// ─── Event type selector ────────────────────────────────────────────────────────

function selectEventType(
  day: number,
  timeOfDay: string,
  maxAffinity: number,
  paradisePairCount: number,
  eventTypes: EventType[]
): EventType {
  // Day 1 morning: always conversation/group
  if (day === 1 && timeOfDay === "morning") {
    return rand(["conversation", "group_activity"] as EventType[]);
  }

  // Paradise invite: day2+, afternoon/evening, high affinity, limited slots
  if (
    day >= 2 &&
    timeOfDay !== "morning" &&
    maxAffinity >= 62 &&
    paradisePairCount < 2 &&
    Math.random() < 0.3
  ) {
    return "paradise_invite";
  }

  // Confession: day2+, high affinity
  if (day >= 2 && maxAffinity >= 70 && Math.random() < 0.2) {
    return "confession";
  }

  // Later game: more drama
  if (day === 3) {
    const roll = Math.random();
    if (roll < 0.25) return "jealousy";
    if (roll < 0.4) return "drama";
    if (roll < 0.65) return "conversation";
    return "group_activity";
  }

  if (day === 2) {
    const roll = Math.random();
    if (roll < 0.2) return "jealousy";
    if (roll < 0.35) return "drama";
    if (roll < 0.65) return "conversation";
    return "group_activity";
  }

  // Day 1
  return Math.random() < 0.6 ? "conversation" : "group_activity";
}

// ─── Participant selector ────────────────────────────────────────────────────────

interface Participants {
  ids: string[];
  mainMaleId: string | null;
  mainFemaleId: string | null;
}

function selectParticipants(
  eventType: EventType,
  males: Character[],
  females: Character[],
  affinities: Record<string, number>,
  allActive: Character[]
): Participants {
  // Sort all male-female pairs by affinity
  const pairs: { m: Character; f: Character; val: number }[] = [];
  for (const m of males) {
    for (const f of females) {
      pairs.push({ m, f, val: getAff(affinities, m.id, f.id) });
    }
  }
  pairs.sort((a, b) => b.val - a.val);

  if (eventType === "conversation" || eventType === "confession" || eventType === "paradise_invite") {
    // Pick top pair (with some randomness)
    const topN = Math.min(3, pairs.length);
    const chosen = pairs[randInt(0, topN - 1)];
    if (!chosen) return fallbackParticipants(allActive);
    return {
      ids: [chosen.m.id, chosen.f.id],
      mainMaleId: chosen.m.id,
      mainFemaleId: chosen.f.id,
    };
  }

  if (eventType === "jealousy") {
    // Top pair + a jealous third character
    if (pairs.length === 0) return fallbackParticipants(allActive);
    const top = pairs[0];
    // Find third character from opposite gender of the jealous situation
    const third =
      randN(males.filter((m) => m.id !== top.m.id), 1)[0] ??
      randN(females.filter((f) => f.id !== top.f.id), 1)[0];
    const ids = third ? [top.m.id, top.f.id, third.id] : [top.m.id, top.f.id];
    return { ids, mainMaleId: top.m.id, mainFemaleId: top.f.id };
  }

  if (eventType === "group_activity" || eventType === "drama") {
    // 3-4 characters mixed
    const count = randInt(3, Math.min(4, allActive.length));
    const chosen = randN(allActive, count);
    const mInChosen = chosen.filter((c) => c.gender === "male");
    const fInChosen = chosen.filter((c) => c.gender === "female");
    const pair = pairs[0];
    return {
      ids: chosen.map((c) => c.id),
      mainMaleId: mInChosen[0]?.id ?? pair?.m.id ?? null,
      mainFemaleId: fInChosen[0]?.id ?? pair?.f.id ?? null,
    };
  }

  return fallbackParticipants(allActive);
}

function fallbackParticipants(active: Character[]): Participants {
  const m = active.find((c) => c.gender === "male");
  const f = active.find((c) => c.gender === "female");
  return {
    ids: [m?.id, f?.id].filter(Boolean) as string[],
    mainMaleId: m?.id ?? null,
    mainFemaleId: f?.id ?? null,
  };
}

// ─── Character-specific dialogue ────────────────────────────────────────────────

type Emotion = "happy" | "sad" | "nervous" | "flirty" | "angry" | "shocked" | "default";

interface CharLine {
  text: string;
  emotion: Emotion;
}

const CHAR_LINES: Record<string, Record<string, CharLine[] | string[]>> = {
  kenji: {
    conversation_open: [
      { text: "…ここは想像以上に過酷な場所だな。", emotion: "default" },
      { text: "どんな仕事をしてるんだ？直接は聞けないけど。", emotion: "default" },
      { text: "君はここにいる他の人と、どこか違う気がする。", emotion: "flirty" },
      { text: "正直に言うと、君のことが少し気になってた。", emotion: "nervous" },
    ],
    conversation_response: [
      { text: "そうか…なかなか面白い考え方だな。", emotion: "happy" },
      { text: "俺も同じようなことを考えてた。", emotion: "happy" },
      { text: "…意外と、話が合うな。", emotion: "flirty" },
    ],
    confession: [
      { text: "計算外だった。こんなに誰かを意識するとは思ってなかった。", emotion: "nervous" },
      { text: "ここを離れた後も、君のことを考えてる自分がいる。", emotion: "flirty" },
    ],
    paradise_invite: [
      { text: "もし良ければ、二人で過ごす時間を作れないか。", emotion: "nervous" },
      { text: "一対一で、ゆっくり話したいと思ってる。", emotion: "flirty" },
    ],
    jealousy: [
      { text: "…あいつと何を話してたんだ？", emotion: "angry" },
      { text: "俺は、気にしてないつもりだったんだが。", emotion: "sad" },
    ],
    paradise_date: [
      { text: "実は…建築の仕事をしてる。人々が暮らす空間をデザインするのが好きで。", emotion: "nervous" },
      { text: "君といると、こんなに素直になれる自分が不思議だ。", emotion: "happy" },
    ],
    thought_positive: [
      "なぜこんなに気になるんだ…計算外だ。",
      "普段こんな気持ちにはならないのに。",
      "君のそばにいると、自然体でいられる。不思議だ。",
    ],
    thought_negative: [
      "焦るのは俺らしくない。もう少し様子を見よう。",
      "まだ相手のことを理解しきれていない。",
    ],
  },
  ryu: {
    conversation_open: [
      { text: "ねえ、ちょっと聞いていい？正直、君のこと気になって仕方ないんだよ。", emotion: "flirty" },
      { text: "音楽みたいに、君も俺の中で響いてくる気がするんだよね。", emotion: "flirty" },
      { text: "なんか…ここにいる全員の中で、君だけ目に入るんだよね。", emotion: "nervous" },
      { text: "直接言うのが好きなんだ。君のこと、すごく気になってる。", emotion: "happy" },
    ],
    conversation_response: [
      { text: "え、マジで？俺もそう思ってた！", emotion: "happy" },
      { text: "そういうとこ、かわいいと思う。", emotion: "flirty" },
      { text: "正直すぎて引いてる？ごめん、でもこれが俺だから。", emotion: "nervous" },
    ],
    confession: [
      { text: "好きになった。はっきり言う。付き合いたいかはまだわからないけど、それくらい気になってる。", emotion: "happy" },
      { text: "嫉妬してるって自覚はある。でも止められない。", emotion: "angry" },
    ],
    paradise_invite: [
      { text: "二人きりになりたい。来てくれる？", emotion: "flirty" },
      { text: "パラダイスに一緒に行こう。今すぐ決めたい。", emotion: "happy" },
    ],
    jealousy: [
      { text: "あいつと仲良さそうにしてるの、全然見たくなかった。", emotion: "angry" },
      { text: "嫉妬だよ、完全に。認める。", emotion: "sad" },
    ],
    paradise_date: [
      { text: "俺、ミュージシャンやってるんだ。もうすぐメジャーデビューする予定で。", emotion: "happy" },
      { text: "君のために曲を書いてみたいって思ってる。本気で。", emotion: "flirty" },
    ],
    thought_positive: [
      "やばい、こんなに好きになるとは思わなかった。",
      "彼女のそばにいると自然体でいられる。",
      "このまま気持ちを伝えたい。でも怖い。",
    ],
    thought_negative: [
      "落ち着けよ俺。焦りすぎだ。",
      "なんで俺ばかりこんなに消耗してるんだ。",
    ],
  },
  takeshi: {
    conversation_open: [
      { text: "少し疲れてないか？顔色が気になった。", emotion: "default" },
      { text: "君が笑うと、周りが明るくなる気がする。", emotion: "happy" },
      { text: "ゆっくり話せて良かった。急がなくていいと思ってるから。", emotion: "default" },
      { text: "大事なのは相手のペースを大切にすることだと思ってる。", emotion: "default" },
    ],
    conversation_response: [
      { text: "そうだな。俺もそう思う。", emotion: "happy" },
      { text: "君の言う通りだ。ありがとう。", emotion: "happy" },
      { text: "…そんなふうに考えたことはなかった。教えてくれてよかった。", emotion: "nervous" },
    ],
    confession: [
      { text: "言葉より行動で示したいと思ってきたけど、今は言わなきゃと思ってる。君が気になってる。", emotion: "nervous" },
      { text: "急がせるつもりはない。ただ、伝えたかった。", emotion: "default" },
    ],
    paradise_invite: [
      { text: "良ければ、二人でゆっくり話せる場所に行かないか。", emotion: "nervous" },
      { text: "パラダイスに来てほしい。急がなくていい。", emotion: "default" },
    ],
    jealousy: [
      { text: "…何でもない。ただ、少し気になっただけだ。", emotion: "sad" },
      { text: "彼女には、彼女のペースがある。わかってる。", emotion: "sad" },
    ],
    paradise_date: [
      { text: "外科医をしてる。命に関わる仕事だから、真剣にやってる。", emotion: "nervous" },
      { text: "君といると、仕事を忘れてしまう。これは…珍しいことだ。", emotion: "happy" },
    ],
    thought_positive: [
      "この人ともっと話したい。",
      "言葉にするより、そばにいることの方が大切なのかもしれない。",
      "彼女のことを、ゆっくり知っていきたい。",
    ],
    thought_negative: [
      "焦りは禁物だ。信頼関係が先だ。",
      "もう少し時間をかけよう。",
    ],
  },
  yuki: {
    conversation_open: [
      { text: "えっ、負けたくないんだけど！なんか悔しい！", emotion: "angry" },
      { text: "なんかあなたのそういうとこ、ちょっとズルいですよ？", emotion: "flirty" },
      { text: "普通に話せたね。ちょっと意外かも。", emotion: "happy" },
      { text: "絶対諦めないから、これだけは言っておきますね！", emotion: "happy" },
    ],
    conversation_response: [
      { text: "え？本当に？うれしい…あ、でも顔に出てたかな。", emotion: "nervous" },
      { text: "そんなこと言う人、初めてかも。", emotion: "flirty" },
      { text: "ちょっと待って、なんで心拍数上がってるの私。", emotion: "nervous" },
    ],
    confession: [
      { text: "負けを認めるのは嫌いだけど…好きになってる。あなたのこと。", emotion: "nervous" },
      { text: "本命に対してはツンデレになるって言われるけど、今まさにそれかも。", emotion: "flirty" },
    ],
    paradise_invite: [
      { text: "行っていい？パラダイス。あなたと一緒に！", emotion: "happy" },
      { text: "誘ってくれるなら絶対行く！待ってたんだから！", emotion: "happy" },
    ],
    jealousy: [
      { text: "ちょっと！なんで他の子と仲良くしてるんですか！", emotion: "angry" },
      { text: "別に気にしてないですけど……全然気にしてます。", emotion: "sad" },
    ],
    paradise_date: [
      { text: "ファッションデザイナーやってます！自分のブランドを立ち上げたばかりで。", emotion: "happy" },
      { text: "デザインって、見た目だけじゃなくて気持ちを形にすることだと思ってる。", emotion: "happy" },
    ],
    thought_positive: [
      "なんで緊張してるんだろ…全然こんなはずじゃなかった。",
      "勝ちたいのに、負けてもいいかなって思い始めてる自分がいる。",
      "あの人の前だと、なんか素直になれる。",
    ],
    thought_negative: [
      "プライド邪魔してる。わかってるけど止められない。",
      "競争は得意なのに、恋愛だと途端に弱くなる。",
    ],
  },
  hana: {
    conversation_open: [
      { text: "…そう。あなたは意外と、観察眼があるのね。", emotion: "default" },
      { text: "私が心を開くまで待てる人？簡単じゃないわよ。", emotion: "default" },
      { text: "あなたには、何か惹かれるものを感じる。珍しいことよ。", emotion: "flirty" },
      { text: "答えは、もう少し待って。", emotion: "default" },
    ],
    conversation_response: [
      { text: "…ふふ。予想外の返しね。", emotion: "happy" },
      { text: "そういう人、嫌いじゃないわ。", emotion: "flirty" },
      { text: "少し、あなたに興味が出てきた。", emotion: "happy" },
    ],
    confession: [
      { text: "こんなに早く人を好きになるとは思ってなかった。少し怖いくらい。", emotion: "nervous" },
      { text: "普段は絶対言わないんだけど…気になってる。あなたのことが。", emotion: "nervous" },
    ],
    paradise_invite: [
      { text: "…パラダイス、一緒に行ってもいいわよ。", emotion: "default" },
      { text: "行きましょう。あなたともっと話したいから。", emotion: "happy" },
    ],
    jealousy: [
      { text: "…別に、構わないけれど。", emotion: "sad" },
      { text: "こんな感情、自分でも珍しい。少し、妬いてるかもしれない。", emotion: "angry" },
    ],
    paradise_date: [
      { text: "弁護士よ。人の権利を守る仕事。やりがいはあるけど、孤独なこともある。", emotion: "default" },
      { text: "あなたといると…ガードが下がる気がする。怖いような、嬉しいような。", emotion: "nervous" },
    ],
    thought_positive: [
      "珍しい。こんなに話したいと思う人は久しぶりだ。",
      "ガードを下げたくない。でも…下げてもいいかもしれない。",
      "この人は信頼できる気がする。根拠はないけれど。",
    ],
    thought_negative: [
      "プライドが邪魔をしてる。わかってる。",
      "ペースを乱されてる。これは想定外。",
    ],
  },
  mia: {
    conversation_open: [
      { text: "あ〜もう！かわいいこと言わないでください！照れます！", emotion: "happy" },
      { text: "料理の話してもいいですか？美味しいもので人って繋がれると思うんですよね。", emotion: "happy" },
      { text: "なんかお腹空きました。一緒に何か食べられたらいいのに。", emotion: "happy" },
      { text: "あなたって、見た目よりずっと面白い人ですよ。", emotion: "flirty" },
    ],
    conversation_response: [
      { text: "えっ、本当ですか！？うれしい〜！", emotion: "happy" },
      { text: "私もそう思ってました。なんか嬉しいな。", emotion: "happy" },
      { text: "ふふ、あなたってそういうとこありますよね。好きですよそういうの。", emotion: "flirty" },
    ],
    confession: [
      { text: "本当は…ずっと気になってたんです。でも言えなくて。", emotion: "nervous" },
      { text: "あなたのそばにいると自然に笑顔になれる。それって、大事なことだと思う。", emotion: "happy" },
    ],
    paradise_invite: [
      { text: "え、誘ってくれるんですか！？行きたいです、絶対！", emotion: "happy" },
      { text: "パラダイスで一緒に過ごせるなんて…やった！", emotion: "happy" },
    ],
    jealousy: [
      { text: "ん〜…別に全然気にしてないですよ？（気にしてます）", emotion: "sad" },
      { text: "あの二人、仲いいですね。…なんか複雑だな。", emotion: "sad" },
    ],
    paradise_date: [
      { text: "シェフなんです！フレンチレストランで働いてて。料理で人を幸せにしたいと思ってる。", emotion: "happy" },
      { text: "いつかあなたに、私の料理を食べてもらいたいな。絶対喜んでもらえる自信ある！", emotion: "flirty" },
    ],
    thought_positive: [
      "ふふ、思ったより落ちてくれそう。作戦通り…ではなく、本当に好きかも。",
      "この人のそばにいると、自然と笑顔になれる。",
      "かわいいな〜。なんで隠してるんだろ、この人。",
    ],
    thought_negative: [
      "あんまり素直に出しすぎたかな。少し引かれたかも。",
      "距離感、間違えたかも。でも後悔はしてない。",
    ],
  },
};

function getLine(charId: string, key: string): CharLine {
  const entries = CHAR_LINES[charId]?.[key];
  if (!entries || entries.length === 0) return { text: "…。", emotion: "default" };
  const item = entries[Math.floor(Math.random() * entries.length)];
  if (typeof item === "string") return { text: item, emotion: "default" };
  return item as CharLine;
}

function getThought(charId: string, positive: boolean): string {
  const key = positive ? "thought_positive" : "thought_negative";
  const entries = CHAR_LINES[charId]?.[key];
  if (!entries || entries.length === 0) return positive ? "なんか、いい感じかも。" : "難しいな…。";
  const item = entries[Math.floor(Math.random() * entries.length)];
  return typeof item === "string" ? item : (item as CharLine).text;
}

// ─── Narrative templates ─────────────────────────────────────────────────────────

const NARRATIVES: Record<EventType, ((m: string, f: string, day: number, time: string) => string)[]> = {
  conversation: [
    (m, f) => `${m}と${f}は浜辺を歩きながら、互いのことを話し始めた。波の音が二人の会話を包み込む。`,
    (m, f) => `日差しが和らいだ頃、${m}は${f}に声をかけた。意外にも話は弾み、気づけば長い時間が経っていた。`,
    (m, f) => `${f}が一人でいるところに、${m}が近づいた。初めはぎこちなかったが、次第に打ち解けていった。`,
    (m, f, _, time) => `${time}の静かな時間、${m}と${f}はキャンプファイアのそばで向かい合い、深い話をした。`,
    (m, f) => `${m}が${f}の趣味を尋ねたことをきっかけに、二人の距離は少しずつ縮まっていった。`,
  ],
  group_activity: [
    (_, __, day) => `DAY${day}の活動として、全員でビーチバレーをすることになった。チーム戦は予想外の盛り上がりを見せた。`,
    (_, __, day) => `DAY${day}、参加者たちは一緒に食事の準備をすることになった。得意分野が違う者同士の共同作業は、笑いと驚きに溢れた。`,
    (_, __, day) => `海岸沿いの探索ツアーが急遽企画された。険しい道でも、誰かが誰かを助ける場面が自然と生まれた。`,
    (_, __, day) => `DAY${day}の夜、全員でキャンプファイアを囲んだ。炎を囲む中、本音が少しずつ零れ出した。`,
    (_, __, day) => `DAY${day}、サバイバルスキルを競うゲームが行われた。意外な一面が次々と露わになった。`,
  ],
  confession: [
    (m, f) => `夕暮れ時、${m}は意を決して${f}に声をかけた。誰もいない場所で、${m}は正直な気持ちを伝え始めた。`,
    (m, f) => `${m}は今まで堪えていた気持ちを、${f}に打ち明けることにした。島に来て初めて感じる、本物の緊張だった。`,
    (m, f) => `二人きりになった瞬間、${m}は${f}に向き直った。「ちゃんと伝えなければ」と思っていたことを、ついに口にする時が来た。`,
  ],
  paradise_invite: [
    (m, f) => `${m}は${f}に近づき、囁くように声をかけた。パラダイスへの招待——その言葉に、${f}の表情が変わった。`,
    (m, f) => `誰かに見られないよう、${m}は${f}をそっと呼んだ。二人だけの時間を過ごしたい、という真剣な眼差しだった。`,
    (m, f) => `${m}は${f}に歩み寄り、静かに手を差し伸べた。「一緒にパラダイスへ行かないか」——その言葉は、島中に響き渡った。`,
  ],
  paradise_date: [
    (m, f) => `パラダイスに到着した${m}と${f}。豪華な施設と美しい景色の中、二人はここで初めて素の自分を見せ合った。`,
    (m, f) => `星空の下、${m}と${f}は向かい合い、秘めていた職業をついに明かした。驚きと共に、距離が一気に縮まった。`,
    (m, f) => `インフェルノの喧騒から離れ、${m}と${f}だけの特別な時間が始まった。ここでは仮面を外して話せる気がした。`,
  ],
  jealousy: [
    (m, f) => `${m}と${f}が楽しそうに話しているのを、遠くから見ていた人物がいた。胸に広がる感情に、自分でも戸惑っていた。`,
    (m, f) => `${f}が${m}以外の誰かと話し込んでいるのを見て、${m}の表情が僅かに曇った。嫉妬、と呼んでいいのかもしれない。`,
    (m, f) => `${m}の視線が${f}を追っているのを、周りは気づいていた。本人だけが、その気持ちに気づいていなかった。`,
  ],
  drama: [
    (m, f) => `突然、${m}と${f}の間で言い争いが起きた。積み重なっていた感情が、ここで一気に噴き出した。`,
    (m, f) => `島の中に緊張が走った。${m}と${f}の関係を巡り、参加者たちの間で見えない駆け引きが始まった。`,
    (m, f) => `${m}の言葉が、${f}の心を予期せず傷つけた。誰もが息を呑む、緊張の瞬間が訪れた。`,
  ],
  introduction: [
    (m, f) => `${m}と${f}が初めて挨拶を交わした。互いの第一印象を確かめるような、緊張感ある一瞬だった。`,
  ],
  ceremony: [
    () => `3日間の熱いドラマが終わり、ついに最終カップリングセレモニーが始まった。参加者たちは固唾を飲んで見守った。`,
    () => `夕暮れの浜辺に全員が集まった。誰と誰が結ばれるのか、固定された視線の中でセレモニーが幕を開けた。`,
  ],
};

function getNarrative(type: EventType, m: string, f: string, day: number, time: string): string {
  const templates = NARRATIVES[type];
  if (!templates || templates.length === 0) return `${m}と${f}の間で何かが起きた。`;
  return rand(templates)(m, f, day, time);
}

// ─── Event title templates ───────────────────────────────────────────────────────

const TITLES: Record<EventType, string[]> = {
  conversation: ["二人の時間", "素顔の対話", "本音と建前", "浜辺の告白寸前", "距離が縮まる"],
  group_activity: ["チーム戦勃発", "共同作業の夜", "サバイバル合戦", "星空の下で", "嵐の前夜"],
  confession: ["勇気の言葉", "本気の告白", "心の扉", "ついに動いた", "想いの決壊"],
  paradise_invite: ["パラダイスへの誘い", "特別な招待状", "二人だけの約束", "扉が開く瞬間"],
  paradise_date: ["パラダイスの奇跡", "秘密の開示", "素顔の二人", "運命の出会い直し"],
  jealousy: ["嫉妬の炎", "見てられない", "揺れる心", "見えない壁", "心の乱れ"],
  drama: ["波紋", "緊迫の瞬間", "感情の爆発", "誤解と真実", "嵐の前夜"],
  introduction: ["はじめまして", "第一印象"],
  ceremony: ["最終カップリング"],
};

function getTitle(type: EventType): string {
  return rand(TITLES[type] ?? ["イベント"]);
}

// ─── Affinity change rules ─────────────────────────────────────────────────────

function calcAffinityChanges(
  eventType: EventType,
  maleId: string | null,
  femaleId: string | null,
  currentAff: number
): AffinityChange[] {
  if (!maleId || !femaleId) return [];

  let change = 0;
  let reason = "";

  switch (eventType) {
    case "conversation":
      change = currentAff >= 50 ? randInt(5, 12) : randInt(3, 9);
      reason = "会話で距離が縮まった";
      break;
    case "group_activity":
      change = randInt(2, 8);
      reason = "共同活動で絆が深まった";
      break;
    case "confession":
      change = currentAff >= 60 ? randInt(10, 20) : randInt(5, 12);
      reason = "想いを打ち明けた";
      break;
    case "paradise_invite":
      change = randInt(8, 15);
      reason = "パラダイスに誘った";
      break;
    case "paradise_date":
      change = randInt(15, 25);
      reason = "パラダイスデートで急接近";
      break;
    case "jealousy":
      change = Math.random() < 0.5 ? randInt(3, 10) : randInt(-8, -2);
      reason = change > 0 ? "嫉妬が本気の証拠" : "嫉妬でぎこちなくなった";
      break;
    case "drama":
      change = Math.random() < 0.4 ? randInt(-10, -3) : randInt(2, 8);
      reason = change > 0 ? "本音でぶつかり合った" : "誤解が生じた";
      break;
    default:
      change = randInt(1, 5);
      reason = "交流した";
  }

  return [{ fromId: maleId, toId: femaleId, change, reason }];
}

// ─── Build dialogue for event ────────────────────────────────────────────────────

function buildDialogue(
  eventType: EventType,
  maleId: string | null,
  femaleId: string | null,
  allIds: string[]
): DialogueLine[] {
  const lines: DialogueLine[] = [];

  if (maleId) {
    const key =
      eventType === "confession" ? "confession" :
      eventType === "paradise_invite" ? "paradise_invite" :
      eventType === "jealousy" ? "jealousy" :
      eventType === "paradise_date" ? "paradise_date" :
      "conversation_open";
    const line = getLine(maleId, key);
    lines.push({ characterId: maleId, text: line.text, emotion: line.emotion });
  }

  if (femaleId) {
    const key =
      eventType === "paradise_invite" ? "paradise_invite" :
      eventType === "paradise_date" ? "paradise_date" :
      eventType === "confession" ? "confession" :
      "conversation_response";
    const line = getLine(femaleId, key);
    lines.push({ characterId: femaleId, text: line.text, emotion: line.emotion });
  }

  // Extra dialogue for group events
  if (eventType === "group_activity" || eventType === "drama") {
    const extras = allIds.filter((id) => id !== maleId && id !== femaleId);
    for (const extraId of extras.slice(0, 1)) {
      const line = getLine(extraId, "conversation_open");
      lines.push({ characterId: extraId, text: line.text, emotion: line.emotion });
    }
  }

  // Jealousy: add a second line from male expressing jealousy
  if (eventType === "jealousy" && maleId) {
    const jLine = getLine(maleId, "jealousy");
    lines.push({ characterId: maleId, text: jLine.text, emotion: jLine.emotion });
  }

  return lines;
}

function buildInnerThoughts(
  eventType: EventType,
  maleId: string | null,
  femaleId: string | null,
  currentAff: number
): InnerThought[] {
  const thoughts: InnerThought[] = [];
  const positive = currentAff >= 40 || eventType === "confession" || eventType === "paradise_date";

  if (maleId) {
    thoughts.push({ characterId: maleId, thought: getThought(maleId, positive) });
  }
  if (femaleId) {
    thoughts.push({ characterId: femaleId, thought: getThought(femaleId, positive) });
  }
  return thoughts;
}

// ─── Paradise invite logic ─────────────────────────────────────────────────────

function buildParadiseInvite(
  maleId: string,
  femaleId: string,
  currentAff: number
): ParadiseInvite {
  const accepted = currentAff >= 55 || Math.random() < 0.7;
  const inviterLines = (CHAR_LINES[maleId]?.paradise_invite ?? []) as CharLine[];
  const inviteeLines = (CHAR_LINES[femaleId]?.paradise_invite ?? []) as CharLine[];
  const inviterMsg = inviterLines.length > 0 ? rand(inviterLines).text : "一緒にパラダイスに行かないか。";
  const inviteeResp = accepted
    ? (inviteeLines.length > 0 ? rand(inviteeLines).text : "…行きます。")
    : rand(["今は、一緒には行けないかな。ごめんなさい。", "もう少し考えさせて。"]);
  return { inviterId: maleId, inviteeId: femaleId, accepted, inviterMessage: inviterMsg, inviteeResponse: inviteeResp };
}

// ─── Paradise date builder ───────────────────────────────────────────────────────

function buildParadiseDateEvent(
  male: Character,
  female: Character,
  affinities: Record<string, number>
): GenerateEventResponse {
  const currentAff = getAff(affinities, male.id, female.id);
  const maleLine = getLine(male.id, "paradise_date");
  const femaleLine = getLine(female.id, "paradise_date");
  const mThought = getThought(male.id, true);
  const fThought = getThought(female.id, true);
  const bonus = randInt(15, 25);

  return {
    title: getTitle("paradise_date"),
    eventType: "paradise_date",
    location: "paradise",
    participants: [male.id, female.id],
    narrative: rand(NARRATIVES.paradise_date)(male.name, female.name, 0, ""),
    dialogue: [
      { characterId: male.id, text: maleLine.text, emotion: maleLine.emotion },
      { characterId: female.id, text: femaleLine.text, emotion: femaleLine.emotion },
    ],
    innerThoughts: [
      { characterId: male.id, thought: mThought },
      { characterId: female.id, thought: fThought },
    ],
    affinityChanges: [
      { fromId: male.id, toId: female.id, change: bonus, reason: "パラダイスデートで急接近した" },
    ],
  };
}

// ─── Main event generator ────────────────────────────────────────────────────────

export async function generateEvent(
  request: GenerateEventRequest
): Promise<{ event: GenerateEventResponse; paradiseEvent: GenerateEventResponse | null }> {
  const { day, timeOfDay, characters, affinities, paradisePairs } = request;

  const active = characters.filter((c) => !c.isInParadise && !c.isEliminated);
  const males = active.filter((c) => c.gender === "male");
  const females = active.filter((c) => c.gender === "female");

  // Get max affinity for event type selection
  let maxAff = 0;
  for (const m of males) {
    for (const f of females) {
      const v = getAff(affinities, m.id, f.id);
      if (v > maxAff) maxAff = v;
    }
  }

  const eventType = selectEventType(day, timeOfDay, maxAff, paradisePairs.length, []);
  const { ids, mainMaleId, mainFemaleId } = selectParticipants(eventType, males, females, affinities, active);

  const mainMale = mainMaleId ? characters.find((c) => c.id === mainMaleId) : undefined;
  const mainFemale = mainFemaleId ? characters.find((c) => c.id === mainFemaleId) : undefined;
  const currentAff = mainMaleId && mainFemaleId ? getAff(affinities, mainMaleId, mainFemaleId) : 0;

  const timeLabel = timeOfDay === "morning" ? "朝" : timeOfDay === "afternoon" ? "午後" : "夜";

  // Build narrative using character names
  const mName = mainMale?.name ?? "彼";
  const fName = mainFemale?.name ?? "彼女";

  const event: GenerateEventResponse = {
    title: getTitle(eventType),
    eventType,
    location: "inferno",
    participants: ids.length > 0 ? ids : [mainMaleId, mainFemaleId].filter(Boolean) as string[],
    narrative: getNarrative(eventType, mName, fName, day, timeLabel),
    dialogue: buildDialogue(eventType, mainMaleId, mainFemaleId, ids),
    innerThoughts: buildInnerThoughts(eventType, mainMaleId, mainFemaleId, currentAff),
    affinityChanges: calcAffinityChanges(eventType, mainMaleId, mainFemaleId, currentAff),
  };

  // Paradise invite logic
  let paradiseEvent: GenerateEventResponse | null = null;

  if (eventType === "paradise_invite" && mainMaleId && mainFemaleId) {
    const invite = buildParadiseInvite(mainMaleId, mainFemaleId, currentAff);
    event.paradiseInvite = invite;

    if (invite.accepted && mainMale && mainFemale) {
      paradiseEvent = buildParadiseDateEvent(mainMale, mainFemale, affinities);
    }
  }

  return { event, paradiseEvent };
}

// ─── Ceremony generator ───────────────────────────────────────────────────────────

const CEREMONY_NARRATIVES = [
  "3日間のドラマがついに幕を閉じる。星空の下、全員が浜辺に集まり、互いの目を見つめ合った。誰が誰を選ぶのか——固唾を飲む瞬間が来た。",
  "最終カップリングセレモニーが始まった。無人島での出来事が走馬灯のように蘇る中、参加者たちは運命の選択の時を迎えた。",
  "インフェルノの夜、炎に照らされながら全員が一堂に会した。恋愛ドラマの最終章——誰の心が誰に向いているのか、答え合わせの時間だ。",
];

const CEREMONY_LINES: Record<string, string[]> = {
  kenji: [
    "3日間、正直自分でも驚いている。こんなに誰かを意識したのは初めてかもしれない。",
    "計算していなかったことが起きた。それが、答えだと思う。",
  ],
  ryu: [
    "音楽と同じだ。心が動いたら、それが全てだと思う。",
    "迷ってる暇はない。俺は正直に行く。",
  ],
  takeshi: [
    "ここで過ごした時間は、本物だったと思っている。",
    "言葉より行動。そう生きてきた。でも今日だけは言葉にする。",
  ],
  yuki: [
    "負けず嫌いな私が、初めて勝ちより大事なものを見つけた気がする。",
    "全力で来た。それだけは胸を張って言える。",
  ],
  hana: [
    "こんなに早く心を動かされるとは思っていなかった。",
    "ガードが下がった。それが答えだと思う。",
  ],
  mia: [
    "料理と同じ。素材が良ければ、自然と美味しくなる。あなたはそういう人だった。",
    "笑顔でいられる人がいる。それだけで十分だった。",
  ],
};

export async function generateCeremony(
  request: GenerateCeremonyRequest
): Promise<GenerateCeremonyResponse> {
  const { characters, affinities } = request;
  const active = characters.filter((c) => !c.isEliminated);
  const males = active.filter((c) => c.gender === "male");
  const females = active.filter((c) => c.gender === "female");

  // Sort all pairs by affinity descending
  const pairs: { m: Character; f: Character; val: number }[] = [];
  for (const m of males) {
    for (const f of females) {
      pairs.push({ m, f, val: getAff(affinities, m.id, f.id) });
    }
  }
  pairs.sort((a, b) => b.val - a.val);

  // Greedy matching: highest affinity first, each person used once
  const usedIds = new Set<string>();
  const couples: FinalCouple[] = [];

  for (const pair of pairs) {
    if (pair.val < 45) break; // threshold for coupling
    if (!usedIds.has(pair.m.id) && !usedIds.has(pair.f.id)) {
      couples.push({ person1Id: pair.m.id, person2Id: pair.f.id });
      usedIds.add(pair.m.id);
      usedIds.add(pair.f.id);
    }
  }

  const uncoupled = active.filter((c) => !usedIds.has(c.id)).map((c) => c.id);

  // Build dialogue
  const dialogue: DialogueLine[] = [];
  for (const c of active) {
    const lines = CEREMONY_LINES[c.id];
    if (lines && lines.length > 0) {
      const emotion: Emotion = couples.some((cp) => cp.person1Id === c.id || cp.person2Id === c.id)
        ? "happy"
        : "sad";
      dialogue.push({ characterId: c.id, text: rand(lines), emotion });
    }
  }

  return {
    narrative: rand(CEREMONY_NARRATIVES),
    dialogue,
    couples,
    uncoupled,
  };
}
