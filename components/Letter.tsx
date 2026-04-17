import type { LetterDef } from "./../types";
import { letterPresetKey } from "../utils/letterPresetKey";
import { MonsterZh } from "./MonsterZh";
import { MonsterLetter } from "./MonsterLetter";
import { MonsterLetterMeltingI } from "./MonsterLetterMeltingI";

const SOLID_FILL_LETTERS = new Set(["А", "Е", "Н", "С", "Т", "М"]);

interface LetterProps {
  letter: LetterDef;
  size?: number;
  isDragging: boolean;
  isHovered?: boolean;
  isSnapped: boolean;
  animState?: "idle" | "drag" | "near" | "snapped" | "win";
  isLowEnd?: boolean;
}
export function Letter({
  letter,
  size = 108,
  isDragging,
  isHovered = false,
  isSnapped,
  animState = "idle",
  isLowEnd = false,
}: LetterProps) {
  const { ch, color, pat, pc } = letter;
  const noPattern = SOLID_FILL_LETTERS.has(letterPresetKey(ch));

  if (letterPresetKey(ch) === "Ж") {
    return (
      <MonsterZh
        ch={ch}
        size={size}
        color={color}
        strokeColor={pc}
        pat={pat}
        isDragging={isDragging}
        isHovered={isHovered}
        isSnapped={isSnapped}
        animState={animState}
        isLowEnd={isLowEnd}
        noPattern={noPattern}
      />
    );
  }

  if (letterPresetKey(ch) === "И") {
    return (
      <MonsterLetterMeltingI
        ch={ch}
        size={size}
        color={color}
        strokeColor={pc}
        pat={pat}
        isDragging={isDragging}
        isHovered={isHovered}
        isSnapped={isSnapped}
        animState={animState}
        isLowEnd={isLowEnd}
        noPattern={noPattern}
      />
    );
  }

  return (
    <MonsterLetter
      ch={ch}
      size={size}
      color={color}
      strokeColor={pc}
      pat={pat}
      isDragging={isDragging}
      isHovered={isHovered}
      isSnapped={isSnapped}
      animState={animState}
      isLowEnd={isLowEnd}
      noPattern={noPattern}
    />
  );
}
