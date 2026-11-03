/* eslint-disable prettier/prettier */
import { useEffect, useState } from "react";

/**
 * True when the page was opened from the ITL Bridge AI pages
 * (/login?product=bridge, /register?product=bridge).
 *
 * Read from the raw query string after mount — not through the router's
 * search parser — so these routes keep their existing types and SSR output
 * stays identical to the first client render.
 */
export function useIsBridgeProduct(): boolean {
  const [isBridge, setIsBridge] = useState(false);
  useEffect(() => {
    setIsBridge(new URLSearchParams(window.location.search).get("product") === "bridge");
  }, []);
  return isBridge;
}
