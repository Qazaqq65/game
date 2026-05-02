import {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useLayoutEffect,
  type CSSProperties,
} from "react";

function ArrowIcon({ dir }: { dir: "left" | "right" | "up" | "down" }) {
  const rotateMap = { right: 0, down: 0, left: 180, up: 180 };
  const src = dir === "up" || dir === "down" ? "/svg/down.svg" : "/svg/right.svg";
  return (
      <img
      src={src}
      alt={dir}
      width={32}
      height={32}
      style={{ transform: `rotate(${rotateMap[dir]}deg)`, display: "block", transition: "transform 0.15s" }}
      draggable={false}
    />
  );
}
import { motion, useReducedMotion } from "framer-motion";
import type { WordDef } from "../types";
import { useDeviceTier } from "../hooks/useDeviceTier";
import {
  MENU_CARD_TONES,
  menuToneIndexForDigitCard,
  menuToneIndexForLetterCard,
  type MenuCardToneCss,
} from "../data/menuCardThemes";
import { preloadDigitLevelIntroSounds } from "../utils/sound";
import styles from "./EntryMenu.module.css";
import { MenuMascot } from "./MenuMascot";

function toneCssVars(t: MenuCardToneCss): CSSProperties {
  return {
    ["--card-surface" as string]: t.surface,
    ["--card-border" as string]: t.border,
    ["--card-glow" as string]: t.glow,
    ["--card-accent" as string]: t.accent,
    ["--card-emoji-shadow" as string]: t.emojiShadow,
  };
}

function findCenteredMenuCardIndex(
  track: HTMLElement,
  vertical: boolean
): number {
  const cards = track.querySelectorAll<HTMLElement>("[data-menu-card]");
  if (cards.length === 0) return 0;
  const tr = track.getBoundingClientRect();
  const c0 = vertical ? tr.top + tr.height / 2 : tr.left + tr.width / 2;
  let best = 0;
  let bestAbs = Infinity;
  cards.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const c = vertical ? r.top + r.height / 2 : r.left + r.width / 2;
    const d = Math.abs(c - c0);
    if (d < bestAbs) {
      bestAbs = d;
      best = i;
    }
  });
  return best;
}

export interface WordMenuGroup {
  letter: string;
  words: WordDef[];
}

interface EntryMenuProps {
  groups: WordMenuGroup[];
  digitLevels: WordDef[];
  onPickWord: (word: WordDef, source: "letters" | "digits") => void;
}

type MenuCategory = "letters" | "digits";

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

