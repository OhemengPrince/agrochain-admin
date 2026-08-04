import { useEffect, useRef, useState } from 'react';

const defaultFormatter = (v) => Math.round(v).toLocaleString();

// Animates a number counting up from its previous displayed value to the
// new `value` whenever `value` changes (not just on mount), so live data
// refreshes re-trigger the animation too.
export default function CountUp({ value, duration = 1000, formatter = defaultFormatter }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const from = fromRef.current;
    const startTime = performance.now();

    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (target - from) * eased;
      setDisplay(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <>{formatter(display)}</>;
}
