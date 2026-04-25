import type { LetterDef, PatternType, WordDef } from "../types";

/**
 * Әріптер мен сөздер тек **БАС ӘРІППЕН** (кириллица).
 * ch, word, дыбыс файлының атауы бірдей регистрде болуы керек.
 */
function L(
  ch: string,
  color: string,
  pat: PatternType,
  pc: string,
  face?: "on" | "off",
  faceLayout?: LetterDef["faceLayout"]
): LetterDef {
  const base: LetterDef = { ch, color, pat, pc };
  if (face) {
    base.face = face;
    if (faceLayout) base.faceLayout = faceLayout;
  }
  return base;
}

const faceA = {
  face: "on" as const,
  faceLayout: { eyeY: 0.44, mouthY: 0.74, cheekY: 0.62 },
};

/** Меню: әріп бойынша топ; сөз топтағы әріппен байланысты (басталуы міндетті емес). */
export const WORD_MENU_GROUPS: { letter: string; words: WordDef[] }[] = [
  {
    letter: "А",
    words: [
      {
        word: "АЛМА",
        emoji: "🍎",
        voiced: true,
        letters: [
          L("А", "#26C24A", "lines", "#12802D", "on", faceA.faceLayout),
          L("Л", "#A64CFF", "dots", "#6526A8", "off"),
          L("М", "#FF6B2C", "lines", "#B74711", "on", { eyeY: 0.44, mouthY: 0.74 }),
          L("А", "#26C24A", "lines", "#12802D", "on", faceA.faceLayout),
        ],
      },
      {
        word: "АРЫСТАН",
        emoji: "🦁",
        voiced: true,
        letters: [
          L("А", "#FF3B3B", "dots", "#B81F1F", "on", faceA.faceLayout),
          L("Р", "#2E86FF", "dots", "#1B4FB5", "off"),
          L("Ы", "#FF7A00", "lines", "#B35700", "on", { eyeY: 0.45, mouthY: 0.75 }),
          L("С", "#2E86FF", "dots", "#1B4FB5", "on", { eyeY: 0.47, mouthY: 0.76, eyeLX: 0.34, eyeRX: 0.66 }),
          L("Т", "#A64CFF", "dots", "#6526A8", "off"),
          L("А", "#26C24A", "lines", "#12802D", "on", faceA.faceLayout),
          L("Н", "#00B884", "lines", "#067A5A", "on", { eyeY: 0.45, mouthY: 0.75 }),
        ],
      },
    ],
  },
  {
    letter: "Ә",
    words: [
      {
        word: "ӘТЕШ",
        emoji: "🐓",
        svgSrc: "/svg/rooster.svg",
        voiced: true,
        letters: [
          L("Ә", "#FF2E74", "dots", "#B30046"),
          L("Т", "#A64CFF", "dots", "#6526A8", "off"),
          L("Е", "#4F6DFF", "dots", "#2439B8", "on", { eyeY: 0.46, mouthY: 0.75 }),
          L("Ш", "#FF8A00", "lines", "#B85D00", "off"),
        ],
      },
    ],
  },
  {
    letter: "Б",
    words: [
      {
        word: "БАЛА",
        emoji: "👶",
        voiced: true,
        letters: [
          L("Б", "#5E7BFF", "spots", "#2E45B3", "off"),
          L("А", "#FF3B3B", "dots", "#B81F1F", "on", faceA.faceLayout),
          L("Л", "#B23CFF", "spots", "#6A1FA8", "off"),
          L("А", "#FF3B3B", "dots", "#B81F1F", "on", faceA.faceLayout),
        ],
      },
    ],
  },
  {
    letter: "В",
    words: [
      {
        word: "ВИРУС",
        emoji: "🦠",
        voiced: true,
        letters: [
          L("В", "#5B7CFF", "dots", "#2E4588", "off"),
          L("И", "#FF6B9D", "lines", "#B83D6E", "on", { eyeY: 0.34, mouthY: 0.72 }),
          L("Р", "#2E86FF", "dots", "#1B4FB5", "off"),
          L("У", "#26C24A", "lines", "#12802D", "on", { eyeY: 0.44, mouthY: 0.74 }),
          L("С", "#A64CFF", "dots", "#6526A8", "on", { eyeY: 0.47, mouthY: 0.76 }),
        ],
      },
    ],
  },
  {
    letter: "Г",
    words: [
      {
        word: "ГҮЛ",
        emoji: "🌷",
        voiced: true,
        letters: [
          L("Г", "#E91E8C", "lines", "#9C145E", "off"),
          L("Ү", "#7C4DFF", "dots", "#4A2FA3", "on", { eyeY: 0.34, mouthY: 0.74 }),
          L("Л", "#FF9F1C", "spots", "#B56F0E", "off"),
        ],
      },
    ],
  },
  {
    letter: "Д",
    words: [
      {
        word: "ДОП",
        emoji: "⚽",
        letters: [
          L("Д", "#4F6DFF", "dots", "#2439B8", "off"),
          L("О", "#FF6B2C", "lines", "#B74711", "on", { eyeY: 0.42, mouthY: 0.73 }),
          L("П", "#00B884", "lines", "#067A5A", "off"),
        ],
      },
    ],
  },
  {
    letter: "Е",
    words: [
      {
        word: "ЕШКІ",
        emoji: "🐐",
        letters: [
          L("Е", "#4F6DFF", "dots", "#2439B8", "on", { eyeY: 0.46, mouthY: 0.75 }),
          L("Ш", "#A64CFF", "dots", "#6526A8", "off"),
          L("К", "#26C24A", "lines", "#12802D", "off"),
          L("І", "#FF6B2C", "lines", "#B74711", "on", { eyeY: 0.44, mouthY: 0.74 }),
        ],
      },
    ],
  },
  {
    letter: "Ж",
    words: [
      {
        word: "ЖЕР",
        emoji: "🌍",
        letters: [
          L("Ж", "#FF8A00", "lines", "#B85D00", "on", { eyeY: 0.44, mouthY: 0.73, eyeLX: 0.31, eyeRX: 0.69 }),
          L("Е", "#4F6DFF", "dots", "#2439B8", "on", { eyeY: 0.46, mouthY: 0.75 }),
          L("Р", "#2E86FF", "dots", "#1B4FB5", "off"),
        ],
      },
    ],
  },
  {
    letter: "З",
    words: [
      {
        word: "ЗЫМЫРАН",
        emoji: "🚀",
        letters: [
          L("З", "#9C27B0", "dots", "#6A1B7A", "off"),
          L("Ы", "#FF7A00", "lines", "#B35700", "on", { eyeY: 0.45, mouthY: 0.75 }),
          L("М", "#26C24A", "lines", "#12802D", "on", { eyeY: 0.44, mouthY: 0.74 }),
          L("Ы", "#2E86FF", "dots", "#1B4FB5", "on", { eyeY: 0.45, mouthY: 0.75 }),
          L("Р", "#A64CFF", "dots", "#6526A8", "off"),
          L("А", "#FF3B3B", "dots", "#B81F1F", "on", faceA.faceLayout),
          L("Н", "#00B884", "lines", "#067A5A", "on", { eyeY: 0.45, mouthY: 0.75 }),
        ],
      },
    ],
  },
  {
    letter: "И",
    words: [
      {
        word: "ИТ",
        emoji: "🐕",
        letters: [
          L("И", "#FF6B9D", "lines", "#B83D6E", "on", { eyeY: 0.34, mouthY: 0.72 }),
          L("Т", "#607D8B", "dots", "#3D4F5C", "off"),
        ],
      },
    ],
  },
  {
    letter: "К",
    words: [
      {
        word: "КЕМЕ",
        emoji: "🚢",
        letters: [
          L("К", "#26C24A", "lines", "#12802D", "off"),
          L("Е", "#4F6DFF", "dots", "#2439B8", "on", { eyeY: 0.46, mouthY: 0.75 }),
          L("М", "#FF6B2C", "lines", "#B74711", "on", { eyeY: 0.44, mouthY: 0.74 }),
          L("Е", "#A64CFF", "dots", "#6526A8", "on", { eyeY: 0.46, mouthY: 0.75 }),
        ],
      },
    ],
  },
  {
    letter: "Қ",
    words: [
      {
        word: "ҚАР",
        emoji: "❄️",
        letters: [
          L("Қ", "#5C9CEE", "dots", "#2E5F9E", "off"),
          L("А", "#FF3B3B", "dots", "#B81F1F", "on", faceA.faceLayout),
          L("Р", "#B23CFF", "spots", "#6A1FA8", "off"),
        ],
      },
    ],
  },
  {
    letter: "Л",
    words: [
      {
        word: "ЛИМОН",
        emoji: "🍋",
        letters: [
          L("Л", "#FFEB3B", "spots", "#B89F0A", "off"),
          L("И", "#FF6B9D", "lines", "#B83D6E", "on", { eyeY: 0.34, mouthY: 0.72 }),
          L("М", "#26C24A", "lines", "#12802D", "on", { eyeY: 0.44, mouthY: 0.74 }),
          L("О", "#FF8A00", "lines", "#B85D00", "on", { eyeY: 0.42, mouthY: 0.73 }),
          L("Н", "#00B884", "lines", "#067A5A", "on", { eyeY: 0.45, mouthY: 0.75 }),
        ],
      },
    ],
  },
  {
    letter: "М",
    words: [
      {
        word: "МЫСЫҚ",
        emoji: "🐱",
        letters: [
          L("М", "#FF6B2C", "lines", "#B74711", "on", { eyeY: 0.44, mouthY: 0.74 }),
          L("Ы", "#2E86FF", "dots", "#1B4FB5", "on", { eyeY: 0.45, mouthY: 0.75 }),
          L("С", "#A64CFF", "dots", "#6526A8", "on", { eyeY: 0.47, mouthY: 0.76 }),
          L("Ы", "#26C24A", "lines", "#12802D", "on", { eyeY: 0.45, mouthY: 0.75 }),
          L("Қ", "#5C9CEE", "dots", "#2E5F9E", "off"),
        ],
      },
    ],
  },
  {
    letter: "Н",
    words: [
      {
        word: "НАЙЗАҒАЙ",
        emoji: "⚡",
        letters: [
          L("Н", "#00B884", "lines", "#067A5A", "on", { eyeY: 0.45, mouthY: 0.75 }),
          L("А", "#FF3B3B", "dots", "#B81F1F", "on", faceA.faceLayout),
          L("Й", "#7C4DFF", "dots", "#4A2FA3", "off"),
          L("З", "#FF9F1C", "lines", "#B56F0E", "off"),
          L("А", "#26C24A", "lines", "#12802D", "on", faceA.faceLayout),
          L("Ғ", "#8B4513", "lines", "#5C2E0D", "off"),
          L("А", "#2E86FF", "dots", "#1B4FB5", "on", faceA.faceLayout),
          L("Й", "#E91E8C", "lines", "#9C145E", "off"),
        ],
      },
    ],
  },
  {
    letter: "Ң",
    words: [
      {
        word: "ЖАҢБЫР",
        emoji: "🌧️",
        letters: [
          L("Ж", "#FF8A00", "lines", "#B85D00", "on", { eyeY: 0.44, mouthY: 0.73, eyeLX: 0.31, eyeRX: 0.69 }),
          L("А", "#26C24A", "lines", "#12802D", "on", faceA.faceLayout),
          L("Ң", "#5C9CEE", "dots", "#2E5F9E", "off"),
          L("Б", "#5E7BFF", "spots", "#2E45B3", "off"),
          L("Ы", "#FF7A00", "lines", "#B35700", "on", { eyeY: 0.45, mouthY: 0.75 }),
          L("Р", "#A64CFF", "dots", "#6526A8", "off"),
        ],
      },
    ],
  },
  {
    letter: "О",
    words: [
      {
        word: "ОЙЫН",
        emoji: "🎮",
        letters: [
          L("О", "#FF6B2C", "lines", "#B74711", "on", { eyeY: 0.42, mouthY: 0.73 }),
          L("Й", "#7C4DFF", "dots", "#4A2FA3", "off"),
          L("Ы", "#2E86FF", "dots", "#1B4FB5", "on", { eyeY: 0.45, mouthY: 0.75 }),
          L("Н", "#00B884", "lines", "#067A5A", "on", { eyeY: 0.45, mouthY: 0.75 }),
        ],
      },
    ],
  },
  {
    letter: "Ө",
    words: [
      {
        word: "ӨРМЕКШІ",
        emoji: "🕷️",
        letters: [
          L("Ө", "#FF7043", "dots", "#B54D2E", "off"),
          L("Р", "#2E86FF", "dots", "#1B4FB5", "off"),
          L("М", "#26C24A", "lines", "#12802D", "on", { eyeY: 0.44, mouthY: 0.74 }),
          L("Е", "#4F6DFF", "dots", "#2439B8", "on", { eyeY: 0.46, mouthY: 0.75 }),
          L("К", "#A64CFF", "dots", "#6526A8", "off"),
          L("Ш", "#FF8A00", "lines", "#B85D00", "off"),
          L("І", "#00B884", "lines", "#067A5A", "on", { eyeY: 0.44, mouthY: 0.74 }),
        ],
      },
    ],
  },
  {
    letter: "П",
    words: [
      {
        word: "ПІЛ",
        emoji: "🐘",
        letters: [
          L("П", "#78909C", "dots", "#4A5B63", "off"),
          L("І", "#FF6B9D", "lines", "#B83D6E", "on", { eyeY: 0.34, mouthY: 0.72 }),
          L("Л", "#B23CFF", "spots", "#6A1FA8", "off"),
        ],
      },
      {
        word: "ПОЙЫЗ",
        emoji: "🚂",
        letters: [
          L("П", "#5D4037", "lines", "#3E2B24", "off"),
          L("О", "#FF8A00", "lines", "#B85D00", "on", { eyeY: 0.42, mouthY: 0.73 }),
          L("Й", "#2E86FF", "dots", "#1B4FB5", "off"),
          L("Ы", "#26C24A", "lines", "#12802D", "on", { eyeY: 0.45, mouthY: 0.75 }),
          L("З", "#9C27B0", "dots", "#6A1B7A", "off"),
        ],
      },
    ],
  },
  {
    letter: "Р",
    words: [
      {
        word: "РАДИО",
        emoji: "📻",
        letters: [
          L("Р", "#E53935", "dots", "#9E2623", "off"),
          L("А", "#26C24A", "lines", "#12802D", "on", faceA.faceLayout),
          L("Д", "#4F6DFF", "dots", "#2439B8", "off"),
          L("И", "#FF6B9D", "lines", "#B83D6E", "on", { eyeY: 0.34, mouthY: 0.72 }),
          L("О", "#FF8A00", "lines", "#B85D00", "on", { eyeY: 0.42, mouthY: 0.73 }),
        ],
      },
    ],
  },
  {
    letter: "С",
    words: [
      {
        word: "САҒАТ",
        emoji: "🕐",
        letters: [
          L("С", "#2E86FF", "dots", "#1B4FB5", "on", { eyeY: 0.47, mouthY: 0.76 }),
          L("А", "#FF3B3B", "dots", "#B81F1F", "on", faceA.faceLayout),
          L("Ғ", "#8B4513", "lines", "#5C2E0D", "off"),
          L("А", "#26C24A", "lines", "#12802D", "on", faceA.faceLayout),
          L("Т", "#607D8B", "dots", "#3D4F5C", "off"),
        ],
      },
    ],
  },
  {
    letter: "Т",
    words: [
      {
        word: "ТАУЫҚ",
        emoji: "🐔",
        letters: [
          L("Т", "#FF7043", "dots", "#B54D2E", "off"),
          L("А", "#26C24A", "lines", "#12802D", "on", faceA.faceLayout),
          L("У", "#5C9CEE", "dots", "#2E5F9E", "on", { eyeY: 0.44, mouthY: 0.74 }),
          L("Ы", "#A64CFF", "dots", "#6526A8", "on", { eyeY: 0.45, mouthY: 0.75 }),
          L("Қ", "#FF9F1C", "lines", "#B56F0E", "off"),
        ],
      },
    ],
  },
  {
    letter: "У",
    words: [
      {
        word: "УАҚЫТ",
        emoji: "⏰",
        letters: [
          L("У", "#26C24A", "lines", "#12802D", "on", { eyeY: 0.44, mouthY: 0.74 }),
          L("А", "#FF3B3B", "dots", "#B81F1F", "on", faceA.faceLayout),
          L("Қ", "#5C9CEE", "dots", "#2E5F9E", "off"),
          L("Ы", "#FF7A00", "lines", "#B35700", "on", { eyeY: 0.45, mouthY: 0.75 }),
          L("Т", "#7C4DFF", "dots", "#4A2FA3", "off"),
        ],
      },
    ],
  },
  {
    letter: "Ұ",
    words: [
      {
        word: "ҰШАҚ",
        emoji: "✈️",
        letters: [
          L("Ұ", "#FFB000", "lines", "#B37700", "on", { eyeY: 0.45, mouthY: 0.75 }),
          L("Ш", "#A64CFF", "dots", "#6526A8", "off"),
          L("А", "#26C24A", "lines", "#12802D", "on", faceA.faceLayout),
          L("Қ", "#2E86FF", "dots", "#1B4FB5", "off"),
        ],
      },
    ],
  },
  {
    letter: "Ү",
    words: [
      {
        word: "ҮКІ",
        emoji: "🦉",
        letters: [
          L("Ү", "#7C4DFF", "dots", "#4A2FA3", "on", { eyeY: 0.34, mouthY: 0.74 }),
          L("К", "#26C24A", "lines", "#12802D", "off"),
          L("І", "#FF6B9D", "lines", "#B83D6E", "on", { eyeY: 0.34, mouthY: 0.72 }),
        ],
      },
    ],
  },
];

/** Барлық сөздер (ойын + дыбыс preload + LetterPuzzle). */
export const ALL_MENU_WORDS: WordDef[] = WORD_MENU_GROUPS.flatMap(g => g.words);

/** Төменгі деңгейдегі тізім үшін (күшке сәйкес). */
export const WORDS = ALL_MENU_WORDS;

/** Уникалды әріптер дыбыс файлы үшін. */
export function letterCharsFromWords(words: WordDef[]): string[] {
  const set = new Set<string>();
  for (const w of words) {
    for (const L of w.letters) {
      set.add(L.ch);
    }
  }
  return [...set];
}

/** voiced=true деп белгіленген сөздер тізімі (preload үшін). */
export function voicedWordsFromWords(words: WordDef[]): string[] {
  const set = new Set<string>();
  for (const w of words) {
    if (w.voiced) set.add(w.word);
  }
  return [...set];
}
