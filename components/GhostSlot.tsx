import { memo, useId } from "react";
import { FONT_DISPLAY_KZ } from "../constants/fonts";

interface GhostSlotProps {
  ch: string;
  size: number;
  x: number;
  y: number;
  /** false — орын бос «карман», дұрыс белгі көрсетілмейді (сан санау т.б.) */
  showGlyph?: boolean;
  /** Қате жауап тасталғанда қызыл; дұрыс snap — жасыл жиек. */
  frameTone?: "neutral" | "wrong" | "ok";
}

const SLOT_STROKE_NEUTRAL = "rgba(126,111,96,0.78)";
const SLOT_STROKE_WRONG = "#d32f2f";
const SLOT_STROKE_OK = "#2e7d32";

function GhostSlotInner({
  ch,
  size,
  x,
  y,
  showGlyph = true,
  frameTone = "neutral",
}: GhostSlotProps) {
  const strokeColor =
    frameTone === "wrong"
      ? SLOT_STROKE_WRONG
      : frameTone === "ok"
        ? SLOT_STROKE_OK
        : SLOT_STROKE_NEUTRAL;
  const accentWide = frameTone === "wrong" || frameTone === "ok";
  const clipUid = useId().replace(/:/g, "");
  const clipId = `ghost-clip-${clipUid}`;
  const hatchId = `ghost-hatch-${clipUid}`;

  const hatchPattern = (
    <pattern
      id={hatchId}
      width={10}
      height={10}
      patternUnits="userSpaceOnUse"
    >
      <path
        d="M-1 1 L1 -1 M4 10 L10 4 M9 11 L11 9"
        stroke="rgba(136,120,105,0.42)"
        strokeWidth={0.55}
        fill="none"
      />
      <path
        d="M11 -1 L9 1 M6 0 L0 6"
        stroke="rgba(136,120,105,0.26)"
        strokeWidth={0.45}
        fill="none"
      />
    </pattern>
  );

  if (!showGlyph) {
    const pad = size * 0.08;
    const w = size - pad * 2;
    const h = size * 0.72;
    const top = (size - h) / 2;
    const rx = size * 0.16;
    return (
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: size,
          height: size,
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          xmlns="http://www.w3.org/2000/svg"
          shapeRendering="optimizeSpeed"
          style={{ display: "block" }}
        >
          <defs>{hatchPattern}</defs>
          <rect
            x={pad}
            y={top}
            width={w}
            height={h}
            rx={rx}
            ry={rx}
            fill="rgba(136,120,105,0.08)"
          />
          <rect
            x={pad}
            y={top}
            width={w}
            height={h}
            rx={rx}
            ry={rx}
            fill={`url(#${hatchId})`}
          />
          <rect
            x={pad}
            y={top}
            width={w}
            height={h}
            rx={rx}
            ry={rx}
            fill="none"
            stroke={strokeColor}
            strokeWidth={accentWide ? 3.2 : 2.8}
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        pointerEvents: "none",
        zIndex: 2,
      }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="optimizeSpeed"
        style={{ display: "block" }}
      >
        <defs>
          {hatchPattern}
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <text
              x={size / 2}
              y={size * 0.85}
              textAnchor="middle"
              fontSize={size * 0.84}
              fontWeight="900"
              fontFamily={FONT_DISPLAY_KZ}
            >
              {ch}
            </text>
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          <rect width={size} height={size} fill="rgba(136,120,105,0.08)" />
          <rect width={size} height={size} fill={`url(#${hatchId})`} />
        </g>

        <text
          x={size / 2}
          y={size * 0.85}
          textAnchor="middle"
          fontSize={size * 0.84}
          fontWeight="900"
          fontFamily={FONT_DISPLAY_KZ}
          fill="none"
          stroke={strokeColor}
          strokeWidth={accentWide ? 3.2 : 2.8}
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          {ch}
        </text>
      </svg>
    </div>
  );
}

export const GhostSlot = memo(GhostSlotInner);
