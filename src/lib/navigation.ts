export const NAV_START_EVENT = 'page237:navstart'

export function startNavigation() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(NAV_START_EVENT))
}
