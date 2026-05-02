import { Howl } from "howler";
import { Howler } from "howler";
import type { WordDef } from "../types";

export function unlockAudio() {
  if (Howler.ctx && Howler.ctx.state !== "running") {
    Howler.ctx.resume();
  }
  tryStartBackgroundMusic();
}

const sounds: Record<string, Howl> = {};
let activeSound: Howl | null = null;

/**
 * Әріп Howl нысанын жасайды (бір рет). Қайталанған шақыру жаңа Howl
 * жасамайды — артық download/декодинг болмайды.
 */
function ensureLetterHowl(name: string): Howl {
  let h = sounds[name];
  if (h) return h;
  const encoded = encodeURIComponent(name);
  h = new Howl({
    src: [`/sounds/LetterDrag/${encoded}.mp3`],
    volume: 1,
    preload: true,
    html5: false,
    loop: true,
    onloaderror: () => {
      if (import.meta.env.DEV) {
        console.warn(
          `[sound] не загрузился drag-дыбыс: /sounds/LetterDrag/${name}.mp3 — (немесе legacy: /sounds/${name}.mp3). Файл атауын words.ts-тағы әріппен дәл сәйкестендір (латиница ≠ кириллица, Е ≠ е).`
        );
      }
    },
  });
  sounds[name] = h;
  return h;
}

/**
 * Әріптерді алдын ала жүктеу. Идемпотентті — әуелден барларын қайта жасамайды.
 */
export function preloadSounds(names: string[]) {
  names.forEach(ensureLetterHowl);
}

/**
 * Ағымдағы сөздің ӘРІП дыбыстары (drag) + снап-дыбыстары (а1.MP3 …) қана.
 * Сөздің толық дыбысы almost-win-те (preloadWordPronunciations).
 */
