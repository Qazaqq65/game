import { FONT_DISPLAY_KZ } from "../constants/fonts";
import type { LetterDef, SlotPosition } from "../types";

const tileFont = (h: number) =>
  `bold ${h * 0.84}px ${FONT_DISPLAY_KZ}`;

// ─── Canvas: ghost (hatched outline) ──────────────────────────────────────────

export function drawGhost(canvas: HTMLCanvasElement, ch: string): void {
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);

  const font = tileFont(H);

  // Build hatch on offscreen canvas
  const off = document.createElement("canvas");
  off.width = W; off.height = H;
  const oc = off.getContext("2d")!;

  oc.strokeStyle = "rgba(140,125,110,0.55)";
  oc.lineWidth = 1.1;
  for (let i = -H; i < W + H; i += 7) {
    oc.beginPath(); oc.moveTo(i, 0); oc.lineTo(i + H, H); oc.stroke();
  }
  oc.strokeStyle = "rgba(140,125,110,0.32)";
  oc.lineWidth = 0.8;
  for (let i = -H; i < W + H; i += 7) {
    oc.beginPath(); oc.moveTo(i + H, 0); oc.lineTo(i, H); oc.stroke();
  }

  // Mask hatch to letter shape
  const tmp = document.createElement("canvas");
  tmp.width = W; tmp.height = H;
  const tc = tmp.getContext("2d")!;
  tc.font = font; tc.textAlign = "center"; tc.textBaseline = "alphabetic";
  tc.fillStyle = "#000";
  tc.fillText(ch, W / 2, H * 0.85);

  const mask = tc.getImageData(0, 0, W, H).data;
  const hd = oc.getImageData(0, 0, W, H);
  for (let i = 0; i < mask.length; i += 4)
    hd.data[i + 3] = Math.round(hd.data[i + 3] * mask[i + 3] / 255);
  ctx.putImageData(hd, 0, 0);

  // Outline
  ctx.font = font; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.strokeStyle = "rgba(130,115,100,0.7)";
  ctx.lineWidth = 2.8; ctx.lineJoin = "round";
  ctx.strokeText(ch, W / 2, H * 0.85);
}

// ─── Canvas: colored patterned tile ───────────────────────────────────────────

export function drawTile(canvas: HTMLCanvasElement, letter: LetterDef): void {
  const { ch, color, pat, pc } = letter;
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);

  const font = tileFont(H);

  // Build pattern on offscreen canvas
  const pOff = document.createElement("canvas");
  pOff.width = W; pOff.height = H;
  const pc2 = pOff.getContext("2d")!;
  pc2.fillStyle = color;
  pc2.fillRect(0, 0, W, H);

  if (pat === "dots") {
    for (let x = 8; x < W; x += 16) {
      for (let y = 8; y < H; y += 16) {
        pc2.beginPath(); pc2.arc(x, y, 5, 0, Math.PI * 2);
        pc2.fillStyle = pc + "99"; pc2.fill();
      }
    }
  } else if (pat === "spots") {
    const SPOTS: number[][] = [
      [14,18,8,7],[32,10,6,8],[8,34,7,6],[28,30,9,7],[20,22,5,6],[36,20,7,5],
    ];
    SPOTS.forEach(([sx, sy, rx, ry]) => {
      for (let tx = 0; tx < W; tx += 40) {
        for (let ty = 0; ty < H; ty += 40) {
          pc2.beginPath(); pc2.ellipse(sx+tx, sy+ty, rx, ry, 0, 0, Math.PI*2);
          pc2.fillStyle = pc + "88"; pc2.fill();
        }
      }
    });
  } else if (pat === "lines") {
    pc2.strokeStyle = pc + "77"; pc2.lineWidth = 5;
    for (let x = 0; x < W + H; x += 14) {
      pc2.beginPath(); pc2.moveTo(x, 0); pc2.lineTo(x - H, H); pc2.stroke();
    }
  }

  // Mask pattern to letter shape
  const tmp = document.createElement("canvas");
  tmp.width = W; tmp.height = H;
  const tc = tmp.getContext("2d")!;
  tc.font = font; tc.textAlign = "center"; tc.textBaseline = "alphabetic";
  tc.fillStyle = "#000"; tc.fillText(ch, W / 2, H * 0.85);

  const mask = tc.getImageData(0, 0, W, H).data;
  const pd = pc2.getImageData(0, 0, W, H);
  for (let i = 0; i < mask.length; i += 4)
    pd.data[i + 3] = Math.round(pd.data[i + 3] * mask[i + 3] / 255);
  ctx.putImageData(pd, 0, 0);

  // Outline
  ctx.font = font; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.strokeStyle = pc + "cc";
  ctx.lineWidth = 3; ctx.lineJoin = "round";
  ctx.strokeText(ch, W / 2, H * 0.85);
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

