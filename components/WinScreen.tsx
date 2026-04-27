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
  lottieUrlForFile,
} from "../utils/celebrationAssets";

interface WinScreenProps {
  word: string;
  emoji: string;
  onNext: () => void;
}

/** WinScreen.module.css: max(winScreenFadeIn 2.2s, celebrationFadeIn ~2.28s) */
const WIN_ENTRANCE_MS = 3400;
/** Жеңіс соңы: алмада — музыкадан кейін, сахнада — парадтан кейін */
const AFTER_WIN_PAUSE_MS = 1250;
/** WinScreen.module.css .chaseParade — winChaseParade бір толық айналым */
const SAVANNA_PARADE_LOOP_MS = 6200;
const CHILD_VIDEO_PLAY_MS = 7000;
const VIRUS_SEQUENCE_STEP_MS = 2200;
const VIRUS_FINAL_HOLD_MS = 1900;
const FLOWER_EXTRA_HOLD_MS = 2200;
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
  lizardData,
  videoUrl,
  actorVariant,
  followUpData,
  virusFrameIndex,
  showDogPartner,
  framedChase,
}: {
  scene: WinCelebrationDef["scene"];
  lionData: object | null;
  lizardData: object | null;
  videoUrl: string | null;
  actorVariant?: WinCelebrationDef["actorVariant"];
  followUpData: object[];
  virusFrameIndex: number;
  showDogPartner: boolean;
  framedChase: boolean;
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

  if (!lionData) return null;

  if (scene === "savanna" && framedChase) {
    if (actorVariant === "dopStaticMoving" && lionData) {
      return (
        <div className={styles.celebrationBackdrop} aria-hidden>
          <div className={styles.appleScene} />
          <div className={styles.appleWarmWash} />
          <div className={styles.appleGlow} />
          <div className={styles.appleCenterStage}>
            <div className={`${styles.appleMatte} ${styles.appleMatteFramedParade}`}>
              <div className={styles.appleFrameChaseClip}>
                <div className={styles.appleFrameChaseGround} aria-hidden />
                <div className={styles.appleFrameBallStatic}>
                  <CelebrationLottieView
                    data={lionData}
                    lottieClassName={styles.lottieBallStaticFramed}
                  />
                </div>
                {lizardData ? (
                  <div className={styles.chaseParadeFramed}>
                    <CelebrationLottieView
                      data={lizardData}
                      lottieClassName={styles.lottieBallFramed}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      );
    }

    const chaseInner = lizardData ? (
      <div className={styles.chasePair}>
        <CelebrationLottieView
          data={lionData}
          lottieClassName={`${styles.lottieLion} ${styles.lottieLionFramed}`}
        />
        <CelebrationLottieView
          data={lizardData}
          lottieClassName={`${styles.lottieLizard} ${styles.lottieLizardFramed}`}
        />
      </div>
    ) : (
      <CelebrationLottieView
        data={lionData}
        lottieClassName={`${styles.lottieLion} ${styles.lottieLionFramed}`}
      />
    );
    return (
      <div className={styles.celebrationBackdrop} aria-hidden>
        <div className={styles.appleScene} />
        <div className={styles.appleWarmWash} />
        <div className={styles.appleGlow} />
        <div className={styles.appleCenterStage}>
          <div className={`${styles.appleMatte} ${styles.appleMatteFramedParade}`}>
            <div className={styles.appleFrameChaseClip}>
              <div className={styles.appleFrameChaseGround} aria-hidden />
              <div className={styles.chaseParadeFramed}>{chaseInner}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.celebrationBackdrop} aria-hidden>
      <div className={styles.savannaPhoto} />
      <div className={styles.sceneSavanna} />
      <div className={styles.groundTrack}>
        <div className={styles.chaseParade}>
          {lizardData ? (
            <div className={styles.chasePair}>
              <CelebrationLottieView
                data={lionData}
                lottieClassName={styles.lottieLion}
              />
              <CelebrationLottieView
                data={lizardData}
                lottieClassName={styles.lottieLizard}
              />
            </div>
          ) : (
            <CelebrationLottieView
              data={lionData}
              lottieClassName={styles.lottieLion}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function loadCelebrationAssets(
  def: WinCelebrationDef,
  signal: { cancelled: boolean }
): Promise<{ lion: object | null; lizard: object | null; followUps: object[] }> {
  if (!def.lottieFile) {
    return Promise.resolve({ lion: null, lizard: null, followUps: [] });
  }
  const lionUrl = winCelebrationLottieUrl(def);
  const lizardUrl = def.chaseLizardFile
    ? lottieUrlForFile(def.chaseLizardFile)
    : null;
  const followUpUrls = (def.followUpLottieFiles ?? []).map(lottieUrlForFile);

  return Promise.all([
    fetchLottieJson(lionUrl),
    lizardUrl ? fetchLottieJson(lizardUrl) : Promise.resolve(null),
    ...followUpUrls.map(url => fetchLottieJson(url)),
  ]).then(([lion, lizard, ...followUps]) => {
    if (signal.cancelled) return { lion: null, lizard: null, followUps: [] };
    return {
      lion,
      lizard,
      followUps: followUps.filter((item): item is object => item != null),
    };
  });
}

export function WinScreen({ word, emoji: _emoji, onNext }: WinScreenProps) {
  const celebration = winCelebrationForWord(word);
  const [lionData, setLionData] = useState<object | null>(null);
  const [lizardData, setLizardData] = useState<object | null>(null);
  const [followUpData, setFollowUpData] = useState<object[]>([]);
  const [virusFrameIndex, setVirusFrameIndex] = useState(0);
  const [showDogPartner, setShowDogPartner] = useState(false);
  const { isLowEnd } = useDeviceTier();
  const childVideoUrl =
    celebration?.videoFile != null
      ? `/lottie/${encodeURIComponent(celebration.videoFile)}`
      : null;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!celebration || isLowEnd) {
      setLionData(null);
      setLizardData(null);
      setFollowUpData([]);
      return;
    }
    if (celebration.scene === "child") {
      setLionData(null);
      setLizardData(null);
      setFollowUpData([]);
      return;
    }
    const signal = { cancelled: false };
    loadCelebrationAssets(celebration, signal).then(({ lion, lizard, followUps }) => {
      if (signal.cancelled) return;
      setLionData(lion);
      setLizardData(lizard);
      setFollowUpData(followUps);
    });
    return () => {
      signal.cancelled = true;
    };
  }, [celebration, isLowEnd]);

  const showParade =
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
    if (!showParade || !celebration || celebration.scene !== "savanna") {
      return;
    }

    const advanceDelta = celebration.winAutoAdvanceDeltaMs ?? 0;
    let cancelled = false;
    const t = window.setTimeout(() => {
      if (!cancelled) {
        onNextRef.current();
      }
    }, WIN_ENTRANCE_MS + SAVANNA_PARADE_LOOP_MS + AFTER_WIN_PAUSE_MS + advanceDelta);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [showParade, celebration]);

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

  const rootClass = showParade
    ? `${styles.root} ${styles.rootParade}`
    : `${styles.root} ${styles.rootPlain}`;

  return createPortal(
    <div
      className={rootClass}
      role="dialog"
      aria-modal="true"
      aria-label={`${word} жиналды`}
    >
      {showParade ? (
        <WinCelebrationScene
          scene={celebration.scene}
          lionData={lionData}
          lizardData={lizardData}
          videoUrl={childVideoUrl}
          actorVariant={celebration.actorVariant}
          followUpData={followUpData}
          virusFrameIndex={virusFrameIndex}
          showDogPartner={showDogPartner}
          framedChase={celebration.framedChase === true}
        />
      ) : null}

      <button
        type="button"
        className={`${styles.nextButton} ${styles.nextButtonCorner}`}
        onClick={onNext}
        aria-label="Алға, келесі сөз"
      >
        Алға →
      </button>
    </div>,
    document.body
  );
}