export function preloadSoundsForWord(word: WordDef): void {
  const chars = new Set<string>();
  for (const L of word.letters) chars.add(L.ch);
  if (word.dragLetters) {
    for (const L of word.dragLetters) chars.add(L.ch);
  }
  const arr = [...chars];
  preloadSounds(arr);
  preloadLetterSnapSounds(arr);
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

// ── Снап: буква орнына түскенде (а1.MP3, б1.mp3 …) ─────────────────

const letterSnapHowls = new Map<string, Howl>();

function ensureLetterSnapHowl(ch: string): Howl {
  const key = ch.toUpperCase();
  let h = letterSnapHowls.get(key);
  if (h) return h;

  const lower = ch.toLowerCase();
  const fname = `${lower}1`;
  const encoded = encodeURIComponent(fname);

  h = new Howl({
    // Жаңа құрылым: /sounds/a1/*.mp3
    src: [`/sounds/a1/${encoded}.mp3`],
    format: ["mp3"],
    volume: 1,
    preload: true,
    html5: false,
    loop: false,
    onloaderror: () => {
      if (import.meta.env.DEV) {
        console.warn(
          `[sound] жоқ снап-дыбысы: /sounds/a1/${fname}.mp3`
        );
      }
    },
  });
  letterSnapHowls.set(key, h);
  return h;
}

export function preloadLetterSnapSounds(letters: string[]): void {
  letters.forEach(ensureLetterSnapHowl);
}

export function playLetterSnapSound(ch: string): boolean {
  const key = ch.toUpperCase();
  const h = letterSnapHowls.get(key);
  if (!h) return false;
  if (h.state() !== "loaded") return false;

  queueMicrotask(() => {
    if (h.state() !== "loaded") return;
    h.play();
  });
  return true;
}

/** Қате санау/слот — `public/sounds/puzzle-wrong.mp3` қосқанда ойнады. */
let puzzleWrongHowl: Howl | null = null;

function ensurePuzzleWrongHowl(): Howl {
  if (puzzleWrongHowl) return puzzleWrongHowl;
  puzzleWrongHowl = new Howl({
    src: ["/sounds/puzzle-wrong.mp3"],
    format: ["mp3"],
    volume: 0.95,
    preload: true,
    html5: false,
    loop: false,
    onloaderror: () => {
      if (import.meta.env.DEV) {
        console.warn(
          "[sound] жоқ қате жауап дыбысы: public/sounds/puzzle-wrong.mp3"
        );
      }
    },
  });
  return puzzleWrongHowl;
}

export function playPuzzleWrongSound(): void {
  unlockAudio();
  ensurePuzzleWrongHowl().play();
}

// ── Сөздің толық дыбысталуы (Алма.MP3 т.б.) ───────────────────────

const wordPronunciationHowls = new Map<string, Howl>();
let activeWordPronunciation: Howl | null = null;

function wordPronunciationFileName(word: string): string {
  const w = word.trim();
  if (!w) return "";
  return w.charAt(0) + w.slice(1).toLowerCase();
}

function ensureWordPronunciationHowl(word: string): Howl | null {
  const key = word.trim().toUpperCase();
  if (!key) return null;

  const existing = wordPronunciationHowls.get(key);
  if (existing) return existing;

  const fname = wordPronunciationFileName(word);
  if (!fname) return null;
  const encoded = encodeURIComponent(fname);
  const h = new Howl({
    src: [`/sounds/${encoded}.mp3`],
    format: ["mp3"],
    volume: 1,
    preload: true,
    html5: false,
    loop: false,
    onloaderror: () => {
      if (import.meta.env.DEV) {
        console.warn(
          `[sound] жоқ сөз дыбысы: /sounds/${fname}.mp3 — файлды public/sounds/ ішіне қой.`
        );
      }
    },
  });
  wordPronunciationHowls.set(key, h);
  return h;
}

export function preloadWordPronunciations(words: string[]): void {
  words.forEach(word => {
    ensureWordPronunciationHowl(word);
  });
}

export function playWordPronunciation(
  word: string,
  onEnded?: () => void
): boolean {
  const h = ensureWordPronunciationHowl(word);
  if (!h) return false;

  stopSound();
  stopWordPronunciation();

  activeWordPronunciation = h;
  h.off("end");
  h.off("load");

  const playWhenReady = () => {
    if (activeWordPronunciation !== h) return;
    h.off("end");
    h.once("end", () => {
      if (activeWordPronunciation === h) {
        activeWordPronunciation = null;
      }
      onEnded?.();
    });
    h.play();
  };

  if (h.state() === "loaded") {
    playWhenReady();
  } else {
    h.once("load", playWhenReady);
  }

  return true;
}

export function stopWordPronunciation(): void {
  if (activeWordPronunciation) {
    activeWordPronunciation.off("end");
    activeWordPronunciation.off("load");
    activeWordPronunciation.stop();
    activeWordPronunciation = null;
  }
}

// ── Жеңіс музыкасы (public/music/) ──────────────────────────────

const winCelebrationHowls = new Map<string, Howl>();
let activeWinCelebrationHowl: Howl | null = null;

function stopWinCelebrationMusicOnly() {
  if (activeWinCelebrationHowl) {
    activeWinCelebrationHowl.off("end");
    activeWinCelebrationHowl.stop();
    activeWinCelebrationHowl = null;
  }
}

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

export function prefetchWinCelebrationMusic(
  filename: string | null | undefined
): void {
  if (!filename) return;
  getWinCelebrationHowl(filename);
}

export function startWinCelebrationMusic(
  filename: string | undefined | null,
  onEnded?: () => void
) {
  unlockAudio();
  stopSound();
  stopWordPronunciation();
  stopWinCelebrationMusicOnly();
  if (!filename) {
    resumeBackgroundMusicAfterWinIfNeeded();
    return;
  }
  pauseBackgroundMusicForWin();
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
  stopWinCelebrationMusicOnly();
  resumeBackgroundMusicAfterWinIfNeeded();
}

export function startAppleWinMusic(onEnded?: () => void) {
  startWinCelebrationMusic("apple.mp3", onEnded);
}

export function stopAppleWinMusic() {
  stopWinCelebrationMusic();
}

// ── Фоновая музыка (public/music/fon/music.mp3) ───────────────────

export const BACKGROUND_MUSIC_STORAGE_KEY = "kzv3-bg-music";

function readBgMusicDesiredFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(BACKGROUND_MUSIC_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

let backgroundMusicDesired = readBgMusicDesiredFromStorage();
let backgroundMusicHowl: Howl | null = null;
let backgroundMusicPausedForWin = false;

function getBackgroundMusicHowl(): Howl {
  if (!backgroundMusicHowl) {
    backgroundMusicHowl = new Howl({
      src: ["/music/fon/music.mp3"],
      volume: 0.32,
      preload: true,
      html5: false,
      loop: true,
      onloaderror: () => {
        if (import.meta.env.DEV) {
          console.warn(
            "[sound] фон: /music/fon/music.mp3 — қой public/music/fon/music.mp3"
          );
        }
      },
    });
  }
  return backgroundMusicHowl;
}

function tryStartBackgroundMusic() {
  if (!backgroundMusicDesired) {
    if (backgroundMusicHowl?.playing()) {
      backgroundMusicHowl.stop();
    }
    return;
  }
  const h = getBackgroundMusicHowl();
  if (h.playing()) return;
  const go = () => {
    if (!backgroundMusicDesired || backgroundMusicPausedForWin) return;
    h.play();
  };
  if (h.state() === "loaded") {
    go();
  } else {
    h.once("load", go);
  }
}

function pauseBackgroundMusicForWin() {
  const bg = backgroundMusicHowl;
  if (!bg) return;
  if (bg.playing()) {
    bg.pause();
    backgroundMusicPausedForWin = true;
  }
}

function resumeBackgroundMusicAfterWinIfNeeded() {
  if (!backgroundMusicPausedForWin) return;
  backgroundMusicPausedForWin = false;
  if (!backgroundMusicDesired) return;
  const h = getBackgroundMusicHowl();
  if (!h.playing()) {
    h.play();
  }
}

export function setBackgroundMusicEnabled(on: boolean): void {
  backgroundMusicDesired = on;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(BACKGROUND_MUSIC_STORAGE_KEY, on ? "1" : "0");
    } catch {
      /* ignore */
    }
  }
  tryStartBackgroundMusic();
}

export function readBackgroundMusicPreference(): boolean {
  return readBgMusicDesiredFromStorage();
}
