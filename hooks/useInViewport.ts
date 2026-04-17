import { useEffect, useRef, useState } from "react";

interface UseInViewportOptions extends IntersectionObserverInit {
  initialInView?: boolean;
}

export function useInViewport<T extends Element>(
  options: UseInViewportOptions = {}
) {
  const { initialInView = true, root = null, rootMargin, threshold } = options;
  const targetRef = useRef<T | null>(null);
  const [inViewport, setInViewport] = useState(initialInView);

  useEffect(() => {
    const node = targetRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setInViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        const first = entries[0];
        if (!first) return;
        setInViewport(prev =>
          prev === first.isIntersecting ? prev : first.isIntersecting
        );
      },
      { root, rootMargin, threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [root, rootMargin, threshold]);

  return { targetRef, inViewport };
}
