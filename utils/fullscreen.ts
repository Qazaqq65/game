type FsDoc = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
};

type FsEl = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
};

export function fullscreenElement(): Element | null {
  const d = document as FsDoc;
  return document.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

export function isFullscreenSupported(): boolean {
  const el = document.documentElement as FsEl;
  return (
    typeof el.requestFullscreen === "function" ||
    typeof el.webkitRequestFullscreen === "function"
  );
}

/** Қолданушы басқанда шақыру керек (браузер талабы) */
export async function enterFullscreen(target: HTMLElement = document.documentElement): Promise<void> {
  const el = target as FsEl;
  if (fullscreenElement()) return;
  try {
    if (typeof el.requestFullscreen === "function") {
      await el.requestFullscreen();
    } else if (typeof el.webkitRequestFullscreen === "function") {
      await el.webkitRequestFullscreen();
    }
  } catch {
    /* кей браузерлерде бас тарту */
  }
}

export async function exitFullscreen(): Promise<void> {
  const d = document as FsDoc;
  try {
    if (document.fullscreenElement && typeof document.exitFullscreen === "function") {
      await document.exitFullscreen();
    } else if (d.webkitFullscreenElement && typeof d.webkitExitFullscreen === "function") {
      await d.webkitExitFullscreen();
    }
  } catch {
    /* noop */
  }
}

export async function toggleFullscreen(
  target: HTMLElement = document.documentElement
): Promise<void> {
  if (fullscreenElement()) await exitFullscreen();
  else await enterFullscreen(target);
}