export function EntryMenu({
  groups,
  digitLevels,
  onPickWord,
}: EntryMenuProps) {
  const { isLowEnd } = useDeviceTier();
  const reduceMotion = useReducedMotion() ?? false;
  useEffect(() => {
    preloadDigitLevelIntroSounds();
  }, []);
  const [menuCategory, setMenuCategory] = useState<MenuCategory>("letters");
  const [snappyMenu, setSnappyMenu] = useState(readSnappyMenu);
  const [wordsVertical, setWordsVertical] = useState(false);
  const [letterKey, setLetterKey] = useState(() => groups[0]?.letter ?? "");
  const [digitLevelKey, setDigitLevelKey] = useState(
    () => digitLevels.find(w => w.levelNumber != null)?.levelNumber ?? 1
  );
  const [centeredCardIdx, setCenteredCardIdx] = useState(0);
  const [filterScroll, setFilterScroll] = useState<ScrollEdges>({
    canPrev: false,
    canNext: true,
  });
  const [trackScroll, setTrackScroll] = useState<ScrollEdges>({
    canPrev: false,
    canNext: true,
  });
  const trackRef = useRef<HTMLDivElement>(null);
  const categoryTrackRef = useRef<HTMLDivElement>(null);
  const [categoryThumbX, setCategoryThumbX] = useState(0);
  const filterNavRef = useRef<HTMLElement>(null);
  const digitFilterNavRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const syncCategoryThumb = useCallback(() => {
    const el = categoryTrackRef.current;
    if (!el) return;
    const padX = 5 * 2;
    const inner = Math.max(0, el.clientWidth - padX);
    const half = inner / 2;
    setCategoryThumbX(menuCategory === "digits" ? half : 0);
  }, [menuCategory]);

  useLayoutEffect(() => {
    syncCategoryThumb();
  }, [syncCategoryThumb]);

  useEffect(() => {
    const el = categoryTrackRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => syncCategoryThumb());
    ro.observe(el);
    return () => ro.disconnect();
  }, [syncCategoryThumb]);

  const flatItems = useMemo((): FlatItem[] => {
    if (menuCategory === "digits") {
      return digitLevels.map(w => ({ word: w, startsWithLetter: "" }));
    }
    const out: FlatItem[] = [];
    for (const g of groups) {
      for (const w of g.words) {
        out.push({ word: w, startsWithLetter: g.letter });
      }
    }
    return out;
  }, [groups, digitLevels, menuCategory]);

  const menuCardCount =
    flatItems.length +
    (menuCategory === "letters" || menuCategory === "digits" ? 1 : 0);

  const syncCenteredCard = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCenteredCardIdx(findCenteredMenuCardIndex(el, wordsVertical));
  }, [wordsVertical]);

  const scrollMenuCardToIndex = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) return;
      const cards = track.querySelectorAll<HTMLElement>("[data-menu-card]");
      const card = cards[index];
      if (!card) return;
      card.scrollIntoView({
        behavior: snappyMenu || reduceMotion ? "auto" : "smooth",
        block: wordsVertical ? "center" : "nearest",
        inline: wordsVertical ? "nearest" : "center",
      });
      window.setTimeout(syncCenteredCard, snappyMenu || reduceMotion ? 80 : 400);
    },
    [snappyMenu, wordsVertical, reduceMotion, syncCenteredCard]
  );

  const firstIndexByLetter = useMemo(() => {
    const m: Record<string, number> = {};
    let i = 0;
    for (const g of groups) {
      m[g.letter] = i;
      i += g.words.length;
    }
    return m;
  }, [groups]);

  const firstIndexByDigitLevel = useMemo(() => {
    const m: Record<number, number> = {};
    digitLevels.forEach((w, i) => {
      if (w.levelNumber != null) {
        m[w.levelNumber] = i;
      }
    });
    return m;
  }, [digitLevels]);

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

  const scrollToDigitLevel = useCallback(
    (level: number) => {
      setDigitLevelKey(level);
      const idx = firstIndexByDigitLevel[level];
      requestAnimationFrame(() => {
        if (idx !== undefined) {
          cardRefs.current[idx]?.scrollIntoView({
            behavior: "smooth",
            block: wordsVertical ? "center" : "nearest",
            inline: wordsVertical ? "nearest" : "center",
          });
        }
        const nav = digitFilterNavRef.current;
        const btn = nav?.querySelector<HTMLElement>(
          `[data-digit-level="${CSS.escape(String(level))}"]`
        );
        btn?.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      });
    },
    [firstIndexByDigitLevel, wordsVertical]
  );

  const scrollFilterBy = useCallback(
    (dir: -1 | 1) => {
      const el =
        menuCategory === "letters"
          ? filterNavRef.current
          : menuCategory === "digits"
            ? digitFilterNavRef.current
            : null;
      if (!el) return;
      const step = Math.max(96, Math.round(el.clientWidth * 0.52));
      scrollFilterByDelta(el, dir * step);
      requestAnimationFrame(() => setFilterScroll(readScrollEdgesX(el)));
    },
    [menuCategory]
  );

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
    const el =
      menuCategory === "letters"
        ? filterNavRef.current
        : menuCategory === "digits"
          ? digitFilterNavRef.current
          : null;
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
  }, [groups.length, digitLevels.length, menuCategory]);

  useEffect(() => {
    if (menuCategory === "letters" && groups[0]) {
      setLetterKey(groups[0].letter);
    }
  }, [menuCategory, groups]);

  useEffect(() => {
    if (menuCategory === "digits" && digitLevels[0]?.levelNumber != null) {
      setDigitLevelKey(digitLevels[0].levelNumber);
    }
  }, [menuCategory, digitLevels]);

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
        syncCenteredCard();
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
        syncCenteredCard();
        return;
      }
      /* Бірінші әріп таңдалған (letterKey = groups[0]) — карточкалар да сол топтан басталуы керек;
         ортаға скролл (w/2) басқа әріпті көрсетіп, «жарық әріп» пен сөзді сәйкестендірмей қоятын еді. */
      el.scrollLeft = 0;
      el.scrollTop = 0;
      sync();
      syncCenteredCard();
    };
    requestAnimationFrame(() => requestAnimationFrame(init));

    return () => {
      el.removeEventListener("scroll", onScroll);
      if (rafId != null) cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [flatItems.length, wordsVertical, syncCenteredCard]);

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
          <div
            ref={categoryTrackRef}
            className={styles.categorySwitch}
            role="group"
            aria-label="Сөздер немесе сандар"
          >
            <motion.div
              aria-hidden
              className={styles.categoryThumb}
              initial={false}
              animate={{ x: categoryThumbX }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: 460,
                      damping: 26,
                      mass: 0.68,
                    }
              }
            />
            <button
              type="button"
              className={
                menuCategory === "letters"
                  ? `${styles.categoryBtn} ${styles.categoryBtnActive}`
                  : styles.categoryBtn
              }
              aria-pressed={menuCategory === "letters"}
              onClick={() => setMenuCategory("letters")}
            >
              Әріптер
            </button>
            <button
              type="button"
              className={
                menuCategory === "digits"
                  ? `${styles.categoryBtn} ${styles.categoryBtnActive}`
                  : styles.categoryBtn
              }
              aria-pressed={menuCategory === "digits"}
              onClick={() => setMenuCategory("digits")}
            >
              Сандар
            </button>
          </div>
          {menuCategory === "letters" ? (
            <div className={styles.filterWrap}>
              <button
                type="button"
                className={styles.horizScrollBtn}
                aria-label="Әріптерді солға айналдыру"
                disabled={!filterScroll.canPrev}
                onClick={() => scrollFilterBy(-1)}
              >
                <ArrowIcon dir="left" />
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
                <ArrowIcon dir="right" />
              </button>
            </div>
          ) : null}
          {menuCategory === "digits" ? (
            <div className={styles.filterWrap}>
              <button
                type="button"
                className={styles.horizScrollBtn}
                aria-label="Деңгей нөмірлерін солға айналдыру"
                disabled={!filterScroll.canPrev}
                onClick={() => scrollFilterBy(-1)}
              >
                <ArrowIcon dir="left" />
              </button>
              <nav
                ref={digitFilterNavRef}
                className={styles.filter}
                aria-label="Деңгей нөмірі"
              >
                {digitLevels.map(w => {
                  const lvl = w.levelNumber;
                  if (lvl == null) return null;
                  return (
                    <motion.button
                      key={lvl}
                      type="button"
                      data-digit-level={lvl}
                      aria-pressed={digitLevelKey === lvl}
                      className={
                        digitLevelKey === lvl
                          ? `${styles.filterBtn} ${styles.filterBtnOn}`
                          : styles.filterBtn
                      }
                      onClick={() => scrollToDigitLevel(lvl)}
                      whileHover={{ scale: 1.06, y: -2 }}
                      whileTap={{ scale: 0.94 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 28,
                      }}
                    >
                      {lvl}
                    </motion.button>
                  );
                })}
              </nav>
              <button
                type="button"
                className={styles.horizScrollBtn}
                aria-label="Деңгей нөмірлерін оңға айналдыру"
                disabled={!filterScroll.canNext}
                onClick={() => scrollFilterBy(1)}
              >
                <ArrowIcon dir="right" />
              </button>
            </div>
          ) : null}
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
              <ArrowIcon dir={wordsVertical ? "up" : "left"} />
            </button>
            <div
              ref={trackRef}
              className={styles.track}
              role="group"
              aria-label={menuCategory === "digits" ? "Деңгейлер" : "Сөздер"}
            >
            {flatItems.map((item, i) => {
              const tone =
                menuCategory === "digits"
                  ? MENU_CARD_TONES[
                      menuToneIndexForDigitCard(item.word.levelNumber)
                    ]
                  : MENU_CARD_TONES[
                      menuToneIndexForLetterCard(item.startsWithLetter, i)
                    ];
              const isCenter = centeredCardIdx === i;
              const centerScale = reduceMotion ? 1 : isCenter ? 1.03 : 0.97;
              const centerOpacity = reduceMotion ? 1 : isCenter ? 1 : 0.82;
              return (
              <motion.button
                key={
                  menuCategory === "digits"
                    ? `digit-${item.word.word}-${item.word.levelNumber ?? i}`
                    : `${item.startsWithLetter}-${item.word.word}-${item.word.emoji}-${i}`
                }
                ref={el => {
                  cardRefs.current[i] = el;
                }}
                type="button"
                className={styles.card}
                style={toneCssVars(tone)}
                data-menu-card
                data-letter={item.startsWithLetter}
                data-word={item.word.word}
                data-index={i}
                data-category={menuCategory}
                aria-label={
                  item.word.puzzleTitle
                    ? `${item.word.puzzleTitle}, ${item.word.emoji}`
                    : `${item.word.word}, ${item.word.emoji}`
                }
                initial={
                  snappyMenu
                    ? false
                    : { opacity: 0, y: 24, rotate: i % 2 === 0 ? -4 : 4, scale: 0.96 }
                }
                animate={{
                  opacity: centerOpacity,
                  scale: centerScale,
                  y: 0,
                  rotate: 0,
                }}
                transition={
                  snappyMenu || reduceMotion
                    ? { duration: 0 }
                    : {
                        delay: 0.04 + i * 0.055,
                        type: "spring",
                        stiffness: 420,
                        damping: 28,
                      }
                }
                whileHover={
                  reduceMotion
                    ? { y: -2 }
                    : {
                        scale: isCenter ? 1.04 : 1.015,
                        y: -3,
                      }
                }
                whileTap={{ scale: 0.97 }}
                onClick={() =>
                  onPickWord(item.word, menuCategory === "digits" ? "digits" : "letters")
                }
              >
                <span className={styles.cardInner}>
                  {item.word.levelNumber != null ? (
                    <span className={styles.cardLevel}>
                      {item.word.levelNumber}-ДЕҢГЕЙ
                    </span>
                  ) : null}
                  <span className={styles.cardEmoji} aria-hidden>
                    {item.word.svgSrc ? (
                      <img
                        src={item.word.svgSrc}
                        alt=""
                        className={styles.cardEmojiImg}
                        draggable={false}
                      />
                    ) : (
                      item.word.emoji
                    )}
                  </span>
                  <span className={styles.cardWord}>
                    {item.word.puzzleTitle ?? item.word.word}
                  </span>
                </span>
              </motion.button>
            );
            })}
            {menuCategory === "letters" ? (
              <div
                className={`${styles.card} ${styles.cardComingSoon}`}
                data-menu-card
                role="note"
                aria-label="Келесі сөздер жасалып жатыр. Жақында қосылады."
              >
                <span className={styles.cardInner}>
                  <span className={styles.cardComingSoonText}>
                    Келесі сөздер жасалып жатыр
                    <br />
                    Жақында қосылады
                  </span>
                </span>
              </div>
            ) : null}
            {menuCategory === "digits" ? (
              <div
                className={`${styles.card} ${styles.cardComingSoon}`}
                data-menu-card
                role="note"
                aria-label="Келесі деңгей жасалып жатыр. Жақында қосылады."
              >
                <span className={styles.cardInner}>
                  <span className={styles.cardComingSoonText}>
                    Келесі деңгей жасалып жатыр
                    <br />
                    Жақында қосылады
                  </span>
                </span>
              </div>
            ) : null}
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
              <ArrowIcon dir={wordsVertical ? "down" : "right"} />
            </button>
          </div>
          {menuCardCount > 1 ? (
            <div
              className={styles.trackDots}
              role="tablist"
              aria-label={
                menuCategory === "digits"
                  ? "Деңгейлер бойынша"
                  : "Карточкалар бойынша"
              }
            >
              {Array.from({ length: menuCardCount }, (_, dotI) => (
                <button
                  key={dotI}
                  type="button"
                  role="tab"
                  aria-selected={centeredCardIdx === dotI}
                  aria-label={`${dotI + 1} / ${menuCardCount}`}
                  className={
                    centeredCardIdx === dotI
                      ? `${styles.trackDot} ${styles.trackDotActive}`
                      : styles.trackDot
                  }
                  onClick={() => scrollMenuCardToIndex(dotI)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
