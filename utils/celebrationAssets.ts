/**
 * Lottie JSON ассетерінің ортақ кэші және celebration префетчі.
 *
 * Кэш модуль деңгейінде → ремоунт JSON-ды қайта жүктемейді.
 * In-flight Map қос параллель fetch-тен сақтайды (StrictMode double-effect,
 * префетч+WinScreen бір мезгілде сұраса т.б.).
 *
 * `fetchLottieJson` — кез келген Lottie JSON үшін (MenuMascot, WinScreen).
 * `prefetchCelebrationAssets` — сөздің бүкіл celebration файлдар жинағы үшін.
 */
import {
  winCelebrationForWord,
  winCelebrationLottieUrl,
  type WinCelebrationDef,
} from "../data/winCelebrations";

const lottieJsonCache = new Map<string, object>();
const inflightFetches = new Map<string, Promise<object | null>>();

export function lottieUrlForFile(file: string): string {
  return `/lottie/${encodeURIComponent(file)}`;
}

/** Кеш + dedup-пен Lottie JSON-ды жүктейді. Қайталанған шақыру download жасамайды. */
export function fetchLottieJson(url: string): Promise<object | null> {
  const cached = lottieJsonCache.get(url);
  if (cached) return Promise.resolve(cached);

  const inflight = inflightFetches.get(url);
  if (inflight) return inflight;

  const p = fetch(url)
    .then(r => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    })
    .then(json => {
      inflightFetches.delete(url);
      if (json && typeof json === "object") {
        lottieJsonCache.set(url, json as object);
        return json as object;
      }
      return null;
    })
    .catch(() => {
      inflightFetches.delete(url);
      return null;
    });

  inflightFetches.set(url, p);
  return p;
}

function celebrationLottieUrls(def: WinCelebrationDef): string[] {
  const urls: string[] = [];
  if (def.lottieFile) urls.push(winCelebrationLottieUrl(def));
  if (def.chaseLizardFile) urls.push(lottieUrlForFile(def.chaseLizardFile));
  for (const f of def.followUpLottieFiles ?? []) {
    urls.push(lottieUrlForFile(f));
  }
  return urls;
}

/** Сөздің celebration JSON-дарын фоновта жүктеп қояды (idle-те шақыру керек). */
export function prefetchCelebrationAssets(word: string): void {
  const def = winCelebrationForWord(word);
  if (!def) return;
  for (const url of celebrationLottieUrls(def)) {
    void fetchLottieJson(url);
  }
  // mp4 (videoFile) — <video preload="auto"> өзі жасайды; қолмен дәлелдемейміз.
  // musicFile — utils/sound.ts → prefetchWinCelebrationMusic арқылы.
}
