import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { WordDef } from "../types";
import {
  fullscreenElement,
  isFullscreenSupported,
  toggleFullscreen,
} from "../utils/fullscreen";
import pbStyles from "./PuzzleBoard.module.css";
import styles from "./FigureLevelBoard.module.css";

interface FigureLevelBoardProps {
  word: WordDef;
  width?: number;
  height?: number;
  onNavigateHome?: () => void;
  onNavigatePrevWord?: () => void;
  onNavigateNextWord?: () => void;
  levelIndex?: number;
  totalLevels?: number;
  onWinReady?: () => void;
}

const STAGE_HINTS: Record<
  NonNullable<WordDef["figureStage"]>,
  { title: string; body: string }
> = {
  intro: {
    title: "Фигуралармен танысу",
    body: "Дөңес бұрыштар, шеңбер, үшбұрыш — кейін міне осылармен ойнаймыз.",
  },
  find: {
    title: "Фигураны тап",
    body: "Көрсетілген фигураны табу тапсырмасы жақында қосылады.",
  },
  sort: {
    title: "Сұрыптау",
    body: "Фигураларды топтарға бөлу жақында қосылады.",
  },
};

export function FigureLevelBoard({
  word,
  width = 800,
  height = 580,
  onNavigateHome,
  onNavigatePrevWord,
  onNavigateNextWord,
  levelIndex,
  totalLevels,
  onWinReady,
}: FigureLevelBoardProps) {
  const stage = word.figureStage ?? "intro";
  const hint = STAGE_HINTS[stage];
  const completedRef = useRef(false);

  const [fullscreenOn, setFullscreenOn] = useState(false);
  const [fullscreenOk, setFullscreenOk] = useState(false);

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

  const handleComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onWinReady?.();
  }, [onWinReady]);

  const showGameBar =
    onNavigateHome != null &&
    onNavigatePrevWord != null &&
    onNavigateNextWord != null &&
    levelIndex != null &&
    totalLevels != null;

  if (!showGameBar) {
    return (
      <div className={styles.standalone}>
        <p className={styles.standaloneTitle}>{hint.title}</p>
        <button type="button" className={styles.doneBtn} onClick={handleComplete}>
          Дайын
        </button>
      </div>
    );
  }

  return (
    <div className={pbStyles.shell} style={{ width, maxWidth: "100%", height }}>
      <div
        className={pbStyles.boardBackdrop}
        style={{ background: "var(--game-anchor)" }}
        aria-hidden
      />
      <div className={styles.figurePanel}>
        <p className={styles.stageBadge}>
          {word.menuSubtitle ?? `LEVEL ${word.levelNumber ?? "?"}`}
        </p>
        <h2 className={styles.stageTitle}>{word.puzzleTitle ?? hint.title}</h2>
        <div className={styles.shapeRow} aria-hidden>
          <span className={styles.shapeIcon}>🔵</span>
          <span className={styles.shapeIcon}>🟩</span>
          <span className={styles.shapeIcon}>🔺</span>
        </div>
        <p className={styles.stageBody}>{hint.body}</p>
        <button type="button" className={styles.doneBtn} onClick={handleComplete}>
          Тапсырманы аяқтау
        </button>
      </div>

      <div className={pbStyles.topBar}>
        <div className={pbStyles.topBarSide}>
          <button
            type="button"
            className={pbStyles.homeBtn}
            onClick={onNavigateHome}
            aria-label="Басты бетке"
          >
            Үй
          </button>
        </div>
        <div className={pbStyles.levelBadge}>
          {levelIndex} / {totalLevels}
        </div>
        <div className={pbStyles.topBarSide}>
          {fullscreenOk ? (
            <button
              type="button"
              className={pbStyles.fullscreenBtn}
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

      <div className={pbStyles.bottomBar}>
        <button
          type="button"
          className={`${pbStyles.toolBtn} ${pbStyles.toolBtnBack}`}
          onClick={onNavigatePrevWord}
          aria-label="Артқа, алдыңғы сөз"
        >
          ← Артқа
        </button>
        <button
          type="button"
          className={`${pbStyles.toolBtn} ${pbStyles.toolBtnNext}`}
          onClick={onNavigateNextWord}
          aria-label="Алға, келесі сөз"
        >
          Алға →
        </button>
      </div>
    </div>
  );
}
