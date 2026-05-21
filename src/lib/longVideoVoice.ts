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
  if (algoName.toLowerCase().includes("pancake")) return pancakeKineticVoice(scene, algoName, lang);
  if (algoName.toLowerCase().includes("bitonic")) return bitonicKineticVoice(scene, algoName, lang);
  if (lang === "vi") {
    const phrase = pickKineticPhrase(scene);
    return `${algoName}. ${phrase}. Nhịp nhanh. Nhìn từ khóa, theo chuyển động.`;
  }
  const phrase = pickKineticPhrase(scene);
  return `${algoName}. ${phrase}. Fast beat. Follow the keywords, follow the motion.`;
}

function bitonicKineticVoice(scene: LongContentScene, algoName: string, lang: Lang) {
  const vi = lang === "vi";
  const phrase = scene.id === "mental-model"
    ? (vi ? "Dãy bitonic có một nửa tăng và một nửa giảm. Merge dùng gap giảm dần." : "A bitonic sequence rises on one side and falls on the other. Merge uses shrinking gaps.")
    : scene.id === "steps"
      ? (vi ? "Chia hướng. So sánh theo ASC hoặc DESC. Nếu sai hướng thì swap. Sau đó giảm gap." : "Split directions. Compare by ASC or DESC. Swap when the direction is wrong. Then shrink the gap.")
      : scene.id === "animation"
        ? (vi ? "Theo dõi network: gap bốn so sánh cặp xa, gap hai thu khoảng cách, gap một sửa cặp cuối." : "Watch the network: gap four compares distant pairs, gap two shrinks distance, gap one fixes the final neighbors.")
        : scene.id === "complexity"
          ? (vi ? "Best, average và worst đều O n log bình phương n. Space O log n." : "Best, average, and worst are all O n log squared n. Space O log n.")
          : scene.id === "recap"
            ? (vi ? "Bốn từ khóa: bitonic, hướng, gap, swap." : "Four keywords: bitonic, direction, gap, swap.")
            : (vi ? "Bitonic Sort là sorting network: lịch compare-swap rất đều." : "Bitonic Sort is a sorting network with a regular compare-swap schedule.");
  return `${algoName}. ${phrase}`;
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

function pancakeKineticVoice(scene: LongContentScene, algoName: string, lang: Lang) {
  const vi = lang === "vi";
  const phrase = scene.id === "mental-model"
    ? (vi ? "Mô hình là một đoạn chưa xong ở phía trên và một suffix đã cố định ở phía cuối." : "The model is an unfinished prefix on top and a fixed suffix at the end.")
    : scene.id === "steps"
      ? (vi ? "Mỗi vòng chọn giá trị lớn nhất của prefix. Nếu cần thì lật lên đầu, rồi lật về cuối đoạn; nếu đã đúng chỗ thì bỏ qua." : "Each round selects the largest value in the prefix. If needed, flip it to the front, then to the segment end; if it is already placed, skip the flip.")
      : scene.id === "animation"
        ? (vi ? "Với input này, sáu được đưa vào index năm; vòng sau chỉ còn xét prefix ngắn hơn." : "On this input, six is placed at index five; the next round only checks a shorter prefix.")
        : scene.id === "complexity"
          ? (vi ? "Best case O n bình phương. Average O n bình phương. Worst case O n bình phương. Space O một. Không ổn định." : "Best case O n squared. Average O n squared. Worst case O n squared. Space O one. Not stable.")
          : scene.id === "recap"
            ? (vi ? "Ghi nhớ invariant: suffix cuối mảng luôn đúng, còn prefix phía trước ngắn dần sau mỗi vòng." : "Remember the invariant: the suffix at the end is correct, and the prefix before it shrinks each round.")
            : (vi ? "Sắp xếp bằng prefix reversal, không phải đổi từng cặp kề nhau." : "Sort by prefix reversal, not by adjacent pair swaps.");
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
