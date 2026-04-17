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
  emoji: string;
  letters: LetterDef[];
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
