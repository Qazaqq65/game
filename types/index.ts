export type PatternType = "dots" | "spots" | "lines";

export interface LetterFaceLayout {
  eyeY?: number;
  eyeLX?: number;
  eyeRX?: number;
  eyeRx?: number;
  eyeRy?: number;
  pupilR?: number;
  pupilDown?: number;
  mouthY?: number;
  mouthL?: number;
  mouthR?: number;
  mouthOpenDepth?: number;
  mouthSmileDepth?: number;
  cheekY?: number;
  cheekLX?: number;
  cheekRX?: number;
  cheekR?: number;
  cheekOpacity?: number;
}

export type LetterVisualState = "idle" | "drag" | "hover" | "win";

export interface LetterSvgSet {
  idle?: string;
  drag?: string;
  hover?: string;
  win?: string;
}

export interface LetterDef {
  ch: string;
  color: string;
  pat: PatternType;
  pc: string; // pattern color (darker shade)
  face?: "auto" | "on" | "off";
  faceLayout?: LetterFaceLayout;
  svg?: LetterSvgSet;
}

export interface WordDef {
  word: string;
  /** Меню / жеңіс: адам оқитын тақырып (бос болса `word`) */
  puzzleTitle?: string;
  /** Меню карточкасының астына қысқа сипаттама */
  menuSubtitle?: string;
  /** Режим «Цифры»: деңгей нөмірі (1, 2, …) */
  levelNumber?: number;
  emoji: string;
  /** Optional SVG path from /public (e.g. "/svg/rooster.svg") — shown instead of emoji in menu cards */
  svgSrc?: string;
  letters: LetterDef[];
  /**
   * Сөздің mp3 дыбысы public/sounds/ ішінде бар-жоғын белгілейді.
   * Файл атауы — сөздің бірінші әрпі бас, қалғаны — кіші (мысалы "Алма.MP3").
   */
  voiced?: boolean;
  /**
   * «Счёт заттар»: min..max аралығындағы сан әр ойында кездейсоқ,
   * `objectHint` арқылы көрсетіледі; пазл — дұрыс цифраны drag-and-drop.
   */
  objectCountDrag?: { emoji: string; min: number; max: number };
  /** Тек ойын экраны: неше зат көрсету керек (генерациядан кейін) */
  objectHint?: { count: number; emoji: string };
  /**
   * Scatter плиткалары: ұзындығы `letters` (слоттар) ұзындығынан үлкен болуы мүмкін.
   * idx плитка осы массивке сілтейді; слотқа сайкестікі `letters[слот]` арқылы тексеріледі.
   */
  dragLetters?: LetterDef[];
  /**
   * «Порядок бойынша»: 2–3 қатарлы бүтін сан (0…9), scatter-да аралас,
   * орындарын өсу ретімен қою керек (слоттар солдан оңға).
   */
  digitOrderDrag?: true;
  /**
   * «Қосу»: ойын барысында `equationHint` — a + b = ? , бір слотқа жауап цифрасы.
   */
  digitAddDrag?: true;
  /** «Азайту»: a − b = ? , `equationHint.op` — «subtract». */
  digitSubtractDrag?: true;
  /**
   * Тек ойын: a ± b = ?; emoji — төменгі жолдағы бейне (мысалы 🍎).
   * `op` берілмесе — қосу.
   */
  equationHint?: {
    a: number;
    b: number;
    emoji?: string;
    op?: "add" | "subtract";
  };
  /** true — GhostSlot контурында дұрыс әріп/цифр көрсетілмейді (сан санау). */
  hideSlotGlyph?: boolean;
}

export interface TileState {
  /** Индекс буквы в слове (какая это копия буквы / стиль). Не обязан совпадать со слотом — одинаковые буквы взаимозаменяемы. */
  idx: number;
  x: number;
  y: number;
  rot: number;
  scale: number;
  snapped: boolean;
  /** Какой слот (0..n-1) занимает плитка после snap; null если в «куче». */
  atSlot: number | null;
  // original scatter position (used to return tile on drop miss)
  ox: number;
  oy: number;
  or: number;
  isNearTarget: boolean;
  phase: "idle" | "dragging" | "hovered" | "snapped" | "returning";
}

export interface SlotPosition {
  x: number;
  y: number;
}

export interface DragState {
  tileIdx: number;
  offsetX: number;
  offsetY: number;
  pointerId: number;
}
