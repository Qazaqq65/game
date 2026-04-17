export function Pattern({ pat, pc, size }: { pat: string; pc: string; size: number }) {
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
