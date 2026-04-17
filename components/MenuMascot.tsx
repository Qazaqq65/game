import { useEffect, useState } from "react";
import { useLottie } from "lottie-react";
import { useDeviceTier } from "../hooks/useDeviceTier";
import { useInViewport } from "../hooks/useInViewport";
import styles from "./MenuMascot.module.css";

/** Файл в `public/lottie/` (пробелы в имени — через encodeURIComponent). */
const LOTTIE_FILE = "Cat playing animation.json";
const LOTTIE_URL = `/lottie/${encodeURIComponent(LOTTIE_FILE)}`;

function MascotLottie({ data }: { data: object }) {
  const { targetRef, inViewport } = useInViewport<HTMLDivElement>({
    rootMargin: "120px 0px",
    threshold: 0.01,
  });
  const { View, play, stop } = useLottie(
    {
      animationData: data,
      loop: true,
      className: styles.lottie,
    },
    { margin: 0 },
  );

  useEffect(() => {
    if (inViewport) {
      play();
      return;
    }
    stop();
  }, [inViewport, play, stop]);

  return (
    <div ref={targetRef} className={styles.wrap} aria-hidden>
      {View}
    </div>
  );
}

export function MenuMascot() {
  const [data, setData] = useState<object | null>(null);
  const { isLowEnd } = useDeviceTier();

  useEffect(() => {
    if (isLowEnd) return;
    let cancelled = false;
    fetch(LOTTIE_URL)
      .then(r => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then(json => {
        if (!cancelled && json && typeof json === "object")
          setData(json as object);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isLowEnd]);

  if (isLowEnd || !data) return null;

  return <MascotLottie data={data} />;
}
