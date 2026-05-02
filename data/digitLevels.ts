import type { LetterDef, PatternType, WordDef } from "../types";
import { generateTaskInRange } from "../utils/countObjectsTask";
import { shuffleArray } from "../utils/canvas";

function D(
  ch: string,
  color: string,
  pat: PatternType,
  pc: string,
  face: LetterDef["face"] = "off"
): LetterDef {
  return {
    ch,
    color,
    pat,
    pc,
    face,
    ...(face === "on"
      ? { faceLayout: { eyeY: 0.44, mouthY: 0.74 } }
      : {}),
  };
}

/**
 * Қатарлы сандар: len ∈ [2..4], кездейсоқ бастапқы сан (бүтін бір таңбалы 0…9).
 */
function generateOrderedDigitRun(len: number): number[] {
  const L = Math.max(2, Math.min(4, Math.floor(len)));
  const startMax = 9 - L + 1;
  const start = Math.floor(Math.random() * (startMax + 1));
  return Array.from({ length: L }, (_, i) => start + i);
}

/**
 * orderRound: 0 — 2 цифра, 1 — 3, 2 — 4 (деңгей 3-тегі көп раундпен сәйкес).
 */
function resolveDigitOrderForPlay(
  template: WordDef,
  orderRound: number
): WordDef {
  const len = 2 + Math.max(0, Math.min(2, orderRound));
  const sorted = generateOrderedDigitRun(len);
  const sortedCh = sorted.map(n => String(n));
  const wordStr = sortedCh.join("");

  const {
    digitOrderDrag: _dod,
    letters: _l,
    word: _w,
    dragLetters: _dl,
    hideSlotGlyph: _hg,
    objectHint: _oh,
    objectCountDrag: _ocd,
    digitAddDrag: _dad0,
    digitSubtractDrag: _dsd0,
    equationHint: _eqh0,
    ...rest
  } = template;

  const palette: { color: string; pc: string; pat: PatternType }[] = [
    { color: "#E91E8C", pc: "#9C145E", pat: "lines" },
    { color: "#7C4DFF", pc: "#4A2FA3", pat: "dots" },
    { color: "#FF9F1C", pc: "#B56F0E", pat: "spots" },
    { color: "#26C24A", pc: "#12802D", pat: "lines" },
  ];

  const letters = sortedCh.map((ch, i) => {
    const { color, pc, pat } = palette[i % palette.length];
    return D(ch, color, pat, pc);
  });

  let perm = shuffleArray(sorted.map((_, i) => i));
  let guard = 0;
  while (perm.every((p, i) => p === i) && guard++ < 24) {
    perm = shuffleArray(sorted.map((_, i) => i));
  }

  const dragLetters = perm.map(j => {
    const L = letters[j];
    return D(L.ch, L.color, L.pat, L.pc);
  });

  return {
    ...rest,
    word: wordStr,
    letters,
    dragLetters,
    hideSlotGlyph: true,
  };
}

/**
 * Бір таңбалы қосынды: a+b ∈ [2..9], 3–4 дұрыс емес нұсқа scatter-да.
 * exclude — бұл деңгейдегі алдыңғы тапсырмалардың жауабы (сомма қайталанбасын).
 */
function generateAddTask(exclude?: ReadonlySet<number>): {
  a: number;
  b: number;
  sum: number;
  options: number[];
} {
  const validSums = [2, 3, 4, 5, 6, 7, 8, 9].filter(
    s => !exclude?.has(s)
  );
  const sum =
    validSums.length > 0
      ? validSums[Math.floor(Math.random() * validSums.length)]
      : 2 + Math.floor(Math.random() * 8);
  const a = 1 + Math.floor(Math.random() * (sum - 1));
  const b = sum - a;
  const targetSize = Math.random() < 0.5 ? 3 : 4;
  const set = new Set<number>([sum]);
  if (sum > 1) set.add(sum - 1);
  if (sum < 9) set.add(sum + 1);
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => !set.has(n));
  const shuffled = shuffleArray([...pool]);
  while (set.size < targetSize && shuffled.length > 0) {
    const n = shuffled.pop();
    if (n !== undefined) set.add(n);
  }
  while (set.size < 3) {
    const rest = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => !set.has(n));
    if (rest.length === 0) break;
    set.add(rest[Math.floor(Math.random() * rest.length)]);
  }
  return {
    a,
    b,
    sum,
    options: shuffleArray([...set]),
  };
}

