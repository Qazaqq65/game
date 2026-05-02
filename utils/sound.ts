import { Howl } from "howler";
import { Howler } from "howler";
import type { WordDef } from "../types";

/** Бір таңбалы ASCII сан (сан пазлы) — public/sounds/numbers/0-9/0.mp3 … 9.mp3 */
function isDigitGlyph(ch: string): boolean {
  return /^[0-9]$/.test(ch);
}

/** Сан дыбыстары осы қапшықта (аты «0-9» ішкі бумасы). */
function digitSoundUrl(d: string): string {
  const b = import.meta.env.BASE_URL ?? "/";
  const root = b.endsWith("/") ? b : `${b}/`;
  return `${root}sounds/numbers/0-9/${encodeURIComponent(d)}.mp3`;
}

/** numbers/comment/ — деңгейге кіргенде баяндау (денгей1.mp3, денгей2.mp3). */
function digitLevelCommentUrl(filename: string): string {
  const b = import.meta.env.BASE_URL ?? "/";
  const root = b.endsWith("/") ? b : `${b}/`;
  return `${root}sounds/numbers/comment/${encodeURIComponent(filename)}`;
}

/** Дұрыс орынға қойғанда — кездейсоқ; жаңа mp3 қосу үшін массивке атау қосыңыз. */
export const PUZZLE_CORRECT_FEEDBACK_FILES = [
  "керемет.mp3",
  "дұрысжарайсын.mp3",
  "Өтежақсы.mp3",
  "Тапкырсын.mp3",
] as const;

/**
 * Қате слот — кездейсоқ; жаңа mp3 қосу үшін массивке атау қосыңыз.
 * (бұрынғы puzzle-wrong.mp3 орнына.)
 */
export const PUZZLE_WRONG_FEEDBACK_FILES = [
  "тагыдаойлан.mp3",
  "жок.mp3",
] as const;

function pickFeedbackFile<T extends readonly string[]>(arr: T): T[number] {
  return arr[Math.floor(Math.random() * arr.length)] as T[number];
}

const puzzleFeedbackHowls = new Map<string, Howl>();

function ensurePuzzleFeedbackHowl(filename: string): Howl {
  let h = puzzleFeedbackHowls.get(filename);
  if (h) return h;
  h = new Howl({
    src: [digitLevelCommentUrl(filename)],
    format: ["mp3"],
    volume: 1,
    preload: true,
    html5: false,
    loop: false,
    onloaderror: () => {
      if (import.meta.env.DEV) {
        console.warn(
          `[sound] puzzle feedback жоқ: sounds/numbers/comment/${filename}`
        );
      }
    },
  });
  puzzleFeedbackHowls.set(filename, h);
  return h;
}

function playPuzzleFeedbackHowl(h: Howl): void {
  const run = () => {
    h.stop();
    h.play();
  };
  if (h.state() === "loaded") {
    queueMicrotask(run);
  } else {
    h.once("load", run);
  }
}

/** Дұрыс slotқа snap — мадақтау. */
export function playPuzzleCorrectFeedbackSound(): void {
  unlockAudio();
  stopSound();
  const file = pickFeedbackFile(PUZZLE_CORRECT_FEEDBACK_FILES);
  playPuzzleFeedbackHowl(ensurePuzzleFeedbackHowl(file));
}

/** Қате слот — үйрету дыбысы. */
export function playPuzzleWrongSound(): void {
  unlockAudio();
  stopSound();
  const file = pickFeedbackFile(PUZZLE_WRONG_FEEDBACK_FILES);
  playPuzzleFeedbackHowl(ensurePuzzleFeedbackHowl(file));
}

export function preloadPuzzleFeedbackSounds(): void {
  for (const f of PUZZLE_CORRECT_FEEDBACK_FILES) {
    ensurePuzzleFeedbackHowl(f);
  }
  for (const f of PUZZLE_WRONG_FEEDBACK_FILES) {
    ensurePuzzleFeedbackHowl(f);
  }
}

const digitLevelIntroHowls = new Map<1 | 2, Howl>();

function ensureDigitLevelIntroHowl(level: 1 | 2): Howl {
  let h = digitLevelIntroHowls.get(level);
  if (h) return h;

  const filename = level === 1 ? "денгей1.mp3" : "денгей2.mp3";
  h = new Howl({
    src: [digitLevelCommentUrl(filename)],
    format: ["mp3"],
    volume: 1,
    preload: true,
    html5: false,
    loop: false,
    onloaderror: () => {
      if (import.meta.env.DEV) {
        console.warn(
          `[sound] деңгей кіріс дыбысы жоқ: sounds/numbers/comment/${filename}`
        );
      }
    },
  });
  digitLevelIntroHowls.set(level, h);
  return h;
}

