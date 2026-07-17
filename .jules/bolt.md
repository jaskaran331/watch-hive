## 2025-10-24 - Memoize MediaCard items
**Learning:** Passing an inline function like `onClick={() => onSelect(item)}` to a memoized component (`MediaCard`) within a map loop completely breaks memoization, causing every card to re-render when the parent state changes.
**Action:** Refactor child components to handle argument passing internally using `useCallback`, allowing parents to pass stable function references.

## 2023-11-20 - Prevent Layout Thrashing in Scroll Listeners (O(N²) -> O(N))
**Learning:** Checking layout bounds inside loops on elements that may trigger synchronous style recalculations causes layout thrashing, which is especially destructive inside unbounded high-frequency scroll event listeners. The multiple carousels all were doing O(N²) layout reads.
**Action:** Extract parent element bounds calculations OUTSIDE of loops, and throttle/debounce expensive visibility checks attached to scrolling.

## 2024-05-18 - Prevent O(N) Re-renders with Global Objects
**Learning:** When passing large global objects (like `watched` state) to many memoized child components, updates to that object will cause all children to re-render. A custom equality function can check if the specific slice of data relevant to the component has changed. However, to avoid stale closures, you MUST perform shallow comparisons of all other props by iterating over them (e.g., using `Object.keys`) rather than explicit checks of a hardcoded subset.
**Action:** Implement custom `areEqual` functions in `React.memo` for components receiving large global state, ensuring all props are dynamically shallow-compared.
