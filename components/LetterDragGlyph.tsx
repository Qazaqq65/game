import { useId, type CSSProperties } from "react";
import { FONT_DISPLAY_KZ } from "../constants/fonts";
import type { LetterDef } from "../types";
import { letterPresetKey } from "../utils/letterPresetKey";
import { Pattern } from "./MonsterLetterPatterns";

/** Оптимизация: Set модуль деңгейінде — әр рендерде жаңа Set құру жоқ. */
const SOLID_FILL_LETTERS = new Set(["А", "Е", "Н", "С", "Т"]);

/** Ортақ SVG стильдері — объект әр рендерде қайта жасалмайды. */
const SVG_BASE: CSSProperties = {
  display: "block",
  touchAction: "none",
  WebkitTouchCallout: "none",
  WebkitUserSelect: "none",
  userSelect: "none",
};

/**
 * Тек framer / көз-ауз жоқ — тек қимыл кезінде, compositor үшін жеңіл.
 * @keyframes анимациялары DraggableTile.module.css-те (бір рет жүктеледі);
 * бұрын әр SVG ішінде <style> қайталанатын еді — DOM/парсинг артық жүктемесі азайды.
 */
export function LetterDragGlyph({
  letter,
  size,
}: {
  letter: LetterDef;
  size: number;
}) {
  const { ch, color, pat, pc } = letter;
  const uid = useId().replace(/:/g, "");
  const clipId = `drag-glyph-${uid}`;
  const cx = size / 2;
  const textY = size * 0.85;
  const fontSize = size * 0.84;
  const isT = ch === "Т" || ch === "т";
  const isA = ch === "А" || ch === "а";
  const isE = ch === "Е" || ch === "е";
  const isP = letterPresetKey(ch) === "Р";
  const isN = ch === "Н" || ch === "н";
  const isSchwa = letterPresetKey(ch) === "Ә";
  const isL = letterPresetKey(ch) === "Л";
  const isM = ch === "М" || ch === "м";
  const isU_bar = letterPresetKey(ch) === "Ұ";
  const noPattern = SOLID_FILL_LETTERS.has(letterPresetKey(ch)) || isM;

  let svgStyle: CSSProperties = SVG_BASE;
  if (isT) {
    svgStyle = {
      ...SVG_BASE,
      transformOrigin: "50% 50%",
      animation: "dragGlyphTwist 0.95s ease-in-out infinite",
    };
  } else if (isA) {
    svgStyle = {
      ...SVG_BASE,
      transformOrigin: "50% 50%",
      animation: "dragGlyphWarmFloat 1.15s ease-in-out infinite",
    };
  } else if (isE) {
    svgStyle = {
      ...SVG_BASE,
      transformOrigin: "50% 50%",
      animation: "dragGlyphMirror 1.5s ease-in-out infinite",
    };
  } else if (isP) {
    svgStyle = {
      ...SVG_BASE,
      transformOrigin: "50% 50%",
      animation: "dragGlyphMirrorY 1.5s ease-in-out infinite",
    };
  } else if (isN) {
    svgStyle = {
      ...SVG_BASE,
      transformOrigin: "50% 50%",
      animation: "dragGlyphSkewN 1.1s ease-in-out infinite",
    };
  } else if (isSchwa) {
    svgStyle = {
      ...SVG_BASE,
      transformOrigin: "50% 50%",
      willChange: "transform",
      animation: "dragGlyphSchwaMove 2.2s ease-in-out infinite",
    };
  } else if (isL) {
    svgStyle = {
      ...SVG_BASE,
      transformOrigin: "50% 72%",
      willChange: "transform",
      animation: "dragGlyphSpringL 1.35s cubic-bezier(0.22, 1, 0.36, 1) infinite",
    };
  } else if (isM) {
    svgStyle = {
      ...SVG_BASE,
      transformOrigin: "50% 50%",
      filter: "drop-shadow(0 0 6px #c084fc) drop-shadow(0 0 14px #a855f7)",
      animation: "dragGlyphNeonPulse 1.6s ease-in-out infinite",
    };
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      overflow="visible"
      xmlns="http://www.w3.org/2000/svg"
      style={svgStyle}
    >
      {isL ? (
        <>
          <defs>
            <clipPath id={`${clipId}-ghost`} clipPathUnits="userSpaceOnUse">
              <text
                x={cx}
                y={textY}
                textAnchor="middle"
                fontSize={fontSize}
                fontWeight="900"
                fontFamily={FONT_DISPLAY_KZ}
              >
                {ch}
              </text>
            </clipPath>
          </defs>
          <g opacity="0.35" style={{ mixBlendMode: "screen" }}>
            <g clipPath={`url(#${clipId}-ghost)`}>
              <rect width={size} height={size} fill={color} />
            </g>
            <text
              x={cx}
              y={textY}
              textAnchor="middle"
              fontSize={fontSize}
              fontWeight="900"
              fontFamily={FONT_DISPLAY_KZ}
              fill="none"
              stroke={pc + "88"}
              strokeWidth={2}
              strokeLinejoin="round"
              paintOrder="stroke"
            >
              {ch}
            </text>
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`${size * 0.03},${-size * 0.08};${-size * 0.03},${-size * 0.06};${size * 0.03},${-size * 0.08}`}
              dur="1.6s"
              repeatCount="indefinite"
            />
          </g>
        </>
      ) : null}
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <text
            x={cx}
            y={textY}
            textAnchor="middle"
            fontSize={fontSize}
            fontWeight="900"
            fontFamily={FONT_DISPLAY_KZ}
          >
            {ch}
          </text>
        </clipPath>
        {isM ? (
          <linearGradient id={`m-neon-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%">
              <animate attributeName="stop-color" values="#a855f7;#ec4899;#22d3ee;#a855f7" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%">
              <animate attributeName="stop-color" values="#ec4899;#22d3ee;#a855f7;#ec4899" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%">
              <animate attributeName="stop-color" values="#22d3ee;#a855f7;#ec4899;#22d3ee" dur="2s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        ) : null}
        {isSchwa ? (
          <linearGradient
            id={`schwa-surface-${uid}`}
            x1="0.1"
            y1="0.05"
            x2="0.95"
            y2="0.92"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%" stopColor="#FFF9ED" stopOpacity="0.55" />
            <stop offset="38%" stopColor="#FFD9A8" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#FFF9ED" stopOpacity="0" />
          </linearGradient>
        ) : null}
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {ch === "С" ? (
          <rect width={size} height={size} fill="#2E86FF">
            <animate
              attributeName="fill"
              values="#FF3B30;#FFD60A;#34C759;#FF3B30"
              dur="1.4s"
              repeatCount="indefinite"
            />
          </rect>
        ) : ch === "А" ? (
          <rect width={size} height={size} fill="#FF8A65">
            <animate
              attributeName="fill"
              values="#FF8A65;#FFB74D;#FF8A65"
              dur="1.2s"
              repeatCount="indefinite"
            />
          </rect>
        ) : isM ? (
          <rect width={size} height={size} fill={`url(#m-neon-${uid})`} />
        ) : (
          <rect width={size} height={size} fill={color} />
        )}
        {!noPattern ? <Pattern pat={pat} pc={pc} size={size} /> : null}
        {isSchwa ? (
          <rect
            width={size}
            height={size}
            fill={`url(#schwa-surface-${uid})`}
            style={{ mixBlendMode: "soft-light" }}
          >
            <animate
              attributeName="opacity"
              values="0.75;1;0.75"
              dur="2.4s"
              repeatCount="indefinite"
            />
          </rect>
        ) : null}
      </g>
      <text
        x={cx}
        y={textY}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="900"
        fontFamily={FONT_DISPLAY_KZ}
        fill="none"
        stroke={isM ? "#ffffffdd" : isU_bar ? "#FF3B30" : pc + "cc"}
        strokeWidth={isU_bar ? 4 : isM ? 2 : 3}
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        {ch}
        {isU_bar ? (
          <animate
            attributeName="stroke"
            values="#FF3B30;#FF9500;#FFD60A;#34C759;#007AFF;#AF52DE;#FF2D55;#FF3B30"
            dur="1.8s"
            repeatCount="indefinite"
          />
        ) : null}
      </text>
    </svg>
  );
}
