import { useCallback, useLayoutEffect, useState } from "react";

const GAP_X = 10;
const ABS_MIN_TILE = 54;
const MAX_TILE = 108;
const MAX_W = 800;
const MAX_H = 580;
const VIEW_PAD_X = 12;

const SHELL_UI_RESERVE = 108;
const SHELL_UI_RESERVE_LANDSCAPE_PHONE = 78;

const BOARD_INSET_X = 16;

/** Ұялыда 6+ әріп, көлденең тақтада саусақ алаңы үшін кішіретіп, плитка сәл ірірек */
function boardInsetXForTouch(letterCount: number): number {
  if (typeof window === "undefined") return BOARD_INSET_X;
  if (
    letterCount >= 6 &&
    window.matchMedia("(pointer: coarse)").matches
  ) {
    return Math.max(8, BOARD_INSET_X - 6);
  }
  return BOARD_INSET_X;
}

function readViewportSize(): { vw: number; vh: number } {
  const vp = window.visualViewport;
  return {
    vw: vp?.width ?? window.innerWidth,
    vh: vp?.height ?? window.innerHeight,
  };
}

/**
 * Scatter аймақтары үшін минималды биіктік (canvas.ts zones).
 */
function minHeightForTile(
  tileSize: number,
  mode: "normal" | "compact" | "tight"
): number {
  const pad = mode === "tight" ? 42 : mode === "compact" ? 52 : 68;
  return Math.ceil(tileSize * 2 + pad);
}

export type BoardMinHeightMode = "normal" | "compact" | "tight";

function minHeightModeFromViewport(vw: number, vh: number): BoardMinHeightMode {
  const isPortrait = vh >= vw;
  const landscapeShort = vw > vh && vh <= 460;
  const landscapePhone = !isPortrait && vh < 520;
  if (isPortrait) return "normal";
  if (landscapePhone) return "tight";
  if (landscapeShort) return "compact";
  return "normal";
}

/**
 * Көлденең / тік емес режимде жол кең — формула 108px-қа дейін өсіреді, SVG/анимация
 * көп әріпте қатты лаг береді. Портреттегі сияқты тығыздыққа жақын maxTile шегін қоямыз.
 */
function maxTileForMinHeightMode(
  minHMode: BoardMinHeightMode,
  letterCount: number
): number {
  if (minHMode === "normal") return MAX_TILE;
  const n = letterCount;
  if (minHMode === "tight") {
    if (n >= 10) return 54;
    if (n >= 9) return 56;
    if (n >= 8) return 60;
    if (n >= 7) return 66;
    if (n >= 6) return 72;
    if (n >= 5) return 80;
    return MAX_TILE;
  }
  // compact
  if (n >= 10) return 56;
  if (n >= 9) return 58;
  if (n >= 8) return 64;
  if (n >= 7) return 70;
  if (n >= 6) return 76;
  if (n >= 5) return 86;
  return MAX_TILE;
}

/** minHeightMode берілмесе де (LetterPuzzle), ұялы көлденеңде тығыздық шегі */
function touchLandscapeTileCap(
  boardW: number,
  boardH: number,
  letterCount: number
): number | null {
  if (typeof window === "undefined") return null;
  const n = letterCount;
  if (n < 6) return null;
  if (boardW <= boardH * 1.12) return null;
  if (!window.matchMedia("(pointer: coarse)").matches) return null;
  return maxTileForMinHeightMode("compact", n);
}

/**
 * Нақты clientWidth/clientHeight бойынша плитка өлшемін қайта есептеу
 * (maxWidth:100% + safe-area тақта кішірек болғанда).
 */
