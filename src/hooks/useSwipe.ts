import { useRef } from "react";

/**
 * Returns ref to attach to a swipable container.
 * onSwipeLeft / onSwipeRight fire after a horizontal swipe > threshold px.
 * Also checks that the swipe is mostly horizontal to prevent triggering on vertical scrolls.
 */
export function useSwipe(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  threshold = 60
) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  const handlers = {
    onTouchStart: (e: React.TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (startX.current === null || startY.current === null) return;
      const deltaX = e.changedTouches[0].clientX - startX.current;
      const deltaY = e.changedTouches[0].clientY - startY.current;

      // Ensure it's mostly horizontal (width must be > 1.5x height of swipe)
      if (Math.abs(deltaX) >= threshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        if (deltaX < 0) onSwipeLeft();
        else onSwipeRight();
      }
      startX.current = null;
      startY.current = null;
    },
  };

  return handlers;
}
