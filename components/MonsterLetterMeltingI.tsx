import React from "react";
import { motion } from "framer-motion";
import { FONT_DISPLAY_KZ } from "../constants/fonts";
import type { PatternType } from "../types";
import { Pattern } from "./MonsterLetterPatterns";
import styles from "./MonsterLetterMeltingI.module.css";

interface MonsterLetterMeltingIProps {
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

/** Буква «И / и»: CSS ::before / ::after (полупрозрачный слой + размытая копия), melt + drip; SVG — заливка, узор, лицо. */
export function MonsterLetterMeltingI({
  ch = "И",
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
}: MonsterLetterMeltingIProps) {
  const uid = React.useId().replace(/:/g, "");
  const clipId = `m-i-clip-${uid}`;
  const gradDripId = `m-i-drip-${uid}`;

  const cx = size / 2;
  const textY = size * 0.85;
  const fontSize = size * 0.84;

  const dragOuterStill = {
    x: 0,
    y: 0,
    rotate: 0,
    scaleX: 1,
    scaleY: 1,
  } as const;

  const eyeY = size * 0.34;
  const eyeLX = size * 0.26;
  const eyeRX = size * 0.74;
  const eyeRx = size * 0.066;
  const eyeRy = size * 0.076;
  const pupilR = size * 0.038;
  const pupilOffY = isDragging ? size * 0.04 : isHovered ? size * 0.022 : 0;

  const mouthW = size * 0.12;
  const mouthCx = size * 0.5;
  const mouthY = size * 0.72;

  const mouthClosed = `M ${mouthCx - mouthW} ${mouthY} Q ${mouthCx} ${mouthY} ${mouthCx + mouthW} ${mouthY}`;
  const mouthOpenHover = `M ${mouthCx - mouthW} ${mouthY} Q ${mouthCx} ${mouthY + size * 0.1} ${mouthCx + mouthW} ${mouthY}`;
  const mouthOpenDrag = `M ${mouthCx - mouthW} ${mouthY} Q ${mouthCx} ${mouthY + size * 0.2} ${mouthCx + mouthW} ${mouthY}`;
  const mouthSmile = `M ${mouthCx - mouthW} ${mouthY} Q ${mouthCx} ${mouthY + size * 0.07} ${mouthCx + mouthW} ${mouthY}`;
  const currentMouth = isSnapped ? mouthSmile : isDragging ? mouthOpenDrag : isHovered ? mouthOpenHover : mouthClosed;

  const trackClass = [
    styles.track,
    isDragging
      ? styles.trackDrag
      : isHovered
        ? styles.trackHover
        : isSnapped
          ? styles.trackSnapped
          : styles.trackIdle,
  ].join(" ");

  return (
    <motion.div
      animate={
        isDragging
          ? dragOuterStill
          : isHovered
            ? { rotate: [0, -2, 2, 0], scaleX: [1, 1.03, 1], scaleY: [1, 0.98, 1] }
            : isSnapped
              ? { rotate: 0, scaleX: [1, 1.05, 0.98, 1], scaleY: [1, 0.96, 1.04, 1] }
              : isLowEnd
                ? { rotate: 0, scaleX: 1, scaleY: 1 }
                : { rotate: [0, -0.8, 0.8, 0], scaleX: [1, 1.01, 0.99, 1], scaleY: [1, 0.99, 1.01, 1] }
      }
      transition={
        isDragging
          ? { duration: 0.12, ease: "easeOut" }
          : isHovered
            ? { duration: 0.32, repeat: Infinity, repeatDelay: 0.14 }
            : isSnapped
              ? { duration: 0.34 }
              : isLowEnd
                ? { duration: 0.12 }
                : { duration: 2.1, repeat: Infinity, repeatDelay: 1.6 }
      }
      style={
        {
          width: size,
          height: size,
          ["--ml-fs" as string]: `${fontSize}px`,
          ["--ml-color" as string]: color,
          ["--ml-stroke" as string]: strokeColor,
          ["--ml-ch" as string]: `"${ch}"`,
        } as React.CSSProperties
      }
    >
      <div className={trackClass}>
        <div className={styles.pseudoHost} aria-hidden />
        <svg
          className={styles.svgLayer}
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          overflow="visible"
          xmlns="http://www.w3.org/2000/svg"
        >
        <defs>
          <linearGradient id={gradDripId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="55%" stopColor={color} stopOpacity={0.92} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0.55} />
          </linearGradient>

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

        <g clipPath={`url(#${clipId})`}>
          <rect width={size} height={size} fill={`url(#${gradDripId})`} />
          <rect width={size} height={size} fill={color} opacity={0.88} />
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
      </div>
    </motion.div>
  );
}
