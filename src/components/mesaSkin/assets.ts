import type { SyntheticEvent } from "react";

// Art is imported as modules so the bundler inlines it into the single-file build.
// Every image also carries a plain relative fallback used on error.
import mapHarbor from "./images/map-harbor.jpg";
import mapBridge from "./images/map-bridge.jpg";
import portraitKael from "./images/portrait-kael.jpg";
import portraitSeraphine from "./images/portrait-seraphine.jpg";
import portraitBrom from "./images/portrait-brom.jpg";
import portraitFoe from "./images/portrait-foe.jpg";

export const IMG = {
  mapHarbor: { src: mapHarbor, fallback: "images/map-harbor.jpg" },
  mapBridge: { src: mapBridge, fallback: "images/map-bridge.jpg" },
  kael: { src: portraitKael, fallback: "images/portrait-kael.jpg" },
  seraphine: { src: portraitSeraphine, fallback: "images/portrait-seraphine.jpg" },
  brom: { src: portraitBrom, fallback: "images/portrait-brom.jpg" },
  foe: { src: portraitFoe, fallback: "images/portrait-foe.jpg" },
};

export type ImgKey = keyof typeof IMG;

/** <img> error handler: retry the public path, then hide so the brass surface shows through. */
export function imgFallback(e: SyntheticEvent<HTMLImageElement>, key: ImgKey) {
  const el = e.currentTarget;
  if (!el.dataset.retried) {
    el.dataset.retried = "1";
    el.src = IMG[key].fallback;
    return;
  }
  el.style.display = "none";
}
