import type { Lang } from "./i18n";
import type { LongContentScene } from "./longContentTimeline";
import type { LongVideoType } from "./longVideoTypes";

export function buildLongVideoVoiceSegments(scenes: LongContentScene[], type: LongVideoType, algoName: string, lang: Lang) {
  if (type === "classic") return scenes.map((scene) => scene.narration);
  return scenes.map((scene) => buildMotionVoiceSegment(scene, type, algoName, lang));
}

function buildMotionVoiceSegment(scene: LongContentScene, type: LongVideoType, algoName: string, lang: Lang) {
  if (type === "kinetic-typography") return kineticVoice(scene, algoName, lang);
  if (type === "animated-explainer") return explainerVoice(scene, algoName, lang);
  return uiVoice(scene, algoName, lang);
}

function kineticVoice(scene: LongContentScene, algoName: string, lang: Lang) {
  if (algoName.toLowerCase().includes("odd-even")) return oddEvenKineticVoice(scene, algoName, lang);
  if (lang === "vi") {
    const phrase = pickKineticPhrase(scene);
    return `${algoName}. ${phrase}. Nhịp nhanh. Nhìn từ khóa, theo chuyển động.`;
  }
  const phrase = pickKineticPhrase(scene);
  return `${algoName}. ${phrase}. Fast beat. Follow the keywords, follow the motion.`;
}

function oddEvenKineticVoice(scene: LongContentScene, algoName: string, lang: Lang) {
  const vi = lang === "vi";
  const title = scene.id;
  const phrase = title === "phase-walkthrough"
    ? (vi ? "Pha lẻ. Năm lớn hơn bốn, đổi. Ba lớn hơn hai, đổi. Pha chẵn. Nhóm cặp dịch sang trái." : "Odd phase. Five greater than four, swap. Three greater than two, swap. Even phase. Pair group shifts left.")
    : title === "odd-even-complexity"
      ? (vi ? "Best case O n. Average O n bình phương. Worst case O n bình phương. Space O một." : "Best case O n. Average O n squared. Worst case O n squared. Space O one.")
      : title === "odd-even-animation"
        ? (vi ? "Theo dõi cờ sorted. Có đổi chỗ thì false. Một vòng sạch thì dừng." : "Track the sorted flag. A swap makes it false. A clean round stops.")
        : title === "odd-even-recap"
          ? (vi ? "Bốn từ khóa. Lẻ. Chẵn. Swap. Dừng." : "Four keywords. Odd. Even. Swap. Stop.")
          : title === "odd-even-mental-model"
            ? (vi ? "Các cặp trong cùng pha không chồng nhau. Đây là ý tưởng sorting network." : "Pairs in one phase do not overlap. This is the sorting-network idea.")
            : (vi ? "Hai nhịp để sửa các cặp kề nhau." : "Two beats to repair adjacent pairs.");
  return `${algoName}. ${phrase}`;
}

function explainerVoice(scene: LongContentScene, algoName: string, lang: Lang) {
  const bullet = scene.bullets[0] ?? scene.subtitle;
  return lang === "vi"
    ? `${algoName}: ${scene.title}. ${shorten(scene.subtitle || bullet, 120)}`
    : `${algoName}: ${scene.title}. ${shorten(scene.subtitle || bullet, 120)}`;
}

function uiVoice(scene: LongContentScene, algoName: string, lang: Lang) {
  const action = scene.animation
    ? (lang === "vi" ? "Xem state đổi trong dashboard." : "Watch the state update in the dashboard.")
    : (lang === "vi" ? "Giao diện tóm tắt ý chính." : "The interface highlights the core idea.");
  return `${algoName}. ${scene.kindLabel}. ${action} ${shorten(scene.subtitle, 100)}`;
}

function pickKineticPhrase(scene: LongContentScene) {
  const title = scene.title.toLowerCase();
  if (title.includes("complex") || title.includes("phức")) return "O n squared";
  if (title.includes("stop") || title.includes("swapped")) return "No swap. Stop";
  if (title.includes("avoid") || title.includes("không")) return "Large data. Do not use";
  if (title.includes("use") || title.includes("nên")) return "Small data. Good demo";
  if (scene.animation) return "Compare. Swap. Lock";
  return "Pair by pair";
}

function shorten(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1).trim()}...`;
}
