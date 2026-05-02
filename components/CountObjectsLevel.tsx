import { useState } from "react";
import styles from "./CountObjectsLevel.module.css";

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
 */
export function generateTaskInRange(
  min: number,
  max: number
): CountObjectsTask {
  const lo = Math.max(1, Math.min(min, max));
  const hi = Math.max(lo, Math.max(min, max));
  const count = lo + Math.floor(Math.random() * (hi - lo + 1));
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

export type CountObjectsStatus = "idle" | "correct" | "wrong";

export interface CountObjectsLevelProps {
  /** Келесі экранға өту: «Дальше» басылғанда. */
  onSuccess: () => void;
  /** Тізбе: дұрыс сан шертілгенде (мысалы playAudio), міндетті емес. */
  onSolved?: () => void;
  objectEmoji?: string;
  initialTask?: CountObjectsTask;
}

export function CountObjectsLevel({
  onSuccess,
  onSolved,
  objectEmoji = "🍎",
  initialTask,
}: CountObjectsLevelProps) {
  const [task] = useState<CountObjectsTask>(() => initialTask ?? generateTask());
  const [status, setStatus] = useState<CountObjectsStatus>("idle");

  const answersClass =
    status === "correct"
      ? `${styles.answers} ${styles.answersCorrect}`
      : status === "wrong"
        ? `${styles.answers} ${styles.answersWrong}`
        : `${styles.answers} ${styles.answersIdle}`;

  return (
    <div className={styles.root}>
      <div className={styles.grid} aria-hidden>
        {Array.from({ length: task.count }, (_, i) => (
          <span key={i} className={styles.item}>
            {objectEmoji}
          </span>
        ))}
      </div>

      <div
        className={answersClass}
        role="group"
        aria-label="Жауап нұсқалары"
      >
        {task.options.map(n => (
          <button
            key={n}
            type="button"
            className={styles.optionBtn}
            disabled={status === "correct"}
            onClick={() => {
              if (n === task.count) {
                setStatus("correct");
                onSolved?.();
              } else {
                setStatus("wrong");
              }
            }}
          >
            {n}
          </button>
        ))}
      </div>

      {status === "correct" ? (
        <button type="button" className={styles.nextBtn} onClick={onSuccess}>
          Дальше
        </button>
      ) : null}
    </div>
  );
}
