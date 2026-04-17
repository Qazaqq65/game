import {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useLayoutEffect,
} from "react";
import { motion } from "framer-motion";
import type { WordDef } from "../types";
import { useDeviceTier, type PerformanceMode } from "../hooks/useDeviceTier";
import styles from "./EntryMenu.module.css";
import { MenuMascot } from "./MenuMascot";

export interface WordMenuGroup {
  letter: string;
  words: WordDef[];
}

interface EntryMenuProps {
  groups: WordMenuGroup[];
  onPickWord: (word: WordDef) => void;
}

type FlatItem = { word: WordDef; startsWithLetter: string };

type ScrollEdges = { canPrev: boolean; canNext: boolean };

const WORDS_VERTICAL_MQ = "(orientation: portrait) and (max-width: 1024px)";

function mergeEdgesIfChanged(prev: ScrollEdges, next: ScrollEdges): ScrollEdges {
  if (prev.canPrev === next.canPrev && prev.canNext === next.canNext) {
    return prev;
  }
  return next;
}

function readScrollEdgesX(el: HTMLElement): ScrollEdges {
  const maxScroll = el.scrollWidth - el.clientWidth;
  const eps = 2;
  if (maxScroll <= eps) {
    return { canPrev: false, canNext: false };
  }
  return {
    canPrev: el.scrollLeft > eps,
    canNext: el.scrollLeft < maxScroll - eps,
  };
}

function readScrollEdgesY(el: HTMLElement): ScrollEdges {
  const maxScroll = el.scrollHeight - el.clientHeight;
  const eps = 2;
  if (maxScroll <= eps) {
    return { canPrev: false, canNext: false };
  }
  return {
    canPrev: el.scrollTop > eps,
    canNext: el.scrollTop < maxScroll - eps,
  };
}

function scrollFilterByDelta(el: HTMLElement, delta: number) {
  const maxScroll = el.scrollWidth - el.clientWidth;
  el.scrollLeft = Math.max(0, Math.min(maxScroll, el.scrollLeft + delta));
}

function readSnappyMenu(): boolean {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const reduce =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return coarse || reduce;
}

