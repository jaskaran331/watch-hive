## 2025-10-24 - Memoize MediaCard items
**Learning:** Passing an inline function like `onClick={() => onSelect(item)}` to a memoized component (`MediaCard`) within a map loop completely breaks memoization, causing every card to re-render when the parent state changes.
**Action:** Refactor child components to handle argument passing internally using `useCallback`, allowing parents to pass stable function references.

## 2023-11-20 - Prevent Layout Thrashing in Scroll Listeners (O(N²) -> O(N))
**Learning:** Checking layout bounds inside loops on elements that may trigger synchronous style recalculations causes layout thrashing, which is especially destructive inside unbounded high-frequency scroll event listeners. The multiple carousels all were doing O(N²) layout reads.
**Action:** Extract parent element bounds calculations OUTSIDE of loops, and throttle/debounce expensive visibility checks attached to scrolling.

## 2025-03-09 - Prevent O(N) Re-renders with Custom React.memo Equality
**Learning:** Passing large global state objects (like the `watched` map) as props to frequently rendered components (like `MediaCard`) breaks `React.memo` because the object reference changes on every update, causing O(N) re-renders across the entire app whenever any single item is marked watched.
**Action:** When passing large global objects to memoized child components, implement a custom `React.memo` equality function that performs a shallow comparison of all other props and only checks the specific relevant piece of data from the global object.
