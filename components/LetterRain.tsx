import { useCallback, useEffect, useRef, useState } from "react";
import type { WordDef } from "../types";
import {
  RAIN_LETTERS,
  RAIN_TUNING,
  type RainDifficulty,
} from "../data/rainLevels";
import {
  playLetterSnapSound,
  playPuzzleWrongSound,
  unlockAudio,
} from "../utils/sound";
import styles from "./LetterRain.module.css";

interface LetterRainProps {
  level: WordDef;
  onHome: () => void;
}

type Phase = "ready" | "play" | "win" | "lose";

type Drop = {
  id: number;
  ch: string;
  color: string;
  pc: string;
  x: number;
  y: number;
  vy: number;
  r: number;
  rot: number;
  vr: number;
  pop: number;
  glow: boolean;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  s: number;
};

type Floater = {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
};

type Streak = { x: number; y: number; len: number; vy: number; a: number };

function pickLetter(exclude?: string) {
  const pool = exclude
    ? RAIN_LETTERS.filter(l => l.ch !== exclude)
    : RAIN_LETTERS;
  return pool[Math.floor(Math.random() * pool.length)] ?? RAIN_LETTERS[0];
}

function difficultyOf(level: WordDef): RainDifficulty {
  return level.rainStage ?? "easy";
}

function bestKey(d: RainDifficulty) {
  return `kz-rain-best-${d}`;
}

