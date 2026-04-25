import React from "react";
import {
  playWordPronunciation,
  startSound,
  stopSound,
  stopWordPronunciation,
} from "../utils/sound";
import {
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import type {
  TileState,
  SlotPosition,
  DragState,
  WordDef,
  LetterDef,
} from "../types";
import type { ShellContentInsets, SlotArcOptions } from "../utils/canvas";
import {
  computeSlotPositions,
  computeScatterPositions,
  shuffleArray,
  clampTileTopLeft,
} from "../utils/canvas";

/** АРЫСТАН, ЗЫМЫРАН: буквалар жақын, дуга күштірек (бір стиль). */
const COMPACT_ARC_WORDS = new Set(["АРЫСТАН", "ЗЫМЫРАН"]);

// ── Жеңіс «оқу толқыны» (reading wave) таймині ─────────────────────
// Сөз жиналған соң, дыбыс басталар алдында толқын кезек-кезек ағады:
// әр буква WAVE_STEP_MS-тен кейін секіреді, өзі ~720мс анимацияланады
// (DraggableTile.module.css → .readingWaveActive).
const WAVE_STEP_MS = 230;
const WAVE_LETTER_MS = 720;
/** Соңғы буква секіріп болған соң WinScreen ашылғанға дейінгі қысқа кідіріс. */
const WAVE_TAIL_MS = 280;
/** Snap анимациясы аяқталғанша күтеміз (≈SNAP_SETTLE_MS), сосын толқын/дыбыс. */
const PRONOUNCE_LEAD_IN_MS = 480;
/** Дыбыс бітті — WinScreen-ге өтер алдында «дем алу» паузасы. */
const PRONOUNCE_TAIL_MS = 380;
/** "end" оқиғасы шықпай қалса, бұдан кейін WinScreen-ге сөзсіз өтеміз. */
const PRONOUNCE_FALLBACK_MS = 4500;

function readingWaveDurationMs(letterCount: number): number {
  return Math.max(0, letterCount - 1) * WAVE_STEP_MS + WAVE_LETTER_MS;
}

function slotLayoutForWord(word: string): {
  gapX: number;
  arcOpts: SlotArcOptions | undefined;
} {
  if (COMPACT_ARC_WORDS.has(word.trim().toUpperCase())) {
    return { gapX: 0, arcOpts: { arcLiftScale: 1.72 } };
  }
  return { gapX: 10, arcOpts: undefined };
}

/** Дәл шетінде 0, ортасына жақындағанда үдемелі тарту — секірмелі «магнит» жоқ */
const MAGNET_ZONE_PX = 20;
/** Тарту әлсіз болғанда саусақпен дәл келтіру оңай болуы үшін snap сәл кеңірек */
const SNAP_RELEASE_PX = 88;
/** DraggableTile ішіндегі snapped transition ұзақтығымен синхрон (ms) */
const SNAP_SETTLE_MS = 440;
/** Тарту кезінде: саусақ букваны жаппас үшін touch-та ірірек */
const DRAG_SCALE_MOUSE = 1.22;
const DRAG_SCALE_TOUCH = 1.52;
const DRAG_TOUCH_FINGER_LIFT_PX = 104;

function dragScaleForPointer(pointerType: string): number {
  return pointerType === "touch" ? DRAG_SCALE_TOUCH : DRAG_SCALE_MOUSE;
}

function dragLiftForPointer(pointerType: string): number {
  return pointerType === "touch" ? DRAG_TOUCH_FINGER_LIFT_PX : 0;
}

// ── Drag деформациясы (stretch / squash / tilt) ─────────────────────
// Тасымалдау кезінде буква жылдамдыққа қарай созылады/қысылады/еңкейеді.
// Бәрі RAF + DOM арқылы — React state қозғалмайды, ререндер 0.

interface DragDeformConfig {
  /** Жылдамдыққа қарай созылу мөлшері (0..2, 1 = қалыпты). */
  stretch: number;
  /** Көлденең жылдамдыққа қарай еңкею мөлшері (0..2, 1 = қалыпты). */
  tilt: number;
  /** Демалысқа қайту жылдамдығы — кіші = серпімдірек (0.1..0.5). */
  lerp: number;
}

const DEFORM_DEFAULT: DragDeformConfig = { stretch: 1, tilt: 1, lerp: 0.35 };

const DEFORM_BY_LETTER: Record<string, Partial<DragDeformConfig>> = {
  "Ж": { stretch: 1.5, tilt: 0.4 },
  "Т": { tilt: 1.6, stretch: 0.7 },
  "О": { stretch: 0.5, tilt: 0.6 },
  "Л": { stretch: 1.4, lerp: 0.22 },
  "А": { stretch: 0.7, tilt: 0.8 },
  "Ә": { stretch: 1.3, tilt: 1.4, lerp: 0.25 },
  "И": { stretch: 1.6, tilt: 0.3 },
  "М": { stretch: 1.2, tilt: 1.0 },
  "С": { stretch: 0.7, tilt: 1.3 },
  "Е": { stretch: 0.9, tilt: 1.1 },
};

function getDeformConfig(ch: string): DragDeformConfig {
  const override = DEFORM_BY_LETTER[ch];
  if (!override) return DEFORM_DEFAULT;
  return { ...DEFORM_DEFAULT, ...override };
}

/** Жылдамдық (px/ms) → stretch коэффициенті */
const VEL_STRETCH_K = 0.45;
const VEL_STRETCH_MAX = 0.3;
/** Көлденең жылдамдық → наклон (градус) */
const VEL_TILT_K = 16;
const VEL_TILT_MAX = 18;
/** Near-target кезінде деформация басылады (0..1) */
const NEAR_TARGET_DAMPING = 0.2;

// ── Personality: буква қолда тұрғанда тіпті қозғалмай-ақ «тірі» ──────
// Әр буквада өзіндік мінез: дірілдейді, тыныстайды, секіреді, т.б.
// Уақытқа тәуелді sin/cos — React state жоқ, тек RAF + DOM.

type PersonalityType = "wobble" | "bounce" | "twist" | "breathe" | "jitter" | "sway" | "mirror" | "mirrorY" | "stretch" | "stretchX";

interface DragPersonality {
  type: PersonalityType;
  amp: number;
  speed: number;
}

const PERS_DEFAULT: DragPersonality = { type: "wobble", amp: 1.2, speed: 1.1 };

const PERS_BY_LETTER: Record<string, DragPersonality> = {
  "Ж": { type: "jitter", amp: 1.5, speed: 1.5 },
  "Т": { type: "stretch", amp: 1.5, speed: 2.5 },
  "О": { type: "breathe", amp: 1.3, speed: 1.0 },
  "Л": { type: "bounce", amp: 1.5, speed: 1.2 },
  "А": { type: "wobble", amp: 1.2, speed: 0.8 },
  "Ә": { type: "twist",  amp: 1.6, speed: 1.3 },
  "И": { type: "twist",  amp: 1.3, speed: 1.0 },
  "М": { type: "breathe", amp: 1.8, speed: 1.6 },
  "С": { type: "sway",   amp: 1.4, speed: 1.2 },
  "Е": { type: "breathe", amp: 1.3, speed: 1.1 },
  "Н": { type: "stretchX", amp: 1.4, speed: 1.2 },
  "К": { type: "jitter", amp: 1.1, speed: 1.4 },
  "Р": { type: "mirror", amp: 1.3, speed: 0.6 },
  "Б": { type: "wobble", amp: 1.3, speed: 1.1 },
  "У": { type: "breathe", amp: 1.2, speed: 0.85 },
  "Ы": { type: "mirrorY", amp: 1.3, speed: 0.6 },
  "Д": { type: "jitter", amp: 1.0, speed: 1.2 },
  "Ш": { type: "twist",  amp: 1.2, speed: 1.1 },
  "Қ": { type: "sway",   amp: 1.2, speed: 0.9 },
  "Ұ": { type: "bounce", amp: 1.4, speed: 1.1 },
  "Ү": { type: "twist",  amp: 1.4, speed: 1.2 },
  "Ң": { type: "jitter", amp: 1.1, speed: 1.3 },
  "Ғ": { type: "sway",   amp: 1.0, speed: 1.0 },
};

function computePersonality(
  ch: string,
  timeSec: number
): { sx: number; sy: number; tilt: number } {
  const p = PERS_BY_LETTER[ch] ?? PERS_DEFAULT;
  const t = timeSec * p.speed;
  const a = p.amp;

  switch (p.type) {
    case "wobble":
      return {
        sx: 1 + Math.sin(t * 3.2) * 0.13 * a,
        sy: 1 + Math.cos(t * 2.8) * 0.13 * a,
        tilt: Math.sin(t * 2.5) * 12 * a,
      };
    case "bounce": {
      const bounceY = Math.abs(Math.sin(t * 3.5));
      return {
        sx: 1 - bounceY * 0.10 * a,
        sy: 1 + bounceY * 0.18 * a,
        tilt: Math.sin(t * 1.8) * 7 * a,
      };
    }
    case "twist":
      return {
        sx: 1 + Math.sin(t * 2.2) * 0.16 * a,
        sy: 1 - Math.sin(t * 2.2) * 0.16 * a,
        tilt: Math.sin(t * 3.0) * 14 * a,
      };
    case "breathe": {
      const breath = Math.sin(t * 2.0) * 0.14 * a;
      return {
        sx: 1 + breath,
        sy: 1 + breath,
        tilt: Math.sin(t * 1.5) * 5 * a,
      };
    }
    case "jitter":
      return {
        sx: 1 + (Math.sin(t * 7.3) * 0.09 + Math.sin(t * 11.1) * 0.06) * a,
        sy: 1 + (Math.cos(t * 8.7) * 0.09 + Math.cos(t * 13.3) * 0.06) * a,
        tilt: (Math.sin(t * 5.5) * 8 + Math.sin(t * 9.1) * 5) * a,
      };
    case "sway":
      return {
        sx: 1 + Math.sin(t * 1.8) * 0.10 * a,
        sy: 1,
        tilt: Math.sin(t * 1.5) * 15 * a + Math.sin(t * 3.7) * 5 * a,
      };
    case "mirror": {
      const flip = Math.cos(t * 1.8) * a;
      return {
        sx: flip,
        sy: 1 + Math.sin(t * 2.4) * 0.06 * a,
        tilt: 0,
      };
    }
    case "mirrorY": {
      const flipY = Math.cos(t * 1.8) * a;
      return {
        sx: 1 + Math.sin(t * 2.4) * 0.06 * a,
        sy: flipY,
        tilt: 0,
      };
    }
    case "stretch": {
      const s = Math.sin(t * 2.0);
      return {
        sx: 1 - s * 0.15 * a,
        sy: 1 + s * 0.50 * a,
        tilt: Math.sin(t * 1.3) * 3 * a,
      };
    }
    case "stretchX": {
      const s = Math.sin(t * 2.0);
      return {
        sx: 1 + s * 0.45 * a,
        sy: 1 - s * 0.12 * a,
        tilt: 0,
      };
    }
  }
}

/** Ориентация / өлшем өзгергенде слоттар мен прогресті сақтап координаталарды жаңарту */
function relayoutPreserveProgress(
  prevTiles: TileState[],
  prevW: number,
  prevH: number,
  prevTileSize: number,
  newW: number,
  newH: number,
  newTileSize: number,
  letterCount: number,
  contentInsets: ShellContentInsets | null,
  gapX: number,
  arcOpts?: SlotArcOptions | null
): { slots: SlotPosition[]; tiles: TileState[] } {
  const n = letterCount;
  const newSlots = computeSlotPositions(
    n,
    newW,
    newH,
    newTileSize,
    gapX,
    contentInsets,
    arcOpts
  );
  const scaleX = prevW > 0 ? newW / prevW : 1;
  const scaleY = prevH > 0 ? newH / prevH : 1;
  const oldHalf = prevTileSize / 2;
  const newHalf = newTileSize / 2;

  const newTiles = prevTiles.map(t => {
    if (t.snapped && t.atSlot != null) {
      const sp = newSlots[t.atSlot];
      if (!sp) return t;
      return {
        ...t,
        x: sp.x,
        y: sp.y,
        rot: 0,
        scale: 1,
        ox: sp.x,
        oy: sp.y,
        or: 0,
        isNearTarget: false,
        phase: "idle" as const,
      };
    }
    const rawNx = (t.x + oldHalf) * scaleX - newHalf;
    const rawNy = (t.y + oldHalf) * scaleY - newHalf;
    const c = clampTileTopLeft(rawNx, rawNy, newW, newH, newTileSize, {
      margin: 6,
      scale: 1,
    });
    return {
      ...t,
      x: c.x,
      y: c.y,
      ox: c.x,
      oy: c.y,
      isNearTarget: false,
      phase: t.phase === "dragging" ? ("idle" as const) : t.phase,
    };
  });

  return { slots: newSlots, tiles: newTiles };
}

function draggedTileComputedState(
  rawX: number,
  rawY: number,
  slots: SlotPosition[],
  letters: LetterDef[],
  letterCh: string,
  containerW: number,
  containerH: number,
  tileSize: number,
  dragScale = 1
): {
  x: number;
  y: number;
  isNearTarget: boolean;
  snapSlotIndex: number | null;
  snapDistance: number;
} {
  let magnetSlot: SlotPosition | null = null;
  let rawBestD = Infinity;
  for (let s = 0; s < slots.length; s++) {
    if (letters[s].ch !== letterCh) continue;
    const slot = slots[s];
    if (!slot) continue;
    const d = Math.hypot(slot.x - rawX, slot.y - rawY);
    if (d < rawBestD) {
      rawBestD = d;
      magnetSlot = slot;
    }
  }

  let x = rawX;
  let y = rawY;
  if (magnetSlot && rawBestD < MAGNET_ZONE_PX) {
    const dx = magnetSlot.x - rawX;
    const dy = magnetSlot.y - rawY;
    const t = 1 - rawBestD / MAGNET_ZONE_PX;
    const pull = t * t * 0.035;
    x = rawX + dx * pull;
    y = rawY + dy * pull;
  }

  const cl = clampTileTopLeft(x, y, containerW, containerH, tileSize, {
    margin: 2,
    scale: dragScale,
  });
  x = cl.x;
  y = cl.y;

  let snapSlotIndex: number | null = null;
  let snapDistance = Infinity;
  for (let s = 0; s < slots.length; s++) {
    if (letters[s].ch !== letterCh) continue;
    const slot = slots[s];
    if (!slot) continue;
    const d = Math.hypot(slot.x - x, slot.y - y);
    if (d < snapDistance) {
      snapDistance = d;
      snapSlotIndex = s;
    }
  }

  return {
    x,
    y,
    isNearTarget: magnetSlot != null && rawBestD < 16,
    snapSlotIndex,
    snapDistance,
  };
}

interface UsePuzzleOptions {
  word: WordDef;
  containerW: number;
  containerH: number;
  tileSize: number;
  /** Слот/scatter ішкі жолақ; тасымал толық container шегінде */
  shellContentInsets?: ShellContentInsets | null;
  onComplete?: (word: string) => void;
}

/** Тасымалдау барысында tile массивін әр кадрда қайта құрамаймыз — тек осы координаталар */
export interface DragFrame {
  x: number;
  y: number;
  isNearTarget: boolean;
  /** Деформация: көлденең созылу (1 = қалыпты). */
  sx: number;
  /** Деформация: тік созылу (1 = қалыпты). */
  sy: number;
  /** Деформация: еңкею бұрышы (градус). */
  tilt: number;
}

interface UsePuzzleReturn {
  tiles: TileState[];
  slots: SlotPosition[];
  dragIdx: number | null;
  won: boolean;
  /** Жеңіс кезіндегі «оқу толқыны» белсенді ме (DraggableTile-ге беріледі). */
  readingWave: boolean;
  /** Көршілес буквалар арасындағы стаггер (мс). */
  readingWaveStepMs: number;
  rootRef: React.RefObject<HTMLDivElement | null>;
  onTilePointerDown: (
    e: React.PointerEvent<HTMLDivElement>,
    tileIdx: number
  ) => void;
  onTilePointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onTilePointerEnd: (e: React.PointerEvent<HTMLDivElement>) => void;
  reset: () => void;
}

export function usePuzzle({
  word,
  containerW,
  containerH,
  tileSize,
  shellContentInsets = null,
  onComplete,
}: UsePuzzleOptions): UsePuzzleReturn {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const tilesRef = useRef<TileState[]>([]);
  const dragMoveRafRef = useRef<number | null>(null);
  const dragPendingClientRef = useRef<{ x: number; y: number } | null>(null);
  const slotsRef = useRef<SlotPosition[]>([]);
  const lettersRef = useRef<LetterDef[]>([]);
  const snapTileRef = useRef<
    (tileIdx: number, targetSlotS: number, currentSlots: SlotPosition[]) => void
  >(() => {});

  const [tiles, setTiles] = useState<TileState[]>([]);
  const [slots, setSlots] = useState<SlotPosition[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [won, setWon] = useState(false);
  const [readingWave, setReadingWave] = useState(false);

  const layoutDimsRef = useRef({ w: 0, h: 0, tile: 0 });
  const wordKeyRef = useRef<string | null>(null);
  const containerWRef = useRef(containerW);
  const containerHRef = useRef(containerH);
  const tileSizeRef = useRef(tileSize);
  const dragVisualFrameRef = useRef<DragFrame | null>(null);
  /** Алдыңғы кадрдағы позиция — жылдамдық есебі үшін. */
  const dragPrevPosRef = useRef<{ x: number; y: number; t: number } | null>(null);
  /** Ағымдағы тегіс деформация мәндері (lerp арқылы жаңарады). */
  const dragSmoothRef = useRef({ sx: 1, sy: 1, tilt: 0 });

  /** RAF-цикл id: буква қолда тұрғанда тоқтамай айналады. */
  const dragAnimTickRef = useRef<number | null>(null);

  const applyDragVisual = useCallback((tileIdx: number | null) => {
    if (tileIdx === null) return;
    const frame = dragVisualFrameRef.current;
    const tile = tilesRef.current[tileIdx];
    const root = rootRef.current;
    if (!frame || !tile || !root) return;
    const dragEl = root.querySelector<HTMLDivElement>(
      `[data-tile-index="${tileIdx}"]`
    );
    if (!dragEl) return;

    // velocity deformation + time-based personality → combined
    const letters = lettersRef.current;
    const ch = letters[tile.idx]?.ch ?? "";
    const pers = computePersonality(ch, performance.now() / 1000);
    const finalSx = frame.sx * pers.sx;
    const finalSy = frame.sy * pers.sy;
    const finalTilt = frame.tilt + pers.tilt;

    dragEl.style.transform =
      `translate3d(${frame.x}px, ${frame.y}px, 0) ` +
      `rotate(${(tile.rot + finalTilt).toFixed(2)}deg) ` +
      `scale(${tile.scale}) ` +
      `scaleX(${finalSx.toFixed(4)}) scaleY(${finalSy.toFixed(4)})`;
  }, []);

  const stopDragAnim = useCallback(() => {
    if (dragAnimTickRef.current != null) {
      cancelAnimationFrame(dragAnimTickRef.current);
      dragAnimTickRef.current = null;
    }
  }, []);

  // Буква қолға алынғанда іске қосылатын RAF-цикл.
  // Әр кадр personality анимациясын есептеп DOM-ға жазады,
  // тіпті палец қозғалмаса да буква «тірі» болып көрінеді.
  const startDragAnim = useCallback(
    (tileIdx: number) => {
      stopDragAnim();
      const tick = () => {
        if (dragRef.current == null) return;
        applyDragVisual(tileIdx);
        dragAnimTickRef.current = requestAnimationFrame(tick);
      };
      dragAnimTickRef.current = requestAnimationFrame(tick);
    },
    [applyDragVisual, stopDragAnim]
  );

  /* Оптимизация: бұрын әр рендерде орындалатын еді; тек өлшем өзгергенде синхрондау. */
  useLayoutEffect(() => {
    containerWRef.current = containerW;
    containerHRef.current = containerH;
    tileSizeRef.current = tileSize;
  }, [containerW, containerH, tileSize]);

  useLayoutEffect(
    () => () => {
      if (dragMoveRafRef.current != null) {
        cancelAnimationFrame(dragMoveRafRef.current);
      }
      if (dragAnimTickRef.current != null) {
        cancelAnimationFrame(dragAnimTickRef.current);
      }
      // Сөз жиналып, оның дыбысы ойнап тұрғанда басқа сөзге/басты бетке
      // көшсе — артық дыбыс қалмасын.
      stopWordPronunciation();
    },
    []
  );

  // ── INIT (толық қайта бастау: жаңа сөз немесе reset) ──────────────────

  const buildTilesFresh = useCallback(() => {
    const n = word.letters.length;
    const insets = shellContentInsets;

    const { gapX, arcOpts } = slotLayoutForWord(word.word);
    const newSlots = computeSlotPositions(
      n,
      containerW,
      containerH,
      tileSize,
      gapX,
      insets,
      arcOpts
    );
    const scattered = computeScatterPositions(
      n,
      containerW,
      containerH,
      tileSize,
      insets
    );

    const order = shuffleArray(Array.from({ length: n }, (_, i) => i));

    const newTiles: TileState[] = order.map((letterIdx, posIdx) => ({
      idx: letterIdx,
      x: scattered[posIdx].x,
      y: scattered[posIdx].y,
      rot: scattered[posIdx].r,
      scale: 1,
      snapped: false,
      atSlot: null,
      ox: scattered[posIdx].x,
      oy: scattered[posIdx].y,
      or: scattered[posIdx].r,
      isNearTarget: false,
      phase: "idle",
    }));

    setSlots(newSlots);
    setTiles(newTiles);
    tilesRef.current = newTiles;

    setWon(false);
    setReadingWave(false);
    dragRef.current = null;
    setDragIdx(null);
    dragVisualFrameRef.current = null;
  }, [word, containerW, containerH, tileSize, shellContentInsets]);

  useLayoutEffect(() => {
    const prev = layoutDimsRef.current;
    const firstLayout = prev.w <= 0;
    const wordKey = word.word;
    const wordChanged = wordKeyRef.current !== wordKey;

    if (firstLayout || wordChanged) {
      wordKeyRef.current = wordKey;
      buildTilesFresh();
      layoutDimsRef.current = {
        w: containerW,
        h: containerH,
        tile: tileSize,
      };
      return;
    }

    if (
      prev.w === containerW &&
      prev.h === containerH &&
      prev.tile === tileSize
    ) {
      return;
    }

    const prevTiles = tilesRef.current;
    if (prevTiles.length !== word.letters.length) {
      buildTilesFresh();
      layoutDimsRef.current = {
        w: containerW,
        h: containerH,
        tile: tileSize,
      };
      return;
    }

    const { gapX: gx, arcOpts: ao } = slotLayoutForWord(word.word);
    const { slots: ns, tiles: nt } = relayoutPreserveProgress(
      prevTiles,
      prev.w,
      prev.h,
      prev.tile,
      containerW,
      containerH,
      tileSize,
      word.letters.length,
      shellContentInsets ?? null,
      gx,
      ao
    );
    setSlots(ns);
    setTiles(nt);
    tilesRef.current = nt;
    dragRef.current = null;
    setDragIdx(null);
    dragVisualFrameRef.current = null;
    layoutDimsRef.current = {
      w: containerW,
      h: containerH,
      tile: tileSize,
    };
  }, [
    word.word,
    word.letters.length,
    containerW,
    containerH,
    tileSize,
    buildTilesFresh,
    shellContentInsets,
  ]);

  const checkPuzzleWin = useCallback(
    (next: TileState[]) => {
      const n = word.letters.length;
      if (!next.every(t => t.snapped)) return false;
      const taken = next.map(t => t.atSlot).filter((s): s is number => s !== null);
      if (taken.length !== n || new Set(taken).size !== n) return false;
      return next.every(
        t => t.atSlot !== null && word.letters[t.idx].ch === word.letters[t.atSlot].ch
      );
    },
    [word.letters]
  );

  // ── SNAP ──────────────────────────────────────────────

  const snapTile = useCallback(
    (tileIdx: number, targetSlotS: number, currentSlots: SlotPosition[]) => {
      setTiles(prev => {
        const tile = prev[tileIdx];
        if (!tile || tile.snapped) return prev;

        const ch = word.letters[tile.idx].ch;
        if (word.letters[targetSlotS].ch !== ch) return prev;

        const slotPos = currentSlots[targetSlotS];
        if (!slotPos) return prev;

        const occupantIdx = prev.findIndex(
          (u, i) => i !== tileIdx && u.snapped && u.atSlot === targetSlotS
        );

        const settleSnapPhase = (indices: number[]) => {
          setTimeout(() => {
            setTiles(p =>
              p.map((t, i) =>
                indices.includes(i) ? { ...t, phase: "idle" as const } : t
              )
            );
          }, SNAP_SETTLE_MS);
        };

        let next: TileState[];

        if (occupantIdx === -1) {
          next = prev.map((t, i) =>
            i === tileIdx
              ? {
                  ...t,
                  x: slotPos.x,
                  y: slotPos.y,
                  rot: 0,
                  scale: 1,
                  snapped: true,
                  atSlot: targetSlotS,
                  isNearTarget: false,
                  phase: "snapped",
                }
              : t
          );
          settleSnapPhase([tileIdx]);
        } else {
          const matchIdxs = word.letters
            .map((l, i) => (l.ch === ch ? i : -1))
            .filter(i => i >= 0);
          let sOther = matchIdxs.find(si => {
            if (si === targetSlotS) return false;
            const taken = prev.findIndex(
              (u, i2) => i2 !== tileIdx && u.snapped && u.atSlot === si
            );
            return taken === -1;
          });
          if (sOther === undefined) {
            sOther = matchIdxs.find(si => si !== targetSlotS);
          }
          if (sOther === undefined) return prev;

          const otherPos = currentSlots[sOther];
          if (!otherPos) return prev;

          next = prev.map((t, i) => {
            if (i === tileIdx) {
              return {
                ...t,
                x: slotPos.x,
                y: slotPos.y,
                rot: 0,
                scale: 1,
                snapped: true,
                atSlot: targetSlotS,
                isNearTarget: false,
                phase: "snapped",
              };
            }
            if (i === occupantIdx) {
              return {
                ...t,
                x: otherPos.x,
                y: otherPos.y,
                rot: 0,
                scale: 1,
                snapped: true,
                atSlot: sOther,
                isNearTarget: false,
                phase: "snapped",
              };
            }
            return t;
          });
          settleSnapPhase([tileIdx, occupantIdx]);
        }

        tilesRef.current = next;

        if (checkPuzzleWin(next)) {
          onComplete?.(word.word);
          stopSound();

          let advanced = false;
          const advance = () => {
            if (advanced) return;
            advanced = true;
            setReadingWave(false);
            setWon(true);
          };

          // 1) Соңғы әріп snap болғанда бірден қозғалмаймыз — snap анимациясы
          //    тынышталғанша (≈SNAP_SETTLE_MS) кідіреміз.
          // 2) Сосын: «оқу толқыны» қосылады (буквалар кезек-кезек секіреді)
          //    + сөздің mp3 дыбысы (бар болса) бірге басталады.
          // 3) Дыбыс/толқын аяқталған соң қысқа тыныс паузасы → WinScreen.
          const n = word.letters.length;
          const waveDur = readingWaveDurationMs(n);

          setTimeout(() => {
            setReadingWave(true);

            const started = playWordPronunciation(word.word, () => {
              setTimeout(advance, PRONOUNCE_TAIL_MS);
            });
            if (started) {
              setTimeout(advance, PRONOUNCE_FALLBACK_MS);
            } else {
              // Дыбыс жоқ — кем дегенде толқын аяқталғанша күтеміз.
              setTimeout(advance, waveDur + WAVE_TAIL_MS);
            }
          }, PRONOUNCE_LEAD_IN_MS);
        }

        return next;
      });
    },
    [word, onComplete, checkPuzzleWin]
  );

  useLayoutEffect(() => {
    slotsRef.current = slots;
    lettersRef.current = word.letters;
    snapTileRef.current = snapTile;
  }, [slots, word.letters, snapTile]);

  const flushDragMove = useCallback(() => {
    dragMoveRafRef.current = null;
    const p = dragPendingClientRef.current;
    const ds = dragRef.current;
    if (!p || !ds) return;

    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;

    const rawX = p.x - rect.left - ds.offsetX;
    const rawY = p.y - rect.top - ds.offsetY;

    const tile = tilesRef.current[ds.tileIdx];
    if (!tile) return;

    const letters = lettersRef.current;
    const ch = letters[tile.idx]?.ch;
    if (!ch) return;

    const comp = draggedTileComputedState(
      rawX,
      rawY,
      slotsRef.current,
      letters,
      ch,
      containerWRef.current,
      containerHRef.current,
      tileSizeRef.current,
      tile.scale
    );

    // ── Деформация: жылдамдық → stretch / squash / tilt ──
    const now = performance.now();
    const prev = dragPrevPosRef.current;
    let vx = 0;
    let vy = 0;
    if (prev) {
      const dt = Math.max(1, now - prev.t);
      vx = (comp.x - prev.x) / dt;
      vy = (comp.y - prev.y) / dt;
    }
    dragPrevPosRef.current = { x: comp.x, y: comp.y, t: now };

    const cfg = getDeformConfig(ch);

    // Жылдамдық бойынша басым бағытта созылу, перпендикулярда қысылу
    const speed = Math.hypot(vx, vy);
    const stretchAmt = Math.min(VEL_STRETCH_MAX, speed * VEL_STRETCH_K) * cfg.stretch;

    let targetSx: number;
    let targetSy: number;
    if (speed > 0.01) {
      const ratioX = Math.abs(vx) / speed;
      const ratioY = Math.abs(vy) / speed;
      // Басым бағытта созылу, перпендикулярда — қысылу (аудан ≈ const)
      targetSx = 1 + stretchAmt * ratioX - stretchAmt * ratioY * 0.5;
      targetSy = 1 + stretchAmt * ratioY - stretchAmt * ratioX * 0.5;
    } else {
      targetSx = 1;
      targetSy = 1;
    }

    const targetTilt = Math.max(
      -VEL_TILT_MAX,
      Math.min(VEL_TILT_MAX, vx * VEL_TILT_K * cfg.tilt)
    );

    // Near-target кезінде деформация басылады — буква «жиналады»
    const damp = comp.isNearTarget ? NEAR_TARGET_DAMPING : 1;
    const restSx = 1 + (targetSx - 1) * damp;
    const restSy = 1 + (targetSy - 1) * damp;
    const restTilt = targetTilt * damp;

    // Lerp — тегіс өту (жоғарырақ = тезірек жауап)
    const sm = dragSmoothRef.current;
    const lp = cfg.lerp;
    sm.sx += (restSx - sm.sx) * lp;
    sm.sy += (restSy - sm.sy) * lp;
    sm.tilt += (restTilt - sm.tilt) * lp;

    // Өте аз мәнде snap to rest — дірілдемейді
    if (Math.abs(sm.sx - 1) < 0.001) sm.sx = 1;
    if (Math.abs(sm.sy - 1) < 0.001) sm.sy = 1;
    if (Math.abs(sm.tilt) < 0.05) sm.tilt = 0;

    dragVisualFrameRef.current = {
      x: comp.x,
      y: comp.y,
      isNearTarget: comp.isNearTarget,
      sx: sm.sx,
      sy: sm.sy,
      tilt: sm.tilt,
    };
    applyDragVisual(ds.tileIdx);
  }, [applyDragVisual]);

  const finishDragFromPointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const ds = dragRef.current;
      if (!ds || e.pointerId !== ds.pointerId) return;

      stopDragAnim();
      if (dragMoveRafRef.current != null) {
        cancelAnimationFrame(dragMoveRafRef.current);
        dragMoveRafRef.current = null;
      }
      dragPendingClientRef.current = null;

      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* capture әлдеқашан жойылған */
      }

      stopSound();

      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) {
        dragRef.current = null;
        setDragIdx(null);
        dragVisualFrameRef.current = null;
        return;
      }

      const clientX = e.clientX;
      const clientY = e.clientY;
      const rawX = clientX - rect.left - ds.offsetX;
      const rawY = clientY - rect.top - ds.offsetY;

      const tile = tilesRef.current[ds.tileIdx];
      if (!tile) {
        dragRef.current = null;
        setDragIdx(null);
        dragVisualFrameRef.current = null;
        return;
      }

      const letters = lettersRef.current;
      const ch = letters[tile.idx].ch;
      const comp = draggedTileComputedState(
        rawX,
        rawY,
        slotsRef.current,
        letters,
        ch,
        containerWRef.current,
        containerHRef.current,
        tileSizeRef.current,
        tile.scale
      );

      const savedIdx = ds.tileIdx;
      dragRef.current = null;
      setDragIdx(null);
      dragVisualFrameRef.current = null;

      if (
        comp.snapSlotIndex !== null &&
        comp.snapDistance < SNAP_RELEASE_PX
      ) {
        snapTileRef.current(savedIdx, comp.snapSlotIndex, slotsRef.current);
        return;
      }

      setTiles(prev => {
        const next: TileState[] = prev.map((t, i) =>
          i === savedIdx
            ? {
                ...t,
                x: comp.x,
                y: comp.y,
                scale: 1,
                ox: comp.x,
                oy: comp.y,
                or: t.rot,
                snapped: false,
                atSlot: null,
                isNearTarget: false,
                phase: "idle",
              }
            : t
        );
        tilesRef.current = next;
        return next;
      });
    },
    [stopDragAnim]
  );

  const onTilePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, tileIdx: number) => {
      const tile = tilesRef.current[tileIdx];
      if (!tile || tile.snapped) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.cancelable) e.preventDefault();

      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);

      const letters = lettersRef.current;
      startSound(letters[tile.idx].ch);

      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          /* noop */
        }
        return;
      }

      const clientX = e.clientX;
      const clientY = e.clientY;
      const offsetX = clientX - rect.left - tile.x;
      const offsetY = clientY - rect.top - tile.y + dragLiftForPointer(e.pointerType);

      dragRef.current = {
        tileIdx,
        offsetX,
        offsetY,
        pointerId: e.pointerId,
      };

      const rawX = clientX - rect.left - offsetX;
      const rawY = clientY - rect.top - offsetY;
      const ch = letters[tile.idx].ch;
      const dragScale = dragScaleForPointer(e.pointerType);
      const comp = draggedTileComputedState(
        rawX,
        rawY,
        slotsRef.current,
        letters,
        ch,
        containerWRef.current,
        containerHRef.current,
        tileSizeRef.current,
        dragScale
      );

      setDragIdx(tileIdx);
      dragPrevPosRef.current = null;
      dragSmoothRef.current = { sx: 1, sy: 1, tilt: 0 };
      dragVisualFrameRef.current = {
        x: comp.x,
        y: comp.y,
        isNearTarget: comp.isNearTarget,
        sx: 1,
        sy: 1,
        tilt: 0,
      };

      setTiles(prev => {
        const next: TileState[] = prev.map((t, i) =>
          i === tileIdx
            ? { ...t, rot: 0, scale: dragScale, phase: "dragging" }
            : t
        );
        tilesRef.current = next;
        return next;
      });
      startDragAnim(tileIdx);
    },
    [startDragAnim]
  );

  const onTilePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const ds = dragRef.current;
      if (!ds || e.pointerId !== ds.pointerId) return;
      if (e.cancelable) e.preventDefault();

      dragPendingClientRef.current = { x: e.clientX, y: e.clientY };

      if (dragMoveRafRef.current == null) {
        dragMoveRafRef.current = window.requestAnimationFrame(flushDragMove);
      }
    },
    [flushDragMove]
  );

  return {
    tiles,
    slots,
    dragIdx,
    won,
    readingWave,
    readingWaveStepMs: WAVE_STEP_MS,
    rootRef,
    onTilePointerDown,
    onTilePointerMove,
    onTilePointerEnd: finishDragFromPointer,
    reset: buildTilesFresh,
  };
}