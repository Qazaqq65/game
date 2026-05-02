import type { LetterDef, PatternType, WordDef } from "../types";

function F(
  ch: string,
  color: string,
  pat: PatternType,
  pc: string
): LetterDef {
  return { ch, color, pat, pc };
}

/**
 * Фигуралар: 3 деңгей (меню карточкалары + арнайы FigureLevelBoard).
 */
export const FIGURE_LEVELS: WordDef[] = [
  {
    word: "FIG1",
    puzzleTitle: "Фигуралармен танысу",
    menuSubtitle: "LEVEL 1 — Знакомство с фигурами",
    levelNumber: 1,
    emoji: "🔷",
    voiced: false,
    figureStage: "intro",
    letters: [F("■", "#5E7BFF", "dots", "#2E45B3")],
  },
  {
    word: "FIG2",
    puzzleTitle: "Фигураны тап",
    menuSubtitle: "LEVEL 2 — Найди фигуру",
    levelNumber: 2,
    emoji: "🔍",
    voiced: false,
    figureStage: "find",
    letters: [F("◆", "#26C24A", "lines", "#12802D")],
  },
  {
    word: "FIG3",
    puzzleTitle: "Сұрыптау",
    menuSubtitle: "LEVEL 3 — Сортировка",
    levelNumber: 3,
    emoji: "📊",
    voiced: false,
    figureStage: "sort",
    letters: [F("●", "#FF6B2C", "lines", "#B74711")],
  },
];
