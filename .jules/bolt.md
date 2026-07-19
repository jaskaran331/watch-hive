## 2025-10-24 - Memoize MediaCard items
**Learning:** Passing an inline function like `onClick={() => onSelect(item)}` to a memoized component (`MediaCard`) within a map loop completely breaks memoization, causing every card to re-render when the parent state changes.
**Action:** Refactor child components to handle argument passing internally using `useCallback`, allowing parents to pass stable function references.

## 2023-11-20 - Prevent Layout Thrashing in Scroll Listeners (O(N²) -> O(N))
**Learning:** Checking layout bounds inside loops on elements that may trigger synchronous style recalculations causes layout thrashing, which is especially destructive inside unbounded high-frequency scroll event listeners. The multiple carousels all were doing O(N²) layout reads.
**Action:** Extract parent element bounds calculations OUTSIDE of loops, and throttle/debounce expensive visibility checks attached to scrolling.

## 2026-07-19 - Prevent O(N) re-renders in MediaCard with React.memo custom equality
**Learning:** Passing global objects (like `watched`) into mapped components causes O(N) re-renders every time the global object is updated, even when a specific item's state hasn't changed. `React.memo`'s default shallow equality fails because the object reference changes.
**Action:** Use a custom `arePropsEqual` function in `React.memo` to selectively extract and compare only the specific data for the current item from global objects, while explicitly iterating over and performing a shallow comparison for all other props to prevent stale closure bugs.