export function EntryMenu({ groups, onPickWord }: EntryMenuProps) {
  const { mode, setMode, isLowEnd } = useDeviceTier();
  const [snappyMenu, setSnappyMenu] = useState(readSnappyMenu);
  const [wordsVertical, setWordsVertical] = useState(false);
  const [letterKey, setLetterKey] = useState(() => groups[0]?.letter ?? "");
  const [filterScroll, setFilterScroll] = useState<ScrollEdges>({
    canPrev: false,
    canNext: true,
  });
  const [trackScroll, setTrackScroll] = useState<ScrollEdges>({
    canPrev: false,
    canNext: true,
  });
  const trackRef = useRef<HTMLDivElement>(null);
  const filterNavRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const flatItems = useMemo((): FlatItem[] => {
    const out: FlatItem[] = [];
    for (const g of groups) {
      for (const w of g.words) {
        out.push({ word: w, startsWithLetter: g.letter });
      }
    }
    return out;
  }, [groups]);

  const firstIndexByLetter = useMemo(() => {
    const m: Record<string, number> = {};
    let i = 0;
    for (const g of groups) {
      m[g.letter] = i;
      i += g.words.length;
    }
    return m;
  }, [groups]);

  const scrollToLetter = useCallback(
    (letter: string) => {
      setLetterKey(letter);
      const idx = firstIndexByLetter[letter];
      requestAnimationFrame(() => {
        if (idx !== undefined) {
          cardRefs.current[idx]?.scrollIntoView({
            behavior: "smooth",
            block: wordsVertical ? "center" : "nearest",
            inline: wordsVertical ? "nearest" : "center",
          });
        }
        const nav = filterNavRef.current;
        const btn = nav?.querySelector<HTMLElement>(
          `[data-letter="${CSS.escape(letter)}"]`
        );
        btn?.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      });
    },
    [firstIndexByLetter, wordsVertical]
  );

  const scrollFilterBy = useCallback((dir: -1 | 1) => {
    const el = filterNavRef.current;
    if (!el) return;
    const step = Math.max(96, Math.round(el.clientWidth * 0.52));
    scrollFilterByDelta(el, dir * step);
    requestAnimationFrame(() =>
      setFilterScroll(readScrollEdgesX(el))
    );
  }, []);

  const scrollTrackBy = useCallback(
    (dir: -1 | 1) => {
      const el = trackRef.current;
      if (!el) return;
      if (wordsVertical) {
        const step = Math.max(100, Math.round(el.clientHeight * 0.48));
        const maxS = el.scrollHeight - el.clientHeight;
        el.scrollTop = Math.max(0, Math.min(maxS, el.scrollTop + dir * step));
        requestAnimationFrame(() =>
          setTrackScroll(readScrollEdgesY(el))
        );
      } else {
        const step = Math.max(140, Math.round(el.clientWidth * 0.62));
        const maxS = el.scrollWidth - el.clientWidth;
        el.scrollLeft = Math.max(0, Math.min(maxS, el.scrollLeft + dir * step));
        requestAnimationFrame(() =>
          setTrackScroll(readScrollEdgesX(el))
        );
      }
    },
    [wordsVertical]
  );

  useLayoutEffect(() => {
    const coarseMq = window.matchMedia("(pointer: coarse)");
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applySnappy = () =>
      setSnappyMenu(coarseMq.matches || reduceMq.matches || isLowEnd);
    applySnappy();
    coarseMq.addEventListener("change", applySnappy);
    reduceMq.addEventListener("change", applySnappy);
    return () => {
      coarseMq.removeEventListener("change", applySnappy);
      reduceMq.removeEventListener("change", applySnappy);
    };
  }, [isLowEnd]);

  useEffect(() => {
    const mq = window.matchMedia(WORDS_VERTICAL_MQ);
    const apply = () => setWordsVertical(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    cardRefs.current.length = flatItems.length;
  }, [flatItems.length]);

  useEffect(() => {
    const el = filterNavRef.current;
    if (!el) return;
    let rafId: number | null = null;
    const sync = () =>
      setFilterScroll(prev => mergeEdgesIfChanged(prev, readScrollEdgesX(el)));
    const onScroll = () => {
      if (rafId != null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        sync();
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => {
      onScroll();
    });
    ro.observe(el);
    requestAnimationFrame(() => requestAnimationFrame(sync));
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (rafId != null) cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [groups.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let rafId: number | null = null;
    const sync = () =>
      setTrackScroll(prev =>
        mergeEdgesIfChanged(
          prev,
          wordsVertical ? readScrollEdgesY(el) : readScrollEdgesX(el)
        )
      );
    const onScroll = () => {
      if (rafId != null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        sync();
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => {
      onScroll();
    });
    ro.observe(el);

    const init = () => {
      if (flatItems.length === 0) {
        sync();
        return;
      }
      /* Бірінші әріп таңдалған (letterKey = groups[0]) — карточкалар да сол топтан басталуы керек;
         ортаға скролл (w/2) басқа әріпті көрсетіп, «жарық әріп» пен сөзді сәйкестендірмей қоятын еді. */
      el.scrollLeft = 0;
      el.scrollTop = 0;
      sync();
    };
    requestAnimationFrame(() => requestAnimationFrame(init));

    return () => {
      el.removeEventListener("scroll", onScroll);
      if (rafId != null) cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [flatItems.length, wordsVertical]);

  return (
    <div className={styles.root}>
      <div className={styles.backdrop} aria-hidden>
        <span className={`${styles.blob} ${styles.blob1}`} />
        <span className={`${styles.blob} ${styles.blob2}`} />
        <span className={`${styles.blob} ${styles.blob3}`} />
      </div>

      <div className={styles.inner}>
        <div className={styles.filterColumn}>
          <div className={styles.mascotAboveLetters}>
            <MenuMascot />
          </div>
          <div className={styles.perfPanel}>
            <span className={styles.perfTitle}>Анимация</span>
            <div className={styles.perfModes} role="group" aria-label="Режим производительности">
              {(
                [
                  ["auto", "Auto"],
                  ["high", "High"],
                  ["low", "Low"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={
                    mode === value
                      ? `${styles.perfBtn} ${styles.perfBtnActive}`
                      : styles.perfBtn
                  }
                  onClick={() => setMode(value as PerformanceMode)}
                  aria-pressed={mode === value}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className={styles.perfHint}>
              {mode === "auto"
                ? isLowEnd
                  ? "Auto: low mode"
                  : "Auto: high mode"
                : mode === "low"
                  ? "Forced: low mode"
                  : "Forced: high mode"}
            </span>
          </div>
          <div className={styles.filterWrap}>
            <button
              type="button"
              className={styles.horizScrollBtn}
              aria-label="Әріптерді солға айналдыру"
              disabled={!filterScroll.canPrev}
              onClick={() => scrollFilterBy(-1)}
            >
              ‹
            </button>
            <nav
              ref={filterNavRef}
              className={styles.filter}
              aria-label="Бірінші әріп"
            >
              {groups.map(g => (
                <motion.button
                  key={g.letter}
                  type="button"
                  data-letter={g.letter}
                  aria-pressed={letterKey === g.letter}
                  className={
                    letterKey === g.letter
                      ? `${styles.filterBtn} ${styles.filterBtnOn}`
                      : styles.filterBtn
                  }
                  onClick={() => scrollToLetter(g.letter)}
                  whileHover={{ scale: 1.06, y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: "spring", stiffness: 500, damping: 28 }}
                >
                  {g.letter}
                </motion.button>
              ))}
            </nav>
            <button
              type="button"
              className={styles.horizScrollBtn}
              aria-label="Әріптерді оңға айналдыру"
              disabled={!filterScroll.canNext}
              onClick={() => scrollFilterBy(1)}
            >
              ›
            </button>
          </div>
        </div>

        <div className={styles.stage}>
          <div
            className={
              wordsVertical
                ? `${styles.trackWrap} ${styles.trackWrapVertical}`
                : styles.trackWrap
            }
          >
            <button
              type="button"
              className={styles.horizScrollBtn}
              aria-label={
                wordsVertical ? "Сөздерді жоғары" : "Сөздерді солға"
              }
              disabled={!trackScroll.canPrev}
              onClick={() => scrollTrackBy(-1)}
            >
              {wordsVertical ? "∧" : "‹"}
            </button>
            <div
              ref={trackRef}
              className={styles.track}
              role="listbox"
              aria-label="Сөздер"
            >
            {flatItems.map((item, i) => (
              <motion.button
                key={`${item.startsWithLetter}-${item.word.word}-${item.word.emoji}-${i}`}
                ref={el => {
                  cardRefs.current[i] = el;
                }}
                type="button"
                className={styles.card}
                data-letter={item.startsWithLetter}
                data-index={i}
                role="option"
                aria-label={`${item.word.word}, ${item.word.emoji}`}
                initial={
                  snappyMenu
                    ? false
                    : { opacity: 0, y: 24, rotate: i % 2 === 0 ? -4 : 4 }
                }
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={
                  snappyMenu
                    ? { duration: 0 }
                    : {
                        delay: 0.04 + i * 0.055,
                        type: "spring",
                        stiffness: 340,
                        damping: 22,
                      }
                }
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onPickWord(item.word)}
              >
                <span className={styles.cardInner}>
                  <span className={styles.cardEmoji} aria-hidden>
                    {item.word.emoji}
                  </span>
                  <span className={styles.cardWord}>{item.word.word}</span>
                </span>
              </motion.button>
            ))}
            </div>
            <button
              type="button"
              className={styles.horizScrollBtn}
              aria-label={
                wordsVertical ? "Сөздерді төмен" : "Сөздерді оңға"
              }
              disabled={!trackScroll.canNext}
              onClick={() => scrollTrackBy(1)}
            >
              {wordsVertical ? "∨" : "›"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
