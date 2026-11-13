/** Short vibration pulse, in ms. Kept tiny so it reads as a tap, not a buzz. */
export const TAP_MS = 30;

/**
 * Vibrate if the device supports it; silently does nothing otherwise.
 * Note: iOS Safari / WKWebView do not implement the Vibration API.
 */
export function vibrate(ms: number = TAP_MS): void {
    try {
        if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function")
            navigator.vibrate(ms);
    } catch {
        // Some browsers throw instead of ignoring the call (e.g. in cross-origin iframes)
    }
}
