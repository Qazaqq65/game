import { useState } from "react";
import {
  playPuzzleCorrectFeedbackSound,
  playPuzzleWrongSound,
  unlockAudio,
} from "../utils/sound";
import {
  generateTask,
  type CountObjectsTask,
} from "../utils/countObjectsTask";
import styles from "./CountObjectsLevel.module.css";

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
              unlockAudio();
              if (n === task.count) {
                setStatus("correct");
                playPuzzleCorrectFeedbackSound();
                onSolved?.();
              } else {
                setStatus("wrong");
                playPuzzleWrongSound();
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
