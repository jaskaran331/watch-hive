## 2025-10-24 - Memoize MediaCard items
**Learning:** Passing an inline function like `onClick={() => onSelect(item)}` to a memoized component (`MediaCard`) within a map loop completely breaks memoization, causing every card to re-render when the parent state changes.
**Action:** Refactor child components to handle argument passing internally using `useCallback`, allowing parents to pass stable function references.

## 2023-11-20 - Prevent Layout Thrashing in Scroll Listeners (O(N²) -> O(N))
**Learning:** Checking layout bounds inside loops on elements that may trigger synchronous style recalculations causes layout thrashing, which is especially destructive inside unbounded high-frequency scroll event listeners. The multiple carousels all were doing O(N²) layout reads.
**Action:** Extract parent element bounds calculations OUTSIDE of loops, and throttle/debounce expensive visibility checks attached to scrolling.

## 2023-11-20 - Prevent O(N) Re-Renders with Global State Props
**Learning:** Passing a large, global map (like a user's entire `watched` history) as a prop to a memoized list item component (`MediaCard`) will break memoization whenever ANY item in that global map changes, causing an O(N) re-render of every card on screen. Standard shallow compare sees the new dictionary reference and fails.
**Action:** When implementing custom equality functions for `React.memo` (e.g. to prevent O(N) re-renders for large global objects), explicitly extract and compare only the specific properties the component cares about from the global object, and ensure you perform shallow comparisons of all other props by iterating over them (e.g., using `Object.keys`) rather than explicit checks of a hardcoded subset to prevent bugs with stale closures.
