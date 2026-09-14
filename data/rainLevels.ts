import type { LetterDef, WordDef } from "../types";

function R(ch: string, color: string, pc: string): LetterDef {
  return { ch, color, pat: "dots", pc, face: "off" };
}

export type RainDifficulty = "easy" | "medium" | "storm";

export interface RainTuning {
  spawnMs: number;
  minVy: number;
  maxVy: number;
  goal: number;
  decoyChance: number;
  maxDrops: number;
  retargetEvery: number;
}

export const RAIN_TUNING: Record<RainDifficulty, RainTuning> = {
  easy: {
    spawnMs: 900,
    minVy: 108,
    maxVy: 156,
    goal: 8,
    decoyChance: 0.38,
    maxDrops: 4,
    retargetEvery: 99,
  },
  medium: {
    spawnMs: 640,
    minVy: 138,
    maxVy: 198,
    goal: 12,
    decoyChance: 0.52,
    maxDrops: 6,
    retargetEvery: 4,
  },
  storm: {
    spawnMs: 440,
    minVy: 176,
    maxVy: 258,
    goal: 15,
    decoyChance: 0.6,
    maxDrops: 8,
    retargetEvery: 3,
  },
};

export const RAIN_LETTERS = [
  R("А", "#26C24A", "#12802D"),
  R("Ә", "#FF2E74", "#B30046"),
  R("Б", "#5E7BFF", "#2E45B3"),
  R("Д", "#4F6DFF", "#2439B8"),
  R("Е", "#4F6DFF", "#2439B8"),
  R("Ж", "#FF8A00", "#B85D00"),
  R("К", "#26C24A", "#12802D"),
  R("Қ", "#5C9CEE", "#2E5F9E"),
  R("Л", "#B23CFF", "#6A1FA8"),
  R("М", "#FF6B2C", "#B74711"),
  R("Н", "#00B884", "#067A5A"),
  R("О", "#FF8A00", "#B85D00"),
  R("С", "#A64CFF", "#6526A8"),
  R("Т", "#607D8B", "#3D4F5C"),
  R("Ұ", "#FFB000", "#B37700"),
  R("Ү", "#7C4DFF", "#4A2FA3"),
  R("І", "#FF6B9D", "#B83D6E"),
];

export const RAIN_LEVELS: WordDef[] = [
  {
    word: "RAIN1",
    puzzleTitle: "Жұмсақ жаңбыр",
    menuSubtitle: "Қолшатырмен ұста",
    gameInstruction:
      "Қолшатырды саусақпен жылжытыңыз. Жарқыраған әріпті ғана ұстаңыз.",
    levelNumber: 1,
    emoji: "🌧️",
    voiced: false,
    rainStage: "easy",
    letters: [RAIN_LETTERS[0]],
  },
  {
    word: "RAIN2",
    puzzleTitle: "Қатты жаңбыр",
    menuSubtitle: "Әріп өзгереді",
    gameInstruction: "Әріп өзгереді — қолшатырды тез қойыңыз.",
    levelNumber: 2,
    emoji: "⛈️",
    voiced: false,
    rainStage: "medium",
    letters: [RAIN_LETTERS[1]],
  },
  {
    word: "RAIN3",
    puzzleTitle: "Дауыл",
    menuSubtitle: "Ең жылдам ойын",
    gameInstruction: "Дауылда тек жарқыраған әріпті ұстаңыз.",
    levelNumber: 3,
    emoji: "🌪️",
    voiced: false,
    rainStage: "storm",
    letters: [RAIN_LETTERS[7]],
  },
];
