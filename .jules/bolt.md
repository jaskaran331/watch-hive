## 2025-10-24 - Memoize MediaCard items
**Learning:** Passing an inline function like `onClick={() => onSelect(item)}` to a memoized component (`MediaCard`) within a map loop completely breaks memoization, causing every card to re-render when the parent state changes.
**Action:** Refactor child components to handle argument passing internally using `useCallback`, allowing parents to pass stable function references.

## 2023-11-20 - Prevent Layout Thrashing in Scroll Listeners (O(N²) -> O(N))
**Learning:** Checking layout bounds inside loops on elements that may trigger synchronous style recalculations causes layout thrashing, which is especially destructive inside unbounded high-frequency scroll event listeners. The multiple carousels all were doing O(N²) layout reads.
**Action:** Extract parent element bounds calculations OUTSIDE of loops, and throttle/debounce expensive visibility checks attached to scrolling.

## 2024-06-25 - React.memo custom equality and stale closures
**Learning:** When writing a custom equality function for `React.memo` (e.g. to optimize re-renders caused by a single dictionary mapping prop changing), explicitly listing the other props to compare is dangerous. If you miss a prop like an `onClick` callback, the component will fail to update when that callback changes, leading to stale closures where clicking the component executes an outdated version of the function.
**Action:** Always check all other props for shallow equality programmatically (e.g., using `Object.keys`) in `React.memo` custom equality functions to prevent stale closure bugs.
