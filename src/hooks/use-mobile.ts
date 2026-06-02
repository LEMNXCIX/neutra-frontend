import { useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 768

function subscribeMatchMedia(cb: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", cb)
  return () => mql.removeEventListener("change", cb)
}

export function useIsMobile() {
  const isMobile = useSyncExternalStore(
    subscribeMatchMedia,
    () => window.innerWidth < MOBILE_BREAKPOINT,
    () => false,
  )
  return isMobile
}
