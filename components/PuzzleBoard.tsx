import { MotionConfig } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  fitTileSizeToBoard,
  type BoardMinHeightMode,
} from "../hooks/useBoardDimensions";
import { usePuzzle } from "../hooks/usePuzzle";
import { useDeviceTier } from "../hooks/useDeviceTier";
import { GhostSlot } from "./GhostSlot";
import { DraggableTile } from "../components/DraggableTile";
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
import { FigureLevelBoard } from "./FigureLevelBoard";

interface PuzzleBoardProps {
  word: WordDef;
  tileSize?: number;
  width?: number;
  height?: number;
  /** Scatter биіктігі режимі (viewport-пен бірдей болуы керек). */
  minHeightMode?: BoardMinHeightMode;
  bgColor?: string;
  onComplete?: (word: string) => void;
  /** Ойын кезінде: басты бет, артқа/алға сөз */
  onNavigateHome?: () => void;
  onNavigatePrevWord?: () => void;
  onNavigateNextWord?: () => void;
  levelIndex?: number;
  totalLevels?: number;
  /** Сөзді жинау 1 буқваға қалғанда — бір рет шақырылады. */
  onAlmostWin?: () => void;
  /** Жеңіс экраны қажет кезде (won=true) — WinScreen сыртта тұрса. */
  onWinReady?: () => void;
}

function PuzzleBoardImpl({
  word,
  tileSize = 108,
  width = 800,
  height = 580,
  minHeightMode = "normal",
  bgColor = "var(--game-anchor)",
  onComplete,
  onNavigateHome,
  onNavigatePrevWord,
  onNavigateNextWord,
  levelIndex,
  totalLevels,
  onAlmostWin,
  onWinReady,
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

  const tileLayoutCount = word.dragLetters?.length ?? word.letters.length;

  const layoutTileSize = useMemo(() => {
    if (!measured) return tileSize;
    return fitTileSizeToBoard(
      tileLayoutCount,
      effW,
      effH,
      minHeightMode
    );
  }, [measured, effW, effH, tileLayoutCount, minHeightMode, tileSize]);

  const {
    tiles,
    slots,
    dragIdx,
    won,
    readingWave,
    readingWaveStepMs,
    rootRef,
    slotFrameAccent,
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
    onAlmostWin,
  });

  useEffect(() => {
    if (won) {
      onWinReady?.();
    }
  }, [won, onWinReady]);

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
          showGlyph={!word.hideSlotGlyph}
          frameTone={
            slotFrameAccent?.slotIndex === i
              ? slotFrameAccent.tone
              : "neutral"
          }
        />
      ))}

      {tiles.map((tile, i) => (
        <DraggableTile
          key={`tile-${i}`}
          tileIndex={i}
          tile={tile}
          displayX={tile.x}
          displayY={tile.y}
          letter={(word.dragLetters ?? word.letters)[tile.idx]}
          size={layoutTileSize}
          isDragging={dragIdx === i}
          isLowEnd={isLowEnd}
          readingWave={readingWave}
          readingWaveStepMs={readingWaveStepMs}
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

  if (!showGameBar) {
    return (
      <>
        {embeddedBoard}
      </>
    );
  }

  const objectHint = word.objectHint;
  const equationHint = word.equationHint;

  return (
    <>
    <div ref={rootRef} className={styles.shell}>
      <MotionConfig reducedMotion={dragIdx !== null ? "always" : "user"}>
        <div
          className={styles.boardBackdrop}
          style={{ background: boardSurfaceBg }}
          aria-hidden
        />
        {equationHint ? (
          <>
            <div
              className={styles.equationHintRow}
              role="img"
              aria-label={
                equationHint.op === "subtract"
                  ? `${equationHint.a} азайту ${equationHint.b}`
                  : `${equationHint.a} қосу ${equationHint.b}`
              }
            >
              <span className={styles.equationNum}>{equationHint.a}</span>
              <span className={styles.equationOp} aria-hidden>
                {equationHint.op === "subtract" ? "−" : "+"}
              </span>
              <span className={styles.equationNum}>{equationHint.b}</span>
              <span className={styles.equationOp} aria-hidden>
                =
              </span>
              <span className={styles.equationQ} aria-hidden>
                ?
              </span>
            </div>
            <div
              className={styles.equationApplesRow}
              role="presentation"
              aria-hidden
            >
              <div className={styles.equationAppleGroup}>
                {Array.from({ length: equationHint.a }, (_, i) => (
                  <span key={`eq-a-${i}`} className={styles.equationApple}>
                    {equationHint.emoji ?? "🍎"}
                  </span>
                ))}
              </div>
              <span className={styles.equationOp}>
                {equationHint.op === "subtract" ? "−" : "+"}
              </span>
              <div className={styles.equationAppleGroup}>
                {Array.from({ length: equationHint.b }, (_, i) => (
                  <span key={`eq-b-${i}`} className={styles.equationApple}>
                    {equationHint.emoji ?? "🍎"}
                  </span>
                ))}
              </div>
              <span className={styles.equationOp}>=</span>
              <span className={styles.equationQ}>?</span>
            </div>
          </>
        ) : objectHint ? (
          <div
            className={styles.objectHintRow}
            role="img"
            aria-label={`${objectHint.count} зат`}
          >
            {Array.from({ length: objectHint.count }, (_, i) => (
              <span key={i} className={styles.objectHintItem}>
                {objectHint.emoji}
              </span>
            ))}
          </div>
        ) : null}
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
          className={`${styles.toolBtn} ${styles.toolBtnBack}`}
          onClick={onNavigatePrevWord}
          aria-label="Артқа, алдыңғы сөз"
        >
          ← Артқа
        </button>
        <button
          type="button"
          className={`${styles.toolBtn} ${styles.toolBtnNext}`}
          onClick={onNavigateNextWord}
          aria-label="Алға, келесі сөз"
        >
          Алға →
        </button>
      </div>
    </div>
    </>
  );
}

export function PuzzleBoard(props: PuzzleBoardProps) {
  if (props.word.figureStage != null) {
    return <FigureLevelBoard {...props} />;
  }
  return <PuzzleBoardImpl {...props} />;
}
