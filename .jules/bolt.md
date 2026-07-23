## 2025-10-24 - Memoize MediaCard items
**Learning:** Passing an inline function like `onClick={() => onSelect(item)}` to a memoized component (`MediaCard`) within a map loop completely breaks memoization, causing every card to re-render when the parent state changes.
**Action:** Refactor child components to handle argument passing internally using `useCallback`, allowing parents to pass stable function references.

## 2023-11-20 - Prevent Layout Thrashing in Scroll Listeners (O(N²) -> O(N))
**Learning:** Checking layout bounds inside loops on elements that may trigger synchronous style recalculations causes layout thrashing, which is especially destructive inside unbounded high-frequency scroll event listeners. The multiple carousels all were doing O(N²) layout reads.
**Action:** Extract parent element bounds calculations OUTSIDE of loops, and throttle/debounce expensive visibility checks attached to scrolling.

## 2024-05-18 - [Optimize MediaCard rendering for global object changes]
**Learning:** React.memo defaults to shallow comparison, meaning if a large global object like `watched` changes (even if unrelated to a specific item), ALL `MediaCard` components using it will re-render, creating an O(N) performance bottleneck for large libraries.
**Action:** Use a custom equality function for `React.memo` to deeply or specifically compare only the relevant keys of the global object (e.g. `watchedKey`), while ensuring all other props are still shallow compared using `Object.keys` to prevent stale closure bugs.