function readBest(d: RainDifficulty) {
  try {
    const n = Number(localStorage.getItem(bestKey(d)));
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeBest(d: RainDifficulty, score: number) {
  try {
    localStorage.setItem(bestKey(d), String(score));
  } catch {
    /* ignore quota */
  }
}

export function LetterRain({ level, onHome }: LetterRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dropsRef = useRef<Drop[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatersRef = useRef<Floater[]>([]);
  const streaksRef = useRef<Streak[]>([]);
  const idRef = useRef(1);
  const spawnAccRef = useRef(0);
  const shakeRef = useRef(0);
  const hitstopRef = useRef(0);
  const flashRef = useRef(0);
  const flashColorRef = useRef("220,38,38");
  const targetRef = useRef(pickLetter().ch);
  const caughtStreakRef = useRef(0);
  const sizeRef = useRef({ w: 360, h: 640, dpr: 1 });
  const reducedRef = useRef(false);
  const phaseRef = useRef<Phase>("ready");
  const comboRef = useRef(0);
  const heartsRef = useRef(3);
  const caughtRef = useRef(0);
  const scoreRef = useRef(0);
  const catcherRef = useRef({ x: 180, tx: 180 });
  const keysRef = useRef({ left: false, right: false });

  const diff = difficultyOf(level);
  const tuning = RAIN_TUNING[diff];
  const [phase, setPhase] = useState<Phase>("ready");
  const [target, setTarget] = useState(targetRef.current);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [caught, setCaught] = useState(0);
  const [best, setBest] = useState(() => readBest(diff));

  const resetSim = useCallback(() => {
    dropsRef.current = [];
    particlesRef.current = [];
    floatersRef.current = [];
    spawnAccRef.current = tuning.spawnMs;
    shakeRef.current = 0;
    hitstopRef.current = 0;
    flashRef.current = 0;
    comboRef.current = 0;
    heartsRef.current = 3;
    caughtRef.current = 0;
    scoreRef.current = 0;
    caughtStreakRef.current = 0;
    const { w } = sizeRef.current;
    catcherRef.current.x = w / 2;
    catcherRef.current.tx = w / 2;
    const next = pickLetter();
    targetRef.current = next.ch;
    setTarget(next.ch);
    setScore(0);
    setCombo(0);
    setHearts(3);
    setCaught(0);
  }, [tuning.spawnMs]);

  const burst = (x: number, y: number, color: string, n: number) => {
    const cap = 72;
    const room = Math.max(0, cap - particlesRef.current.length);
    const count = Math.min(n, room);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 80 + Math.random() * 220;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 40,
        life: 0.35 + Math.random() * 0.35,
        max: 0.55 + Math.random() * 0.25,
        color,
        s: 3 + Math.random() * 5,
      });
    }
  };

  const startPlay = () => {
    unlockAudio();
    resetSim();
    phaseRef.current = "play";
    setPhase("play");
  };

  useEffect(() => {
    reducedRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    setBest(readBest(diff));
    resetSim();
    phaseRef.current = "ready";
    setPhase("ready");
  }, [level.word, diff, resetSim]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") keysRef.current.left = true;
      if (e.code === "ArrowRight" || e.code === "KeyD") keysRef.current.right = true;
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") keysRef.current.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") keysRef.current.right = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();

    const seedStreaks = (w: number, h: number) => {
      const n = reducedRef.current ? 18 : 46;
      streaksRef.current = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        len: 10 + Math.random() * 16,
        vy: 420 + Math.random() * 280,
        a: 0.18 + Math.random() * 0.28,
      }));
    };

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      sizeRef.current = { w, h, dpr };
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      if (streaksRef.current.length === 0) seedStreaks(w, h);
      catcherRef.current.x = Math.min(w - 20, Math.max(20, catcherRef.current.x || w / 2));
      catcherRef.current.tx = Math.min(w - 20, Math.max(20, catcherRef.current.tx || w / 2));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const onPtr = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      catcherRef.current.tx = e.clientX - rect.left;
    };
    canvas.addEventListener("pointerdown", onPtr);
    canvas.addEventListener("pointermove", onPtr);

    const spawn = () => {
      const { w } = sizeRef.current;
      const wantTarget = Math.random() > tuning.decoyChance;
      const letter = wantTarget
        ? RAIN_LETTERS.find(l => l.ch === targetRef.current) ?? pickLetter()
        : pickLetter(targetRef.current);
      const r = 26 + Math.random() * 8;
      dropsRef.current.push({
        id: idRef.current++,
        ch: letter.ch,
        color: letter.color,
        pc: letter.pc,
        x: r + 10 + Math.random() * Math.max(16, w - r * 2 - 20),
        y: -r - 8,
        vy: tuning.minVy + Math.random() * (tuning.maxVy - tuning.minVy),
        r,
        rot: (Math.random() - 0.5) * 0.35,
        vr: (Math.random() - 0.5) * 1.4,
        pop: 0,
        glow: letter.ch === targetRef.current,
      });
    };

    const drawUmbrella = (x: number, y: number, w: number) => {
      const hw = w / 2;
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.moveTo(-hw, 8);
      ctx.quadraticCurveTo(-hw * 0.55, -34, 0, -38);
      ctx.quadraticCurveTo(hw * 0.55, -34, hw, 8);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, -38, 0, 10);
      g.addColorStop(0, "#ffb45c");
      g.addColorStop(1, "#f57c1f");
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.strokeStyle = "rgba(61,52,40,0.18)";
      ctx.lineWidth = 1.5;
      for (const t of [-0.55, 0, 0.55]) {
        ctx.beginPath();
        ctx.moveTo(0, -36);
        ctx.quadraticCurveTo(hw * t * 0.7, -12, hw * t, 8);
        ctx.stroke();
      }
      ctx.strokeStyle = "#3d3428";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.lineTo(0, 36);
      ctx.quadraticCurveTo(10, 46, 18, 40);
      ctx.stroke();
      ctx.restore();
    };

    const drawDrop = (d: Drop) => {
      const scale = d.pop > 0 ? 1 + d.pop * 0.45 : 1;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);
      ctx.scale(scale, scale);
      if (d.glow) {
        ctx.shadowColor = d.color;
        ctx.shadowBlur = 18;
      }
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(-d.r, -d.r, d.r * 2, d.r * 2, d.r * 0.38);
      } else {
        ctx.rect(-d.r, -d.r, d.r * 2, d.r * 2);
      }
      ctx.fillStyle = d.color;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = d.glow ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.32)";
      ctx.lineWidth = d.glow ? 4 : 3;
      ctx.stroke();
      ctx.fillStyle = "#fffefb";
      ctx.font = `900 ${Math.round(d.r * 1.15)}px "Noto Sans", system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(d.ch, 0, 2);
      ctx.restore();
    };

    const drawSky = (w: number, h: number) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#6eb7dc");
      g.addColorStop(0.42, "#c5e6f4");
      g.addColorStop(1, "#e9d7b8");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.62)";
      ctx.beginPath();
      ctx.ellipse(w * 0.18, h * 0.12, 78, 30, 0, 0, Math.PI * 2);
      ctx.ellipse(w * 0.3, h * 0.1, 54, 24, 0, 0, Math.PI * 2);
      ctx.ellipse(w * 0.76, h * 0.15, 86, 32, 0, 0, Math.PI * 2);
      ctx.ellipse(w * 0.88, h * 0.13, 48, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#d9bc86";
      ctx.fillRect(0, h - 42, w, 42);
      ctx.fillStyle = "#c4a56a";
      ctx.fillRect(0, h - 44, w, 5);
    };

    const catchY = (h: number) => h - 92;
    const catchW = 124;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.1) dt = 0.1;
      const { w, h, dpr } = sizeRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (hitstopRef.current > 0) {
        hitstopRef.current -= dt;
        dt *= 0.12;
      }

      const c = catcherRef.current;
      const kbd = (keysRef.current.right ? 1 : 0) - (keysRef.current.left ? 1 : 0);
      if (kbd !== 0) c.tx += kbd * 420 * dt;
      c.tx = Math.max(catchW * 0.42, Math.min(w - catchW * 0.42, c.tx));
      const follow = 1 - Math.exp(-14 * dt);
      c.x += (c.tx - c.x) * follow;

      shakeRef.current = Math.max(0, shakeRef.current - dt * 2.4);
      flashRef.current = Math.max(0, flashRef.current - dt * 4);
      const trauma = shakeRef.current * shakeRef.current;
      const ox = reducedRef.current ? 0 : (Math.random() - 0.5) * 16 * trauma;
      const oy = reducedRef.current ? 0 : (Math.random() - 0.5) * 12 * trauma;

      ctx.save();
      ctx.translate(ox, oy);
      drawSky(w, h);

      for (const s of streaksRef.current) {
        s.y += s.vy * dt;
        if (s.y - s.len > h) {
          s.y = -s.len;
          s.x = Math.random() * w;
        }
        ctx.strokeStyle = `rgba(255,255,255,${s.a})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - 3, s.y + s.len);
        ctx.stroke();
      }

      if (phaseRef.current === "play") {
        spawnAccRef.current += dt * 1000;
        let live = dropsRef.current.filter(d => d.pop === 0).length;
        while (spawnAccRef.current >= tuning.spawnMs && live < tuning.maxDrops) {
          spawnAccRef.current -= tuning.spawnMs;
          spawn();
          live += 1;
        }
        if (live >= tuning.maxDrops) spawnAccRef.current = 0;

        const cy = catchY(h);
        const nextDrops: Drop[] = [];
        for (const d of dropsRef.current) {
          if (d.pop > 0) {
            d.pop += dt * 8;
            if (d.pop < 1) {
              drawDrop(d);
              nextDrops.push(d);
            }
            continue;
          }
          d.y += d.vy * dt;
          d.rot += d.vr * dt;
          d.glow = d.ch === targetRef.current;

          const inCatchX = Math.abs(d.x - c.x) < catchW * 0.46;
          const inCatchY = d.y + d.r > cy - 18 && d.y - d.r < cy + 16;
          if (inCatchX && inCatchY) {
            if (d.ch === targetRef.current) {
              d.pop = 0.01;
              burst(d.x, d.y, d.color, reducedRef.current ? 6 : 14);
              comboRef.current += 1;
              const add = 10 * comboRef.current;
              scoreRef.current += add;
              caughtRef.current += 1;
              caughtStreakRef.current += 1;
              setScore(scoreRef.current);
              setCombo(comboRef.current);
              setCaught(caughtRef.current);
              floatersRef.current.push({
                x: d.x,
                y: d.y - 10,
                text:
                  comboRef.current > 1
                    ? `+${add}  x${comboRef.current}`
                    : `+${add}`,
                life: 0.7,
                color: "#c2410c",
              });
              playLetterSnapSound(d.ch);
              if (!reducedRef.current) {
                hitstopRef.current = 0.04;
                shakeRef.current = Math.min(1, shakeRef.current + 0.18);
              }
              flashColorRef.current = "38,180,70";
              flashRef.current = 0.22;
              if (caughtStreakRef.current >= tuning.retargetEvery) {
                caughtStreakRef.current = 0;
                const nxt = pickLetter(targetRef.current);
                targetRef.current = nxt.ch;
                setTarget(nxt.ch);
              }
              if (caughtRef.current >= tuning.goal) {
                const finalScore = scoreRef.current;
                if (finalScore > readBest(diff)) {
                  writeBest(diff, finalScore);
                  setBest(finalScore);
                }
                phaseRef.current = "win";
                setPhase("win");
              }
              drawDrop(d);
              nextDrops.push(d);
              continue;
            }
            playPuzzleWrongSound();
            comboRef.current = 0;
            setCombo(0);
            shakeRef.current = Math.min(1, shakeRef.current + 0.45);
            flashColorRef.current = "220,38,38";
            flashRef.current = 0.32;
            burst(d.x, d.y, d.color, 8);
            floatersRef.current.push({
              x: d.x,
              y: d.y - 8,
              text: "Жоқ",
              life: 0.55,
              color: "#b91c1c",
            });
            continue;
          }

          if (d.y - d.r > h - 28) {
            if (d.ch === targetRef.current) {
              heartsRef.current -= 1;
              setHearts(heartsRef.current);
              comboRef.current = 0;
              setCombo(0);
              shakeRef.current = Math.min(1, shakeRef.current + 0.5);
              flashColorRef.current = "220,38,38";
              flashRef.current = 0.35;
              if (heartsRef.current <= 0) {
                const finalScore = scoreRef.current;
                if (finalScore > readBest(diff)) {
                  writeBest(diff, finalScore);
                  setBest(finalScore);
                }
                phaseRef.current = "lose";
                setPhase("lose");
              }
            }
            continue;
          }
          drawDrop(d);
          nextDrops.push(d);
        }
        dropsRef.current = nextDrops;
      } else {
        for (const d of dropsRef.current) drawDrop(d);
      }

      drawUmbrella(c.x, catchY(h), catchW);

      const nextP: Particle[] = [];
      for (const p of particlesRef.current) {
        p.life -= dt;
        if (p.life <= 0) continue;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 420 * dt;
        const a = Math.max(0, p.life / p.max);
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s * a, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        nextP.push(p);
      }
      particlesRef.current = nextP;

      const nextF: Floater[] = [];
      for (const f of floatersRef.current) {
        f.life -= dt;
        if (f.life <= 0) continue;
        f.y -= 46 * dt;
        ctx.globalAlpha = Math.max(0, f.life / 0.7);
        ctx.fillStyle = f.color;
        ctx.font = "900 22px 'Noto Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(f.text, f.x, f.y);
        ctx.globalAlpha = 1;
        nextF.push(f);
      }
      floatersRef.current = nextF;
      ctx.restore();

      if (flashRef.current > 0) {
        ctx.fillStyle = `rgba(${flashColorRef.current},${flashRef.current * 0.26})`;
        ctx.fillRect(0, 0, w, h);
      }
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPtr);
      canvas.removeEventListener("pointermove", onPtr);
    };
  }, [tuning, diff]);

  const progress = Math.min(1, caught / tuning.goal);
  const heartStr =
    "♥".repeat(Math.max(0, hearts)) + "♡".repeat(Math.max(0, 3 - hearts));

  return (
    <div ref={wrapRef} className={styles.shell}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        aria-label="Әріп жаңбыры"
      />
      <div className={styles.hud}>
        <div className={styles.topBar}>
          <button type="button" className={styles.homeBtn} onClick={onHome}>
            Үй
          </button>
          <div className={styles.targetCard}>
            <span className={styles.targetLabel}>Ұста</span>
            <span className={styles.targetGlyph}>{target}</span>
          </div>
          <div className={styles.stats}>
            <span className={styles.hearts} aria-label={`${hearts} өмір`}>
              {heartStr}
            </span>
            <span className={styles.score}>{score}</span>
            <span className={styles.combo}>
              {combo > 1 ? `x${combo}` : best > 0 ? `үздік ${best}` : " "}
            </span>
          </div>
        </div>
      </div>
      <div className={styles.progress} aria-hidden>
        <div
          className={styles.progressFill}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      {phase === "play" ? (
        <p className={styles.playHint}>Қолшатырды жылжытыңыз</p>
      ) : null}

      {phase === "ready" ? (
        <div className={styles.overlay}>
          <div className={styles.panel}>
            <p className={styles.panelTitle}>
              {level.puzzleTitle ?? "Әріп жаңбыры"}
            </p>
            <p className={styles.panelBody}>
              {level.gameInstruction ??
                "Қолшатырды жылжытып, жарқыраған әріпті ұстаңыз."}
            </p>
            <div className={styles.bigLetter}>{target}</div>
            <div className={styles.actions}>
              <button type="button" className={styles.primary} onClick={startPlay}>
                Бастау
              </button>
              <button type="button" className={styles.ghost} onClick={onHome}>
                Мәзір
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {phase === "win" ? (
        <div className={styles.overlay}>
          <div className={styles.panel}>
            <p className={styles.panelTitle}>Жарайсың!</p>
            <p className={styles.panelBody}>
              {caught} әріп ұсталды · {score} ұпай
              {best > 0 ? ` · үздік ${best}` : ""}
            </p>
            <div className={styles.actions}>
              <button type="button" className={styles.primary} onClick={startPlay}>
                Тағы ойнау
              </button>
              <button type="button" className={styles.ghost} onClick={onHome}>
                Мәзір
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {phase === "lose" ? (
        <div className={styles.overlay}>
          <div className={styles.panel}>
            <p className={styles.panelTitle}>Жаңбыр асып кетті</p>
            <p className={styles.panelBody}>
              {score} ұпай. Қолшатырды дұрыс әріптің астына қойыңыз.
            </p>
            <div className={styles.actions}>
              <button type="button" className={styles.primary} onClick={startPlay}>
                Қайтадан
              </button>
              <button type="button" className={styles.ghost} onClick={onHome}>
                Мәзір
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
