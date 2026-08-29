declare global {
  interface Window {
    google: typeof google;
    __foodmateMapsInit?: () => void;
  }
}

const MAPS_CALLBACK = "__foodmateMapsInit";
const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

let mapsLoader: Promise<void> | null = null;

export function mapsFullyReady(): boolean {
  return Boolean(window.google?.maps?.Map);
}

function waitForMapsApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (mapsFullyReady()) {
      resolve();
      return;
    }

    if (!MAPS_API_KEY) {
      reject(new Error("Could not load Google Maps"));
      return;
    }

    const previous = window.__foodmateMapsInit;
    window.__foodmateMapsInit = () => {
      previous?.();
      resolve();
    };

    // A leftover `loading=async` tag (no callback) can sit in the document
    // after HMR with `onload` already fired and `google.maps` still missing.
    // Waiting on that tag hangs forever; drop it and load the callback URL.
    for (const node of document.querySelectorAll("script[data-foodmate-maps]")) {
      const tag = node as HTMLScriptElement;
      if (!tag.src.includes("callback=")) tag.remove();
    }

    if (!document.querySelector("script[data-foodmate-maps]")) {
      const script = document.createElement("script");
      const params = new URLSearchParams({
        key: MAPS_API_KEY,
        libraries: "marker",
        callback: MAPS_CALLBACK,
        loading: "async",
      });
      script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
      script.async = true;
      script.dataset.foodmateMaps = "true";
      script.onerror = () => reject(new Error("Could not load Google Maps"));
      document.head.appendChild(script);
    }

    const started = Date.now();
    const poll = () => {
      if (mapsFullyReady()) resolve();
      else if (Date.now() - started > 15_000) {
        reject(new Error("Could not load Google Maps"));
      } else {
        window.setTimeout(poll, 50);
      }
    };
    poll();
  });
}

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps is browser-only"));
  }
  if (mapsLoader) return mapsLoader;

  mapsLoader = (async () => {
    if (typeof window.google?.maps?.importLibrary === "function") {
      await window.google.maps.importLibrary("maps");
      await window.google.maps.importLibrary("marker");
    }
    if (!mapsFullyReady()) {
      await waitForMapsApi();
      if (typeof window.google?.maps?.importLibrary === "function") {
        await window.google.maps.importLibrary("maps");
        await window.google.maps.importLibrary("marker");
      }
    }
    if (!mapsFullyReady()) {
      throw new Error("Could not load Google Maps");
    }
  })().catch((err) => {
    mapsLoader = null;
    throw err;
  });

  return mapsLoader;
}
