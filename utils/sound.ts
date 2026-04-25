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

// ── Сөздің толық дыбысталуы (public/sounds/Алма.MP3 т.б.) ────────────
// Әріптер дыбысы (А.mp3, Б.mp3 …) `sounds` мапында, ал толық сөздің
// дыбысы (Алма, Арыстан …) — осында. Файл атауы Capitalize:
// "АЛМА" → "Алма.MP3"; .MP3 және .mp3 кеңейтімдерінің екеуі де
// тексеріледі (production-да Linux case-sensitive болуы мүмкін).

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
            `[sound] жоқ сөз дыбысы: /sounds/${fname}.MP3 — файлды public/sounds/ ішіне қой (Capitalize: бірінші әріп бас, қалғаны кіші).`
          );
        }
      },
    });
    wordPronunciationHowls.set(key, h);
  });
}

/** true — егер дыбыс ойнатыла бастаса; false — файл жоқ/жүктелмеген. */
export function playWordPronunciation(
  word: string,
  onEnded?: () => void
): boolean {
  const key = word.trim().toUpperCase();
  const h = wordPronunciationHowls.get(key);
  if (!h) return false;
  // "loaded" күйде болмаса — ойнатпаймыз (404 болса state "unloaded" қалады).
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

/** Жеңіс экраны «АЛМА» — бір рет ойнайды (цикл жоқ), тыныш даңғыл */
export function startAppleWinMusic(onEnded?: () => void) {
  startWinCelebrationMusic("apple.mp3", onEnded);
}

export function stopAppleWinMusic() {
  stopWinCelebrationMusic();
}