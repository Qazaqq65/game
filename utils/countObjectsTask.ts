/** Задание: сколько предметов и перемешанные варианты ответа (3 или 4 числа). */
export interface CountObjectsTask {
  readonly count: number;
  readonly options: readonly number[];
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * count ∈ [min..max]; 3–4 жауап нұсқасы: count, мүмкін count±1, қалғандары — pool ішінен.
 * exclude — бұл ойын сессиясында бұрын шыққан дұрыс жауаптар (қайталанбасын).
 */
export function generateTaskInRange(
  min: number,
  max: number,
  exclude?: ReadonlySet<number>
): CountObjectsTask {
  const lo = Math.max(1, Math.min(min, max));
  const hi = Math.max(lo, Math.max(min, max));
  const full = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  const allowed = exclude
    ? full.filter(n => !exclude.has(n))
    : full;
  const pickFrom = allowed.length > 0 ? allowed : full;
  const count =
    pickFrom[Math.floor(Math.random() * pickFrom.length)] ?? lo;
  const targetSize = Math.random() < 0.5 ? 3 : 4;

  const pool = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

  const set = new Set<number>();
  set.add(count);
  if (count > lo) set.add(count - 1);
  if (count < hi) set.add(count + 1);

  const extras = pool.filter(n => !set.has(n));
  shuffleInPlace(extras);

  while (set.size < targetSize && extras.length > 0) {
    const n = extras.pop();
    if (n !== undefined) set.add(n);
  }

  while (set.size < 3) {
    const rest = pool.filter(n => !set.has(n));
    if (rest.length === 0) break;
    set.add(rest[Math.floor(Math.random() * rest.length)]);
  }

  const options = [...set];
  shuffleInPlace(options);
  return { count, options };
}

/** Әдепкі: 1..7 (екі форматтағы ойынға сәйкес). */
export function generateTask(): CountObjectsTask {
  return generateTaskInRange(1, 7);
}
