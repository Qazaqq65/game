import { memo, useId } from "react";
import { FONT_DISPLAY_KZ } from "../constants/fonts";

interface GhostSlotProps {
  ch: string;
  size: number;
  x: number;
  y: number;
}

function GhostSlotInner({ ch, size, x, y }: GhostSlotProps) {
  const clipUid = useId().replace(/:/g, "");
  const clipId = `ghost-clip-${clipUid}`;
  const hatchId = `ghost-hatch-${clipUid}`;

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
          stroke="rgba(126,111,96,0.78)"
          strokeWidth={2.8}
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
