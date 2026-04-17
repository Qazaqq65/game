import { useId } from "react";
import { motion } from "framer-motion";
import { FONT_DISPLAY_KZ } from "../constants/fonts";
import type { PatternType } from "../types";

interface MonsterZhProps {
  ch?: string;
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

export function MonsterZh({
  ch = "Ж",
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
}: MonsterZhProps) {
  const cx = size / 2;
  const textY = size * 0.85;
  const fontSize = size * 0.84;
  const clipUid = useId().replace(/:/g, "");
  const clipId = `zh-clip-${clipUid}`;

  // For "Ж": place eyes near upper left/right edges.
  const eyeY = size * 0.34;
  const eyeLX = size * 0.2;
  const eyeRX = size * 0.8;
  const eyeRx = size * 0.07;
  const eyeRy = size * 0.08;
  const pupilR = size * 0.038;
  const pupilOffY = isDragging ? size * 0.04 : isHovered ? size * 0.022 : 0;

  const mouthY = size * 0.72;
  const mouthL = size * 0.38;
  const mouthR = size * 0.62;
  const mouthMid = cx;
  const mouthClosed = `M ${mouthL} ${mouthY} Q ${mouthMid} ${mouthY} ${mouthR} ${mouthY}`;
  /** Лёгкое открытие — рядом со слотом */
  const mouthOpenHover = `M ${mouthL} ${mouthY} Q ${mouthMid} ${mouthY + size * 0.1} ${mouthR} ${mouthY}`;
  /** Сильное открытие — именно когда держишь / тащишь */
  const mouthOpenDrag = `M ${mouthL} ${mouthY} Q ${mouthMid} ${mouthY + size * 0.2} ${mouthR} ${mouthY}`;
  const mouthSmile = `M ${mouthL} ${mouthY} Q ${mouthMid} ${mouthY + size * 0.07} ${mouthR} ${mouthY}`;
  const currentMouth = isSnapped
    ? mouthSmile
    : isDragging
      ? mouthOpenDrag
      : isHovered
        ? mouthOpenHover
        : mouthClosed;

  const dragOuterStill = {
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    scaleX: 1,
    scaleY: 1,
  } as const;

  return (
    <motion.div
      animate={
        isDragging
          ? dragOuterStill
          : isHovered
          ? { rotate: [0, -2, 2, 0], scale: [1.03, 1.08, 1.03], scaleX: [1, 1.03, 1], scaleY: [1, 0.98, 1] }
          : isSnapped
          ? { rotate: 0, scale: [1, 1.06, 1], scaleX: [1, 1.08, 0.97, 1], scaleY: [1, 0.93, 1.05, 1] }
          : isLowEnd
            ? { rotate: 0, scale: 1, scaleX: 1, scaleY: 1 }
            : { rotate: [0, -0.9, 0.9, 0], scale: [1, 1.01, 1], scaleX: [1, 1.01, 0.99, 1], scaleY: [1, 0.99, 1.01, 1] }
      }
      transition={
        isDragging
          ? { duration: 0.12, ease: "easeOut" }
          : isHovered
          ? { duration: 0.32, repeat: Infinity, repeatDelay: 0.16 }
          : isSnapped
          ? { duration: 0.34 }
          : isLowEnd
            ? { duration: 0.12 }
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
        </defs>

        {/* Тело буквы — только силуэт + заливка + паттерн */}
        <g clipPath={`url(#${clipId})`}>
          <rect width={size} height={size} fill={color} />
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
          stroke={strokeColor + "cc"}
          strokeWidth={3}
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          {ch}
        </text>

        {/* Глаза и рот — только внутри буквы */}
        <g clipPath={`url(#${clipId})`}>
          <ellipse cx={eyeLX} cy={eyeY} rx={eyeRx} ry={eyeRy} fill="white" />
          <ellipse cx={eyeRX} cy={eyeY} rx={eyeRx} ry={eyeRy} fill="white" />

          <motion.ellipse
            cx={eyeLX}
            cy={eyeY}
            rx={eyeRx}
            ry={eyeRy}
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
            animate={{ cy: eyeY + pupilOffY }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            r={pupilR}
            fill="#1a1a2e"
          />
          <motion.circle
            cx={eyeRX}
            cy={eyeY + pupilOffY}
            animate={{ cy: eyeY + pupilOffY }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            r={pupilR}
            fill="#1a1a2e"
          />

          <motion.path
            d={currentMouth}
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

function Pattern({ pat, pc, size }: { pat: string; pc: string; size: number }) {
  if (pat === "dots")
    return (
      <g fill={pc + "99"}>
        {Array.from({ length: 7 }, (_, row) =>
          Array.from({ length: 7 }, (_, col) => (
            <circle key={`${row}-${col}`} cx={8 + col * 16} cy={8 + row * 16} r={5} />
          ))
        )}
      </g>
    );

  if (pat === "spots")
    return (
      <g fill={pc + "88"}>
        {(
          [
            [14, 18, 8, 7],
            [32, 10, 6, 8],
            [8, 34, 7, 6],
            [28, 30, 9, 7],
            [20, 22, 5, 6],
          ] as number[][]
        ).map(([sx, sy, rx, ry], i) =>
          [0, 40, 80].flatMap(tx =>
            [0, 40, 80].map(ty => (
              <ellipse key={`${i}-${tx}-${ty}`} cx={sx + tx} cy={sy + ty} rx={rx} ry={ry} />
            ))
          )
        )}
      </g>
    );

  if (pat === "lines")
    return (
      <g stroke={pc + "77"} strokeWidth={5}>
        {Array.from({ length: 16 }, (_, i) => (
          <line key={i} x1={i * 14} y1={0} x2={i * 14 - size} y2={size} />
        ))}
      </g>
    );

  return null;
}
