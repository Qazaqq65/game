import { useId } from "react";
import { motion } from "framer-motion";
import { FONT_DISPLAY_KZ } from "../constants/fonts";
import type { PatternType } from "../types";
import { letterPresetKey } from "../utils/letterPresetKey";

const isElLetter = (ch: string) => letterPresetKey(ch) === "Л";
import { MonsterLetterA } from "./MonsterLetterA";
import { Pattern } from "./MonsterLetterPatterns";

interface MonsterLetterProps {
  ch: string;
  size: number;
  color: string;
  strokeColor: string;
  pat: PatternType;
  isDragging: boolean;
  isHovered: boolean;
  isSnapped: boolean;
  animState?: "idle" | "drag" | "near" | "snapped" | "win";
  isLowEnd?: boolean;
  noPattern?: boolean;
}

type MouthMode = "h" | "v";

interface LetterPreset {
  eyeY: number;
  eyeLX: number;
  eyeRX: number;
  eyeRx: number;
  eyeRy: number;
  mouthMode: MouthMode;
  mouthCx?: number;
  mouthY?: number;
  mouthX?: number;
  mouthCy?: number;
  mouthW?: number;
  mouthH?: number;
  wobble?: number;
  stretchX?: number;
  stretchY?: number;
  tempo?: number;
}


