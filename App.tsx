import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";
import {
  preloadSoundsForWord,
  unlockAudio,
  readBackgroundMusicPreference,
  readBackgroundMusicVolume,
  setBackgroundMusicEnabled,
  setBackgroundMusicVolume,
  BACKGROUND_MUSIC_VOLUME_MAX,
  playDigitLevelIntroSound,
} from "./utils/sound";
import { isFullscreenSupported, toggleFullscreen, fullscreenElement } from "./utils/fullscreen";
import { PuzzleBoard } from "./components/PuzzleBoard";
import { WinScreen } from "./components/WinScreen";
import { EntryMenu } from "./components/EntryMenu";
import LoginPage from "./components/LoginPage";
import {
  WORDS,
  WORD_MENU_GROUPS,
} from "./data/words";
import { DIGIT_LEVELS, DIGIT_ORDER_LEVEL_INDEX, resolveDigitLevelForPlay } from "./data/digitLevels";
import { FIGURE_LEVELS } from "./data/figureLevels";
import { useBoardDimensions } from "./hooks/useBoardDimensions";
import type { WordDef } from "./types";

type PlaySource = "letters" | "digits" | "figures";

/** Сан бөлімі: санау, сандар реті, қосу, азайту — әр деңгейді 3 рет шешкенше келесіге өтпейді. */
const DIGIT_MULTI_ROUND_LEVEL_INDICES = new Set([1, 2, 3, 4]);
const DIGIT_MULTI_ROUND_TOTAL = 3;

const bgMusicControlBtnStyle: CSSProperties = {
  padding: "4px 6px",
  fontSize: 22,
  lineHeight: 1,
  borderRadius: 8,
  border: "none",
  background: "transparent",
  color: "rgba(55, 48, 42, 0.82)",
  cursor: "pointer",
  boxShadow: "none",
  textShadow:
    "0 0 10px rgba(255,255,255,0.85), 0 1px 2px rgba(255,255,255,0.6)",
  WebkitTapHighlightColor: "transparent",
};

function BackgroundMusicControls({
  on,
  volume,
  onToggle,
  onVolumeChange,
  buttonStyle,
}: {
  on: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (v: number) => void;
  buttonStyle?: CSSProperties;
}) {
  const btnStyle = { ...bgMusicControlBtnStyle, ...buttonStyle };
  const pct = Math.round(
    (volume / BACKGROUND_MUSIC_VOLUME_MAX) * 100
  );
  const [volumePanelOpen, setVolumePanelOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!volumePanelOpen) return;
    const close = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (el && !el.contains(e.target as Node)) {
        setVolumePanelOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [volumePanelOpen]);

  const rangeInput = (
    <input
      type="range"
      min={0}
      max={100}
      value={pct}
      onChange={e => {
        const p = Number(e.target.value) / 100;
        onVolumeChange(p * BACKGROUND_MUSIC_VOLUME_MAX);
      }}
      aria-label="Фондық музыка дыбыс деңгейі"
      title="Дыбыс деңгейі"
      style={{
        width: "min(168px, 42vw)",
        height: 32,
        accentColor: "#c2410c",
        cursor: "pointer",
      }}
    />
  );

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        maxWidth: "100%",
      }}
    >
      <button
        type="button"
        onClick={() => setVolumePanelOpen(o => !o)}
        style={btnStyle}
        aria-expanded={volumePanelOpen}
        aria-haspopup="dialog"
        title={
          volumePanelOpen
            ? "Жабу"
            : "Фондық музыканы басқару"
        }
        aria-label={
          volumePanelOpen
            ? "Басқару панелін жабу"
            : "Фондық музыканы басқару"
        }
      >
        {on ? "🔊" : "🔇"}
      </button>
      {volumePanelOpen ? (
        <div
          role="dialog"
          aria-label="Фондық музыка"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            bottom: "auto",
            padding: "12px 14px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
            zIndex: 10001,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: 12,
            minWidth: "min(188px, 52vw)",
          }}
        >
          {rangeInput}
          <button
            type="button"
            onClick={onToggle}
            style={{
              padding: "8px 10px",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "inherit",
              borderRadius: 10,
              border: "1px solid rgba(120,95,75,0.22)",
              background: "rgba(255,255,255,0.9)",
              color: "#444",
              cursor: "pointer",
            }}
            aria-pressed={on}
          >
            {on ? "🔇 Музыканы сөндіру" : "🔊 Музыканы қосу"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Firebase auth бірінші рет шешілгенше — бос экран орнына */
function AppBootstrapLoading() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        background: "var(--game-anchor-soft)",
        boxSizing: "border-box",
        padding: 24,
      }}
    >
      <div
        className="app-boot-spinner"
        role="status"
        aria-live="polite"
        aria-label="Жүктелуде"
      />
      <p
        style={{
          margin: 0,
          fontFamily: "var(--sans)",
          color: "var(--game-anchor-ink)",
          fontWeight: 700,
          fontSize: "clamp(1rem, 4vw, 1.15rem)",
        }}
      >
        Жүктелуде…
      </p>
    </div>
  );
}

