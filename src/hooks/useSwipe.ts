import { useRef } from "react";

/**
 * Returns ref to attach to a swipable container.
 * onSwipeLeft / onSwipeRight fire after a horizontal swipe > threshold px.
 */
export function useSwipe(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  threshold = 50
) {
  const startX = useRef<number | null>(null);

  const handlers = {
    onTouchStart: (e: React.TouchEvent) => {
      startX.current = e.touches[0].clientX;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (startX.current === null) return;
      const delta = e.changedTouches[0].clientX - startX.current;
      if (Math.abs(delta) >= threshold) {
        if (delta < 0) onSwipeLeft();
        else onSwipeRight();
      }
      startX.current = null;
    },
  };

  return handlers;
}