const PRESETS: Record<string, LetterPreset> = {
  // Current project letters (Kazakh set) tuned one-by-one
  А: { eyeY: 0.52, eyeLX: 0.42, eyeRX: 0.58, eyeRx: 0.075, eyeRy: 0.085, mouthMode: "h", mouthCx: 0.5, mouthY: 0.7, mouthW: 0.11, wobble: 2.7, stretchX: 1.07, stretchY: 0.9, tempo: 0.44 },
  Ә: { eyeY: 0.36, eyeLX: 0.3, eyeRX: 0.7, eyeRx: 0.072, eyeRy: 0.082, mouthMode: "h", mouthCx: 0.5, mouthY: 0.6, mouthW: 0.1, wobble: 3.3, stretchX: 1.1, stretchY: 0.88, tempo: 0.4 },
  Е: { eyeY: 0.3, eyeLX: 0.38, eyeRX: 0.68, eyeRx: 0.058, eyeRy: 0.058, mouthMode: "h", mouthCx: 0.46, mouthY: 0.74, mouthW: 0.13, wobble: 2.2, stretchX: 1.05, stretchY: 0.93, tempo: 0.48 },
  И: { eyeY: 0.34, eyeLX: 0.26, eyeRX: 0.74, eyeRx: 0.066, eyeRy: 0.076, mouthMode: "h", mouthCx: 0.5, mouthY: 0.72, mouthW: 0.12, wobble: 2.0, stretchX: 1.04, stretchY: 0.94, tempo: 0.5 },
  Й: { eyeY: 0.36, eyeLX: 0.38, eyeRX: 0.62, eyeRx: 0.062, eyeRy: 0.072, mouthMode: "h", mouthCx: 0.5, mouthY: 0.66, mouthW: 0.1, wobble: 3.8, stretchX: 1.06, stretchY: 0.89, tempo: 0.39 },
  К: { eyeY: 0.34, eyeLX: 0.22, eyeRX: 0.78, eyeRx: 0.066, eyeRy: 0.076, mouthMode: "h", mouthCx: 0.42, mouthY: 0.5, mouthW: 0.11, wobble: 3.6, stretchX: 1.12, stretchY: 0.85, tempo: 0.36 },
  М: { eyeY: 0.34, eyeLX: 0.24, eyeRX: 0.76, eyeRx: 0.07, eyeRy: 0.08, mouthMode: "h", mouthCx: 0.5, mouthY: 0.72, mouthW: 0.12, wobble: 2.4, stretchX: 1.03, stretchY: 0.96, tempo: 0.52 },
  Н: { eyeY: 0.34, eyeLX: 0.22, eyeRX: 0.78, eyeRx: 0.07, eyeRy: 0.08, mouthMode: "h", mouthCx: 0.5, mouthY: 0.5, mouthW: 0.16, wobble: 2.0, stretchX: 1.02, stretchY: 0.97, tempo: 0.54 },
  С: { eyeY: 0.38, eyeLX: 0.38, eyeRX: 0.62, eyeRx: 0.068, eyeRy: 0.078, mouthMode: "h", mouthCx: 0.5, mouthY: 0.76, mouthW: 0.1, wobble: 3.0, stretchX: 1.08, stretchY: 0.9, tempo: 0.42 },
  Т: { eyeY: 0.24, eyeLX: 0.25, eyeRX: 0.75, eyeRx: 0.082, eyeRy: 0.092, mouthMode: "h", mouthCx: 0.5, mouthY: 0.56, mouthW: 0.12, wobble: 4.4, stretchX: 1.15, stretchY: 0.83, tempo: 0.34 },
  Ү: { eyeY: 0.34, eyeLX: 0.34, eyeRX: 0.66, eyeRx: 0.066, eyeRy: 0.076, mouthMode: "h", mouthCx: 0.5, mouthY: 0.74, mouthW: 0.11, wobble: 2.9, stretchX: 1.08, stretchY: 0.9, tempo: 0.43 },
  Ы: { eyeY: 0.34, eyeLX: 0.23, eyeRX: 0.75, eyeRx: 0.07, eyeRy: 0.08, mouthMode: "h", mouthCx: 0.48, mouthY: 0.72, mouthW: 0.14, wobble: 3.7, stretchX: 1.13, stretchY: 0.85, tempo: 0.37 },

  // Extended presets
  Ж: { eyeY: 0.34, eyeLX: 0.2, eyeRX: 0.8, eyeRx: 0.07, eyeRy: 0.08, mouthMode: "h", mouthCx: 0.5, mouthY: 0.5, mouthW: 0.11 },
  Ш: { eyeY: 0.34, eyeLX: 0.2, eyeRX: 0.8, eyeRx: 0.07, eyeRy: 0.08, mouthMode: "h", mouthCx: 0.5, mouthY: 0.79, mouthW: 0.18 },
  Щ: { eyeY: 0.34, eyeLX: 0.2, eyeRX: 0.76, eyeRx: 0.07, eyeRy: 0.08, mouthMode: "h", mouthCx: 0.45, mouthY: 0.79, mouthW: 0.18 },
  Г: { eyeY: 0.34, eyeLX: 0.2, eyeRX: 0.8, eyeRx: 0.066, eyeRy: 0.076, mouthMode: "v", mouthX: 0.22, mouthCy: 0.56, mouthH: 0.1 },
  Ғ: { eyeY: 0.34, eyeLX: 0.2, eyeRX: 0.8, eyeRx: 0.066, eyeRy: 0.076, mouthMode: "v", mouthX: 0.22, mouthCy: 0.56, mouthH: 0.1 },
  Қ: { eyeY: 0.34, eyeLX: 0.22, eyeRX: 0.78, eyeRx: 0.066, eyeRy: 0.076, mouthMode: "h", mouthCx: 0.46, mouthY: 0.72, mouthW: 0.12 },
  Р: { eyeY: 0.34, eyeLX: 0.22, eyeRX: 0.72, eyeRx: 0.066, eyeRy: 0.076, mouthMode: "h", mouthCx: 0.44, mouthY: 0.56, mouthW: 0.13 },
  Ю: { eyeY: 0.32, eyeLX: 0.18, eyeRX: 0.18, eyeRx: 0.064, eyeRy: 0.074, mouthMode: "h", mouthCx: 0.64, mouthY: 0.7, mouthW: 0.12 },
  І: { eyeY: 0.36, eyeLX: 0.4, eyeRX: 0.6, eyeRx: 0.062, eyeRy: 0.072, mouthMode: "h", mouthCx: 0.5, mouthY: 0.68, mouthW: 0.1 },
  У: { eyeY: 0.36, eyeLX: 0.38, eyeRX: 0.62, eyeRx: 0.062, eyeRy: 0.072, mouthMode: "h", mouthCx: 0.5, mouthY: 0.74, mouthW: 0.1 },
  Ұ: { eyeY: 0.36, eyeLX: 0.38, eyeRX: 0.62, eyeRx: 0.062, eyeRy: 0.072, mouthMode: "h", mouthCx: 0.5, mouthY: 0.74, mouthW: 0.1 },
  Б: { eyeY: 0.4, eyeLX: 0.32, eyeRX: 0.68, eyeRx: 0.07, eyeRy: 0.08, mouthMode: "h", mouthCx: 0.5, mouthY: 0.7, mouthW: 0.12, wobble: 2.5, stretchX: 1.05, stretchY: 0.93, tempo: 0.45 },
  Л: {
    eyeY: 0.36,
    eyeLX: 0.36,
    eyeRX: 0.64,
    eyeRx: 0.062,
    eyeRy: 0.072,
    mouthMode: "h",
    mouthCx: 0.5,
    mouthY: 0.72,
    mouthW: 0.1,
    wobble: 3.4,
    stretchX: 1.08,
    stretchY: 0.9,
    tempo: 0.4,
  },
};