function readGameLandscapeShort(): boolean {
  if (typeof window === "undefined") return false;
  const vp = window.visualViewport;
  const w = vp?.width ?? window.innerWidth;
  const h = vp?.height ?? window.innerHeight;
  return w > h && h <= 460;
}

/** Тек ойын экранында — listenерлер мен өлшем есебі менюмен бірге жүктелмейді */
function GameSession({
  wordIdx,
  setWordIdx,
  onHome,
  levels,
  sessionKey,
}: {
  wordIdx: number;
  setWordIdx: Dispatch<SetStateAction<number>>;
  onHome: () => void;
  levels: WordDef[];
  /** letters | digits — PuzzleBoard кэшін араластырмау */
  sessionKey: PlaySource;
}) {
  // Android Chrome pull-to-refresh және iOS bounce эффектін өшіру
  useEffect(() => {
    const prevent = (e: TouchEvent) => e.preventDefault();
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => document.removeEventListener("touchmove", prevent);
  }, []);
  const templateWord = levels[wordIdx % levels.length];
  const [digitCountReplayKey, setDigitCountReplayKey] = useState(0);
  const [digitCountRoundsDone, setDigitCountRoundsDone] = useState(0);
  /** 3 тапсырмалы деңгей: дұрыс жауап қайталанбасын (санау, қосу, азайту). */
  const [digitRoundExcludeAnswers, setDigitRoundExcludeAnswers] = useState<
    number[]
  >([]);
  const [winScreenVisible, setWinScreenVisible] = useState(false);
  const [digitRoundBoardExit, setDigitRoundBoardExit] = useState(false);
  const digitInterRoundTimeoutRef = useRef<number | null>(null);

  const idx = wordIdx % levels.length;
  const isDigitMultiRoundLevel =
    sessionKey === "digits" && DIGIT_MULTI_ROUND_LEVEL_INDICES.has(idx);

  useEffect(() => {
    if (digitInterRoundTimeoutRef.current != null) {
      window.clearTimeout(digitInterRoundTimeoutRef.current);
      digitInterRoundTimeoutRef.current = null;
    }
    setDigitRoundBoardExit(false);
    if (!isDigitMultiRoundLevel) {
      setDigitCountRoundsDone(0);
      setDigitCountReplayKey(0);
      setDigitRoundExcludeAnswers([]);
      return;
    }
    setDigitCountRoundsDone(0);
    setDigitCountReplayKey(0);
    setDigitRoundExcludeAnswers([]);
  }, [isDigitMultiRoundLevel, idx]);

  const digitOrderRoundForResolve =
    sessionKey === "digits" && idx === DIGIT_ORDER_LEVEL_INDEX
      ? digitCountRoundsDone
      : -1;

  const currentWord = useMemo(
    () =>
      resolveDigitLevelForPlay(templateWord, {
        digitOrderRound:
          digitOrderRoundForResolve >= 0 ? digitOrderRoundForResolve : undefined,
        excludeAnswers: isDigitMultiRoundLevel
          ? digitRoundExcludeAnswers
          : undefined,
      }),
    [
      templateWord,
      wordIdx,
      digitCountReplayKey,
      digitOrderRoundForResolve,
      isDigitMultiRoundLevel,
      digitRoundExcludeAnswers,
    ]
  );
  const boardDims = useBoardDimensions(
    currentWord.dragLetters?.length ?? currentWord.letters.length
  );
  const n = levels.length;

  /** Тек ағымдағы сөздің әріп дыбыстары алдын ала дайындалады. */
  useEffect(() => {
    preloadSoundsForWord(currentWord);
  }, [currentWord]);

  /** Сан 1–2 деңгей: кіріс нұсқаулары (numbers/comment/денгей*.mp3). */
  useEffect(() => {
    if (sessionKey !== "digits") return;
    const ln = levels[wordIdx % levels.length].levelNumber;
    playDigitLevelIntroSound(ln);
  }, [sessionKey, wordIdx, levels]);

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

  useEffect(() => {
    setWinScreenVisible(false);
    setDigitRoundBoardExit(false);
    if (digitInterRoundTimeoutRef.current != null) {
      window.clearTimeout(digitInterRoundTimeoutRef.current);
      digitInterRoundTimeoutRef.current = null;
    }
  }, [wordIdx]);

  const seamlessDigitMidRound =
    isDigitMultiRoundLevel &&
    digitCountRoundsDone < DIGIT_MULTI_ROUND_TOTAL - 1;

  const onWinReady = useCallback(() => {
    if (seamlessDigitMidRound) {
      if (digitInterRoundTimeoutRef.current != null) {
        window.clearTimeout(digitInterRoundTimeoutRef.current);
      }
      setDigitRoundBoardExit(true);
      digitInterRoundTimeoutRef.current = window.setTimeout(() => {
        digitInterRoundTimeoutRef.current = null;
        setDigitRoundBoardExit(false);
        const fromCount = currentWord.objectHint?.count;
        const eq = currentWord.equationHint;
        const fromAdd =
          eq != null && eq.op !== "subtract" ? eq.a + eq.b : undefined;
        const fromSubtract =
          eq != null && eq.op === "subtract" ? eq.a - eq.b : undefined;
        const toExclude = fromCount ?? fromAdd ?? fromSubtract;
        if (toExclude != null && Number.isFinite(toExclude)) {
          setDigitRoundExcludeAnswers(prev => [...prev, toExclude]);
        }
        setDigitCountRoundsDone(r => r + 1);
        setDigitCountReplayKey(k => k + 1);
      }, 430);
      return;
    }
    setWinScreenVisible(true);
  }, [currentWord, seamlessDigitMidRound]);

  /** WinScreen тек соңғы тапсырмадан кейін (аралықта WinScreen жоқ). */
  const winNextButtonLabel =
    isDigitMultiRoundLevel &&
    digitCountRoundsDone === DIGIT_MULTI_ROUND_TOTAL - 1
      ? "Келесі деңгей →"
      : undefined;

  const onWinNext = useCallback(() => {
    setWinScreenVisible(false);
    if (
      isDigitMultiRoundLevel &&
      digitCountRoundsDone < DIGIT_MULTI_ROUND_TOTAL - 1
    ) {
      const fromCount = currentWord.objectHint?.count;
      const eq = currentWord.equationHint;
      const fromAdd =
        eq != null && eq.op !== "subtract"
          ? eq.a + eq.b
          : undefined;
      const fromSubtract =
        eq != null && eq.op === "subtract" ? eq.a - eq.b : undefined;
      const toExclude = fromCount ?? fromAdd ?? fromSubtract;
      if (toExclude != null && Number.isFinite(toExclude)) {
        setDigitRoundExcludeAnswers(prev => [...prev, toExclude]);
      }
      setDigitCountRoundsDone(r => r + 1);
      setDigitCountReplayKey(k => k + 1);
      return;
    }
    if (isDigitMultiRoundLevel) {
      setDigitCountRoundsDone(0);
    }
    onNavigateNext();
  }, [
    currentWord,
    digitCountRoundsDone,
    isDigitMultiRoundLevel,
    onNavigateNext,
  ]);

  return (
    <>
      <PuzzleBoard
        key={`${sessionKey}-${wordIdx}-${digitCountReplayKey}`}
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
        onWinReady={onWinReady}
        seamlessRoundWin={seamlessDigitMidRound}
        digitRoundBoardExit={digitRoundBoardExit}
        digitRoundProgress={
          isDigitMultiRoundLevel
            ? {
                done: digitCountRoundsDone,
                total: DIGIT_MULTI_ROUND_TOTAL,
              }
            : null
        }
      />
      <WinScreen
        visible={winScreenVisible}
        word={currentWord.word}
        displayLabel={currentWord.puzzleTitle ?? currentWord.word}
        emoji={currentWord.emoji}
        nextButtonLabel={winNextButtonLabel}
        onNext={onWinNext}
        variant={
          sessionKey === "letters"
            ? "letters"
            : sessionKey === "figures"
              ? "figures"
              : "digits"
        }
      />
    </>
  );
}

