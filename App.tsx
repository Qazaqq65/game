import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { preloadSounds, unlockAudio } from "./utils/sound";
import { PuzzleBoard } from "./components/PuzzleBoard";
import { EntryMenu } from "./components/EntryMenu";
import {
  WORDS,
  WORD_MENU_GROUPS,
  letterCharsFromWords,
} from "./data/words";
import { useBoardDimensions } from "./hooks/useBoardDimensions";
import type { WordDef } from "./types";

function readGameLandscapeShort(): boolean {
  if (typeof window === "undefined") return false;
  const vp = window.visualViewport;
  const w = vp?.width ?? window.innerWidth;
  const h = vp?.height ?? window.innerHeight;
  return w > h && h <= 460;
}

function scheduleIdleWork(fn: () => void): number {
  const ric = (
    window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    }
  ).requestIdleCallback;
  if (typeof ric === "function") {
    return ric(fn, { timeout: 2200 });
  }
  return window.setTimeout(fn, 250);
}

function cancelIdleWork(id: number): void {
  const cic = (
    window as Window & { cancelIdleCallback?: (id: number) => void }
  ).cancelIdleCallback;
  if (typeof cic === "function") {
    cic(id);
  } else {
    window.clearTimeout(id);
  }
}

/** Тек ойын экранында — listenерлер мен өлшем есебі менюмен бірге жүктелмейді */
function GameSession({
  wordIdx,
  setWordIdx,
  onHome,
}: {
  wordIdx: number;
  setWordIdx: Dispatch<SetStateAction<number>>;
  onHome: () => void;
}) {
  const currentWord: WordDef = WORDS[wordIdx % WORDS.length];
  const boardDims = useBoardDimensions(currentWord.letters.length);
  const n = WORDS.length;
  const idx = wordIdx % n;

  /** Оптимизация: тұрақты колбэк сілтемелері — PuzzleBoard артық ререндерден сақталады. */
  const onNavigatePrev = useCallback(
    () => setWordIdx(i => (i - 1 + n) % n),
    [setWordIdx, n]
  );
  const onNavigateNext = useCallback(
    () => setWordIdx(i => (i + 1) % n),
    [setWordIdx, n]
  );
  /* onNext те сол функция — жеке inline () => емес, бір сілтеме. */

  return (
    <PuzzleBoard
      key={wordIdx}
      word={currentWord}
      width={boardDims.width}
      height={boardDims.height}
      tileSize={boardDims.tileSize}
      minHeightMode={boardDims.minHeightMode}
      levelIndex={idx + 1}
      totalLevels={n}
      onNavigateHome={onHome}
      onNavigatePrevWord={onNavigatePrev}
      onNavigateNextWord={onNavigateNext}
      onNext={onNavigateNext}
    />
  );
}

export default function App() {
  const [entered, setEntered] = useState(false);
  const [wordIdx, setWordIdx] = useState(0);
  const [gameLandscapeShort, setGameLandscapeShort] = useState(false);

  useLayoutEffect(() => {
    const sync = () => setGameLandscapeShort(readGameLandscapeShort());
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    window.visualViewport?.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      window.visualViewport?.removeEventListener("resize", sync);
    };
  }, []);

  useEffect(() => {
    const id = scheduleIdleWork(() => {
      preloadSounds([...letterCharsFromWords(WORDS), "snap", "win"]);
    });

    const unlock = () => {
      unlockAudio();
      window.removeEventListener("pointerdown", unlock);
    };

    window.addEventListener("pointerdown", unlock);

    return () => {
      cancelIdleWork(id);
      window.removeEventListener("pointerdown", unlock);
    };
  }, []);

  /** Меню, ойын, WinScreen (portal body) — жүйелік контекстік/ұзақ басым мәзірін өшіру */
  useEffect(() => {
    const onCtx = (e: Event) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", onCtx);
    return () => document.removeEventListener("contextmenu", onCtx);
  }, []);

  /** Оптимизация: GameSession / EntryMenu тұрақты onHome, onPickWord сілтемелері. */
  const handleHome = useCallback(() => setEntered(false), []);

  const handlePickWord = useCallback((w: WordDef) => {
    const i = WORDS.findIndex(x => x === w);
    setWordIdx(i >= 0 ? i : 0);
    setEntered(true);
  }, []);

  /** Оптимизация: entered/wordIdx өзгермесе қайта есептелмейді. */
  const isAlmaSession = useMemo(
    () => entered && WORDS[wordIdx % WORDS.length].word.trim().toUpperCase() === "АЛМА",
    [entered, wordIdx]
  );

  /** Оптимизация: үлкен style объектісі әр рендерде жаңадан жасалмайды. */
  const rootStyle = useMemo(() => ({
    width: "100%" as const,
    flex: entered ? 1 : undefined,
    ...(entered
      ? { minHeight: 0, maxHeight: "100dvh" }
      : { minHeight: "100svh" }),
    display: "flex" as const,
    flexDirection: "column" as const,
    alignItems: entered ? ("stretch" as const) : ("center" as const),
    justifyContent: entered ? ("flex-start" as const) : ("center" as const),
    boxSizing: "border-box" as const,
    padding: entered
      ? gameLandscapeShort
        ? "max(4px, env(safe-area-inset-top, 0px)) max(6px, env(safe-area-inset-right, 0px)) max(2px, env(safe-area-inset-bottom, 0px)) max(6px, env(safe-area-inset-left, 0px))"
        : "max(6px, env(safe-area-inset-top, 0px)) max(6px, env(safe-area-inset-right, 0px)) max(6px, env(safe-area-inset-bottom, 0px)) max(6px, env(safe-area-inset-left, 0px))"
      : 0,
    overflow: entered ? ("hidden" as const) : undefined,
    background: entered
      ? isAlmaSession
        ? "var(--game-alma-shell)"
        : "var(--game-anchor)"
      : "var(--game-anchor-soft)",
  }), [entered, gameLandscapeShort, isAlmaSession]);

  return (
    <div style={rootStyle}>
      {!entered ? (
        <EntryMenu
          groups={WORD_MENU_GROUPS}
          onPickWord={handlePickWord}
        />
      ) : (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <GameSession
            wordIdx={wordIdx}
            setWordIdx={setWordIdx}
            onHome={handleHome}
          />
        </div>
      )}
    </div>
  );
}
