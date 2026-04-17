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

const APPLE_WIN_SRC = "/music/apple.mp3";
let appleWinMusic: Howl | null = null;

function getAppleWinMusic(): Howl {
  if (!appleWinMusic) {
    appleWinMusic = new Howl({
      src: [APPLE_WIN_SRC],
      volume: 0.62,
      preload: true,
      html5: false,
      loop: false,
      onloaderror: () => {
        if (import.meta.env.DEV) {
          console.warn(
            `[sound] не загрузилась музыка жеңіс: ${APPLE_WIN_SRC} — қой public/music/apple.mp3`
          );
        }
      },
    });
  }
  return appleWinMusic;
}

/** Жеңіс экраны «АЛМА» — бір рет ойнайды (цикл жоқ), тыныш даңғыл */
export function startAppleWinMusic(onEnded?: () => void) {
  unlockAudio();
  stopSound();
  const h = getAppleWinMusic();
  h.off("end");
  h.stop();
  if (onEnded) {
    h.once("end", onEnded);
  }
  h.play();
}

export function stopAppleWinMusic() {
  if (appleWinMusic) {
    appleWinMusic.off("end");
    appleWinMusic.stop();
  }
}