export default function App() {
  const [entered, setEntered] = useState(false);
  const [playSource, setPlaySource] = useState<PlaySource>("letters");
  const [wordIdx, setWordIdx] = useState(0);
  const [gameLandscapeShort, setGameLandscapeShort] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isFs, setIsFs] = useState(false);
  const [bgMusicOn, setBgMusicOn] = useState(readBackgroundMusicPreference);
  const [bgMusicVolume, setBgMusicVolume] = useState(readBackgroundMusicVolume);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    return () => {
      unsub();
    };
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

  const toggleBackgroundMusic = useCallback(() => {
    unlockAudio();
    const next = !bgMusicOn;
    setBgMusicOn(next);
    setBackgroundMusicEnabled(next);
  }, [bgMusicOn]);

  const handleBackgroundMusicVolume = useCallback((v: number) => {
    unlockAudio();
    setBackgroundMusicVolume(v);
    setBgMusicVolume(v);
  }, []);

  const handlePickWord = useCallback(
    (w: WordDef, source: PlaySource) => {
      if (!currentUser) {
        setShowAuthGate(true);
        return;
      }
      setPlaySource(source);
      const list =
        source === "letters"
          ? WORDS
          : source === "digits"
            ? DIGIT_LEVELS
            : FIGURE_LEVELS;
      const i = list.findIndex(x => x === w);
      setWordIdx(i >= 0 ? i : 0);
      setEntered(true);
    },
    [currentUser]
  );

  const activeLevels =
    playSource === "letters"
      ? WORDS
      : playSource === "digits"
        ? DIGIT_LEVELS
        : FIGURE_LEVELS;

  /** Оптимизация: entered/wordIdx өзгермесе қайта есептелмейді. */
  const isAlmaSession = useMemo(
    () =>
      entered &&
      playSource === "letters" &&
      WORDS[wordIdx % WORDS.length].word.trim().toUpperCase() === "АЛМА",
    [entered, playSource, wordIdx]
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

  if (authLoading) {
    return <AppBootstrapLoading />;
  }

  // Кнопка "Войти" → полноэкранный логин
  if (showLogin) {
    return (
      <>
        <LoginPage
          onBack={() => setShowLogin(false)}
          onSuccess={() => setShowLogin(false)}
        />
        <div
          style={{
            position: "fixed",
            top: "max(8px, calc(env(safe-area-inset-top, 0px) + 4px))",
            right: "max(10px, env(safe-area-inset-right, 0px))",
            zIndex: 1000,
          }}
        >
          <BackgroundMusicControls
            on={bgMusicOn}
            volume={bgMusicVolume}
            onToggle={toggleBackgroundMusic}
            onVolumeChange={handleBackgroundMusicVolume}
          />
        </div>
      </>
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
            digitLevels={DIGIT_LEVELS}
            figureLevels={FIGURE_LEVELS}
            onPickWord={handlePickWord}
          />

          <div
            style={{
              position: "fixed",
              top: "max(8px, calc(env(safe-area-inset-top, 0px) + 4px))",
              right: "max(10px, env(safe-area-inset-right, 0px))",
              display: "flex",
              gap: 8,
              alignItems: "center",
              zIndex: 999,
            }}
          >
            <BackgroundMusicControls
              on={bgMusicOn}
              volume={bgMusicVolume}
              onToggle={toggleBackgroundMusic}
              onVolumeChange={handleBackgroundMusicVolume}
            />
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
        <>
          <div
            style={{
              position: "fixed",
              top: "max(8px, calc(env(safe-area-inset-top, 0px) + 4px))",
              right: "max(10px, env(safe-area-inset-right, 0px))",
              left: "auto",
              bottom: "auto",
              zIndex: 999,
            }}
          >
            <BackgroundMusicControls
              on={bgMusicOn}
              volume={bgMusicVolume}
              onToggle={toggleBackgroundMusic}
              onVolumeChange={handleBackgroundMusicVolume}
            />
          </div>
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
              levels={activeLevels}
              sessionKey={playSource}
            />
          </div>
        </>
      )}
    </div>
  );
}
