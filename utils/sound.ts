import { Howl } from "howler";
import { Howler } from "howler";

export function unlockAudio() {
  if (Howler.ctx && Howler.ctx.state !== "running") {
    Howler.ctx.resume();
  }
}
const sounds: Record<string, Howl> = {};
let activeSound: Howl | null = null;

// 🔥 preload
export function preloadSounds(names: string[]) {
  names.forEach(name => {
    const src = `/sounds/${encodeURIComponent(name)}.mp3`;
    sounds[name] = new Howl({
      src: [src],
      volume: 1,
      preload: true,
      html5: false,
      loop: true,
      onloaderror: () => {
        if (import.meta.env.DEV) {
          console.warn(
            `[sound] не загрузился: ${src} — положи файл в public/sounds с тем же символом, что в words.ts (латиница ≠ кириллица, Е ≠ е).`
          );
        }
      },
    });
  });
}

// ▶️ начать звук
export function startSound(name: string) {
  const sound = sounds[name];
  if (!sound) return;

  if (activeSound) {
    activeSound.stop();
  }

  activeSound = sound;
  sound.play();
}

// ⏹ остановить звук
export function stopSound() {
  if (activeSound) {
    activeSound.stop();
    activeSound = null;
  }
}

const winCelebrationHowls = new Map<string, Howl>();
let activeWinCelebrationHowl: Howl | null = null;

function getWinCelebrationHowl(filename: string): Howl {
  let h = winCelebrationHowls.get(filename);
  if (!h) {
    const src = `/music/${encodeURIComponent(filename)}`;
    h = new Howl({
      src: [src],
      volume: 0.62,
      preload: true,
      html5: false,
      loop: false,
      onloaderror: () => {
        if (import.meta.env.DEV) {
          console.warn(
            `[sound] не загрузилась музыка жеңіс: ${src} — қой public/music/${filename}`
          );
        }
      },
    });
    winCelebrationHowls.set(filename, h);
  }
  return h;
}

/** Жеңіс парады үшін mp3 (public/music/), бір рет, цикл жоқ */
export function startWinCelebrationMusic(
  filename: string | undefined | null,
  onEnded?: () => void
) {
  unlockAudio();
  stopSound();
  stopWinCelebrationMusic();
  if (!filename) return;
  const h = getWinCelebrationHowl(filename);
  h.off("end");
  h.stop();
  activeWinCelebrationHowl = h;
  if (onEnded) {
    h.once("end", onEnded);
  }
  h.play();
}

export function stopWinCelebrationMusic() {
  if (activeWinCelebrationHowl) {
    activeWinCelebrationHowl.off("end");
    activeWinCelebrationHowl.stop();
    activeWinCelebrationHowl = null;
  }
}

/** Жеңіс экраны «АЛМА» — бір рет ойнайды (цикл жоқ), тыныш даңғыл */
export function startAppleWinMusic(onEnded?: () => void) {
  startWinCelebrationMusic("apple.mp3", onEnded);
}

export function stopAppleWinMusic() {
  stopWinCelebrationMusic();
}