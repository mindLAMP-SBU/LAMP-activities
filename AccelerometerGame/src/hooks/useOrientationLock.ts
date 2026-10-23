import { CSSProperties, useEffect, useRef, useState } from "react";

/**
 * Keeps the game visually locked to the device while it is being played.
 *
 * Browsers can only truly lock orientation on Android, in fullscreen, and never
 * on iOS. So in addition to a best-effort native lock, this hook watches for
 * the OS rotating the screen and counter-rotates the game with CSS, so the
 * view stays put relative to the phone. Motion input (rotationRate) is in the
 * device frame, so controls are unaffected by screen rotation either way.
 */

export interface ViewportSize {
  w: number;
  h: number;
}

interface Base extends ViewportSize {
  angle: number;
}

/** Current screen rotation in degrees: 0, 90, 180 or 270. */
export function getScreenAngle(): number {
  const so: any = typeof screen !== "undefined" ? (screen as any).orientation : undefined;
  let angle: number =
    so && typeof so.angle === "number" ? so.angle : Number((window as any).orientation) || 0;
  return ((angle % 360) + 360) % 360;
}

let enteredFullscreen = false;

/**
 * Best-effort native lock to the current orientation. Must be called
 * synchronously from a user gesture. Fails silently where unsupported
 * (iOS, iframes without allow="fullscreen", desktop).
 */
export function tryNativeLock(): void {
  const so: any = (screen as any).orientation;
  const lock = () => {
    if (so && typeof so.lock === "function") {
      Promise.resolve(so.lock(so.type)).catch(() => {});
    }
  };
  try {
    const el: any = document.documentElement;
    if (!document.fullscreenElement && typeof el.requestFullscreen === "function") {
      Promise.resolve(el.requestFullscreen())
        .then(() => {
          enteredFullscreen = true;
          lock();
        })
        .catch(() => lock());
    } else {
      lock();
    }
  } catch {
    // Unsupported, nothing to do.
  }
}

function releaseNativeLock(): void {
  try {
    const so: any = (screen as any).orientation;
    if (so && typeof so.unlock === "function") so.unlock();
    if (enteredFullscreen && document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  } catch {
    // Unsupported, nothing to do.
  }
  enteredFullscreen = false;
}

export function useOrientationLock(active: boolean): { style: CSSProperties; size: ViewportSize | null } {
  // Captured during render so the very first "active" render already has a fixed size.
  const baseRef = useRef<Base | null>(null);
  if (active && baseRef.current === null) {
    baseRef.current = { angle: getScreenAngle(), w: window.innerWidth, h: window.innerHeight };
  } else if (!active) {
    baseRef.current = null;
  }

  const [delta, setDelta] = useState(0);
  const [, setSizeVersion] = useState(0);

  useEffect(() => {
    if (!active) return undefined;

    const onChange = () => {
      const base = baseRef.current;
      if (!base) return;
      setDelta((getScreenAngle() - base.angle + 360) % 360);
    };

    // Entering fullscreen resizes the viewport without rotating; adopt the new size.
    const onFullscreenChange = () => {
      const base = baseRef.current;
      if (!base || getScreenAngle() !== base.angle) return;
      if (base.w !== window.innerWidth || base.h !== window.innerHeight) {
        base.w = window.innerWidth;
        base.h = window.innerHeight;
        setSizeVersion((v) => v + 1);
      }
    };

    const so: any = (screen as any).orientation;
    so?.addEventListener?.("change", onChange);
    window.addEventListener("orientationchange", onChange);
    window.addEventListener("resize", onChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      so?.removeEventListener?.("change", onChange);
      window.removeEventListener("orientationchange", onChange);
      window.removeEventListener("resize", onChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.body.style.overflow = prevOverflow;
      setDelta(0);
      releaseNativeLock();
    };
  }, [active]);

  const base = baseRef.current;
  if (!base || delta === 0) {
    return { style: {}, size: base };
  }

  // The OS rotated the content by `delta` relative to the device; undo it.
  return {
    style: {
      position: "fixed",
      left: "50%",
      top: "50%",
      width: base.w,
      height: base.h,
      minHeight: 0,
      transform: `translate(-50%, -50%) rotate(${-delta}deg)`,
    },
    size: base,
  };
}

export default useOrientationLock;
