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
  unlockAudio,
  readBackgroundMusicPreference,
  setBackgroundMusicEnabled,
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
import { useBoardDimensions } from "./hooks/useBoardDimensions";
import type { WordDef } from "./types";

type PlaySource = "letters" | "digits";

/** Сан бөлімі: 2 (санау) және 3 (сандар реті) — әр деңгейді 3 рет шешкенше келесіге өтпейді. */
const DIGIT_MULTI_ROUND_LEVEL_INDICES = new Set([1, 2, 3]);
const DIGIT_MULTI_ROUND_TOTAL = 3;

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

  const idx = wordIdx % levels.length;
  const isDigitMultiRoundLevel =
    sessionKey === "digits" && DIGIT_MULTI_ROUND_LEVEL_INDICES.has(idx);

  useEffect(() => {
    if (!isDigitMultiRoundLevel) {
      setDigitCountRoundsDone(0);
      setDigitCountReplayKey(0);
      return;
    }
    setDigitCountRoundsDone(0);
    setDigitCountReplayKey(0);
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
      }),
    [templateWord, wordIdx, digitCountReplayKey, digitOrderRoundForResolve]
  );
  const boardDims = useBoardDimensions(
    currentWord.dragLetters?.length ?? currentWord.letters.length
  );
  const n = levels.length;

  /** Тек ағымдағы сөздің әріп дыбыстары алдын ала дайындалады. */
  useEffect(() => {
    preloadSoundsForWord(currentWord);
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

  const [winScreenVisible, setWinScreenVisible] = useState(false);

  useEffect(() => {
    setWinScreenVisible(false);
  }, [wordIdx]);

  const onWinReady = useCallback(() => {
    setWinScreenVisible(true);
  }, []);

  const winNextButtonLabel =
    isDigitMultiRoundLevel && digitCountRoundsDone < DIGIT_MULTI_ROUND_TOTAL - 1
      ? digitCountRoundsDone === 0
        ? "Тағы 2 тапсырма →"
        : "Тағы 1 тапсырма →"
      : isDigitMultiRoundLevel &&
          digitCountRoundsDone === DIGIT_MULTI_ROUND_TOTAL - 1
        ? "Келесі деңгей →"
        : undefined;

  const onWinNext = useCallback(() => {
    setWinScreenVisible(false);
    if (
      isDigitMultiRoundLevel &&
      digitCountRoundsDone < DIGIT_MULTI_ROUND_TOTAL - 1
    ) {
      setDigitCountRoundsDone(r => r + 1);
      setDigitCountReplayKey(k => k + 1);
      return;
    }
    if (isDigitMultiRoundLevel) {
      setDigitCountRoundsDone(0);
    }
    onNavigateNext();
  }, [digitCountRoundsDone, isDigitMultiRoundLevel, onNavigateNext]);

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
      />
      <WinScreen
        visible={winScreenVisible}
        word={currentWord.word}
        displayLabel={currentWord.puzzleTitle ?? currentWord.word}
        emoji={currentWord.emoji}
        nextButtonLabel={winNextButtonLabel}
        onNext={onWinNext}
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

  const toggleBackgroundMusic = useCallback(() => {
    unlockAudio();
    const next = !bgMusicOn;
    setBgMusicOn(next);
    setBackgroundMusicEnabled(next);
  }, [bgMusicOn]);

  const handlePickWord = useCallback(
    (w: WordDef, source: PlaySource) => {
      if (!currentUser) {
        setShowAuthGate(true);
        return;
      }
      setPlaySource(source);
      const list = source === "letters" ? WORDS : DIGIT_LEVELS;
      const i = list.findIndex(x => x === w);
      setWordIdx(i >= 0 ? i : 0);
      setEntered(true);
    },
    [currentUser]
  );

  const activeLevels = playSource === "letters" ? WORDS : DIGIT_LEVELS;

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

  if (authLoading) return null;

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
            top: 14,
            right: 16,
            zIndex: 1000,
          }}
        >
          <button
            type="button"
            onClick={toggleBackgroundMusic}
            style={{
              padding: "7px 12px",
              fontSize: 18,
              lineHeight: 1,
              borderRadius: 10,
              border: "none",
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(6px)",
              color: "#555",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
            title={
              bgMusicOn
                ? "Фондық музыканы сөндіру"
                : "Фондық музыканы қосу"
            }
            aria-pressed={bgMusicOn}
          >
            {bgMusicOn ? "🔊" : "🔇"}
          </button>
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
            onPickWord={handlePickWord}
          />

          <div style={{ position: "fixed", top: 14, right: 16, display: "flex", gap: 8, zIndex: 999 }}>
            <button
              type="button"
              onClick={toggleBackgroundMusic}
              style={{
                padding: "7px 12px",
                fontSize: 18,
                lineHeight: 1,
                borderRadius: 10,
                border: "none",
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(6px)",
                color: "#555",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              }}
              title={
                bgMusicOn
                  ? "Фондық музыканы сөндіру"
                  : "Фондық музыканы қосу"
              }
              aria-pressed={bgMusicOn}
            >
              {bgMusicOn ? "🔊" : "🔇"}
            </button>
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
              top: 14,
              right: 16,
              zIndex: 999,
            }}
          >
            <button
              type="button"
              onClick={toggleBackgroundMusic}
              style={{
                padding: "7px 12px",
                fontSize: 18,
                lineHeight: 1,
                borderRadius: 10,
                border: "none",
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(6px)",
                color: "#555",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              }}
              title={
                bgMusicOn
                  ? "Фондық музыканы сөндіру"
                  : "Фондық музыканы қосу"
              }
              aria-pressed={bgMusicOn}
            >
              {bgMusicOn ? "🔊" : "🔇"}
            </button>
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
