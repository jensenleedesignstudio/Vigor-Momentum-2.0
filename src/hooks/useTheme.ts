import { useEffect } from "react";
import type { Preferences } from "../types";

/**
 * Applies the saved appearance settings to the document element.
 *
 * `system` follows the OS preference live, so the page flips when the user
 * changes their setting without needing a reload.
 */
export function useTheme(theme: Preferences["theme"], reduceMotion: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const resolved = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      root.dataset.theme = resolved;
      root.style.colorScheme = resolved;
    };

    apply();
    if (theme !== "system") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.motion = reduceMotion ? "reduced" : "full";
  }, [reduceMotion]);
}