/** Негізгі менюда шақырылғанда — денгей1/денгей2 кешке түседі, ойынға кіргенде кідіріс азаяды. */
export function preloadDigitLevelIntroSounds(): void {
  ensureDigitLevelIntroHowl(1);
  ensureDigitLevelIntroHowl(2);
}

/**
 * Сан бөлімі 1 және 2-деңгей: тапсырма экраны ашылғанда comment дыбысын ойнатады.
 * Қайта раунд (сол деңгейдің 2–3 тапсырмасы) кезінде қайталанбайды — тек wordIdx өзгергенде.
 */
export function playDigitLevelIntroSound(levelNumber: number | undefined): void {
  if (levelNumber !== 1 && levelNumber !== 2) return;
  unlockAudio();
  const h = ensureDigitLevelIntroHowl(levelNumber);
  const run = () => {
    h.stop();
    h.play();
  };
  if (h.state() === "loaded") {
    queueMicrotask(run);
  } else {
    h.once("load", run);
  }
}

export function unlockAudio() {
  if (Howler.ctx && Howler.ctx.state !== "running") {
    Howler.ctx.resume();
  }
  tryStartBackgroundMusic();
}

const sounds: Record<string, Howl> = {};
let activeSound: Howl | null = null;

/**
 * Drag үстінде үздіксіз ойнайтын дыбыс: әріп → LetterDrag, сан → numbers/.
 */
function ensureLetterHowl(name: string): Howl {
  let h = sounds[name];
  if (h) return h;

  if (isDigitGlyph(name)) {
    h = new Howl({
      src: [digitSoundUrl(name)],
      format: ["mp3"],
      volume: 1,
      preload: true,
      html5: false,
      loop: true,
      onloaderror: () => {
        if (import.meta.env.DEV) {
          console.warn(
            `[sound] сан drag дыбысы жоқ: sounds/numbers/0-9/${name}.mp3 — файл осында тұру керек.`
          );
        }
      },
    });
  } else {
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
  }
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
 * Ағымдағы сөздің drag + snap дыбыстары: әріп (LetterDrag / a1), сан (numbers/0-9/).
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
  preloadPuzzleFeedbackSounds();
}

