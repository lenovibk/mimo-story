// Detects when a new service worker has finished installing (i.e. a new
// version was deployed) and lets the UI prompt the user to reload, instead
// of the update silently applying in the background.
type Listener = () => void;

let updateAvailable = false;
let waitingWorker: ServiceWorker | null = null;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getUpdateAvailable() {
  return updateAvailable;
}

export function applyUpdate() {
  waitingWorker?.postMessage({ type: "SKIP_WAITING" });
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    const registration = await navigator.serviceWorker.register("/sw.js").catch(() => null);
    if (!registration) return;

    const markWaiting = (worker: ServiceWorker | null) => {
      if (!worker) return;
      waitingWorker = worker;
      updateAvailable = true;
      emit();
    };

    // A worker may already be waiting if it finished installing before this
    // tab attached its listeners (e.g. it installed while the tab was hidden).
    if (registration.waiting && navigator.serviceWorker.controller) {
      markWaiting(registration.waiting);
    }

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;
      newWorker.addEventListener("statechange", () => {
        // A controller already existing means this is an update, not the
        // very first install for this client.
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          markWaiting(newWorker);
        }
      });
    });

    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });

    // The browser only auto-checks for a new SW on navigation, which rarely
    // happens in a PWA kept open on a home screen. Poll while the app is
    // actually visible so long-lived sessions still notice new versions.
    const checkForUpdate = () => registration.update().catch(() => {});
    setInterval(checkForUpdate, 60 * 60 * 1000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") checkForUpdate();
    });
  });
}
