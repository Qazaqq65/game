import { useState } from "react";
import { PuzzleBoard } from "../components/PuzzleBoard";
import { WORDS } from "../data/words";
import type { WordDef } from "../types";

interface LetterPuzzleProps {
  /** Pass your own list or use the default WORDS */
  words?: WordDef[];
  tileSize?: number;
  width?: number;
  height?: number;
  bgColor?: string;
  onWordComplete?: (word: string) => void;
}

export default function LetterPuzzle({
  words = WORDS,
  tileSize = 108,
  width = 800,
  height = 580,
  bgColor = "var(--game-anchor)",
  onWordComplete,
}: LetterPuzzleProps) {
  const [wordIdx, setWordIdx] = useState(0);
  const currentWord = words[wordIdx % words.length];

  return (
    <PuzzleBoard
      key={wordIdx}              // remounts board when word changes
      word={currentWord}
      tileSize={tileSize}
      width={width}
      height={height}
      bgColor={bgColor}
      onComplete={onWordComplete}
      onNext={() => setWordIdx(i => i + 1)}
    />
  );
}

// Re-export types and data so consumers can extend easily
export { WORDS } from "../data/words";
export type { WordDef, LetterDef } from "../types";