function resolveDigitAddForPlay(
  template: WordDef,
  exclude?: ReadonlySet<number>
): WordDef {
  const t = generateAddTask(exclude);
  const ch = String(t.sum);
  const {
    digitAddDrag: _dad,
    digitSubtractDrag: _dsd,
    letters: _l,
    word: _w,
    dragLetters: _dl,
    hideSlotGlyph: _hg,
    objectHint: _oh,
    objectCountDrag: _ocd,
    digitOrderDrag: _dod,
    equationHint: _eh0,
    ...rest
  } = template;

  const palette: { color: string; pc: string; pat: PatternType }[] = [
    { color: "#A64CFF", pc: "#6526A8", pat: "dots" },
    { color: "#26C24A", pc: "#12802D", pat: "lines" },
    { color: "#2E86FF", pc: "#1B4FB5", pat: "dots" },
    { color: "#FF6B2C", pc: "#B74711", pat: "lines" },
    { color: "#E91E8C", pc: "#9C145E", pat: "lines" },
  ];
  const dragLetters = t.options.map((num, i) => {
    const { color, pc, pat } = palette[i % palette.length];
    return D(String(num), color, pat, pc);
  });

  return {
    ...rest,
    word: ch,
    letters: [D(ch, "#7C4DFF", "dots", "#4A2FA3")],
    dragLetters,
    equationHint: { a: t.a, b: t.b, emoji: "🍎", op: "add" },
    hideSlotGlyph: true,
  };
}

/**
 * Бір таңбалы айырма: a−b, нәтиже 1..8, 3–4 дұрыс емес нұсқа scatter-да.
 * exclude — бұл деңгейдегі алдыңғы тапсырмалардың жауабы (айырма қайталанбасын).
 */
function generateSubtractTask(exclude?: ReadonlySet<number>): {
  a: number;
  b: number;
  diff: number;
  options: number[];
} {
  const validDiffs = [1, 2, 3, 4, 5, 6, 7, 8].filter(
    d => !exclude?.has(d)
  );
  const diff =
    validDiffs.length > 0
      ? validDiffs[Math.floor(Math.random() * validDiffs.length)]
      : 1 + Math.floor(Math.random() * 8);
  const bMax = 9 - diff;
  const b = 1 + Math.floor(Math.random() * bMax);
  const a = diff + b;

  const targetSize = Math.random() < 0.5 ? 3 : 4;
  const set = new Set<number>([diff]);
  if (diff > 1) set.add(diff - 1);
  if (diff < 9) set.add(diff + 1);
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => !set.has(n));
  const shuffled = shuffleArray([...pool]);
  while (set.size < targetSize && shuffled.length > 0) {
    const n = shuffled.pop();
    if (n !== undefined) set.add(n);
  }
  while (set.size < 3) {
    const rest = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => !set.has(n));
    if (rest.length === 0) break;
    set.add(rest[Math.floor(Math.random() * rest.length)]);
  }
  return {
    a,
    b,
    diff,
    options: shuffleArray([...set]),
  };
}

function resolveDigitSubtractForPlay(
  template: WordDef,
  exclude?: ReadonlySet<number>
): WordDef {
  const t = generateSubtractTask(exclude);
  const ch = String(t.diff);
  const {
    digitSubtractDrag: _dsd,
    letters: _l,
    word: _w,
    dragLetters: _dl,
    hideSlotGlyph: _hg,
    objectHint: _oh,
    objectCountDrag: _ocd,
    digitOrderDrag: _dod,
    digitAddDrag: _dad,
    equationHint: _eh0,
    ...rest
  } = template;

  const palette: { color: string; pc: string; pat: PatternType }[] = [
    { color: "#A64CFF", pc: "#6526A8", pat: "dots" },
    { color: "#26C24A", pc: "#12802D", pat: "lines" },
    { color: "#2E86FF", pc: "#1B4FB5", pat: "dots" },
    { color: "#FF6B2C", pc: "#B74711", pat: "lines" },
    { color: "#E91E8C", pc: "#9C145E", pat: "lines" },
  ];
  const dragLetters = t.options.map((num, i) => {
    const { color, pc, pat } = palette[i % palette.length];
    return D(String(num), color, pat, pc);
  });

  return {
    ...rest,
    word: ch,
    letters: [D(ch, "#7C4DFF", "dots", "#4A2FA3")],
    dragLetters,
    equationHint: { a: t.a, b: t.b, emoji: "🍎", op: "subtract" },
    hideSlotGlyph: true,
  };
}

/**
 * Цифрлық деңгейді ойынға дайындау: objectCountDrag — кездейсоқ count,
 * бір слот (жасырын контур), 3–4 пернетақта цифрасы scatter-да (саны ұқсас нұсқалар).
 * digitOrderDrag — қатарлы сандарды өсу ретімен қайта сборка.
 * digitAddDrag — қосу a+b; digitSubtractDrag — азайту a−b; equationHint.
 */
/**
 * digitOrderRound: тек қана «Порядок чисел» үшін — 0=2 цифра, 1=3, 2=4.
 */