export function fitTileSizeToBoard(
  letterCount: number,
  boardW: number,
  boardH: number,
  minHMode: BoardMinHeightMode
): number {
  const n = Math.max(1, letterCount);
  const w = Math.max(240, boardW);
  const h = Math.max(180, boardH);
  const insetX = boardInsetXForTouch(n);
  let maxTile = maxTileForMinHeightMode(minHMode, n);
  const touchCap = touchLandscapeTileCap(w, h, n);
  if (touchCap !== null) maxTile = Math.min(maxTile, touchCap);

  let tileSize = Math.floor(
    (w - insetX * 2 - (n - 1) * GAP_X) / n
  );
  tileSize = Math.min(maxTile, Math.max(ABS_MIN_TILE, tileSize));

  while (tileSize > ABS_MIN_TILE) {
    const rowW = n * tileSize + (n - 1) * GAP_X + insetX * 2;
    if (rowW <= w) break;
    tileSize -= 1;
  }

  while (
    tileSize > ABS_MIN_TILE &&
    minHeightForTile(tileSize, minHMode) > h
  ) {
    tileSize -= 1;
  }

  while (tileSize > ABS_MIN_TILE) {
    const rowW = n * tileSize + (n - 1) * GAP_X + insetX * 2;
    if (rowW <= w) break;
    tileSize -= 1;
  }

  return tileSize;
}

/**
 * Тақта ені мен биіктігі тек viewport / ориентацияға байланысты, сөз ұзындығына емес.
 * Плитка өлшемі (әріп) сөздегі әріп санына байланысты осы қорапқа сыйылады.
 */
function computeDimensions(letterCount: number) {
  const n = Math.max(1, letterCount);
  if (typeof window === "undefined") {
    return {
      width: MAX_W,
      height: MAX_H,
      tileSize: MAX_TILE,
      minHeightMode: "normal" as BoardMinHeightMode,
    };
  }

  const { vw, vh } = readViewportSize();
  const isPortrait = vh >= vw;
  const landscapeShort = vw > vh && vh <= 460;
  /** Көлденең, төмен экран — телефон бұрылысы. */
  const landscapePhone = !isPortrait && vh < 520;

  /**
   * Тақта PuzzleBoard shell (үсті/асты панель) астында — толық экранға жақын,
   * өлшемді алдын ала tileSize есебі үшін viewport минус осы резерв.
   */
  const shellReserveV = isPortrait
    ? 128
    : landscapeShort
      ? 96
      : landscapePhone
        ? SHELL_UI_RESERVE_LANDSCAPE_PHONE
        : SHELL_UI_RESERVE;

  const availW = Math.max(240, vw - VIEW_PAD_X * 2);
  const availH = Math.max(160, vh - shellReserveV);

  const boardW = Math.round(availW);
  const minHMode = minHeightModeFromViewport(vw, vh);

  const boardH = Math.max(180, Math.round(availH));

  const tileSize = fitTileSizeToBoard(n, boardW, boardH, minHMode);

  return {
    width: boardW,
    height: boardH,
    tileSize,
    minHeightMode: minHMode,
  };
}

export function useBoardDimensions(letterCount: number) {
  const compute = useCallback(
    () => computeDimensions(letterCount),
    [letterCount]
  );

  const [dims, setDims] = useState(compute);

  useLayoutEffect(() => {
    const updateNow = () =>
      setDims(prev => {
        const next = compute();
        /* Оптимизация: visualViewport scroll жиі тұрады — өлшем өзгермесе setState жоқ, ререндер жоқ. */
        if (
          prev.width === next.width &&
          prev.height === next.height &&
          prev.tileSize === next.tileSize &&
          prev.minHeightMode === next.minHeightMode
        ) {
          return prev;
        }
        return next;
      });

    /** iOS: orientationchange кезінде viewport әлі ескі болуы мүмкін. */
    const updateAfterOrientation = () => {
      requestAnimationFrame(() => requestAnimationFrame(updateNow));
    };

    updateNow();

    window.addEventListener("resize", updateNow);
    window.addEventListener("orientationchange", updateAfterOrientation);

    const vp = window.visualViewport;
    vp?.addEventListener("resize", updateNow);
    vp?.addEventListener("scroll", updateNow);

    return () => {
      window.removeEventListener("resize", updateNow);
      window.removeEventListener("orientationchange", updateAfterOrientation);
      vp?.removeEventListener("resize", updateNow);
      vp?.removeEventListener("scroll", updateNow);
    };
  }, [compute]);

  return dims;
}
