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
  /** public/music/ ішіндегі mp3 (мысалы apple.mp3). */
  musicFile?: string;
  /** Ку сындырып қашады — арыстанның алдында жүгіреді. */
  chaseLizardFile?: string;
  scene: WinCelebrationScene;
  /** Қосымша позиция/өлшем түрлендірулері үшін визуал нұсқа. */
  actorVariant?: "virus" | "flower" | "rocket" | "dogpair" | "dopStaticMoving";
  /** Қысқа реңк хабарламасы (қалағанда бос). */
  tagline?: string;
  /** savanna: алмадағыдай жасыл рамка ішінде, бірақ ку қуған парад анимациясы. */
  framedChase?: boolean;
  /** Авто «Келесі сөз» уақытына қосу (теріс — қысқарту), мс. Тек қажетті сөздерде. */
  winAutoAdvanceDeltaMs?: number;
}

export const WIN_CELEBRATIONS: Record<string, WinCelebrationDef> = {
  ӘТЕШ: {
    lottieFile: "rooster.json",
    scene: "apple",
    musicFile: "rooster.mp3",
    tagline: "Әтеш қызылды шақырады!",
  },
  АЛМА: {
    lottieFile: "Apple Workout.json",
    scene: "apple",
    musicFile: "apple.mp3",
    tagline: "Алма сахнаға шықты!",
    winAutoAdvanceDeltaMs: 1000,
  },
  АРЫСТАН: {
    lottieFile: "Lion Running.json",
    scene: "savanna",
    chaseLizardFile: "Lizard running Lottie Animation.json",
    framedChase: true,
    musicFile: "Lionmusic.mp3",
    tagline: "Арыстан жүгіріп келеді!",
    winAutoAdvanceDeltaMs: -6000,
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
    musicFile: "covid.mp3",
    tagline: "COVID19 -> elimination -> sanitizer",
  },
  ГҮЛ: {
    lottieFile: "ColorFlower.json",
    scene: "apple",
    actorVariant: "flower",
    tagline: "Гүл жайқалып тұр!",
  },
  ДОП: {
    /** ball.json тұрады, ball2.json парадпен қана қозғалады. */
    lottieFile: "ball.json",
    chaseLizardFile: "ball2.json",
    scene: "savanna",
    framedChase: true,
    actorVariant: "dopStaticMoving",
    tagline: "Доп секіріп тұр!",
  },
  ЖЕР: {
    lottieFile: "Earth.json",
    scene: "apple",
    tagline: "Жер шары айналып тұр!",
  },
  ЗЫМЫРАН: {
    lottieFile: "roket 1.json",
    scene: "apple",
    actorVariant: "rocket",
    tagline: "Зымыран ұшып барады!",
  },
  ҚАР: {
    lottieFile: "Snow.json",
    scene: "apple",
    tagline: "Қар жауып тұр!",
  },
  ИТ: {
    lottieFile: "dog1.json",
    followUpLottieFiles: ["dog2.json"],
    scene: "apple",
    actorVariant: "dogpair",
    tagline: "Екі ит ойнап жүр!",
  },
  ЛИМОН: {
    lottieFile: "Lemon.json",
    scene: "apple",
    tagline: "Лимон сары — қышқыл!",
  },
  КЕМЕ: {
    lottieFile: "ship1.json",
    scene: "apple",
    tagline: "Кеме жүзіп барады!",
  },
  МЫСЫҚ: {
    videoFile: "cat.mp4",
    scene: "child",
    tagline: "Мысық ойнап жүр!",
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