/** Плитка толығымен тақта шегінен шықпауы үшін (scale = transform scale кезінде) */
export function clampTileTopLeft(
  x: number,
  y: number,
  containerW: number,
  containerH: number,
  tileSize: number,
  opts?: { margin?: number; scale?: number }
): { x: number; y: number } {
  const m = opts?.margin ?? 2;
  const s = Math.max(1, opts?.scale ?? 1);
  const W = tileSize;
  const minX = m - (W * (1 - s)) / 2;
  const maxX = containerW - m - (W * (1 + s)) / 2;
  const minY = m - (W * (1 - s)) / 2;
  const maxY = containerH - m - (W * (1 + s)) / 2;
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  };
}

export type ShellContentInsets = {
  /** Жоғарғы панель астындағы ойын жолының үсті */
  top: number;
  /** Төменгі панель үстіндегі ойын жолының асты */
  bottom: number;
};

export function computeSlotPositions(
  count: number,
  containerW: number,
  containerH: number,
  tileSize: number,
  gapX = 10,
  contentInsets?: ShellContentInsets | null
): SlotPosition[] {
  const it = contentInsets?.top ?? 0;
  const ib = contentInsets?.bottom ?? 0;
  const innerH = Math.max(containerH - it - ib, tileSize + 40);

  const totalW = count * tileSize + (count - 1) * gapX;
  const startX = (containerW - totalW) / 2;
  const baseY = it + innerH / 2 - tileSize / 2 - 10;
  /** Тік экранда 6+ әріп: ортасы жоғары көтерілген жұмсақ дуга (∩) */
  const portrait = containerH > containerW;
  const useArc = count > 5 && portrait;

  if (!useArc) {
    return Array.from({ length: count }, (_, i) => ({
      x: startX + i * (tileSize + gapX),
      y: baseY,
    }));
  }

  const maxLift = Math.min(
    36,
    Math.max(16, Math.round(innerH * 0.07)),
  );
  const mid = (count - 1) / 2;

  return Array.from({ length: count }, (_, i) => {
    const t = count > 1 ? (i - mid) / mid : 0;
    const lift = maxLift * (1 - t * t);
    return {
      x: startX + i * (tileSize + gapX),
      y: baseY - lift,
    };
  });
}

export function computeScatterPositions(
  count: number,
  containerW: number,
  containerH: number,
  tileSize: number,
  contentInsets?: ShellContentInsets | null
): { x: number; y: number; r: number }[] {
  const SZ = tileSize;
  const it = contentInsets?.top ?? 0;
  const ib = contentInsets?.bottom ?? 0;
  const innerTop = it + 6;
  const innerBottom = containerH - ib - 6;
  const innerH = Math.max(innerBottom - innerTop, SZ + 24);
  const W = containerW;

  const zones = [
    { x: 24, y: innerTop + 10 },
    { x: W - SZ - 24, y: innerTop + 8 },
    { x: 18, y: innerBottom - SZ - 10 },
    { x: W - SZ - 18, y: innerBottom - SZ - 8 },
    { x: W / 2 - SZ / 2, y: innerTop + innerH * 0.32 },
    { x: 36, y: innerTop + innerH * 0.48 - SZ / 2 },
    { x: W - SZ - 36, y: innerTop + innerH * 0.48 - SZ / 2 },
  ];

  const margin = 4;
  const minY = innerTop + margin;
  const maxY = innerBottom - SZ - margin;
  const minX = margin;
  const maxX = W - SZ - margin;

  return Array.from({ length: count }, (_, i) => {
    const rawX = zones[i % zones.length].x + (Math.random() * 28 - 14);
    const rawY = zones[i % zones.length].y + (Math.random() * 22 - 11);
    const x = Math.max(minX, Math.min(maxX, rawX));
    const y = Math.max(minY, Math.min(maxY, rawY));
    return { x, y, r: Math.random() * 26 - 13 };
  });
}

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
