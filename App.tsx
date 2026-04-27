import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";
import {
  preloadSoundsForWord,
  preloadWordPronunciations,
  prefetchWinCelebrationMusic,
  unlockAudio,
} from "./utils/sound";
import { prefetchCelebrationAssets } from "./utils/celebrationAssets";
import { winCelebrationForWord } from "./data/winCelebrations";
import { isFullscreenSupported, toggleFullscreen, fullscreenElement } from "./utils/fullscreen";
import { PuzzleBoard } from "./components/PuzzleBoard";
import { EntryMenu } from "./components/EntryMenu";
import LoginPage from "./components/LoginPage";
import {
  WORDS,
  WORD_MENU_GROUPS,
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
  // Android Chrome pull-to-refresh және iOS bounce эффектін өшіру
  useEffect(() => {
    const prevent = (e: TouchEvent) => e.preventDefault();
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => document.removeEventListener("touchmove", prevent);
  }, []);
  const currentWord: WordDef = WORDS[wordIdx % WORDS.length];
  const boardDims = useBoardDimensions(currentWord.letters.length);
  const n = WORDS.length;
  const idx = wordIdx % n;

  /**
   * Lazy ассеттер. Стратегия — «just-in-time»:
   *  • Ағымдағы сөздің ӘРІП дыбыстары — бірден (drag-те бірден ойнау керек,
   *    кідіруге болмайды).
   *  • Сөздің толық дыбыстауы (Алма.MP3 …), Lottie ассеттері және celebration
   *    музыкасы — пайдаланушы 1 буқваға келгенде ғана жүктеледі
   *    (handleAlmostWin → onAlmostWin → префетч). Егер тастап кетсе — нөл
   *    артық трафик. Қысқа сөздер (≤2 буква) үшін almost-win тым кеш —
   *    ондайларда idle-те қауіпсіз префетч.
   *  • Келесі сөздің тек ӘРІП дыбыстары idle-те («Алға →» кідірісі
   *    болмасын). Қалғаны (mp3 сөз + Lottie + музыка) сол сөзге өткенде
   *    almost-win-те жүктеледі.
   */
  useEffect(() => {
    preloadSoundsForWord(currentWord);

    let idShortCel: number | null = null;
    if (currentWord.letters.length <= 2) {
      const cel = winCelebrationForWord(currentWord.word);
      idShortCel = scheduleIdleWork(() => {
        prefetchCelebrationAssets(currentWord.word);
        prefetchWinCelebrationMusic(cel?.musicFile);
        if (currentWord.voiced) {
          preloadWordPronunciations([currentWord.word]);
        }
      });
    }

    const nextWord = WORDS[(wordIdx + 1) % n];
    const idNext = scheduleIdleWork(() => {
      preloadSoundsForWord(nextWord);
    });

    return () => {
      if (idShortCel != null) cancelIdleWork(idShortCel);
      cancelIdleWork(idNext);
    };
  }, [currentWord, wordIdx, n]);

  /**
   * 1 буква қалды → ағымдағы сөздің:
   *   • mp3 толық дыбыстауы (Алма.MP3 …) — voiced болса
   *   • Lottie ассеттері (celebration JSON-дары)
   *   • celebration музыкасы (apple.mp3 …)
   * параллель префетчке жіберіледі. ~2.4с буфер (lead-in + reading wave + tail)
   * + соңғы букваны қою уақыты — бұл уақытта файлдар жетіп үлгереді.
   * Барлығы идемпотентті — қайта шақырылса трафик жоқ.
   */
  const handleAlmostWin = useCallback(() => {
    if (currentWord.voiced) {
      preloadWordPronunciations([currentWord.word]);
    }
    prefetchCelebrationAssets(currentWord.word);
    prefetchWinCelebrationMusic(
      winCelebrationForWord(currentWord.word)?.musicFile
    );
  }, [currentWord]);

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
      onAlmostWin={handleAlmostWin}
    />
  );
}

export default function App() {
  const [entered, setEntered] = useState(false);
  const [wordIdx, setWordIdx] = useState(0);
  const [gameLandscapeShort, setGameLandscapeShort] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

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
    // Дыбыс контекстін бірінші тапсу/басылғанда босатамыз — бұл аудио качалмайды,
    // тек браузерге «жариялы пайдаланушы әрекеті» болғанын білдіреді.
    // Менюде ЕШҚАНДАЙ mp3/Lottie жүктелмейді: trafik 0 байт.
    const unlock = () => {
      unlockAudio();
      window.removeEventListener("pointerdown", unlock);
    };

    window.addEventListener("pointerdown", unlock);

    return () => {
      window.removeEventListener("pointerdown", unlock);
    };
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFs(!!fullscreenElement());
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
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
    if (!currentUser) {
      setShowAuthGate(true);
      return;
    }
    const i = WORDS.findIndex(x => x === w);
    setWordIdx(i >= 0 ? i : 0);
    setEntered(true);
  }, [currentUser]);

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

  if (authLoading) return null;

  // Кнопка "Войти" → полноэкранный логин
  if (showLogin) {
    return (
      <LoginPage
        onBack={() => setShowLogin(false)}
        onSuccess={() => setShowLogin(false)}
      />
    );
  }

  return (
    <div style={rootStyle}>
      {/* Клик по карточке без авторизации → модальный логин */}
      {showAuthGate && (
        <LoginPage
          isModal
          onBack={() => setShowAuthGate(false)}
          onSuccess={() => setShowAuthGate(false)}
        />
      )}

      {!entered ? (
        <>
          <EntryMenu
            groups={WORD_MENU_GROUPS}
            onPickWord={handlePickWord}
          />

          <div style={{ position: "fixed", top: 14, right: 16, display: "flex", gap: 8, zIndex: 999 }}>
            {isFullscreenSupported() && (
              <button
                onClick={() => toggleFullscreen()}
                style={{
                  padding: "7px 12px",
                  fontSize: 16,
                  borderRadius: 10,
                  border: "none",
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(6px)",
                  color: "#555",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                }}
                title={isFs ? "Толық экраннан шығу" : "Толық экран"}
              >
                {isFs ? "↙↗" : "↗↙"}
              </button>
            )}
            {!currentUser && (
              <button
                onClick={() => setShowLogin(true)}
                style={{
                  padding: "7px 18px",
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 10,
                  border: "none",
                  background: "#3b82f6",
                  color: "#fff",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(59,130,246,0.35)",
                }}
              >
                Кіру
              </button>
            )}
          </div>
        </>
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