// ▶️ начать звук
export function startSound(name: string) {
  unlockAudio();
  const sound = ensureLetterHowl(name);

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

// ── Снап: әріп a1/*.mp3, сан numbers/0-9/*.mp3 ───────────────────────

const letterSnapHowls = new Map<string, Howl>();

function ensureLetterSnapHowl(ch: string): Howl {
  const key = ch.toUpperCase();
  let h = letterSnapHowls.get(key);
  if (h) return h;

  if (isDigitGlyph(key)) {
    h = new Howl({
      src: [digitSoundUrl(key)],
      format: ["mp3"],
      volume: 1,
      preload: true,
      html5: false,
      loop: false,
      onloaderror: () => {
        if (import.meta.env.DEV) {
          console.warn(
            `[sound] жоқ сан snap дыбысы: sounds/numbers/0-9/${key}.mp3`
          );
        }
      },
    });
  } else {
    const lower = ch.toLowerCase();
    const fname = `${lower}1`;
    const encoded = encodeURIComponent(fname);

    h = new Howl({
      src: [`/sounds/a1/${encoded}.mp3`],
      format: ["mp3"],
      volume: 1,
      preload: true,
      html5: false,
      loop: false,
      onloaderror: () => {
        if (import.meta.env.DEV) {
          console.warn(`[sound] жоқ снап-дыбысы: /sounds/a1/${fname}.mp3`);
        }
      },
    });
  }
  letterSnapHowls.set(key, h);
  return h;
}

/** Бір Howl бойынша snap→кері байланыс кідірткісі (қайта oynatқанда үзіледі). */
const letterSnapPendingFallbacks = new WeakMap<Howl, number>();

function clearLetterSnapPendingCallbacks(h: Howl): void {
  const prev = letterSnapPendingFallbacks.get(h);
  if (prev != null) {
    window.clearTimeout(prev);
    letterSnapPendingFallbacks.delete(h);
  }
  h.off("end");
}

export function preloadLetterSnapSounds(letters: string[]): void {
  letters.forEach(ensureLetterSnapHowl);
}

/** snap аяқталғанын күтпей қалса (қате жүктеу т.б.) — осыдан кейін мадақтау. */
const SNAP_THEN_FEEDBACK_FALLBACK_MS = 1400;

export function playLetterSnapSound(
  ch: string,
  onAfterSnap?: () => void
): boolean {
  unlockAudio();
  const h = ensureLetterSnapHowl(ch);
  let fallbackId: number | null = null;

  const clearFallback = () => {
    if (fallbackId != null) {
      window.clearTimeout(fallbackId);
      letterSnapPendingFallbacks.delete(h);
      fallbackId = null;
    }
  };

  let afterFired = false;
  const fireAfter = () => {
    if (afterFired) return;
    afterFired = true;
    clearFallback();
    h.off("end", fireAfter);
    letterSnapPendingFallbacks.delete(h);
    onAfterSnap?.();
  };

  const playIt = () => {
    clearLetterSnapPendingCallbacks(h);

    if (h.state() !== "loaded") {
      onAfterSnap?.();
      return;
    }
    if (onAfterSnap) {
      h.once("end", fireAfter);
      fallbackId = window.setTimeout(fireAfter, SNAP_THEN_FEEDBACK_FALLBACK_MS);
      letterSnapPendingFallbacks.set(h, fallbackId);
    }
    h.play();
  };

  if (h.state() === "loaded") {
    queueMicrotask(playIt);
    return true;
  }
  h.once("load", playIt);
  return true;
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

/** Жоғарғы шек (слайдер 100% = осы Howler volume). */
export const BACKGROUND_MUSIC_VOLUME_MAX = 1.5;

export const BACKGROUND_MUSIC_VOLUME_STORAGE_KEY = "kzv3-bg-music-level";

export const BACKGROUND_MUSIC_STORAGE_KEY = "kzv3-bg-music";

const DEFAULT_BACKGROUND_MUSIC_VOLUME = 0;

function clampBackgroundMusicVolume(v: number): number {
  if (!Number.isFinite(v)) return DEFAULT_BACKGROUND_MUSIC_VOLUME;
  return Math.max(0, Math.min(BACKGROUND_MUSIC_VOLUME_MAX, v));
}

function readBackgroundMusicVolumeFromStorage(): number {
  if (typeof window === "undefined") return DEFAULT_BACKGROUND_MUSIC_VOLUME;
  try {
    const s = localStorage.getItem(BACKGROUND_MUSIC_VOLUME_STORAGE_KEY);
    if (s == null) return DEFAULT_BACKGROUND_MUSIC_VOLUME;
    const parsed = parseFloat(s);
    return Number.isFinite(parsed)
      ? clampBackgroundMusicVolume(parsed)
      : DEFAULT_BACKGROUND_MUSIC_VOLUME;
  } catch {
    return DEFAULT_BACKGROUND_MUSIC_VOLUME;
  }
}

function readBgMusicDesiredFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(BACKGROUND_MUSIC_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

let backgroundMusicDesired = readBgMusicDesiredFromStorage();
/** Ағымдағы деңгей (localStorage-пен синхрон). */
let backgroundMusicVolume = readBackgroundMusicVolumeFromStorage();
let backgroundMusicHowl: Howl | null = null;
let backgroundMusicPausedForWin = false;
/**
 * unlockAudio() көп рет шақырылғанда `once("load")` үстіне үстінен қосылып,
 * жүктелген соң бірнеше play() шақырылып екі қабат фон шығып жүрген.
 */
let backgroundMusicLoadListenerAttached = false;

function getBackgroundMusicHowl(): Howl {
  if (!backgroundMusicHowl) {
    backgroundMusicHowl = new Howl({
      src: ["/music/fon/music.mp3"],
      volume: backgroundMusicVolume,
      preload: true,
      html5: false,
      loop: true,
      onloaderror: () => {
        backgroundMusicLoadListenerAttached = false;
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
    backgroundMusicLoadListenerAttached = false;
    backgroundMusicHowl?.stop();
    return;
  }
  const h = getBackgroundMusicHowl();
  if (h.playing()) return;

  const startPlayback = () => {
    if (!backgroundMusicDesired || backgroundMusicPausedForWin) return;
    h.play();
  };

  if (h.state() === "loaded") {
    startPlayback();
    return;
  }

  if (backgroundMusicLoadListenerAttached) return;
  backgroundMusicLoadListenerAttached = true;
  h.once("load", () => {
    backgroundMusicLoadListenerAttached = false;
    startPlayback();
  });
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

/** Ағымдағы фондық дыбыс деңгейі (0 … BACKGROUND_MUSIC_VOLUME_MAX). */
export function readBackgroundMusicVolume(): number {
  return backgroundMusicVolume;
}

/** Деңгейді сақтау + Howl-ға қолдану (ойнап жатса да жаңарады). */
export function setBackgroundMusicVolume(volume: number): void {
  backgroundMusicVolume = clampBackgroundMusicVolume(volume);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        BACKGROUND_MUSIC_VOLUME_STORAGE_KEY,
        String(backgroundMusicVolume)
      );
    } catch {
      /* ignore */
    }
  }
  if (backgroundMusicHowl) {
    backgroundMusicHowl.volume(backgroundMusicVolume);
  }
}
