import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLottie } from "lottie-react";
import { useDeviceTier } from "../hooks/useDeviceTier";
import { useInViewport } from "../hooks/useInViewport";
import {
  winCelebrationForWord,
  winCelebrationLottieUrl,
  type WinCelebrationDef,
} from "../data/winCelebrations";
import styles from "./WinScreen.module.css";
import {
  startWinCelebrationMusic,
  stopWinCelebrationMusic,
} from "../utils/sound";
import {
  fetchLottieJson,
  getCachedLottieJson,
  lottieUrlForFile,
} from "../utils/celebrationAssets";

interface WinScreenProps {
  word: string;
  /** aria және көрсету үшін (цифрлық деңгей тақырыбы т.б.) */
  displayLabel?: string;
  emoji: string;
  onNext: () => void;
  /** Берілмесе — «Алға →» (мысалы, 2-цифрлық тапсырма қайта ойналғанда). */
  nextButtonLabel?: string;
  /** false — overlay жасырылған, бірақ компонент DOM-да қалуы мүмкін (Lottie қайта құралмасын). */
  visible: boolean;
  /**
   * Сан / пішіндер — Lottie парады қолданылмайды, қысқа статикалық жеңіс.
   * Әріптер режимінде әдепкі «letters».
   */
  variant?: "letters" | "digits" | "figures";
}

/** WinScreen.module.css: max(winScreenFadeIn 2.2s, celebrationFadeIn ~2.28s) */
const WIN_ENTRANCE_MS = 3400;
/** Жеңіс соңы: алмада — музыкадан кейін, child-та — видео біткен соң */
const AFTER_WIN_PAUSE_MS = 1250;
const CHILD_VIDEO_PLAY_MS = 7000;
const VIRUS_SEQUENCE_STEP_MS = 2200;
const VIRUS_FINAL_HOLD_MS = 1900;
const FLOWER_EXTRA_HOLD_MS = 4200;
const ROCKET_EXTRA_HOLD_MS = 2500;
const DOG_SECOND_DELAY_MS = 2000;

function CelebrationLottieView({
  data,
  lottieClassName,
}: {
  data: object;
  lottieClassName: string;
}) {
  const { targetRef, inViewport } = useInViewport<HTMLDivElement>({
    rootMargin: "120px 0px",
    threshold: 0.01,
  });
  const { View, play, stop } = useLottie(
    {
      animationData: data,
      loop: true,
      className: lottieClassName,
    },
    { margin: 0 }
  );
  useEffect(() => {
    if (inViewport) {
      play();
      return;
    }
    stop();
  }, [inViewport, play, stop]);
  return (
    <div ref={targetRef} className={styles.lottieMount}>
      {View}
    </div>
  );
}

