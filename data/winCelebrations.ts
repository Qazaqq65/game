/**
 * Әр сөз үшін жеңіс экранындағы «ерекше сәт» (Lottie public/lottie/ ішінде).
 * Кілт — сөздің БАС ӘРІППЕН жазылуы (words.ts сияқты).
 */
export type WinCelebrationScene = "savanna" | "apple" | "child";

export interface WinCelebrationDef {
  /** public/lottie/ файл атауы (бос орын болса да болады). */
  lottieFile?: string;
  /** Негізгі анимациядан кейінгі кезекпен көрсетілетін lottie файлдары. */
  followUpLottieFiles?: string[];
  /** public/lottie/ ішіндегі mp4 файл атауы. */
  videoFile?: string;
  /** Ку сындырып қашады — арыстанның алдында жүгіреді. */
  chaseLizardFile?: string;
  scene: WinCelebrationScene;
  /** Қосымша позиция/өлшем түрлендірулері үшін визуал нұсқа. */
  actorVariant?: "virus" | "flower" | "rocket" | "dogpair";
  /** Қысқа реңк хабарламасы (қалағанда бос). */
  tagline?: string;
}

export const WIN_CELEBRATIONS: Record<string, WinCelebrationDef> = {
  АЛМА: {
    lottieFile: "Apple Workout.json",
    scene: "apple",
    tagline: "Алма сахнаға шықты!",
  },
  АРЫСТАН: {
    lottieFile: "Lion Running.json",
    scene: "apple",
    tagline: "Арыстан жүгіріп келеді!",
  },
  БАЛА: {
    videoFile: "child.mp4",
    scene: "child",
    tagline: "Бала қуанып биледі!",
  },
  ВИРУС: {
    lottieFile: "COVID19.json",
    followUpLottieFiles: ["Covid elimination.json", "Hand Sanitizer.json"],
    scene: "apple",
    actorVariant: "virus",
    tagline: "COVID19 -> elimination -> sanitizer",
  },
  ГҮЛ: {
    lottieFile: "Flowers.json",
    scene: "apple",
    actorVariant: "flower",
    tagline: "Гүл жайқалып тұр!",
  },
  ДОП: {
    lottieFile: "ball.json",
    scene: "apple",
    tagline: "Доп секіріп тұр!",
  },
  ЗЫМЫРАН: {
    lottieFile: "roket 1.json",
    scene: "apple",
    actorVariant: "rocket",
    tagline: "Зымыран ұшып барады!",
  },
  ИТ: {
    lottieFile: "dog1.json",
    followUpLottieFiles: ["dog2.json"],
    scene: "apple",
    actorVariant: "dogpair",
    tagline: "Екі ит ойнап жүр!",
  },
  КЕМЕ: {
    lottieFile: "ship1.json",
    scene: "apple",
    tagline: "Кеме жүзіп барады!",
  },
  ӨРМЕКШІ: {
    lottieFile: "Spider.json",
    scene: "apple",
    tagline: "Өрмекші тор тоқып жатыр!",
  },
  ОЙЫН: {
    lottieFile: "game1.json",
    scene: "apple",
    tagline: "Ойын басталды!",
  },
  ПІЛ: {
    lottieFile: "Elephant.json",
    scene: "apple",
    tagline: "Піл саванада серуендейді!",
  },
  ПОЙЫЗ: {
    lottieFile: "Train.json",
    scene: "apple",
    tagline: "Пойыз жүріп барады — ту-ту!",
  },
  РАДИО: {
    lottieFile: "Radio.json",
    scene: "apple",
    tagline: "Радиодан музыка ойнайды!",
  },
  САҒАТ: {
    lottieFile: "Wacth.json",
    scene: "apple",
    tagline: "Сағат тық-тық етеді!",
  },
  ҮКІ: {
    lottieFile: "Owl.json",
    scene: "apple",
    tagline: "Үкі түнде бақылайды!",
  },
};

export function winCelebrationForWord(word: string): WinCelebrationDef | null {
  const key = word.trim().toUpperCase();
  return WIN_CELEBRATIONS[key] ?? null;
}

export function winCelebrationLottieUrl(def: WinCelebrationDef): string {
  return `/lottie/${encodeURIComponent(def.lottieFile ?? "")}`;
}
