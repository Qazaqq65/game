import React, { memo } from "react";
import type { LetterDef, TileState } from "../types";
import { Letter } from "./Letter";
import { LetterDragGlyph } from "./LetterDragGlyph";
import styles from "./DraggableTile.module.css";

interface DraggableTileProps {
  tileIndex: number;
  tile: TileState;
  /** Көрініс координаталары (drag кезінде dragFrame, әйтпесе tile) */
  displayX: number;
  displayY: number;
  letter: LetterDef;
  size: number;
  isDragging: boolean;
  isLowEnd: boolean;
  onPointerDown: (
    e: React.PointerEvent<HTMLDivElement>,
    tileIndex: number
  ) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerEnd: (e: React.PointerEvent<HTMLDivElement>) => void;
}

function DraggableTileInner({
  tileIndex,
  tile,
  displayX,
  displayY,
  letter,
  size,
  isDragging,
  isLowEnd,
  onPointerDown,
  onPointerMove,
  onPointerEnd,
}: DraggableTileProps) {
  const transition = isDragging
    ? "none"
    : tile.snapped
      ? "transform 0.44s cubic-bezier(0.33, 1, 0.68, 1)"
      : "transform 0.32s ease-out";

  const stateClass = tile.snapped
    ? styles.snapped
    : isDragging
      ? styles.dragging
      : styles.idle;
  const nearTargetClass = tile.isNearTarget ? styles.nearTarget : "";
  const animState = isDragging
    ? "drag"
    : tile.snapped
      ? "snapped"
      : tile.isNearTarget
        ? "near"
        : "idle";

  return (
    <div
      className={`${styles.tile} ${stateClass} ${nearTargetClass}`}
      data-tile-index={tileIndex}
      onPointerDown={
        tile.snapped ? undefined : e => onPointerDown(e, tileIndex)
      }
      onPointerMove={tile.snapped ? undefined : onPointerMove}
      onPointerUp={tile.snapped ? undefined : onPointerEnd}
      onPointerCancel={tile.snapped ? undefined : onPointerEnd}
      onLostPointerCapture={tile.snapped ? undefined : onPointerEnd}
      style={{
        width: size,
        height: size,
        transform: `translate3d(${displayX}px, ${displayY}px, 0) rotate(${tile.rot}deg) scale(${tile.scale})`,
        transition,
      }}
    >
      {isDragging ? (
        <LetterDragGlyph letter={letter} size={size} />
      ) : (
        <Letter
          letter={letter}
          size={size}
          isDragging={false}
          isHovered={tile.isNearTarget}
          isSnapped={tile.snapped}
          animState={animState}
          isLowEnd={isLowEnd}
        />
      )}
    </div>
  );
}

export const DraggableTile = memo(
  DraggableTileInner,
  (a, b) =>
    a.tileIndex === b.tileIndex &&
    a.tile === b.tile &&
    a.displayX === b.displayX &&
    a.displayY === b.displayY &&
    a.isDragging === b.isDragging &&
    a.isLowEnd === b.isLowEnd &&
    a.size === b.size &&
    a.letter === b.letter &&
    a.onPointerDown === b.onPointerDown &&
    a.onPointerMove === b.onPointerMove &&
    a.onPointerEnd === b.onPointerEnd
);