export function resolveDigitLevelForPlay(
  template: WordDef,
  options?: {
    digitOrderRound?: number;
    /** Бір деңгейдегі алдыңғы тапсырмалардың дұрыс жауабы (санау/қосу/азайту қайталанбасын). */
    excludeAnswers?: readonly number[];
  }
): WordDef {
  const excludeSet =
    options?.excludeAnswers && options.excludeAnswers.length > 0
      ? new Set(options.excludeAnswers)
      : undefined;

  if (template.digitOrderDrag) {
    return resolveDigitOrderForPlay(
      template,
      options?.digitOrderRound ?? 0
    );
  }
  if (template.digitAddDrag) {
    return resolveDigitAddForPlay(template, excludeSet);
  }
  if (template.digitSubtractDrag) {
    return resolveDigitSubtractForPlay(template, excludeSet);
  }
  if (!template.objectCountDrag) {
    return template;
  }
  const { emoji, min = 1, max = 7 } = template.objectCountDrag;
  const t = generateTaskInRange(min, max, excludeSet);
  const n = t.count;
  const ch = String(n);
  const {
    objectCountDrag: _ocd,
    objectHint: _oh,
    letters: _l,
    word: _w,
    dragLetters: _dl,
    hideSlotGlyph: _hg,
    digitOrderDrag: _dod,
    digitAddDrag: _dad,
    digitSubtractDrag: _dsd,
    equationHint: _eqh,
    ...rest
  } = template;

  const palette: { color: string; pc: string; pat: PatternType }[] = [
    { color: "#A64CFF", pc: "#6526A8", pat: "dots" },
    { color: "#26C24A", pc: "#12802D", pat: "lines" },
    { color: "#2E86FF", pc: "#1B4FB5", pat: "dots" },
    { color: "#FF6B2C", pc: "#B74711", pat: "lines" },
    { color: "#E91E8C", pc: "#9C145E", pat: "lines" },
  ];
  const shuffled = shuffleArray([...t.options]);
  const dragLetters = shuffled.map((num, i) => {
    const { color, pc, pat } = palette[i % palette.length];
    return D(String(num), color, pat, pc);
  });

  return {
    ...rest,
    word: ch,
    letters: [D(ch, "#7C4DFF", "dots", "#4A2FA3")],
    dragLetters,
    objectHint: { count: n, emoji },
    hideSlotGlyph: true,
  };
}

/** DIGIT_LEVELS индексы: «Порядок чисел» (раунд 0→2 цифры, 1→3, 2→4). */
export const DIGIT_ORDER_LEVEL_INDEX = 2;
/** DIGIT_LEVELS индексы: «Қосу». */
export const DIGIT_ADD_LEVEL_INDEX = 3;
/** DIGIT_LEVELS индексы: «Азайту». */
export const DIGIT_SUBTRACT_LEVEL_INDEX = 4;

/**
 * Сан бөлімі: 5 деңгей, сол буквалар пазлы сияқты drag-and-drop.
 * Дыбыс файлдары қажет емес — voiced: false.
 */
export const DIGIT_LEVELS: WordDef[] = [
  {
    word: "0123456789",
    puzzleTitle: "Сандармен танысу",
    menuSubtitle: "",
    levelNumber: 1,
    emoji: "🔢",
    voiced: false,
    letters: [
      D("0", "#FF3B3B", "dots", "#B81F1F"),
      D("1", "#26C24A", "lines", "#12802D"),
      D("2", "#2E86FF", "dots", "#1B4FB5"),
      D("3", "#FF6B2C", "lines", "#B74711"),
      D("4", "#E91E8C", "lines", "#9C145E"),
      D("5", "#7C4DFF", "dots", "#4A2FA3"),
      D("6", "#FF9F1C", "spots", "#B56F0E"),
      D("7", "#5E7BFF", "spots", "#2E45B3"),
      D("8", "#A64CFF", "dots", "#6526A8"),
      D("9", "#00A896", "lines", "#006B63"),
    ],
  },
  {
    word: "0",
    puzzleTitle: "Заттарды санау",
    menuSubtitle: "",
    levelNumber: 2,
    emoji: "🍎",
    voiced: false,
    objectCountDrag: { emoji: "🍎", min: 1, max: 7 },
    letters: [D("0", "#A64CFF", "dots", "#6526A8")],
  },
  {
    word: "456",
    puzzleTitle: "Сандар реті",
    menuSubtitle: "",
    levelNumber: 3,
    emoji: "📊",
    voiced: false,
    digitOrderDrag: true,
    letters: [
      D("4", "#E91E8C", "lines", "#9C145E"),
      D("5", "#7C4DFF", "dots", "#4A2FA3"),
      D("6", "#FF9F1C", "spots", "#B56F0E"),
    ],
  },
  {
    word: "+",
    puzzleTitle: "Қосу",
    menuSubtitle: "",
    levelNumber: 4,
    emoji: "➕",
    voiced: false,
    digitAddDrag: true,
    letters: [D("0", "#7C4DFF", "dots", "#4A2FA3")],
  },
  {
    word: "−",
    puzzleTitle: "Азайту",
    menuSubtitle: "",
    levelNumber: 5,
    emoji: "➖",
    voiced: false,
    digitSubtractDrag: true,
    letters: [D("0", "#7C4DFF", "dots", "#4A2FA3")],
  },
];
