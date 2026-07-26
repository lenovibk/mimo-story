/**
 * iOS standalone PWAs can report a stale `100dvh` (and safe-area-inset-*)
 * for the first render after a rotation - the CSS unit settles correctly on
 * later rotations, but that first flip leaves the app sized to the old
 * viewport with a blank strip of page background showing through. Track the
 * real viewport height in JS instead and expose it as `--app-height`, which
 * index.css prefers over `100dvh`.
 */
function setAppHeight() {
  const height = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${height}px`);
}

export function initAppHeight() {
  setAppHeight();
  window.addEventListener("resize", setAppHeight);
  // `resize`/`orientationchange` can fire before iOS finishes settling the
  // new viewport dimensions - re-measure shortly after so we don't bake in
  // the pre-rotation size.
  window.addEventListener("orientationchange", () => setTimeout(setAppHeight, 200));
  window.visualViewport?.addEventListener("resize", setAppHeight);
}