function getPreset(displayCh: string): LetterPreset {
  const key = letterPresetKey(displayCh);
  const preset = PRESETS[key];
  if (preset) return preset;

  const narrow = new Set(["Ч", "Ц", "Ъ", "Ь"]);
  if (narrow.has(key)) {
    return { eyeY: 0.36, eyeLX: 0.36, eyeRX: 0.64, eyeRx: 0.062, eyeRy: 0.072, mouthMode: "h", mouthCx: 0.5, mouthY: 0.72, mouthW: 0.1 };
  }

  return { eyeY: 0.38, eyeLX: 0.28, eyeRX: 0.72, eyeRx: 0.07, eyeRy: 0.08, mouthMode: "h", mouthCx: 0.5, mouthY: 0.72, mouthW: 0.12 };
}

export function MonsterLetter({
  ch,
  size,
  color,
  strokeColor,
  pat,
  isDragging,
  isHovered,
  isSnapped,
  animState: _animState = "idle",
  isLowEnd = false,
  noPattern = false,
}: MonsterLetterProps) {
  const clipUid = useId().replace(/:/g, "");

  if (letterPresetKey(ch) === "А") {
    return (
      <MonsterLetterA
        ch={ch}
        size={size}
        color={color}
        strokeColor={strokeColor}
        pat={pat}
        isDragging={isDragging}
        isHovered={isHovered}
        isSnapped={isSnapped}
        noPattern={noPattern}
      />
    );
  }

  /** Сыртқы тасымалдаумен transform қақтығысын болдырмау — drag кезінде ішкі wobble өшірілген */
  const dragOuterStill = {
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    scaleX: 1,
    scaleY: 1,
  } as const;
  const cx = size / 2;
  const textY = size * 0.85;
  const fontSize = size * 0.84;
  const clipId = `m-letter-${clipUid}`;

  const preset = getPreset(ch);
  const el = isElLetter(ch);
  const eyeY = size * preset.eyeY;
  const eyeLX = size * preset.eyeLX;
  const eyeRX = size * preset.eyeRX;
  const eyeRx = size * preset.eyeRx;
  const eyeRy = size * preset.eyeRy;
  const pupilR = size * 0.038;
  const pupilOffY = isDragging ? size * 0.04 : isHovered ? size * 0.022 : 0;

  const mouthW = size * (preset.mouthW ?? 0.12);
  const mouthH = size * (preset.mouthH ?? 0.1);
  const mouthCx = size * (preset.mouthCx ?? 0.5);
  const mouthY = size * (preset.mouthY ?? 0.72);
  const mouthX = size * (preset.mouthX ?? 0.5);
  const mouthCy = size * (preset.mouthCy ?? 0.56);

  const mouthClosed =
    preset.mouthMode === "v"
      ? `M ${mouthX} ${mouthCy - mouthH} Q ${mouthX} ${mouthCy} ${mouthX} ${mouthCy + mouthH}`
      : `M ${mouthCx - mouthW} ${mouthY} Q ${mouthCx} ${mouthY} ${mouthCx + mouthW} ${mouthY}`;
  const mouthOpenHover =
    preset.mouthMode === "v"
      ? `M ${mouthX} ${mouthCy - mouthH} Q ${mouthX - size * 0.05} ${mouthCy} ${mouthX} ${mouthCy + mouthH}`
      : `M ${mouthCx - mouthW} ${mouthY} Q ${mouthCx} ${mouthY + size * 0.1} ${mouthCx + mouthW} ${mouthY}`;
  const mouthOpenDrag =
    preset.mouthMode === "v"
      ? `M ${mouthX} ${mouthCy - mouthH} Q ${mouthX - size * 0.08} ${mouthCy} ${mouthX} ${mouthCy + mouthH}`
      : `M ${mouthCx - mouthW} ${mouthY} Q ${mouthCx} ${mouthY + size * 0.2} ${mouthCx + mouthW} ${mouthY}`;
  const mouthSmile =
    preset.mouthMode === "v"
      ? `M ${mouthX} ${mouthCy - mouthH} Q ${mouthX - size * 0.04} ${mouthCy} ${mouthX} ${mouthCy + mouthH}`
      : `M ${mouthCx - mouthW} ${mouthY} Q ${mouthCx} ${mouthY + size * 0.07} ${mouthCx + mouthW} ${mouthY}`;
  const currentMouth = isSnapped
    ? mouthSmile
    : isDragging
    ? mouthOpenDrag
    : isHovered
    ? mouthOpenHover
    : mouthClosed;

  return (
    <motion.div
      animate={
        isDragging
          ? dragOuterStill
          : isHovered && ch === "Ә"
            ? {
                y: [0, -size * 0.05, size * 0.02, -size * 0.04, 0],
                x: [0, size * 0.02, -size * 0.02, 0],
                rotate: [0, -8, 8, -5, 5, 0],
                scaleX: [1, 1.08, 0.94, 1.05, 1],
                scaleY: [1, 0.94, 1.08, 0.97, 1],
              }
            : isHovered && el && !isLowEnd
              ? {
                  y: [0, -size * 0.09, size * 0.028, -size * 0.034, 0],
                  rotate: [0, -3.5, 3.5, -2, 0],
                  scaleX: [1, 0.93, 1.06, 0.98, 1],
                  scaleY: [1, 1.1, 0.91, 1.05, 1],
                }
              : isHovered
                ? { y: 0, rotate: [0, -2, 2, 0], scaleX: [1, 1.03, 1], scaleY: [1, 0.98, 1] }
                : isSnapped
                  ? { y: 0, rotate: 0, scaleX: [1, 1.07, 0.97, 1], scaleY: [1, 0.93, 1.04, 1] }
                  : isLowEnd
                    ? { y: 0, rotate: 0, scaleX: 1, scaleY: 1 }
                    : el
                      ? {
                          y: [0, -size * 0.095, size * 0.034, -size * 0.038, 0],
                          rotate: [0, -2.4, 2.4, -1.2, 0],
                          scaleX: [1, 0.94, 1.05, 0.99, 1],
                          scaleY: [1, 1.1, 0.9, 1.04, 1],
                        }
                      : { y: 0, rotate: [0, -0.8, 0.8, 0], scaleX: [1, 1.01, 0.99, 1], scaleY: [1, 0.99, 1.01, 1] }
      }
      transition={
        isDragging
          ? { duration: 0.12, ease: "easeOut" }
          : isHovered && ch === "Ә"
            ? { duration: 0.52, repeat: Infinity, repeatDelay: 0.03, ease: "easeInOut" }
            : isHovered && el && !isLowEnd
              ? {
                  duration: 0.58,
                  repeat: Infinity,
                  repeatDelay: 0.04,
                  ease: [0.25, 0.85, 0.35, 1],
                }
              : isHovered
                ? { duration: 0.32, repeat: Infinity, repeatDelay: 0.16 }
                : isSnapped
                  ? { duration: 0.34 }
                  : isLowEnd
                    ? { duration: 0.12 }
                    : el
                      ? {
                          duration: 1.75,
                          repeat: Infinity,
                          repeatDelay: 1.15,
                          ease: [0.22, 1, 0.36, 1],
                        }
                      : { duration: 2.1, repeat: Infinity, repeatDelay: 1.6 }
      }
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        overflow="visible"
        xmlns="http://www.w3.org/2000/svg"
      >
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
          <radialGradient id="s-rainbow-glow" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#FF2A2A" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#2B5DFF" stopOpacity="0.92" />
            <stop offset="50%" stopColor="#101010" stopOpacity="0.28" />
            <stop offset="75%" stopColor="#1FD14C" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#FFE100" stopOpacity="0.9" />
          </radialGradient>
          <linearGradient id="s-rainbow-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF2A2A" />
            <stop offset="25%" stopColor="#2B5DFF" />
            <stop offset="50%" stopColor="#101010" stopOpacity="0.35" />
            <stop offset="75%" stopColor="#1FD14C" />
            <stop offset="100%" stopColor="#FFE100" />
          </linearGradient>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          {ch === "С" ? (
            <motion.rect
              width={size}
              height={size}
              animate={{
                fill: isDragging
                  ? ["#2E86FF", "#4C98FF", "#2E86FF"]
                  : isHovered
                    ? ["#2E86FF", "#56A0FF", "#2E86FF"]
                    : color,
              }}
              transition={
                isDragging
                  ? {
                      duration: 1.05,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatDelay: 0.18,
                    }
                  : {
                      duration: 1.6,
                      ease: "easeInOut",
                      repeat: isHovered ? Infinity : 0,
                      repeatDelay: 0.55,
                    }
              }
            />
          ) : letterPresetKey(ch) === "М" ? (
            <motion.rect
              width={size}
              height={size}
              animate={{
                fill: ["#a855f7", "#ec4899", "#22d3ee", "#a855f7"],
              }}
              transition={{
                duration: 3,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />
          ) : (
            <rect width={size} height={size} fill={color} />
          )}
          {!noPattern ? <Pattern pat={pat} pc={strokeColor} size={size} /> : null}
        </g>

        <text
          x={cx}
          y={textY}
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight="900"
          fontFamily={FONT_DISPLAY_KZ}
          fill="none"
          stroke={letterPresetKey(ch) === "М" ? "#ffffffcc" : strokeColor + "cc"}
          strokeWidth={letterPresetKey(ch) === "М" ? 2 : 3}
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          {ch}
        </text>

        <g clipPath={`url(#${clipId})`}>
          <ellipse cx={eyeLX} cy={eyeY} rx={eyeRx} ry={eyeRy} fill="white" />
          <ellipse cx={eyeRX} cy={eyeY} rx={eyeRx} ry={eyeRy} fill="white" />

          <motion.ellipse
            cx={eyeLX}
            cy={eyeY}
            rx={eyeRx}
            ry={eyeRy}
            initial={{ ry: eyeRy }}
            animate={{
              ry: isDragging
                ? eyeRy
                : isHovered
                  ? [eyeRy, size * 0.02, eyeRy]
                  : isSnapped
                    ? size * 0.05
                    : [eyeRy, size * 0.03, eyeRy],
            }}
            transition={
              isDragging
                ? { duration: 0 }
                : isHovered
                  ? { duration: 1.1, repeat: Infinity, repeatDelay: 0.7 }
                  : { duration: 3.5, repeat: Infinity, repeatDelay: 2 }
            }
            fill="white"
          />
          <motion.ellipse
            cx={eyeRX}
            cy={eyeY}
            rx={eyeRx}
            ry={eyeRy}
            initial={{ ry: eyeRy }}
            animate={{
              ry: isDragging
                ? eyeRy
                : isHovered
                  ? [eyeRy, size * 0.02, eyeRy]
                  : isSnapped
                    ? size * 0.05
                    : [eyeRy, size * 0.03, eyeRy],
            }}
            transition={
              isDragging
                ? { duration: 0 }
                : isHovered
                  ? { duration: 1.1, repeat: Infinity, repeatDelay: 0.7, delay: 0.04 }
                  : { duration: 3.5, repeat: Infinity, repeatDelay: 2, delay: 0.04 }
            }
            fill="white"
          />

          <motion.circle
            cx={eyeLX}
            cy={eyeY + pupilOffY}
            initial={{ cy: eyeY + pupilOffY }}
            animate={{ cy: eyeY + pupilOffY }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            r={pupilR}
            fill="#1a1a2e"
          />
          <motion.circle
            cx={eyeRX}
            cy={eyeY + pupilOffY}
            initial={{ cy: eyeY + pupilOffY }}
            animate={{ cy: eyeY + pupilOffY }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            r={pupilR}
            fill="#1a1a2e"
          />

          <motion.path
            d={currentMouth}
            initial={{ d: currentMouth }}
            animate={{ d: currentMouth }}
            transition={
              isDragging
                ? { type: "spring", stiffness: 420, damping: 22 }
                : { type: "spring", stiffness: 300, damping: 28 }
            }
            fill="none"
            stroke="#1a1a2e"
            strokeWidth={size * 0.035}
            strokeLinecap="round"
          />
        </g>
      </svg>
    </motion.div>
  );
}
