## 2025-10-24 - Memoize MediaCard items
**Learning:** Passing an inline function like `onClick={() => onSelect(item)}` to a memoized component (`MediaCard`) within a map loop completely breaks memoization, causing every card to re-render when the parent state changes.
**Action:** Refactor child components to handle argument passing internally using `useCallback`, allowing parents to pass stable function references.

## 2023-11-20 - Prevent Layout Thrashing in Scroll Listeners (O(N²) -> O(N))
**Learning:** Checking layout bounds inside loops on elements that may trigger synchronous style recalculations causes layout thrashing, which is especially destructive inside unbounded high-frequency scroll event listeners. The multiple carousels all were doing O(N²) layout reads.
**Action:** Extract parent element bounds calculations OUTSIDE of loops, and throttle/debounce expensive visibility checks attached to scrolling.
## 2024-07-13 - Large Global Objects and React.memo in Lists
**Learning:** Passing a large global object (like `watched` state) to items in a list (like `MediaCard`s) causes O(N) re-renders whenever a single property in that object changes, even if `React.memo` is used, because the object reference changes.
**Action:** When implementing custom equality functions for `React.memo` to prevent O(N) re-renders, perform shallow comparisons of all other props by iterating over them (e.g., using `Object.keys`) rather than explicit checks of a hardcoded subset to prevent bugs with stale closures (such as outdated `onClick` callbacks).
