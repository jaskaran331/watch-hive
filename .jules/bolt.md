## 2025-10-24 - Memoize MediaCard items
**Learning:** Passing an inline function like `onClick={() => onSelect(item)}` to a memoized component (`MediaCard`) within a map loop completely breaks memoization, causing every card to re-render when the parent state changes.
**Action:** Refactor child components to handle argument passing internally using `useCallback`, allowing parents to pass stable function references.

## 2023-11-20 - Prevent Layout Thrashing in Scroll Listeners (O(N²) -> O(N))
**Learning:** Checking layout bounds inside loops on elements that may trigger synchronous style recalculations causes layout thrashing, which is especially destructive inside unbounded high-frequency scroll event listeners. The multiple carousels all were doing O(N²) layout reads.
**Action:** Extract parent element bounds calculations OUTSIDE of loops, and throttle/debounce expensive visibility checks attached to scrolling.

## 2026-07-14 - Fix O(N) re-renders in MediaCard lists caused by global watched object
**Learning:** When passing large global dictionary objects like `watched` to a list of memoized components, simply wrapping the component in `React.memo` is insufficient if the parent updates the object reference frequently. Every card component re-rendered because the `watched` prop reference changed, even if their specific watched state was identical, creating an O(N) rendering bottleneck.
**Action:** Implemented a custom `arePropsEqual` function for `React.memo` that performs a shallow comparison of all props by iterating over `Object.keys` (to avoid stale closures) but specifically checks only the relevant `watchedKey` for the `watched` object prop.
