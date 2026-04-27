import { Howl } from "howler";
import { Howler } from "howler";
import type { WordDef } from "../types";

export function unlockAudio() {
  if (Howler.ctx && Howler.ctx.state !== "running") {
    Howler.ctx.resume();
  }
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
  const src = `/sounds/${encodeURIComponent(name)}.mp3`;
  h = new Howl({
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
    // Көпшілігі .MP3; б1 сияқты кіші .mp3 ғана — екіншісі 404, біріншісі жүктеледі
    src: [`/sounds/${encoded}.MP3`, `/sounds/${encoded}.mp3`],
    format: ["mp3"],
    volume: 1,
    preload: true,
    html5: false,
    loop: false,
    onloaderror: () => {
      if (import.meta.env.DEV) {
        console.warn(
          `[sound] жоқ снап-дыбысы: /sounds/${fname}.MP3 — public/sounds/ (қажет болса) қой.`
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

// ── Сөздің толық дыбысталуы (Алма.MP3 т.б.) ───────────────────────

const wordPronunciationHowls = new Map<string, Howl>();
let activeWordPronunciation: Howl | null = null;

function wordPronunciationFileName(word: string): string {
  const w = word.trim();
  if (!w) return "";
  return w.charAt(0) + w.slice(1).toLowerCase();
}

export function preloadWordPronunciations(words: string[]): void {
  words.forEach(word => {
    const key = word.trim().toUpperCase();
    if (!key || wordPronunciationHowls.has(key)) return;
    const fname = wordPronunciationFileName(word);
    const encoded = encodeURIComponent(fname);
    const h = new Howl({
      src: [`/sounds/${encoded}.MP3`, `/sounds/${encoded}.mp3`],
      format: ["mp3"],
      volume: 1,
      preload: true,
      html5: false,
      loop: false,
      onloaderror: () => {
        if (import.meta.env.DEV) {
          console.warn(
            `[sound] жоқ сөз дыбысы: /sounds/${fname}.MP3 — файлды public/sounds/ ішіне қой.`
          );
        }
      },
    });
    wordPronunciationHowls.set(key, h);
  });
}

export function playWordPronunciation(
  word: string,
  onEnded?: () => void
): boolean {
  const key = word.trim().toUpperCase();
  const h = wordPronunciationHowls.get(key);
  if (!h) return false;
  if (h.state() !== "loaded") return false;

  stopSound();
  stopWordPronunciation();

  activeWordPronunciation = h;
  h.off("end");
  if (onEnded) {
    h.once("end", onEnded);
  }
  h.play();
  return true;
}

export function stopWordPronunciation(): void {
  if (activeWordPronunciation) {
    activeWordPronunciation.off("end");
    activeWordPronunciation.stop();
    activeWordPronunciation = null;
  }
}

// ── Жеңіс музыкасы (public/music/) ──────────────────────────────

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

export function startAppleWinMusic(onEnded?: () => void) {
  startWinCelebrationMusic("apple.mp3", onEnded);
}

export function stopAppleWinMusic() {
  stopWinCelebrationMusic();
}
