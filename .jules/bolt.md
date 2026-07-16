## 2025-10-24 - Memoize MediaCard items
**Learning:** Passing an inline function like `onClick={() => onSelect(item)}` to a memoized component (`MediaCard`) within a map loop completely breaks memoization, causing every card to re-render when the parent state changes.
**Action:** Refactor child components to handle argument passing internally using `useCallback`, allowing parents to pass stable function references.

## 2023-11-20 - Prevent Layout Thrashing in Scroll Listeners (O(N²) -> O(N))
**Learning:** Checking layout bounds inside loops on elements that may trigger synchronous style recalculations causes layout thrashing, which is especially destructive inside unbounded high-frequency scroll event listeners. The multiple carousels all were doing O(N²) layout reads.
**Action:** Extract parent element bounds calculations OUTSIDE of loops, and throttle/debounce expensive visibility checks attached to scrolling.
## 2026-07-16 - Custom equality function for React.memo to prevent O(N) re-renders
**Learning:** The MediaCard component in lists re-rendered O(N) times because it received the global `watched` object, changing its identity whenever one item was marked as watched. Using `React.memo` with a custom comparison function that specifically checks the item's watched state prevents this performance bottleneck.
**Action:** When passing a large global dictionary of states to many child list elements, use `React.memo` with a custom `arePropsEqual` function that compares only the specific key for each item, but ensures to shallow compare all other props using `Object.keys()` to prevent stale closure bugs.