function WinCelebrationScene({
  scene,
  lionData,
  videoUrl,
  actorVariant,
  followUpData,
  virusFrameIndex,
  showDogPartner,
}: {
  scene: WinCelebrationDef["scene"];
  lionData: object | null;
  videoUrl: string | null;
  actorVariant?: WinCelebrationDef["actorVariant"];
  followUpData: object[];
  virusFrameIndex: number;
  showDogPartner: boolean;
}) {
  if (scene === "apple" && lionData) {
    if (actorVariant === "dogpair") {
      const secondDogData = followUpData[0] ?? null;
      return (
        <div className={styles.celebrationBackdrop} aria-hidden>
          <div className={styles.appleScene} />
          <div className={styles.appleWarmWash} />
          <div className={styles.appleGlow} />
          <div className={styles.appleCenterStage}>
            <div className={styles.appleMatte}>
              <div className={styles.dogPair}>
                <CelebrationLottieView
                  data={lionData}
                  lottieClassName={`${styles.lottieApple} ${styles.lottieDogPrimary}`}
                />
                {showDogPartner && secondDogData ? (
                  <CelebrationLottieView
                    data={secondDogData}
                    lottieClassName={`${styles.lottieApple} ${styles.lottieDogSecondary}`}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      );
    }

    const appleData =
      actorVariant === "virus"
        ? [lionData, ...followUpData][Math.min(virusFrameIndex, followUpData.length)] ?? lionData
        : lionData;
    return (
      <div className={styles.celebrationBackdrop} aria-hidden>
        <div className={styles.appleScene} />
        <div className={styles.appleWarmWash} />
        <div className={styles.appleGlow} />
        <div className={styles.appleCenterStage}>
          <div className={styles.appleMatte}>
            <CelebrationLottieView
              data={appleData}
              lottieClassName={`${styles.lottieApple} ${
                actorVariant === "virus" ? styles.lottieVirus : ""
              }`}
            />
          </div>
        </div>
      </div>
    );
  }

  if (scene === "child" && videoUrl) {
    return (
      <div className={styles.celebrationBackdrop} aria-hidden>
        <div className={styles.appleScene} />
        <div className={styles.appleWarmWash} />
        <div className={styles.appleGlow} />
        <div className={styles.appleCenterStage}>
          <div className={styles.appleMatte}>
            <video
              className={styles.videoChild}
              src={videoUrl}
              autoPlay
              muted
              playsInline
              preload="auto"
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function loadCelebrationAssets(
  def: WinCelebrationDef,
  signal: { cancelled: boolean }
): Promise<{ lion: object | null; followUps: object[] }> {
  if (!def.lottieFile) {
    return Promise.resolve({ lion: null, followUps: [] });
  }
  const lionUrl = winCelebrationLottieUrl(def);
  const followUpUrls = (def.followUpLottieFiles ?? []).map(lottieUrlForFile);

  return Promise.all([
    fetchLottieJson(lionUrl),
    ...followUpUrls.map(url => fetchLottieJson(url)),
  ]).then(([lion, ...followUps]) => {
    if (signal.cancelled) return { lion: null, followUps: [] };
    return {
      lion,
      followUps: followUps.filter((item): item is object => item != null),
    };
  });
}

export function WinScreen({
  word,
  displayLabel,
  emoji,
  onNext,
  nextButtonLabel,
  visible,
  variant = "letters",
}: WinScreenProps) {
  const minimalWinVariant =
    variant === "digits" || variant === "figures";
  const celebration = minimalWinVariant
    ? null
    : winCelebrationForWord(word);
  const [lionData, setLionData] = useState<object | null>(null);
  const [followUpData, setFollowUpData] = useState<object[]>([]);
  const [virusFrameIndex, setVirusFrameIndex] = useState(0);
  const [showDogPartner, setShowDogPartner] = useState(false);
  const { isLowEnd } = useDeviceTier();
  const childVideoUrl =
    celebration?.videoFile != null
      ? `/lottie/${encodeURIComponent(celebration.videoFile)}`
      : null;

  useEffect(() => {
    setLionData(null);
    setFollowUpData([]);
    setVirusFrameIndex(0);
    setShowDogPartner(false);
  }, [word]);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (!celebration || isLowEnd) {
      setLionData(null);
      setFollowUpData([]);
      return;
    }
    if (celebration.scene === "child") {
      setLionData(null);
      setFollowUpData([]);
      return;
    }

    const lionUrl = celebration.lottieFile
      ? winCelebrationLottieUrl(celebration)
      : null;
    const followUpUrls = (celebration.followUpLottieFiles ?? []).map(lottieUrlForFile);
    const cachedLion = lionUrl ? getCachedLottieJson(lionUrl) : null;
    const cachedFollowUps = followUpUrls.map(getCachedLottieJson);
    const hasAllCachedFollowUps = cachedFollowUps.every(Boolean);
    if (cachedLion && hasAllCachedFollowUps) {
      setLionData(cachedLion);
      setFollowUpData(cachedFollowUps.filter((x): x is object => x != null));
      return;
    }

    const signal = { cancelled: false };
    loadCelebrationAssets(celebration, signal).then(({ lion, followUps }) => {
      if (signal.cancelled) return;
      setLionData(lion);
      setFollowUpData(followUps);
    });
    return () => {
      signal.cancelled = true;
    };
  }, [visible, celebration, isLowEnd]);

  const showParade =
    visible &&
    celebration != null &&
    !isLowEnd &&
    (celebration.scene === "child" ? childVideoUrl != null : lionData != null);

  useEffect(() => {
    if (!showParade || !celebration?.musicFile) {
      stopWinCelebrationMusic();
      return;
    }
    startWinCelebrationMusic(celebration.musicFile);
    return () => {
      stopWinCelebrationMusic();
    };
  }, [showParade, celebration]);

  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;

  useEffect(() => {
    setVirusFrameIndex(0);
    if (!showParade || !celebration || celebration.actorVariant !== "virus") {
      return;
    }
    const timers: number[] = [];
    (followUpData.length > 0 ? followUpData : [null]).forEach((_, idx) => {
      timers.push(
        window.setTimeout(() => {
          setVirusFrameIndex(idx + 1);
        }, VIRUS_SEQUENCE_STEP_MS * (idx + 1))
      );
    });
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [showParade, celebration, followUpData]);

  useEffect(() => {
    setShowDogPartner(false);
    if (!showParade || !celebration || celebration.actorVariant !== "dogpair") {
      return;
    }
    const t = window.setTimeout(() => {
      setShowDogPartner(true);
    }, DOG_SECOND_DELAY_MS);
    return () => {
      clearTimeout(t);
    };
  }, [showParade, celebration]);

  useEffect(() => {
    if (!showParade || !celebration || celebration.scene !== "apple") {
      return;
    }

    const sequenceExtraMs =
      celebration.actorVariant === "virus"
        ? followUpData.length * VIRUS_SEQUENCE_STEP_MS + VIRUS_FINAL_HOLD_MS
        : celebration.actorVariant === "flower"
          ? FLOWER_EXTRA_HOLD_MS
          : celebration.actorVariant === "rocket"
            ? ROCKET_EXTRA_HOLD_MS
          : 0;
    const advanceDelta = celebration.winAutoAdvanceDeltaMs ?? 0;
    let cancelled = false;
    const t = window.setTimeout(() => {
      if (!cancelled) {
        onNextRef.current();
      }
    }, WIN_ENTRANCE_MS + sequenceExtraMs + AFTER_WIN_PAUSE_MS + advanceDelta);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [showParade, celebration, followUpData.length]);

  useEffect(() => {
    if (!showParade || !celebration || celebration.scene !== "child") {
      return;
    }

    let cancelled = false;
    const t = window.setTimeout(() => {
      if (!cancelled) {
        onNextRef.current();
      }
    }, WIN_ENTRANCE_MS + CHILD_VIDEO_PLAY_MS + AFTER_WIN_PAUSE_MS);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [showParade, celebration]);

  const rootClass = [
    styles.root,
    !visible ? styles.rootHidden : "",
    minimalWinVariant
      ? styles.rootDigits
      : showParade
        ? styles.rootParade
        : styles.rootPlain,
  ]
    .filter(Boolean)
    .join(" ");

  return createPortal(
    <div
      className={rootClass}
      role="dialog"
      aria-modal={visible}
      aria-hidden={!visible}
      aria-label={`${displayLabel ?? word} жиналды`}
    >
      {minimalWinVariant ? (
        <div className={styles.digitsWinPanel}>
          <span className={styles.digitsWinEmoji} aria-hidden>
            {emoji}
          </span>
          <p className={styles.digitsWinTitle}>{displayLabel ?? word}</p>
          <p className={styles.digitsWinTag}>Жарайсың!</p>
          <button
            type="button"
            className={`${styles.nextButton} ${styles.digitsWinNext}`}
            onClick={onNext}
            aria-label={
              nextButtonLabel != null
                ? nextButtonLabel.replace(/→/g, "").trim()
                : "Алға"
            }
          >
            {nextButtonLabel ?? "Алға →"}
          </button>
        </div>
      ) : (
        <>
          {showParade && celebration ? (
            <WinCelebrationScene
              scene={celebration.scene}
              lionData={lionData}
              videoUrl={childVideoUrl}
              actorVariant={celebration.actorVariant}
              followUpData={followUpData}
              virusFrameIndex={virusFrameIndex}
              showDogPartner={showDogPartner}
            />
          ) : null}

          <button
            type="button"
            className={`${styles.nextButton} ${styles.nextButtonCorner}`}
            onClick={onNext}
            aria-label={
              nextButtonLabel != null
                ? nextButtonLabel.replace(/→/g, "").trim()
                : "Алға, келесі сөз"
            }
          >
            {nextButtonLabel ?? "Алға →"}
          </button>
        </>
      )}
    </div>,
    document.body
  );
}
