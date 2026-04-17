import { MotionConfig } from "framer-motion";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import {
  fitTileSizeToBoard,
  type BoardMinHeightMode,
} from "../hooks/useBoardDimensions";
import { usePuzzle } from "../hooks/usePuzzle";
import { useDeviceTier } from "../hooks/useDeviceTier";
import { GhostSlot } from "./GhostSlot";
import { DraggableTile } from "../components/DraggableTile";
import { WinScreen } from "../components/WinScreen";
import type { WordDef } from "../types";
import {
  SHELL_UI_INSET_BOTTOM,
  SHELL_UI_INSET_BOTTOM_LANDSCAPE_SHORT,
  SHELL_UI_INSET_TOP,
  SHELL_UI_INSET_TOP_LANDSCAPE_SHORT,
} from "../constants/gameShellUi";
import {
  fullscreenElement,
  isFullscreenSupported,
  toggleFullscreen,
} from "../utils/fullscreen";
import styles from "./PuzzleBoard.module.css";

interface PuzzleBoardProps {
  word: WordDef;
  tileSize?: number;
  width?: number;
  height?: number;
  /** Scatter биіктігі режимі (viewport-пен бірдей болуы керек). */
  minHeightMode?: BoardMinHeightMode;
  bgColor?: string;
  onComplete?: (word: string) => void;
  onNext: () => void;
  /** Ойын кезінде: басты бет, алдыңғы/келесі сөз */
  onNavigateHome?: () => void;
  onNavigatePrevWord?: () => void;
  onNavigateNextWord?: () => void;
  levelIndex?: number;
  totalLevels?: number;
}

export function PuzzleBoard({
  word,
  tileSize = 108,
  width = 800,
  height = 580,
  minHeightMode = "normal",
  bgColor = "var(--game-anchor)",
  onComplete,
  onNext,
  onNavigateHome,
  onNavigatePrevWord,
  onNavigateNextWord,
  levelIndex,
  totalLevels,
}: PuzzleBoardProps) {
  const [measured, setMeasured] = useState<{ w: number; h: number } | null>(
    null
  );
  const [fullscreenOn, setFullscreenOn] = useState(false);
  const [fullscreenOk, setFullscreenOk] = useState(false);
  const { isLowEnd } = useDeviceTier();

  useLayoutEffect(() => {
    setFullscreenOk(isFullscreenSupported());
    const sync = () => setFullscreenOn(fullscreenElement() !== null);
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    sync();
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const onFullscreenClick = useCallback(() => {
    void toggleFullscreen(document.documentElement);
  }, []);

  const showGameBar =
    onNavigateHome != null &&
    onNavigatePrevWord != null &&
    onNavigateNextWord != null &&
    levelIndex != null &&
    totalLevels != null;

  const [compactShellBars, setCompactShellBars] = useState(false);
  useLayoutEffect(() => {
    const mq = window.matchMedia(
      "(orientation: landscape) and (max-height: 460px)"
    );
    const fn = () => setCompactShellBars(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const shellContentInsets = useMemo(() => {
    if (!showGameBar) return null;
    return compactShellBars
      ? {
          top: SHELL_UI_INSET_TOP_LANDSCAPE_SHORT,
          bottom: SHELL_UI_INSET_BOTTOM_LANDSCAPE_SHORT,
        }
      : {
          top: SHELL_UI_INSET_TOP,
          bottom: SHELL_UI_INSET_BOTTOM,
        };
  }, [showGameBar, compactShellBars]);

  const effW = measured?.w ?? width;
  const effH = measured?.h ?? height;

  const boardSurfaceBg =
    word.word.trim().toUpperCase() === "АЛМА"
      ? "var(--game-alma-board)"
      : bgColor;

  const layoutTileSize = useMemo(() => {
    if (!measured) return tileSize;
    return fitTileSizeToBoard(
      word.letters.length,
      effW,
      effH,
      minHeightMode
    );
  }, [measured, effW, effH, word.letters.length, minHeightMode, tileSize]);

  const {
    tiles,
    slots,
    dragIdx,
    won,
    rootRef,
    onTilePointerDown,
    onTilePointerMove,
    onTilePointerEnd,
  } = usePuzzle({
    word,
    containerW: effW,
    containerH: effH,
    tileSize: layoutTileSize,
    shellContentInsets,
    onComplete,
  });

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const sync = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setMeasured(prev =>
        prev && prev.w === w && prev.h === h ? prev : { w, h }
      );
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [rootRef, width, height]);

  const tilesContent = (
    <>
      {slots.map((pos, i) => (
        <GhostSlot
          key={`ghost-${i}`}
          ch={word.letters[i].ch}
          size={layoutTileSize}
          x={pos.x}
          y={pos.y}
        />
      ))}

      {tiles.map((tile, i) => (
        <DraggableTile
          key={`tile-${i}`}
          tileIndex={i}
          tile={tile}
          displayX={tile.x}
          displayY={tile.y}
          letter={word.letters[tile.idx]}
          size={layoutTileSize}
          isDragging={dragIdx === i}
          isLowEnd={isLowEnd}
          onPointerDown={onTilePointerDown}
          onPointerMove={onTilePointerMove}
          onPointerEnd={onTilePointerEnd}
        />
      ))}
    </>
  );

  const embeddedBoard = (
    <MotionConfig reducedMotion={dragIdx !== null ? "always" : "user"}>
      <div
        ref={rootRef}
        className={styles.boardRoot}
        style={{
          width,
          maxWidth: "100%",
          height,
          background: boardSurfaceBg,
        }}
      >
        {tilesContent}
      </div>
    </MotionConfig>
  );

  const winOverlay =
    won ? (
      <WinScreen word={word.word} emoji={word.emoji} onNext={onNext} />
    ) : null;

  if (!showGameBar) {
    return (
      <>
        {embeddedBoard}
        {winOverlay}
      </>
    );
  }

  return (
    <>
    <div ref={rootRef} className={styles.shell}>
      <MotionConfig reducedMotion={dragIdx !== null ? "always" : "user"}>
        <div
          className={styles.boardBackdrop}
          style={{ background: boardSurfaceBg }}
          aria-hidden
        />
        <div className={styles.tileLayer}>{tilesContent}</div>
      </MotionConfig>

      <div className={styles.topBar}>
        <div className={styles.topBarSide}>
          <button
            type="button"
            className={styles.homeBtn}
            onClick={onNavigateHome}
            aria-label="Басты бетке"
          >
            Үй
          </button>
        </div>
        <div className={styles.levelBadge}>
          {levelIndex} / {totalLevels}
        </div>
        <div className={styles.topBarSide}>
          {fullscreenOk ? (
            <button
              type="button"
              className={styles.fullscreenBtn}
              onClick={onFullscreenClick}
              aria-pressed={fullscreenOn}
              aria-label={
                fullscreenOn
                  ? "Толық экраннан шығу"
                  : "Толық экран (браузер панелін жасыру)"
              }
            >
              {fullscreenOn ? "⇲" : "⇱"}
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.bottomBar}>
        <button
          type="button"
          className={styles.toolBtn}
          onClick={onNavigateNextWord}
          aria-label="Келесі деңгей"
        >
          Келесі →
        </button>
        <button
          type="button"
          className={styles.toolBtn}
          onClick={onNavigatePrevWord}
          aria-label="Алдыңғы деңгей"
        >
          ← Алдыңғы
        </button>
      </div>
    </div>
    {winOverlay}
    </>
  );
}
